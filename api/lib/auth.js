// ============================================================
// AVANI AGRO FOODS — Central Authentication & Session Cryptography
// Provides secure HMAC signing, constant-time comparisons,
// cookie handling, and distributed/in-memory rate limiting.
// ============================================================

import crypto from 'crypto';

// ── LOCAL RATE LIMIT STORE ──────────────────────────────────────
const localAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ── KV / REDIS REST CLIENT HELPERS ──────────────────────────────
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
export const hasDistributedKV = Boolean(kvUrl && kvToken);

export async function execKVCommand(command, ...args) {
  if (!hasDistributedKV) return null;
  try {
    const url = `${kvUrl.replace(/\/$/, '')}/${command}/${args.map(encodeURIComponent).join('/')}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error('KV Execution Error:', err.message);
    return null;
  }
}

// ── RATE LIMITING ───────────────────────────────────────────────
export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    '127.0.0.1'
  );
}

export async function checkRateLimit(ip, prefix = 'auth') {
  if (hasDistributedKV) {
    try {
      const key = `ratelimit:${prefix}:${ip}`;
      const current = await execKVCommand('INCR', key);
      if (current === 1) {
        await execKVCommand('EXPIRE', key, '900'); // 15 minutes
      }
      if (current > MAX_ATTEMPTS) {
        const ttl = (await execKVCommand('TTL', key)) || 900;
        const minutesLeft = Math.ceil(Number(ttl) / 60) || 15;
        return { limited: true, minutesLeft, isDistributed: true };
      }
      return { limited: false, remaining: Math.max(0, MAX_ATTEMPTS - Number(current)), isDistributed: true };
    } catch {
      // Fallback to in-memory
    }
  }

  const now = Date.now();
  const record = localAttempts.get(`${prefix}:${ip}`) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > record.resetAt) {
    localAttempts.set(`${prefix}:${ip}`, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, remaining: MAX_ATTEMPTS - 1, isDistributed: false };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((record.resetAt - now) / 60000);
    return { limited: true, minutesLeft, isDistributed: false };
  }

  localAttempts.set(`${prefix}:${ip}`, { ...record, count: record.count + 1 });
  return { limited: false, remaining: MAX_ATTEMPTS - record.count - 1, isDistributed: false };
}

export async function resetRateLimit(ip, prefix = 'auth') {
  if (hasDistributedKV) {
    await execKVCommand('DEL', `ratelimit:${prefix}:${ip}`);
  }
  localAttempts.delete(`${prefix}:${ip}`);
}

// ── SESSION MANAGEMENT & CRYPTOGRAPHY ───────────────────────────
export function getSessionSecret() {
  return process.env.SESSION_SECRET || 'AVANI_AGRO_SECURE_SESSION_SECRET_2026_PRODUCTION_STABLE';
}

export function signSessionId(sessionId, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(sessionId);
  const sig = hmac.digest('base64url');
  return `${sessionId}.${sig}`;
}

export function parseAndVerifySignature(signedCookie, secret) {
  if (!signedCookie || typeof signedCookie !== 'string') return null;
  const lastDot = signedCookie.lastIndexOf('.');
  if (lastDot === -1) return null;

  const sessionId = signedCookie.slice(0, lastDot);
  const signature = signedCookie.slice(lastDot + 1);

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

export function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), decodeURIComponent(v.join('='))];
    }).filter(([k]) => Boolean(k))
  );
}

export function createSessionCookie(name, signedValue, maxAgeSeconds = SESSION_TTL_SECONDS) {
  return `${name}=${encodeURIComponent(signedValue)}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}; Path=/`;
}

export function createClearCookie(name) {
  return `${name}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`;
}

export function isAllowedOrigin(req) {
  const origin = req.headers.origin || '';
  if (!origin) return true;
  return (
    origin.includes('avaniagrofoods.com') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.endsWith('.vercel.app')
  );
}
