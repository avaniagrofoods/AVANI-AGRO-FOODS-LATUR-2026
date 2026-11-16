// ============================================================
// AVANI AGRO FOODS — Central Authentication, Session & Rate Limit Security
// Package 3F.106 Security Remediation (CC-01, CC-02, CC-03, CC-04, CC-07, CC-08)
// ============================================================

import crypto from 'crypto';

// ── CONSTANTS & DEFAULTS ────────────────────────────────────────
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_SECONDS = 15 * 60; // 900 seconds (15 minutes)
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const GATE_SESSION_COOKIE = 'avani_gate_session';
export const AFFILIATE_SESSION_COOKIE = 'avani_affiliate_session';
export const GATE_CSRF_COOKIE_NAME = 'avani_csrf_token';
export const AFFILIATE_CSRF_COOKIE_NAME = 'avani_affiliate_csrf_token';
export const CSRF_COOKIE_NAME = 'avani_csrf_token'; // Default alias

export function getCsrfCookieNameForRole(role = 'gate') {
  return role === 'affiliate' ? AFFILIATE_CSRF_COOKIE_NAME : GATE_CSRF_COOKIE_NAME;
}

// ── LOCAL IN-MEMORY STORES (Strictly non-production / isolated test only) ──
const localAttempts = new Map();
const localSessionStore = new Map();
const revokedSessions = new Set();

// ── RUNTIME & DISTRIBUTED KV DETECTION ──────────────────────────
export function getKvCredentials() {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  return {
    url: url || null,
    token: token || null,
    configured: Boolean(url && token)
  };
}

export function isDistributedKVConfigured() {
  return getKvCredentials().configured;
}

// Legacy static export kept for compatibility; callers should use isDistributedKVConfigured()
export const hasDistributedKV = Boolean(
  (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
  (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
);

export function isProductionOrVercelRuntime() {
  if (process.env.SEQUENCE_TEST_ISOLATION === '1' && process.env.FORCE_PRODUCTION_RUNTIME !== '1') {
    return false;
  }
  const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
  const vercelFlag = String(process.env.VERCEL || '').trim().toLowerCase();
  const vercelEnv = String(process.env.VERCEL_ENV || '').trim().toLowerCase();
  return (
    nodeEnv === 'production' ||
    vercelFlag === '1' ||
    vercelFlag === 'true' ||
    vercelEnv === 'production' ||
    vercelEnv === 'preview'
  );
}

export function isDistributedKvRequired() {
  const reqKv = String(process.env.REQUIRE_DISTRIBUTED_KV || '').trim().toLowerCase();
  const legacyKv = String(process.env.KV_REQUIRED || '').trim().toLowerCase();
  const strictKv = String(process.env.STRICT_KV_ENFORCEMENT || '').trim().toLowerCase();
  if (reqKv === '1' || reqKv === 'true' || legacyKv === '1' || legacyKv === 'true' || strictKv === '1' || strictKv === 'true') {
    return true;
  }
  return isProductionOrVercelRuntime();
}

/**
 * Executes a Redis command against Upstash KV REST API with strict error propagation.
 * Distinguishes between a genuine null result (key miss) and backend/network/protocol errors.
 */
export async function execKVCommandStrict(command, ...args) {
  const { url: kvUrl, token: kvToken, configured } = getKvCredentials();
  if (!configured) {
    const err = new Error('Distributed KV credentials are not configured.');
    err.code = 'KV_UNCONFIGURED';
    throw err;
  }

  const cmdArray = Array.isArray(command) ? command : [command, ...args];
  let res;
  try {
    res = await fetch(kvUrl.replace(/\/$/, ''), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cmdArray)
    });
  } catch (networkErr) {
    const err = new Error(`Distributed KV network failure: ${networkErr.message}`);
    err.code = 'KV_NETWORK_ERROR';
    throw err;
  }

  if (!res || !res.ok) {
    const err = new Error(`Distributed KV HTTP error: ${res ? res.status : 'NO_RESPONSE'}`);
    err.code = 'KV_HTTP_ERROR';
    err.status = res ? res.status : 503;
    throw err;
  }

  let data;
  try {
    data = await res.json();
  } catch (parseErr) {
    const err = new Error(`Distributed KV invalid JSON response: ${parseErr.message}`);
    err.code = 'KV_PARSE_ERROR';
    throw err;
  }

  if (!data || typeof data !== 'object' || ('error' in data && data.error)) {
    const err = new Error(`Distributed KV command error: ${data?.error || 'Malformed KV response'}`);
    err.code = 'KV_COMMAND_ERROR';
    throw err;
  }

  return data.result;
}

/**
 * Legacy wrapper around execKVCommandStrict that returns null on failure.
 * Security-critical paths MUST use execKVCommandStrict directly so outages fail closed.
 */
