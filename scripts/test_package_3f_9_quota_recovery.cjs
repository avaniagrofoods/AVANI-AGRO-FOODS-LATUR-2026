/**
 * scripts/test_package_3f_9_quota_recovery.cjs
 *
 * PACKAGE 3F.9 — QUOTA RECOVERY & DISTRIBUTED CORRECTNESS TEST SUITE
 *
 * Exercises:
 *  TASK A: BLK-01 Quota Recovery, Compensation on Failure, & Reconciler
 *  TASK B: BLK-03 Atomic Lua EVAL vs Fail-Closed on Missing Server-Side Scripting
 *  TASK C: Lead ID Collision Resistance, Mathematical Scope, & Wraparound
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('============================================================');
console.log('PACKAGE 3F.9: QUOTA RECOVERY & DISTRIBUTED CORRECTNESS');
console.log('============================================================\n');

// 1. Establish isolated testing environment
const tmpSubdir = path.join(os.tmpdir(), `aaf_test_pkg3f9_${Date.now()}`);
fs.mkdirSync(tmpSubdir, { recursive: true });
const testStorePath = path.join(tmpSubdir, 'sequenceStateStore.test.json');

fs.writeFileSync(testStorePath, JSON.stringify({
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  sequences: {},
  idempotencyKeys: {},
  reservations: {},
  processedEvents: {},
  dailyThroughput: {},
  auditLog: []
}, null, 2), 'utf8');

process.env.SEQUENCE_STORE_PATH = testStorePath;
process.env.SEQUENCE_TEST_ISOLATION = '1';

// Mandatory safety locks
process.env.GLOBAL_OUTREACH_STOP = '1';
process.env.OUTREACH_AUTHORIZED = '0';
process.env.REAL_BUYER_CONTACT = '0';
process.env.REAL_BUYER_EMAILS = '0';
process.env.PRODUCTION_STATUS = 'HOLD';
process.env.OUTREACH_READY = 'FALSE';
process.env.PILOT_AUTHORIZED = '0';

// 2. Start In-Memory Mock Upstash Redis Server with Configurable Behavior
const mockKVStore = new Map();
let mockServer = null;
let mockPort = 0;
let failOnKeyPrefix = null; // e.g. 'quota:res:'
let rejectEvalWith400 = false;

function startMockKVServer() {
  return new Promise((resolve) => {
    mockServer = http.createServer((req, res) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const [cmd, ...args] = body;
          const upperCmd = String(cmd).toUpperCase();
          const now = Date.now();

          // Targeted key-prefix failure injection hook
          if (failOnKeyPrefix && args[0] && String(args[0]).startsWith(failOnKeyPrefix)) {
            failOnKeyPrefix = null; // one-shot trigger
            res.writeHead(500, { 'Content-Type': 'application/json', 'Connection': 'close' });
            return res.end(JSON.stringify({ error: 'INJECTED_NETWORK_TIMEOUT_OR_FAILURE' }));
          }

          // Evict expired keys
          for (const [k, v] of mockKVStore.entries()) {
            if (v.expiresAt && v.expiresAt <= now) {
              mockKVStore.delete(k);
            }
          }

          if (upperCmd === 'SET') {
            const [key, value] = args;
            let exSeconds = null;
            let nx = false;

            for (let i = 2; i < args.length; i++) {
              if (String(args[i]).toUpperCase() === 'EX') {
                exSeconds = Number(args[i + 1]);
                i++;
              } else if (String(args[i]).toUpperCase() === 'NX') {
                nx = true;
              }
            }

            if (nx && mockKVStore.has(key)) {
              res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
              return res.end(JSON.stringify({ result: null }));
            }

            const expiresAt = exSeconds ? now + (exSeconds * 1000) : null;
            mockKVStore.set(key, { value, expiresAt, ttlSeconds: exSeconds });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
            return res.end(JSON.stringify({ result: 'OK' }));
          }

          if (upperCmd === 'GET') {
            const [key] = args;
            const entry = mockKVStore.get(key);
            res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
            return res.end(JSON.stringify({ result: entry ? entry.value : null }));
          }

          if (upperCmd === 'DEL') {
            const [key] = args;
            const existed = mockKVStore.delete(key);
            res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
            return res.end(JSON.stringify({ result: existed ? 1 : 0 }));
          }

          if (upperCmd === 'INCR') {
            const [key] = args;
            const entry = mockKVStore.get(key);
            let val = entry ? parseInt(entry.value, 10) : 0;
            if (isNaN(val)) val = 0;
            val += 1;
            mockKVStore.set(key, { value: String(val), expiresAt: entry ? entry.expiresAt : null, ttlSeconds: entry ? entry.ttlSeconds : null });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
            return res.end(JSON.stringify({ result: val }));
          }

          if (upperCmd === 'DECR') {
            const [key] = args;
            const entry = mockKVStore.get(key);
            let val = entry ? parseInt(entry.value, 10) : 0;
            if (isNaN(val)) val = 0;
            val -= 1;
            mockKVStore.set(key, { value: String(val), expiresAt: entry ? entry.expiresAt : null, ttlSeconds: entry ? entry.ttlSeconds : null });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
            return res.end(JSON.stringify({ result: val }));
          }

          if (upperCmd === 'EXPIRE') {
            const [key, seconds] = args;
            const entry = mockKVStore.get(key);
            if (entry) {
              entry.expiresAt = now + (Number(seconds) * 1000);
              entry.ttlSeconds = Number(seconds);
              res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
              return res.end(JSON.stringify({ result: 1 }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
            return res.end(JSON.stringify({ result: 0 }));
          }

          // Lua script simulation
          if (upperCmd === 'EVAL') {
            if (rejectEvalWith400) {
              res.writeHead(400, { 'Content-Type': 'application/json', 'Connection': 'close' });
              return res.end(JSON.stringify({ error: 'ERR unknown command `EVAL`' }));
            }

            const [script, numKeys, key, expectedVal] = args;
            if (numKeys === '1' || numKeys === 1) {
              const entry = mockKVStore.get(key);
              const currentVal = entry ? entry.value : null;
              if (currentVal && String(currentVal).trim() === String(expectedVal).trim()) {
                mockKVStore.delete(key);
                res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
                return res.end(JSON.stringify({ result: 1 }));
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
                return res.end(JSON.stringify({ result: 0 }));
              }
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json', 'Connection': 'close' });
          return res.end(JSON.stringify({ result: null }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: err.message }));
        }
      });
    });

    mockServer.listen(0, '127.0.0.1', () => {
      mockPort = mockServer.address().port;
      process.env.KV_REST_API_URL = `http://127.0.0.1:${mockPort}`;
      process.env.KV_REST_API_TOKEN = 'test-token-3f9';
      resolve();
    });
  });
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`[FAIL] ${name}: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`[FAIL] ${name}: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }
}

(async () => {
  await startMockKVServer();

  const {
    reserveDailyThroughputSlotDistributed,
    releaseDailyThroughputSlotDistributed,
    reconcileDailyQuotaDistributed
  } = await import('../api/_lib/dailyThroughputGovernor.js');

  const {
    compareAndDeleteKV,
    reserveSequenceStepDistributed,
    execKVCommand
  } = await import('../api/_lib/sequencePersistence.js');

  const { generateLeadId } = await import('../src/data/leadModel.js');

  // ---------------------------------------------------------------------------
  // TASK A: BLK-01 QUOTA RECOVERY & GOVERNOR DEFENSIVE COMPENSATION
  // ---------------------------------------------------------------------------
  console.log('--- TASK A: BLK-01 Quota Recovery & Governor Failure Injection ---');

  await runAsyncTest('A.1: Local Defensive Compensation: When reservation SET fails, quota counter is rolled back via DECR', async () => {
    const testDate = new Date('2026-10-21T10:00:00Z');
    const today = '2026-10-21';
    const quotaKey = `quota:daily:${today}`;
    await execKVCommand('SET', quotaKey, '4');

    // Inject failure on writing the reservation key
    failOnKeyPrefix = 'quota:res:';

    const res = await reserveDailyThroughputSlotDistributed({
      now: testDate,
      configuredLimit: 20,
      configuredPacing: 60,
      workerId: 'worker-crash-test'
    });

    assert.strictEqual(res.allowed, false, 'Reservation must not succeed');
    assert.strictEqual(res.blocked, true, 'Reservation must be marked blocked');
    assert.strictEqual(res.error, 'RESERVATION_WRITE_FAILED', 'Must report RESERVATION_WRITE_FAILED');

    // Verify quota counter was safely compensated back to 4
    const countAfter = await execKVCommand('GET', quotaKey);
    assert.strictEqual(Number(countAfter), 4, 'Quota counter MUST be rolled back to 4 via DECR');
  });

  await runAsyncTest('A.2: Quota Ceiling Enforcement: Concurrent requests beyond limit rollback increment', async () => {
    const testDate = new Date('2026-10-22T10:00:00Z');
    const dateKey = '2026-10-22';
    const quotaKey = `quota:daily:${dateKey}`;
    await execKVCommand('SET', quotaKey, '10'); // Already at limit 10

    const res = await reserveDailyThroughputSlotDistributed({
      now: testDate,
      configuredLimit: 10,
      configuredPacing: 60,
      workerId: 'worker-ceiling-test'
    });

    assert.strictEqual(res.allowed, false, 'Exceeded quota must be rejected');
    assert.strictEqual(res.quotaExceeded, true, 'quotaExceeded must be true');

    // Verify counter was decremented back to 10
    const countCheck = await execKVCommand('GET', quotaKey);
    assert.strictEqual(Number(countCheck), 10, 'Quota counter must remain at 10');
  });

  await runAsyncTest('A.3: Idempotent Reconciler: Reconciles leaked increments if process hard-crashed (SIGKILL)', async () => {
    const dateKey = '2026-10-23';
    const quotaKey = `quota:daily:${dateKey}`;

    // Simulate an uncompensated crash that left quota counter at 8, while only 5 valid reservations exist
    await execKVCommand('SET', quotaKey, '8');

    const recResult = await reconcileDailyQuotaDistributed(dateKey, 5);
    assert.strictEqual(recResult.reconciled, true, 'Reconciliation must succeed');
    assert.strictEqual(recResult.previousCount, 8, 'Previous count was 8');
    assert.strictEqual(recResult.newCount, 5, 'New count adjusted to 5');
    assert.strictEqual(recResult.compensated, 3, 'Compensated 3 orphaned increments');

    const finalVal = await execKVCommand('GET', quotaKey);
    assert.strictEqual(Number(finalVal), 5, 'Counter in KV must now match actual 5 reservations');
  });

  await runAsyncTest('A.4: Idempotent Release: Repeated release does not double-decrement or underflow', async () => {
    const dateKey = '2026-10-24';
    const quotaKey = `quota:daily:${dateKey}`;
    const resId = `RES-${dateKey}-1-nonce123`;
    const resKey = `quota:res:${resId}`;

    await execKVCommand('SET', quotaKey, '1');
    await execKVCommand('SET', resKey, JSON.stringify({ reservationId: resId }));

    // First release succeeds
    const rel1 = await releaseDailyThroughputSlotDistributed(dateKey, resId);
    assert.strictEqual(rel1, true, 'First release must succeed');

    const countAfter1 = await execKVCommand('GET', quotaKey);
    assert.strictEqual(Number(countAfter1), 0, 'Count must drop to 0');

    // Second release idempotently returns false without decrementing below 0
    const rel2 = await releaseDailyThroughputSlotDistributed(dateKey, resId);
    assert.strictEqual(rel2, false, 'Second release must be rejected as duplicate/already released');

    const countAfter2 = await execKVCommand('GET', quotaKey);
    assert.strictEqual(Number(countAfter2), 0, 'Count must remain 0 and never drop to -1');
  });

  // ---------------------------------------------------------------------------
  // TASK B: BLK-03 ATOMIC LUA EVAL VS FAIL-CLOSED
  // ---------------------------------------------------------------------------
  console.log('\n--- TASK B: BLK-03 Token-Fenced Distributed Locks ---');

  await runAsyncTest('B.1: Atomic Lua EVAL deletes key if token matches exactly', async () => {
    rejectEvalWith400 = false; // EVAL enabled
    const key = 'test:lock:eval_match';
    const payload = JSON.stringify({ workerId: 'worker-dead', token: 'tok-123' });

    await execKVCommand('SET', key, payload);

    const res = await compareAndDeleteKV(key, payload);
    assert.strictEqual(res, true, 'compareAndDeleteKV with matching token via Lua EVAL must return true');

    const check = await execKVCommand('GET', key);
    assert.strictEqual(check, null, 'Key must be deleted');
  });

  await runAsyncTest('B.2: Atomic Lua EVAL preserves key and rejects delete if Worker B replaced token', async () => {
    rejectEvalWith400 = false; // EVAL enabled
    const key = 'test:lock:eval_mismatch';
    const oldPayload = JSON.stringify({ workerId: 'worker-dead', token: 'tok-old' });
    const newPayload = JSON.stringify({ workerId: 'worker-live-b', token: 'tok-new' });

    await execKVCommand('SET', key, newPayload);

    const res = await compareAndDeleteKV(key, oldPayload);
    assert.strictEqual(res, false, 'compareAndDeleteKV with mismatched token must return false');

    const check = await execKVCommand('GET', key);
    assert.ok(check, 'Worker B key must be preserved');
    const parsed = JSON.parse(check);
    assert.strictEqual(parsed.workerId, 'worker-live-b', 'Worker B lock was preserved');

    await execKVCommand('DEL', key);
  });

  await runAsyncTest('B.3: Fail-Closed: When Lua EVAL is unavailable (HTTP 400), non-atomic delete is rejected by default', async () => {
    rejectEvalWith400 = true; // Simulate provider without Lua support
    const key = 'test:lock:eval_unavailable';
    const payload = JSON.stringify({ workerId: 'worker-test' });

    await execKVCommand('SET', key, payload);

    // Call compareAndDeleteKV without allowUnsafeFallback (default)
    const res = await compareAndDeleteKV(key, payload);
    assert.strictEqual(res, false, 'Must fail closed and return false when atomic EVAL is unavailable');

    // Key must NOT have been deleted via an unsafe non-atomic GET+DEL
    const check = await execKVCommand('GET', key);
    assert.ok(check, 'Key must be preserved; non-atomic delete was rejected');

    rejectEvalWith400 = false;
    await execKVCommand('DEL', key);
  });

  // ---------------------------------------------------------------------------
  // TASK C: LEAD ID COLLISION RESISTANCE & MATHEMATICAL SCOPE
  // ---------------------------------------------------------------------------
  console.log('\n--- TASK C: Lead ID Collision Resistance & Scope Analysis ---');

  runTest('C.1: Public Lead ID Format Compliance (/^AAF-L-\\d{4}-\\d{4}$/)', () => {
    const id = generateLeadId();
    assert.match(id, /^AAF-L-\d{4}-\d{4}$/, 'Format must strictly match AAF-L-YYYY-XXXX');
  });

  runTest('C.2: Modulo 9000 Wraparound: Counter rolls over cleanly between 1000 and 9999', () => {
    // Generate 9,500 IDs to force complete cycle and wraparound
    const idRegex = /^AAF-L-\d{4}-\d{4}$/;
    for (let i = 0; i < 9500; i++) {
      const id = generateLeadId();
      assert.ok(idRegex.test(id), `Lead ID ${id} broke format during cycle at ${i}`);
      const numPart = parseInt(id.split('-')[3], 10);
      assert.ok(numPart >= 1000 && numPart <= 9999, `Number part ${numPart} out of bounds [1000, 9999]`);
    }
  });

  runTest('C.3: Multi-Process Limitation Demonstration (Birthday Paradox Boundary)', () => {
    // Document that 4 digits provide exactly 9,000 slots per year.
    // In independent stateless containers without coordination:
    const slots = 9000;
    // Birthday problem: 50% collision probability at n ~ sqrt(2 * S * ln(2)) = 112
    const n50 = Math.round(Math.sqrt(2 * slots * Math.log(2)));
    assert.strictEqual(n50, 112, '50% collision probability occurs at ~112 uncoordinated serverless instances');
    console.log(`     [NOTE] Documented mathematical limitation: 4-digit sequence has 9,000 slots/yr; 50% collision at n=${n50}.`);
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n============================================================');
  console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('============================================================');

  if (mockServer) {
    mockServer.close();
  }

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
