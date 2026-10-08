// ============================================================
// AVANI AGRO FOODS — PHASE 3K TEST SUITE
// scripts/test_phase_3k_webhook.cjs
// Phase 3K: Webhook Registration, Signature Verification & Safety
// ============================================================

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Isolate test store so test_phase_3k_webhook never resets the production sequenceStateStore.json
const scratchDir = path.resolve(__dirname, '../scratch');
if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
const testStorePath = path.join(scratchDir, 'test_phase_3k_store.json');
fs.writeFileSync(testStorePath, JSON.stringify({
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  sequences: {},
  idempotencyKeys: {},
  reservations: {},
  processedEvents: {},
  auditLog: []
}, null, 2), 'utf8');
process.env.SEQUENCE_STORE_PATH = testStorePath;

// Use a well-formed whsec_-prefixed Base64 test secret
// This is a DUMMY secret for testing ONLY — not a real production value.
const TEST_WEBHOOK_SECRET = 'whsec_dGVzdF93ZWJob29rX3NlY3JldF8zMmJ5dGVzX2FhZjEyMw==';
process.env.RESEND_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

console.log('============================================================');
console.log('TEST SUITE: Phase 3K — Webhook Infrastructure & Safety');
console.log('============================================================\n');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a valid Svix-style signature for the given body + headers.
 * The endpoint derives the key by base64-decoding everything after 'whsec_'.
 */
function buildSvixSignature(rawBody, svixId, svixTimestamp, secret) {
  const cleanSecret = secret.startsWith('whsec_') ? secret.substring(6) : secret;
  const key = Buffer.from(cleanSecret, 'base64');
  const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
  const sig = crypto.createHmac('sha256', key).update(toSign).digest('base64');
  return `v1,${sig}`;
}

/**
 * Create a minimal mock res object that captures status + json.
 */
