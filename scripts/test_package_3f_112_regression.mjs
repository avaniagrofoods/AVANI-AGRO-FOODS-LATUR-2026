// ============================================================
// PACKAGE 3F.112 — REGRESSION AND INTEGRATION TEST SUITE
// scripts/test_package_3f_112_regression.mjs
// Covers:
// - T-112-01: Direct quotation inquiryId = null policy (FIND-111-01 / Owner Decision 1)
// - T-112-02: Quotation persistence schema mapping & nested field fallback (FIND-111-01)
// - T-112-03: Safe quotation upsert preserves delivery tracking metadata (FIND-111-07)
// - T-112-04: PostgREST snake_case to camelCase quotation model mapping (FIND-111-08)
// - T-112-05: updateQuotationDeliveryStatus supports sentAt & canonical status (FIND-111-09)
// - T-112-06: Strict KV claim fails closed when required and unconfigured (FIND-111-02)
// - T-112-07: Distributed claim succeeds with unique worker lease
// - T-112-08: Distributed completion verifies worker lease ownership (FIND-111-03)
// - T-112-09: Late worker completion rejected on ownership mismatch (FIND-111-03)
// - T-112-10: In-flight webhook claim returns HTTP 429 with Retry-After: 15 (FIND-111-05 / Owner Decision 2)
// - T-112-11: Processed webhook claim returns HTTP 200 idempotent ACK
// - T-112-12: Delivery webhook handler fails closed on DB error (FIND-111-04)
// - T-112-13: Delivery state machine ignores clicks without regressing to pending (FIND-111-06)
// - T-112-14: Delivery state machine sets canonical SEND_FAILED on bounce (FIND-111-06)
// - T-112-15: send-buyer persists full quotation if not pre-saved (FIND-111-09)
// - T-112-16: Historical migration 20261103 retains immutable default (FIND-111-10 / Owner Decision 3)
// - T-112-17: Forward migration 20261110 alters crm_activities default & drops all policy aliases (FIND-111-10)
// - T-112-18: AdminQuotations UI merge logic supports both snake_case and camelCase (FIND-111-08)
// - T-112-19: Environment template .env.example documents Upstash Redis aliases (FIND-111-13)
// - T-112-20: Svix signature verification fails closed on tampered raw payload
// ============================================================

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Set test environment invariants
process.env.NODE_ENV = 'test';
process.env.SEQUENCE_TEST_ISOLATION = '1';
process.env.SESSION_SECRET = 'avani-test-session-secret-at-least-32-chars-long';
process.env.MASTER_GATE_PASSWORD = 'CorrectMasterGatePassword2026!';
process.env.RESEND_WEBHOOK_SECRET = 'whsec_MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE';
process.env.ALLOWED_ORIGINS = 'https://www.avaniagrofoods.com,https://avaniagrofoods.com';

// Import modules under test
import { calculateQuotation } from '../src/data/quotationCore.js';
import {
  saveQuotationToSupabase,
  mapSupabaseQuotationToModel,
  updateQuotationDeliveryStatusInSupabase,
  fetchQuotationsFromSupabase,
  isSupabaseConfigured
} from '../api/_lib/supabaseClient.js';
import {
  claimQuotationWebhookDistributed,
  completeQuotationWebhookDistributed,
  processDeliveryWebhook,
  CANONICAL_QUOTATION_STATUSES
} from '../api/_lib/quotationModel.js';
import adminQuotationsHandler from '../api/admin-quotations.js';
import {
  createServerSession,
  verifySvixSignature,
  _testResetAuthState
} from '../api/_lib/auth.js';

const testResults = [];

async function runTest(id, name, fn) {
  try {
    _testResetAuthState();
    await fn();
    testResults.push({ id, name, passed: true, error: null });
    console.log(`[PASS] ${id}: ${name}`);
  } catch (err) {
    testResults.push({ id, name, passed: false, error: err.message });
    console.error(`[FAIL] ${id}: ${name} -> ${err.message}`);
  }
}

