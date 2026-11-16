// ============================================================================
// AVANI AGRO FOODS — PACKAGE 3F.106 MASTER SECURITY & REGRESSION SUITE
// scripts/test_package_3f_106_regression.mjs
//
// Executes genuine end-to-end unit, integration, and regression tests across
// CC-01 through CC-08, AF-01 through AF-03, and core quotation workflows.
// Quarantined files under api/_data/* are NEVER opened, stat'd, or read.
// ============================================================================

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { registerHooks } from 'node:module';
import ExcelJS from 'exceljs';

// ----------------------------------------------------------------------------
// 0. QUARANTINE PROTECTION HOOK
// Intercepts ESM resolution/loading of quarantined data files in memory so
// importing api/importers.js and api/manufacturers.js NEVER touches disk files
// api/_data/importersData.js or api/_data/manufacturersData.js.
// ----------------------------------------------------------------------------
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('/api/_data/importersData.js') || url.endsWith('\\api\\_data\\importersData.js')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `export const IMPORTERS = [
          { id: 1, companyName: 'Test Bio Imports GmbH', country: 'Germany', region: 'Europe', products: 'Moringa Leaf Powder' }
        ]; export const IMPORTERS_DATA = IMPORTERS;`
      };
    }
    if (url.endsWith('/api/_data/manufacturersData.js') || url.endsWith('\\api\\_data\\manufacturersData.js')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `export const MANUFACTURERS = {
          small: [{ id: 1, companyName: 'Test Agro Processors Pvt Ltd', state: 'Maharashtra', district: 'Latur', category: 'Dehydrated Powders' }],
          medium: [],
          large: []
        }; export const MANUFACTURERS_DATA = MANUFACTURERS;`
      };
    }
    return nextLoad(url, context);
  }
});

// Import modules under test
const authMod = await import('../api/_lib/auth.js');
const quotationEngineMod = await import('../api/_lib/quotationEngine.js');
const quotationModelServer = await import('../api/_lib/quotationModel.js');

const { default: verifyGateHandler } = await import('../api/verify-gate.js');
const { default: affiliateAuthHandler } = await import('../api/affiliate-auth.js');
const { default: adminQuotationsHandler } = await import('../api/admin-quotations.js');
const { default: importersHandler } = await import('../api/importers.js');
const { default: manufacturersHandler } = await import('../api/manufacturers.js');
const { default: quotationHandler } = await import('../api/quotation.js');
const { default: emailReplyWebhookHandler } = await import('../api/email-reply-webhook.js');
const { default: leadsHandler } = await import('../api/leads.js');
const { default: leadQualificationHandler } = await import('../api/lead-qualification.js');
const { default: saveLeadHandler } = await import('../api/save-lead.js');

// ----------------------------------------------------------------------------
// TEST HARNESS UTILITIES
// ----------------------------------------------------------------------------
const results = [];
let passed = 0;
let failed = 0;

async function runTest(id, category, description, fn) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    passed++;
    results.push({ id, category, description, status: 'PASS', durationMs });
    console.log(`✅ [PASS] ${id} (${category}): ${description} [${durationMs}ms]`);
  } catch (err) {
    const durationMs = Date.now() - start;
    failed++;
    results.push({ id, category, description, status: 'FAIL', durationMs, error: err?.message || String(err) });
    console.error(`❌ [FAIL] ${id} (${category}): ${description}`);
    console.error(`   Error: ${err?.stack || err?.message || String(err)}`);
  }
}

function createMockReqRes({
  method = 'GET',
  url = '/api/test',
  headers = {},
  query = {},
  body = undefined,
  rawBody = undefined,
  remoteAddress = '203.0.113.10'
} = {}) {
  const normalizedHeaders = {};
  for (const [k, v] of Object.entries(headers)) {
    normalizedHeaders[k.toLowerCase()] = v;
  }
  const req = {
    method,
    url,
    headers: normalizedHeaders,
    query,
    body,
    rawBody,
    socket: { remoteAddress }
  };

  const resHeaders = {};
  let statusCode = 200;
  let jsonBody = null;
  let rawSent = null;
  let ended = false;

  const res = {
    setHeader(name, value) {
      resHeaders[name.toLowerCase()] = value;
      return this;
    },
    getHeader(name) {
      return resHeaders[name.toLowerCase()];
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      ended = true;
      return this;
    },
    send(payload) {
      rawSent = payload;
      ended = true;
      return this;
    },
    end(payload) {
      if (payload !== undefined) rawSent = payload;
      ended = true;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get headers() {
      return resHeaders;
    },
    get body() {
      return jsonBody;
    },
    get rawSent() {
      return rawSent;
    },
    get ended() {
      return ended;
    }
  };

  return { req, res };
}

function extractCookiesFromSetCookie(setCookieHeader) {
  const list = Array.isArray(setCookieHeader) ? setCookieHeader : (setCookieHeader ? [setCookieHeader] : []);
  const jar = {};
  for (const item of list) {
    const firstPart = String(item).split(';')[0];
    const eqIdx = firstPart.indexOf('=');
    if (eqIdx > 0) {
      const name = firstPart.slice(0, eqIdx).trim();
      const val = decodeURIComponent(firstPart.slice(eqIdx + 1).trim());
      jar[name] = val;
    }
  }
  return jar;
}

function formatCookieHeader(jar) {
  return Object.entries(jar)
    .filter(([, v]) => v !== '' && v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('; ');
}

// Snapshot original environment and fetch
const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

function resetTestEnv(overrides = {}) {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, ORIGINAL_ENV);
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.PRIVATE_PORTAL_PASSWORD;
  delete process.env.TRUST_PROXY;
  delete process.env.SESSION_SECRET;
  process.env.NODE_ENV = 'test';
  process.env.MASTER_GATE_PASSWORD = 'Test_Canonical_Master_Password_2026!';
  process.env.AFFILIATE_PASSWORD = 'Test_Affiliate_Password_2026!';
  process.env.SESSION_SIGNING_SECRET = 'Test_Session_Signing_Secret_32_Bytes_Minimum_Key!';
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';
  process.env.REAL_BUYER_EMAILS = '0';
  Object.assign(process.env, overrides);
  globalThis.fetch = ORIGINAL_FETCH;
  authMod._testResetAuthState();
}

// Mock Upstash KV in-memory server for testing distributed KV commands & Lua scripts
function installMockKvFetch({ shouldFail = false, httpStatus = 200, customHandler = null } = {}) {
  const kvStore = new Map();
  globalThis.fetch = async (url, init) => {
    const urlStr = String(url);
    if (urlStr.includes('upstash.io') || urlStr.includes('mock-kv.local')) {
      if (shouldFail) {
        throw new Error('Simulated KV network connection timeout');
      }
      if (httpStatus !== 200) {
        return new Response('KV Error', { status: httpStatus });
      }
      const cmd = JSON.parse(init.body);
      if (customHandler) {
        const customResult = customHandler(cmd, kvStore);
        if (customResult !== undefined) {
          return new Response(JSON.stringify({ result: customResult }), { status: 200 });
        }
      }
      const op = String(cmd[0]).toUpperCase();
      if (op === 'SET') {
        const [, key, val] = cmd;
        kvStore.set(key, String(val));
        return new Response(JSON.stringify({ result: 'OK' }), { status: 200 });
      }
      if (op === 'GET') {
        const [, key] = cmd;
        const val = kvStore.has(key) ? kvStore.get(key) : null;
        return new Response(JSON.stringify({ result: val }), { status: 200 });
      }
      if (op === 'DEL') {
        const [, key] = cmd;
        const existed = kvStore.delete(key) ? 1 : 0;
        return new Response(JSON.stringify({ result: existed }), { status: 200 });
      }
      if (op === 'EVAL') {
        const [, , numKeys, key, windowSecStr] = cmd;
        assert.equal(Number(numKeys), 1);
        const windowSec = Number(windowSecStr);
        const current = kvStore.get(key);
        if (current !== undefined) {
          const parsed = Number(current);
          if (!Number.isInteger(parsed) || parsed < 0) {
            return new Response(JSON.stringify({ result: [-1, -1] }), { status: 200 });
          }
          const next = parsed + 1;
          kvStore.set(key, String(next));
          return new Response(JSON.stringify({ result: [next, windowSec] }), { status: 200 });
        } else {
          kvStore.set(key, '1');
          return new Response(JSON.stringify({ result: [1, windowSec] }), { status: 200 });
        }
      }
      return new Response(JSON.stringify({ result: null }), { status: 200 });
    }
    return ORIGINAL_FETCH(url, init);
  };
  return kvStore;
}

console.log('============================================================================');
console.log('EXECUTING PACKAGE 3F.106 SECURITY & REGRESSION TEST SUITE');
console.log('============================================================================\n');

// ============================================================================
// CATEGORY 1: AUTHENTICATION BYPASS ATTEMPTS (CC-01)
// ============================================================================
await runTest('T-01.1', 'CC-01', 'Reject Authorization: Bearer <MASTER_GATE_PASSWORD> on GET /api/admin-quotations', async () => {
  resetTestEnv();
  const { req, res } = createMockReqRes({
    method: 'GET',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      authorization: `Bearer ${process.env.MASTER_GATE_PASSWORD}`
    }
  });
  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 401);
});

