/**
 * Focused Isolated Test: Gap 1 - Cron GET Route Verification
 * Validates GET handler liveness, authentication, fail-closed safety gates,
 * and effective policy derivation in api/cron-sequence-dispatch.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const REPO_ROOT = path.resolve(__dirname, '..');
const TMP_BASE = path.resolve(os.tmpdir());

function establishIsolation() {
  const envSnapshot = { ...process.env };

  // Safety invariants
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';
  process.env.REAL_BUYER_CONTACT = '0';
  process.env.REAL_BUYER_EMAILS = '0';

  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.REQUIRE_DISTRIBUTED_KV;
  delete process.env.CRON_SECRET;

  const isolatedDir = fs.mkdtempSync(path.join(TMP_BASE, 'aaf-gap1-cron-test-'));
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
  console.log('TEST SUITE: Gap 1 - Cron GET Route Verification');
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
    const cronHandler = (await import('../api/cron-sequence-dispatch.js')).default;
    const { getStorageConfiguration } = await import('../api/_lib/sequencePersistence.js');

    // Test 1: Method Gate - Method not GET or POST rejected
    await test('1.1 HTTP Method Gate: Unsupported method (PUT) rejected with 405', async () => {
      const req = { method: 'PUT', headers: {} };
      const res = mockRes();
      await cronHandler(req, res);
      assert.strictEqual(res.statusCode, 405);
      assert.strictEqual(res._json.error, 'METHOD_NOT_ALLOWED');
    });

    // Test 2: Auth Gate on GET - Missing authorization header returns 401
    await test('1.2 Auth Gate on GET: Missing CRON_SECRET rejected with 401', async () => {
      process.env.CRON_SECRET = 'cron_test_secret_999';
      const req = { method: 'GET', headers: {} };
      const res = mockRes();
      await cronHandler(req, res);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res._json.error, 'UNAUTHORIZED');
    });

    // Test 3: Auth Gate on GET - Invalid token returns 401
    await test('1.3 Auth Gate on GET: Invalid bearer token rejected with 401', async () => {
      process.env.CRON_SECRET = 'cron_test_secret_999';
      const req = { method: 'GET', headers: { authorization: 'Bearer invalid_secret' } };
      const res = mockRes();
      await cronHandler(req, res);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res._json.error, 'UNAUTHORIZED');
    });

    // Test 4: Safety Gate on GET - GLOBAL_OUTREACH_STOP=1 blocks GET fail-closed (403)
    await test('1.4 Safety Gate on GET: GLOBAL_OUTREACH_STOP=1 blocks GET with 403', async () => {
      process.env.CRON_SECRET = 'cron_test_secret_999';
      process.env.GLOBAL_OUTREACH_STOP = '1';
      const req = { method: 'GET', headers: { authorization: 'Bearer cron_test_secret_999' } };
      const res = mockRes();
      await cronHandler(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res._json.error, 'GLOBAL_OUTREACH_STOP_ENGAGED');
      assert.strictEqual(res._json.globalStop, '1');
    });

    // Test 5: Safety Gate on GET - OUTREACH_AUTHORIZED missing/0 blocks GET fail-closed (403)
    await test('1.5 Safety Gate on GET: OUTREACH_AUTHORIZED=0 blocks GET with 403', async () => {
      process.env.CRON_SECRET = 'cron_test_secret_999';
      const req = { method: 'GET', headers: { authorization: 'Bearer cron_test_secret_999' } };
      const res = mockRes();
      // Inject test policy: globalStop lifted (0) but outreachAuth not authorized (0)
      await cronHandler(req, res, { mockGlobalStop: '0', mockOutreachAuthorized: '0' });
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res._json.error, 'OUTREACH_NOT_AUTHORIZED');
      assert.strictEqual(res._json.outreachAuth, '0');
    });

    // Test 6: Authorized GET Liveness & Architecture verification returns 200
    await test('1.6 Authorized GET Liveness: Returns 200 with effective policy and storage info', async () => {
      process.env.CRON_SECRET = 'cron_test_secret_999';
      // In process.env, safety invariants remain locked!
      assert.strictEqual(process.env.GLOBAL_OUTREACH_STOP, '1');
      assert.strictEqual(process.env.OUTREACH_AUTHORIZED, '0');

      const req = { method: 'GET', headers: { authorization: 'Bearer cron_test_secret_999' } };
      const res = mockRes();
      // Test harness injects mock policy values into handler options without touching process.env
      await cronHandler(req, res, { mockGlobalStop: '0', mockOutreachAuthorized: '1' });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res._json.status, 'CRON_DISPATCH_HEALTHY');
      assert.strictEqual(res._json.mode, 'TARGETED_POST_REQUIRED');
      assert.strictEqual(res._json.schedulerModel, 'TARGETED_OPERATOR_INVOCATION_ONLY');
      // Assert values are derived from effective safety policy, not blindly read from process.env
      assert.strictEqual(res._json.globalStop, '0');
      assert.strictEqual(res._json.outreachAuth, '1');
      assert.ok(res._json.storage, 'Storage configuration must be present');
      assert.strictEqual(res._json.storage.isIsolated, true);
    });

    console.log(`\n============================================================`);
    console.log(`GAP 1 RESULTS: ${passed}/${total} passed (100%)`);
    console.log(`============================================================\n`);
    return { passed, total };
  } finally {
    cleanupIsolation(isolation);
  }
}

runTests().catch(err => {
  console.error('Gap 1 Test Execution Failed:', err);
  process.exit(1);
});
