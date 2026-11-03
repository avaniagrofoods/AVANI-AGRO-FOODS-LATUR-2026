// ============================================================
// AVANI AGRO FOODS — Webhook Raw-Body & Svix Signature Resilience Test Suite
// Phase 2 Remediation Verification
// ============================================================

const assert = require('assert');
const crypto = require('crypto');
const { Readable } = require('stream');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const FORBIDDEN_DATA_DIR = path.resolve(REPO_ROOT, 'api', '_data');
const FORBIDDEN_SCRATCH_DIR = path.resolve(REPO_ROOT, 'scratch');
const SHARED_OPERATIONAL_STORE_PATH = path.resolve(FORBIDDEN_DATA_DIR, 'sequenceStateStore.json');

function establishTestIsolation(prefix) {
  if (process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)) {
    throw new Error('ISOLATION_VIOLATION: Test suite must never execute in production or Vercel runtime.');
  }

  const resolvedTmpRoot = path.resolve(os.tmpdir());
  let isolatedDir = null;
  try {
    isolatedDir = fs.mkdtempSync(path.join(resolvedTmpRoot, prefix));
    const isolatedStorePath = path.resolve(isolatedDir, 'sequenceStateStore.isolated.json');

    if (
      isolatedStorePath === SHARED_OPERATIONAL_STORE_PATH ||
      isolatedStorePath.startsWith(FORBIDDEN_DATA_DIR + path.sep) ||
      isolatedStorePath === FORBIDDEN_DATA_DIR ||
      isolatedStorePath.startsWith(FORBIDDEN_SCRATCH_DIR + path.sep) ||
      isolatedStorePath === FORBIDDEN_SCRATCH_DIR ||
      isolatedStorePath.startsWith(REPO_ROOT + path.sep) ||
      !isolatedStorePath.startsWith(resolvedTmpRoot + path.sep)
    ) {
      throw new Error(`ISOLATION_VIOLATION: Invalid isolated store path: ${isolatedStorePath}`);
    }

    const envKeysToSnapshot = [
      'SEQUENCE_TEST_ISOLATION',
      'SEQUENCE_STORE_PATH',
      'GLOBAL_OUTREACH_STOP',
      'OUTREACH_AUTHORIZED',
      'REAL_BUYER_CONTACT',
      'REAL_BUYER_EMAILS',
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'REQUIRE_DISTRIBUTED_KV',
      'REQUIRE_DURABLE_STORAGE',
      'SIMULATE_STORAGE_FAILURE',
      'RESEND_WEBHOOK_SECRET',
      'CRM_WEBHOOK_SECRET',
      'WEBHOOK_SECRET'
    ];

    const envSnapshot = {};
    for (const key of envKeysToSnapshot) {
      envSnapshot[key] = Object.prototype.hasOwnProperty.call(process.env, key)
        ? process.env[key]
        : undefined;
    }

    process.env.GLOBAL_OUTREACH_STOP = '1';
    process.env.OUTREACH_AUTHORIZED = '0';
    process.env.REAL_BUYER_CONTACT = '0';
    process.env.REAL_BUYER_EMAILS = '0';

    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.REQUIRE_DISTRIBUTED_KV;
    delete process.env.REQUIRE_DURABLE_STORAGE;
    delete process.env.SIMULATE_STORAGE_FAILURE;
    delete process.env.RESEND_WEBHOOK_SECRET;
    delete process.env.CRM_WEBHOOK_SECRET;
    delete process.env.WEBHOOK_SECRET;

    const initialStore = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      sequences: {},
      idempotencyKeys: {},
      reservations: {},
      processedEvents: {},
      auditLog: []
    };
    fs.writeFileSync(isolatedStorePath, JSON.stringify(initialStore, null, 2), 'utf8');

    const verifyRaw = fs.readFileSync(isolatedStorePath, 'utf8');
    const verifyParsed = JSON.parse(verifyRaw);
    if (!verifyParsed || typeof verifyParsed !== 'object' || Array.isArray(verifyParsed)) {
      throw new Error('ISOLATION_VIOLATION: Isolated store initialization failed validation.');
    }

    process.env.SEQUENCE_TEST_ISOLATION = '1';
    process.env.SEQUENCE_STORE_PATH = isolatedStorePath;

    return {
      isolatedDir,
      isolatedStorePath,
      envSnapshot,
      cleanedUp: false
    };
  } catch (err) {
    if (isolatedDir) {
      try {
        fs.rmSync(isolatedDir, { recursive: true, force: true });
      } catch (_) {}
    }
    throw err;
  }
}

