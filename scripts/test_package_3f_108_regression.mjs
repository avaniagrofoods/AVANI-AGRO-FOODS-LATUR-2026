// ============================================================
// PACKAGE 3F.108 — TARGETED PRODUCTION-BLOCKER REGRESSION TEST SUITE
// scripts/test_package_3f_108_regression.mjs
// Covers:
// - T-108-01 through T-108-24
// - Edge Middleware reconciliation & session format acceptance
// - Resend/Svix webhook stream preservation, signature & event idempotency
// - CSRF role separation & session binding (Gate vs Affiliate)
// - Server-authoritative actor attribution
// - Endpoint Origin validation & existing quotation workflow preservation
// ============================================================

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';

// Set isolated test environment flags
process.env.NODE_ENV = 'test';
process.env.SEQUENCE_TEST_ISOLATION = '1';
process.env.SESSION_SECRET = 'avani-test-session-secret-at-least-32-chars-long';
process.env.MASTER_GATE_PASSWORD = 'CorrectMasterGatePassword2026!';
process.env.AFFILIATE_PORTAL_PASSWORD = 'CorrectAffiliatePassword2026!';
process.env.CRON_SECRET = 'valid-cron-dispatch-secret-3f108';
process.env.ADMIN_API_KEY = 'valid-admin-api-key-3f108';
process.env.RESEND_WEBHOOK_SECRET = 'whsec_MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE'; // Base64 test key
process.env.ALLOWED_ORIGINS = 'https://www.avaniagrofoods.com,https://avaniagrofoods.com';
process.env.GLOBAL_OUTREACH_STOP = '1';
process.env.OUTREACH_AUTHORIZED = '0';

// Import modules under test
import middleware from '../middleware.js';
import adminQuotationsHandler, { config as adminQuotationsConfig } from '../api/admin-quotations.js';
import verifyGateHandler from '../api/verify-gate.js';
import affiliateAuthHandler from '../api/affiliate-auth.js';
import {
  createServerSession,
  verifyServerSession,
  revokeServerSession,
  generateCsrfToken,
  verifyCsrfRequest,
  verifySvixSignature,
  isAllowedOrigin,
  validateMutationOrigin,
  _testResetAuthState
} from '../api/_lib/auth.js';
import { processDeliveryWebhook } from '../api/_lib/quotationModel.js';

// Test execution tracking
const results = [];

function recordTest(id, name, type, fn) {
  return async () => {
    try {
      _testResetAuthState();
      await fn();
      results.push({ id, name, type, passed: true, error: null });
      console.log(`[PASS] ${id}: ${name} (${type})`);
    } catch (err) {
      results.push({ id, name, type, passed: false, error: err.message });
      console.error(`[FAIL] ${id}: ${name} (${type}) -> ${err.message}`);
    }
  };
}

// Mock HTTP Response builder for Node serverless handlers
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

// Mock Stream Request builder for Node serverless handlers
function createStreamReq({ method = 'POST', url = '/api/admin-quotations', headers = {}, body = null, rawBody = null }) {
  let stream;
  const rawContent = rawBody !== null ? rawBody : (body !== null ? (typeof body === 'string' ? body : JSON.stringify(body)) : '');
  
  stream = new Readable({
    read() {
      if (rawContent) {
        this.push(Buffer.from(rawContent, 'utf8'));
      }
      this.push(null);
    }
  });

  stream.method = method;
  stream.url = url;
  stream.headers = {
    'content-type': 'application/json',
    ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]))
  };

  return stream;
}

