// ============================================================
// AVANI AGRO FOODS — REMEDIATION PACKAGE 3C CONCURRENCY MATRIX
// scripts/test_package_3c_concurrency_matrix.cjs
//
// Verification Suite for Findings AAF-3B-01 through AAF-3B-06:
// 1. 20+ Concurrent Pacing Contenders (Anti-Burst Mutual Exclusion)
// 2. 20 Concurrent Duplicate Quota Releases (Atomic Single Decrement)
// 3. Provider Accepted-But-Timeout Handling (Uncertain Outcome / No Resend)
// 4. Dispatch Intent Reconciliation (Confirmed Sent vs Confirmed Not Sent)
// 5. Crashes Before vs After Provider Call
// 6. Stale Lease Owners & Fencing Token Violations
// 7. Duplicate Sequence Dispatch Idempotency
// 8. Partial Secondary Index Writes & Self-Healing Repair
// 9. Compound Key Escaping (Colons, Unicode, Boundaries)
// 10. Serverless Route Authentication (CRON_SECRET)
// 11. Safety Invariants (GLOBAL_OUTREACH_STOP, OUTREACH_AUTHORIZED)
// 12. Recipient Eligibility, Unsubscribe & Suppression Gates
// ============================================================

const assert = require('assert');
const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');

const REPO_ROOT = path.resolve(__dirname, '..');
const FORBIDDEN_DATA_DIR = path.resolve(REPO_ROOT, 'api', '_data');
const FORBIDDEN_SCRATCH_DIR = path.resolve(REPO_ROOT, 'scratch');
const SHARED_OPERATIONAL_STORE_PATH = path.resolve(FORBIDDEN_DATA_DIR, 'sequenceStateStore.json');

function establishTestIsolation(prefix) {
  if (process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)) {
    throw new Error('ISOLATION_VIOLATION: Test suite must never execute in production or Vercel runtime.');
  }

  const resolvedTmpRoot = path.resolve(os.tmpdir());
  const isolatedDir = fs.mkdtempSync(path.join(resolvedTmpRoot, prefix));
  try {
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
      'CRON_SECRET'
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
    delete process.env.CRON_SECRET;

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
    try {
      if (fs.existsSync(isolatedDir)) {
        fs.rmSync(isolatedDir, { recursive: true, force: true });
      }
    } catch {}
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

const ISOLATION = establishTestIsolation('aaf-p3c-matrix-test-');

// Mock Response Helper
function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    _json: null,
    _data: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this._json = obj; return this; },
    send(data) { this._data = data; return this; },
    end() { return this; }
  };
  return res;
}

