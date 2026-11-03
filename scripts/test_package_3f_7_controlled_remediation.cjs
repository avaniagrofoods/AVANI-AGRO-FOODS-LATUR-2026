// ============================================================
// AVANI AGRO FOODS — PACKAGE 3F.7 CONTROLLED REMEDIATION TEST SUITE
// scripts/test_package_3f_7_controlled_remediation.cjs
// Tests:
// Package B (BLK-01 & BLK-02):
// - Pacing pre-check prevents crash-induced quota burns
// - Reservation key TTL aligns to 48 hours (172800s)
// - Limit exhaustion enforcement
// - Idempotent delayed release and underflow protection
//
// Package C (BLK-03):
// - Concurrent worker mutual exclusion for step reservation
// - Durable intent blocks concurrent re-dispatches
// - Cancellation / reply detection gate blocks step reservation
// - Stale lock detection and safe recovery
//
// Package D (BLK-04):
// - Lead persistence success separated from notification delivery status
// - Webhook outage isolation in /api/save-lead
// - Mock notification provider dispatch interface validation
// ============================================================

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

// 1. Establish isolated testing environment
const tmpSubdir = path.join(os.tmpdir(), `aaf_test_pkg3f7_${Date.now()}`);
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
      process.env.KV_REST_API_TOKEN = 'mock-test-token-3f7';
      process.env.REQUIRE_DISTRIBUTED_KV = '1';
      resolve();
    });
  });
}

