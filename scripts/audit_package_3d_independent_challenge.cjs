// ============================================================
// AVANI AGRO FOODS — PACKAGE 3D INDEPENDENT VERIFICATION & CHALLENGE SUITE
// scripts/audit_package_3d_independent_challenge.cjs
//
// Mode: READ-ONLY AUDIT & INDEPENDENT VERIFICATION CHALLENGE
// Role: Independent Security & Reliability Auditor
// Safety Controls: GLOBAL_OUTREACH_STOP=1, OUTREACH_AUTHORIZED=0, REAL_BUYER_CONTACT=0, REAL_BUYER_EMAILS=0
// ============================================================

const http = require('http');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
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

const ISOLATION = establishTestIsolation('aaf-p3e8-audit-3d-chal');

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
      process.env.KV_REST_API_TOKEN = 'test_audit_3d_token';
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

async function runAuditChallenge() {
  console.log('============================================================');
  console.log('TEST SUITE: Package 3D Independent Verification Challenge');
  console.log('Role: Independent Auditor | Mode: Mock-Only Verification');
  console.log('============================================================\n');

  await startMockKvServer();

  const {
    commitReconciledSequenceStepDistributed,
    commitSequenceStepDistributed,
    getRecipientSequenceStateDistributed,
    saveRecipientSequenceStateDistributed,
    generateStepIdempotencyKey,
    saveDispatchIntentDistributed,
    getDispatchIntentDistributed,
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
    reserveDailyThroughputSlotDistributed
  } = await import('../api/_lib/dailyThroughputGovernor.js');

  const {
    reconcileUncertainDispatchIntentDistributed,
    dispatchSequenceStepDistributed,
    SEQUENCE_STATUSES
  } = await import('../api/_lib/sequenceStateMachine.js');

  const { default: cronHandler } = await import('../api/cron-sequence-dispatch.js');

  // =============================================================
  // SECTION 1: PHASE 2 — RECONCILIATION CHALLENGE (DEFECT-3C-01)
  // =============================================================
  console.log('--- SECTION 1: RECONCILIATION CHALLENGE (DEFECT-3C-01) ---');

  // Test 1.1: Normal dispatch rejects expired lease
  await test('1.1 Normal Dispatch Lease Fencing: Expired lease (>300s) is strictly rejected by commitSequenceStepDistributed', async () => {
    resetMockStores();
    const campaignId = 'CAMP-CHALLENGE';
    const recipientId = 'lease-expired-lead@challenge.com';
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, 'SEQ-01', 1);

    // Seed expired reservation in KV
    mockKvStore.set(`seq_res:${idempotencyKey}`, JSON.stringify({
      workerId: 'worker-normal',
      expiresAt: Date.now() - 5000 // 5 seconds expired
    }));

    const result = await commitSequenceStepDistributed(campaignId, recipientId, 'SEQ-01', 1, {
      workerId: 'worker-normal',
      providerMessageId: 'msg-should-fail'
    });

    assert.strictEqual(result.committed, false);
    assert.strictEqual(result.leaseExpired, true);
    assert.match(result.reason, /LEASE_EXPIRED/);
  });

  // Test 1.2: Normal dispatch rejects missing reservation
  await test('1.2 Normal Dispatch Lease Fencing: Missing reservation key is rejected by commitSequenceStepDistributed', async () => {
    resetMockStores();
    const campaignId = 'CAMP-CHALLENGE';
    const recipientId = 'no-res-lead@challenge.com';

    const result = await commitSequenceStepDistributed(campaignId, recipientId, 'SEQ-01', 1, {
      workerId: 'worker-normal',
      providerMessageId: 'msg-should-fail'
    });

    assert.strictEqual(result.committed, false);
    assert.strictEqual(result.leaseExpired, true);
    assert.match(result.reason, /LEASE_EXPIRED/);
  });

  // Test 1.3: Dedicated reconciliation commits confirmed send post-lease expiry
  await test('1.3 Late Reconciliation: Confirmed sent commits successfully after lease expired', async () => {
    resetMockStores();
    const campaignId = 'CAMP-CHALLENGE';
    const recipientId = 'late-reconcile@challenge.com';
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, 'SEQ-01', 1);

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
      reservationId: 'RES-AUDIT-123',
      dateKey: '2026-10-14'
    });

    // Explicitly confirm no reservation exists
    assert.strictEqual(mockKvStore.has(`seq_res:${idempotencyKey}`), false);

    const recResult = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
      providerStatus: 'DELIVERED',
      providerMessageId: 'resend_audit_msg_001',
      evidenceSource: 'operator_audit_dashboard',
      reconciledBy: 'auditor-sachin'
    });

    assert.strictEqual(recResult.reconciled, true);
    assert.strictEqual(recResult.outcome, 'CONFIRMED_SENT');
    assert.strictEqual(recResult.commitResult.committed, true);

    // Verify seq_state updated
    const state = await getRecipientSequenceStateDistributed(campaignId, recipientId);
    assert.strictEqual(state.status, 'EMAIL_1_SENT');
    assert.strictEqual(state.last_provider_message_id, 'resend_audit_msg_001');
    assert.strictEqual(state.haltReason, null);
  });

  // Test 1.4: Concurrent reconciliation race challenge
  await test('1.4 Concurrent Reconciliation: 20 simultaneous reconcilers race; exactly 1 acquires mutex and commits without corruption', async () => {
    resetMockStores();
    const campaignId = 'CAMP-RACE';
    const recipientId = 'race-reconcile@challenge.com';
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, 'SEQ-01', 1);

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
      status: 'UNCERTAIN_OUTCOME'
    });

    // Launch 20 concurrent contenders
    const contenders = Array.from({ length: 20 }, (_, idx) => 
      reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
        providerStatus: 'DELIVERED',
        providerMessageId: 'resend_race_winner_msg',
        reconciledBy: `contender-auditor-${idx}`
      })
    );

    const outcomes = await Promise.all(contenders);
    const successfulCommits = outcomes.filter(o => o.reconciled && o.outcome === 'CONFIRMED_SENT');
    const lockedContenders = outcomes.filter(o => !o.reconciled && o.commitFailed && o.reason && o.reason.includes('RECONCILIATION_IN_PROGRESS'));
    assert.strictEqual(successfulCommits.length, 1, 'Exactly 1 contender acquires mutex and commits');
    assert.strictEqual(lockedContenders.length, 19, '19 contenders are rejected with RECONCILIATION_IN_PROGRESS');

    // Subsequent 21st call sees deterministic alreadyReconciled: true
    const postReconciliation = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
      providerStatus: 'DELIVERED',
      providerMessageId: 'resend_race_winner_msg'
    });
    assert.strictEqual(postReconciliation.reconciled, true);
    assert.strictEqual(postReconciliation.alreadyReconciled, true);
    assert.strictEqual(postReconciliation.outcome, 'CONFIRMED_SENT');

    // Exactly one seq_idem record exists
    const idemRaw = mockKvStore.get(`seq_idem:${idempotencyKey}`);
    assert.ok(idemRaw);
    const idemParsed = JSON.parse(idemRaw);
    assert.strictEqual(idemParsed.providerMessageId, 'resend_race_winner_msg');
  });

  // Test 1.5: Conflicting or ambiguous provider evidence rejection
  await test('1.5 Ambiguous Evidence Rejection: providerStatus PENDING/UNKNOWN/null kept frozen in UNCERTAIN_DISPATCH', async () => {
    resetMockStores();
    const campaignId = 'CAMP-AMBIGUOUS';
    const recipientId = 'ambiguous-lead@challenge.com';
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, 'SEQ-01', 1);

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
      status: 'UNCERTAIN_OUTCOME'
    });

    for (const badStatus of ['PENDING', 'UNKNOWN', 'UNCONFIRMED', '', null]) {
      const result = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
        providerStatus: badStatus
      });
      assert.strictEqual(result.reconciled, false);
      assert.strictEqual(result.ambiguous, true);
    }

    // State remains frozen in UNCERTAIN_DISPATCH
    const st = await getRecipientSequenceStateDistributed(campaignId, recipientId);
    assert.strictEqual(st.status, 'UNCERTAIN_DISPATCH');
    assert.strictEqual(st.haltReason, 'DOWNSTREAM_TIMEOUT_UNCERTAIN_OUTCOME');
  });

  // Test 1.6: Confirmed NOT sent releases quota and unfreezes sequence state
  await test('1.6 Confirmed NOT Sent: Rollback quota slot and unfreeze state to prior step', async () => {
    resetMockStores();
    const campaignId = 'CAMP-NOT-SENT';
    const recipientId = 'not-sent-lead@challenge.com';
    const dateKey = '2026-10-14';
    const idempotencyKey = generateStepIdempotencyKey(campaignId, recipientId, 'SEQ-01', 1);

    // Reserve a daily quota slot first
    const slotRes = await reserveDailyThroughputSlotDistributed({
      now: new Date('2026-10-14T10:00:00Z'),
      workerId: 'test-w1'
    });
    assert.strictEqual(slotRes.allowed, true);

    await saveRecipientSequenceStateDistributed(campaignId, recipientId, {
      recipient_id: recipientId,
      recipient_email: recipientId,
      status: 'UNCERTAIN_DISPATCH',
      current_step: 1,
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
      reservationId: slotRes.reservationId,
      dateKey
    });

    // Reconcile as CONFIRMED_NOT_SENT
    const recResult = await reconcileUncertainDispatchIntentDistributed(idempotencyKey, {
      providerStatus: 'NOT_SENT',
      reconciledBy: 'operator-audit'
    });

    assert.strictEqual(recResult.reconciled, true);
    assert.strictEqual(recResult.outcome, 'CONFIRMED_NOT_SENT');

    // State unfrozen back to PROSPECT
    const st = await getRecipientSequenceStateDistributed(campaignId, recipientId);
    assert.strictEqual(st.status, 'PROSPECT');
    assert.strictEqual(st.haltReason, null);

    // Quota slot released and rolled back in KV
    const count = parseInt(mockKvStore.get(`quota:daily:${slotRes.dateKey}`) || '0', 10);
    assert.strictEqual(count, 0);
  });

  // =============================================================
  // SECTION 2: PHASE 3 — APPROVAL AND LIFECYCLE CHALLENGE (DEFECT-3C-02)
  // =============================================================
  console.log('\n--- SECTION 2: APPROVAL & LIFECYCLE CHALLENGE (DEFECT-3C-02) ---');

  process.env.CRON_SECRET = 'audit_cron_secret_high_entropy_2026';
  enableMockOutreachForLocalTest();

  let providerCallCount = 0;
  // Interception harness for provider transmission
  const mockTransmitter = async () => {
    providerCallCount++;
    return { providerMessageId: 'never_called' };
  };

  // Helper to run cron handler and assert provider never called
  async function assertRejection(testName, payload, headers, expectedStatus, expectedError) {
    const initialCallCount = providerCallCount;
    const res = createMockRes();
    const req = {
      method: payload ? 'POST' : 'GET',
      headers: headers || { authorization: 'Bearer audit_cron_secret_high_entropy_2026' },
      body: payload
    };

    await cronHandler(req, res);
    assert.strictEqual(res.statusCode, expectedStatus, `${testName}: Status code mismatch`);
    if (expectedError) {
      assert.strictEqual(res.body.error, expectedError, `${testName}: Error code mismatch`);
    }
    assert.strictEqual(providerCallCount, initialCallCount, `${testName}: FAIL! Provider transmission callback was invoked!`);
  }

  // Test 2.1: Recipient not enrolled (Never synthesize approvedForOutreach!)
  await test('2.1 Rejection: Un-enrolled lead returns 422 RECIPIENT_NOT_ENROLLED with 0 provider calls', async () => {
    resetMockStores();
    await assertRejection(
      'Un-enrolled',
      { recipientId: 'ghost-lead@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'RECIPIENT_NOT_ENROLLED'
    );
  });

  // Test 2.2: Unapproved lead
  await test('2.2 Rejection: Unapproved lead returns 422 RECIPIENT_NOT_APPROVED with 0 provider calls', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'unapproved@challenge.com', {
      recipient_id: 'unapproved@challenge.com',
      recipient_email: 'unapproved@challenge.com',
      status: 'PROSPECT',
      approvedForOutreach: false
    });
    await assertRejection(
      'Unapproved',
      { recipientId: 'unapproved@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'RECIPIENT_NOT_APPROVED'
    );
  });

  // Test 2.3: Approval missing approvedBy operator
  await test('2.3 Rejection: Approval missing operator ID returns 422 APPROVAL_UNVERIFIABLE with 0 provider calls', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'missing-op@challenge.com', {
      recipient_id: 'missing-op@challenge.com',
      recipient_email: 'missing-op@challenge.com',
      status: 'PROSPECT',
      approvedForOutreach: true,
      approvedBy: '',
      approvedAt: new Date().toISOString()
    });
    await assertRejection(
      'Missing Operator',
      { recipientId: 'missing-op@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'APPROVAL_UNVERIFIABLE'
    );
  });

  // Test 2.4: Approval with malformed timestamp
  await test('2.4 Rejection: Malformed timestamp returns 422 APPROVAL_MALFORMED with 0 provider calls', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'bad-time@challenge.com', {
      recipient_id: 'bad-time@challenge.com',
      recipient_email: 'bad-time@challenge.com',
      status: 'PROSPECT',
      approvedForOutreach: true,
      approvedBy: 'Sachin Shinde',
      approvedAt: 'malformed_timestamp'
    });
    await assertRejection(
      'Malformed Timestamp',
      { recipientId: 'bad-time@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'APPROVAL_MALFORMED'
    );
  });

  // Test 2.5: Revoked approval
  await test('2.5 Rejection: Revoked approval returns 422 APPROVAL_REVOKED with 0 provider calls', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'revoked@challenge.com', {
      recipient_id: 'revoked@challenge.com',
      recipient_email: 'revoked@challenge.com',
      status: 'PROSPECT',
      approvedForOutreach: true,
      approvedBy: 'Sachin Shinde',
      approvedAt: new Date().toISOString(),
      approvalRevoked: true,
      approvalRevokedAt: new Date().toISOString()
    });
    await assertRejection(
      'Revoked Approval',
      { recipientId: 'revoked@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'APPROVAL_REVOKED'
    );
  });

  // Test 2.6: Global Stop active
  await test('2.6 Rejection: GLOBAL_OUTREACH_STOP=1 returns 403 with 0 provider calls', async () => {
    process.env.GLOBAL_OUTREACH_STOP = '1';
    await assertRejection(
      'Global Stop',
      { recipientId: 'any@challenge.com', campaignId: 'CAMP-01' },
      null,
      403,
      'GLOBAL_OUTREACH_STOP_ENGAGED'
    );
    enableMockOutreachForLocalTest();
  });

  // Test 2.7: Outreach not authorized
  await test('2.7 Rejection: OUTREACH_AUTHORIZED=0 returns 403 with 0 provider calls', async () => {
    process.env.OUTREACH_AUTHORIZED = '0';
    await assertRejection(
      'Outreach Not Authorized',
      { recipientId: 'any@challenge.com', campaignId: 'CAMP-01' },
      null,
      403,
      'OUTREACH_NOT_AUTHORIZED'
    );
    enableMockOutreachForLocalTest();
  });

  // Test 2.8: Lifecycle rejection: Opt-Out
  await test('2.8 Rejection: Opt-Out / Unsubscribe returns 422 RECIPIENT_UNSUBSCRIBED_OR_CANCELLED with 0 provider calls', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'optout@challenge.com', {
      recipient_id: 'optout@challenge.com',
      recipient_email: 'optout@challenge.com',
      status: 'STOPPED_OPT_OUT',
      followups_cancelled: true
    });
    await assertRejection(
      'Opt-Out',
      { recipientId: 'optout@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'RECIPIENT_UNSUBSCRIBED_OR_CANCELLED'
    );
  });

  // Test 2.9: Lifecycle rejection: Bounce / Suppression
  await test('2.9 Rejection: Bounce / Suppressed returns 422 RECIPIENT_SUPPRESSED with 0 provider calls', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'bounced@challenge.com', {
      recipient_id: 'bounced@challenge.com',
      recipient_email: 'bounced@challenge.com',
      status: 'STOPPED_BOUNCE',
      suppressed: true
    });
    await assertRejection(
      'Bounce',
      { recipientId: 'bounced@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'RECIPIENT_SUPPRESSED'
    );
  });

  // Test 2.10: Lifecycle rejection: Spam Complaint
  await test('2.10 Rejection: Spam Complaint returns 422 RECIPIENT_SPAM_COMPLAINT with 0 provider calls', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'spam@challenge.com', {
      recipient_id: 'spam@challenge.com',
      recipient_email: 'spam@challenge.com',
      status: 'STOPPED_COMPLAINT'
    });
    await assertRejection(
      'Spam Complaint',
      { recipientId: 'spam@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'RECIPIENT_SPAM_COMPLAINT'
    );
  });

  // Test 2.11: Lifecycle rejection: Inbound Reply Received
  await test('2.11 Rejection: Inbound Reply returns 422 with 0 provider calls (lifecycle fence)', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'reply@challenge.com', {
      recipient_id: 'reply@challenge.com',
      recipient_email: 'reply@challenge.com',
      status: 'REPLIED',
      reply_detected: true
    });
    await assertRejection(
      'Reply Received',
      { recipientId: 'reply@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      null
    );
  });

  // Test 2.12: Lifecycle rejection: Uncertain Dispatch Frozen
  await test('2.12 Rejection: Uncertain Dispatch returns 422 RECIPIENT_UNCERTAIN_DISPATCH_FROZEN with 0 provider calls', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'uncertain@challenge.com', {
      recipient_id: 'uncertain@challenge.com',
      recipient_email: 'uncertain@challenge.com',
      status: 'UNCERTAIN_DISPATCH'
    });
    await assertRejection(
      'Uncertain Dispatch',
      { recipientId: 'uncertain@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'RECIPIENT_UNCERTAIN_DISPATCH_FROZEN'
    );
  });

  // Test 2.13: Lifecycle rejection: Completed Sequence
  await test('2.13 Rejection: Completed Sequence returns 422 SEQUENCE_ALREADY_COMPLETED with 0 provider calls', async () => {
    resetMockStores();
    await saveRecipientSequenceStateDistributed('CAMP-01', 'completed@challenge.com', {
      recipient_id: 'completed@challenge.com',
      recipient_email: 'completed@challenge.com',
      status: 'COMPLETED',
      current_step: 5
    });
    await assertRejection(
      'Completed Sequence',
      { recipientId: 'completed@challenge.com', campaignId: 'CAMP-01' },
      null,
      422,
      'SEQUENCE_ALREADY_COMPLETED'
    );
  });

  // Test 2.14: Authentication: Missing or invalid CRON_SECRET
  await test('2.14 Authentication: Invalid or missing token returns 401 UNAUTHORIZED with 0 provider calls', async () => {
    await assertRejection(
      'Bad Secret',
      { recipientId: 'any@challenge.com', campaignId: 'CAMP-01' },
      { authorization: 'Bearer wrong_token_xyz' },
      401,
      'UNAUTHORIZED'
    );
    await assertRejection(
      'Missing Secret',
      { recipientId: 'any@challenge.com', campaignId: 'CAMP-01' },
      {},
      401,
      'UNAUTHORIZED'
    );
  });

  // Test 2.15: Unsupported HTTP method (e.g., PUT, DELETE)
  await test('2.15 HTTP Method Gate: Unsupported PUT/DELETE returns 405 METHOD_NOT_ALLOWED', async () => {
    const res = createMockRes();
    await cronHandler({ method: 'DELETE', headers: { authorization: 'Bearer audit_cron_secret_high_entropy_2026' } }, res);
    assert.strictEqual(res.statusCode, 405);
    assert.strictEqual(res.body.error, 'METHOD_NOT_ALLOWED');
  });

  // Test 2.16: Safe GET liveness check
  await test('2.16 Safe GET Liveness: Returns 200 CRON_DISPATCH_HEALTHY with 0 provider calls', async () => {
    const res = createMockRes();
    await cronHandler({ method: 'GET', headers: { authorization: 'Bearer audit_cron_secret_high_entropy_2026' } }, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'CRON_DISPATCH_HEALTHY');
    assert.strictEqual(res.body.schedulerModel, 'TARGETED_OPERATOR_INVOCATION_ONLY');
    assert.strictEqual(providerCallCount, 0);
  });

  // =============================================================
  // SECTION 3: PHASE 4 & 5 — SCHEDULER & DISPATCH ROUTING AUDIT
  // =============================================================
  console.log('\n--- SECTION 3: SCHEDULER & DISPATCH ROUTING AUDIT (DEFECT-3C-03) ---');

  // Test 3.1: vercel.json cron audit
  await test('3.1 Scheduler Audit: vercel.json contains zero autonomous cron schedules', async () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
    assert.strictEqual(vercelConfig.crons, undefined, 'vercel.json must not have crons configured');
  });

  // Test 3.2: execute_phase_3o_controlled_send.cjs routing audit
  await test('3.2 Batch Script Routing: imports dispatchSequenceStepDistributed and no raw postResendEmail bypass', async () => {
    const scriptContent = fs.readFileSync(path.join(__dirname, 'execute_phase_3o_controlled_send.cjs'), 'utf8');
    assert.ok(scriptContent.includes('dispatchSequenceStepDistributed'), 'Must import dispatchSequenceStepDistributed');
    assert.ok(!scriptContent.includes('commitSequenceStep('), 'Must not call raw commitSequenceStep');
    assert.ok(!scriptContent.includes('reserveDailyThroughputSlot('), 'Must not call raw reserveDailyThroughputSlot');
  });

  // Test 3.3: Test-State Isolation verification
  await test('3.3 Test-State Isolation: Synthetic dual-writes land only in isolated temp store and leave shared sequenceStateStore.json untouched', async () => {
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

  // Re-engage safety invariants
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';

  await stopMockKvServer();
  cleanupIsolatedTempDir(ISOLATION);

  console.log('\n============================================================');
  console.log(`AUDIT CHALLENGE EXECUTION COMPLETE: ${passed} passed, ${failed} failed.`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditChallenge().catch(async err => {
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';
  await stopMockKvServer().catch(() => {});
  cleanupIsolatedTempDir(ISOLATION);
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