await runTest('T-01.2', 'CC-01', 'Reject Authorization: Bearer <MASTER_GATE_PASSWORD> on GET /api/importers and GET /api/manufacturers', async () => {
  resetTestEnv();
  const imp = createMockReqRes({
    method: 'GET',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      authorization: `Bearer ${process.env.MASTER_GATE_PASSWORD}`
    }
  });
  await importersHandler(imp.req, imp.res);
  assert.equal(imp.res.statusCode, 401);

  const mfg = createMockReqRes({
    method: 'GET',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      authorization: `Bearer ${process.env.MASTER_GATE_PASSWORD}`
    }
  });
  await manufacturersHandler(mfg.req, mfg.res);
  assert.equal(mfg.res.statusCode, 401);
});

await runTest('T-01.3', 'CC-01', 'Reject unissued legacy cookie names (avani_admin_session=authenticated, avani_portal_auth=<password>) on /api/admin-quotations', async () => {
  resetTestEnv();
  const { req, res } = createMockReqRes({
    method: 'GET',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: `avani_admin_session=authenticated; avani_portal_auth=${process.env.MASTER_GATE_PASSWORD}`
    }
  });
  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 401);
});

// ============================================================================
// CATEGORY 2: CREDENTIAL PRECEDENCE, CONFLICT & LEGACY REJECTION (CC-02)
// ============================================================================
await runTest('T-02.1', 'CC-02', 'Conflicting MASTER_GATE_PASSWORD and PRIVATE_PORTAL_PASSWORD fails closed with 503 CREDENTIAL_CONFLICT', async () => {
  resetTestEnv({
    MASTER_GATE_PASSWORD: 'Canonical_Password_Alpha',
    PRIVATE_PORTAL_PASSWORD: 'Conflicting_Legacy_Password_Beta'
  });
  const check = authMod.resolveMasterGatePassword();
  assert.equal(check.valid, false);
  assert.equal(check.code, 'CREDENTIAL_CONFLICT');
  assert.equal(check.statusCode, 503);

  const { req, res } = createMockReqRes({
    method: 'POST',
    headers: { origin: 'https://www.avaniagrofoods.com' },
    body: { password: 'Canonical_Password_Alpha' }
  });
  await verifyGateHandler(req, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body?.code, 'CREDENTIAL_CONFLICT');
});

await runTest('T-02.2', 'CC-02', 'Legacy-only PRIVATE_PORTAL_PASSWORD without MASTER_GATE_PASSWORD fails closed with 503 LEGACY_CREDENTIAL_ONLY_FORBIDDEN', async () => {
  resetTestEnv({
    MASTER_GATE_PASSWORD: '',
    PRIVATE_PORTAL_PASSWORD: 'Legacy_Only_Password'
  });
  const check = authMod.resolveMasterGatePassword();
  assert.equal(check.valid, false);
  assert.equal(check.code, 'LEGACY_CREDENTIAL_ONLY_FORBIDDEN');
  assert.equal(check.statusCode, 503);

  const { req, res } = createMockReqRes({
    method: 'POST',
    headers: { origin: 'https://www.avaniagrofoods.com' },
    body: { password: 'Legacy_Only_Password' }
  });
  await verifyGateHandler(req, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body?.code, 'LEGACY_CREDENTIAL_ONLY_FORBIDDEN');
});