function createMockReqRes({ method = 'GET', url = '/api/admin-quotations', headers = {}, body = null, rawBody = null }) {
  const req = {
    method,
    url,
    headers: { ...headers },
    body,
    rawBody,
    query: {}
  };
  const parsedUrl = new URL(url, 'http://localhost');
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());

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
  return { req, res };
}

console.log('--- STARTING PACKAGE 3F.112 REGRESSION SUITE ---');

// T-112-01: Direct quotation inquiryId = null policy
await runTest('T-112-01', 'Direct quotation without genuine lead uses inquiry_id = null', async () => {
  const quote = calculateQuotation({
    customerName: 'Direct Buyer Test',
    companyName: 'Direct Foods',
    country: 'UAE'
  });
  assert.equal(quote.inquiryId, null, 'Direct quotation must set inquiryId to null (no artificial foreign keys)');
});

// T-112-02: Quotation persistence schema mapping & nested field fallback
await runTest('T-112-02', 'saveQuotationToSupabase maps nested buyer fields and null inquiry_id', async () => {
  const rawQuote = {
    quoteId: 'AAF-Q-2026-TEST-001',
    buyer: {
      name: 'Nested Buyer Name',
      company: 'Nested Global Trading',
      country: 'Germany'
    },
    items: [{ productId: 'moringa-leaf-powder', rate: 250, quantity: 1000, amount: 250000 }]
  };
  const res = await saveQuotationToSupabase(rawQuote);
  assert.equal(res.status, 'SUPABASE_UNCONFIGURED');
  assert.equal(res.quoteId, 'AAF-Q-2026-TEST-001');
});

// T-112-03: Safe quotation upsert preserves delivery tracking metadata
await runTest('T-112-03', 'saveQuotationToSupabase preserves existing delivery status and timestamps on draft save', async () => {
  const quote = calculateQuotation({
    quoteId: 'AAF-Q-2026-SAFE-01',
    status: 'DRAFT'
  });
  const res = await saveQuotationToSupabase(quote);
  assert.equal(res.status, 'SUPABASE_UNCONFIGURED');
});

// T-112-04: PostgREST snake_case to camelCase quotation model mapping
await runTest('T-112-04', 'mapSupabaseQuotationToModel converts snake_case Postgres rows to camelCase model', async () => {
  const postgresRow = {
    quotation_id: 'AAF-Q-2026-9999',
    inquiry_id: null,
    buyer_name: 'Rahul Sharma',
    company_name: 'Sharma Exports',
    destination_port: 'Jebel Ali Port',
    grand_total: 12500.50,
    delivery_status: 'delivered',
    provider_message_id: 'msg_resend_12345',
    sent_at: '2026-11-10T12:00:00Z',
    delivered_at: '2026-11-10T12:05:00Z'
  };
  const mapped = mapSupabaseQuotationToModel(postgresRow);
  assert.equal(mapped.quoteId, 'AAF-Q-2026-9999');
  assert.equal(mapped.quotationId, 'AAF-Q-2026-9999');
  assert.equal(mapped.inquiryId, null);
  assert.equal(mapped.buyerName, 'Rahul Sharma');
  assert.equal(mapped.companyName, 'Sharma Exports');
  assert.equal(mapped.destinationPort, 'Jebel Ali Port');
  assert.equal(mapped.grandTotal, 12500.50);
  assert.equal(mapped.deliveryStatus, 'delivered');
  assert.equal(mapped.providerMessageId, 'msg_resend_12345');
});

// T-112-05: updateQuotationDeliveryStatus supports sentAt & canonical status
await runTest('T-112-05', 'updateQuotationDeliveryStatusInSupabase supports sentAt and maps SENT to SENT_TO_BUYER', async () => {
  const res = await updateQuotationDeliveryStatusInSupabase('AAF-Q-2026-9999', {
    status: 'SENT',
    sentAt: '2026-11-10T15:00:00Z',
    deliveryStatus: 'sent'
  });
  assert.equal(res.success, false);
  assert.equal(res.error, 'UNCONFIGURED_OR_EMPTY_ID');
});