export async function execKVCommand(command, ...args) {
  try {
    return await execKVCommandStrict(command, ...args);
  } catch {
    return null;
  }
}

// ── CC-02: CANONICAL MASTER CREDENTIAL PRECEDENCE ───────────────
/**
 * Resolves the single canonical master gate credential (MASTER_GATE_PASSWORD).
 * - Conflicting canonical (MASTER_GATE_PASSWORD) and legacy (PRIVATE_PORTAL_PASSWORD) values fail closed.
 * - Legacy-only configuration (PRIVATE_PORTAL_PASSWORD without MASTER_GATE_PASSWORD) fails closed.
 * - Missing/empty canonical credential fails closed.
 * - Never logs or exposes credential values.
 */
export function resolveMasterGatePassword() {
  const rawCanonical = process.env.MASTER_GATE_PASSWORD;
  const rawLegacy = process.env.PRIVATE_PORTAL_PASSWORD;

  const hasCanonical = typeof rawCanonical === 'string' && rawCanonical.trim().length > 0;
  const hasLegacy = typeof rawLegacy === 'string' && rawLegacy.trim().length > 0;

  if (hasCanonical && hasLegacy) {
    const canonicalTrimmed = rawCanonical.trim();
    const legacyTrimmed = rawLegacy.trim();
    if (!verifyPassword(canonicalTrimmed, legacyTrimmed)) {
      return {
        valid: false,
        ok: false,
        statusCode: 503,
        code: 'CREDENTIAL_CONFLICT',
        error: 'Server configuration error: Conflicting master credential definitions detected. Failing closed.'
      };
    }
  }

  if (!hasCanonical && hasLegacy) {
    return {
      valid: false,
      ok: false,
      statusCode: 503,
      code: 'LEGACY_CREDENTIAL_ONLY_FORBIDDEN',
      error: 'Server configuration error: Legacy credential variable is not accepted without canonical MASTER_GATE_PASSWORD.'
    };
  }

  if (!hasCanonical) {
    return {
      valid: false,
      ok: false,
      statusCode: 503,
      code: 'MASTER_CREDENTIAL_MISSING',
      error: 'Server configuration error: Canonical MASTER_GATE_PASSWORD is not configured.'
    };
  }

  return {
    valid: true,
    ok: true,
    statusCode: 200,
    password: rawCanonical.trim(),
    source: 'MASTER_GATE_PASSWORD'
  };
}

// ── CC-08: TRUSTED CLIENT IP & ATOMIC DISTRIBUTED RATE LIMITING ──
function sanitizeIpCandidate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 64) return null;
  if (/[\r\n\s\0]/.test(trimmed)) return null;
  if (!/^[a-fA-F0-9:.,]+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Extracts client IP respecting the trusted proxy boundary.
 * - On Vercel runtime, uses the platform-verified `x-vercel-forwarded-for` header.
 * - Only when TRUST_PROXY=1 is explicitly set, uses the rightmost (proxy-appended) IP from `x-forwarded-for`.
 * - Never trusts arbitrary client-prepended `x-forwarded-for[0]` or `x-real-ip` from untrusted callers.
 */
export function getClientIp(req) {
  const headers = req?.headers || {};
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

  if (isVercel) {
    const vercelForwarded = headers['x-vercel-forwarded-for'];
    if (typeof vercelForwarded === 'string' && vercelForwarded.trim()) {
      const parts = vercelForwarded.split(',').map(p => p.trim()).filter(Boolean);
      const candidate = sanitizeIpCandidate(parts[parts.length - 1]);
      if (candidate) return candidate;
    }
  }

  if (String(process.env.TRUST_PROXY || '').trim() === '1') {
    const xff = headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
      const parts = xff.split(',').map(p => p.trim()).filter(Boolean);
      const candidate = sanitizeIpCandidate(parts[parts.length - 1]);
      if (candidate) return candidate;
    }
  }

  const socketIp = sanitizeIpCandidate(req?.socket?.remoteAddress || req?.connection?.remoteAddress);
  return socketIp || '127.0.0.1';
}

const ATOMIC_RATE_LIMIT_LUA = `
local current = redis.call("INCR", KEYS[1])
if type(current) ~= "number" or current < 1 then
  return {-1, -1}
end
local ttl = redis.call("TTL", KEYS[1])
if type(ttl) ~= "number" or ttl < 0 then
  redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
  ttl = tonumber(ARGV[1])
end
return {current, ttl}
`;

/**
 * Distributed rate limiter with atomic increment+TTL, corrupt state handling,
 * and fail-closed 503 behavior when distributed KV is required but unavailable.
 */
