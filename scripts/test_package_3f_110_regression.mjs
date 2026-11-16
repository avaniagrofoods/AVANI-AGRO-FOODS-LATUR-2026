// ============================================================
// PACKAGE 3F.110 — COMPREHENSIVE REGRESSION TEST SUITE
// Verifies Server-side Quotation Persistence, Durable Webhook
// Idempotency, Schema Migration Safety, Actor Attribution & Rollback
// ============================================================

import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`[FAIL] ${testName}:`, err.message);
  }
}

async function runAsyncTest(testName, testFn) {
  totalTests++;
  try {
    await testFn();
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`[FAIL] ${testName}:`, err.message);
  }
}

console.log('============================================================');
console.log('RUNNING PACKAGE 3F.110 REGRESSION SUITE');
console.log('============================================================\n');

// ------------------------------------------------------------
// TEST GROUP 1: Supabase Schema Migration (20261110_quotations_table.sql)
// ------------------------------------------------------------
runTest('T-110-01: Migration file 20261110_quotations_table.sql exists and is non-empty', () => {
  const migPath = path.join(projectRoot, 'supabase', 'migrations', '20261110_quotations_table.sql');
  assert.ok(fs.existsSync(migPath), 'Migration file must exist');
  const sql = fs.readFileSync(migPath, 'utf8');
  assert.ok(sql.length > 200, 'Migration file must have meaningful content');
});

runTest('T-110-02: Migration includes all mandatory delivery and provider tracking columns', () => {
  const migPath = path.join(projectRoot, 'supabase', 'migrations', '20261110_quotations_table.sql');
  const sql = fs.readFileSync(migPath, 'utf8');
  
  const requiredColumns = [
    'buyer_email',
    'provider_message_id',
    'provider_name',
    'sent_at',
    'delivered_at',
    'bounced_at',
    'delivery_status',
    'created_by',
    'updated_by'
  ];
  for (const col of requiredColumns) {
    assert.ok(sql.includes(col), `Migration must contain column ${col}`);
  }
});

runTest('T-110-03: Migration defines indexes, unique provider message constraint, and RLS', () => {
  const migPath = path.join(projectRoot, 'supabase', 'migrations', '20261110_quotations_table.sql');
  const sql = fs.readFileSync(migPath, 'utf8');

  assert.ok(sql.includes('idx_quotations_provider_message_id'), 'Must index provider_message_id');
  assert.ok(sql.includes('idx_quotations_unique_provider_msg'), 'Must enforce unique provider_message_id index');
  assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'), 'Must enable RLS');
  assert.ok(sql.includes('Service role has full access'), 'Must permit service_role');
  assert.ok(sql.includes('Deny all public access'), 'Must deny anon access');
});

// ------------------------------------------------------------
// TEST GROUP 2: Supabase Client Quotation Methods
// ------------------------------------------------------------
await runAsyncTest('T-110-04: saveQuotationToSupabase returns SUPABASE_UNCONFIGURED when env vars absent', async () => {
  const origUrl = process.env.SUPABASE_URL;
  const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;

    const { saveQuotationToSupabase } = await import(`../api/_lib/supabaseClient.js?t=${Date.now()}`);
    const result = await saveQuotationToSupabase({ quoteId: 'AAF-TEST-001', buyerName: 'Test Buyer' });
    assert.strictEqual(result.persisted, false);
    assert.strictEqual(result.status, 'SUPABASE_UNCONFIGURED');
    assert.strictEqual(result.quoteId, 'AAF-TEST-001');
  } finally {
    if (origUrl) process.env.SUPABASE_URL = origUrl;
    if (origKey) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
  }
});

await runAsyncTest('T-110-05: getQuotationByIdFromSupabase and getQuotationByMessageIdFromSupabase fail safely unconfigured', async () => {
  const origUrl = process.env.SUPABASE_URL;
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;

    const { getQuotationByIdFromSupabase, getQuotationByMessageIdFromSupabase } = await import(`../api/_lib/supabaseClient.js?t=${Date.now()}`);
    const byId = await getQuotationByIdFromSupabase('AAF-TEST-001');
    assert.strictEqual(byId.success, false);
    assert.strictEqual(byId.quotation, null);

    const byMsg = await getQuotationByMessageIdFromSupabase('msg-test-123');
    assert.strictEqual(byMsg.success, false);
    assert.strictEqual(byMsg.quotation, null);
  } finally {
    if (origUrl) process.env.SUPABASE_URL = origUrl;
  }
});