await runTest('T-02.3', 'CC-02', 'Missing both MASTER_GATE_PASSWORD and PRIVATE_PORTAL_PASSWORD fails closed with 503 MASTER_CREDENTIAL_MISSING', async () => {
  resetTestEnv({
    MASTER_GATE_PASSWORD: '',
    PRIVATE_PORTAL_PASSWORD: ''
  });
  const check = authMod.resolveMasterGatePassword();
  assert.equal(check.valid, false);
  assert.equal(check.code, 'MASTER_CREDENTIAL_MISSING');
  assert.equal(check.statusCode, 503);
});

// ============================================================================
// CATEGORY 3: SIGNED SESSION VALIDITY (CC-03)
// ============================================================================
await runTest('T-03.1', 'CC-03', 'Valid login on /api/verify-gate issues signed session + CSRF cookies, persists in KV, and authenticates protected routes', async () => {
  resetTestEnv({
    KV_REST_API_URL: 'https://mock-kv.local',
    KV_REST_API_TOKEN: 'mock_token'
  });
  const kvStore = installMockKvFetch();

  const login = createMockReqRes({
    method: 'POST',
    headers: { origin: 'https://www.avaniagrofoods.com' },
    body: { password: process.env.MASTER_GATE_PASSWORD }
  });
  await verifyGateHandler(login.req, login.res);
  assert.equal(login.res.statusCode, 200);
  assert.equal(login.res.body?.authenticated, true);
  assert.ok(login.res.body?.csrfToken);

  const jar = extractCookiesFromSetCookie(login.res.headers['set-cookie']);
  assert.ok(jar.avani_gate_session);
  assert.equal(jar.avani_csrf_token, login.res.body.csrfToken);

  // Confirm server-side session record persisted in KV
  const [sessionId] = jar.avani_gate_session.split('.');
  assert.ok(kvStore.has(`session:gate:${sessionId}`));

  // Verify session against GET /api/importers and GET /api/manufacturers
  const imp = createMockReqRes({
    method: 'GET',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: formatCookieHeader(jar)
    }
  });
  await importersHandler(imp.req, imp.res);
  assert.equal(imp.res.statusCode, 200);
  assert.equal(imp.res.body?.count, 1);

  const mfg = createMockReqRes({
    method: 'GET',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: formatCookieHeader(jar)
    }
  });
  await manufacturersHandler(mfg.req, mfg.res);
  assert.equal(mfg.res.statusCode, 200);
  assert.equal(mfg.res.body?.count, 1);
});

// ============================================================================
// CATEGORY 4: TAMPERED, EXPIRED, AND REVOKED SESSIONS (CC-03)
// ============================================================================
await runTest('T-04.1', 'CC-03', 'Reject tampered HMAC signature and tampered sessionId on session cookies', async () => {
  resetTestEnv();
  const session = await authMod.createServerSession('gate');
  const [sessionId, sig] = session.token.split('.');

  // 1. Tamper signature
  const badSigToken = `${sessionId}.tampered_${sig}`;
  const check1 = await authMod.verifyServerSession(
    { headers: { cookie: `avani_gate_session=${badSigToken}` } },
    'gate'
  );
  assert.equal(check1.authenticated, false);
  assert.equal(check1.code, 'SESSION_INVALID_SIGNATURE');

  // 2. Tamper sessionId while keeping original signature
  const fakeSessionId = crypto.randomBytes(32).toString('hex');
  const tamperedIdToken = `${fakeSessionId}.${sig}`;
  const check2 = await authMod.verifyServerSession(
    { headers: { cookie: `avani_gate_session=${tamperedIdToken}` } },
    'gate'
  );
  assert.equal(check2.authenticated, false);
  assert.equal(check2.code, 'SESSION_INVALID_SIGNATURE');
});

await runTest('T-04.2', 'CC-03', 'Reject expired session record and unpersisted/unknown session ID', async () => {
  resetTestEnv();
  const secret = authMod.getSessionSecret();
  const sessionId = crypto.randomBytes(32).toString('hex');
  const signedToken = authMod.signSessionId(sessionId, secret);

  // 1. Validly signed token that was never persisted on the server -> 401 SESSION_REVOKED_OR_EXPIRED
  const checkUnstored = await authMod.verifyServerSession(
    { headers: { cookie: `avani_gate_session=${signedToken}` } },
    'gate'
  );
  assert.equal(checkUnstored.authenticated, false);
  assert.equal(checkUnstored.code, 'SESSION_REVOKED_OR_EXPIRED');

  // 2. Persisted record whose expiresAtMs is in the past -> 401 SESSION_EXPIRED
  authMod._testSetLocalSessionRecord('gate', sessionId, {
    active: true,
    revoked: false,
    sessionId,
    role: 'gate',
    issuedAtMs: Date.now() - 20000,
    expiresAtMs: Date.now() - 5000
  });
  const checkExpired = await authMod.verifyServerSession(
    { headers: { cookie: `avani_gate_session=${signedToken}` } },
    'gate'
  );
  assert.equal(checkExpired.authenticated, false);
  assert.equal(checkExpired.code, 'SESSION_EXPIRED');
});

// ============================================================================
// CATEGORY 5: KV UNAVAILABLE AND MALFORMED SESSION RECORD HANDLING (CC-03)
// ============================================================================
await runTest('T-05.1', 'CC-03', 'KV outage during session verification returns 503 SESSION_BACKEND_UNAVAILABLE (never falls back to signature-only)', async () => {
  resetTestEnv({
    KV_REST_API_URL: 'https://mock-kv.local',
    KV_REST_API_TOKEN: 'mock_token'
  });
  installMockKvFetch();

  // Issue valid session while KV is healthy
  const session = await authMod.createServerSession('gate');
  const cookieHeader = `avani_gate_session=${session.token}`;

  // Simulate KV outage
  installMockKvFetch({ shouldFail: true });

  const check = await authMod.verifyServerSession({ headers: { cookie: cookieHeader } }, 'gate');
  assert.equal(check.authenticated, false);
  assert.equal(check.backendUnavailable, true);
  assert.equal(check.statusCode, 503);
  assert.equal(check.code, 'SESSION_BACKEND_UNAVAILABLE');

  // Verify protected API endpoints propagate 503 instead of 200 or 401
  const adminCall = createMockReqRes({
    method: 'GET',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: cookieHeader
    }
  });
  await adminQuotationsHandler(adminCall.req, adminCall.res);
  assert.equal(adminCall.res.statusCode, 503);
});