export async function checkRateLimit(ip, prefix = 'auth', options = {}) {
  const maxAttempts = Number.isInteger(options.maxAttempts) && options.maxAttempts > 0
    ? options.maxAttempts
    : DEFAULT_MAX_ATTEMPTS;
  const windowSeconds = Number.isInteger(options.windowSeconds) && options.windowSeconds > 0
    ? options.windowSeconds
    : DEFAULT_WINDOW_SECONDS;
  const windowMs = windowSeconds * 1000;

  const cleanIp = sanitizeIpCandidate(ip) || '127.0.0.1';
  const cleanPrefix = String(prefix || 'auth').replace(/[^a-zA-Z0-9:_-]/g, '_');
  const key = `ratelimit:${cleanPrefix}:${cleanIp}`;

  if (isDistributedKVConfigured()) {
    try {
      const evalResult = await execKVCommandStrict(
        'EVAL',
        ATOMIC_RATE_LIMIT_LUA,
        '1',
        key,
        String(windowSeconds)
      );

      let current = NaN;
      let ttl = NaN;

      if (Array.isArray(evalResult) && evalResult.length >= 2) {
        current = Number(evalResult[0]);
        ttl = Number(evalResult[1]);
      }

      if (!Number.isInteger(current) || current < 1 || !Number.isFinite(ttl) || ttl < 1) {
        // Corrupt counter state detected in KV; attempt atomic reset and fail closed for this request
        try {
          await execKVCommandStrict('DEL', key);
        } catch {
          // Ignore secondary cleanup failure
        }
        return {
          limited: true,
          backendUnavailable: true,
          corruptState: true,
          statusCode: 503,
          code: 'RATE_LIMIT_CORRUPT_STATE',
          minutesLeft: Math.ceil(windowSeconds / 60),
          isDistributed: true,
          error: 'Rate limit state verification failed due to corrupt counter state. Failing closed.'
        };
      }

      if (current > maxAttempts) {
        const minutesLeft = Math.max(1, Math.ceil(ttl / 60));
        return {
          limited: true,
          backendUnavailable: false,
          statusCode: 429,
          code: 'RATE_LIMIT_EXCEEDED',
          minutesLeft,
          retryAfterSeconds: ttl,
          remaining: 0,
          isDistributed: true
        };
      }

      return {
        limited: false,
        backendUnavailable: false,
        statusCode: 200,
        remaining: Math.max(0, maxAttempts - current),
        isDistributed: true
      };
    } catch (kvErr) {
      // Never fall back to per-instance memory when KV is configured or required
      return {
        limited: true,
        backendUnavailable: true,
        statusCode: 503,
        code: 'RATE_LIMIT_BACKEND_UNAVAILABLE',
        minutesLeft: Math.ceil(windowSeconds / 60),
        isDistributed: true,
        error: 'Rate limiting service is temporarily unavailable. Failing closed.'
      };
    }
  }

  // If distributed KV is not configured, check whether production/strict mode requires it
  if (isDistributedKvRequired()) {
    return {
      limited: true,
      backendUnavailable: true,
      statusCode: 503,
      code: 'RATE_LIMIT_BACKEND_UNAVAILABLE',
      minutesLeft: Math.ceil(windowSeconds / 60),
      isDistributed: false,
      error: 'Distributed rate limiting backend (KV) is required in production but not configured.'
    };
  }

  // Local development / isolated test in-memory rate limiter with corrupt-state validation
  const now = Date.now();
  const localKey = `${cleanPrefix}:${cleanIp}`;
  if (localAttempts.has(localKey)) {
    const existing = localAttempts.get(localKey);
    if (
      !existing ||
      typeof existing !== 'object' ||
      !Number.isInteger(existing.count) ||
      existing.count < 0 ||
      !Number.isFinite(existing.resetAt) ||
      existing.resetAt <= 0
    ) {
      localAttempts.delete(localKey);
      return {
        limited: true,
        backendUnavailable: true,
        corruptState: true,
        statusCode: 503,
        code: 'RATE_LIMIT_CORRUPT_STATE',
        minutesLeft: Math.ceil(windowSeconds / 60),
        isDistributed: false,
        error: 'Corrupt rate limit counter state detected. Failing closed.'
      };
    }

    if (now > existing.resetAt) {
      localAttempts.set(localKey, { count: 1, resetAt: now + windowMs });
      return {
        limited: false,
        backendUnavailable: false,
        statusCode: 200,
        remaining: Math.max(0, maxAttempts - 1),
        isDistributed: false
      };
    }

    const nextCount = existing.count + 1;
    localAttempts.set(localKey, { count: nextCount, resetAt: existing.resetAt });

    if (nextCount > maxAttempts) {
      const minutesLeft = Math.max(1, Math.ceil((existing.resetAt - now) / 60000));
      return {
        limited: true,
        backendUnavailable: false,
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        minutesLeft,
        remaining: 0,
        isDistributed: false
      };
    }

    return {
      limited: false,
      backendUnavailable: false,
      statusCode: 200,
      remaining: Math.max(0, maxAttempts - nextCount),
      isDistributed: false
    };
  }

  localAttempts.set(localKey, { count: 1, resetAt: now + windowMs });
  return {
    limited: false,
    backendUnavailable: false,
    statusCode: 200,
    remaining: Math.max(0, maxAttempts - 1),
    isDistributed: false
  };
}