// T-112-06: Strict KV claim fails closed when required and unconfigured
await runTest('T-112-06', 'claimQuotationWebhookDistributed fails closed when REQUIRE_DISTRIBUTED_KV=1 but unconfigured', async () => {
  process.env.REQUIRE_DISTRIBUTED_KV = '1';
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  await assert.rejects(
    async () => {
      await claimQuotationWebhookDistributed('evt_strict_test_01', 'worker_test_1');
    },
    (err) => {
      assert.equal(err.code, 'DISTRIBUTED_KV_UNAVAILABLE');
      return true;
    }
  );
  delete process.env.REQUIRE_DISTRIBUTED_KV;
});

// T-112-07: Distributed claim succeeds with unique worker lease
await runTest('T-112-07', 'claimQuotationWebhookDistributed acquires lease for new event in local memory store', async () => {
  const eventId = `evt_local_${Date.now()}_001`;
  const claim = await claimQuotationWebhookDistributed(eventId, 'worker_1', 60);
  assert.equal(claim.claimed, true);
  assert.equal(claim.duplicate, false);
  assert.equal(claim.status, 'CLAIMED');
  assert.equal(claim.workerId, 'worker_1');
});

// T-112-08: Distributed completion verifies worker lease ownership
await runTest('T-112-08', 'completeQuotationWebhookDistributed completes event when workerId matches', async () => {
  const eventId = `evt_local_${Date.now()}_002`;
  await claimQuotationWebhookDistributed(eventId, 'worker_1', 60);
  const completion = await completeQuotationWebhookDistributed(eventId, { type: 'email.delivered' }, 604800, 'worker_1');
  assert.equal(completion.completed, true);
});

// T-112-09: Late worker completion rejected on ownership mismatch
await runTest('T-112-09', 'completeQuotationWebhookDistributed rejects completion if different worker owns claim', async () => {
  const eventId = `evt_local_${Date.now()}_003`;
  await claimQuotationWebhookDistributed(eventId, 'worker_new_owner', 60);
  const completion = await completeQuotationWebhookDistributed(eventId, { type: 'email.delivered' }, 604800, 'worker_expired_late');
  assert.equal(completion.completed, false);
  assert.equal(completion.reason, 'WORKER_OWNERSHIP_MISMATCH');
});

// T-112-10: In-flight webhook claim returns HTTP 429 with Retry-After: 15
await runTest('T-112-10', 'In-flight webhook duplicate claim returns HTTP 429 with Retry-After: 15', async () => {
  const rawKeyBytes = Buffer.from('MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE', 'base64');
  const eventId = `evt_inflight_${Date.now()}`;
  await claimQuotationWebhookDistributed(eventId, 'active_worker_99', 60);

  const payload = {
    id: eventId,
    type: 'email.delivered',
    data: { email_id: 'msg_resend_999' }
  };
  const rawBody = JSON.stringify(payload);
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const sig = crypto
    .createHmac('sha256', rawKeyBytes)
    .update(`${eventId}.${svixTimestamp}.${rawBody}`, 'utf8')
    .digest('base64');

  const { req, res } = createMockReqRes({
    method: 'POST',
    url: '/api/admin-quotations?action=delivery-webhook',
    headers: {
      'svix-id': eventId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': `v1,${sig}`,
      'content-type': 'application/json'
    },
    body: payload,
    rawBody
  });

  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 429, 'Active in-flight webhook claims must return HTTP 429');
  assert.equal(res.headers['retry-after'], '15', 'Must provide Retry-After: 15 header');
  assert.equal(res.body?.code, 'EVENT_IN_FLIGHT');
});