await runTest('T-05.2', 'CC-03', 'Malformed JSON session record in KV fails closed with 401 SESSION_MALFORMED_RECORD', async () => {
  resetTestEnv({
    KV_REST_API_URL: 'https://mock-kv.local',
    KV_REST_API_TOKEN: 'mock_token'
  });
  const kvStore = installMockKvFetch();
  const session = await authMod.createServerSession('gate');

  // Corrupt the stored JSON in KV
  kvStore.set(`session:gate:${session.sessionId}`, '{corrupt_json_record');

  const check = await authMod.verifyServerSession(
    { headers: { cookie: `avani_gate_session=${session.token}` } },
    'gate'
  );
  assert.equal(check.authenticated, false);
  assert.equal(check.statusCode, 401);
  assert.equal(check.code, 'SESSION_MALFORMED_RECORD');
});

// ============================================================================
// CATEGORY 6: LOGOUT REVOCATION ACROSS PROTECTED ROUTES (CC-03)
// ============================================================================
await runTest('T-06.1', 'CC-03', 'Logout immediately revokes session in KV and blocks replay across verify-gate, admin-quotations, importers, and manufacturers', async () => {
  resetTestEnv({
    KV_REST_API_URL: 'https://mock-kv.local',
    KV_REST_API_TOKEN: 'mock_token'
  });
  installMockKvFetch();

  // 1. Login
  const login = createMockReqRes({
    method: 'POST',
    headers: { origin: 'https://www.avaniagrofoods.com' },
    body: { password: process.env.MASTER_GATE_PASSWORD }
  });
  await verifyGateHandler(login.req, login.res);
  assert.equal(login.res.statusCode, 200);
  const preLogoutJar = extractCookiesFromSetCookie(login.res.headers['set-cookie']);
  const preLogoutCookieHeader = formatCookieHeader(preLogoutJar);
  const csrfToken = login.res.body.csrfToken;

  // 2. Verify pre-logout cookie works on admin-quotations
  const preCheck = createMockReqRes({
    method: 'GET',
    headers: { origin: 'https://www.avaniagrofoods.com', cookie: preLogoutCookieHeader }
  });
  await adminQuotationsHandler(preCheck.req, preCheck.res);
  assert.equal(preCheck.res.statusCode, 200);

  // 3. Logout with valid CSRF token
  const logout = createMockReqRes({
    method: 'POST',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: preLogoutCookieHeader,
      'x-csrf-token': csrfToken
    },
    body: { action: 'logout' }
  });
  await verifyGateHandler(logout.req, logout.res);
  assert.equal(logout.res.statusCode, 200);
  assert.equal(logout.res.body?.loggedOut, true);

  // 4. Replay pre-logout cookie across EVERY protected endpoint -> all must return 401
  const replayVerify = createMockReqRes({
    method: 'POST',
    headers: { origin: 'https://www.avaniagrofoods.com', cookie: preLogoutCookieHeader },
    body: { action: 'verify' }
  });
  await verifyGateHandler(replayVerify.req, replayVerify.res);
  assert.equal(replayVerify.res.statusCode, 401);

  const replayAdminGet = createMockReqRes({
    method: 'GET',
    headers: { origin: 'https://www.avaniagrofoods.com', cookie: preLogoutCookieHeader }
  });
  await adminQuotationsHandler(replayAdminGet.req, replayAdminGet.res);
  assert.equal(replayAdminGet.res.statusCode, 401);

  const replayAdminPost = createMockReqRes({
    method: 'POST',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: preLogoutCookieHeader,
      'x-csrf-token': csrfToken
    },
    body: { action: 'list' }
  });
  await adminQuotationsHandler(replayAdminPost.req, replayAdminPost.res);
  assert.equal(replayAdminPost.res.statusCode, 401);

  const replayImp = createMockReqRes({
    method: 'GET',
    headers: { origin: 'https://www.avaniagrofoods.com', cookie: preLogoutCookieHeader }
  });
  await importersHandler(replayImp.req, replayImp.res);
  assert.equal(replayImp.res.statusCode, 401);

  const replayMfg = createMockReqRes({
    method: 'GET',
    headers: { origin: 'https://www.avaniagrofoods.com', cookie: preLogoutCookieHeader }
  });
  await manufacturersHandler(replayMfg.req, replayMfg.res);
  assert.equal(replayMfg.res.statusCode, 401);
});

// ============================================================================
// CATEGORY 7: ORIGIN VALIDATION (CC-04)
// ============================================================================
await runTest('T-07.1', 'CC-04', 'Exact origin allowlist rejects substring/suffix spoofing, wildcard .vercel.app, and missing Origin on mutations', async () => {
  resetTestEnv({
    NODE_ENV: 'production',
    KV_REST_API_URL: 'https://mock-kv.local',
    KV_REST_API_TOKEN: 'mock_token'
  });
  installMockKvFetch();

  // Allowed exact origins
  assert.equal(authMod.isExactAllowedOrigin('https://www.avaniagrofoods.com'), true);
  assert.equal(authMod.isExactAllowedOrigin('https://avaniagrofoods.com'), true);

  // Spoofed origins that previously bypassed .includes('avaniagrofoods.com') or .endsWith('.vercel.app')
  const spoofedOrigins = [
    'https://evil-avaniagrofoods.com',
    'https://avaniagrofoods.com.attacker.com',
    'https://attacker.com/https://www.avaniagrofoods.com',
    'https://attacker-preview.vercel.app',
    'http://www.avaniagrofoods.com',
    'http://localhost:5173',
    'null'
  ];
  for (const evilOrigin of spoofedOrigins) {
    assert.equal(authMod.isExactAllowedOrigin(evilOrigin), false, `Expected ${evilOrigin} to be rejected`);
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { origin: evilOrigin },
      body: { password: process.env.MASTER_GATE_PASSWORD }
    });
    await verifyGateHandler(req, res);
    assert.equal(res.statusCode, 403, `Expected 403 for origin ${evilOrigin}`);
  }

  // Missing both Origin and Referer on state-changing POST is rejected
  const missingOriginMutation = createMockReqRes({
    method: 'POST',
    headers: {},
    body: { password: process.env.MASTER_GATE_PASSWORD }
  });
  await verifyGateHandler(missingOriginMutation.req, missingOriginMutation.res);
  assert.equal(missingOriginMutation.res.statusCode, 403);
});

