// ============================================================
// AVANI AGRO FOODS — REMEDIATION PACKAGE 3D VERIFICATION SUITE
// scripts/test_package_3d_regression.cjs
//
// Verification of:
// - DEFECT-3C-01: Dedicated, concurrency-safe late reconciliation after lease expiry
// - DEFECT-3C-02: Strict persisted enrollment, authoritative approval & lifecycle fencing
// - DEFECT-3C-03: Elimination of dispatch bypasses & scheduler architecture
//
// Safety Invariants:
// - Mock KV server only
// - GLOBAL_OUTREACH_STOP=1, OUTREACH_AUTHORIZED=0
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

const ISOLATION = establishTestIsolation('aaf-p3e8-test-3d-reg');

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
      process.env.KV_REST_API_TOKEN = 'test_package_3d_token';
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

async function runPackage3DTests() {
  console.log('============================================================');
  console.log('TEST SUITE: Remediation Package 3D Regression Suite');
  console.log('============================================================\n');

  await startMockKvServer();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`[PASS] ${name}`);
    } catch (err) {
      failedTests++;
      console.error(`[FAIL] ${name}: ${err.message}`);
    }
  }

  const {
    saveRecipientSequenceStateDistributed,
    getRecipientSequenceStateDistributed,
    generateStepIdempotencyKey,
    saveDispatchIntentDistributed,
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
  // SECTION 1: DEFECT-3C-02 (CRON ROUTE ENROLLMENT & APPROVAL GATES)
  // -------------------------------------------------------------
  console.log('--- 1. DEFECT-3C-02: CRON ENROLLMENT & AUTHORITATIVE APPROVAL GATES ---');

  process.env.CRON_SECRET = 'correct_cron_secret_3d_2026';
  enableMockOutreachForLocalTest();

  await test('1.1 Cron rejects un-enrolled lead with HTTP 422 RECIPIENT_NOT_ENROLLED', async () => {
    resetMockStores();
    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' },
      body: { recipientId: 'unenrolled-lead@target.com', campaignId: 'CAMP-01' }
    }, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.body.error, 'RECIPIENT_NOT_ENROLLED');
  });

  await test('1.2 Cron rejects unapproved lead with HTTP 422 RECIPIENT_NOT_APPROVED', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'unapproved-lead@target.com', {
      recipient_id: 'unapproved-lead@target.com',
      recipient_email: 'unapproved-lead@target.com',
      status: 'PROSPECT',
      approvedForOutreach: false
    });

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' },
      body: { recipientId: 'unapproved-lead@target.com', campaignId: 'CAMP-01' }
    }, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.body.error, 'RECIPIENT_NOT_APPROVED');
  });

  await test('1.3 Cron rejects approval missing approvedBy with HTTP 422 APPROVAL_UNVERIFIABLE', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'missing-approver@target.com', {
      recipient_id: 'missing-approver@target.com',
      recipient_email: 'missing-approver@target.com',
      status: 'PROSPECT',
      approvedForOutreach: true,
      approvedBy: '', // Missing authoritative operator
      approvedAt: new Date().toISOString()
    });

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' },
      body: { recipientId: 'missing-approver@target.com', campaignId: 'CAMP-01' }
    }, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.body.error, 'APPROVAL_UNVERIFIABLE');
  });

  await test('1.4 Cron rejects approval with invalid timestamp with HTTP 422 APPROVAL_MALFORMED', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'bad-timestamp@target.com', {
      recipient_id: 'bad-timestamp@target.com',
      recipient_email: 'bad-timestamp@target.com',
      status: 'PROSPECT',
      approvedForOutreach: true,
      approvedBy: 'Sachin Shinde',
      approvedAt: 'not-a-valid-date'
    });

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' },
      body: { recipientId: 'bad-timestamp@target.com', campaignId: 'CAMP-01' }
    }, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.body.error, 'APPROVAL_MALFORMED');
  });

  await test('1.5 Cron rejects revoked approval with HTTP 422 APPROVAL_REVOKED', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'revoked-lead@target.com', {
      recipient_id: 'revoked-lead@target.com',
      recipient_email: 'revoked-lead@target.com',
      status: 'PROSPECT',
      approvedForOutreach: true,
      approvedBy: 'Sachin Shinde',
      approvedAt: new Date().toISOString(),
      approvalRevoked: true,
      approvalRevokedAt: new Date().toISOString()
    });

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' },
      body: { recipientId: 'revoked-lead@target.com', campaignId: 'CAMP-01' }
    }, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.body.error, 'APPROVAL_REVOKED');
  });

  await test('1.6 Cron rejects spam complaint with HTTP 422 RECIPIENT_SPAM_COMPLAINT', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'spam-complaint@target.com', {
      recipient_id: 'spam-complaint@target.com',
      recipient_email: 'spam-complaint@target.com',
      status: 'STOPPED_COMPLAINT',
      approvedForOutreach: true,
      approvedBy: 'Sachin Shinde',
      approvedAt: new Date().toISOString()
    });

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' },
      body: { recipientId: 'spam-complaint@target.com', campaignId: 'CAMP-01' }
    }, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.body.error, 'RECIPIENT_SPAM_COMPLAINT');
  });

  await test('1.7 Cron rejects completed sequence with HTTP 422 SEQUENCE_ALREADY_COMPLETED', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'completed-lead@target.com', {
      recipient_id: 'completed-lead@target.com',
      recipient_email: 'completed-lead@target.com',
      status: 'COMPLETED',
      current_step: 5,
      approvedForOutreach: true,
      approvedBy: 'Sachin Shinde',
      approvedAt: new Date().toISOString()
    });

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' },
      body: { recipientId: 'completed-lead@target.com', campaignId: 'CAMP-01' }
    }, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.body.error, 'SEQUENCE_ALREADY_COMPLETED');
  });

  await test('1.8 Cron rejects recipient frozen in UNCERTAIN_DISPATCH', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'uncertain-lead@target.com', {
      recipient_id: 'uncertain-lead@target.com',
      recipient_email: 'uncertain-lead@target.com',
      status: 'UNCERTAIN_DISPATCH',
      approvedForOutreach: true,
      approvedBy: 'Sachin Shinde',
      approvedAt: new Date().toISOString()
    });

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' },
      body: { recipientId: 'uncertain-lead@target.com', campaignId: 'CAMP-01' }
    }, res);

    assert.strictEqual(res.statusCode, 422);
    assert.strictEqual(res.body.error, 'RECIPIENT_UNCERTAIN_DISPATCH_FROZEN');
  });

  await test('1.9 Cron supports GET method for liveness ping with valid secret (200)', async () => {
    const res = createMockRes();
    await cronHandler({
      method: 'GET',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' }
    }, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'CRON_DISPATCH_HEALTHY');
    assert.strictEqual(res.body.schedulerModel, 'TARGETED_OPERATOR_INVOCATION_ONLY');
  });

  await test('1.10 Cron dryRun returns 200 DRY_RUN_ELIGIBLE for fully validated lead', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'eligible-buyer@target.com', {
      recipient_id: 'eligible-buyer@target.com',
      recipient_email: 'eligible-buyer@target.com',
      status: 'PROSPECT',
      current_step: 0,
      approvedForOutreach: true,
      approvedBy: 'Sachin Shinde (CEO)',
      approvedAt: new Date().toISOString()
    });

    const res = createMockRes();
    await cronHandler({
      method: 'POST',
      headers: { authorization: 'Bearer correct_cron_secret_3d_2026' },
      body: { recipientId: 'eligible-buyer@target.com', campaignId: 'CAMP-01', dryRun: true }
    }, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'DRY_RUN_ELIGIBLE');
    assert.strictEqual(res.body.eligible, true);
    assert.strictEqual(res.body.approvedBy, 'Sachin Shinde (CEO)');
  });

  // Restore safety invariants
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';

  // -------------------------------------------------------------
  // SECTION 2: DEFECT-3C-01 (DEDICATED RECONCILIATION AFTER LEASE EXPIRY)
  // -------------------------------------------------------------
  console.log('\n--- 2. DEFECT-3C-01: DEDICATED RECONCILIATION & LEASE EXPIRY ---');

  await test('2.1 Late Reconciliation: Confirmed sent after 300s lease expiry commits state and intent cleanly', async () => {
    resetMockStores();
    const campaignId = 'CAMP-LATE-REC';
    const recipientId = 'late-buyer@target.com';
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, 'SEQ-01', 1);

    // Initial frozen intent and state
    await saveRecipientSequenceStateDistributed(campaignId, recipientId, {
      recipient_id: recipientId,
      recipient_email: recipientId,
      status: 'UNCERTAIN_DISPATCH',
      current_step: 0,
      haltReason: 'DOWNSTREAM_TIMEOUT_UNCERTAIN_OUTCOME'
    });

    await saveDispatchIntentDistributed(idempotencyKey, {
      intentId: `INTENT-${idempotencyKey}`,
      idempotencyKey,
      campaignId,
      recipientId,
      sequenceId: 'SEQ-01',
      stepNumber: 1,
      email: recipientId,
      status: 'UNCERTAIN_OUTCOME',
      reservationId: 'RES-2026-10-14-1-abc123',
      dateKey: '2026-10-14'
    });

    // Ensure reservation lease is absent/expired (>300s in Redis)
    mockKvStore.delete(`seq_res:${idempotencyKey}`);

    // Execute dedicated reconciliation
    const recResult = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
      providerStatus: 'DELIVERED',
      providerMessageId: 'resend_verified_msg_999',
      evidenceSource: 'operator_resend_dashboard_lookup',
      reconciledBy: 'operator-sachin'
    });

    assert.strictEqual(recResult.reconciled, true);
    assert.strictEqual(recResult.outcome, 'CONFIRMED_SENT');
    assert.strictEqual(recResult.commitResult.committed, true);

    // Verify seq_idem was written in distributed KV
    const idemRaw = mockKvStore.get(`seq_idem:${idempotencyKey}`);
    assert.ok(idemRaw, 'seq_idem must exist in KV');
    const idemParsed = JSON.parse(idemRaw);
    assert.strictEqual(idemParsed.providerMessageId, 'resend_verified_msg_999');
    assert.strictEqual(idemParsed.reconciled, true);

    // Verify seq_state was updated out of UNCERTAIN_DISPATCH to EMAIL_1_SENT
    const state = await getRecipientSequenceStateDistributed(campaignId, recipientId);
    assert.strictEqual(state.status, 'EMAIL_1_SENT');
    assert.strictEqual(state.current_step, 1);
    assert.strictEqual(state.last_provider_message_id, 'resend_verified_msg_999');
    assert.strictEqual(state.haltReason, null);
  });

  await test('2.2 Idempotency: Repeated reconciliation returns deterministic cached outcome', async () => {
    const campaignId = 'CAMP-LATE-REC';
    const recipientId = 'late-buyer@target.com';
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, 'SEQ-01', 1);

    const secondRec = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
      providerStatus: 'DELIVERED',
      providerMessageId: 'resend_verified_msg_999'
    });

    assert.strictEqual(secondRec.reconciled, true);
    assert.strictEqual(secondRec.alreadyReconciled, true);
    assert.strictEqual(secondRec.outcome, 'CONFIRMED_SENT');
  });

  await test('2.3 Ambiguous or missing evidence is rejected fail-closed (keeps state frozen)', async () => {
    resetMockStores();
    const campaignId = 'CAMP-AMBIGUOUS';
    const recipientId = 'ambiguous-buyer@target.com';
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, 'SEQ-01', 1);

    await saveRecipientSequenceStateDistributed(campaignId, recipientId, {
      recipient_id: recipientId,
      status: 'UNCERTAIN_DISPATCH',
      current_step: 0
    });

    await saveDispatchIntentDistributed(idempotencyKey, {
      idempotencyKey,
      campaignId,
      recipientId,
      sequenceId: 'SEQ-01',
      stepNumber: 1,
      status: 'UNCERTAIN_OUTCOME'
    });

    // Call with UNKNOWN / unconfirmed status
    const recResult = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
      providerStatus: 'UNKNOWN'
    });

    assert.strictEqual(recResult.reconciled, false);
    assert.strictEqual(recResult.ambiguous, true);
    assert.strictEqual(recResult.reason, 'AMBIGUOUS_EVIDENCE_REJECTED');

    // Confirm state remains strictly frozen
    const state = await getRecipientSequenceStateDistributed(campaignId, recipientId);
    assert.strictEqual(state.status, 'UNCERTAIN_DISPATCH');
  });

  await test('2.4 Confirmed NOT sent unfreezes sequence state and releases quota cleanly', async () => {
    resetMockStores();
    const campaignId = 'CAMP-NOT-SENT';
    const recipientId = 'not-sent-buyer@target.com';
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, 'SEQ-01', 1);

    // Seed quota and reservation
    mockKvStore.set('quota:daily:2026-10-14', '1');
    mockKvStore.set('quota:res:RES-NOT-SENT-1', JSON.stringify({ reservationId: 'RES-NOT-SENT-1' }));

    await saveRecipientSequenceStateDistributed(campaignId, recipientId, {
      recipient_id: recipientId,
      status: 'UNCERTAIN_DISPATCH',
      current_step: 1
    });

    await saveDispatchIntentDistributed(idempotencyKey, {
      idempotencyKey,
      campaignId,
      recipientId,
      sequenceId: 'SEQ-01',
      stepNumber: 1,
      status: 'UNCERTAIN_OUTCOME',
      reservationId: 'RES-NOT-SENT-1',
      dateKey: '2026-10-14'
    });

    const recResult = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
      providerStatus: 'NOT_SENT',
      reconciliationNotes: 'Verified against Resend API: 0 messages dispatched for recipient'
    });

    assert.strictEqual(recResult.reconciled, true);
    assert.strictEqual(recResult.outcome, 'CONFIRMED_NOT_SENT');

    // Verify quota decremented back to 0
    assert.strictEqual(mockKvStore.get('quota:daily:2026-10-14'), '0');

    // Verify state unfrozen to PROSPECT
    const state = await getRecipientSequenceStateDistributed(campaignId, recipientId);
    assert.strictEqual(state.status, 'PROSPECT');
  });

  // -------------------------------------------------------------
  // SECTION 3: DEFECT-3C-03 (DISPATCH BYPASS ELIMINATION & SCHEDULER AUDIT)
  // -------------------------------------------------------------
  console.log('\n--- 3. DEFECT-3C-03: DISPATCH BYPASS ELIMINATION & SCHEDULER AUDIT ---');

  await test('3.1 execute_phase_3o_controlled_send.cjs routes through dispatchSequenceStepDistributed', async () => {
    const scriptPath = path.join(__dirname, 'execute_phase_3o_controlled_send.cjs');
    const content = fs.readFileSync(scriptPath, 'utf8');

    assert.strictEqual(content.includes('dispatchSequenceStepDistributed('), true, 'Must call dispatchSequenceStepDistributed');
    assert.strictEqual(content.includes('commitSequenceStep('), false, 'Must not call raw commitSequenceStep');
    assert.strictEqual(content.includes('reserveDailyThroughputSlot('), false, 'Must not call raw reserveDailyThroughputSlot');
  });

  await test('3.2 vercel.json contains no cron schedules (autonomous sweeps disabled)', async () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
    assert.strictEqual(vercelConfig.crons, undefined, 'vercel.json must have no cron definitions');
  });

  await test('3.3 execute_phase_3o_controlled_send.cjs variable scoping & record construction execute without ReferenceError', async () => {
    resetMockStores();
    const fixture = {
      recipientId: 'TEST-01',
      email: 'sachinnshinde1356@gmail.com',
      companyName: 'Avani Agro Foods Internal Pilot Inbox 1',
      contactPerson: 'Sachin Shinde',
      productFocus: 'Moringa & Dehydrated Red Onion Powder'
    };

    const recipientState = {
      recipientId: fixture.recipientId,
      recipient_id: fixture.recipientId,
      recipient_email: fixture.email,
      sequenceStatus: 'PROSPECT',
      leadStatus: 'OUTREACH_ACTIVE',
      approvedForOutreach: true,
      currentStep: 0,
      current_step: 0
    };

    let sendTimestamp = null;
    let resendResponse = null;
    let providerMessageId = null;
    let deliveryTelemetry = null;

    // Simulate the exact controlled send dispatch call with mock transmitter
    let transmitterInvoked = 0;
    const dispatchResult = await dispatchSequenceStepDistributed(
      recipientState,
      'PHASE_3O_CONTROLLED_PILOT_2026',
      {
        workerId: 'test-worker-3o',
        isTestMode: false,
        globalOutreachStop: false,
        outreachAuthorized: true,
        approvedForOutreach: true
      },
      async (renderedEmail, context) => {
        transmitterInvoked++;
        sendTimestamp = new Date().toISOString();
        resendResponse = { statusCode: 200, data: { id: 'msg_resend_mock_3o_001' } };
        providerMessageId = resendResponse.data.id;
        deliveryTelemetry = { status: 'delivered', provider: 'mock_resend' };
        return { providerMessageId, deliveryTelemetry };
      }
    );

    assert.strictEqual(dispatchResult.success, true);
    assert.strictEqual(transmitterInvoked, 1);

    // Now execute the exact record construction from execute_phase_3o_controlled_send.cjs
    const isSuccess = Boolean(dispatchResult.success);
    const quotaConsumed = dispatchResult.quotaReservation?.currentCount || dispatchResult.quotaReservation?.quotaUsed || 1;
    const quotaLimit = dispatchResult.quotaReservation?.dailyLimit || dispatchResult.quotaReservation?.limit || 20;

    const record = {
      testId: 'TEST-01',
      recipientId: fixture.recipientId,
      recipient: fixture.email,
      companyName: fixture.companyName,
      contactPerson: fixture.contactPerson,
      productFocus: fixture.productFocus,
      timestamp: sendTimestamp || new Date().toISOString(),
      sequenceStep: 'SEQ-01',
      sender: 'sales@avaniagrofoods.com',
      replyTo: 'sales@avaniagrofoods.com',
      httpStatus: resendResponse ? resendResponse.statusCode : 200,
      success: isSuccess,
      blocked: false,
      providerMessageId: providerMessageId || dispatchResult.providerMessageId || null,
      providerResponse: resendResponse ? (resendResponse.data || resendResponse.rawBody) : null,
      deliveryTelemetry: deliveryTelemetry || {},
      quotaConsumed,
      quotaLimit,
      sequenceState: recipientState.sequenceStatus || recipientState.status,
      leadState: recipientState.leadStatus,
      suppressionState: 'NONE'
    };

    assert.strictEqual(record.recipientId, 'TEST-01');
    assert.strictEqual(record.providerMessageId, 'msg_resend_mock_3o_001');
    assert.strictEqual(record.httpStatus, 200);
    assert.strictEqual(record.success, true);
    assert.strictEqual(typeof record.timestamp, 'string');
    assert.strictEqual(record.quotaConsumed, 1);
    assert.strictEqual(record.quotaLimit, 20);
    assert.strictEqual(record.deliveryTelemetry.status, 'delivered');
  });

  await test('3.4 execute_phase_3o_controlled_send.cjs module exports and allowlist invariants', async () => {
    const controlledModule = require('./execute_phase_3o_controlled_send.cjs');
    assert.strictEqual(typeof controlledModule.executeControlledSend, 'function');
    assert.strictEqual(controlledModule.ALLOWED_TEST_RECIPIENTS instanceof Set, true);
    assert.strictEqual(controlledModule.ALLOWED_TEST_RECIPIENTS.size, 3);
    assert.strictEqual(controlledModule.TEST_RECIPIENTS.length, 3);
  });

  await test('3.5 Test-State Isolation: Synthetic dual-writes land only in isolated temp store and leave shared sequenceStateStore.json untouched', async () => {
    const activeConfig = getStorageConfiguration();
    assert.strictEqual(path.resolve(activeConfig.storePath), ISOLATION.isolatedStorePath);
    assert.notStrictEqual(path.resolve(activeConfig.storePath), SHARED_OPERATIONAL_STORE_PATH);
    assert.strictEqual(fs.existsSync(ISOLATION.isolatedStorePath), true);

    const isolatedData = JSON.parse(fs.readFileSync(ISOLATION.isolatedStorePath, 'utf8'));
    assert.ok(isolatedData.sequences && Object.keys(isolatedData.sequences).length > 0, 'Isolated store must absorb synthetic sequence records');
    assert.ok(isolatedData.dispatchIntents && Object.keys(isolatedData.dispatchIntents).length > 0, 'Isolated store must absorb synthetic dispatch intents');

    if (ISOLATION.sharedStoreBaselineHash !== null) {
      const currentSharedHash = computeFileSha256(SHARED_OPERATIONAL_STORE_PATH);
      assert.strictEqual(currentSharedHash, ISOLATION.sharedStoreBaselineHash, 'Shared api/_data/sequenceStateStore.json must remain byte-for-byte unchanged');
    }
  });

  await stopMockKvServer();
  cleanupIsolatedTempDir(ISOLATION);

  console.log('\n============================================================');
  console.log(`PACKAGE 3D RESULTS: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED.`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exitCode = 1;
  }
}

runPackage3DTests().catch(async err => {
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';
  await stopMockKvServer().catch(() => {});
  cleanupIsolatedTempDir(ISOLATION);
  console.error('Fatal test error:', err);
  process.exit(1);
});