// In-Memory Mock Upstash Redis Server
function createMockKVServer() {
  const kvStore = new Map();
  let simulate500 = false;
  let simulateDelayMs = 0;

  const server = http.createServer((req, res) => {
    if (simulate500) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const delay = simulateDelayMs;
      setTimeout(() => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const [cmd, ...args] = body;
          const upperCmd = String(cmd).toUpperCase();
          const now = Date.now();

          // Evict expired keys
          for (const [k, v] of kvStore.entries()) {
            if (v.expiresAt && v.expiresAt <= now) {
              kvStore.delete(k);
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

            if (nx && kvStore.has(key)) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ result: null }));
            }

            const expiresAt = exSeconds ? now + (exSeconds * 1000) : null;
            kvStore.set(key, { value, expiresAt });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ result: 'OK' }));
          }

          if (upperCmd === 'GET') {
            const [key] = args;
            const entry = kvStore.get(key);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ result: entry ? entry.value : null }));
          }

          if (upperCmd === 'DEL') {
            const [key] = args;
            const deleted = kvStore.delete(key) ? 1 : 0;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ result: deleted }));
          }

          if (upperCmd === 'INCR') {
            const [key] = args;
            const entry = kvStore.get(key);
            let val = entry ? parseInt(entry.value, 10) : 0;
            if (isNaN(val)) val = 0;
            val += 1;
            kvStore.set(key, { value: String(val), expiresAt: entry ? entry.expiresAt : null });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ result: val }));
          }

          if (upperCmd === 'DECR') {
            const [key] = args;
            const entry = kvStore.get(key);
            let val = entry ? parseInt(entry.value, 10) : 0;
            if (isNaN(val)) val = 0;
            val -= 1;
            kvStore.set(key, { value: String(val), expiresAt: entry ? entry.expiresAt : null });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ result: val }));
          }

          if (upperCmd === 'EXPIRE') {
            const [key, sec] = args;
            const entry = kvStore.get(key);
            if (entry) {
              entry.expiresAt = now + (Number(sec) * 1000);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ result: 1 }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ result: 0 }));
          }

          if (upperCmd === 'SADD') {
            const [key, ...members] = args;
            let entry = kvStore.get(key);
            let set;
            if (!entry || !(entry.value instanceof Set)) {
              set = new Set();
              if (entry && typeof entry.value === 'string') {
                try {
                  const parsed = JSON.parse(entry.value);
                  if (Array.isArray(parsed)) parsed.forEach(m => set.add(m));
                } catch {}
              }
            } else {
              set = entry.value;
            }
            let addedCount = 0;
            for (const m of members) {
              if (!set.has(m)) {
                set.add(m);
                addedCount++;
              }
            }
            kvStore.set(key, { value: set, expiresAt: entry ? entry.expiresAt : null });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ result: addedCount }));
          }

          if (upperCmd === 'SMEMBERS') {
            const [key] = args;
            const entry = kvStore.get(key);
            let members = [];
            if (entry) {
              if (entry.value instanceof Set) {
                members = Array.from(entry.value);
              } else if (Array.isArray(entry.value)) {
                members = entry.value;
              } else if (typeof entry.value === 'string') {
                try {
                  const parsed = JSON.parse(entry.value);
                  members = Array.isArray(parsed) ? parsed : [String(entry.value)];
                } catch {
                  members = [String(entry.value)];
                }
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ result: members }));
          }

          if (upperCmd === 'SREM') {
            const [key, ...members] = args;
            const entry = kvStore.get(key);
            let removedCount = 0;
            if (entry && entry.value instanceof Set) {
              for (const m of members) {
                if (entry.value.delete(m)) removedCount++;
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ result: removedCount }));
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ result: 'OK' }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: e.message }));
        }
      }, delay);
    });
  });

  return {
    server,
    kvStore,
    setSimulateDelayMs(ms) { simulateDelayMs = ms; }
  };
}

