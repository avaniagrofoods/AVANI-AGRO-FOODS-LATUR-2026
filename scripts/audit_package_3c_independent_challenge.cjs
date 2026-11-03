// ============================================================
// AVANI AGRO FOODS — PACKAGE 3C INDEPENDENT VERIFICATION & CHALLENGE SUITE
// scripts/audit_package_3c_independent_challenge.cjs
//
// Mode: READ-ONLY AUDIT FIRST — Zero production writes, Mock-Only
// Safety: GLOBAL_OUTREACH_STOP=1, OUTREACH_AUTHORIZED=0
// ============================================================

const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const SHARED_OPERATIONAL_STORE_PATH = path.resolve(__dirname, '../api/_data/sequenceStateStore.json');
const SHARED_DATA_DIR = path.resolve(__dirname, '../api/_data');

function computeFileSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase();
}

function establishTestIsolation(scriptPrefix) {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview'
  ) {
    throw new Error('FAIL_CLOSED_ISOLATION: Refusing to run test/challenge script in a production or Vercel environment.');
  }

  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';
  process.env.REAL_BUYER_CONTACT = '0';
  process.env.REAL_BUYER_EMAILS = '0';

  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  const tmpBase = os.tmpdir();
  if (!tmpBase || !fs.existsSync(tmpBase)) {
    throw new Error('FAIL_CLOSED_ISOLATION: OS temporary directory is unavailable.');
  }

  const isolatedTempDir = fs.mkdtempSync(path.join(tmpBase, `${scriptPrefix}-`));
  const isolatedStorePath = path.resolve(isolatedTempDir, 'sequenceStateStore.isolated.json');

  if (
    isolatedStorePath === SHARED_OPERATIONAL_STORE_PATH ||
    isolatedStorePath.startsWith(SHARED_DATA_DIR + path.sep) ||
    !isolatedStorePath.startsWith(path.resolve(tmpBase) + path.sep)
  ) {
    throw new Error(`FAIL_CLOSED_ISOLATION: Unsafe isolated store path resolved: ${isolatedStorePath}`);
  }

  const initialEmptyStore = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    sequences: {},
    idempotencyKeys: {},
    reservations: {},
    processedEvents: {},
    dispatchIntents: {},
    dailyThroughput: {},
    pacingLog: [],
    auditLog: []
  };

  fs.writeFileSync(isolatedStorePath, JSON.stringify(initialEmptyStore, null, 2), 'utf8');
  process.env.SEQUENCE_STORE_PATH = isolatedStorePath;

  if (!fs.existsSync(isolatedStorePath) || process.env.SEQUENCE_STORE_PATH !== isolatedStorePath) {
    throw new Error('FAIL_CLOSED_ISOLATION: Failed to establish SEQUENCE_STORE_PATH before module import.');
  }

  const sharedStoreBaselineHash = fs.existsSync(SHARED_OPERATIONAL_STORE_PATH)
    ? computeFileSha256(SHARED_OPERATIONAL_STORE_PATH)
    : null;

  return {
    isolatedTempDir,
    isolatedStorePath,
    sharedStoreBaselineHash
  };
}

function enableMockOutreachForLocalTest() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    process.env.VERCEL_ENV ||
    !process.env.SEQUENCE_STORE_PATH ||
    path.resolve(process.env.SEQUENCE_STORE_PATH) === SHARED_OPERATIONAL_STORE_PATH ||
    !String(process.env.KV_REST_API_URL || '').startsWith('http://127.0.0.1:') ||
    process.env.UPSTASH_REDIS_REST_URL
  ) {
    throw new Error('FAIL_CLOSED_ISOLATION: Refusing to enable test outreach flags outside verified local mock isolation.');
  }
  process.env.GLOBAL_OUTREACH_STOP = '0';
  process.env.OUTREACH_AUTHORIZED = '1';
}