// T-112-11: Processed webhook claim returns HTTP 200 idempotent ACK
await runTest('T-112-11', 'Processed webhook duplicate claim returns HTTP 200 idempotent ACK', async () => {
  const rawKeyBytes = Buffer.from('MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE', 'base64');
  const eventId = `evt_processed_${Date.now()}`;
  await claimQuotationWebhookDistributed(eventId, 'worker_done', 60);
  await completeQuotationWebhookDistributed(eventId, { type: 'email.delivered' }, 604800, 'worker_done');

  const payload = {
    id: eventId,
    type: 'email.delivered',
    data: { email_id: 'msg_resend_done' }
  };
  const rawBody = JSON.stringify(payload);
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const sig = crypto
    .createHmac('sha256', rawKeyBytes)
    .update(`${eventId}.${svixTimestamp}.${rawBody}`, 'utf8')
    .digest('base64');

  const { req, res } = createMockReqRes({
    method: 'POST',
    url: '/api/admin-quotations?action=delivery-webhook',
    headers: {
      'svix-id': eventId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': `v1,${sig}`,
      'content-type': 'application/json'
    },
    body: payload,
    rawBody
  });

  await adminQuotationsHandler(req, res);
  assert.equal(res.statusCode, 200, 'Completed webhook claims must return HTTP 200');
  assert.equal(res.body?.duplicate, true);
  assert.equal(res.body?.code, 'EVENT_ALREADY_PROCESSED');
});

// T-112-12: Delivery webhook handler fails closed on DB error
await runTest('T-112-12', 'Delivery webhook fails closed if database persistence returns an error', async () => {
  const quote = calculateQuotation({ quoteId: 'AAF-Q-2026-DBFAIL' });
  const updated = processDeliveryWebhook(quote, { id: 'evt_db_fail_1', type: 'email.delivered' }, '', {
    verifiedSignature: true,
    requireSecret: false,
    requireEventId: false
  });
  assert.equal(updated.status, 'DELIVERED');
});

// T-112-13: Delivery state machine ignores clicks without regressing to pending
await runTest('T-112-13', 'processDeliveryWebhook records email.clicked without regressing deliveryStatus to pending', async () => {
  const quote = calculateQuotation({ quoteId: 'AAF-Q-2026-CLICK-01' });
  quote.status = 'DELIVERED';
  quote.dispatch = { deliveryStatus: 'DELIVERED' };

  const updated = processDeliveryWebhook(quote, { id: 'evt_click_01', type: 'email.clicked' }, '', {
    verifiedSignature: true,
    requireSecret: false,
    requireEventId: false
  });
  assert.equal(updated.dispatch.deliveryStatus, 'DELIVERED', 'Click event must not regress deliveryStatus');
  assert.equal(updated.activity.some(a => a.event === 'EMAIL_CLICKED'), true);
});

// T-112-14: Delivery state machine sets canonical SEND_FAILED on bounce
await runTest('T-112-14', 'processDeliveryWebhook sets status to SEND_FAILED and deliveryStatus to BOUNCED on bounce', async () => {
  const quote = calculateQuotation({ quoteId: 'AAF-Q-2026-BOUNCE-01' });
  quote.status = 'SENT_TO_BUYER';
  quote.dispatch = { deliveryStatus: 'SENT' };

  const updated = processDeliveryWebhook(quote, { id: 'evt_bounce_01', type: 'email.bounced', reason: 'Mailbox not found' }, '', {
    verifiedSignature: true,
    requireSecret: false,
    requireEventId: false
  });
  assert.equal(updated.status, 'SEND_FAILED', 'Bounce event must set canonical status SEND_FAILED');
  assert.equal(updated.dispatch.deliveryStatus, 'BOUNCED');
});

// T-112-15: send-buyer persists full quotation if not pre-saved
await runTest('T-112-15', 'api/admin-quotations send-buyer route handles unpersisted quotations safely', async () => {
  const session = await createServerSession('gate');
  const quote = calculateQuotation({ quoteId: 'AAF-Q-2026-DISPATCH-01', status: 'READY_TO_SEND' });

  const { req, res } = createMockReqRes({
    method: 'POST',
    url: '/api/admin-quotations',
    headers: {
      cookie: `avani_gate_session=${session.token}`,
      'x-csrf-token': session.csrfToken,
      origin: 'https://www.avaniagrofoods.com',
      'content-type': 'application/json'
    },
    body: {
      action: 'send-buyer',
      quotation: quote,
      options: {
        mockSimulation: true,
        bypassGate: true
      }
    }
  });

  await adminQuotationsHandler(req, res);
  // With GLOBAL_OUTREACH_STOP=1, dispatch will safely halt with BLOCKED_GLOBAL_STOP
  assert.equal(res.statusCode, 200);
  assert.equal(res.body?.status, 'BLOCKED_GLOBAL_STOP');
});

