/**
 * Focused Isolated Test: Gap 2 - Webhook KV-Failure HTTP 503 Verification
 * Validates that when centralized policy requires distributed KV (e.g. STRICT_KV_ENFORCEMENT=1)
 * but REQUIRE_DISTRIBUTED_KV is unset, distributed event-claim failures fail closed with HTTP 503
 * and never fall through to in-memory processing.
 */

const http = require('http');
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

  const isolatedDir = fs.mkdtempSync(path.join(TMP_BASE, 'aaf-gap2-webhook-test-'));
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

function cleanupIsolation(ctx, mockServer) {
  if (mockServer) {
    try {
      mockServer.close();
    } catch (_) {}
  }

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
  console.log('TEST SUITE: Gap 2 - Webhook KV-Failure HTTP 503 Verification');
  console.log('============================================================\n');

  const isolation = establishIsolation();
  let mockServer = null;
  let mockPort = 0;
  let serverSimulate500 = false;
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
    // 1. Create loopback mock Upstash server
    mockServer = http.createServer((req, res) => {
      if (serverSimulate500) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Internal Server Error', code: 500 }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ result: 'OK' }));
    });

    await new Promise(resolve => mockServer.listen(0, '127.0.0.1', resolve));
    mockPort = mockServer.address().port;
    assert.strictEqual(mockServer.address().address, '127.0.0.1', 'Mock KV server must bind only to 127.0.0.1');

    const webhookHandler = (await import('../api/email-reply-webhook.js')).default;
    const { isDistributedKvRequired } = await import('../api/_lib/sequencePersistence.js');

    const WEBHOOK_SECRET = 'test_webhook_secret_gap2_444';
    process.env.RESEND_WEBHOOK_SECRET = WEBHOOK_SECRET;

    // Test 2.1: Prove isDistributedKvRequired() returns true when STRICT_KV_ENFORCEMENT=1 even with REQUIRE_DISTRIBUTED_KV unset
    await test('2.1 Helper Contract: isDistributedKvRequired() is true under STRICT_KV_ENFORCEMENT=1 without REQUIRE_DISTRIBUTED_KV', () => {
      delete process.env.REQUIRE_DISTRIBUTED_KV;
      process.env.STRICT_KV_ENFORCEMENT = '1';
      assert.strictEqual(process.env.REQUIRE_DISTRIBUTED_KV, undefined);
      assert.strictEqual(isDistributedKvRequired(), true);
    });

    // Test 2.2: Missing KV credentials when KV required returns 503 and fails closed
    await test('2.2 Missing KV Credentials: Fails closed with 503 DISTRIBUTED_KV_UNAVAILABLE', async () => {
      delete process.env.REQUIRE_DISTRIBUTED_KV;
      process.env.STRICT_KV_ENFORCEMENT = '1';
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;

      const req = {
        method: 'POST',
        headers: {
          'x-webhook-secret': WEBHOOK_SECRET
        },
        body: {
          id: 'evt_gap2_cred_fail_001',
          type: 'email.received',
          data: {
            from: 'buyer@example.com',
            subject: 'Re: Quotation'
          }
        }
      };
      const res = mockRes();

      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res._json.code, 'DISTRIBUTED_KV_UNAVAILABLE');
    });

    // Test 2.3: KV Backend HTTP 500 Outage when KV required returns 503 and does not fall through
    await test('2.3 KV Outage (HTTP 500): Fails closed with 503 DISTRIBUTED_KV_UNAVAILABLE without downstream processing', async () => {
      delete process.env.REQUIRE_DISTRIBUTED_KV;
      process.env.STRICT_KV_ENFORCEMENT = '1';
      process.env.KV_REST_API_URL = `http://127.0.0.1:${mockPort}`;
      process.env.KV_REST_API_TOKEN = 'mock_token_gap2';
      serverSimulate500 = true; // Trigger 500 outage

      const req = {
        method: 'POST',
        headers: {
          'x-webhook-secret': WEBHOOK_SECRET
        },
        body: {
          id: 'evt_gap2_outage_500_001',
          type: 'email.received',
          data: {
            from: 'buyer@example.com',
            subject: 'Re: Inquiry'
          }
        }
      };
      const res = mockRes();

      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res._json.code, 'DISTRIBUTED_KV_UNAVAILABLE');
      assert.strictEqual(res._json.error, 'Service Unavailable');
    });

    // Test 2.4: Healthy KV backend succeeds (200) when KV required
    await test('2.4 Healthy KV Backend: Atomically claims and returns 200', async () => {
      delete process.env.REQUIRE_DISTRIBUTED_KV;
      process.env.STRICT_KV_ENFORCEMENT = '1';
      process.env.KV_REST_API_URL = `http://127.0.0.1:${mockPort}`;
      process.env.KV_REST_API_TOKEN = 'mock_token_gap2';
      serverSimulate500 = false; // Normal healthy response

      const req = {
        method: 'POST',
        headers: {
          'x-webhook-secret': WEBHOOK_SECRET
        },
        body: {
          id: 'evt_gap2_healthy_001',
          type: 'email.bounced',
          data: {
            email: 'bounce-test@example.com'
          }
        }
      };
      const res = mockRes();

      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._json.action, 'BOUNCE_ACKNOWLEDGED');
    });

    console.log(`\n============================================================`);
    console.log(`GAP 2 RESULTS: ${passed}/${total} passed (100%)`);
    console.log(`============================================================\n`);
    return { passed, total };
  } finally {
    cleanupIsolation(isolation, mockServer);
  }
}

runTests().catch(err => {
  console.error('Gap 2 Test Execution Failed:', err);
  process.exit(1);
});