function cleanupIsolatedTempDir(isolationContext) {
  if (!isolationContext || !isolationContext.isolatedTempDir) return;
  const resolvedDir = path.resolve(isolationContext.isolatedTempDir);
  const resolvedTmpBase = path.resolve(os.tmpdir());
  if (
    resolvedDir.startsWith(resolvedTmpBase + path.sep) &&
    resolvedDir !== resolvedTmpBase &&
    !resolvedDir.startsWith(SHARED_DATA_DIR) &&
    fs.existsSync(resolvedDir)
  ) {
    fs.rmSync(resolvedDir, { recursive: true, force: true });
  }
}

const ISOLATION = establishTestIsolation('aaf-p3e8-audit-3c-chal');

let mockServer;
let mockPort;
const mockKvStore = new Map();
const mockKvSets = new Map();

function startMockKvServer() {
  return new Promise((resolve) => {
    mockServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let cmd = [];
        try { cmd = JSON.parse(body); } catch (e) {}
        const op = (cmd[0] || '').toUpperCase();
        const key = cmd[1];
        let result = null;

        if (op === 'GET') {
          result = mockKvStore.has(key) ? mockKvStore.get(key) : null;
        } else if (op === 'SET') {
          const val = cmd[2];
          const hasNx = cmd.includes('NX') || cmd.includes('nx');
          if (hasNx && mockKvStore.has(key)) {
            result = null;
          } else {
            mockKvStore.set(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
            result = 'OK';
          }
        } else if (op === 'DEL') {
          if (mockKvStore.has(key)) {
            mockKvStore.delete(key);
            result = 1;
          } else {
            result = 0;
          }
        } else if (op === 'INCR') {
          const cur = parseInt(mockKvStore.get(key) || '0', 10);
          const next = cur + 1;
          mockKvStore.set(key, String(next));
          result = next;
        } else if (op === 'DECR') {
          const cur = parseInt(mockKvStore.get(key) || '0', 10);
          const next = cur - 1;
          mockKvStore.set(key, String(next));
          result = next;
        } else if (op === 'EXPIRE') {
          result = 1;
        } else if (op === 'SADD') {
          const member = cmd[2];
          if (!mockKvSets.has(key)) mockKvSets.set(key, new Set());
          const set = mockKvSets.get(key);
          const added = set.has(member) ? 0 : 1;
          set.add(member);
          result = added;
        } else if (op === 'SMEMBERS') {
          const set = mockKvSets.get(key);
          result = set ? Array.from(set) : [];
        } else if (op === 'SREM') {
          const member = cmd[2];
          const set = mockKvSets.get(key);
          if (set && set.has(member)) {
            set.delete(member);
            result = 1;
          } else {
            result = 0;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result }));
      });
    });

    mockServer.listen(0, '127.0.0.1', () => {
      mockPort = mockServer.address().port;
      process.env.KV_REST_API_URL = `http://127.0.0.1:${mockPort}`;
      process.env.KV_REST_API_TOKEN = 'test_independent_audit_token';
      process.env.REQUIRE_DISTRIBUTED_KV = '1';
      resolve();
    });
  });
}

function stopMockKvServer() {
  return new Promise((resolve) => {
    if (mockServer) {
      mockServer.close(() => resolve());
    } else {
      resolve();
    }
  });
}

function resetMockStores() {
  mockKvStore.clear();
  mockKvSets.clear();
}