function cleanupIsolatedEnvironment(isolation) {
  if (!isolation || isolation.cleanedUp) return;
  isolation.cleanedUp = true;

  let cleanupError = null;
  try {
    for (const [key, val] of Object.entries(isolation.envSnapshot)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
    process.env.GLOBAL_OUTREACH_STOP = '1';
    process.env.OUTREACH_AUTHORIZED = '0';
    process.env.REAL_BUYER_CONTACT = '0';
    process.env.REAL_BUYER_EMAILS = '0';
  } catch (err) {
    cleanupError = err;
  }

  try {
    const resolvedTmpRoot = path.resolve(os.tmpdir());
    if (
      isolation.isolatedDir &&
      isolation.isolatedDir.startsWith(resolvedTmpRoot + path.sep) &&
      !isolation.isolatedDir.startsWith(REPO_ROOT + path.sep) &&
      fs.existsSync(isolation.isolatedDir)
    ) {
      fs.rmSync(isolation.isolatedDir, { recursive: true, force: true });
    }
  } catch (err) {
    if (!cleanupError) cleanupError = err;
  }

  if (cleanupError) {
    throw new Error(`ISOLATION_CLEANUP_FAILED: ${cleanupError.message}`);
  }
}

const ISOLATION = establishTestIsolation('aaf-webhook-raw-test-');

const TEST_SECRET = 'whsec_dGVzdF93ZWJob29rX3NlY3JldF8zMmJ5dGVzX2FhZjEyMw==';

function buildSvixSig(rawBody, svixId, timestamp, secret) {
  const clean = secret.startsWith('whsec_') ? secret.substring(6) : secret;
  const key = Buffer.from(clean, 'base64');
  const toSign = `${svixId}.${timestamp}.${rawBody}`;
  const sig = crypto.createHmac('sha256', key).update(toSign).digest('base64');
  return `v1,${sig}`;
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    _json: null,
    _data: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this._json = obj; return this; },
    send(data) { this._data = data; return this; }
  };
  return res;
}

function createChunkedStream(chunks) {
  const stream = new Readable({
    read() {
      for (const chunk of chunks) {
        this.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk);
      }
      this.push(null);
    }
  });
  return stream;
}