export async function resetRateLimit(ip, prefix = 'auth') {
  const cleanIp = sanitizeIpCandidate(ip) || '127.0.0.1';
  const cleanPrefix = String(prefix || 'auth').replace(/[^a-zA-Z0-9:_-]/g, '_');
  if (isDistributedKVConfigured()) {
    await execKVCommand('DEL', `ratelimit:${cleanPrefix}:${cleanIp}`);
  }
  localAttempts.delete(`${cleanPrefix}:${cleanIp}`);
}

// ── SESSION MANAGEMENT, REVOCATION & CRYPTOGRAPHY (CC-01, CC-03, CC-07) ──
export function getSessionSecret() {
  const primary = typeof process.env.SESSION_SECRET === 'string' ? process.env.SESSION_SECRET.trim() : '';
  const alias = typeof process.env.SESSION_SIGNING_SECRET === 'string' ? process.env.SESSION_SIGNING_SECRET.trim() : '';

  if (primary && alias && !verifyPassword(primary, alias)) {
    return null;
  }
  return primary || alias || null;
}

export function signSessionId(sessionId, secret) {
  if (!secret || typeof secret !== 'string') {
    throw new Error('Session signing secret is not configured.');
  }
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(sessionId);
  const sig = hmac.digest('base64url');
  return `${sessionId}.${sig}`;
}

export function parseAndVerifySignature(signedCookie, secret) {
  if (!signedCookie || typeof signedCookie !== 'string' || !secret || typeof secret !== 'string') return null;
  const lastDot = signedCookie.lastIndexOf('.');
  if (lastDot <= 0) return null;

  const sessionId = signedCookie.slice(0, lastDot);
  const signature = signedCookie.slice(lastDot + 1);
  if (!sessionId || !signature) return null;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(sessionId);
  const expectedSig = hmac.digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  return sessionId;
}