async function runIndependentAuditSuite() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — PACKAGE 3C INDEPENDENT AUDIT CHALLENGE');
  console.log('============================================================\n');

  await startMockKvServer();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const findings = [];

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`[PASS] ${name}`);
    } catch (err) {
      failedTests++;
      console.error(`[FAIL] ${name}: ${err.message}`);
      findings.push({ name, error: err.message, stack: err.stack });
    }
  }

  const {
    reserveDailyThroughputSlotDistributed,
    releaseDailyThroughputSlotDistributed,
    releasePacingLockDistributed,
    validateDailyLimitConfig,
    validatePacingConfig
  } = await import('../api/_lib/dailyThroughputGovernor.js');

  const {
    escapeKeyComponent,
    unescapeKeyComponent,
    parseSequenceStorageKey,
    getSequenceStorageKey,
    generateStepIdempotencyKey,
    saveRecipientSequenceStateDistributed,
    getRecipientSequenceStateDistributed,
    findSequenceByCriteriaDistributed,
    reconcileSecondaryIndexesDistributed,
    commitSequenceStepDistributed,
    getStorageConfiguration
  } = await import('../api/_lib/sequencePersistence.js');

  const storageConfig = getStorageConfiguration();
  if (
    !storageConfig ||
    path.resolve(storageConfig.storePath) !== ISOLATION.isolatedStorePath ||
    path.resolve(storageConfig.storePath) === SHARED_OPERATIONAL_STORE_PATH ||
    !String(process.env.KV_REST_API_URL || '').startsWith('http://127.0.0.1:') ||
    process.env.UPSTASH_REDIS_REST_URL
  ) {
    throw new Error(
      `FAIL_CLOSED_ISOLATION: Persistence layer failed isolation check before tests: ${JSON.stringify(storageConfig)}`
    );
  }

  const {
    dispatchSequenceStepDistributed,
    reconcileUncertainDispatchIntentDistributed,
    SEQUENCE_STATUSES
  } = await import('../api/_lib/sequenceStateMachine.js');

  const cronHandler = (await import('../api/cron-sequence-dispatch.js')).default;

  // -------------------------------------------------------------
  // SECTION 1: PACING & QUOTA RESILIENCE
  // -------------------------------------------------------------
  console.log('\n--- SECTION 1: PACING & QUOTA RESILIENCE ---');

  await test('1.1 Pacing: 30 concurrent contenders racing for pacing slot', async () => {
    resetMockStores();
    const now = new Date('2026-10-13T10:00:00Z');
    const contenders = Array.from({ length: 30 }, (_, i) =>
      reserveDailyThroughputSlotDistributed({
        now,
        workerId: `worker-${i}`,
        configuredLimit: 100,
        configuredPacing: 1
      })
    );

    const results = await Promise.all(contenders);
    const acquired = results.filter(r => r.allowed === true);
    const rejected = results.filter(r => r.allowed === false && r.pacingExceeded === true);

    assert.strictEqual(acquired.length, 1, `Expected exactly 1 acquired, got ${acquired.length}`);
    assert.strictEqual(rejected.length, 29, `Expected 29 rejected, got ${rejected.length}`);
    assert.strictEqual(mockKvStore.get('quota:daily:2026-10-13'), '1', 'Quota daily count must be 1');
  });

  await test('1.2 Pacing: Lock auto-expiry simulation allows subsequent contender', async () => {
    resetMockStores();
    const t0 = new Date('2026-10-13T10:00:00Z');
    const r1 = await reserveDailyThroughputSlotDistributed({ now: t0, workerId: 'worker-1' });
    assert.strictEqual(r1.allowed, true);

    // Simulate expiration of the pacing lock in Redis (60 seconds later)
    mockKvStore.delete('quota:pacing:active');

    const t1 = new Date('2026-10-13T10:01:05Z');
    const r2 = await reserveDailyThroughputSlotDistributed({ now: t1, workerId: 'worker-2' });
    assert.strictEqual(r2.allowed, true, 'Next contender should acquire slot after lock expiry');
    assert.strictEqual(mockKvStore.get('quota:daily:2026-10-13'), '2', 'Quota count must be 2');
  });

  await test('1.3 Pacing: Stale owner cannot release lock held by another worker', async () => {
    resetMockStores();
    const r1 = await reserveDailyThroughputSlotDistributed({ now: new Date('2026-10-13T10:00:00Z'), workerId: 'worker-1' });
    assert.strictEqual(r1.allowed, true);

    // Worker 2 attempts to release Worker 1's pacing lock
    const releasedByWorker2 = await releasePacingLockDistributed(r1.reservationId, 'worker-2');
    assert.strictEqual(releasedByWorker2, false, 'Worker 2 must not be able to release Worker 1 lock');
    assert.ok(mockKvStore.has('quota:pacing:active'), 'Lock must still be held');

    // Worker 1 releases their own lock
    const releasedByWorker1 = await releasePacingLockDistributed(r1.reservationId, 'worker-1');
    assert.strictEqual(releasedByWorker1, true, 'Worker 1 must be able to release their own lock');
    assert.strictEqual(mockKvStore.has('quota:pacing:active'), false, 'Lock must now be cleared');
  });

  await test('1.4 Quota: 25 concurrent calls to release reservation cannot double-decrement', async () => {
    resetMockStores();
    const now = new Date('2026-10-13T10:00:00Z');
    const res = await reserveDailyThroughputSlotDistributed({ now, workerId: 'worker-a' });
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(mockKvStore.get('quota:daily:2026-10-13'), '1');

    const releasePromises = Array.from({ length: 25 }, () =>
      releaseDailyThroughputSlotDistributed('2026-10-13', res.reservationId)
    );
    const releaseResults = await Promise.all(releasePromises);

    const successCount = releaseResults.filter(r => r === true).length;
    const failCount = releaseResults.filter(r => r === false).length;

    assert.strictEqual(successCount, 1, `Expected exactly 1 successful release, got ${successCount}`);
    assert.strictEqual(failCount, 24, `Expected 24 failed releases, got ${failCount}`);
    assert.strictEqual(mockKvStore.get('quota:daily:2026-10-13'), '0', 'Daily quota must be 0, never negative');
  });

  await test('1.5 Quota Crash Simulation: Worker dies after DEL but before DECR (fail-safe)', async () => {
    resetMockStores();
    const now = new Date('2026-10-13T10:00:00Z');
    const res = await reserveDailyThroughputSlotDistributed({ now, workerId: 'worker-crash' });
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(mockKvStore.get('quota:daily:2026-10-13'), '1');

    // Simulate worker crashing right after deleting reservation key
    mockKvStore.delete(`quota:res:${res.reservationId}`);

    // If another release is attempted after recovery:
    const secondRelease = await releaseDailyThroughputSlotDistributed('2026-10-13', res.reservationId);
    assert.strictEqual(secondRelease, false, 'Must return false because reservation key was already deleted');
    assert.strictEqual(mockKvStore.get('quota:daily:2026-10-13'), '1', 'Quota remains conservative (1), no over-decrement');
  });

  // -------------------------------------------------------------
  // SECTION 2: DISPATCH SAFETY, TIMEOUTS & RECONCILIATION
  // -------------------------------------------------------------
  console.log('\n--- SECTION 2: DISPATCH SAFETY, TIMEOUTS & RECONCILIATION ---');

  await test('2.1 Timeout Handling: Provider timeout creates UNCERTAIN_OUTCOME & freezes state', async () => {
    resetMockStores();
    const recipient = {
      recipientId: 'buyer-timeout-1',
      email: 'buyer1@target.com',
      companyName: 'Target Buyer Ltd',
      approvedForOutreach: true
    };

    const transmitterTimeout = async () => {
      const err = new Error('Socket timed out waiting for provider response');
      err.code = 'ETIMEDOUT';
      err.timeoutAfterDispatch = true;
      throw err;
    };

    const dispatchResult = await dispatchSequenceStepDistributed(
      recipient,
      'CAMP-CHALLENGE',
      {
        isTestMode: true,
        trackTestQuota: true,
        workerId: 'worker-tx-1'
      },
      transmitterTimeout
    );

    assert.strictEqual(dispatchResult.success, false);
    assert.strictEqual(dispatchResult.uncertainOutcome, true);
    assert.strictEqual(recipient.sequenceStatus, SEQUENCE_STATUSES.UNCERTAIN_DISPATCH);

    // Verify reservation and quota are NOT rolled back
    const storedState = await getRecipientSequenceStateDistributed('CAMP-CHALLENGE', 'buyer-timeout-1');
    assert.strictEqual(storedState.status, SEQUENCE_STATUSES.UNCERTAIN_DISPATCH);
    assert.strictEqual(mockKvStore.get('quota:daily:' + new Date().toISOString().slice(0, 10)), '1', 'Quota must be preserved');

    // Verify retry of the same step is blocked
    const retryResult = await dispatchSequenceStepDistributed(
      recipient,
      'CAMP-CHALLENGE',
      { isTestMode: true, workerId: 'worker-tx-2' },
      transmitterTimeout
    );
    assert.strictEqual(retryResult.success, false);
    assert.strictEqual(retryResult.reserved, false);
    assert.strictEqual(retryResult.reason, 'ALREADY_RESERVED');
  });

  await test('2.2 Reconciliation: Invalid providerStatus is rejected fail-closed', async () => {
    const idemKey = generateStepIdempotencyKey('CAMP-CHALLENGE', 'buyer-timeout-1', 'SEQ-01', 1);
    const recResult = await reconcileUncertainDispatchIntentDistributed(idemKey, {
      providerStatus: 'MAYBE_SENT'
    });
    assert.strictEqual(recResult.reconciled, false);
    assert.strictEqual(recResult.reason, 'INVALID_PROVIDER_STATUS');
  });

  await test('2.3 Reconciliation after reservation lease expiry (>300s): Behavior audit', async () => {
    const idemKey = generateStepIdempotencyKey('CAMP-CHALLENGE', 'buyer-timeout-1', 'SEQ-01', 1);

    // Simulate reservation lease expiring in KV (300 seconds later)
    mockKvStore.delete(`seq_res:${idemKey}`);

    const recResult = await reconcileUncertainDispatchIntentDistributed(idemKey, {
      providerStatus: 'DELIVERED',
      providerMessageId: 'resend_msg_audit_123'
    });

    // Audit inspection: Notice commitResult under expired reservation
    console.log(`    Notice: reconcileResult after lease expiry:`, {
      reconciled: recResult.reconciled,
      commitCommitted: recResult.commitResult?.committed,
      commitReason: recResult.commitResult?.reason
    });

    // Check if seq_idem was written:
    const idemWritten = mockKvStore.has(`seq_idem:${idemKey}`);
    console.log(`    Notice: seq_idem written in KV: ${idemWritten}`);

    // If reservation expired, commitSequenceStepDistributed fails with LEASE_EXPIRED
    // This is a valuable finding for the audit report!
  });

  await test('2.4 Batch Script Call Graph: Verify execute_phase_3o_controlled_send.cjs bypasses distributed pipeline', async () => {
    const scriptContent = fs.readFileSync(path.join(__dirname, 'execute_phase_3o_controlled_send.cjs'), 'utf8');
    const callsDistributedDispatch = scriptContent.includes('dispatchSequenceStepDistributed(');
    const callsRawResend = scriptContent.includes('postResendEmail(');
    const callsLocalCommit = scriptContent.includes('commitSequenceStep(');

    assert.strictEqual(callsDistributedDispatch, false, 'Script does not call dispatchSequenceStepDistributed');
    assert.strictEqual(callsRawResend, true, 'Script calls raw Resend API directly, bypassing distributed intent fencing');
    assert.strictEqual(callsLocalCommit, true, 'Script commits locally, bypassing distributed KV fencing');
  });

  // -------------------------------------------------------------
  // SECTION 3: CRON SERVERLESS ENDPOINT & GATES
  // -------------------------------------------------------------
  console.log('\n--- SECTION 3: CRON SERVERLESS ROUTE & GATES ---');

  function createMockRes() {
    return {
      statusCode: 200,
      headers: {},
      body: null,
      status(code) { this.statusCode = code; return this; },
      setHeader(k, v) { this.headers[k] = v; return this; },
      json(data) { this.body = data; return this; }
    };
  }

  await test('3.1 Vercel Config: Verify vercel.json has no autonomous cron schedule', async () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
    assert.strictEqual(vercelConfig.crons, undefined, 'vercel.json must not have crons configured');
  });

  await test('3.2 Cron Route: Rejects GET / PUT / DELETE with 405 Method Not Allowed', async () => {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const res = createMockRes();
      await cronHandler({ method, headers: {} }, res);
      assert.strictEqual(res.statusCode, 405);
      assert.strictEqual(res.body.error, 'METHOD_NOT_ALLOWED');
    }
  });

  await test('3.3 Cron Route: Rejects missing or wrong CRON_SECRET with 401', async () => {
    process.env.CRON_SECRET = 'valid_secret_12345';

    // Missing auth header
    const res1 = createMockRes();
    await cronHandler({ method: 'POST', headers: {} }, res1);
    assert.strictEqual(res1.statusCode, 401);

    // Wrong token
    const res2 = createMockRes();
    await cronHandler({ method: 'POST', headers: { authorization: 'Bearer wrong_token' } }, res2);
    assert.strictEqual(res2.statusCode, 401);
  });

  await test('3.4 Cron Route: GLOBAL_OUTREACH_STOP=1 fail-closed returns 403', async () => {
    process.env.CRON_SECRET = 'valid_secret_12345';
    process.env.GLOBAL_OUTREACH_STOP = '1';

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer valid_secret_12345' },
      body: { recipientId: 'test-1' }
    }, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.error, 'GLOBAL_OUTREACH_STOP_ENGAGED');
  });

  await test('3.5 Cron Route: OUTREACH_AUTHORIZED missing or 0 returns 403', async () => {
    process.env.CRON_SECRET = 'valid_secret_12345';
    enableMockOutreachForLocalTest();
    delete process.env.OUTREACH_AUTHORIZED;

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer valid_secret_12345' },
      body: { recipientId: 'test-1' }
    }, res);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.error, 'OUTREACH_NOT_AUTHORIZED');
  });

  await test('3.6 Cron Route: Opted-out or suppressed recipient returns 422', async () => {
    process.env.CRON_SECRET = 'valid_secret_12345';
    enableMockOutreachForLocalTest();

    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'opted-out-buyer', {
      recipient_id: 'opted-out-buyer',
      status: 'UNSUBSCRIBED',
      followups_cancelled: true
    });

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer valid_secret_12345' },
      body: { recipientId: 'opted-out-buyer', campaignId: 'CAMP-01' }
    }, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.body.error, 'RECIPIENT_UNSUBSCRIBED_OR_CANCELLED');
  });

  await test('3.7 Cron Route: Non-existent recipient state audit check', async () => {
    process.env.CRON_SECRET = 'valid_secret_12345';
    enableMockOutreachForLocalTest();

    resetMockStores();
    // Unknown recipient not in KV:
    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer valid_secret_12345' },
      body: { recipientId: 'unknown-lead-123', campaignId: 'CAMP-01', dryRun: true }
    }, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.currentState, 'NEW');
  });

  // Restore global safety invariants
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';

  // -------------------------------------------------------------
  // SECTION 4: COMPOUND KEY & SECONDARY INDEX INVARIANTS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 4: COMPOUND KEY & SECONDARY INDEX INVARIANTS ---');

  await test('4.1 Compound Key: Escapes colons and percent signs bidirectionally', async () => {
    const rawCampaign = 'CAMP:PROD%2026';
    const rawRecipient = 'buyer:test%40@domain.com';

    const key = getSequenceStorageKey(rawCampaign, rawRecipient);
    assert.strictEqual(key.split(':').length, 2, 'Key must contain exactly one delimiter colon');

    const parsed = parseSequenceStorageKey(key);
    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.campaignId, rawCampaign);
    assert.strictEqual(parsed.recipientId, rawRecipient.toLowerCase());
  });

  await test('4.2 Compound Key: Unicode Marathi / Hindi characters roundtrip safely', async () => {
    const marathiCampaign = 'मोहीम-२०२६';
    const marathiRecipient = 'अवनी-खरेदीदार:१';

    const key = getSequenceStorageKey(marathiCampaign, marathiRecipient);
    const parsed = parseSequenceStorageKey(key);

    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.campaignId, marathiCampaign);
    assert.strictEqual(parsed.recipientId, marathiRecipient.toLowerCase());
  });

  await test('4.3 Compound Key: Malformed keys return valid: false', async () => {
    assert.strictEqual(parseSequenceStorageKey('').valid, false);
    assert.strictEqual(parseSequenceStorageKey(null).valid, false);
    assert.strictEqual(parseSequenceStorageKey('NO_DELIMITER').valid, false);
    assert.strictEqual(parseSequenceStorageKey(':recipient').valid, false);
    assert.strictEqual(parseSequenceStorageKey('campaign:').valid, false);
  });

  await test('4.4 Compound Key: Legacy unescaped colon keys parse safely', async () => {
    const legacyKey = 'CAMP-01:legacy-recipient-123';
    const parsed = parseSequenceStorageKey(legacyKey);
    assert.strictEqual(parsed.valid, true);
    assert.strictEqual(parsed.campaignId, 'CAMP-01');
    assert.strictEqual(parsed.recipientId, 'legacy-recipient-123');
  });

  await test('4.5 Secondary Index: Self-healing removes dead keys from Redis Set', async () => {
    resetMockStores();
    const email = 'selfhealing@buyer.com';

    // Seed live state
    await saveRecipientSequenceStateDistributed('CAMP-01', 'live-recipient', {
      recipient_id: 'live-recipient',
      recipient_email: email,
      status: 'OUTREACH_ACTIVE'
    });

    // Manually inject ghost keys into index set
    const setKey = `seq_idx:email:${email}`;
    const liveKey = getSequenceStorageKey('CAMP-01', 'live-recipient');
    const ghostKey1 = getSequenceStorageKey('CAMP-01', 'deleted-recipient-1');
    const ghostKey2 = 'malformed_ghost_key';

    mockKvSets.get(setKey).add(ghostKey1);
    mockKvSets.get(setKey).add(ghostKey2);

    assert.strictEqual(mockKvSets.get(setKey).size, 3, 'Index set should have 3 members initially');

    // Query by criteria: should resolve live state and prune dead keys
    const queryResult = await findSequenceByCriteriaDistributed({ email });
    assert.strictEqual(queryResult.confidence, 'EXACT_EMAIL');
    assert.strictEqual(queryResult.match.recipient_id, 'live-recipient');

    // Verify dead keys were pruned from set
    const remainingSet = mockKvSets.get(setKey);
    assert.strictEqual(remainingSet.size, 1, 'Index set must be pruned to 1 member');
    assert.ok(remainingSet.has(liveKey), 'Live key must remain');
    assert.ok(!remainingSet.has(ghostKey1), 'Ghost key 1 must be pruned');
    assert.ok(!remainingSet.has(ghostKey2), 'Ghost key 2 must be pruned');
  });

  await test('4.6 Test-State Isolation: Synthetic dual-writes land only in isolated temp store and leave shared sequenceStateStore.json untouched', async () => {
    const activeConfig = getStorageConfiguration();
    assert.strictEqual(path.resolve(activeConfig.storePath), ISOLATION.isolatedStorePath);
    assert.notStrictEqual(path.resolve(activeConfig.storePath), SHARED_OPERATIONAL_STORE_PATH);
    assert.strictEqual(fs.existsSync(ISOLATION.isolatedStorePath), true);

    const isolatedData = JSON.parse(fs.readFileSync(ISOLATION.isolatedStorePath, 'utf8'));
    assert.ok(isolatedData.sequences && Object.keys(isolatedData.sequences).length > 0, 'Isolated store must absorb synthetic sequence records');
    assert.ok(isolatedData.dailyThroughput && Object.keys(isolatedData.dailyThroughput).length > 0, 'Isolated store must absorb synthetic daily throughput records');

    if (ISOLATION.sharedStoreBaselineHash !== null) {
      const currentSharedHash = computeFileSha256(SHARED_OPERATIONAL_STORE_PATH);
      assert.strictEqual(currentSharedHash, ISOLATION.sharedStoreBaselineHash, 'Shared api/_data/sequenceStateStore.json must remain byte-for-byte unchanged');
    }
  });

  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';

  await stopMockKvServer();
  cleanupIsolatedTempDir(ISOLATION);

  console.log('\n============================================================');
  console.log(`INDEPENDENT AUDIT COMPLETE: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED.`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exitCode = 1;
  }
}

runIndependentAuditSuite().catch(async err => {
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';
  await stopMockKvServer().catch(() => {});
  cleanupIsolatedTempDir(ISOLATION);
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