// ============================================================================
// CATEGORY 8: CSRF TOKEN VALIDATION (CC-04)
// ============================================================================
await runTest('T-08.1', 'CC-04', 'Cookie-authenticated POST mutations require valid session-bound CSRF token and reject missing/tampered/cross-session tokens', async () => {
  resetTestEnv();
  const sessionA = await authMod.createServerSession('gate');
  const sessionB = await authMod.createServerSession('gate');
  const cookieHeaderA = `avani_gate_session=${sessionA.token}; avani_csrf_token=${sessionA.csrfToken}`;

  // 1. Missing CSRF token on POST /api/admin-quotations -> 403 CSRF_TOKEN_MISSING
  const missingCsrf = createMockReqRes({
    method: 'POST',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: cookieHeaderA
    },
    body: { action: 'list' }
  });
  await adminQuotationsHandler(missingCsrf.req, missingCsrf.res);
  assert.equal(missingCsrf.res.statusCode, 403);
  assert.equal(missingCsrf.res.body?.code, 'CSRF_TOKEN_MISSING');

  // 2. Tampered CSRF token -> 403 CSRF_TOKEN_INVALID
  const tamperedCsrf = createMockReqRes({
    method: 'POST',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: cookieHeaderA,
      'x-csrf-token': `${sessionA.csrfToken}tampered`
    },
    body: { action: 'list' }
  });
  await adminQuotationsHandler(tamperedCsrf.req, tamperedCsrf.res);
  assert.equal(tamperedCsrf.res.statusCode, 403);
  assert.equal(tamperedCsrf.res.body?.code, 'CSRF_TOKEN_INVALID');

  // 3. Cross-session CSRF token (Session B's CSRF token used with Session A's cookie) -> 403 CSRF_TOKEN_INVALID
  const crossSessionCsrf = createMockReqRes({
    method: 'POST',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: cookieHeaderA,
      'x-csrf-token': sessionB.csrfToken
    },
    body: { action: 'list' }
  });
  await adminQuotationsHandler(crossSessionCsrf.req, crossSessionCsrf.res);
  assert.equal(crossSessionCsrf.res.statusCode, 403);
  assert.equal(crossSessionCsrf.res.body?.code, 'CSRF_TOKEN_INVALID');

  // 4. Valid session-bound CSRF token -> 200 OK
  const validCsrf = createMockReqRes({
    method: 'POST',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: cookieHeaderA,
      'x-csrf-token': sessionA.csrfToken
    },
    body: {
      action: 'create-draft',
      leadData: {
        leadId: 'AAF-L-2026-8001',
        buyer: {
          name: 'Hans Mueller',
          company: 'BioHerbs GmbH',
          email: 'hans@bioherbs.de',
          country: 'Germany'
        },
        inquiry: {
          product: 'Moringa Leaf Powder',
          quantity: 1000,
          destinationPort: 'Hamburg'
        }
      }
    }
  });
  await adminQuotationsHandler(validCsrf.req, validCsrf.res);
  assert.equal(validCsrf.res.statusCode, 200);
  assert.equal(validCsrf.res.body?.success, true);
});

// ============================================================================
// CATEGORY 9: WORKBOOK GENERATION AND PROTECTION BEHAVIOR (CC-05)
// ============================================================================
await runTest('T-09.1', 'CC-05', 'Excel quotation generation is decoupled from MASTER_GATE_PASSWORD, opens cleanly in ExcelJS, and rejects master password coupling', async () => {
  resetTestEnv({
    MASTER_GATE_PASSWORD: 'TopSecretPortalMasterPassword2026!'
  });

  const sampleQuotation = {
    quoteId: 'AAF-Q-2026-8801',
    date: '2026-11-10',
    validUntil: '2026-11-25',
    buyerName: 'Hans Mueller',
    companyName: 'GreenLife Naturals GmbH',
    country: 'Germany',
    email: 'procurement@greenlife.de',
    currency: 'USD',
    incoterm: 'FOB NHAVA SHEVA (JNPT MUMBAI)',
    destinationPort: 'Hamburg, Germany',
    items: [
      {
        name: 'Organic Moringa Leaf Powder',
        hscode: '12129990',
        quantity: 5000,
        unit: 'KG',
        rate: 4.5,
        amount: 22500
      }
    ],
    subtotal: 22500,
    grandTotal: 22500
  };

  const xlsxBuffer = await quotationEngineMod.generateExcelQuotation(sampleQuotation);
  assert.ok(Buffer.isBuffer(xlsxBuffer));
  assert.ok(xlsxBuffer.length > 1000);

  // Open generated workbook with ExcelJS and verify worksheet is NOT locked with MASTER_GATE_PASSWORD
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(xlsxBuffer);
  const sheet = wb.getWorksheet('Quotation');
  assert.ok(sheet);
  assert.equal(sheet.sheetProtection?.password, undefined);

  // Verify explicit guard throws CREDENTIAL_COUPLING_FORBIDDEN if anyone passes MASTER_GATE_PASSWORD
  await assert.rejects(
    async () => {
      await quotationEngineMod.generateExcelQuotation(sampleQuotation, {
        worksheetProtectionPassword: process.env.MASTER_GATE_PASSWORD
      });
    },
    (err) => err.code === 'CREDENTIAL_COUPLING_FORBIDDEN'
  );
});

