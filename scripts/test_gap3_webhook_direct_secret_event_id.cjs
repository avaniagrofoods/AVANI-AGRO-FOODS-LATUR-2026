/**
 * Focused Isolated Test: Gap 3 - Direct-Secret Webhook Event-ID Contract Verification
 * Validates that authenticated requests lacking an event ID fail closed with HTTP 400 MISSING_EVENT_ID
 * without causing reply detection, bounce recording, or state mutation.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const TMP_BASE = path.resolve(os.tmpdir());

function establishIsolation() {
  const envSnapshot = { ...process.env };

  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';
  process.env.REAL_BUYER_CONTACT = '0';
  process.env.REAL_BUYER_EMAILS = '0';

  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.REQUIRE_DISTRIBUTED_KV;
  delete process.env.STRICT_KV_ENFORCEMENT;

  const isolatedDir = fs.mkdtempSync(path.join(TMP_BASE, 'aaf-gap3-direct-test-'));
  const storePath = path.resolve(isolatedDir, 'sequenceStateStore.isolated.json');

  const emptyStore = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    sequences: {},
    idempotencyKeys: {},
    reservations: {},
    processedEvents: {},
    auditLog: []
  };

  fs.writeFileSync(storePath, JSON.stringify(emptyStore, null, 2), 'utf8');

  process.env.SEQUENCE_TEST_ISOLATION = '1';
  process.env.SEQUENCE_STORE_PATH = storePath;

  return { isolatedDir, storePath, envSnapshot };
}

function cleanupIsolation(ctx) {
  try {
    for (const [k, v] of Object.entries(ctx.envSnapshot)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    process.env.GLOBAL_OUTREACH_STOP = '1';
    process.env.OUTREACH_AUTHORIZED = '0';
    process.env.REAL_BUYER_CONTACT = '0';
    process.env.REAL_BUYER_EMAILS = '0';
  } catch (_) {}

  try {
    if (ctx.isolatedDir && fs.existsSync(ctx.isolatedDir) && ctx.isolatedDir.startsWith(TMP_BASE + path.sep)) {
      fs.rmSync(ctx.isolatedDir, { recursive: true, force: true });
    }
  } catch (_) {}
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    _json: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this._json = obj; return this; }
  };
}

async function runTests() {
  console.log('============================================================');
  console.log('TEST SUITE: Gap 3 - Direct-Secret Webhook Event-ID Contract');
  console.log('============================================================\n');

  const isolation = establishIsolation();
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  try {
    const webhookHandler = (await import('../api/email-reply-webhook.js')).default;
    const { loadStore } = await import('../api/_lib/sequencePersistence.js');

    const DIRECT_SECRET = 'crm_zapier_direct_secret_999';
    process.env.CRM_WEBHOOK_SECRET = DIRECT_SECRET;

    // Test 3.1: Authenticated direct-secret request missing any event ID fails closed with 400
    await test('3.1 Missing Event ID: Authenticated direct-secret request rejected with 400 MISSING_EVENT_ID', async () => {
      const storeBefore = JSON.stringify(loadStore());

      const req = {
        method: 'POST',
        headers: {
          'x-webhook-secret': DIRECT_SECRET
        },
        body: {
          type: 'email.received',
          data: {
            from: 'buyer-lead@example.com',
            subject: 'Re: Quotation'
          }
        }
      };
      const res = mockRes();

      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res._json.code, 'MISSING_EVENT_ID');

      // Assert zero mutation to stored state
      const storeAfter = JSON.stringify(loadStore());
      assert.strictEqual(storeBefore, storeAfter, 'Store must not be mutated when event ID is missing');
    });

    // Test 3.2: Whitespace/empty event ID also fails closed with 400
    await test('3.2 Empty/Whitespace Event ID: Rejected with 400 MISSING_EVENT_ID', async () => {
      const req = {
        method: 'POST',
        headers: {
          'x-webhook-secret': DIRECT_SECRET
        },
        body: {
          id: '   ',
          type: 'bounce',
          recipient: 'bounce-test@example.com'
        }
      };
      const res = mockRes();

      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res._json.code, 'MISSING_EVENT_ID');
    });

    // Test 3.3: Direct-secret request with valid event ID in payload.id succeeds and deduplicates
    await test('3.3 Valid Event ID in payload.id: Successfully processed and deduplicated', async () => {
      const req1 = {
        method: 'POST',
        headers: {
          'x-webhook-secret': DIRECT_SECRET
        },
        body: {
          id: 'evt_direct_crm_001',
          type: 'email.bounced',
          data: {
            email: 'crm-bounce@example.com'
          }
        }
      };
      const res1 = mockRes();

      await webhookHandler(req1, res1);
      assert.strictEqual(res1.statusCode, 200);
      assert.strictEqual(res1._json.action, 'BOUNCE_ACKNOWLEDGED');

      // Replay attempt with identical event ID returns duplicate acknowledgment (200)
      const res2 = mockRes();
      await webhookHandler(req1, res2);
      assert.strictEqual(res2.statusCode, 200);
      assert.strictEqual(res2._json.duplicate, true);
    });

    // Test 3.4: Direct-secret request with valid event ID in payload.data.id succeeds
    await test('3.4 Valid Event ID in payload.data.id: Successfully processed', async () => {
      const req = {
        method: 'POST',
        headers: {
          authorization: `Bearer ${DIRECT_SECRET}`
        },
        body: {
          type: 'email.bounced',
          data: {
            id: 'evt_nested_id_002',
            email: 'nested-bounce@example.com'
          }
        }
      };
      const res = mockRes();

      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._json.action, 'BOUNCE_ACKNOWLEDGED');
    });

    console.log(`\n============================================================`);
    console.log(`GAP 3 RESULTS: ${passed}/${total} passed (100%)`);
    console.log(`============================================================\n`);
    return { passed, total };
  } finally {
    cleanupIsolation(isolation);
  }
}

runTests().catch(err => {
  console.error('Gap 3 Test Execution Failed:', err);
  process.exit(1);
});