await runAsyncTest('T-110-06: updateQuotationDeliveryStatusInSupabase fails safely unconfigured', async () => {
  const origUrl = process.env.SUPABASE_URL;
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;

    const { updateQuotationDeliveryStatusInSupabase } = await import(`../api/_lib/supabaseClient.js?t=${Date.now()}`);
    const res = await updateQuotationDeliveryStatusInSupabase('AAF-TEST-001', { deliveryStatus: 'delivered' });
    assert.strictEqual(res.success, false);
  } finally {
    if (origUrl) process.env.SUPABASE_URL = origUrl;
  }
});

await runAsyncTest('T-110-07: fetchQuotationsFromSupabase fails safely unconfigured', async () => {
  const origUrl = process.env.SUPABASE_URL;
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;

    const { fetchQuotationsFromSupabase } = await import(`../api/_lib/supabaseClient.js?t=${Date.now()}`);
    const res = await fetchQuotationsFromSupabase({ limit: 10 });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.unconfigured, true);
    assert.deepStrictEqual(res.quotations, []);
  } finally {
    if (origUrl) process.env.SUPABASE_URL = origUrl;
  }
});

// ------------------------------------------------------------
// TEST GROUP 3: Distributed Webhook Idempotency (quotationModel.js)
// ------------------------------------------------------------
await runAsyncTest('T-110-08: claimQuotationWebhookDistributed successfully claims new event ID', async () => {
  const { claimQuotationWebhookDistributed } = await import(`../api/_lib/quotationModel.js?t=${Date.now()}`);
  const testEventId = `evt_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const claim = await claimQuotationWebhookDistributed(testEventId, 'test-worker-1', 60);

  assert.strictEqual(claim.claimed, true);
  assert.strictEqual(claim.duplicate, false);
  assert.strictEqual(claim.status, 'CLAIMED');
});

await runAsyncTest('T-110-09: claimQuotationWebhookDistributed rejects duplicate in-flight / processed event ID', async () => {
  const { claimQuotationWebhookDistributed } = await import(`../api/_lib/quotationModel.js?t=${Date.now()}`);
  const testEventId = `evt_test_dup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const claim1 = await claimQuotationWebhookDistributed(testEventId, 'test-worker-1', 60);
  assert.strictEqual(claim1.claimed, true);

  const claim2 = await claimQuotationWebhookDistributed(testEventId, 'test-worker-2', 60);
  assert.strictEqual(claim2.claimed, false);
  assert.strictEqual(claim2.duplicate, true);
  assert.strictEqual(claim2.status, 'CLAIMED');
});

await runAsyncTest('T-110-10: completeQuotationWebhookDistributed marks event as PROCESSED', async () => {
  const { claimQuotationWebhookDistributed, completeQuotationWebhookDistributed } = await import(`../api/_lib/quotationModel.js?t=${Date.now()}`);
  const testEventId = `evt_test_comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  await claimQuotationWebhookDistributed(testEventId, 'test-worker-1', 60);
  const comp = await completeQuotationWebhookDistributed(testEventId, { result: 'OK' }, 604800, 'test-worker-1');
  assert.strictEqual(comp.completed, true);

  // Subsequent claim must detect PROCESSED
  const claimAgain = await claimQuotationWebhookDistributed(testEventId, 'test-worker-3', 60);
  assert.strictEqual(claimAgain.claimed, false);
  assert.strictEqual(claimAgain.duplicate, true);
  assert.strictEqual(claimAgain.status, 'PROCESSED');
});

await runAsyncTest('T-110-11: processDeliveryWebhookAsync rejects duplicate webhook events with DUPLICATE_WEBHOOK_EVENT', async () => {
  const { processDeliveryWebhookAsync } = await import(`../api/_lib/quotationModel.js?t=${Date.now()}`);
  const testEventId = `evt_async_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fakeQuote = {
    quotationId: 'AAF-2026-TEST',
    status: 'SENT',
    dispatch: { messageId: 'msg-async-1', deliveryEvents: [] },
    activity: []
  };

  const payload = {
    id: testEventId,
    type: 'email.delivered',
    data: { messageId: 'msg-async-1' }
  };

  // First execution succeeds
  const updated = await processDeliveryWebhookAsync(fakeQuote, payload, '', { requireSecret: false });
  assert.strictEqual(updated.status, 'DELIVERED');

  // Second execution with same eventId throws duplicate error
  let threw = false;
  try {
    await processDeliveryWebhookAsync(fakeQuote, payload, '', { requireSecret: false });
  } catch (err) {
    threw = true;
    assert.strictEqual(err.code, 'DUPLICATE_WEBHOOK_EVENT');
  }
  assert.ok(threw, 'Must throw duplicate webhook error on replay');
});