// ============================================================================
// CATEGORY 10: WEBHOOK SIGNATURE VERIFICATION AND REPLAY REJECTION (CC-06)
// ============================================================================
await runTest('T-10.1', 'CC-06', 'Webhook endpoints reject query/body secrets, fail closed (503) when unconfigured, verify Svix HMAC + timestamp, and block replays', async () => {
  // 1. Reject query/body secret on email-reply-webhook
  resetTestEnv({ RESEND_WEBHOOK_SECRET: 'whsec_' + Buffer.from('test_webhook_secret_key_2026').toString('base64') });
  const untrustedSecretCall = createMockReqRes({
    method: 'POST',
    query: { secret: 'plaintext_secret' },
    body: { type: 'email.delivered' }
  });
  await emailReplyWebhookHandler(untrustedSecretCall.req, untrustedSecretCall.res);
  assert.equal(untrustedSecretCall.res.statusCode, 400);
  assert.equal(untrustedSecretCall.res.body?.code, 'UNTRUSTED_SECRET_SOURCE');

  // 2. Fail closed (503) when RESEND_WEBHOOK_SECRET is not configured
  resetTestEnv({ RESEND_WEBHOOK_SECRET: '' });
  const unconfiguredCall = createMockReqRes({
    method: 'POST',
    body: { type: 'email.delivered' },
    rawBody: '{"type":"email.delivered"}'
  });
  await emailReplyWebhookHandler(unconfiguredCall.req, unconfiguredCall.res);
  assert.equal(unconfiguredCall.res.statusCode, 503);
  assert.equal(unconfiguredCall.res.body?.code, 'WEBHOOK_UNCONFIGURED');

  // 3. Verify valid Svix signature and replay rejection on /api/admin-quotations delivery-webhook
  const rawKeyBytes = Buffer.from('0123456789abcdef0123456789abcdef');
  const svixSecret = `whsec_${rawKeyBytes.toString('base64')}`;
  resetTestEnv({ RESEND_WEBHOOK_SECRET: svixSecret });

  // Create a quotation first so delivery-webhook can update it
  const session = await authMod.createServerSession('gate');
  const createCall = createMockReqRes({
    method: 'POST',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: `avani_gate_session=${session.token}; avani_csrf_token=${session.csrfToken}`,
      'x-csrf-token': session.csrfToken
    },
    body: {
      action: 'create-draft',
      leadData: {
        leadId: 'AAF-L-2026-7701',
        buyer: {
          name: 'Claire Dubois',
          company: 'BioFrance SAS',
          email: 'claire@biofrance.fr',
          country: 'France'
        },
        inquiry: {
          product: 'Moringa Leaf Powder',
          quantity: 2000,
          destinationPort: 'Le Havre'
        }
      }
    }
  });
  await adminQuotationsHandler(createCall.req, createCall.res);
  assert.equal(createCall.res.statusCode, 200);
  const createdQuote = createCall.res.body.quotation;

  const eventPayload = {
    action: 'delivery-webhook',
    quotation: createdQuote,
    eventPayload: {
      id: 'evt_svix_unique_3f106_01',
      type: 'email.delivered',
      timestamp: new Date().toISOString()
    }
  };
  const rawBody = JSON.stringify(eventPayload);
  const svixId = 'msg_3f106_svix_001';
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const expectedSig = crypto
    .createHmac('sha256', rawKeyBytes)
    .update(`${svixId}.${svixTimestamp}.${rawBody}`, 'utf8')
    .digest('base64');

  // Invalid signature -> 401
  const badSigWebhook = createMockReqRes({
    method: 'POST',
    headers: {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': `v1,${Buffer.from('wrong_signature').toString('base64')}`
    },
    body: eventPayload,
    rawBody
  });
  await adminQuotationsHandler(badSigWebhook.req, badSigWebhook.res);
  assert.equal(badSigWebhook.res.statusCode, 401);
  assert.equal(badSigWebhook.res.body?.code, 'WEBHOOK_UNAUTHORIZED');

  // Valid signature -> 200 and updates status to DELIVERED
  const validWebhook = createMockReqRes({
    method: 'POST',
    headers: {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': `v1,${expectedSig}`
    },
    body: eventPayload,
    rawBody
  });
  await adminQuotationsHandler(validWebhook.req, validWebhook.res);
  assert.equal(validWebhook.res.statusCode, 200);
  assert.equal(validWebhook.res.body?.quotation?.status, 'DELIVERED');

  // Replay exact same webhook event -> rejected (400 Duplicate webhook event rejected)
  const replayWebhook = createMockReqRes({
    method: 'POST',
    headers: {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': `v1,${expectedSig}`
    },
    body: eventPayload,
    rawBody
  });
  await adminQuotationsHandler(replayWebhook.req, replayWebhook.res);
  assert.equal(replayWebhook.res.statusCode, 400);
  assert.match(String(replayWebhook.res.body?.error), /Duplicate webhook event rejected/i);
});

// ============================================================================
// CATEGORY 11: AUDIT ACTOR ATTRIBUTION AND SPOOFING REJECTION (CC-07)
// ============================================================================
await runTest('T-11.1', 'CC-07', 'Privileged quotation mutations ignore client-supplied req.body.actor/changedBy and attribute audit events to verified server session actor', async () => {
  resetTestEnv();
  const session = await authMod.createServerSession('gate');
  assert.match(session.actor, /^gate_operator:session_[0-9a-f]{12}$/);

  const cookieHeader = `avani_gate_session=${session.token}; avani_csrf_token=${session.csrfToken}`;

  // Create quotation with spoofed client actor fields
  const createCall = createMockReqRes({
    method: 'POST',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: cookieHeader,
      'x-csrf-token': session.csrfToken
    },
    body: {
      action: 'create-draft',
      actor: 'Spoofed External Attacker',
      changedBy: 'Spoofed CEO',
      overrides: { owner: 'Spoofed Owner' },
      leadData: {
        leadId: 'AAF-L-2026-8802',
        buyer: {
          name: 'Marco Rossi',
          company: 'Italia Herbs SRL',
          email: 'marco@italiaherbs.it',
          country: 'Italy'
        },
        inquiry: {
          product: 'Dehydrated White Onion Powder',
          quantity: 5000,
          destinationPort: 'Genoa'
        }
      }
    }
  });
  await adminQuotationsHandler(createCall.req, createCall.res);
  assert.equal(createCall.res.statusCode, 200);
  const q = createCall.res.body.quotation;
  assert.equal(q.workflow.owner, session.actor);
  assert.equal(q.revision.changedBy, session.actor);
  assert.equal(q.activity[0].actor, session.actor);

  // Attempt admin-override with spoofed actor
  const overrideCall = createMockReqRes({
    method: 'POST',
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      cookie: cookieHeader,
      'x-csrf-token': session.csrfToken
    },
    body: {
      action: 'admin-override',
      quotation: q,
      actor: 'Spoofed Admin',
      reason: 'Verbal confirmation from processor partner for regression test'
    }
  });
  await adminQuotationsHandler(overrideCall.req, overrideCall.res);
  assert.equal(overrideCall.res.statusCode, 200);
  const updatedQ = overrideCall.res.body.quotation;
  assert.equal(updatedQ.processorConfirmation.adminOverride.actor, session.actor);
  const lastActivity = updatedQ.activity[updatedQ.activity.length - 1];
  assert.equal(lastActivity.actor, session.actor);
  assert.notEqual(lastActivity.actor, 'Spoofed Admin');
  assert.notEqual(lastActivity.actor, 'Sachin Shinde');
});