async function runTestSuite() {
  await startMockKVServer();

  console.log('============================================================');
  console.log('PACKAGE 3F.7 — CONTROLLED REMEDIATION TEST SUITE');
  console.log('============================================================\n');

  const {
    reserveDailyThroughputSlotDistributed,
    releaseDailyThroughputSlotDistributed,
    getUtcDateKey
  } = await import('../api/_lib/dailyThroughputGovernor.js');

  const {
    reserveSequenceStepDistributed,
    releaseReservationDistributed,
    saveDispatchIntentDistributed,
    saveRecipientSequenceStateDistributed,
    generateStepIdempotencyKey
  } = await import('../api/_lib/sequencePersistence.js');

  const saveLeadModule = await import('../api/save-lead.js');
  const saveLeadHandler = saveLeadModule.default || saveLeadModule;

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`[FAIL] ${name} -> ${err.message}`);
      failedTests++;
    }
  }

  // -------------------------------------------------------------
  // PACKAGE B: QUOTA ATOMICITY AND RETENTION (BLK-01 & BLK-02)
  // -------------------------------------------------------------
  console.log('--- PACKAGE B: QUOTA ATOMICITY & RETENTION (BLK-01 & BLK-02) ---');

  await test('B1. Pacing Pre-check: Pacing block does NOT increment quota counter', async () => {
    mockKVStore.clear();
    const testDate = new Date('2026-10-21T10:00:00Z');
    const dateKey = getUtcDateKey(testDate);
    const quotaKey = `quota:daily:${dateKey}`;

    // First reservation acquires slot 1 and pacing lock
    const res1 = await reserveDailyThroughputSlotDistributed({
      now: testDate,
      workerId: 'worker-A',
      configuredLimit: 10,
      configuredPacing: 1
    });
    assert.strictEqual(res1.allowed, true, 'First reservation must be allowed');
    assert.strictEqual(res1.slot, 1, 'First reservation must have slot 1');

    const quotaAfterFirst = mockKVStore.get(quotaKey);
    assert.strictEqual(quotaAfterFirst.value, '1', 'Quota counter should be 1');

    // Second reservation 10 seconds later: must be blocked by pacing
    const testDatePaced = new Date('2026-10-21T10:00:10Z');
    const res2 = await reserveDailyThroughputSlotDistributed({
      now: testDatePaced,
      workerId: 'worker-B',
      configuredLimit: 10,
      configuredPacing: 1
    });

    assert.strictEqual(res2.allowed, false, 'Second reservation must be blocked');
    assert.strictEqual(res2.paced, true, 'Reason must be paced');

    // CRITICAL: Quota counter must STILL be exactly 1 (not 2 decremented to 1, no lost counter)
    const quotaAfterPacingBlock = mockKVStore.get(quotaKey);
    assert.strictEqual(quotaAfterPacingBlock.value, '1', 'Quota counter must remain untouched at 1 after pacing block');
  });

  await test('B2. TTL Alignment: Reservation key is set with 48h TTL (172800s) matching daily quota', async () => {
    mockKVStore.clear();
    const testDate = new Date('2026-10-21T11:00:00Z');
    const res = await reserveDailyThroughputSlotDistributed({
      now: testDate,
      workerId: 'worker-A',
      configuredLimit: 10,
      configuredPacing: 1
    });

    assert.strictEqual(res.allowed, true);
    const resKey = `quota:res:${res.reservationId}`;
    const resEntry = mockKVStore.get(resKey);
    assert(resEntry, 'Reservation entry must exist in KV');
    assert.strictEqual(resEntry.ttlSeconds, 172800, `Reservation TTL must be 172800s (48h), got ${resEntry.ttlSeconds}`);

    const resRecord = JSON.parse(resEntry.value);
    assert.strictEqual(resRecord.status, 'RESERVED', 'Reservation record must contain status RESERVED');
  });

  await test('B3. Limit Exhaustion: Ceils at configuredLimit without over-allocation', async () => {
    mockKVStore.clear();
    const testDate = new Date('2026-10-21T12:00:00Z');
    const limit = 3;

    for (let i = 1; i <= limit; i++) {
      // Advance clock by 61 seconds each time to avoid pacing
      const sendTime = new Date(testDate.getTime() + (i * 61000));
      const res = await reserveDailyThroughputSlotDistributed({
        now: sendTime,
        workerId: `worker-${i}`,
        configuredLimit: limit,
        configuredPacing: 1
      });
      assert.strictEqual(res.allowed, true, `Send ${i} should be allowed`);
    }

    // 4th send should be rejected due to quota exhaustion
    const sendTime4 = new Date(testDate.getTime() + (4 * 61000));
    const res4 = await reserveDailyThroughputSlotDistributed({
      now: sendTime4,
      workerId: 'worker-4',
      configuredLimit: limit,
      configuredPacing: 1
    });

    assert.strictEqual(res4.allowed, false, '4th send must be rejected');
    assert.strictEqual(res4.quotaExceeded, true, 'Must indicate quota exceeded');
    const quotaEntry = mockKVStore.get(`quota:daily:${getUtcDateKey(testDate)}`);
    assert.strictEqual(quotaEntry.value, String(limit), `Quota counter must be exactly ${limit}`);
  });

  await test('B4. Idempotent Release: Releasing reservation decrements once; second call returns false', async () => {
    mockKVStore.clear();
    const testDate = new Date('2026-10-21T13:00:00Z');
    const dateKey = getUtcDateKey(testDate);
    const quotaKey = `quota:daily:${dateKey}`;

    const res = await reserveDailyThroughputSlotDistributed({
      now: testDate,
      workerId: 'worker-release-test',
      configuredLimit: 10,
      configuredPacing: 1
    });

    assert.strictEqual(res.allowed, true);
    assert.strictEqual(mockKVStore.get(quotaKey).value, '1');

    // 1st release: succeeds, decrements counter to 0
    const rel1 = await releaseDailyThroughputSlotDistributed(dateKey, res.reservationId, { workerId: 'worker-release-test' });
    assert.strictEqual(rel1, true, 'First release must return true');
    assert.strictEqual(mockKVStore.get(quotaKey).value, '0', 'Quota counter must decrement to 0');

    // 2nd release (duplicate retry): returns false, does NOT decrement counter below 0
    const rel2 = await releaseDailyThroughputSlotDistributed(dateKey, res.reservationId, { workerId: 'worker-release-test' });
    assert.strictEqual(rel2, false, 'Second release must return false');
    assert.strictEqual(mockKVStore.get(quotaKey).value, '0', 'Quota counter must stay 0');
  });

  // -------------------------------------------------------------
  // PACKAGE C: SEQUENCE STEP RESERVATION & EXCLUSION (BLK-03)
  // -------------------------------------------------------------
  console.log('\n--- PACKAGE C: SEQUENCE STEP RESERVATION & EXCLUSION (BLK-03) ---');

  await test('C1. Concurrent Worker Mutual Exclusion: Exactly 1 wins, other rejected with ALREADY_RESERVED', async () => {
    mockKVStore.clear();
    const campaignId = 'CAMP-MUTEX-01';
    const recipientId = 'buyer-mutex@example.com';
    const sequenceId = 'SEQ-01';
    const stepNumber = 1;

    // Worker 1 reserves
    const res1 = await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'worker-1', 300);
    assert.strictEqual(res1.reserved, true, 'Worker 1 should acquire reservation');
    assert.strictEqual(res1.workerId, 'worker-1');

    // Worker 2 attempts same buyer & stepNumber
    const res2 = await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'worker-2', 300);
    assert.strictEqual(res2.reserved, false, 'Worker 2 must be rejected');
    assert.strictEqual(res2.alreadyReserved, true, 'Worker 2 must see alreadyReserved');
    assert.strictEqual(res2.workerId, 'worker-1', 'Must identify current lock holder');
  });

  await test('C2. Durable Intent Gate: In-flight or reconciliation hold intent blocks step reservation', async () => {
    mockKVStore.clear();
    const campaignId = 'CAMP-INTENT-01';
    const recipientId = 'buyer-intent@example.com';
    const sequenceId = 'SEQ-01';
    const stepNumber = 2;
    const idemKey = generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);

    // Save intent in RECONCILIATION_HOLD
    await saveDispatchIntentDistributed(idemKey, {
      status: 'RECONCILIATION_HOLD',
      campaignId,
      recipientId,
      stepNumber,
      providerMessageId: 'PENDING-RECONCILE-001'
    });

    const res = await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'worker-new', 300);
    assert.strictEqual(res.reserved, false, 'Reservation must be blocked by reconciliation hold');
    assert.strictEqual(res.reconciliationHold, true, 'Must indicate reconciliationHold');
    assert(res.reason.includes('DISPATCH_INTENT_RECONCILIATION_HOLD'));
  });

  await test('C3. Cancellation Gate: Inbound reply detected blocks step reservation', async () => {
    mockKVStore.clear();
    const campaignId = 'CAMP-REPLY-01';
    const recipientId = 'buyer-reply@example.com';
    const sequenceId = 'SEQ-01';
    const stepNumber = 2;

    // Save state with reply detected
    await saveRecipientSequenceStateDistributed(campaignId, recipientId, {
      reply_detected: true,
      followups_cancelled: true,
      status: 'REPLIED'
    });

    const res = await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'worker-3', 300);
    assert.strictEqual(res.reserved, false, 'Reservation must be blocked when reply is detected');
    assert.strictEqual(res.reason, 'REPLY_ALREADY_DETECTED_FOLLOWUPS_CANCELLED');
  });

  await test('C4. Stale Lock Detection & Recovery: Lock past expiration timestamp is cleared and re-acquired', async () => {
    mockKVStore.clear();
    const campaignId = 'CAMP-STALE-01';
    const recipientId = 'buyer-stale@example.com';
    const sequenceId = 'SEQ-01';
    const stepNumber = 1;
    const idemKey = generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);

    // Seed expired reservation in mock KV (simulating clock skew or past expiration)
    const expiredReservation = JSON.stringify({
      workerId: 'worker-dead',
      reservedAt: new Date(Date.now() - 400000).toISOString(),
      expiresAt: Date.now() - 10000 // Expired 10s ago
    });
    mockKVStore.set(`seq_res:${idemKey}`, { value: expiredReservation, expiresAt: Date.now() + 60000 });

    // Active worker attempts reservation
    const res = await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'worker-alive', 300);
    assert.strictEqual(res.reserved, true, 'Alive worker must recover and acquire stale lock');
    assert.strictEqual(res.workerId, 'worker-alive');
  });

  // -------------------------------------------------------------
  // PACKAGE D: INBOUND NOTIFICATIONS & ISOLATION (BLK-04)
  // -------------------------------------------------------------
  console.log('\n--- PACKAGE D: INBOUND NOTIFICATIONS & ISOLATION (BLK-04) ---');

  function mockHttpReqRes(body) {
    const req = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      },
      body
    };

    let statusCode = 200;
    let resJson = null;

    const res = {
      setHeader: () => {},
      status: (c) => { statusCode = c; return res; },
      json: (data) => { resJson = data; return res; }
    };

    return { req, res, getStatus: () => statusCode, getData: () => resJson };
  }

  await test('D1. Save-lead response separates lead persistence from email notification status', async () => {
    const payload = {
      name: 'Priya Patel',
      email: 'priya@example.com',
      phone: '+91 9123456789',
      company: 'Patel Trading',
      country: 'India',
      product: 'Moringa Leaf Powder',
      quantity: '1000',
      message: 'Urgent commercial requirement'
    };

    const { req, res, getStatus, getData } = mockHttpReqRes(payload);
    await saveLeadHandler(req, res);

    assert.strictEqual(getStatus(), 200, 'HTTP status must be 200');
    const data = getData();
    assert.strictEqual(data.success, true, 'Lead capture success must be true');
    assert.strictEqual(data.leadPersistence, 'PERSISTED', 'Lead persistence must be marked PERSISTED');
    assert(data.notificationDeliveryStatus, 'Must have notificationDeliveryStatus object');
    assert.strictEqual(data.notificationDeliveryStatus.emailNotification, 'DISABLED_PENDING_OWNER_DEC_07', 'Email notification must be clearly marked pending DEC-07');
  });

  await test('D2. Webhook Outage Isolation: Webhook failure does NOT cause save-lead to fail', async () => {
    // Set invalid webhook URL to simulate webhook server down
    const origWebhook = process.env.GOOGLE_SHEETS_WEBHOOK;
    process.env.GOOGLE_SHEETS_WEBHOOK = 'http://127.0.0.1:1'; // Non-existent local port -> ECONNREFUSED

    try {
      const payload = {
        name: 'Carlos Gomez',
        email: 'carlos@example.com',
        phone: '+34 600 000 000',
        company: 'Iberica Spice',
        country: 'Spain',
        product: 'Red Onion Powder',
        quantity: '500',
        message: 'Sample request'
      };

      const { req, res, getStatus, getData } = mockHttpReqRes(payload);
      await saveLeadHandler(req, res);

      // Lead capture must still succeed!
      assert.strictEqual(getStatus(), 200, 'Must still return 200 even when webhook drops');
      const data = getData();
      assert.strictEqual(data.success, true, 'Lead capture must succeed despite webhook failure');
      assert.strictEqual(data.integrations.googleSheetsInquiry, 'FAILED', 'Webhook status must record FAILED without crashing endpoint');
    } finally {
      if (origWebhook) {
        process.env.GOOGLE_SHEETS_WEBHOOK = origWebhook;
      } else {
        delete process.env.GOOGLE_SHEETS_WEBHOOK;
      }
    }
  });

  await test('D3. Mock Notification Provider Interface: validates dispatch payload, timeout, and rejection', async () => {
    // Modular mock notification dispatcher contract
    async function mockNotificationDispatcher(leadData, providerMock) {
      if (!leadData || !leadData.email || !leadData.name) {
        throw new Error('INVALID_NOTIFICATION_PAYLOAD');
      }
      return providerMock(leadData);
    }

    // Case A: Provider Success
    const successResult = await mockNotificationDispatcher({ name: 'A', email: 'a@a.com' }, async () => ({
      sent: true,
      messageId: 'MSG-MOCK-001',
      provider: 'MOCK_TRANSACTIONAL'
    }));
    assert.strictEqual(successResult.sent, true);

    // Case B: Provider Rate Limited (429)
    try {
      await mockNotificationDispatcher({ name: 'A', email: 'a@a.com' }, async () => {
        const err = new Error('Rate limit exceeded (429)');
        err.statusCode = 429;
        throw err;
      });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.statusCode, 429);
    }

    // Case C: Provider Timeout
    try {
      await mockNotificationDispatcher({ name: 'A', email: 'a@a.com' }, async () => {
        const err = new Error('Provider connection timed out');
        err.code = 'ETIMEDOUT';
        throw err;
      });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.code, 'ETIMEDOUT');
    }
  });

  console.log('\n============================================================');
  console.log(`PACKAGE 3F.7 REMEDIATION TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('============================================================\n');

  mockServer.close();

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  if (mockServer) mockServer.close();
  process.exit(1);
});