export function verifyPassword(inputPassword, expectedPassword) {
  if (!inputPassword || !expectedPassword || typeof inputPassword !== 'string' || typeof expectedPassword !== 'string') {
    return false;
  }
  const inputBuf = Buffer.from(inputPassword);
  const expectedBuf = Buffer.from(expectedPassword);
  if (inputBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(inputBuf, expectedBuf);
}

export function generateCsrfToken(sessionId, secret = getSessionSecret(), role = 'gate') {
  if (!sessionId || typeof sessionId !== 'string' || !secret || typeof secret !== 'string') {
    throw new Error('Cannot generate CSRF token without valid sessionId and secret.');
  }
  const normRole = role === 'affiliate' ? 'affiliate' : 'gate';
  return crypto.createHmac('sha256', secret).update(`csrf:${normRole}:${sessionId}`).digest('hex');
}

function getCookieNameForRole(role) {
  return role === 'affiliate' ? AFFILIATE_SESSION_COOKIE : GATE_SESSION_COOKIE;
}

/**
 * Creates a signed server-side session record in distributed KV (or local store in isolated dev/test),
 * generates a session-bound CSRF token, and returns Set-Cookie headers.
 * Fails closed with 503 if KV persistence fails or is unavailable when required.
 */
export async function createServerSession(role = 'gate', metadata = {}) {
  const normalizedRole = role === 'affiliate' ? 'affiliate' : 'gate';
  const secret = getSessionSecret();
  if (!secret) {
    return {
      ok: false,
      statusCode: 503,
      code: 'SESSION_SECRET_MISSING',
      error: 'Session service is not configured on the server.'
    };
  }

  const sessionId = crypto.randomBytes(32).toString('hex');
  const nowMs = Date.now();
  const ttlSeconds = Number.isInteger(metadata.ttlSeconds) && metadata.ttlSeconds > 0
    ? metadata.ttlSeconds
    : SESSION_TTL_SECONDS;
  const expiresAtMs = nowMs + ttlSeconds * 1000;
  const actorRole = normalizedRole === 'affiliate' ? 'affiliate_partner' : 'gate_operator';
  const actorId = `${actorRole}:session_${sessionId.slice(0, 12)}`;

  const record = {
    active: true,
    revoked: false,
    sessionId,
    role: normalizedRole,
    actor: actorId,
    actorRole,
    createdAt: new Date(nowMs).toISOString(),
    issuedAtMs: nowMs,
    expiresAtMs
  };

  const kvKey = `session:${normalizedRole}:${sessionId}`;

  if (isDistributedKVConfigured()) {
    try {
      const setRes = await execKVCommandStrict(
        'SET',
        kvKey,
        JSON.stringify(record),
        'EX',
        String(ttlSeconds)
      );
      if (setRes !== 'OK') {
        return {
          ok: false,
          statusCode: 503,
          code: 'SESSION_BACKEND_UNAVAILABLE',
          error: 'Failed to persist session in distributed store.'
        };
      }
    } catch {
      return {
        ok: false,
        statusCode: 503,
        code: 'SESSION_BACKEND_UNAVAILABLE',
        error: 'Session persistence backend is unavailable. Failing closed.'
      };
    }
  } else if (isDistributedKvRequired()) {
    return {
      ok: false,
      statusCode: 503,
      code: 'SESSION_BACKEND_UNAVAILABLE',
      error: 'Distributed session backend (KV) is required in production but not configured.'
    };
  } else {
    localSessionStore.set(`${normalizedRole}:${sessionId}`, record);
    revokedSessions.delete(`${normalizedRole}:${sessionId}`);
  }

  const signedValue = signSessionId(sessionId, secret);
  const csrfToken = generateCsrfToken(sessionId, secret, normalizedRole);
  const cookieName = getCookieNameForRole(normalizedRole);

  return {
    ok: true,
    authenticated: true,
    statusCode: 200,
    sessionId,
    token: signedValue,
    role: normalizedRole,
    actor: actorId,
    actorRole,
    csrfToken,
    issuedAtMs: nowMs,
    expiresAtMs,
    cookies: [
      createSessionCookie(cookieName, signedValue, ttlSeconds),
      createCsrfCookie(csrfToken, ttlSeconds, normalizedRole)
    ]
  };
}

/**
 * Verifies a request's session cookie signature, expiry, active server-side session record, and revocation state.
 * - Rejects missing, malformed, expired, revoked, or unverifiable sessions with 401.
 * - Fails closed with 503 if KV lookup fails or KV is unconfigured when required (never falls back to signature-only).
 */
export async function verifyServerSession(req, role = 'gate') {
  const normalizedRole = role === 'affiliate' ? 'affiliate' : 'gate';
  const secret = getSessionSecret();
  if (!secret) {
    return {
      authenticated: false,
      statusCode: 503,
      code: 'SESSION_SECRET_MISSING',
      error: 'Session verification service is not configured.'
    };
  }

  const cookies = parseCookies(req);
  const cookieName = getCookieNameForRole(normalizedRole);
  const signedCookie = cookies[cookieName];

  if (!signedCookie || typeof signedCookie !== 'string') {
    return {
      authenticated: false,
      statusCode: 401,
      code: 'SESSION_MISSING',
      error: 'Unauthorized: Valid session cookie is required.'
    };
  }

  const sessionId = parseAndVerifySignature(signedCookie, secret);
  if (!sessionId || !/^[a-f0-9]{32,128}$/i.test(sessionId)) {
    return {
      authenticated: false,
      statusCode: 401,
      code: 'SESSION_INVALID_SIGNATURE',
      error: 'Unauthorized: Invalid or tampered session signature.'
    };
  }

  const kvKey = `session:${normalizedRole}:${sessionId}`;
  let record = null;

  if (isDistributedKVConfigured()) {
    let rawResult;
    try {
      rawResult = await execKVCommandStrict('GET', kvKey);
    } catch {
      return {
        authenticated: false,
        backendUnavailable: true,
        statusCode: 503,
        code: 'SESSION_BACKEND_UNAVAILABLE',
        error: 'Session verification service is temporarily unavailable. Failing closed.'
      };
    }

    if (rawResult === null || rawResult === undefined || rawResult === '') {
      return {
        authenticated: false,
        statusCode: 401,
        code: 'SESSION_REVOKED_OR_EXPIRED',
        error: 'Unauthorized: Session has expired or been revoked.'
      };
    }

    try {
      record = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
    } catch {
      return {
        authenticated: false,
        statusCode: 401,
        code: 'SESSION_MALFORMED_RECORD',
        error: 'Unauthorized: Malformed server-side session record.'
      };
    }
  } else if (isDistributedKvRequired()) {
    return {
      authenticated: false,
      backendUnavailable: true,
      statusCode: 503,
      code: 'SESSION_BACKEND_UNAVAILABLE',
      error: 'Distributed session backend (KV) is required in production but not configured.'
    };
  } else {
    const localKey = `${normalizedRole}:${sessionId}`;
    if (revokedSessions.has(localKey)) {
      return {
        authenticated: false,
        statusCode: 401,
        code: 'SESSION_REVOKED',
        error: 'Unauthorized: Session has been revoked.'
      };
    }
    const rawLocal = localSessionStore.get(localKey);
    if (rawLocal === null || rawLocal === undefined) {
      return {
        authenticated: false,
        statusCode: 401,
        code: 'SESSION_REVOKED_OR_EXPIRED',
        error: 'Unauthorized: Active session record not found.'
      };
    }
    if (typeof rawLocal === 'string') {
      try {
        record = JSON.parse(rawLocal);
      } catch {
        return {
          authenticated: false,
          statusCode: 401,
          code: 'SESSION_MALFORMED_RECORD',
          error: 'Unauthorized: Malformed local session record.'
        };
      }
    } else {
      record = rawLocal;
    }
  }

  if (
    !record ||
    typeof record !== 'object' ||
    Array.isArray(record) ||
    record.active !== true ||
    record.revoked === true ||
    (record.sessionId && record.sessionId !== sessionId) ||
    (record.role && record.role !== normalizedRole)
  ) {
    return {
      authenticated: false,
      statusCode: 401,
      code: 'SESSION_INVALID_RECORD',
      error: 'Unauthorized: Invalid or inactive session record.'
    };
  }

  let expiresAtMs = Number(record.expiresAtMs);
  if (!Number.isFinite(expiresAtMs) && record.createdAt) {
    const createdMs = Date.parse(record.createdAt);
    if (Number.isFinite(createdMs)) {
      expiresAtMs = createdMs + SESSION_TTL_SECONDS * 1000;
    }
  }

  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
    return {
      authenticated: false,
      statusCode: 401,
      code: 'SESSION_EXPIRED',
      error: 'Unauthorized: Session has expired.'
    };
  }

  const actorRole = normalizedRole === 'affiliate' ? 'affiliate_partner' : 'gate_operator';
  const actorId = (typeof record.actor === 'string' && record.actor.trim())
    ? record.actor.trim()
    : `${actorRole}:session_${sessionId.slice(0, 12)}`;
  const csrfToken = generateCsrfToken(sessionId, secret, normalizedRole);

  return {
    authenticated: true,
    statusCode: 200,
    sessionId,
    role: normalizedRole,
    actorRole,
    actor: actorId,
    csrfToken,
    issuedAtMs: Number(record.issuedAtMs) || Date.parse(record.createdAt) || Date.now(),
    expiresAtMs
  };
}