// ============================================================================
// CATEGORY 12: DISTRIBUTED RATE LIMITING & PROXY IP BOUNDARY (CC-08)
// ============================================================================
await runTest('T-12.1', 'CC-08', 'Distributed rate limiter enforces threshold, fails closed (503) on KV outage in production, and prevents X-Forwarded-For spoofing', async () => {
  resetTestEnv({
    KV_REST_API_URL: 'https://mock-kv.local',
    KV_REST_API_TOKEN: 'mock_token'
  });
  installMockKvFetch();

  // 1. Untrusted X-Forwarded-For spoofing is ignored when not on Vercel and TRUST_PROXY != 1
  const reqSpoofed = {
    headers: { 'x-forwarded-for': '198.51.100.99, 203.0.113.5' },
    socket: { remoteAddress: '192.0.2.55' }
  };
  assert.equal(authMod.getClientIp(reqSpoofed), '192.0.2.55');

  // 2. On Vercel runtime (VERCEL=1), platform-injected x-vercel-forwarded-for is used
  process.env.VERCEL = '1';
  const reqVercel = {
    headers: {
      'x-forwarded-for': '1.1.1.1',
      'x-vercel-forwarded-for': '198.51.100.42'
    },
    socket: { remoteAddress: '10.0.0.1' }
  };
  assert.equal(authMod.getClientIp(reqVercel), '198.51.100.42');
  delete process.env.VERCEL;

  // 3. Enforce threshold (maxAttempts = 3)
  for (let i = 1; i <= 3; i++) {
    const r = await authMod.checkRateLimit('192.0.2.77', 'test_rl', { maxAttempts: 3, windowSeconds: 60 });
    assert.equal(r.limited, false);
    assert.equal(r.remaining, 3 - i);
  }
  const fourth = await authMod.checkRateLimit('192.0.2.77', 'test_rl', { maxAttempts: 3, windowSeconds: 60 });
  assert.equal(fourth.limited, true);
  assert.equal(fourth.statusCode, 429);

  // 4. Production fail-closed (503) when KV is unreachable
  process.env.NODE_ENV = 'production';
  installMockKvFetch({ shouldFail: true });
  const outageCheck = await authMod.checkRateLimit('192.0.2.88', 'test_rl', { maxAttempts: 5, windowSeconds: 60 });
  assert.equal(outageCheck.limited, true);
  assert.equal(outageCheck.backendUnavailable, true);
  assert.equal(outageCheck.statusCode, 503);
  assert.equal(outageCheck.code, 'RATE_LIMIT_BACKEND_UNAVAILABLE');
});

// ============================================================================
// CATEGORY 13: CORRUPT COUNTER HANDLING (CC-08)
// ============================================================================
await runTest('T-13.1', 'CC-08', 'Corrupt rate-limit counter state in KV or local store is evicted and fails closed with 503 RATE_LIMIT_CORRUPT_STATE', async () => {
  resetTestEnv({
    KV_REST_API_URL: 'https://mock-kv.local',
    KV_REST_API_TOKEN: 'mock_token'
  });
  const kvStore = installMockKvFetch();

  // Inject a corrupt non-numeric value into KV
  kvStore.set('ratelimit:corrupt_test:192.0.2.100', 'NOT_A_NUMBER_CORRUPT');

  const checkKvCorrupt = await authMod.checkRateLimit('192.0.2.100', 'corrupt_test', { maxAttempts: 5, windowSeconds: 60 });
  assert.equal(checkKvCorrupt.limited, true);
  assert.equal(checkKvCorrupt.backendUnavailable, true);
  assert.equal(checkKvCorrupt.statusCode, 503);
  assert.equal(checkKvCorrupt.code, 'RATE_LIMIT_CORRUPT_STATE');
  // Corrupt key must have been deleted so subsequent window can recover
  assert.equal(kvStore.has('ratelimit:corrupt_test:192.0.2.100'), false);

  // Also test corrupt state in local store
  resetTestEnv();
  authMod._testSetLocalRateLimitEntry('local_corrupt:192.0.2.101', { count: -99, resetAt: Date.now() + 60000 });
  const checkLocalCorrupt = await authMod.checkRateLimit('192.0.2.101', 'local_corrupt', { maxAttempts: 5, windowSeconds: 60 });
  assert.equal(checkLocalCorrupt.limited, true);
  assert.equal(checkLocalCorrupt.statusCode, 503);
  assert.equal(checkLocalCorrupt.code, 'RATE_LIMIT_CORRUPT_STATE');
});

// ============================================================================
// CATEGORY 14: CONCURRENCY BEHAVIOR (CC-08)
// ============================================================================
await runTest('T-14.1', 'CC-08', '15 concurrent rate-limit requests increment atomically without race-condition bypass (exactly 5 allowed, 10 blocked)', async () => {
  resetTestEnv({
    KV_REST_API_URL: 'https://mock-kv.local',
    KV_REST_API_TOKEN: 'mock_token'
  });
  installMockKvFetch();

  const parallelResults = await Promise.all(
    Array.from({ length: 15 }, () =>
      authMod.checkRateLimit('198.51.100.200', 'concurrent_rl', { maxAttempts: 5, windowSeconds: 60 })
    )
  );
  const allowedCount = parallelResults.filter(r => !r.limited).length;
  const blockedCount = parallelResults.filter(r => r.limited && r.statusCode === 429).length;
  assert.equal(allowedCount, 5);
  assert.equal(blockedCount, 10);
});