const createRes = () => {
  const res = {
    statusCode: null,
    jsonData: null,
    headers: {},
    setHeader(name, val) { this.headers[name] = val; return this; },
    getHeader(name) { return this.headers[name]; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };
  return res;
};

// ------------------------------------------------------------
// TEST GROUP 4: Admin Quotations Handler Delivery & Persistence
// ------------------------------------------------------------
await runAsyncTest('T-110-12: admin-quotations delivery-webhook idempotently acknowledges duplicates', async () => {
  const handler = (await import(`../api/admin-quotations.js?t=${Date.now()}`)).default;
  const testEventId = `evt_admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const secretKey = 'my-secret-payload-key-1234567890';
  const rawSecretBytes = Buffer.from(secretKey);
  const base64Secret = rawSecretBytes.toString('base64');
  const fullSecret = `whsec_${base64Secret}`;
  process.env.RESEND_WEBHOOK_SECRET = fullSecret;

  const createReq = (bodyObj) => {
    const raw = JSON.stringify(bodyObj);
    const ts = String(Math.floor(Date.now() / 1000));
    const signedContent = `${testEventId}.${ts}.${raw}`;
    const sig = crypto.createHmac('sha256', rawSecretBytes).update(signedContent, 'utf8').digest('base64');

    return {
      method: 'POST',
      query: { action: 'delivery-webhook' },
      headers: {
        'content-type': 'application/json',
        'content-length': String(Buffer.byteLength(raw)),
        'svix-id': testEventId,
        'svix-timestamp': ts,
        'svix-signature': `v1,${sig}`
      },
      rawBody: raw,
      body: bodyObj
    };
  };

  const payload = {
    id: testEventId,
    type: 'email.delivered',
    data: { email_id: 'msg-resend-test-01' }
  };

  // Turn 1: Process initial delivery webhook
  const res1 = createRes();
  await handler(createReq(payload), res1);
  assert.strictEqual(res1.statusCode, 200);
  assert.strictEqual(res1.jsonData.success, true);
  assert.strictEqual(res1.jsonData.eventId, testEventId);

  // Turn 2: Replay same delivery webhook
  const res2 = createRes();
  await handler(createReq(payload), res2);
  assert.strictEqual(res2.statusCode, 200);
  assert.strictEqual(res2.jsonData.success, true);
  assert.strictEqual(res2.jsonData.duplicate, true);
});

await runAsyncTest('T-110-13: admin-quotations GET returns sample quotes with source: fallback when unconfigured', async () => {
  const origUrl = process.env.SUPABASE_URL;
  const origSecret = process.env.SESSION_SECRET;
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    process.env.SESSION_SECRET = origSecret || 'test-session-secret-key-32-characters-minimum';

    const handler = (await import(`../api/admin-quotations.js?t=${Date.now()}`)).default;
    const { createServerSession } = await import('../api/_lib/auth.js');
    const session = await createServerSession('gate', { ip: '127.0.0.1', userAgent: 'test-agent' });
    assert.strictEqual(session.ok, true, `Session creation must succeed: ${session.error}`);

    const req = {
      method: 'GET',
      query: {},
      headers: {
        cookie: `avani_gate_session=${session.token}`,
        'user-agent': 'test-agent'
      }
    };

    const res = createRes();

    await handler(req, res);
    assert.strictEqual(res.statusCode, 200, `Must return 200, got ${res.statusCode}: ${JSON.stringify(res.jsonData)}`);
    assert.strictEqual(res.jsonData.success, true);
    assert.strictEqual(res.jsonData.source, 'fallback');
    assert.ok(Array.isArray(res.jsonData.quotations));
  } finally {
    if (origUrl) process.env.SUPABASE_URL = origUrl;
    if (origSecret) process.env.SESSION_SECRET = origSecret;
    else delete process.env.SESSION_SECRET;
  }
});

// ------------------------------------------------------------
// TEST GROUP 5: Residual Actor Attribution Verification
// ------------------------------------------------------------
runTest('T-110-14: PrivateDashboard.jsx lines 179, 232, 246 do not contain hardcoded Sachin Shinde', () => {
  const dashPath = path.join(projectRoot, 'src', 'pages', 'PrivateDashboard.jsx');
  const content = fs.readFileSync(dashPath, 'utf8');
  const lines = content.split('\n');
  
  // Check lines 170 to 255
  const slice = lines.slice(170, 255).join('\n');
  assert.ok(!slice.includes("'Sachin Shinde'"), 'PrivateDashboard.jsx must not contain hardcoded Sachin Shinde in actor/owner slots');
  assert.ok(slice.includes("'authenticated_operator'"), 'Must use authenticated_operator');
});

runTest('T-110-15: Contact.jsx line 280 does not contain hardcoded Sachin Shinde', () => {
  const contactPath = path.join(projectRoot, 'src', 'pages', 'Contact.jsx');
  const content = fs.readFileSync(contactPath, 'utf8');
  const lines = content.split('\n');
  
  const slice = lines.slice(270, 290).join('\n');
  assert.ok(!slice.includes("'Sachin Shinde'"), 'Contact.jsx line 280 must not contain hardcoded Sachin Shinde');
  assert.ok(slice.includes("'authenticated_operator'"), 'Must use authenticated_operator');
});

runTest('T-110-16: supabase/schema.sql does not contain hardcoded Sachin Shinde in performed_by default', () => {
  const schemaPath = path.join(projectRoot, 'supabase', 'schema.sql');
  const content = fs.readFileSync(schemaPath, 'utf8');
  
  assert.ok(!content.includes("DEFAULT 'Sachin Shinde'"), 'schema.sql must not have DEFAULT Sachin Shinde');
  assert.ok(content.includes("DEFAULT 'authenticated_operator'"), 'Must have DEFAULT authenticated_operator');
});

// ------------------------------------------------------------
// TEST GROUP 6: Preservation of Package 3F.108 Protections
// ------------------------------------------------------------
await runAsyncTest('T-110-17: Preserved: CSRF token roles separation (admin vs affiliate)', async () => {
  const { generateCsrfToken } = await import('../api/_lib/auth.js');
  const secret = 'test-secret-key-12345678901234567890';
  const gateToken = generateCsrfToken('session-123', secret, 'gate');
  const affToken = generateCsrfToken('session-123', secret, 'affiliate');

  assert.notStrictEqual(gateToken, affToken, 'CSRF tokens for gate and affiliate must differ');
  assert.strictEqual(generateCsrfToken('session-123', secret, 'gate'), gateToken);
  assert.strictEqual(generateCsrfToken('session-123', secret, 'affiliate'), affToken);
});

runTest('T-110-18: Preserved: middleware.js accepts 64-hex SHA-256 session tokens', () => {
  const mwPath = path.join(projectRoot, 'middleware.js');
  const code = fs.readFileSync(mwPath, 'utf8');
  assert.ok(code.includes('^[a-f0-9]{64}$'), 'middleware must accept 64-character lowercase hex tokens');
});

console.log('\n============================================================');
console.log(`PACKAGE 3F.110 TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('============================================================');

if (failedTests > 0) {
  process.exit(1);
}