/**
 * Revokes an active server-side session in KV and local stores.
 * Fails closed with 503 if KV deletion fails when KV is configured or required.
 */
export async function revokeServerSession(req, role = 'gate') {
  const normalizedRole = role === 'affiliate' ? 'affiliate' : 'gate';
  const secret = getSessionSecret();
  const cookieName = getCookieNameForRole(normalizedRole);
  const clearCookies = [
    createClearCookie(cookieName),
    createClearCsrfCookie(normalizedRole)
  ];

  if (!secret) {
    return {
      revoked: false,
      statusCode: 503,
      code: 'SESSION_SECRET_MISSING',
      error: 'Session service is not configured.',
      cookies: clearCookies
    };
  }

  const cookies = parseCookies(req);
  const signedCookie = cookies[cookieName];
  if (!signedCookie) {
    return {
      revoked: true,
      statusCode: 200,
      cookies: clearCookies
    };
  }

  const sessionId = parseAndVerifySignature(signedCookie, secret);
  if (!sessionId) {
    return {
      revoked: true,
      statusCode: 200,
      cookies: clearCookies
    };
  }

  const localKey = `${normalizedRole}:${sessionId}`;
  revokedSessions.add(localKey);
  localSessionStore.delete(localKey);

  if (isDistributedKVConfigured()) {
    try {
      await execKVCommandStrict('DEL', `session:${normalizedRole}:${sessionId}`);
    } catch {
      return {
        revoked: false,
        backendUnavailable: true,
        statusCode: 503,
        code: 'SESSION_BACKEND_UNAVAILABLE',
        error: 'Session revocation failed because distributed session store is unavailable.',
        cookies: clearCookies
      };
    }
  } else if (isDistributedKvRequired()) {
    return {
      revoked: false,
      backendUnavailable: true,
      statusCode: 503,
      code: 'SESSION_BACKEND_UNAVAILABLE',
      error: 'Distributed session backend (KV) is required in production for session revocation.',
      cookies: clearCookies
    };
  }

  return {
    revoked: true,
    statusCode: 200,
    sessionId,
    cookies: clearCookies
  };
}