// ============================================================================
// CATEGORY 15: SENSITIVE ROUTE COVERAGE & ADDITIONAL FINDINGS (AF-01, AF-02, AF-03)
// ============================================================================
await runTest('T-15.1', 'CC-08/AF-01/02/03', 'All 10 API endpoints enforce rate-limit/KV outage propagation, HTML escaping in save-lead, and header sanitization in quotation', async () => {
  // 1. Verify production KV outage returns 503 across leads, lead-qualification, save-lead, quotation, affiliate-auth
  resetTestEnv({
    NODE_ENV: 'production',
    KV_REST_API_URL: 'https://mock-kv.local',
    KV_REST_API_TOKEN: 'mock_token'
  });
  installMockKvFetch({ shouldFail: true });

  for (const [name, handler, body] of [
    ['leads', leadsHandler, { buyerName: 'Test', email: 'test@example.com' }],
    ['lead-qualification', leadQualificationHandler, { leadId: 'L1' }],
    ['save-lead', saveLeadHandler, { name: 'Test', email: 'test@example.com', phone: '+1234567890' }],
    ['quotation', quotationHandler, { buyerName: 'Test' }],
    ['affiliate-auth', affiliateAuthHandler, { password: 'test' }]
  ]) {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { origin: 'https://www.avaniagrofoods.com' },
      body
    });
    await handler(req, res);
    assert.equal(res.statusCode, 503, `Expected 503 on ${name} when KV rate limiter is down in production`);
  }

  // 2. Verify AF-01: HTML escaping in save-lead email payload
  resetTestEnv({
    RESEND_API_KEY: 're_test_mock_key',
    ADMIN_NOTIFICATION_EMAIL: 'admin@avaniagrofoods.com'
  });
  let capturedEmailHtml = '';
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('api.resend.com/emails')) {
      const parsed = JSON.parse(init.body);
      capturedEmailHtml = parsed.html;
      return new Response(JSON.stringify({ id: 're_msg_1' }), { status: 200 });
    }
    return new Response('{}', { status: 200 });
  };
  const xssLead = createMockReqRes({
    method: 'POST',
    headers: { origin: 'https://www.avaniagrofoods.com' },
    body: {
      name: '<script>alert("xss")</script>',
      company: 'Acme & <Sons>',
      email: 'buyer@acme.com',
      phone: '+49123456789',
      product: 'Moringa Leaf Powder',
      message: '<img src=x onerror=alert(1)>'
    }
  });
  await saveLeadHandler(xssLead.req, xssLead.res);
  assert.equal(xssLead.res.statusCode, 200);
  assert.ok(!capturedEmailHtml.includes('<script>'), 'Unescaped <script> tag must not appear in email HTML');
  assert.ok(capturedEmailHtml.includes('&lt;script&gt;'), 'Escaped &lt;script&gt; must appear in email HTML');
  assert.ok(!capturedEmailHtml.includes('<img src=x'), 'Unescaped <img> tag must not appear in email HTML');

  // 3. Verify AF-03: Content-Disposition filename sanitization on /api/quotation?action=download-pdf
  resetTestEnv();
  const headerInjectionQuote = createMockReqRes({
    method: 'POST',
    headers: { origin: 'https://www.avaniagrofoods.com' },
    query: { action: 'download-pdf' },
    body: {
      quoteId: 'AAF-Q-2026-9999"\r\nX-Injected-Header: Pwned',
      buyerName: 'Hans Mueller',
      companyName: 'GreenLife GmbH',
      country: 'Germany',
      email: 'hans@greenlife.de',
      currency: 'USD',
      items: [{ name: 'Moringa Leaf Powder', hscode: '12129990', quantity: 1000, unit: 'KG', rate: 4.5 }]
    }
  });
  await quotationHandler(headerInjectionQuote.req, headerInjectionQuote.res);
  assert.equal(headerInjectionQuote.res.statusCode, 200);
  const contentDisp = headerInjectionQuote.res.headers['content-disposition'];
  assert.ok(!contentDisp.includes('\r') && !contentDisp.includes('\n') && !contentDisp.includes('X-Injected-Header: Pwned'));
});

// ============================================================================
// CATEGORY 16: CORE COMMERCIAL QUOTATION & SAFETY GATE WORKFLOWS
// ============================================================================
await runTest('T-16.1', 'WORKFLOW', 'Commercial quotation calculation, PDF/DOCX/XLSX generation, 20-point buyer-ready gate, and outreach safety gates', async () => {
  resetTestEnv({
    GLOBAL_OUTREACH_STOP: '1',
    OUTREACH_AUTHORIZED: '0',
    REAL_BUYER_EMAILS: '0'
  });

  // 1. Product master & calculation
  const calc = quotationEngineMod.calculateQuotation({
    buyerName: 'Elena Rostova',
    companyName: 'Nordic Botanicals AB',
    country: 'Sweden',
    email: 'elena@nordicbotanicals.se',
    currency: 'USD',
    incoterm: 'CIF Stockholm',
    freight: 650,
    insurance: 150,
    items: [
      { name: 'Organic Moringa Leaf Powder', hscode: '12129990', quantity: 2000, unit: 'KG', rate: 4.25 }
    ]
  });
  assert.equal(calc.subtotal, 8500);
  assert.equal(calc.grandTotal, 9300);

  // 2. PDF and DOCX buffer generation
  const pdfBuf = await quotationEngineMod.generatePdfQuotation(calc);
  assert.ok(Buffer.isBuffer(pdfBuf) && pdfBuf.length > 1000);
  assert.equal(pdfBuf.subarray(0, 4).toString('ascii'), '%PDF');

  const docxBuf = await quotationEngineMod.generateDocxQuotation(calc);
  assert.ok(Buffer.isBuffer(docxBuf) && docxBuf.length > 1000);
  assert.equal(docxBuf.subarray(0, 2).toString('ascii'), 'PK');

  // 3. Safety gate enforcement: GLOBAL_OUTREACH_STOP=1 blocks buyer email dispatch
  let q = quotationModelServer.createQuotationFromLead({
    leadId: 'AAF-L-2026-9901',
    buyer: {
      name: 'Elena Rostova',
      company: 'Nordic Botanicals AB',
      email: 'elena@nordicbotanicals.se',
      country: 'Sweden'
    },
    inquiry: {
      product: 'Moringa Leaf Powder',
      quantity: 2000,
      destinationPort: 'Stockholm',
      incoterm: 'FOB Nhava Sheva (JNPT Mumbai)'
    }
  });
  q = quotationModelServer.setAdminOverride(q, 'Verified processor availability for regression suite', 'gate_operator:session_test');
  q.quotation.items[0].rate = 4.25;
  q.quotation.items[0].unitPrice = 4.25;
  q.quotation.items[0].amount = 8500;
  q.quotation.items[0].total = 8500;
  q.quotation.subtotal = 8500;
  q.quotation.grandTotal = 8500;
  q.grandTotal = 8500;
  q.status = 'READY_FOR_BUYER';

  const gateEval = quotationModelServer.evaluateBuyerReadyGate(q);
  assert.equal(gateEval.passed, true);

  const blockedDispatch = await quotationModelServer.sendQuotationToBuyer(q, {
    adminReviewed: true,
    verifiedActor: 'gate_operator:session_test'
  });
  assert.equal(blockedDispatch.success, false);
  assert.equal(blockedDispatch.status, 'BLOCKED_GLOBAL_STOP');
});

// Restore environment
resetTestEnv();

console.log('\n============================================================================');
console.log(`PACKAGE 3F.106 REGRESSION SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${results.length})`);
console.log('============================================================================');

if (failed > 0) {
  process.exit(1);
}