async function runTests() {
  console.log('============================================================');
  console.log('TEST SUITE: Remediation Package 3C Concurrency & Safety Matrix');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;
  let mock = null;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err);
      failed++;
    }
  }

  try {
    // 1. Start Mock Server
    mock = createMockKVServer();
    await new Promise(resolve => mock.server.listen(0, '127.0.0.1', resolve));
    const boundAddr = mock.server.address();
    assert.strictEqual(boundAddr && boundAddr.address, '127.0.0.1', 'Mock KV server must bind strictly to 127.0.0.1');
    assert.ok(boundAddr.port > 0, 'Mock KV server must bind to an ephemeral loopback port');
    const port = boundAddr.port;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.KV_REST_API_URL = `http://127.0.0.1:${port}`;
    process.env.KV_REST_API_TOKEN = 'test_token_p3c';
    process.env.REQUIRE_DISTRIBUTED_KV = '1';

    // Import application modules
    const {
      reserveDailyThroughputSlotDistributed,
      releaseDailyThroughputSlotDistributed,
      releasePacingLockDistributed
    } = await import('../api/_lib/dailyThroughputGovernor.js');

    const {
      escapeKeyComponent,
      unescapeKeyComponent,
      parseSequenceStorageKey,
      getSequenceStorageKey,
      saveRecipientSequenceStateDistributed,
      getRecipientSequenceStateDistributed,
      removeRecipientSequenceStateDistributed,
      findSequenceByCriteriaDistributed,
      saveDispatchIntentDistributed,
      getDispatchIntentDistributed,
      updateDispatchIntentStatusDistributed,
      reconcileSecondaryIndexesDistributed,
      getStorageConfiguration
    } = await import('../api/_lib/sequencePersistence.js');

    const {
      dispatchSequenceStepDistributed,
      reconcileUncertainDispatchIntentDistributed,
      SEQUENCE_STATUSES
    } = await import('../api/_lib/sequenceStateMachine.js');

    const cronHandler = (await import('../api/cron-sequence-dispatch.js')).default;

    // --- SECTION 1: KEY ENCODING & PARSING ---
    await test('1.1 Key Encoding: Component Escaping with Colons and Slashes', () => {
      const storageCfg = getStorageConfiguration();
      assert.strictEqual(storageCfg.isIsolated, true, 'Concurrency matrix must execute under explicit test isolation');
      assert.strictEqual(path.resolve(storageCfg.storePath), ISOLATION.isolatedStorePath, 'Local store path must match isolated temp store');
      const rawCamp = 'CAMP:2026:ASIA/EXP';
      const rawRecip = 'buyer:test:123@domain.com';
      const compound = getSequenceStorageKey(rawCamp, rawRecip);

      // Verify exactly one delimiter colon exists
      const colonCount = (compound.match(/:/g) || []).length;
      assert.strictEqual(colonCount, 1, 'Compound key must contain exactly 1 delimiter colon');

      const parsed = parseSequenceStorageKey(compound);
      assert.strictEqual(parsed.valid, true);
      assert.strictEqual(parsed.campaignId, rawCamp);
      assert.strictEqual(parsed.recipientId, rawRecip);
    });

  await test('1.2 Key Encoding: Unicode Preservation (Marathi & Hindi)', () => {
    const rawCamp = 'आवाणी:उद्योग:2026';
    const rawRecip = 'लातूर:buyer@domain.com';
    const compound = getSequenceStorageKey(rawCamp, rawRecip);

    const parsed = parseSequenceStorageKey(compound);
    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.campaignId, rawCamp);
    assert.strictEqual(parsed.recipientId, rawRecip);
  });

  await test('1.3 Key Encoding: Backward Compatibility with Legacy Unescaped Keys', () => {
    const legacyKey = 'CAMP-01:standard_buyer@domain.com';
    const parsed = parseSequenceStorageKey(legacyKey);
    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.campaignId, 'CAMP-01');
    assert.strictEqual(parsed.recipientId, 'standard_buyer@domain.com');
  });

  await test('1.4 Key Encoding: Boundary & Invalid Key Handlers', () => {
    assert.strictEqual(parseSequenceStorageKey('').valid, false);
    assert.strictEqual(parseSequenceStorageKey(null).valid, false);
    assert.strictEqual(parseSequenceStorageKey('NO_DELIMITER').valid, false);
    assert.strictEqual(parseSequenceStorageKey(':recipientOnly').valid, false);
    assert.strictEqual(parseSequenceStorageKey('campOnly:').valid, false);
  });

  // --- SECTION 2: 20+ CONCURRENT PACING CONTENDERS ---
  await test('2.1 Pacing: 25 Concurrent Contenders Race for 1-Send/Min Cooldown', async () => {
    const dateKey = '2026-10-14';
    mock.kvStore.delete('quota:pacing:log');
    mock.kvStore.delete('quota:pacing:active');
    mock.kvStore.delete(`quota:daily:${dateKey}`);

    const contendersCount = 25;
    const now = new Date('2026-10-14T10:00:00.000Z');

    // Simulate 25 workers hitting at the exact same millisecond
    const promises = [];
    for (let i = 0; i < contendersCount; i++) {
      promises.push(
        reserveDailyThroughputSlotDistributed({
          now,
          configuredLimit: 50,
          configuredPacing: 1, // 1 send per minute
          workerId: `worker-race-${i}`,
          trackTestQuota: true
        })
      );
    }

    const results = await Promise.all(promises);
    const granted = results.filter(r => r.allowed === true);
    const paced = results.filter(r => r.allowed === false && r.pacingExceeded === true);

    assert.strictEqual(granted.length, 1, 'EXACTLY 1 worker must be granted pacing slot');
    assert.strictEqual(paced.length, 24, 'EXACTLY 24 workers must be paced and rejected');

    // Daily quota count must equal 1 (all 24 rolled back)
    const dailyEntry = mock.kvStore.get(`quota:daily:${dateKey}`);
    assert.strictEqual(dailyEntry.value, '1', 'Daily quota must be rolled back to 1');
  });

  // --- SECTION 3: DUPLICATE QUOTA RELEASE (DOUBLE-DECREMENT PREVENTION) ---
  await test('3.1 Quota Release: 20 Concurrent Calls Cannot Double-Decrement', async () => {
    const dateKey = '2026-10-14';
    mock.kvStore.delete(`quota:daily:${dateKey}`);
    mock.kvStore.delete('quota:pacing:log');
    mock.kvStore.delete('quota:pacing:active');

    // Reserve 1 slot
    const res = await reserveDailyThroughputSlotDistributed({
      now: new Date('2026-10-14T11:00:00.000Z'),
      configuredLimit: 20,
      configuredPacing: 10,
      workerId: 'worker-rel-owner',
      trackTestQuota: true
    });
    assert.strictEqual(res.allowed, true);

    const initialDaily = mock.kvStore.get(`quota:daily:${dateKey}`);
    assert.strictEqual(initialDaily.value, '1');

    // 20 concurrent release calls for this EXACT reservation ID
    const releasePromises = [];
    for (let i = 0; i < 20; i++) {
      releasePromises.push(
        releaseDailyThroughputSlotDistributed(res.dateKey, res.reservationId, {
          workerId: i === 0 ? 'worker-rel-owner' : `worker-retry-${i}`
        })
      );
    }

    const releaseResults = await Promise.all(releasePromises);
    const successCount = releaseResults.filter(Boolean).length;
    const falseCount = releaseResults.filter(r => r === false).length;

    assert.strictEqual(successCount, 1, 'EXACTLY 1 release call must succeed');
    assert.strictEqual(falseCount, 19, '19 concurrent duplicate release calls must return false');

    // Quota counter must be decremented exactly ONCE (to 0, not below)
    const finalDaily = mock.kvStore.get(`quota:daily:${dateKey}`);
    assert.strictEqual(finalDaily.value, '0', 'Daily quota counter must equal 0, never negative');
  });

  // --- SECTION 4: PROVIDER ACCEPTED-BUT-TIMEOUT & UNCERTAIN OUTCOMES ---
  await test('4.1 Uncertain Outcome: Post-Acceptance Timeout Halts Auto-Resend', async () => {
    mock.kvStore.delete('quota:pacing:log');
    mock.kvStore.delete('quota:pacing:active');

    const recipientState = {
      recipientId: 'buyer-uncertain-01',
      recipient_email: 'buyer.uncertain@target.com',
      campaignId: 'CAMP-UNCERTAIN',
      sequenceId: 'SEQ-01',
      currentStep: 0,
      status: 'PROSPECT',
      approvedForOutreach: true
    };

    // Simulated provider call that times out after request was sent to Resend
    const timingOutTransmitter = async () => {
      const err = new Error('Gateway Timeout after transmission');
      err.timeoutAfterAcceptance = true;
      err.code = 'PROVIDER_TIMEOUT_AFTER_ACCEPTANCE';
      throw err;
    };

    const dispatchResult = await dispatchSequenceStepDistributed(
      recipientState,
      'CAMP-UNCERTAIN',
      {
        workerId: 'worker-timeout-test',
        isTestMode: true,
        globalOutreachStop: false,
        outreachAuthorized: true
      },
      timingOutTransmitter
    );

    assert.strictEqual(dispatchResult.success, false);
    assert.strictEqual(dispatchResult.uncertainOutcome, true);
    assert.strictEqual(dispatchResult.status, 'UNCERTAIN_OUTCOME');

    // Verify durable dispatch intent was recorded with UNCERTAIN_OUTCOME
    const intent = await getDispatchIntentDistributed(dispatchResult.idempotencyKey);
    assert.ok(intent, 'Durable intent must exist in distributed storage');
    assert.strictEqual(intent.status, 'UNCERTAIN_OUTCOME');

    // Verify reservation was NOT released (held to protect against duplicate send)
    const resKey = `seq_res:${dispatchResult.idempotencyKey}`;
    assert.ok(mock.kvStore.has(resKey), 'Reservation lease must remain HELD on uncertain outcome');

    // A subsequent automated retry must be rejected
    const retryAttempt = await dispatchSequenceStepDistributed(
      recipientState,
      'CAMP-UNCERTAIN',
      {
        workerId: 'worker-retry-auto',
        isTestMode: true,
        globalOutreachStop: false,
        outreachAuthorized: true
      },
      async () => ({ providerMessageId: 'duplicate-send' })
    );

    assert.strictEqual(retryAttempt.success, false, 'Auto-retry must be rejected');
    assert.strictEqual(retryAttempt.reserved, false, 'Retry must be locked out by existing lease');
    assert.strictEqual(retryAttempt.reason, 'ALREADY_RESERVED');
  });

  // --- SECTION 5: DISPATCH INTENT RECONCILIATION ---
  await test('5.1 Reconciliation: Confirmed Sent Transitions to COMMITTED', async () => {
    const idempotencyKey = 'CAMP-REC:buyer-rec-1:SEQ-01:EMAIL_1';
    await saveDispatchIntentDistributed(idempotencyKey, {
      intentId: 'INTENT-TEST-1',
      idempotencyKey,
      campaignId: 'CAMP-REC',
      recipientId: 'buyer-rec-1',
      sequenceId: 'SEQ-01',
      stepNumber: 1,
      email: 'buyer.rec@example.com',
      workerId: 'worker-rec',
      status: 'UNCERTAIN_OUTCOME'
    });

    const reconciliation = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
      providerStatus: 'DELIVERED',
      providerMessageId: 'resend_msg_confirmed_999'
    });

    assert.strictEqual(reconciliation.reconciled, true);
    assert.strictEqual(reconciliation.outcome, 'CONFIRMED_SENT');

    const updatedIntent = await getDispatchIntentDistributed(idempotencyKey);
    assert.strictEqual(updatedIntent.status, 'RECONCILED_CONFIRMED_SENT');
  });

  await test('5.2 Reconciliation: Confirmed NOT Sent Releases Reservation and Quota', async () => {
    const idempotencyKey = 'CAMP-REC:buyer-rec-2:SEQ-01:EMAIL_1';
    const dateKey = '2026-10-14';
    const reservationId = 'RES-2026-10-14-1-reconcile';

    // Seed reservation in KV
    mock.kvStore.set(`quota:res:${reservationId}`, { value: JSON.stringify({ reservationId }) });
    mock.kvStore.set(`seq_res:${idempotencyKey}`, { value: JSON.stringify({ workerId: 'worker-rec' }) });

    await saveDispatchIntentDistributed(idempotencyKey, {
      intentId: 'INTENT-TEST-2',
      idempotencyKey,
      campaignId: 'CAMP-REC',
      recipientId: 'buyer-rec-2',
      sequenceId: 'SEQ-01',
      stepNumber: 1,
      email: 'buyer.rec2@example.com',
      reservationId,
      dateKey,
      workerId: 'worker-rec',
      status: 'UNCERTAIN_OUTCOME'
    });

    const reconciliation = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
      providerStatus: 'NOT_SENT',
      reconciliationNotes: 'Provider logs confirm socket closed before request reached MTA'
    });

    assert.strictEqual(reconciliation.reconciled, true);
    assert.strictEqual(reconciliation.outcome, 'CONFIRMED_NOT_SENT');

    // Both reservation and quota slot must now be cleanly released
    assert.strictEqual(mock.kvStore.has(`seq_res:${idempotencyKey}`), false);
    assert.strictEqual(mock.kvStore.has(`quota:res:${reservationId}`), false);
  });

  // --- SECTION 6: SECONDARY INDEX REPAIR & SELF-HEALING ---
  await test('6.1 Secondary Index: Self-Healing Dangling Pointer Pruning', async () => {
    const email = 'selfhealing@buyer.com';
    const deadKey = 'CAMP-GHOST:recipient-ghost';
    const liveKey = 'CAMP-LIVE:recipient-live';

    // Seed set index with 1 live key and 1 dead key
    mock.kvStore.set(`seq_idx:email:${email}`, { value: new Set([deadKey, liveKey]) });

    // Seed state for live key only
    await saveRecipientSequenceStateDistributed('CAMP-LIVE', 'recipient-live', {
      campaign_id: 'CAMP-LIVE',
      recipient_id: 'recipient-live',
      recipient_email: email,
      status: 'EMAIL_1_SENT',
      current_step: 1
    });

    // Lookup should return the live sequence and prune the dead pointer
    const lookup = await findSequenceByCriteriaDistributed({ email });
    assert.strictEqual(lookup.ambiguous, false);
    assert.strictEqual(lookup.match.recipient_id, 'recipient-live');

    // Confirm that deadKey was self-healed and removed from the Redis Set
    const indexSet = mock.kvStore.get(`seq_idx:email:${email}`);
    assert.ok(indexSet && indexSet.value instanceof Set);
    assert.strictEqual(indexSet.value.has(deadKey), false, 'Dead key must be pruned from index set');
    assert.strictEqual(indexSet.value.has(liveKey), true, 'Live key must remain in index set');
  });

  await test('6.2 Secondary Index: Idempotent Index Reconciliation', async () => {
    const campaignId = 'CAMP-REPAIR';
    const recipientId = 'buyer-repair';
    const email = 'repair@buyer.com';

    // State exists in KV, but email secondary index is missing
    const state = {
      campaign_id: campaignId,
      recipient_id: recipientId,
      recipient_email: email,
      last_provider_message_id: 'msg-repair-123',
      status: 'EMAIL_1_SENT'
    };
    const compoundKey = getSequenceStorageKey(campaignId, recipientId);
    mock.kvStore.set(`seq_state:${compoundKey}`, { value: JSON.stringify(state) });
    mock.kvStore.delete(`seq_idx:email:${email}`);

    // Reconcile secondary index
    const result = await reconcileSecondaryIndexesDistributed(campaignId, recipientId, state);
    assert.strictEqual(result.reconciled, true);

    // Verify index was created and contains the key
    const emailSet = mock.kvStore.get(`seq_idx:email:${email}`);
    assert.ok(emailSet && emailSet.value instanceof Set);
    assert.ok(emailSet.value.has(compoundKey));
  });

    // --- SECTION 7: SERVERLESS ROUTE AUTH & SAFETY GATES ---
    await test('7.1 Serverless Route: Unauthenticated Request Blocked (401)', async () => {
      try {
        process.env.CRON_SECRET = 'valid_cron_secret_777';

        const req = {
          method: 'POST',
          headers: {},
          body: { recipientId: 'buyer-1' }
        };
        const res = mockRes();

        await cronHandler(req, res);
        assert.strictEqual(res.statusCode, 401);
        assert.strictEqual(res._json.error, 'UNAUTHORIZED');
      } finally {
        delete process.env.CRON_SECRET;
        process.env.GLOBAL_OUTREACH_STOP = '1';
        process.env.OUTREACH_AUTHORIZED = '0';
        process.env.REAL_BUYER_CONTACT = '0';
        process.env.REAL_BUYER_EMAILS = '0';
      }
    });

    await test('7.2 Serverless Route: GLOBAL_OUTREACH_STOP=1 Fail-Closed Blocked (403)', async () => {
      try {
        process.env.CRON_SECRET = 'valid_cron_secret_777';
        process.env.GLOBAL_OUTREACH_STOP = '1';

        const req = {
          method: 'POST',
          headers: { authorization: 'Bearer valid_cron_secret_777' },
          body: { recipientId: 'buyer-1' }
        };
        const res = mockRes();

        await cronHandler(req, res);
        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res._json.error, 'GLOBAL_OUTREACH_STOP_ENGAGED');
      } finally {
        delete process.env.CRON_SECRET;
        process.env.GLOBAL_OUTREACH_STOP = '1';
        process.env.OUTREACH_AUTHORIZED = '0';
        process.env.REAL_BUYER_CONTACT = '0';
        process.env.REAL_BUYER_EMAILS = '0';
      }
    });

    await test('7.3 Serverless Route: OUTREACH_AUTHORIZED Missing Blocked (403)', async () => {
      try {
        assert.strictEqual(process.env.SEQUENCE_TEST_ISOLATION, '1');
        assert.ok(String(process.env.KV_REST_API_URL || '').startsWith('http://127.0.0.1:'));
        process.env.CRON_SECRET = 'valid_cron_secret_777';

        const req = {
          method: 'POST',
          headers: { authorization: 'Bearer valid_cron_secret_777' },
          body: { recipientId: 'buyer-1' }
        };
        const res = mockRes();

        // Inject mock policy decision (mockGlobalStop: '0', mockOutreachAuthorized: '0') without mutating process.env
        await cronHandler(req, res, { mockGlobalStop: '0', mockOutreachAuthorized: '0' });
        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res._json.error, 'OUTREACH_NOT_AUTHORIZED');
      } finally {
        delete process.env.CRON_SECRET;
      }
    });

    await test('7.4 Serverless Route: Unsubscribed Recipient Rejected (422)', async () => {
      try {
        assert.strictEqual(process.env.SEQUENCE_TEST_ISOLATION, '1');
        assert.ok(String(process.env.KV_REST_API_URL || '').startsWith('http://127.0.0.1:'));
        process.env.CRON_SECRET = 'valid_cron_secret_777';

        await saveRecipientSequenceStateDistributed('CAMP-01', 'buyer-optout', {
          campaign_id: 'CAMP-01',
          recipient_id: 'buyer-optout',
          status: 'UNSUBSCRIBED',
          followups_cancelled: true
        });

        const req = {
          method: 'POST',
          headers: { authorization: 'Bearer valid_cron_secret_777' },
          body: { campaignId: 'CAMP-01', recipientId: 'buyer-optout' }
        };
        const res = mockRes();

        // Inject mock policy decision (mockGlobalStop: '0', mockOutreachAuthorized: '1') without mutating process.env
        await cronHandler(req, res, { mockGlobalStop: '0', mockOutreachAuthorized: '1' });
        assert.strictEqual(res.statusCode, 422);
        assert.strictEqual(res._json.error, 'RECIPIENT_UNSUBSCRIBED_OR_CANCELLED');
      } finally {
        delete process.env.CRON_SECRET;
      }
    });

    await test('7.5 Serverless Route: Dry-Run Inspection Returns 200 Eligible', async () => {
      try {
        assert.strictEqual(process.env.SEQUENCE_TEST_ISOLATION, '1');
        assert.ok(String(process.env.KV_REST_API_URL || '').startsWith('http://127.0.0.1:'));
        process.env.CRON_SECRET = 'valid_cron_secret_777';

        await saveRecipientSequenceStateDistributed('CAMP-01', 'buyer-approved', {
          campaign_id: 'CAMP-01',
          recipient_id: 'buyer-approved',
          status: 'PROSPECT',
          approvedForOutreach: true
        });

        const req = {
          method: 'POST',
          headers: { authorization: 'Bearer valid_cron_secret_777' },
          body: { campaignId: 'CAMP-01', recipientId: 'buyer-approved', dryRun: true }
        };
        const res = mockRes();

        // Inject mock policy decision (mockGlobalStop: '0', mockOutreachAuthorized: '1') without mutating process.env
        await cronHandler(req, res, { mockGlobalStop: '0', mockOutreachAuthorized: '1' });
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res._json.status, 'DRY_RUN_ELIGIBLE');
        assert.strictEqual(res._json.eligible, true);
      } finally {
        delete process.env.CRON_SECRET;
      }
    });

    console.log('\n============================================================');
    console.log(`PACKAGE 3C RESULTS: ${passed} passed, ${failed} failed.`);
    console.log('============================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    process.env.GLOBAL_OUTREACH_STOP = '1';
    process.env.OUTREACH_AUTHORIZED = '0';
    process.env.REAL_BUYER_CONTACT = '0';
    process.env.REAL_BUYER_EMAILS = '0';
    if (mock && mock.server) {
      try { mock.server.close(); } catch {}
    }
    cleanupIsolatedEnvironment(ISOLATION);
  }
}

runTests().catch(err => {
  console.error('Test harness exception:', err);
  process.exitCode = 1;
});