// ── COOKIE PARSING & SERIALIZATION ──────────────────────────────
export function parseCookies(req) {
  const cookieHeader = req?.headers?.cookie || req?.headers?.Cookie || '';
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      if (!k) return ['', ''];
      try {
        return [k.trim(), decodeURIComponent(v.join('='))];
      } catch {
        return [k.trim(), v.join('=')];
      }
    }).filter(([k]) => Boolean(k))
  );
}

export function createSessionCookie(name, signedValue, maxAgeSeconds = SESSION_TTL_SECONDS) {
  return `${name}=${encodeURIComponent(signedValue)}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}; Path=/`;
}

export function createCsrfCookie(csrfToken, maxAgeSeconds = SESSION_TTL_SECONDS, role = 'gate') {
  const cookieName = getCsrfCookieNameForRole(role);
  return `${cookieName}=${encodeURIComponent(csrfToken)}; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}; Path=/`;
}

export function createClearCookie(name) {
  return `${name}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`;
}

export function createClearCsrfCookie(role = 'gate') {
  const cookieName = getCsrfCookieNameForRole(role);
  return `${cookieName}=; Secure; SameSite=Strict; Max-Age=0; Path=/`;
}

// ── CC-04: EXACT CONFIGURED ORIGIN & CSRF PROTECTION ────────────
const CANONICAL_PRODUCTION_ORIGINS = [
  'https://www.avaniagrofoods.com',
  'https://avaniagrofoods.com'
];

const LOCAL_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173'
];

export function getAllowedOriginsSet() {
  const allowed = new Set(CANONICAL_PRODUCTION_ORIGINS);

  if (!isProductionOrVercelRuntime()) {
    for (const devOrigin of LOCAL_DEV_ORIGINS) {
      allowed.add(devOrigin);
    }
  }

  const rawConfigured = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || '';
  if (typeof rawConfigured === 'string' && rawConfigured.trim()) {
    for (const entry of rawConfigured.split(',')) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      try {
        const parsed = new URL(trimmed);
        if (
          (parsed.protocol === 'https:' || (!isProductionOrVercelRuntime() && parsed.protocol === 'http:')) &&
          parsed.origin === trimmed
        ) {
          allowed.add(parsed.origin);
        }
      } catch {
        // Ignore malformed configured origin entry
      }
    }
  }

  return allowed;
}

export function isExactAllowedOrigin(rawOrigin) {
  if (!rawOrigin || typeof rawOrigin !== 'string') return false;
  const trimmed = rawOrigin.trim();
  if (!trimmed || trimmed === 'null') return false;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  // Reject origins containing paths, queries, hashes, or userinfo
  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search !== '' ||
    parsed.hash !== '' ||
    parsed.origin !== trimmed
  ) {
    return false;
  }

  return getAllowedOriginsSet().has(parsed.origin);
}

function isExactAllowedReferer(rawReferer) {
  if (!rawReferer || typeof rawReferer !== 'string') return false;
  const trimmed = rawReferer.trim();
  if (!trimmed) return false;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.username || parsed.password) return false;
  return getAllowedOriginsSet().has(parsed.origin);
}

/**
 * Validates Origin/Referer against the exact configured allowlist.
 * Never uses substring (.includes) or wildcard suffix (.endsWith) matching.
 */
export function isAllowedOrigin(req, options = {}) {
  const headers = req?.headers || {};
  const origin = headers.origin !== undefined ? headers.origin : headers.Origin;
  const referer = headers.referer !== undefined ? headers.referer : headers.Referer;

  if (origin !== undefined && origin !== '') {
    return isExactAllowedOrigin(String(origin));
  }

  if (referer !== undefined && referer !== '') {
    return isExactAllowedReferer(String(referer));
  }

  return options.requireOriginHeader ? false : true;
}

/**
 * Strict Origin/Referer validation for cookie-authenticated state-changing requests.
 * Rejects missing Origin/Referer and cross-origin requests.
 */
export function validateMutationOrigin(req) {
  const headers = req?.headers || {};
  const origin = headers.origin !== undefined ? headers.origin : headers.Origin;
  const referer = headers.referer !== undefined ? headers.referer : headers.Referer;

  if (origin !== undefined && String(origin).trim() !== '') {
    if (!isExactAllowedOrigin(String(origin))) {
      return {
        valid: false,
        statusCode: 403,
        code: 'ORIGIN_FORBIDDEN',
        error: 'Forbidden: Cross-origin state-changing request rejected.'
      };
    }
    return { valid: true, statusCode: 200, origin: String(origin).trim() };
  }

  if (referer !== undefined && String(referer).trim() !== '') {
    if (!isExactAllowedReferer(String(referer))) {
      return {
        valid: false,
        statusCode: 403,
        code: 'ORIGIN_FORBIDDEN',
        error: 'Forbidden: Untrusted Referer origin on state-changing request.'
      };
    }
    return { valid: true, statusCode: 200, origin: new URL(String(referer).trim()).origin };
  }

  return {
    valid: false,
    statusCode: 403,
    code: 'ORIGIN_MISSING',
    error: 'Forbidden: Missing Origin or Referer header on state-changing request.'
  };
}