async function runTests() {
  console.log('============================================================');
  console.log('TEST SUITE: Webhook Raw-Body & Svix Signature Resilience');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  try {
    const { getStorageConfiguration } = await import('../api/_lib/sequencePersistence.js');
    const webhookHandler = (await import('../api/email-reply-webhook.js')).default;

    process.env.RESEND_WEBHOOK_SECRET = TEST_SECRET;

    // 1. Valid signature with exact raw body
    await test('1. Valid Svix signature with string body is accepted (200)', async () => {
      const storageCfg = getStorageConfiguration();
      assert.strictEqual(storageCfg.isIsolated, true, 'Webhook test suite must execute under explicit test isolation');
      assert.strictEqual(path.resolve(storageCfg.storePath), ISOLATION.isolatedStorePath, 'Webhook store path must match isolated temp store');
      assert.strictEqual(storageCfg.hasDistributedKV, false, 'Webhook raw-body suite must not contact live distributed KV');

      const now = Math.floor(Date.now() / 1000);
      const rawBody = '{"type":"email.delivered","data":{"email_id":"evt_raw_001","to":["test@example.com"]}}';
      const svixId = 'msg_raw_valid_001';
      const sig = buildSvixSig(rawBody, svixId, String(now), TEST_SECRET);

      const req = {
        method: 'POST',
        headers: {
          'svix-id': svixId,
          'svix-timestamp': String(now),
          'svix-signature': sig
        },
        body: rawBody
      };
      const res = mockRes();
      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._json?.success, true);
    });

    // 2. Chunked Readable Stream input
    await test('2. Valid Svix signature with chunked Readable stream is accepted (200)', async () => {
      const now = Math.floor(Date.now() / 1000);
      const rawBody = '{"type":"email.delivered","data":{"email_id":"evt_stream_002","to":["buyer@example.com"]}}';
      const svixId = 'msg_stream_002';
      const sig = buildSvixSig(rawBody, svixId, String(now), TEST_SECRET);

      // Split body into 3 chunks to simulate streaming transport
      const mid = Math.floor(rawBody.length / 2);
      const stream = createChunkedStream([
        rawBody.slice(0, 10),
        rawBody.slice(10, mid),
        rawBody.slice(mid)
      ]);
      stream.method = 'POST';
      stream.headers = {
        'svix-id': svixId,
        'svix-timestamp': String(now),
        'svix-signature': sig
      };

      const res = mockRes();
      await webhookHandler(stream, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._json?.success, true);
    });

    // 3. Altered bytes (tampered payload against signature)
    await test('3. Altered bytes in payload with original signature is rejected with 401', async () => {
      const now = Math.floor(Date.now() / 1000);
      const originalBody = '{"type":"email.delivered","amount":100}';
      const svixId = 'msg_tamper_003';
      const sig = buildSvixSig(originalBody, svixId, String(now), TEST_SECRET);

      // Tampered body: amount changed to 999
      const tamperedBody = '{"type":"email.delivered","amount":999}';

      const req = {
        method: 'POST',
        headers: {
          'svix-id': svixId,
          'svix-timestamp': String(now),
          'svix-signature': sig
        },
        body: tamperedBody
      };
      const res = mockRes();
      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res._json?.code, 'WEBHOOK_UNAUTHORIZED');
    });

    // 4. Invalid signature value
    await test('4. Invalid signature hash is rejected with 401', async () => {
      const now = Math.floor(Date.now() / 1000);
      const rawBody = '{"type":"email.delivered"}';
      const svixId = 'msg_invalid_sig_004';
      const fakeSig = 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

      const req = {
        method: 'POST',
        headers: {
          'svix-id': svixId,
          'svix-timestamp': String(now),
          'svix-signature': fakeSig
        },
        body: rawBody
      };
      const res = mockRes();
      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res._json?.code, 'WEBHOOK_UNAUTHORIZED');
    });

    // 5. Malformed JSON with valid signature
    await test('5. Malformed JSON with valid signature returns 400 PAYLOAD_MALFORMED', async () => {
      const now = Math.floor(Date.now() / 1000);
      const malformedBody = '{"type":"email.delivered", broken json';
      const svixId = 'msg_malformed_005';
      const sig = buildSvixSig(malformedBody, svixId, String(now), TEST_SECRET);

      const req = {
        method: 'POST',
        headers: {
          'svix-id': svixId,
          'svix-timestamp': String(now),
          'svix-signature': sig
        },
        body: malformedBody
      };
      const res = mockRes();
      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res._json?.code, 'PAYLOAD_MALFORMED');
    });

    // 6. Oversized body (> 1 MB limit)
    await test('6. Oversized body (> 1 MB) is rejected with 413 PAYLOAD_TOO_LARGE', async () => {
      const now = Math.floor(Date.now() / 1000);
      const hugeString = 'a'.repeat(1024 * 1024 + 100); // 1 MB + 100 bytes
      const svixId = 'msg_oversized_006';
      const sig = buildSvixSig(hugeString, svixId, String(now), TEST_SECRET);

      const stream = createChunkedStream([hugeString]);
      stream.method = 'POST';
      stream.headers = {
        'svix-id': svixId,
        'svix-timestamp': String(now),
        'svix-signature': sig
      };

      const res = mockRes();
      await webhookHandler(stream, res);
      assert.strictEqual(res.statusCode, 413);
      assert.strictEqual(res._json?.code, 'PAYLOAD_TOO_LARGE');
    });

    // 7. Stale timestamp (> 300 seconds old)
    await test('7. Stale timestamp (301 seconds old) is rejected with 401', async () => {
      const staleTime = Math.floor(Date.now() / 1000) - 301;
      const rawBody = '{"type":"email.delivered"}';
      const svixId = 'msg_stale_007';
      const sig = buildSvixSig(rawBody, svixId, String(staleTime), TEST_SECRET);

      const req = {
        method: 'POST',
        headers: {
          'svix-id': svixId,
          'svix-timestamp': String(staleTime),
          'svix-signature': sig
        },
        body: rawBody
      };
      const res = mockRes();
      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res._json?.code, 'WEBHOOK_UNAUTHORIZED');
    });

    // 8. Future timestamp (> 300 seconds ahead)
    await test('8. Future timestamp (301 seconds in future) is rejected with 401', async () => {
      const futureTime = Math.floor(Date.now() / 1000) + 301;
      const rawBody = '{"type":"email.delivered"}';
      const svixId = 'msg_future_008';
      const sig = buildSvixSig(rawBody, svixId, String(futureTime), TEST_SECRET);

      const req = {
        method: 'POST',
        headers: {
          'svix-id': svixId,
          'svix-timestamp': String(futureTime),
          'svix-signature': sig
        },
        body: rawBody
      };
      const res = mockRes();
      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res._json?.code, 'WEBHOOK_UNAUTHORIZED');
    });

    // 9. Unconfigured webhook secret
    await test('9. Unconfigured webhook secret returns 500 WEBHOOK_UNCONFIGURED', async () => {
      delete process.env.RESEND_WEBHOOK_SECRET;
      delete process.env.CRM_WEBHOOK_SECRET;
      delete process.env.WEBHOOK_SECRET;

      const req = {
        method: 'POST',
        headers: {},
        body: '{}'
      };
      const res = mockRes();
      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res._json?.code, 'WEBHOOK_UNCONFIGURED');
    });

    console.log('\n============================================================');
    console.log(`WEBHOOK RESILIENCE RESULTS: ${passed} passed, ${failed} failed.`);
    console.log('============================================================');

    if (failed > 0) process.exitCode = 1;
  } finally {
    cleanupIsolatedEnvironment(ISOLATION);
  }
}

runTests().catch(err => {
  console.error('Test harness exception:', err);
  process.exitCode = 1;
});