function mockRes() {
  const obj = {
    _code: 0,
    _json: null,
    _headers: {}
  };
  obj.setHeader = (k, v) => { obj._headers[k] = v; };
  obj.status = (code) => {
    obj._code = code;
    return { json: (data) => { obj._json = data; } };
  };
  return obj;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function runTests() {
  const webhookHandler = (await import('../api/email-reply-webhook.js')).default;

  let passed = 0;
  let failed = 0;

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // ===========================================================================
  // A. HTTP METHOD RESTRICTION
  // ===========================================================================

  await testAsync('A1. GET request is rejected with HTTP 405 Method Not Allowed', async () => {
    const res = mockRes();
    await webhookHandler({ method: 'GET', headers: {}, body: {} }, res);
    assert.strictEqual(res._code, 405, `Expected 405, got ${res._code}`);
  });

  await testAsync('A2. DELETE request is rejected with HTTP 405', async () => {
    const res = mockRes();
    await webhookHandler({ method: 'DELETE', headers: {}, body: {} }, res);
    assert.strictEqual(res._code, 405, `Expected 405, got ${res._code}`);
  });

  await testAsync('A3. PUT request is rejected with HTTP 405', async () => {
    const res = mockRes();
    await webhookHandler({ method: 'PUT', headers: {}, body: {} }, res);
    assert.strictEqual(res._code, 405, `Expected 405, got ${res._code}`);
  });

  // ===========================================================================
  // B. MISSING / INVALID SIGNATURE REJECTION
  // ===========================================================================

  await testAsync('B1. POST with no signature headers at all → HTTP 401 WEBHOOK_UNAUTHORIZED', async () => {
    const res = mockRes();
    await webhookHandler(
      { method: 'POST', headers: {}, body: { type: 'email.received' } },
      res
    );
    assert.strictEqual(res._code, 401, `Expected 401, got ${res._code}`);
    assert.strictEqual(res._json?.code, 'WEBHOOK_UNAUTHORIZED');
  });

  await testAsync('B2. POST with svix-id+timestamp but no svix-signature → HTTP 401', async () => {
    const res = mockRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: { 'svix-id': 'msg_001', 'svix-timestamp': String(Math.floor(Date.now() / 1000)) },
        body: { type: 'email.received' }
      },
      res
    );
    assert.strictEqual(res._code, 401, `Expected 401, got ${res._code}`);
    assert.strictEqual(res._json?.code, 'WEBHOOK_UNAUTHORIZED');
  });

  await testAsync('B3. POST with completely wrong signature value → HTTP 401', async () => {
    const now = Math.floor(Date.now() / 1000);
    const res = mockRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: {
          'svix-id': 'msg_bad_002',
          'svix-timestamp': String(now),
          'svix-signature': 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
        },
        body: { type: 'email.received' }
      },
      res
    );
    assert.strictEqual(res._code, 401, `Expected 401, got ${res._code}`);
    assert.strictEqual(res._json?.code, 'WEBHOOK_UNAUTHORIZED');
  });

  await testAsync('B4. POST with replayed (stale) svix-timestamp (>5 min old) → HTTP 401', async () => {
    const staleTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
    const rawBody = JSON.stringify({ type: 'email.received' });
    const svixId = 'msg_replay_003';
    const sig = buildSvixSignature(rawBody, svixId, String(staleTimestamp), TEST_WEBHOOK_SECRET);
    const res = mockRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: {
          'svix-id': svixId,
          'svix-timestamp': String(staleTimestamp),
          'svix-signature': sig
        },
        body: rawBody   // raw string body to match signature exactly
      },
      res
    );
    assert.strictEqual(res._code, 401, `Expected 401 for stale timestamp, got ${res._code}`);
  });

  // ===========================================================================
  // C. VALID SIGNATURE ACCEPTED
  // ===========================================================================

  await testAsync('C1. POST with valid Svix signature → accepted (not 401)', async () => {
    const now = Math.floor(Date.now() / 1000);
    const body = { type: 'email.delivered', data: { email_id: 'evt_k3_valid_001', to: ['nobody@example.com'] } };
    const rawBody = JSON.stringify(body);
    const svixId = 'msg_valid_004';
    const sig = buildSvixSignature(rawBody, svixId, String(now), TEST_WEBHOOK_SECRET);
    const res = mockRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: {
          'svix-id': svixId,
          'svix-timestamp': String(now),
          'svix-signature': sig
        },
        body: rawBody
      },
      res
    );
    assert.notStrictEqual(res._code, 401, `Valid request must not be rejected with 401. Got ${res._code}`);
    assert.notStrictEqual(res._code, 500, `Valid request must not return 500. Got ${res._code}`);
  });

  // ===========================================================================
  // D. MALFORMED PAYLOAD HANDLING
  // ===========================================================================

  await testAsync('D1. POST with null body but valid direct-secret header → handled safely (not crash)', async () => {
    const res = mockRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: { 'x-webhook-secret': TEST_WEBHOOK_SECRET },
        body: null
      },
      res
    );
    // Must not throw — either 400 or graceful 200 or 401 are acceptable; key: no unhandled exception
    assert.ok(
      [200, 400, 401].includes(res._code),
      `Expected 200/400/401 for null body, got ${res._code}`
    );
  });

  await testAsync('D2. POST with empty object body and valid direct-secret → handled safely', async () => {
    const res = mockRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: { 'x-webhook-secret': TEST_WEBHOOK_SECRET },
        body: {}
      },
      res
    );
    // Should be 200 (unmatched event, gracefully ignored) or 400
    assert.ok(
      [200, 400].includes(res._code),
      `Expected 200 or 400 for empty object, got ${res._code}`
    );
  });

  // ===========================================================================
  // E. BOUNCE EVENT HANDLING
  // ===========================================================================

  await testAsync('E1. Bounce event is acknowledged without triggering outreach', async () => {
    const now = Math.floor(Date.now() / 1000);
    const body = {
      type: 'email.bounced',
      id: 'evt_bounce_k3_001',
      data: { to: ['bounced@example.com'], email_id: 'evt_bounce_k3_001' }
    };
    const rawBody = JSON.stringify(body);
    const svixId = 'msg_bounce_005';
    const sig = buildSvixSignature(rawBody, svixId, String(now), TEST_WEBHOOK_SECRET);
    const res = mockRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: { 'svix-id': svixId, 'svix-timestamp': String(now), 'svix-signature': sig },
        body: body   // parsed object — matches Vercel runtime behavior
      },
      res
    );
    assert.strictEqual(res._code, 200, `Expected 200 for bounce, got ${res._code}`);
    assert.strictEqual(res._json?.action, 'BOUNCE_ACKNOWLEDGED');
  });

  // ===========================================================================
  // F. OUTREACH SAFETY — WEBHOOK MUST NOT TRIGGER BUYER OUTREACH
  // ===========================================================================

  test('F1. No buyer outreach constant is modified by webhook processing (invariant check)', () => {
    // The webhook handler must not change process.env.OUTREACH_AUTHORIZED etc.
    // We check that the env vars are absent/zero (they are not set by app code in env).
    // The real guard is that OUTREACH_AUTHORIZED lives in the state machine options,
    // not in process.env — but we verify no monkey-patching happened.
    const outreachAuth = process.env.OUTREACH_AUTHORIZED;
    const pilotAuth = process.env.PILOT_AUTHORIZED;
    const globalStop = process.env.GLOBAL_OUTREACH_STOP;

    // None of these should have been SET to "1" by webhook processing
    assert.notStrictEqual(outreachAuth, '1', 'OUTREACH_AUTHORIZED must not be 1 after webhook tests');
    assert.notStrictEqual(pilotAuth, '1', 'PILOT_AUTHORIZED must not be 1 after webhook tests');
    assert.notStrictEqual(globalStop, '0', 'GLOBAL_OUTREACH_STOP must not be 0 after webhook tests');
  });

  // ===========================================================================
  // G. SECURITY RESPONSE HEADERS
  // ===========================================================================

  await testAsync('G1. Webhook response includes security headers (nosniff, deny frame)', async () => {
    const now = Math.floor(Date.now() / 1000);
    const body = { type: 'email.delivered', data: { email_id: 'evt_hdr_001' } };
    const rawBody = JSON.stringify(body);
    const svixId = 'msg_hdr_006';
    const sig = buildSvixSignature(rawBody, svixId, String(now), TEST_WEBHOOK_SECRET);
    const res = mockRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: { 'svix-id': svixId, 'svix-timestamp': String(now), 'svix-signature': sig },
        body: body   // parsed object — Vercel runtime pre-parses JSON
      },
      res
    );
    assert.strictEqual(res._headers['X-Content-Type-Options'], 'nosniff');
    assert.strictEqual(res._headers['X-Frame-Options'], 'DENY');
    assert.ok(res._headers['Cache-Control']?.includes('no-store'));
  });

  // ===========================================================================
  // H. REPLAY DUPLICATE PROTECTION
  // ===========================================================================

  await testAsync('H1. Same event ID submitted twice → second is acknowledged as duplicate (idempotent)', async () => {
    const { resetSequenceStoreForTesting, recordProcessedEvent, hasEventBeenProcessed } =
      await import('../api/_lib/sequencePersistence.js');

    resetSequenceStoreForTesting();
    const eventId = 'evt_k3_replay_test_777';
    assert.strictEqual(hasEventBeenProcessed(eventId), false, 'Event should not be processed yet');
    recordProcessedEvent(eventId, { type: 'test' });
    assert.strictEqual(hasEventBeenProcessed(eventId), true, 'Event should now be marked processed');

    // Now submit to webhook with the same event ID
    const now = Math.floor(Date.now() / 1000);
    const body = { type: 'email.delivered', id: eventId, data: { email_id: eventId } };
    const rawBody = JSON.stringify(body);
    const svixId = eventId; // svix-id acts as event ID
    const sig = buildSvixSignature(rawBody, svixId, String(now), TEST_WEBHOOK_SECRET);
    const res = mockRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: { 'svix-id': svixId, 'svix-timestamp': String(now), 'svix-signature': sig },
        body: body   // parsed object — Vercel runtime pre-parses JSON
      },
      res
    );
    assert.strictEqual(res._code, 200, `Expected 200 for duplicate, got ${res._code}`);
    assert.strictEqual(res._json?.duplicate, true, 'Duplicate flag must be true');
    assert.strictEqual(res._json?.code, 'EVENT_ALREADY_PROCESSED');
  });

  // ===========================================================================
  // I. ENVIRONMENT VARIABLE NAMING AUDIT
  // ===========================================================================

  test('I1. Source code canonical variable is RESEND_WEBHOOK_SECRET (not RESEND_WEBHOOK_SECRET1)', () => {
    const fs = require('fs');
    const path = require('path');
    const webhookSrc = fs.readFileSync(
      path.resolve(__dirname, '../api/email-reply-webhook.js'),
      'utf8'
    );
    // Must reference RESEND_WEBHOOK_SECRET
    assert.ok(
      webhookSrc.includes('RESEND_WEBHOOK_SECRET'),
      'Webhook source must reference RESEND_WEBHOOK_SECRET'
    );
    // Must NOT reference RESEND_WEBHOOK_SECRET1 as the canonical name
    // (It may appear in the string 'RESEND_WEBHOOK_SECRET' as substring — only check standalone reference)
    const has1Variant = /process\.env\.RESEND_WEBHOOK_SECRET1/.test(webhookSrc);
    assert.strictEqual(
      has1Variant,
      false,
      'Webhook source must NOT reference RESEND_WEBHOOK_SECRET1 (misspelled)'
    );
  });

  test('I2. No secret value appears in source files (no literal whsec_ in production tracked code)', () => {
    const fs = require('fs');
    const path = require('path');
    // Check the two core files for literal secret leakage
    const filesToCheck = [
      '../api/email-reply-webhook.js',
      '../api/_lib/replyDetector.js',
      '../api/_lib/sequencePersistence.js',
      '../api/_lib/sequenceStateMachine.js'
    ];
    for (const rel of filesToCheck) {
      const content = fs.readFileSync(path.resolve(__dirname, rel), 'utf8');
      // Should not contain a hard-coded whsec_ secret value (test file values are acceptable in test scripts only)
      const hasHardcodedSecret = /whsec_[A-Za-z0-9+/=]{20,}/.test(content);
      assert.strictEqual(
        hasHardcodedSecret,
        false,
        `Hard-coded webhook secret found in ${rel} — this is a security violation`
      );
    }
  });

  // ===========================================================================
  // J. WEBHOOK EVENT TYPES SUPPORTED
  // ===========================================================================

  test('J1. Webhook handler source covers email.received event type', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.resolve(__dirname, '../api/email-reply-webhook.js'), 'utf8');
    assert.ok(src.includes('email.received') || src.includes('processInboundReply'), 
      'Webhook must handle email.received events');
  });

  test('J2. Webhook handler source covers email.bounced / bounce events', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.resolve(__dirname, '../api/email-reply-webhook.js'), 'utf8');
    assert.ok(src.includes('bounce'), 'Webhook must handle bounce events');
  });

  // ===========================================================================
  // Summary
  // ===========================================================================

  console.log(`\n============================================================`);
  console.log(`PHASE 3K RESULTS: ${passed} passed, ${failed} failed.`);
  console.log(`============================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