/**
 * Verifies both exact Origin/Referer and session-bound HMAC CSRF token on cookie-authenticated mutations.
 */
export function verifyCsrfRequest(req, session) {
  const originCheck = validateMutationOrigin(req);
  if (!originCheck.valid) {
    return originCheck;
  }

  if (!session || (!session.authenticated && !session.ok) || !session.sessionId) {
    return {
      valid: false,
      statusCode: 401,
      code: 'SESSION_REQUIRED',
      error: 'Unauthorized: Active session required before CSRF verification.'
    };
  }

  const secret = getSessionSecret();
  if (!secret) {
    return {
      valid: false,
      statusCode: 503,
      code: 'SESSION_SECRET_MISSING',
      error: 'Session verification service is not configured.'
    };
  }

  const headers = req?.headers || {};
  const headerToken = headers['x-csrf-token'] || headers['X-CSRF-Token'] || headers['x-xsrf-token'];
  const bodyToken = req?.body && typeof req.body === 'object' ? req.body.csrfToken : undefined;
  const providedToken = typeof headerToken === 'string' && headerToken.trim()
    ? headerToken.trim()
    : (typeof bodyToken === 'string' && bodyToken.trim() ? bodyToken.trim() : '');

  if (!providedToken) {
    return {
      valid: false,
      statusCode: 403,
      code: 'CSRF_TOKEN_MISSING',
      error: 'Forbidden: Missing CSRF token on state-changing request.'
    };
  }

  const expectedToken = session.csrfToken || generateCsrfToken(session.sessionId, secret, session.role || 'gate');
  if (!verifyPassword(providedToken, expectedToken)) {
    return {
      valid: false,
      statusCode: 403,
      code: 'CSRF_TOKEN_INVALID',
      error: 'Forbidden: Invalid CSRF token.'
    };
  }

  return {
    valid: true,
    statusCode: 200
  };
}

// ── TEST ISOLATION HELPERS ──────────────────────────────────────
export function _testResetAuthState() {
  localAttempts.clear();
  localSessionStore.clear();
  revokedSessions.clear();
}

export function _testSetLocalRateLimitEntry(key, value) {
  localAttempts.set(key, value);
}

export function _testSetLocalSessionRecord(role, sessionId, record) {
  localSessionStore.set(`${role}:${sessionId}`, record);
}

// ── CC-06: DOCUMENTED RESEND / SVIX RAW-BODY WEBHOOK SIGNATURE VERIFICATION ──
export function verifySvixSignature(rawBody, headers = {}, secret = '') {
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    return { valid: false, reason: 'Webhook secret not configured' };
  }
  if (rawBody === undefined || rawBody === null || (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody))) {
    return { valid: false, reason: 'Raw webhook body required for cryptographic signature verification' };
  }

  const svixId = headers['svix-id'] || headers['webhook-id'];
  const svixTimestamp = headers['svix-timestamp'] || headers['webhook-timestamp'];
  const svixSignature = headers['svix-signature'] || headers['webhook-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { valid: false, reason: 'Missing Svix/Resend signature headers (svix-id, svix-timestamp, svix-signature)' };
  }

  const tsNum = parseInt(String(svixTimestamp), 10);
  if (Number.isNaN(tsNum)) {
    return { valid: false, reason: 'Invalid webhook timestamp format' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsNum) > 300) {
    return { valid: false, reason: 'Webhook timestamp outside 5-minute replay tolerance window' };
  }

  const cleanSecret = secret.trim();
  const base64Secret = cleanSecret.startsWith('whsec_') ? cleanSecret.slice(6) : cleanSecret;
  const secretBytes = Buffer.from(base64Secret, 'base64');

  const rawBodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const signedContent = `${svixId}.${svixTimestamp}.${rawBodyStr}`;
  const expectedSig = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent, 'utf8')
    .digest('base64');

  const signatures = String(svixSignature).split(' ');
  for (const sigEntry of signatures) {
    const [, sigValue] = sigEntry.split(',');
    const candidate = sigValue || sigEntry;
    if (candidate && verifyPassword(candidate, expectedSig)) {
      return { valid: true, svixId: String(svixId).trim(), timestamp: tsNum };
    }
  }

  return { valid: false, reason: 'Cryptographic HMAC signature mismatch' };
}

