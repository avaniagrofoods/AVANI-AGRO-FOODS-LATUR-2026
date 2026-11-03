// ============================================================
// AVANI AGRO FOODS — Distributed Persistence & Deduplication Matrix
// Phase 3 Remediation Verification
// ============================================================

const assert = require('assert');
const http = require('http');
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
      'KV_TIMEOUT_MS',
      'RESEND_WEBHOOK_SECRET'
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
    delete process.env.KV_TIMEOUT_MS;

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

const ISOLATION = establishTestIsolation('aaf-dist-matrix-test-');

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

          // Clean expired keys
          for (const [k, v] of kvStore.entries()) {
            if (v.expiresAt && v.expiresAt <= now) {
              kvStore.delete(k);
            }
          }

          if (upperCmd === 'SET') {
            const [key, value, opt1, opt2, opt3] = args;
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
                if (entry.value.delete(m)) {
                  removedCount++;
                }
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
    setSimulate500(val) { simulate500 = val; },
    setSimulateDelayMs(ms) { simulateDelayMs = ms; }
  };
}

async function runTests() {
  console.log('============================================================');
  console.log('TEST SUITE: Distributed Persistence & Deduplication Matrix');
  console.log('============================================================\n');

  let mock = null;
  let passed = 0;
  let failed = 0;

  try {
    const {
      claimEventDistributed,
      completeEventDistributed,
      getEventStatusDistributed,
      hasEventBeenProcessed,
      recordProcessedEvent,
      getRecipientSequenceStateDistributed,
      saveRecipientSequenceStateDistributed,
      removeRecipientSequenceStateDistributed,
      isSequenceActiveState,
      reserveSequenceStepDistributed,
      releaseReservationDistributed,
      commitSequenceStepDistributed,
      recordReplyReceivedDistributed,
      recordBounceDistributed,
      findSequenceByCriteriaDistributed,
      getStorageConfiguration
    } = await import('../api/_lib/sequencePersistence.js');

    const {
      reserveDailyThroughputSlotDistributed,
      releaseDailyThroughputSlotDistributed,
      reserveDailyThroughputSlot,
      releaseDailyThroughputSlot
    } = await import('../api/_lib/dailyThroughputGovernor.js');

    const {
      processInboundReply,
      processInboundReplyAsync,
      matchInboundReplyAsync
    } = await import('../api/_lib/replyDetector.js');

    const webhookHandler = (await import('../api/email-reply-webhook.js')).default;

    const {
      dispatchSequenceStepDistributed,
      SEQUENCE_STATUSES,
      createRecipientState
    } = await import('../api/_lib/sequenceStateMachine.js');

    async function test(name, fn) {
      try {
        await fn();
        console.log(`[PASS] ${name}`);
        passed++;
      } catch (err) {
        console.error(`[FAIL] ${name}:`, err.stack || err.message);
        failed++;
      }
    }

    // --- SECTION 1: Local File / In-Memory Fallback Mode ---
    console.log('--- 1. LOCAL STORAGE FALLBACK TESTS ---');

    await test('1.1 Local Mode: Synchronous interfaces preserved', () => {
      const storageCfg = getStorageConfiguration();
      assert.strictEqual(storageCfg.isIsolated, true, 'Local mode must execute under explicit test isolation');
      assert.strictEqual(path.resolve(storageCfg.storePath), ISOLATION.isolatedStorePath, 'Local store path must match isolated temp store');
      const testId = 'sync_evt_local_001';
      assert.strictEqual(hasEventBeenProcessed(testId), false);
      recordProcessedEvent(testId, { type: 'test_sync' });
      assert.strictEqual(hasEventBeenProcessed(testId), true);
    });

    await test('1.2 Local Mode: Atomic claim grants Worker 1, rejects Worker 2 as in-flight', async () => {
      const testId = 'claim_local_002';
      const c1 = await claimEventDistributed(testId, 'worker-1', 60);
      assert.strictEqual(c1.claimed, true);
      assert.strictEqual(c1.duplicate, false);

      const c2 = await claimEventDistributed(testId, 'worker-2', 60);
      assert.strictEqual(c2.claimed, false);
      assert.strictEqual(c2.duplicate, true);
      assert.strictEqual(c2.status, 'CLAIMED');
    });

    await test('1.3 Local Mode: Completion marks PROCESSED and subsequent delivery is duplicate', async () => {
      const testId = 'complete_local_003';
      await claimEventDistributed(testId, 'worker-1', 60);
      await completeEventDistributed(testId, { success: true });

      const status = await getEventStatusDistributed(testId);
      assert.strictEqual(status.exists, true);
      assert.strictEqual(status.status, 'PROCESSED');

      const cRetry = await claimEventDistributed(testId, 'worker-retry', 60);
      assert.strictEqual(cRetry.claimed, false);
      assert.strictEqual(cRetry.duplicate, true);
      assert.strictEqual(cRetry.status, 'PROCESSED');
    });

    // --- SECTION 2: Distributed Upstash KV Mode ---
    console.log('\n--- 2. DISTRIBUTED KV REST TESTS ---');

    mock = createMockKVServer();
    await new Promise(resolve => mock.server.listen(0, '127.0.0.1', resolve));
    const boundAddr = mock.server.address();
    assert.strictEqual(boundAddr && boundAddr.address, '127.0.0.1', 'Mock KV server must bind strictly to 127.0.0.1');
    assert.ok(boundAddr.port > 0, 'Mock KV server must bind to an ephemeral loopback port');
    const port = boundAddr.port;
    const mockKvUrl = `http://127.0.0.1:${port}`;
    const mockKvToken = 'mock_test_token_2026';

    const origKvUrl = process.env.KV_REST_API_URL;
    const origKvToken = process.env.KV_REST_API_TOKEN;
    const origStrict = process.env.REQUIRE_DISTRIBUTED_KV;
    const origSecret = process.env.RESEND_WEBHOOK_SECRET;

    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.KV_REST_API_URL = mockKvUrl;
    process.env.KV_REST_API_TOKEN = mockKvToken;
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_dGVzdF93ZWJob29rX3NlY3JldF8zMmJ5dGVzX2FhZjEyMw==';

    try {
      await test('2.1 Distributed Mode: Atomic claim via SET NX grants Worker A, blocks Worker B', async () => {
      const eventId = 'kv_evt_claim_001';
      const claimA = await claimEventDistributed(eventId, 'worker-A', 60);
      assert.strictEqual(claimA.claimed, true);
      assert.strictEqual(claimA.duplicate, false);
      assert.strictEqual(claimA.storage, 'distributed_kv');

      const claimB = await claimEventDistributed(eventId, 'worker-B', 60);
      assert.strictEqual(claimB.claimed, false);
      assert.strictEqual(claimB.duplicate, true);
      assert.strictEqual(claimB.status, 'CLAIMED');
    });

    await test('2.2 Distributed Mode: Completion persists PROCESSED with 7-day TTL', async () => {
      const eventId = 'kv_evt_complete_002';
      await claimEventDistributed(eventId, 'worker-A', 60);
      await completeEventDistributed(eventId, { action: 'CANCELLED_FOLLOWUPS' });

      const status = await getEventStatusDistributed(eventId);
      assert.strictEqual(status.exists, true);
      assert.strictEqual(status.status, 'PROCESSED');
      assert.strictEqual(status.details?.details?.action, 'CANCELLED_FOLLOWUPS');
    });

    await test('2.3 Distributed Mode: Multi-instance / cold-start simulation', async () => {
      const eventId = 'kv_cold_start_003';
      // Worker 1 on Lambda container 1 completes event
      await claimEventDistributed(eventId, 'lambda-container-1', 60);
      await completeEventDistributed(eventId, { coldStartTest: true });

      // Worker 2 on separate Lambda container 2 (fresh query)
      const claim2 = await claimEventDistributed(eventId, 'lambda-container-2', 60);
      assert.strictEqual(claim2.claimed, false);
      assert.strictEqual(claim2.duplicate, true);
      assert.strictEqual(claim2.status, 'PROCESSED');
    });

    await test('2.4 Distributed Mode: Crash window lease expiration and retry recovery', async () => {
      const eventId = 'kv_crash_recover_004';
      // Worker 1 claims with short 1-second lease, then crashes (no completeEventDistributed)
      const claim1 = await claimEventDistributed(eventId, 'worker-crash-1', 1);
      assert.strictEqual(claim1.claimed, true);

      // Immediate concurrent attempt is blocked
      const immediate = await claimEventDistributed(eventId, 'worker-retry-2', 1);
      assert.strictEqual(immediate.claimed, false);

      // Wait 1.2s for lease to expire
      await new Promise(r => setTimeout(r, 1200));

      // Worker 2 / retry attempt after lease expiration recovers and acquires lease
      const recovered = await claimEventDistributed(eventId, 'worker-retry-2', 60);
      assert.strictEqual(recovered.claimed, true);
      assert.strictEqual(recovered.duplicate, false);

      // Worker 2 completes processing
      await completeEventDistributed(eventId, { recovered: true });
      const finalStatus = await getEventStatusDistributed(eventId);
      assert.strictEqual(finalStatus.status, 'PROCESSED');
    });

    await test('2.5 Backend Outage: REQUIRE_DISTRIBUTED_KV=1 fails closed without silent fallback', async () => {
      process.env.REQUIRE_DISTRIBUTED_KV = '1';
      mock.setSimulate500(true);

      const eventId = 'kv_outage_005';
      await assert.rejects(async () => {
        await claimEventDistributed(eventId, 'worker-outage', 60);
      }, err => {
        return err.code === 'KV_BACKEND_ERROR';
      });

      // Webhook handler returns HTTP 503 DISTRIBUTED_KV_UNAVAILABLE
      const req = {
        method: 'POST',
        headers: {
          'x-webhook-secret': 'whsec_dGVzdF93ZWJob29rX3NlY3JldF8zMmJ5dGVzX2FhZjEyMw=='
        },
        body: JSON.stringify({ id: 'evt_outage_req_001', type: 'email.received' })
      };
      const res = mockRes();
      await webhookHandler(req, res);
      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res._json?.code, 'DISTRIBUTED_KV_UNAVAILABLE');

      mock.setSimulate500(false);
      delete process.env.REQUIRE_DISTRIBUTED_KV;
    });

    await test('2.6 Missing Credentials: REQUIRE_DISTRIBUTED_KV=1 fails closed', async () => {
      process.env.REQUIRE_DISTRIBUTED_KV = '1';
      delete process.env.KV_REST_API_URL;

      await assert.rejects(async () => {
        await claimEventDistributed('evt_missing_creds', 'worker', 60);
      }, err => {
        return err.code === 'KV_CREDENTIALS_MISSING';
      });

      process.env.KV_REST_API_URL = mockKvUrl;
      delete process.env.REQUIRE_DISTRIBUTED_KV;
    });

    await test('2.7 Timeout Handling: Exceeding KV_TIMEOUT_MS fails closed under strict mode', async () => {
      process.env.REQUIRE_DISTRIBUTED_KV = '1';
      process.env.KV_TIMEOUT_MS = '100'; // 100ms timeout
      mock.setSimulateDelayMs(300);      // 300ms server delay

      await assert.rejects(async () => {
        await claimEventDistributed('evt_timeout_test', 'worker', 60);
      }, err => {
        return err.code === 'KV_TIMEOUT';
      });

      mock.setSimulateDelayMs(0);
      delete process.env.KV_TIMEOUT_MS;
      delete process.env.REQUIRE_DISTRIBUTED_KV;
    });

    await test('2.8 Stale Worker Protection: Lease expiry and takeover rejects stale worker completion', async () => {
      const eventId = 'kv_stale_worker_008';
      // Worker 1 claims with short 1-second lease
      await claimEventDistributed(eventId, 'worker-stale-1', 1);

      // Lease expires after 1.2s
      await new Promise(r => setTimeout(r, 1200));

      // Worker 2 takes over the lease
      const claim2 = await claimEventDistributed(eventId, 'worker-active-2', 60);
      assert.strictEqual(claim2.claimed, true);

      // Stale Worker 1 wakes up and attempts completion with workerId check
      process.env.REQUIRE_DISTRIBUTED_KV = '1';
      await assert.rejects(async () => {
        await completeEventDistributed(eventId, { done: true }, 604800, 'worker-stale-1');
      }, err => {
        return err.code === 'STALE_WORKER_CLAIM_SUPERSEDED';
      });
      delete process.env.REQUIRE_DISTRIBUTED_KV;

      // Active Worker 2 successfully completes
      const comp2 = await completeEventDistributed(eventId, { done: true }, 604800, 'worker-active-2');
      assert.strictEqual(comp2.completed, true);
    });

    // --- SECTION 3: DISTRIBUTED SEQUENCE STATE & CONCURRENCY FENCING ---
    console.log('\n--- 3. DISTRIBUTED SEQUENCE STATE & CONCURRENCY FENCING TESTS ---');

    await test('3.1 Multi-Instance Concurrency: Step reservation via SET NX EX blocks simultaneous workers', async () => {
      const campaignId = 'CMP_DIST_TEST_01';
      const recipientId = 'buyer_concur_01';
      const sequenceId = 'SEQ-01';
      const stepNumber = 2;

      // Instance A reserves EMAIL_2
      const resA = await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'instance-A-worker', 60);
      assert.strictEqual(resA.reserved, true);
      assert.strictEqual(resA.workerId, 'instance-A-worker');
      assert.strictEqual(resA.storage, 'distributed_kv');

      // Instance B simultaneously attempts reservation
      const resB = await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'instance-B-worker', 60);
      assert.strictEqual(resB.reserved, false);
      assert.strictEqual(resB.alreadyReserved, true);
      assert.strictEqual(resB.workerId, 'instance-A-worker');
    });

    await test('3.2 Fencing & Stale Worker Rejection on Step Commit', async () => {
      const campaignId = 'CMP_DIST_TEST_02';
      const recipientId = 'buyer_fencing_02';
      const sequenceId = 'SEQ-01';
      const stepNumber = 3;

      // Worker 1 reserves EMAIL_3 with short 1-second lease
      await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'worker-lease-1', 1);

      // Lease expires
      await new Promise(r => setTimeout(r, 1200));

      // Worker 2 takes over reservation
      const res2 = await reserveSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, 'worker-lease-2', 60);
      assert.strictEqual(res2.reserved, true);

      // Stale Worker 1 attempts commit -> rejected due to fencing violation
      const commitStale = await commitSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, {
        workerId: 'worker-lease-1'
      });
      assert.strictEqual(commitStale.committed, false);
      assert.strictEqual(commitStale.fencingViolation, true);

      // Legitimate Worker 2 commits successfully
      const commitValid = await commitSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, {
        workerId: 'worker-lease-2',
        providerMessageId: 'msg_valid_fenced_2026'
      });
      assert.strictEqual(commitValid.committed, true);
      assert.strictEqual(commitValid.status, 'EMAIL_3_SENT');
    });

    await test('3.3 Cross-Instance Distributed Reply Matching & Cancellation', async () => {
      const campaignId = 'CMP_DIST_REPLY_03';
      const recipientId = 'buyer_cross_03';
      const recipientEmail = 'procurement.cross@agrotrade.org';

      // Instance 1 creates and saves sequence state in distributed KV
      await saveRecipientSequenceStateDistributed(campaignId, recipientId, {
        campaign_id: campaignId,
        recipient_id: recipientId,
        recipient_email: recipientEmail,
        status: 'EMAIL_1_SENT',
        current_step: 1,
        last_provider_message_id: 'msg_cross_outbound_101'
      });

      // Instance 2 receives inbound reply webhook and processes via processInboundReplyAsync
      const inboundReplyPayload = {
        type: 'email.received',
        id: 'evt_cross_reply_999',
        data: {
          from: `Trade Lead <${recipientEmail}>`,
          subject: 'Re: Quotation Request Soybean Meal',
          headers: {
            'in-reply-to': 'msg_cross_outbound_101'
          }
        }
      };

      const replyResult = await processInboundReplyAsync(inboundReplyPayload);
      assert.strictEqual(replyResult.success, true);
      assert.strictEqual(replyResult.action, 'FOLLOWUPS_CANCELLED');

      // Instance 1 queries distributed state and confirms cancellation
      const stateOnInstance1 = await getRecipientSequenceStateDistributed(campaignId, recipientId);
      assert.strictEqual(stateOnInstance1.status, 'REPLIED');
      assert.strictEqual(stateOnInstance1.reply_detected, true);
      assert.strictEqual(stateOnInstance1.followups_cancelled, true);
      assert.strictEqual(stateOnInstance1.next_step, 'NONE');

      // Instance 1 attempts to reserve EMAIL_2 -> blocked due to reply cancellation
      const blockedRes = await reserveSequenceStepDistributed(campaignId, recipientId, 'SEQ-01', 2, 'worker-cron-instance-1');
      assert.strictEqual(blockedRes.reserved, false);
      assert.strictEqual(blockedRes.blocked, true);
      assert.strictEqual(blockedRes.reason, 'REPLY_ALREADY_DETECTED_FOLLOWUPS_CANCELLED');
    });

    await test('3.4 Strict Fail-Closed under REQUIRE_DISTRIBUTED_KV=1 on Sequence Persistence', async () => {
      process.env.REQUIRE_DISTRIBUTED_KV = '1';
      delete process.env.KV_REST_API_URL;

      const resMissing = await reserveSequenceStepDistributed('CMP_TEST', 'buyer', 'SEQ-01', 2);
      assert.strictEqual(resMissing.reserved, false);
      assert.strictEqual(resMissing.blocked, true);
      assert.ok(resMissing.reason.includes('MISSING_DISTRIBUTED_KV_STORAGE'));

      process.env.KV_REST_API_URL = mockKvUrl;
      mock.setSimulate500(true);

      await assert.rejects(async () => {
        await reserveSequenceStepDistributed('CMP_TEST', 'buyer', 'SEQ-01', 2);
      }, err => {
        return err.code === 'KV_BACKEND_ERROR';
      });

      mock.setSimulate500(false);
      delete process.env.REQUIRE_DISTRIBUTED_KV;
    });

    // ============================================================
    // SECTION 4: DISTRIBUTED DISPATCH INTEGRITY & MULTI-CAMPAIGN ATTRIBUTION
    // ============================================================
    console.log('\n--- Section 4: Distributed Dispatch Integrity & Secondary Index ---');

    await test('4.1 Multi-Campaign Email Index Resolution (Deterministic Campaign Attribution vs Ambiguous Fail-Closed)', async () => {
      const email = 'procurement@globalpulses.com';

      // Campaign A targeting this recipient
      await saveRecipientSequenceStateDistributed('CAMP-PULSE-A', 'buyer-pulse-1', {
        recipient_id: 'buyer-pulse-1',
        campaign_id: 'CAMP-PULSE-A',
        recipient_email: email,
        status: 'EMAIL_1_SENT',
        current_step: 1
      });

      // Campaign B targeting the same recipient email
      await saveRecipientSequenceStateDistributed('CAMP-PULSE-B', 'buyer-pulse-2', {
        recipient_id: 'buyer-pulse-2',
        campaign_id: 'CAMP-PULSE-B',
        recipient_email: email,
        status: 'PROSPECT',
        current_step: 0
      });

      // Verify the secondary index in Redis stores both campaign keys
      const indexRaw = mock.kvStore.get(`seq_idx:email:${email}`);
      assert.ok(indexRaw && indexRaw.value, 'Index key must exist in mock KV');
      const parsedKeys = indexRaw.value instanceof Set
        ? Array.from(indexRaw.value)
        : (typeof indexRaw.value === 'string' ? JSON.parse(indexRaw.value) : indexRaw.value);
      assert.strictEqual(Array.isArray(parsedKeys), true);
      assert.ok(parsedKeys.includes('CAMP-PULSE-A:buyer-pulse-1'));
      assert.ok(parsedKeys.includes('CAMP-PULSE-B:buyer-pulse-2'));

      // Case 1: Inbound reply explicitly includes Campaign ID -> Exact match returned
      const matchCampA = await findSequenceByCriteriaDistributed({ email, campaignId: 'CAMP-PULSE-A' });
      assert.strictEqual(matchCampA.ambiguous, false);
      assert.strictEqual(matchCampA.confidence, 'EXACT_EMAIL');
      assert.strictEqual(matchCampA.match.campaign_id, 'CAMP-PULSE-A');

      const matchCampB = await findSequenceByCriteriaDistributed({ email, campaignId: 'CAMP-PULSE-B' });
      assert.strictEqual(matchCampB.ambiguous, false);
      assert.strictEqual(matchCampB.confidence, 'EXACT_EMAIL');
      assert.strictEqual(matchCampB.match.campaign_id, 'CAMP-PULSE-B');

      // Case 2: Inbound reply has no campaignId -> Fails closed as AMBIGUOUS with candidate list
      const matchUnaddressed = await findSequenceByCriteriaDistributed({ email });
      assert.strictEqual(matchUnaddressed.ambiguous, true);
      assert.strictEqual(matchUnaddressed.confidence, 'AMBIGUOUS');
      assert.strictEqual(matchUnaddressed.match, null);
      assert.strictEqual(matchUnaddressed.matches.length, 2);
    });

    await test('4.2 dispatchSequenceStepDistributed Happy Path (Reserve -> Transmit -> Commit)', async () => {
      const recipientState = createRecipientState({
        id: 'recip-dist-01',
        email: 'trade@agridist.ae',
        companyName: 'Agri Distributors UAE',
        contactPerson: 'Tariq Al-Mansoor',
        approvedForOutreach: true
      });

      let transmitterCalled = false;
      let transmittedPayload = null;

      const mockTransmitter = async (rendered, meta) => {
        transmitterCalled = true;
        transmittedPayload = { rendered, meta };
        return {
          providerMessageId: 'resend_msg_test_402',
          sesMessageId: 'ses_msg_test_402'
        };
      };

      const dispatchResult = await dispatchSequenceStepDistributed(
        recipientState,
        'CAMP-DIST-01',
        {
          workerId: 'worker-dist-alpha',
          isTestMode: true,
          globalOutreachStop: false,
          outreachAuthorized: true
        },
        mockTransmitter
      );

      assert.strictEqual(dispatchResult.success, true);
      assert.strictEqual(dispatchResult.sequenceId, 'SEQ-01');
      assert.strictEqual(dispatchResult.step, 'EMAIL_1');
      assert.strictEqual(dispatchResult.providerMessageId, 'resend_msg_test_402');
      assert.strictEqual(transmitterCalled, true);
      assert.strictEqual(dispatchResult.commitResult.committed, true);

      // Verify that reservation was cleaned up after commit
      const resEntry = mock.kvStore.get(`seq_res:${dispatchResult.idempotencyKey}`);
      assert.strictEqual(resEntry, undefined, 'Reservation should be removed post-commit');

      // Verify that idempotency record exists in distributed KV
      const idemEntry = mock.kvStore.get(`seq_idem:${dispatchResult.idempotencyKey}`);
      assert.ok(idemEntry && idemEntry.value, 'Idempotency record must exist');
      const idemRecord = JSON.parse(idemEntry.value);
      assert.strictEqual(idemRecord.providerMessageId, 'resend_msg_test_402');
      assert.strictEqual(idemRecord.workerId, 'worker-dist-alpha');

      // Subsequent duplicate dispatch attempt for step 1 blocked by idempotency
      const duplicateStep1Attempt = createRecipientState({
        id: 'recip-dist-01',
        email: 'trade@agridist.ae',
        companyName: 'Agri Distributors UAE',
        contactPerson: 'Tariq Al-Mansoor',
        approvedForOutreach: true
      });

      const dupResult = await dispatchSequenceStepDistributed(
        duplicateStep1Attempt,
        'CAMP-DIST-01',
        {
          workerId: 'worker-dist-beta',
          isTestMode: true,
          globalOutreachStop: false,
          outreachAuthorized: true
        },
        mockTransmitter
      );
      assert.strictEqual(dupResult.success, false);
      assert.strictEqual(dupResult.duplicate, true);

      // Premature follow-up attempt for step 2 blocked by 72-hour delay gate
      const prematureStep2Result = await dispatchSequenceStepDistributed(
        recipientState,
        'CAMP-DIST-01',
        {
          workerId: 'worker-dist-alpha',
          isTestMode: true,
          globalOutreachStop: false,
          outreachAuthorized: true
        },
        mockTransmitter
      );
      assert.strictEqual(prematureStep2Result.success, false);
      assert.strictEqual(prematureStep2Result.timingBlocked, true);
    });

    await test('4.3 dispatchSequenceStepDistributed Late Reply Abort (Cancel Before Transmit)', async () => {
      const recipientState = createRecipientState({
        id: 'recip-dist-02',
        email: 'late-reply@graincorp.com',
        companyName: 'GrainCorp',
        contactPerson: 'David Miller',
        approvedForOutreach: true
      });

      // Pre-record an inbound reply in distributed KV to simulate race condition
      await recordReplyReceivedDistributed('CAMP-DIST-02', 'recip-dist-02', {
        fromEmail: 'late-reply@graincorp.com',
        timestamp: new Date().toISOString()
      });

      let transmitterCalled = false;
      const mockTransmitter = async () => {
        transmitterCalled = true;
        return { providerMessageId: 'should_never_send' };
      };

      const dispatchResult = await dispatchSequenceStepDistributed(
        recipientState,
        'CAMP-DIST-02',
        {
          workerId: 'worker-dist-late',
          isTestMode: true,
          globalOutreachStop: false,
          outreachAuthorized: true
        },
        mockTransmitter
      );

      assert.strictEqual(dispatchResult.success, false);
      assert.strictEqual(dispatchResult.blocked, true);
      assert.strictEqual(transmitterCalled, false, 'Transmitter must NEVER be called when late reply is detected');

      // Verify reservation was released
      const idemKey = `CAMP-DIST-02:recip-dist-02:SEQ-01:EMAIL_1`;
      const resEntry = mock.kvStore.get(`seq_res:${idemKey}`);
      assert.strictEqual(resEntry, undefined, 'Reservation must be cleanly released on late reply abort');
    });

    await test('4.4 dispatchSequenceStepDistributed Transmission Failure Clean Rollback (Retry Safe)', async () => {
      const recipientState = createRecipientState({
        id: 'recip-dist-03',
        email: 'retry-lead@agritech.com',
        companyName: 'AgriTech Europe',
        contactPerson: 'Sarah Jenkins',
        approvedForOutreach: true
      });

      let attemptCount = 0;
      const failingTransmitter = async () => {
        attemptCount++;
        throw new Error('ECONNRESET: Resend API connection timeout');
      };

      const failResult = await dispatchSequenceStepDistributed(
        recipientState,
        'CAMP-DIST-03',
        {
          workerId: 'worker-dist-fail',
          isTestMode: true,
          globalOutreachStop: false,
          outreachAuthorized: true
        },
        failingTransmitter
      );

      assert.strictEqual(failResult.success, false);
      assert.strictEqual(failResult.transmissionFailed, true);
      assert.ok(failResult.error.includes('ECONNRESET'));

      // Check that reservation was cleaned up so a retry is permitted
      const idemKey = `CAMP-DIST-03:recip-dist-03:SEQ-01:EMAIL_1`;
      const resEntry = mock.kvStore.get(`seq_res:${idemKey}`);
      assert.strictEqual(resEntry, undefined, 'Reservation must be deleted on transmission failure');

      // Now retry with working transmitter -> should succeed
      const succeedingTransmitter = async () => {
        attemptCount++;
        return { providerMessageId: 'resend_retry_success_404' };
      };

      const retryResult = await dispatchSequenceStepDistributed(
        recipientState,
        'CAMP-DIST-03',
        {
          workerId: 'worker-dist-retry',
          isTestMode: true,
          globalOutreachStop: false,
          outreachAuthorized: true
        },
        succeedingTransmitter
      );

      assert.strictEqual(retryResult.success, true);
      assert.strictEqual(retryResult.providerMessageId, 'resend_retry_success_404');
      assert.strictEqual(attemptCount, 2);
    });

    await test('4.5 dispatchSequenceStepDistributed Fencing Violation Rejection on Lease Expiry/Takeover', async () => {
      const recipientState = createRecipientState({
        id: 'recip-dist-04',
        email: 'slow-worker@pulsetrading.com',
        companyName: 'Pulse Trading Int',
        contactPerson: 'Alex Rivera',
        approvedForOutreach: true
      });

      const slowTransmitter = async (rendered, meta) => {
        // While slow worker is transmitting, lease expires and Worker 2 takes over reservation
        const key = `seq_res:${meta.idempotencyKey}`;
        mock.kvStore.set(key, {
          value: JSON.stringify({
            workerId: 'worker-fast-superseder',
            reservedAt: new Date().toISOString(),
            expiresAt: Date.now() + 300000
          }),
          expiresAt: Date.now() + 300000
        });

        return { providerMessageId: 'late_msg_id' };
      };

      const dispatchResult = await dispatchSequenceStepDistributed(
        recipientState,
        'CAMP-DIST-04',
        {
          workerId: 'worker-slow',
          isTestMode: true,
          globalOutreachStop: false,
          outreachAuthorized: true
        },
        slowTransmitter
      );

      assert.strictEqual(dispatchResult.success, false);
      assert.strictEqual(dispatchResult.fencingViolation, true);
      assert.ok(dispatchResult.reason.includes('FENCING_VIOLATION'));
      assert.strictEqual(dispatchResult.currentWorkerId, 'worker-fast-superseder');
    });

    // --- SECTION 5: Package 3A Distributed Quota & Atomic Secondary Index Matrix ---
    console.log('\n--- Section 5: Package 3A Distributed Quota & Atomic Secondary Index Matrix ---');

    await test('5.1 Atomic Distributed Daily Quota Limit Enforcement & Rollback on Breach', async () => {
      const today = new Date();
      const dateKey = today.toISOString().slice(0, 10);
      mock.kvStore.delete(`quota:daily:${dateKey}`);

      // Pilot limit of 3
      const res1 = await reserveDailyThroughputSlotDistributed({
        now: today,
        configuredLimit: 3,
        configuredPacing: 10,
        workerId: 'worker-quota-1',
        trackTestQuota: true
      });
      assert.strictEqual(res1.allowed, true);
      assert.strictEqual(res1.currentCount, 1);
      assert.ok(res1.reservationId.startsWith('RES-'));

      const res2 = await reserveDailyThroughputSlotDistributed({
        now: today,
        configuredLimit: 3,
        configuredPacing: 10,
        workerId: 'worker-quota-2',
        trackTestQuota: true
      });
      assert.strictEqual(res2.allowed, true);
      assert.strictEqual(res2.currentCount, 2);

      const res3 = await reserveDailyThroughputSlotDistributed({
        now: today,
        configuredLimit: 3,
        configuredPacing: 10,
        workerId: 'worker-quota-3',
        trackTestQuota: true
      });
      assert.strictEqual(res3.allowed, true);
      assert.strictEqual(res3.currentCount, 3);

      // 4th worker attempts reservation -> Limit breach!
      const res4 = await reserveDailyThroughputSlotDistributed({
        now: today,
        configuredLimit: 3,
        configuredPacing: 10,
        workerId: 'worker-quota-4',
        trackTestQuota: true
      });
      assert.strictEqual(res4.allowed, false);
      assert.strictEqual(res4.quotaExceeded, true);
      assert.strictEqual(res4.currentCount, 3, 'Counter must be rolled back to limit on breach');

      // Confirm KV counter is 3 (not 4)
      const rawVal = mock.kvStore.get(`quota:daily:${dateKey}`);
      assert.strictEqual(rawVal.value, '3');
    });

    await test('5.2 Anti-Burst Pacing Enforcement & Rollback in Distributed KV', async () => {
      const today = new Date();
      const dateKey = today.toISOString().slice(0, 10);
      mock.kvStore.delete(`quota:pacing:log`);
      mock.kvStore.delete(`quota:daily:${dateKey}`);

      // Limit 1 send per minute
      const p1 = await reserveDailyThroughputSlotDistributed({
        now: today,
        configuredLimit: 10,
        configuredPacing: 1,
        workerId: 'worker-pace-1',
        trackTestQuota: true
      });
      assert.strictEqual(p1.allowed, true);

      // Immediate second reservation within 60s
      const p2 = await reserveDailyThroughputSlotDistributed({
        now: today,
        configuredLimit: 10,
        configuredPacing: 1,
        workerId: 'worker-pace-2',
        trackTestQuota: true
      });
      assert.strictEqual(p2.allowed, false);
      assert.strictEqual(p2.pacingExceeded, true);
      assert.strictEqual(p2.paced, true);

      // Verify daily counter was rolled back on pacing rejection
      const rawDaily = mock.kvStore.get(`quota:daily:${dateKey}`);
      assert.strictEqual(rawDaily.value, '1', 'Daily counter must be rolled back when pacing check rejects');
    });

    await test('5.3 Scoped Idempotent Reservation Release in Distributed KV (Prevent Double-Release)', async () => {
      const today = new Date();
      const dateKey = today.toISOString().slice(0, 10);
      mock.kvStore.delete(`quota:daily:${dateKey}`);

      const res = await reserveDailyThroughputSlotDistributed({
        now: today,
        configuredLimit: 10,
        configuredPacing: 10,
        workerId: 'worker-release-1',
        trackTestQuota: true
      });
      assert.strictEqual(res.allowed, true);
      assert.ok(mock.kvStore.has(`quota:res:${res.reservationId}`));

      // First release -> should succeed
      const rel1 = await releaseDailyThroughputSlotDistributed(res.dateKey, res.reservationId);
      assert.strictEqual(rel1, true);
      assert.strictEqual(mock.kvStore.has(`quota:res:${res.reservationId}`), false);

      // Counter decremented
      const rawDaily1 = mock.kvStore.get(`quota:daily:${dateKey}`);
      assert.strictEqual(rawDaily1.value, '0');

      // Duplicate release attempt with same reservation -> must be idempotent false
      const rel2 = await releaseDailyThroughputSlotDistributed(res.dateKey, res.reservationId);
      assert.strictEqual(rel2, false, 'Second release must be idempotent false');

      // Counter must not be decremented below 0
      const rawDaily2 = mock.kvStore.get(`quota:daily:${dateKey}`);
      assert.strictEqual(rawDaily2.value, '0', 'Counter must not double-decrement');

      // Test argument resilience: single argument RES-...
      const resB = await reserveDailyThroughputSlotDistributed({
        now: today,
        configuredLimit: 10,
        configuredPacing: 10,
        workerId: 'worker-release-2',
        trackTestQuota: true
      });
      const relSingleArg = await releaseDailyThroughputSlotDistributed(resB.reservationId);
      assert.strictEqual(relSingleArg, true);
    });

    await test('5.4 Atomic Redis Set SADD Prevents Concurrent Enrollment Overwrites', async () => {
      const email = 'concurrent-buyer@commodity-hub.com';
      mock.kvStore.delete(`seq_idx:email:${email}`);

      // Three concurrent campaign enrollments for same email
      await Promise.all([
        saveRecipientSequenceStateDistributed('CAMP-CONC-01', 'recip-conc-1', {
          recipient_id: 'recip-conc-1',
          campaign_id: 'CAMP-CONC-01',
          recipient_email: email,
          status: 'EMAIL_1_SENT',
          current_step: 1
        }),
        saveRecipientSequenceStateDistributed('CAMP-CONC-02', 'recip-conc-2', {
          recipient_id: 'recip-conc-2',
          campaign_id: 'CAMP-CONC-02',
          recipient_email: email,
          status: 'EMAIL_1_SENT',
          current_step: 1
        }),
        saveRecipientSequenceStateDistributed('CAMP-CONC-03', 'recip-conc-3', {
          recipient_id: 'recip-conc-3',
          campaign_id: 'CAMP-CONC-03',
          recipient_email: email,
          status: 'EMAIL_1_SENT',
          current_step: 1
        })
      ]);

      // Inspect the Redis Set
      const setEntry = mock.kvStore.get(`seq_idx:email:${email}`);
      assert.ok(setEntry && setEntry.value instanceof Set);
      assert.strictEqual(setEntry.value.size, 3, 'All 3 concurrent enrollments must be preserved via atomic SADD');
      assert.ok(setEntry.value.has('CAMP-CONC-01:recip-conc-1'));
      assert.ok(setEntry.value.has('CAMP-CONC-02:recip-conc-2'));
      assert.ok(setEntry.value.has('CAMP-CONC-03:recip-conc-3'));
    });

    await test('5.5 Attribution to Single Active Campaign in Presence of Completed/Historical Sequence', async () => {
      const email = 'recurrent-buyer@agrotrade.org';
      mock.kvStore.delete(`seq_idx:email:${email}`);

      // Campaign 1: Finished 6 months ago (status: COMPLETED, followups_cancelled: true)
      await saveRecipientSequenceStateDistributed('CAMP-HIST-2025', 'recip-hist-1', {
        recipient_id: 'recip-hist-1',
        campaign_id: 'CAMP-HIST-2025',
        recipient_email: email,
        status: 'COMPLETED',
        followups_cancelled: true,
        current_step: 5
      });

      // Campaign 2: Currently active outreach (status: EMAIL_1_SENT, waiting reply)
      await saveRecipientSequenceStateDistributed('CAMP-ACTIVE-2026', 'recip-act-2', {
        recipient_id: 'recip-act-2',
        campaign_id: 'CAMP-ACTIVE-2026',
        recipient_email: email,
        status: 'EMAIL_1_SENT',
        followups_cancelled: false,
        current_step: 1
      });

      // Inbound reply without campaignId header arrives
      const match = await findSequenceByCriteriaDistributed({ email });
      assert.strictEqual(match.ambiguous, false, 'Must NOT falsely lock out as ambiguous when only 1 campaign is active');
      assert.strictEqual(match.confidence, 'EXACT_EMAIL_ACTIVE');
      assert.strictEqual(match.match.campaign_id, 'CAMP-ACTIVE-2026');
      assert.strictEqual(match.resolvedFromActive, true);
    });

    await test('5.6 Genuinely Ambiguous Multi-Active Campaign Resolution to Manual Review', async () => {
      const email = 'multi-active-buyer@globalgrain.com';
      mock.kvStore.delete(`seq_idx:email:${email}`);

      // Two active campaigns running concurrently
      await saveRecipientSequenceStateDistributed('CAMP-ACT-A', 'recip-act-a', {
        recipient_id: 'recip-act-a',
        campaign_id: 'CAMP-ACT-A',
        recipient_email: email,
        status: 'EMAIL_1_SENT',
        followups_cancelled: false,
        current_step: 1
      });
      await saveRecipientSequenceStateDistributed('CAMP-ACT-B', 'recip-act-b', {
        recipient_id: 'recip-act-b',
        campaign_id: 'CAMP-ACT-B',
        recipient_email: email,
        status: 'WAITING_REPLY',
        followups_cancelled: false,
        current_step: 2
      });

      // Unaddressed inbound reply arrives
      const match = await findSequenceByCriteriaDistributed({ email });
      assert.strictEqual(match.ambiguous, true);
      assert.strictEqual(match.confidence, 'AMBIGUOUS');
      assert.strictEqual(match.match, null);
      assert.strictEqual(match.reason, 'MULTIPLE_ACTIVE_CAMPAIGNS');
      assert.strictEqual(match.matches.length, 2);

      // Verify replyDetector flags both records for manual review
      const inboundPayload = {
        from: email,
        subject: 'Re: Quotation',
        text: 'Yes please send specs',
        headers: {}
      };
      const replyRes = await processInboundReplyAsync(inboundPayload);
      assert.strictEqual(replyRes.action, 'FLAGGED_MANUAL_REVIEW');

      const stateA = await getRecipientSequenceStateDistributed('CAMP-ACT-A', 'recip-act-a');
      const stateB = await getRecipientSequenceStateDistributed('CAMP-ACT-B', 'recip-act-b');
      assert.strictEqual(stateA.status, 'MANUAL_REVIEW_REQUIRED');
      assert.strictEqual(stateB.status, 'MANUAL_REVIEW_REQUIRED');
      assert.strictEqual(stateA.followups_cancelled, true);
      assert.strictEqual(stateB.followups_cancelled, true);
    });

    await test('5.7 Candidate Pruning via removeRecipientSequenceStateDistributed SREM', async () => {
      const email = 'prune-test@exportagro.com';
      mock.kvStore.delete(`seq_idx:email:${email}`);

      await saveRecipientSequenceStateDistributed('CAMP-PRUNE-1', 'recip-prune-1', {
        recipient_id: 'recip-prune-1',
        campaign_id: 'CAMP-PRUNE-1',
        recipient_email: email,
        status: 'EMAIL_1_SENT'
      });
      await saveRecipientSequenceStateDistributed('CAMP-PRUNE-2', 'recip-prune-2', {
        recipient_id: 'recip-prune-2',
        campaign_id: 'CAMP-PRUNE-2',
        recipient_email: email,
        status: 'EMAIL_1_SENT'
      });

      // Remove candidate 1 via removeRecipientSequenceStateDistributed
      const removeRes = await removeRecipientSequenceStateDistributed('CAMP-PRUNE-1', 'recip-prune-1', email);
      assert.strictEqual(removeRes.removed, true);

      // Verify main state is deleted
      const deletedState = await getRecipientSequenceStateDistributed('CAMP-PRUNE-1', 'recip-prune-1');
      assert.strictEqual(deletedState, null);

      // Verify secondary index set has candidate 1 removed via SREM
      const setEntry = mock.kvStore.get(`seq_idx:email:${email}`);
      assert.ok(setEntry && setEntry.value instanceof Set);
      assert.strictEqual(setEntry.value.has('CAMP-PRUNE-1:recip-prune-1'), false);
      assert.strictEqual(setEntry.value.has('CAMP-PRUNE-2:recip-prune-2'), true);

      // Subsequent search for email now uniquely matches candidate 2
      const searchAfterPrune = await findSequenceByCriteriaDistributed({ email });
      assert.strictEqual(searchAfterPrune.ambiguous, false);
      assert.strictEqual(searchAfterPrune.match.campaign_id, 'CAMP-PRUNE-2');
    });

    await test('5.8 Fail-Closed under Strict KV Enforcement when Distributed KV is Unavailable', async () => {
      const savedUrl = process.env.KV_REST_API_URL;
      const savedToken = process.env.KV_REST_API_TOKEN;
      const savedStrict = process.env.REQUIRE_DISTRIBUTED_KV;

      try {
        delete process.env.KV_REST_API_URL;
        delete process.env.KV_REST_API_TOKEN;
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
        process.env.REQUIRE_DISTRIBUTED_KV = '1';

        const res = await reserveDailyThroughputSlotDistributed({
          configuredLimit: 10,
          workerId: 'worker-strict-test'
        });
        assert.strictEqual(res.allowed, false);
        assert.strictEqual(res.blocked, true);
        assert.ok(res.reason.includes('MISSING_DISTRIBUTED_KV_STORAGE'));
      } finally {
        if (savedUrl) process.env.KV_REST_API_URL = savedUrl;
        if (savedToken) process.env.KV_REST_API_TOKEN = savedToken;
        if (savedStrict) process.env.REQUIRE_DISTRIBUTED_KV = savedStrict; else delete process.env.REQUIRE_DISTRIBUTED_KV;
      }
    });

    } finally {
      if (mock && mock.server) {
        mock.server.close();
      }
      if (origKvUrl !== undefined) process.env.KV_REST_API_URL = origKvUrl; else delete process.env.KV_REST_API_URL;
      if (origKvToken !== undefined) process.env.KV_REST_API_TOKEN = origKvToken; else delete process.env.KV_REST_API_TOKEN;
      if (origStrict !== undefined) process.env.REQUIRE_DISTRIBUTED_KV = origStrict; else delete process.env.REQUIRE_DISTRIBUTED_KV;
      if (origSecret !== undefined) process.env.RESEND_WEBHOOK_SECRET = origSecret; else delete process.env.RESEND_WEBHOOK_SECRET;
    }

    console.log('\n============================================================');
    console.log(`DISTRIBUTED PERSISTENCE RESULTS: ${passed} passed, ${failed} failed.`);
    console.log('============================================================');

    if (failed > 0) process.exitCode = 1;
  } finally {
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
