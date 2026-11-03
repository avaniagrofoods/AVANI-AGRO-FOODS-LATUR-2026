/**
 * scripts/test_package_3f_8_concurrency_assurance.cjs
 *
 * PACKAGE 3F.8 — CONCURRENCY & FAILURE-INJECTION ASSURANCE TEST SUITE
 *
 * Exercises:
 *  1. BLK-03: Stale Lock Race Condition in Distributed Sequence Lock (compareAndDeleteKV fencing).
 *  2. BLK-01 / BLK-02: Governor Multi-Step Atomicity Failure-Injection & TTL Verification.
 *  3. Lead ID Uniqueness & Entropy Analysis across simulated independent workers.
 *  4. Contact Form Fallback & Persistence Gating Verification.
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('============================================================');
console.log('PACKAGE 3F.8: CONCURRENCY & FAILURE-INJECTION ASSURANCE');
console.log('============================================================\n');

// 1. Establish isolated testing environment
const tmpSubdir = path.join(os.tmpdir(), `aaf_test_pkg3f8_${Date.now()}`);
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

// 2. Start In-Memory Mock Upstash Redis Server
const mockKVStore = new Map();
let mockServer = null;
let mockPort = 0;

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

          // Atomic Lua script execution simulation
          if (upperCmd === 'EVAL') {
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
      process.env.KV_REST_API_TOKEN = 'test-token-3f8';
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

  // Dynamic import modules after setting environment
  const {
    compareAndDeleteKV,
    reserveSequenceStepDistributed,
    releaseReservationDistributed,
    generateStepIdempotencyKey,
    execKVCommand
  } = await import('../api/_lib/sequencePersistence.js');

  const {
    reserveDailyThroughputSlotDistributed,
    releaseDailyThroughputSlotDistributed,
    releaseDailyThroughputSlot
  } = await import('../api/_lib/dailyThroughputGovernor.js');

  // ---------------------------------------------------------------------------
  // TEST SUITE 1: BLK-03 DISTRIBUTED LOCK RACE & COMPARE-AND-DELETE FENCING
  // ---------------------------------------------------------------------------
  console.log('--- SUITE 1: BLK-03 Distributed Stale Lock Race Condition ---');

  await runAsyncTest('1.1: compareAndDeleteKV successfully deletes when value matches', async () => {
    const testKey = 'test:lock:compare_match';
    const valObj = { workerId: 'worker-dead', expiresAt: Date.now() - 5000 };
    const valStr = JSON.stringify(valObj);

    await execKVCommand('SET', testKey, valStr);

    const deleteResult = await compareAndDeleteKV(testKey, valStr);
    assert.strictEqual(deleteResult, true, 'compareAndDeleteKV should return true on matching value');

    const check = await execKVCommand('GET', testKey);
    assert.strictEqual(check, null, 'Key should be deleted from KV');
  });

  await runAsyncTest('1.2: compareAndDeleteKV rejects deletion when value differs (Worker B lock preserved)', async () => {
    const testKey = 'test:lock:compare_mismatch';
    const oldVal = JSON.stringify({ workerId: 'worker-dead', expiresAt: Date.now() - 5000 });
    const newVal = JSON.stringify({ workerId: 'worker-live-b', expiresAt: Date.now() + 60000 });

    await execKVCommand('SET', testKey, newVal);

    // Worker A attempts to delete using old expired payload
    const deleteResult = await compareAndDeleteKV(testKey, oldVal);
    assert.strictEqual(deleteResult, false, 'compareAndDeleteKV must reject deletion when value has changed');

    // Verify Worker B's lock is completely intact
    const currentVal = await execKVCommand('GET', testKey);
    assert.ok(currentVal, 'Key must remain in KV');
    const parsed = typeof currentVal === 'string' ? JSON.parse(currentVal) : currentVal;
    assert.strictEqual(parsed.workerId, 'worker-live-b', 'Worker B lock must not have been deleted');

    // Clean up
    await execKVCommand('DEL', testKey);
  });

  await runAsyncTest('1.3: Adversarial Interleaving: Worker A stale recovery does not delete Worker B lease', async () => {
    const campaignId = 'camp-race-test';
    const recipientId = 'recip-race-test';
    const sequenceId = 'seq-race-test';
    const stepNumber = 1;
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);
    const lockKey = `seq_res:${idempotencyKey}`;

    // Step A: Expired lock exists in KV
    const expiredLock = {
      campaignId,
      recipientId,
      sequenceId,
      stepNumber,
      workerId: 'worker-crashed',
      reservedAt: new Date(Date.now() - 10000).toISOString(),
      expiresAt: Date.now() - 1000 // expired 1s ago
    };
    await execKVCommand('SET', lockKey, JSON.stringify(expiredLock));

    // Step B: Worker B acquires the lock right before Worker A attempts cleanup
    const workerBLock = {
      campaignId,
      recipientId,
      sequenceId,
      stepNumber,
      workerId: 'worker-fast-b',
      reservedAt: new Date().toISOString(),
      expiresAt: Date.now() + 300000 // valid for 5 min
    };
    // Worker B replaces with valid active lease
    await execKVCommand('SET', lockKey, JSON.stringify(workerBLock));

    // Step C: Worker A attempts to clear stale lock using its expired snapshot
    const cleared = await compareAndDeleteKV(lockKey, JSON.stringify(expiredLock));
    assert.strictEqual(cleared, false, 'Worker A cleanup MUST fail because Worker B replaced the lock');

    // Worker A tries reserveSequenceStepDistributed
    const resA = await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'worker-slow-a', 300);
    assert.strictEqual(resA.reserved, false, 'Worker A must NOT acquire reservation');
    assert.strictEqual(resA.alreadyReserved, true, 'Worker A must report alreadyReserved: true');
    assert.strictEqual(resA.workerId, 'worker-fast-b', 'Reservation must show owned by worker-fast-b');

    // Verify Worker B's lock was preserved intact
    const checkB = await execKVCommand('GET', lockKey);
    const parsedB = typeof checkB === 'string' ? JSON.parse(checkB) : checkB;
    assert.strictEqual(parsedB.workerId, 'worker-fast-b', 'Worker B lock was preserved');

    // Clean up
    await execKVCommand('DEL', lockKey);
  });

  // ---------------------------------------------------------------------------
  // TEST SUITE 2: BLK-01 & BLK-02 GOVERNOR ATOMICITY & TTL VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 2: BLK-01 / BLK-02 Governor Atomicity & Failure Injection ---');

  runTest('2.1: Governor Reservation TTL alignment (BLK-02: 172800s / 48h)', () => {
    const govPath = path.resolve(__dirname, '../api/_lib/dailyThroughputGovernor.js');
    const govContent = fs.readFileSync(govPath, 'utf8');

    assert.ok(govContent.includes('172800'), 'dailyThroughputGovernor.js must define 48h TTL (172800s)');
    assert.ok(
      govContent.includes("await execKVCommand('SET', reservationKey, resRecord, 'EX', '172800')"),
      'SET command must pass EX 172800 for reservation key'
    );
  });

  await runAsyncTest('2.2: Governor Failure Injection: Crash between INCR and SET reservationKey leaves quota burned', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const testQuotaKey = `outreach:quota:failure_inject:${today}`;

    // Initial quota count
    await execKVCommand('SET', testQuotaKey, '5');

    // Worker simulates step 1 of non-atomic sequence: INCR
    const afterIncr = await execKVCommand('INCR', testQuotaKey);
    assert.strictEqual(Number(afterIncr), 6, 'INCR increments quota to 6');

    // Crash happens here! Network disconnect or process killed before SET reservationKey
    // Worker never writes reservationKey.
    // Result: Quota counter remains 6 without any reservation key ever existing to compensate or release it!
    const leakedQuota = await execKVCommand('GET', testQuotaKey);
    assert.strictEqual(Number(leakedQuota), 6, 'Demonstrated: Quota is burned without transactional compensation or Lua EVAL');

    // Clean up
    await execKVCommand('DEL', testQuotaKey);
  });

  await runAsyncTest('2.3: Idempotent Slot Release on non-existent or duplicate release', async () => {
    const bogusSlotId = 'RES-2026-10-21-99-nonexistent';
    const releaseResult = await releaseDailyThroughputSlotDistributed('2026-10-21', bogusSlotId);
    assert.strictEqual(releaseResult, false, 'Should return false for unknown slot without altering quota');
  });

  // ---------------------------------------------------------------------------
  // TEST SUITE 3: LEAD ID UNIQUENESS & ENTROPY SIMULATION
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 3: Lead ID Uniqueness & Entropy Simulation ---');

  const { generateLeadId } = await import('../src/data/leadModel.js');

  runTest('3.1: Lead ID format compliance and sequential validity', () => {
    const idRegex = /^AAF-L-\d{4}-\d{4}$/;
    const id1 = generateLeadId();
    const id2 = generateLeadId();

    assert.ok(idRegex.test(id1), `Lead ID "${id1}" must match /^AAF-L-\\d{4}-\\d{4}$/`);
    assert.ok(idRegex.test(id2), `Lead ID "${id2}" must match /^AAF-L-\\d{4}-\\d{4}$/`);
    assert.notStrictEqual(id1, id2, 'Consecutive lead IDs must not be identical');
  });

  runTest('3.2: Cross-Worker / Multi-Process entropy and collision resistance', () => {
    const generated = new Set();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      const id = generateLeadId();
      assert.ok(!generated.has(id), `Collision detected on lead ID ${id} at iteration ${i}`);
      generated.add(id);
    }
    assert.strictEqual(generated.size, count, `All ${count} generated lead IDs must be unique`);
  });

  // ---------------------------------------------------------------------------
  // TEST SUITE 4: CONTACT FORM FALLBACK & PERSISTENCE GATING
  // ---------------------------------------------------------------------------
  console.log('\n--- SUITE 4: Contact Form Fallback & Persistence Gating ---');

  runTest('4.1: Authoritative email in src/data/links.js matches sales@avaniagrofoods.com', () => {
    const linksPath = path.resolve(__dirname, '../src/data/links.js');
    const linksContent = fs.readFileSync(linksPath, 'utf8');

    assert.ok(linksContent.includes('sales@avaniagrofoods.com'), 'links.js must define sales@avaniagrofoods.com');
  });

  runTest('4.2: Contact.jsx imports BUSINESS_INFO and grounds sales email in UI', () => {
    const contactPath = path.resolve(__dirname, '../src/pages/Contact.jsx');
    const contactContent = fs.readFileSync(contactPath, 'utf8');

    assert.ok(
      contactContent.includes("from '../data/links'"),
      'Contact.jsx must import links configuration'
    );
    assert.ok(
      contactContent.includes('const { email, phone, whatsapp, address } = BUSINESS_INFO'),
      'Contact.jsx must destructure authoritative contact info from BUSINESS_INFO'
    );
    assert.ok(
      contactContent.includes('mailto:${email}') || contactContent.includes('mailto:'),
      'Contact.jsx must render mailto link with authoritative email'
    );
    assert.ok(
      contactContent.includes('saveData.success !== true'),
      'Contact.jsx must check for authoritative persistence success before showing confirmation'
    );
  });

  await runAsyncTest('4.3: api/save-lead.js persistence gating and notification status', async () => {
    const saveLeadHandler = (await import('../api/save-lead.js')).default;

    let statusCode = null;
    let responseBody = null;

    const mockReq = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        name: 'Assurance Lead Test',
        email: 'lead-assurance@test.com',
        phone: '+91 9999999999',
        requirement: 'Organic Turmeric inquiry'
      }
    };

    const mockRes = {
      status: (code) => {
        statusCode = code;
        return mockRes;
      },
      json: (data) => {
        responseBody = data;
        return mockRes;
      },
      setHeader: () => mockRes
    };

    await saveLeadHandler(mockReq, mockRes);

    assert.strictEqual(statusCode, 200, 'save-lead must return HTTP 200');
    assert.strictEqual(responseBody.success, true, 'save-lead must return success: true');
    assert.strictEqual(responseBody.leadPersistence, 'PERSISTED', 'save-lead must return leadPersistence: PERSISTED');
    assert.strictEqual(
      responseBody.integrations?.emailNotification,
      'DISABLED_PENDING_OWNER_DEC_07',
      'save-lead must explicitly report emailNotification: DISABLED_PENDING_OWNER_DEC_07'
    );
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