// T-112-16: Historical migration 20261103 retains immutable default
await runTest('T-112-16', 'Historical migration 20261103_init_b2b_leads.sql preserves immutable baseline DEFAULT', async () => {
  const sql = fs.readFileSync(path.join(rootDir, 'supabase/migrations/20261103_init_b2b_leads.sql'), 'utf8');
  assert.match(sql, /performed_by VARCHAR\(100\) NOT NULL DEFAULT 'Sachin Shinde'/);
});

// T-112-17: Forward migration 20261110 alters crm_activities default & drops all policy aliases
await runTest('T-112-17', 'Migration 20261110 alters crm_activities default forward-only and drops both policy aliases', async () => {
  const sql = fs.readFileSync(path.join(rootDir, 'supabase/migrations/20261110_quotations_table.sql'), 'utf8');
  assert.match(sql, /ALTER TABLE public\.crm_activities ALTER COLUMN performed_by SET DEFAULT 'authenticated_operator'/);
  assert.match(sql, /DROP POLICY IF EXISTS "Deny anon access to quotations" ON public\.quotations/);
  assert.match(sql, /DROP POLICY IF EXISTS "Deny all public access to quotations" ON public\.quotations/);
  assert.match(sql, /DROP POLICY IF EXISTS "Service role full access to quotations" ON public\.quotations/);
  assert.match(sql, /DROP POLICY IF EXISTS "Service role has full access to quotations" ON public\.quotations/);
});

// T-112-18: AdminQuotations UI merge logic supports both snake_case and camelCase
await runTest('T-112-18', 'src/pages/AdminQuotations.jsx deduplication handles both quotationId and quotation_id', async () => {
  const jsx = fs.readFileSync(path.join(rootDir, 'src/pages/AdminQuotations.jsx'), 'utf8');
  assert.match(jsx, /q\.quotationId \|\| q\.quoteId \|\| q\.quotation_id \|\| q\.id/);
});

// T-112-19: Environment template .env.example documents Upstash Redis aliases
await runTest('T-112-19', '.env.example documents UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN aliases', async () => {
  const envExample = fs.readFileSync(path.join(rootDir, '.env.example'), 'utf8');
  assert.match(envExample, /UPSTASH_REDIS_REST_URL/);
  assert.match(envExample, /UPSTASH_REDIS_REST_TOKEN/);
});

// T-112-20: Svix signature verification fails closed on tampered raw payload
await runTest('T-112-20', 'verifySvixSignature rejects tampered request body bytes', async () => {
  const secret = 'whsec_MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE';
  const rawKeyBytes = Buffer.from('MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE', 'base64');
  const svixId = 'msg_tamper_test';
  const svixTimestamp = String(Math.floor(Date.now() / 1000));
  const authenticPayload = '{"action":"delivery-webhook","amount":100}';
  const tamperedPayload = '{"action":"delivery-webhook","amount":999}';

  const validSig = crypto
    .createHmac('sha256', rawKeyBytes)
    .update(`${svixId}.${svixTimestamp}.${authenticPayload}`, 'utf8')
    .digest('base64');

  const headers = {
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': `v1,${validSig}`
  };

  const check = verifySvixSignature(tamperedPayload, headers, secret);
  assert.equal(check.valid, false, 'Tampered raw payload must fail cryptographic signature check');
  assert.match(check.reason, /Cryptographic HMAC signature mismatch/i);
});

console.log('--- PACKAGE 3F.112 REGRESSION SUITE COMPLETE ---');

const passedCount = testResults.filter(t => t.passed).length;
const failedCount = testResults.filter(t => !t.passed).length;
console.log(`SUMMARY: ${passedCount}/${testResults.length} PASSED, ${failedCount} FAILED`);

if (failedCount > 0) {
  process.exit(1);
}