// Svix Signature Generator for testing
function generateSvixHeaders(payloadStr, secret) {
  const svixId = `msg_${crypto.randomBytes(16).toString('hex')}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const cleanSecret = secret.trim();
  const base64Secret = cleanSecret.startsWith('whsec_') ? cleanSecret.slice(6) : cleanSecret;
  const secretBytes = Buffer.from(base64Secret, 'base64');
  const signedContent = `${svixId}.${timestamp}.${payloadStr}`;
  const sig = crypto.createHmac('sha256', secretBytes).update(signedContent, 'utf8').digest('base64');

  return {
    'svix-id': svixId,
    'svix-timestamp': String(timestamp),
    'svix-signature': `v1,${sig}`
  };
}

// ────────────────────────────────────────────────────────────
// TESTS IMPLEMENTATION
// ────────────────────────────────────────────────────────────

// T-108-01: Actual generated session format accepted by middleware
const t01 = recordTest('T-108-01', 'Actual generated session format accepted by middleware', 'REAL_EDGE_MIDDLEWARE', async () => {
  const session = await createServerSession('gate');
  assert.equal(session.ok, true);
  const token = session.token; // 64-hex.base64sig

  // Construct Web standard Request hitting /api/admin-quotations
  const req = new Request('https://www.avaniagrofoods.com/api/admin-quotations', {
    method: 'GET',
    headers: {
      cookie: `avani_gate_session=${token}`
    }
  });

  const res = middleware(req);
  // Middleware passes through (returns undefined) if cookie format is accepted
  assert.equal(res, undefined, 'Middleware must not return a 401 response for legitimate 64-hex session token');
});

// T-108-02: Invalid session rejected by API verification
const t02 = recordTest('T-108-02', 'Invalid session rejected by API verification', 'REAL_LOCAL_AUTH', async () => {
  const fakeToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef.invalidsig123';
  const req = {
    headers: {
      cookie: `avani_gate_session=${fakeToken}`
    }
  };
  const result = await verifyServerSession(req, 'gate');
  assert.equal(result.authenticated, false);
  assert.equal(result.code, 'SESSION_INVALID_SIGNATURE');
});

// T-108-03: Expired session rejected
const t03 = recordTest('T-108-03', 'Expired session rejected', 'REAL_LOCAL_AUTH', async () => {
  const session = await createServerSession('gate', { ttlSeconds: 1 });
  assert.equal(session.ok, true);
  
  // Wait 1.1s for expiration
  await new Promise(r => setTimeout(r, 1100));

  const req = {
    headers: {
      cookie: `avani_gate_session=${session.token}`
    }
  };
  const result = await verifyServerSession(req, 'gate');
  assert.equal(result.authenticated, false);
  assert.equal(result.code, 'SESSION_EXPIRED');
});

// T-108-04: Revoked KV session rejected
const t04 = recordTest('T-108-04', 'Revoked session rejected', 'REAL_LOCAL_AUTH', async () => {
  const session = await createServerSession('gate');
  assert.equal(session.ok, true);

  const req = {
    headers: {
      cookie: `avani_gate_session=${session.token}`
    }
  };

  const verifyBefore = await verifyServerSession(req, 'gate');
  assert.equal(verifyBefore.authenticated, true);

  const revokeRes = await revokeServerSession(req, 'gate');
  assert.equal(revokeRes.revoked, true);

  const verifyAfter = await verifyServerSession(req, 'gate');
  assert.equal(verifyAfter.authenticated, false);
  assert.equal(verifyAfter.code, 'SESSION_REVOKED');
});

// T-108-05: KV outage fails closed
const t05 = recordTest('T-108-05', 'KV outage fails closed', 'SYNTHETIC_MOCK_KV', async () => {
  // When REQUIRE_DISTRIBUTED_KV is active but KV is not reachable, auth fails closed with 503
  process.env.REQUIRE_DISTRIBUTED_KV = '1';
  process.env.KV_REST_API_URL = 'https://fake-outage-upstash.io';
  process.env.KV_REST_API_TOKEN = 'fake-token';

  const session = await createServerSession('gate');
  assert.equal(session.ok, false);
  assert.equal(session.statusCode, 503);
  assert.equal(session.code, 'SESSION_BACKEND_UNAVAILABLE');

  delete process.env.REQUIRE_DISTRIBUTED_KV;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
});

// T-108-06: Legacy Bearer master password rejected
const t06 = recordTest('T-108-06', 'Legacy Bearer master password rejected in middleware', 'REAL_EDGE_MIDDLEWARE', async () => {
  const req = new Request('https://www.avaniagrofoods.com/api/admin-quotations', {
    method: 'GET',
    headers: {
      authorization: `Bearer ${process.env.MASTER_GATE_PASSWORD}`
    }
  });

  const res = middleware(req);
  assert.notEqual(res, undefined, 'Middleware must not allow raw master password Bearer bypass');
  assert.equal(res.status, 401);
});

// T-108-07: Legitimate admin cookie request reaches API handler
const t07 = recordTest('T-108-07', 'Legitimate admin cookie request reaches API handler', 'REAL_SERVERLESS_FLOW', async () => {
  const session = await createServerSession('gate');
  const req = createStreamReq({
    method: 'GET',
    url: '/api/admin-quotations',
    headers: {
      cookie: `avani_gate_session=${session.token}`,
      origin: 'https://www.avaniagrofoods.com'
    }
  });
  const res = createMockRes();

  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(Array.isArray(res.body.quotations), true);
});

// T-108-08: Unrelated admin routes remain protected
const t08 = recordTest('T-108-08', 'Unrelated admin routes without session remain protected', 'REAL_EDGE_MIDDLEWARE', async () => {
  const req = new Request('https://www.avaniagrofoods.com/api/admin-quotations?action=save', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    }
  });

  const res = middleware(req);
  assert.notEqual(res, undefined);
  assert.equal(res.status, 401);
});

// T-108-09: Exact webhook route reaches signature-verifying handler
const t09 = recordTest('T-108-09', 'Exact delivery-webhook route bypasses edge cookie check to handler', 'REAL_EDGE_MIDDLEWARE', async () => {
  const req = new Request('https://www.avaniagrofoods.com/api/admin-quotations?action=delivery-webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    }
  });

  const res = middleware(req);
  assert.equal(res, undefined, 'Exact delivery-webhook must pass through to API handler for Svix verification');
});

// T-108-10: Other admin routes cannot use webhook exemption
const t10 = recordTest('T-108-10', 'Other admin routes cannot use webhook exemption', 'REAL_EDGE_MIDDLEWARE', async () => {
  const req = new Request('https://www.avaniagrofoods.com/api/admin-quotations?action=delete-all', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    }
  });

  const res = middleware(req);
  assert.notEqual(res, undefined);
  assert.equal(res.status, 401);
});

// T-108-11: Original raw webhook body is verified
const t11 = recordTest('T-108-11', 'Original raw webhook stream bytes verified via Svix signature', 'REAL_STREAM_AND_SVIX', async () => {
  const payload = {
    type: 'email.delivered',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'd164d142-632b-45b7-a068-07cb1d71d37e',
      to: ['buyer@example.com']
    }
  };
  const rawBodyStr = JSON.stringify(payload);
  const svixHeaders = generateSvixHeaders(rawBodyStr, process.env.RESEND_WEBHOOK_SECRET);

  const req = createStreamReq({
    method: 'POST',
    url: '/api/admin-quotations?action=delivery-webhook',
    headers: svixHeaders,
    rawBody: rawBodyStr
  });
  const res = createMockRes();

  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.message.includes('Webhook signature verified'), true);
});

// T-108-12: Missing raw body is rejected
const t12 = recordTest('T-108-12', 'Missing raw body is rejected', 'REAL_SERVERLESS_HANDLER', async () => {
  const req = {
    method: 'POST',
    url: '/api/admin-quotations?action=delivery-webhook',
    headers: {
      'content-type': 'application/json'
    },
    rawBody: null,
    body: {}
  };
  const res = createMockRes();

  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'WEBHOOK_RAW_BODY_REQUIRED');
});

// T-108-13: Invalid signature is rejected
const t13 = recordTest('T-108-13', 'Invalid webhook signature is rejected', 'REAL_STREAM_AND_SVIX', async () => {
  const payload = { type: 'email.delivered' };
  const rawBodyStr = JSON.stringify(payload);
  const svixHeaders = generateSvixHeaders(rawBodyStr, 'whsec_WrongSecretKeyForTestingInvalidSig1234=');

  const req = createStreamReq({
    method: 'POST',
    url: '/api/admin-quotations?action=delivery-webhook',
    headers: svixHeaders,
    rawBody: rawBodyStr
  });
  const res = createMockRes();

  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, 'WEBHOOK_UNAUTHORIZED');
});

// T-108-14: Expired webhook timestamp is rejected
const t14 = recordTest('T-108-14', 'Expired webhook timestamp rejected outside 5-minute tolerance', 'REAL_STREAM_AND_SVIX', async () => {
  const payload = { type: 'email.delivered' };
  const rawBodyStr = JSON.stringify(payload);
  const svixHeaders = generateSvixHeaders(rawBodyStr, process.env.RESEND_WEBHOOK_SECRET);
  // Set timestamp to 10 minutes ago
  svixHeaders['svix-timestamp'] = String(Math.floor(Date.now() / 1000) - 600);

  const req = createStreamReq({
    method: 'POST',
    url: '/api/admin-quotations?action=delivery-webhook',
    headers: svixHeaders,
    rawBody: rawBodyStr
  });
  const res = createMockRes();

  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.code, 'WEBHOOK_UNAUTHORIZED');
});

// T-108-15: Valid provider event is mapped correctly
const t15 = recordTest('T-108-15', 'Valid provider event is mapped to quotation state', 'REAL_MODEL_LOGIC', async () => {
  const quotation = {
    quotationId: 'AAF-Q-2026-TEST',
    status: 'SENT_TO_BUYER',
    dispatch: {
      status: 'SENT',
      messageId: 'msg_resend_108',
      deliveryEvents: []
    },
    activity: []
  };

  const eventPayload = {
    id: 'evt_deliv_108',
    type: 'email.delivered',
    messageId: 'msg_resend_108',
    timestamp: new Date().toISOString()
  };

  const updated = processDeliveryWebhook(quotation, eventPayload, '', {
    verifiedSignature: true,
    requireSecret: true,
    requireEventId: true
  });

  assert.equal(updated.status, 'DELIVERED');
  assert.equal(updated.dispatch.deliveryStatus, 'DELIVERED');
});

// T-108-16: Duplicate event is idempotent (replay protection)
const t16 = recordTest('T-108-16', 'Duplicate event is rejected under replay protection', 'REAL_MODEL_LOGIC', async () => {
  const quotation = {
    quotationId: 'AAF-Q-2026-IDEMP',
    status: 'SENT_TO_BUYER',
    dispatch: { status: 'SENT', messageId: 'msg_dup_108' }
  };

  const eventPayload = {
    id: 'evt_unique_108',
    type: 'email.delivered',
    messageId: 'msg_dup_108'
  };

  processDeliveryWebhook(quotation, eventPayload, '', { verifiedSignature: true });

  assert.throws(() => {
    processDeliveryWebhook(quotation, eventPayload, '', { verifiedSignature: true });
  }, /Duplicate webhook event rejected/);
});

// T-108-17: Unknown event type is handled safely
const t17 = recordTest('T-108-17', 'Unknown event type handled safely without corrupting quotation', 'REAL_MODEL_LOGIC', async () => {
  const quotation = {
    quotationId: 'AAF-Q-2026-UNKNOWN',
    status: 'SENT_TO_BUYER',
    dispatch: { status: 'SENT', messageId: 'msg_unknown_108' }
  };

  const eventPayload = {
    id: 'evt_unknown_type_108',
    type: 'email.unrecognized_custom_action',
    messageId: 'msg_unknown_108'
  };

  const updated = processDeliveryWebhook(quotation, eventPayload, '', { verifiedSignature: true });
  assert.equal(updated.status, 'SENT_TO_BUYER', 'Quotation status must not be corrupted by unknown event type');
});

// T-108-18: Gate CSRF token works only for Gate session
const t18 = recordTest('T-108-18', 'Gate CSRF token works only for Gate session', 'REAL_CSRF_VERIFICATION', async () => {
  const gateSession = await createServerSession('gate');
  const req = {
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      'x-csrf-token': gateSession.csrfToken
    }
  };

  const check = verifyCsrfRequest(req, gateSession);
  assert.equal(check.valid, true);

  // Cross-role attempt: using Gate token for Affiliate session
  const affiliateSession = await createServerSession('affiliate');
  const crossCheck = verifyCsrfRequest(req, affiliateSession);
  assert.equal(crossCheck.valid, false);
  assert.equal(crossCheck.code, 'CSRF_TOKEN_INVALID');
});

// T-108-19: Affiliate CSRF token works only for Affiliate session
const t19 = recordTest('T-108-19', 'Affiliate CSRF token works only for Affiliate session', 'REAL_CSRF_VERIFICATION', async () => {
  const affiliateSession = await createServerSession('affiliate');
  const req = {
    headers: {
      origin: 'https://www.avaniagrofoods.com',
      'x-csrf-token': affiliateSession.csrfToken
    }
  };

  const check = verifyCsrfRequest(req, affiliateSession);
  assert.equal(check.valid, true);

  // Cross-role attempt: using Affiliate token for Gate session
  const gateSession = await createServerSession('gate');
  const crossCheck = verifyCsrfRequest(req, gateSession);
  assert.equal(crossCheck.valid, false);
  assert.equal(crossCheck.code, 'CSRF_TOKEN_INVALID');
});

// T-108-20: Simultaneous Gate/Affiliate sessions do not collide
const t20 = recordTest('T-108-20', 'Simultaneous Gate/Affiliate sessions do not collide', 'REAL_SESSION_SEPARATION', async () => {
  const gateSession = await createServerSession('gate');
  const affSession = await createServerSession('affiliate');

  assert.notEqual(gateSession.sessionId, affSession.sessionId);
  assert.notEqual(gateSession.csrfToken, affSession.csrfToken);

  const gateReq = { headers: { cookie: `avani_gate_session=${gateSession.token}` } };
  const affReq = { headers: { cookie: `avani_affiliate_session=${affSession.token}` } };

  const verifiedGate = await verifyServerSession(gateReq, 'gate');
  const verifiedAff = await verifyServerSession(affReq, 'affiliate');

  assert.equal(verifiedGate.authenticated, true);
  assert.equal(verifiedGate.role, 'gate');

  assert.equal(verifiedAff.authenticated, true);
  assert.equal(verifiedAff.role, 'affiliate');
});

// T-108-21: Client actor override cannot change persisted audit actor
const t21 = recordTest('T-108-21', 'Client actor override cannot change server persisted audit actor', 'REAL_SERVERLESS_HANDLER', async () => {
  const session = await createServerSession('gate');
  const req = createStreamReq({
    method: 'POST',
    url: '/api/admin-quotations',
    headers: {
      cookie: `avani_gate_session=${session.token}`,
      origin: 'https://www.avaniagrofoods.com',
      'x-csrf-token': session.csrfToken
    },
    body: {
      action: 'save',
      quoteData: {
        buyerName: 'Global Trader Corp',
        items: [{ id: 1, name: 'Moringa Powder', quantity: 100, rate: 50, amount: 5000 }],
        owner: 'MaliciousAttackerOverride',
        actor: 'MaliciousAttackerOverride',
        updatedBy: 'MaliciousAttackerOverride'
      }
    }
  });
  const res = createMockRes();

  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.quote.updatedBy, session.actor, 'Server must enforce session actor over client override');
  assert.equal(res.body.quote.owner, session.actor, 'Server must enforce session actor over client override');
});

// T-108-22: Missing Origin behavior matches endpoint policy
const t22 = recordTest('T-108-22', 'Missing Origin behavior matches endpoint mutation policy', 'REAL_AUTH_POLICY', async () => {
  // Mutation Origin check requires Origin or Referer
  const mutationReq = { headers: {} };
  const check = validateMutationOrigin(mutationReq);
  assert.equal(check.valid, false);
  assert.equal(check.code, 'ORIGIN_MISSING');
});

// T-108-23: Existing quotation operations remain functional
const t23 = recordTest('T-108-23', 'Existing quotation operations remain functional', 'REAL_CALCULATION_ENGINE', async () => {
  const session = await createServerSession('gate');
  const req = createStreamReq({
    method: 'POST',
    url: '/api/admin-quotations',
    headers: {
      cookie: `avani_gate_session=${session.token}`,
      origin: 'https://www.avaniagrofoods.com',
      'x-csrf-token': session.csrfToken
    },
    body: {
      action: 'generate',
      quoteData: {
        buyerName: 'European Bio Imports',
        country: 'Germany',
        currency: 'EUR',
        items: [{ id: 1, name: 'Moringa Leaf Powder', quantity: 1000, rate: 12.5, amount: 12500 }]
      }
    }
  });
  const res = createMockRes();

  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.quote.grandTotal > 0, true);
});

// T-108-24: Existing logout and session revocation behavior remains functional
const t24 = recordTest('T-108-24', 'Existing logout and session revocation behavior remains functional', 'REAL_LOGOUT_HANDLER', async () => {
  const session = await createServerSession('gate');
  const req = {
    method: 'POST',
    url: '/api/verify-gate',
    headers: {
      cookie: `avani_gate_session=${session.token}`,
      origin: 'https://www.avaniagrofoods.com',
      'x-csrf-token': session.csrfToken
    },
    body: { action: 'logout' }
  };
  const res = createMockRes();

  await verifyGateHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.loggedOut, true);

  // Post-logout verification fails
  const verifyCheck = await verifyServerSession(req, 'gate');
  assert.equal(verifyCheck.authenticated, false);
});

// ────────────────────────────────────────────────────────────
// RUN ALL TESTS
// ────────────────────────────────────────────────────────────
async function runAll() {
  console.log('====================================================');
  console.log('PACKAGE 3F.108 — REGRESSION VERIFICATION EXECUTION');
  console.log('====================================================\n');

  const tests = [
    t01, t02, t03, t04, t05, t06, t07, t08, t09, t10,
    t11, t12, t13, t14, t15, t16, t17, t18, t19, t20,
    t21, t22, t23, t24
  ];

  for (const t of tests) {
    await t();
  }

  console.log('\n====================================================');
  console.log('TEST SUMMARY');
  console.log('====================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error('\nFAILED TESTS:');
    for (const f of results.filter(r => !r.passed)) {
      console.error(`- ${f.id}: ${f.name} -> ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\nALL 24 TARGETED REGRESSION TESTS PASSED LOCALLY.');
    process.exit(0);
  }
}

runAll();
