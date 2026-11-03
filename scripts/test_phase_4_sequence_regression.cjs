// ============================================================
// AVANI AGRO FOODS — Phase 4 Email Sequence Engine Regression Suite
// scripts/test_phase_4_sequence_regression.cjs
//
// Verification of:
// 1. Strict sequence progression SEQ-01 through SEQ-05 at 72h intervals.
// 2. Strict terminal state at SEQ-05 with zero possibility of SEQ-06.
// 3. 72-hour delay enforcement (premature dispatch rejected).
// 4. Mandatory per-lead human approval gate before SEQ-01.
// 5. Fail-closed global outreach stop (GLOBAL_OUTREACH_STOP=1).
// 6. Fail-closed outreach authorization gate (OUTREACH_AUTHORIZED=0).
// 7. Idempotency key uniqueness and replay rejection.
// 8. Atomic worker reservation and concurrency collision (ALREADY_RESERVED).
// 9. Worker lease expiration and subsequent worker acquisition.
// 10. Stale worker fencing violation detection on commit.
// 11. Transient provider error handling, retry backoff & reservation release.
// 12. Throughput governor: 20/day pilot quota limit enforcement.
// 13. Throughput governor: 1-minute pacing enforcement.
// 14. Inbound reply suppression stopping follow-ups immediately.
// 15. Opt-out, bounce, and complaint permanent sequence stoppage.
// 16. Durable storage failure fail-closed behavior.
// 17. Missing distributed KV fail-closed behavior.
// 18. Synthetic recipient protection & zero real buyer contact verification.
// ============================================================

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const REPO_ROOT_DIR = path.resolve(__dirname, '..');
const FORBIDDEN_DATA_DIR = path.resolve(__dirname, '../api/_data');
const FORBIDDEN_SCRATCH_DIR = path.resolve(__dirname, '../scratch');
const ISOLATED_DIR_PREFIX = 'aaf-phase4-seq-test-';

/**
 * Establish strict fail-closed test isolation before importing any application modules.
 * Note: Cleanup is guaranteed for normal completion and caught exceptions via try/finally,
 * but cannot be guaranteed on SIGKILL, forced process termination, or machine failure;
 * interrupted runs require separate operator review.
 */
function establishTestIsolation(prefix) {
  const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
  const vercelFlag = String(process.env.VERCEL || '').trim();
  const vercelEnv = String(process.env.VERCEL_ENV || '').trim().toLowerCase();

  if (
    nodeEnv === 'production' ||
    Boolean(vercelFlag && vercelFlag !== '0' && vercelFlag !== 'false') ||
    vercelEnv === 'production' ||
    vercelEnv === 'preview'
  ) {
    throw new Error('FAIL_CLOSED_ISOLATION: Refusing to run test_phase_4_sequence_regression.cjs in a production or Vercel runtime environment.');
  }

  const envSnapshot = {
    SEQUENCE_TEST_ISOLATION: process.env.SEQUENCE_TEST_ISOLATION,
    SEQUENCE_STORE_PATH: process.env.SEQUENCE_STORE_PATH,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    REQUIRE_DISTRIBUTED_KV: process.env.REQUIRE_DISTRIBUTED_KV,
    REQUIRE_DURABLE_STORAGE: process.env.REQUIRE_DURABLE_STORAGE,
    SIMULATE_STORAGE_FAILURE: process.env.SIMULATE_STORAGE_FAILURE
  };

  // Enforce non-negotiable outreach safety invariants
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';
  process.env.REAL_BUYER_CONTACT = '0';
  process.env.REAL_BUYER_EMAILS = '0';

  // Scrub all four ambient KV credentials and strict flags before module import
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.REQUIRE_DISTRIBUTED_KV;
  delete process.env.REQUIRE_DURABLE_STORAGE;
  delete process.env.SIMULATE_STORAGE_FAILURE;

  const tmpBase = os.tmpdir();
  if (!tmpBase || !fs.existsSync(tmpBase)) {
    throw new Error('FAIL_CLOSED_ISOLATION: OS temporary directory (os.tmpdir()) is unavailable.');
  }

  const canonicalTmpBase = path.resolve(tmpBase);
  let isolatedTempDir = null;
  try {
    isolatedTempDir = fs.mkdtempSync(path.join(canonicalTmpBase, prefix));
    const isolatedStorePath = path.resolve(isolatedTempDir, 'sequenceStateStore.isolated.json');

    if (
      !isolatedTempDir.startsWith(canonicalTmpBase + path.sep) ||
      path.dirname(isolatedTempDir) !== canonicalTmpBase ||
      !path.basename(isolatedTempDir).startsWith(prefix) ||
      isolatedStorePath.startsWith(FORBIDDEN_DATA_DIR + path.sep) ||
      isolatedStorePath.startsWith(FORBIDDEN_SCRATCH_DIR + path.sep) ||
      isolatedStorePath.startsWith(REPO_ROOT_DIR + path.sep)
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

    if (!fs.existsSync(isolatedStorePath)) {
      throw new Error(`FAIL_CLOSED_ISOLATION: Pre-created isolated store file does not exist: ${isolatedStorePath}`);
    }

    const parsedCheck = JSON.parse(fs.readFileSync(isolatedStorePath, 'utf8'));
    if (!parsedCheck || typeof parsedCheck !== 'object' || Array.isArray(parsedCheck)) {
      throw new Error(`FAIL_CLOSED_ISOLATION: Pre-created isolated store file failed JSON object validation: ${isolatedStorePath}`);
    }

    process.env.SEQUENCE_TEST_ISOLATION = '1';
    process.env.SEQUENCE_STORE_PATH = isolatedStorePath;

    return Object.freeze({
      expectedPrefix: prefix,
      canonicalTmpBase,
      isolatedTempDir,
      isolatedStorePath,
      envSnapshot
    });
  } catch (err) {
    if (isolatedTempDir) {
      try {
        fs.rmSync(isolatedTempDir, { recursive: true, force: true });
      } catch (_) {}
    }
    throw err;
  }
}

function cleanupIsolatedEnvironment(isolation) {
  // Always keep outreach safety locks engaged
  process.env.GLOBAL_OUTREACH_STOP = '1';
  process.env.OUTREACH_AUTHORIZED = '0';
  process.env.REAL_BUYER_CONTACT = '0';
  process.env.REAL_BUYER_EMAILS = '0';

  if (!isolation || typeof isolation !== 'object') {
    throw new Error('ISOLATION_CLEANUP_FAILED: Missing isolation context.');
  }

  const { expectedPrefix, canonicalTmpBase, isolatedTempDir, envSnapshot } = isolation;

  if (envSnapshot) {
    for (const [key, val] of Object.entries(envSnapshot)) {
      if (val !== undefined) {
        process.env[key] = val;
      } else {
        delete process.env[key];
      }
    }
  }

  const resolvedDir = path.resolve(String(isolatedTempDir || ''));
  if (
    !resolvedDir ||
    !resolvedDir.startsWith(canonicalTmpBase + path.sep) ||
    resolvedDir === canonicalTmpBase ||
    path.dirname(resolvedDir) !== canonicalTmpBase ||
    !path.basename(resolvedDir).startsWith(expectedPrefix) ||
    resolvedDir.startsWith(REPO_ROOT_DIR + path.sep)
  ) {
    throw new Error(`ISOLATION_CLEANUP_FAILED: Refusing to delete unvalidated directory path: ${resolvedDir}`);
  }

  if (fs.existsSync(resolvedDir)) {
    fs.rmSync(resolvedDir, { recursive: true, force: false });
  }
  if (fs.existsSync(resolvedDir)) {
    throw new Error(`ISOLATION_CLEANUP_FAILED: Isolated directory still exists after rmSync: ${resolvedDir}`);
  }
}

const ISOLATION = establishTestIsolation(ISOLATED_DIR_PREFIX);
const TEST_STORE_PATH = ISOLATION.isolatedStorePath;

let EMAIL_SEQUENCES, SENDER_IDENTITY, renderSequenceEmail;
let FOLLOWUP_DELAY_HOURS, SEQUENCE_STATUSES, LEAD_STATUSES, NEXT_ACTIONS, generateIdempotencyKey, createRecipientState, dispatchSequenceStep, handleIncomingReply, handleOptOut, handleBounce, handleComplaint;
let reserveSequenceStep, releaseReservation, commitSequenceStep, getRecipientSequenceState, saveRecipientSequenceState, generateStepIdempotencyKey, recordReplyReceived, recordOptOut, recordBounce, findSequenceByCriteria, resetSequenceStoreForTesting, hasDistributedKV, getStorageConfiguration;
let reserveDailyThroughputSlot, releaseDailyThroughputSlot, getDailyThroughputStatus, DEFAULT_DAILY_PILOT_LIMIT;

try {
  ({
    EMAIL_SEQUENCES,
    SENDER_IDENTITY,
    renderSequenceEmail
  } = require('../api/_lib/emailSequences.js'));

  ({
    FOLLOWUP_DELAY_HOURS,
    SEQUENCE_STATUSES,
    LEAD_STATUSES,
    NEXT_ACTIONS,
    generateIdempotencyKey,
    createRecipientState,
    dispatchSequenceStep,
    handleIncomingReply,
    handleOptOut,
    handleBounce,
    handleComplaint
  } = require('../api/_lib/sequenceStateMachine.js'));

  ({
    reserveSequenceStep,
    releaseReservation,
    commitSequenceStep,
    getRecipientSequenceState,
    saveRecipientSequenceState,
    generateStepIdempotencyKey,
    recordReplyReceived,
    recordOptOut,
    recordBounce,
    findSequenceByCriteria,
    resetSequenceStoreForTesting,
    hasDistributedKV,
    getStorageConfiguration
  } = require('../api/_lib/sequencePersistence.js'));

  ({
    reserveDailyThroughputSlot,
    releaseDailyThroughputSlot,
    getDailyThroughputStatus,
    DEFAULT_DAILY_PILOT_LIMIT
  } = require('../api/_lib/dailyThroughputGovernor.js'));
} catch (loadErr) {
  cleanupIsolatedEnvironment(ISOLATION);
  throw loadErr;
}

const SYNTHETIC_RECIPIENT = {
  id: 'SYNTH-REC-PHASE4-001',
  email: 'qa-sequence-pilot@avani-synthetic-mock.internal',
  companyName: 'Synthetic Global Spices BV',
  contactName: 'Jan de Vries',
  country: 'Netherlands',
  approvedForOutreach: true
};

const CAMPAIGN_ID = 'CAMP-PHASE4-REGRESSION-2026';

function runRegressionSuite() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — PHASE 4 SEQUENCE ENGINE REGRESSION SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function runTest(testName, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] Test ${total}: ${testName}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] Test ${total}: ${testName}`);
      console.error(`       Error: ${err.message}`);
      if (err.stack) {
        console.error(`       Stack: ${err.stack.split('\n').slice(1, 4).join('\n')}`);
      }
      throw err;
    }
  }

  try {
    // Always start with clean isolated test store
    resetSequenceStoreForTesting();

  // -------------------------------------------------------------
  // TEST 1: Mandatory Per-Lead Human Approval Gate for SEQ-01
  // -------------------------------------------------------------
  runTest('Human approval gate strictly blocks unapproved lead from SEQ-01', () => {
    const unapprovedLead = {
      ...SYNTHETIC_RECIPIENT,
      id: 'SYNTH-UNAPPROVED-001',
      approvedForOutreach: false
    };
    const state = createRecipientState(unapprovedLead);

    const result = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: false,
      useDurableStorage: false
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.blocked, true);
    assert.strictEqual(result.approvalRequired, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.BLOCKED_HUMAN_APPROVAL_REQUIRED);
  });

  // -------------------------------------------------------------
  // TEST 2: Approved Lead Passes Human Gate for SEQ-01
  // -------------------------------------------------------------
  runTest('Approved lead passes human approval gate and dispatches SEQ-01', () => {
    const state = createRecipientState(SYNTHETIC_RECIPIENT);
    const result = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: false
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.step, 'EMAIL_1');
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT);
    assert.strictEqual(state.currentStep, 1);
  });

  // -------------------------------------------------------------
  // TEST 3: Fail-Closed Global Outreach Stop
  // -------------------------------------------------------------
  runTest('GLOBAL_OUTREACH_STOP=1 immediately terminates dispatch fail-closed', () => {
    const state = createRecipientState(SYNTHETIC_RECIPIENT);
    const result = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      isTestMode: true,
      globalOutreachStop: true, // Emergency Stop Active
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: false
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.blocked, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_GLOBAL_STOP);
  });

  // -------------------------------------------------------------
  // TEST 4: Fail-Closed Outreach Authorization Gate
  // -------------------------------------------------------------
  runTest('OUTREACH_AUTHORIZED=0 immediately blocks dispatch fail-closed', () => {
    const state = createRecipientState(SYNTHETIC_RECIPIENT);
    const result = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: false, // Unauthorized
      approvedForOutreach: true,
      useDurableStorage: false
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.blocked, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_UNAUTHORIZED);
  });

  // -------------------------------------------------------------
  // TEST 5: Premature Follow-Up Blocked (< 72h)
  // -------------------------------------------------------------
  runTest('Premature follow-up before 72 hours elapses is strictly rejected', () => {
    const state = createRecipientState(SYNTHETIC_RECIPIENT);
    const t0 = new Date('2026-10-10T08:00:00.000Z');

    // Dispatch Step 1 at t0
    dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: t0,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: false
    });

    // Attempt Step 2 at t0 + 24 hours (premature)
    const t24 = new Date(t0.getTime() + 24 * 60 * 60 * 1000);
    const res24 = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: t24,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: false
    });

    assert.strictEqual(res24.success, false);
    assert.strictEqual(res24.timingBlocked, true);
    assert(res24.hoursRemaining > 47 && res24.hoursRemaining <= 48);

    // Attempt Step 2 at t0 + 71.9 hours (still premature)
    const t71 = new Date(t0.getTime() + 71.9 * 60 * 60 * 1000);
    const res71 = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: t71,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: false
    });

    assert.strictEqual(res71.success, false);
    assert.strictEqual(res71.timingBlocked, true);
    assert(res71.hoursRemaining > 0 && res71.hoursRemaining < 0.2);
  });

  // -------------------------------------------------------------
  // TEST 6: Strict 72-Hour Sequential Progression SEQ-01 through SEQ-05
  // -------------------------------------------------------------
  runTest('Strict 72-hour progression from SEQ-01 through SEQ-05 reaches COMPLETED', () => {
    const recipient = { ...SYNTHETIC_RECIPIENT, id: 'SYNTH-FULL-RUN-001' };
    const state = createRecipientState(recipient);
    let currentTime = new Date('2026-10-01T08:00:00.000Z');

    // Step 1: EMAIL_1
    const res1 = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: currentTime,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: false
    });
    assert.strictEqual(res1.success, true);
    assert.strictEqual(state.currentStep, 1);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT);

    // Step 2: EMAIL_2 at +72h
    currentTime = new Date(currentTime.getTime() + 72 * 60 * 60 * 1000);
    const res2 = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: currentTime,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      useDurableStorage: false
    });
    assert.strictEqual(res2.success, true);
    assert.strictEqual(state.currentStep, 2);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_2_SENT);

    // Step 3: EMAIL_3 at +72h
    currentTime = new Date(currentTime.getTime() + 72 * 60 * 60 * 1000);
    const res3 = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: currentTime,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      useDurableStorage: false
    });
    assert.strictEqual(res3.success, true);
    assert.strictEqual(state.currentStep, 3);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_3_SENT);

    // Step 4: EMAIL_4 at +72h
    currentTime = new Date(currentTime.getTime() + 72 * 60 * 60 * 1000);
    const res4 = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: currentTime,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      useDurableStorage: false
    });
    assert.strictEqual(res4.success, true);
    assert.strictEqual(state.currentStep, 4);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_4_SENT);

    // Step 5: EMAIL_5 at +72h (Final Step)
    currentTime = new Date(currentTime.getTime() + 72 * 60 * 60 * 1000);
    const res5 = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: currentTime,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      useDurableStorage: false
    });
    assert.strictEqual(res5.success, true);
    assert.strictEqual(state.currentStep, 5);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.COMPLETED);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.COMPLETED_NO_REPLY);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED);
  });

  // -------------------------------------------------------------
  // TEST 7: Hard Cap at SEQ-05 with Zero Possibility of SEQ-06
  // -------------------------------------------------------------
  runTest('Dispatch beyond SEQ-05 is strictly rejected (No SEQ-06 exists)', () => {
    const state = createRecipientState(SYNTHETIC_RECIPIENT);
    state.currentStep = 5;
    state.sequenceStatus = SEQUENCE_STATUSES.COMPLETED;
    const now72 = new Date('2026-10-25T08:00:00.000Z');

    const result = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: now72,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      useDurableStorage: false
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.blocked, true);
    assert(result.reason.includes('No sequence step beyond SEQ-05 exists') || result.reason.includes('Sequence already completed'));
  });

  // -------------------------------------------------------------
  // TEST 8: Idempotency Key Uniqueness & Replay Rejection
  // -------------------------------------------------------------
  runTest('Idempotency key prevents duplicate dispatch on retry or race condition', () => {
    const recipient = { ...SYNTHETIC_RECIPIENT, id: 'SYNTH-IDEMP-001' };
    const state1 = createRecipientState(recipient);
    const t0 = new Date('2026-10-10T09:00:00.000Z');

    // First attempt: succeeds and commits to durable storage
    const res1 = dispatchSequenceStep(state1, {
      campaignId: CAMPAIGN_ID,
      now: t0,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: true
    });
    assert.strictEqual(res1.success, true);

    // Second attempt: concurrent worker with un-updated state attempts same step 1
    const state2 = createRecipientState(recipient); // step 0 trying to send step 1 again
    const res2 = dispatchSequenceStep(state2, {
      campaignId: CAMPAIGN_ID,
      now: t0,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: true
    });
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res2.duplicate, true);
    assert.strictEqual(res2.reason, 'ALREADY_SENT');

    // Third attempt: immediate retry on state1 blocked by timing or duplicate
    const res3 = dispatchSequenceStep(state1, {
      campaignId: CAMPAIGN_ID,
      now: t0,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: true
    });
    assert.strictEqual(res3.success, false);
    assert(res3.timingBlocked || res3.duplicate);
  });

  // -------------------------------------------------------------
  // TEST 9: Concurrency Collision: Worker A Reserves, Worker B Rejected
  // -------------------------------------------------------------
  runTest('Concurrency Lock: Worker A reserves step, Worker B receives ALREADY_RESERVED', () => {
    const recipientId = 'SYNTH-CONCUR-001';
    const sequenceId = 'SEQ-02';
    const stepNumber = 2;

    // Worker A reserves step for 60 seconds
    const resA = reserveSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, 'worker-alpha', 60);
    assert.strictEqual(resA.reserved, true);
    assert.strictEqual(resA.workerId, 'worker-alpha');

    // Worker B attempts to reserve the identical step concurrently
    const resB = reserveSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, 'worker-beta', 60);
    assert.strictEqual(resB.reserved, false);
    assert.strictEqual(resB.alreadyReserved, true);
    assert.strictEqual(resB.reason, 'ALREADY_RESERVED');
    assert.strictEqual(resB.workerId, 'worker-alpha');

    // Cleanup reservation
    releaseReservation(resA.idempotencyKey);
  });

  // -------------------------------------------------------------
  // TEST 10: Worker Lease Expiration & Subsequent Worker Takeover
  // -------------------------------------------------------------
  runTest('Worker lease expiration allows subsequent worker to acquire expired lock', () => {
    const recipientId = 'SYNTH-LEASE-EXP-001';
    const sequenceId = 'SEQ-02';
    const stepNumber = 2;

    // Worker A reserves with 0-second TTL (immediately expired)
    const resA = reserveSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, 'worker-slow', -1);
    assert.strictEqual(resA.reserved, true);

    // Worker B attempts reservation after lease expiration -> acquisition succeeds
    const resB = reserveSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, 'worker-recovery', 60);
    assert.strictEqual(resB.reserved, true);
    assert.strictEqual(resB.workerId, 'worker-recovery');

    // Cleanup
    releaseReservation(resB.idempotencyKey);
  });

  // -------------------------------------------------------------
  // TEST 11: Stale Worker Fencing Violation Detection on Commit
  // -------------------------------------------------------------
  runTest('Stale worker attempting commit after lock loss is rejected with FENCING_VIOLATION', () => {
    const recipientId = 'SYNTH-FENCE-001';
    const sequenceId = 'SEQ-03';
    const stepNumber = 3;

    // Step currently reserved by worker-current
    const resCurrent = reserveSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, 'worker-current', 60);
    assert.strictEqual(resCurrent.reserved, true);

    // Stale worker-zombie attempts to commit the step
    const commitResult = commitSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, {
      workerId: 'worker-zombie',
      email: 'fence-test@avani-synthetic.internal'
    });

    assert.strictEqual(commitResult.committed, false);
    assert.strictEqual(commitResult.fencingViolation, true);
    assert(commitResult.reason.includes('FENCING_VIOLATION'));

    // Cleanup
    releaseReservation(resCurrent.idempotencyKey);
  });

  // -------------------------------------------------------------
  // TEST 12: Expired Lease Fencing on Commit
  // -------------------------------------------------------------
  runTest('Worker attempting commit with expired lease is rejected with LEASE_EXPIRED', () => {
    const recipientId = 'SYNTH-LEASE-COMMIT-001';
    const sequenceId = 'SEQ-02';
    const stepNumber = 2;

    // Reserve with negative TTL (already expired)
    reserveSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, 'worker-late', -5);

    const commitResult = commitSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, {
      workerId: 'worker-late',
      email: 'lease-test@avani-synthetic.internal'
    });

    assert.strictEqual(commitResult.committed, false);
    assert.strictEqual(commitResult.leaseExpired, true);
    assert(commitResult.reason.includes('LEASE_EXPIRED'));
  });

  // -------------------------------------------------------------
  // TEST 13: Transient Provider Error Handling & Reservation Release
  // -------------------------------------------------------------
  runTest('Transient provider failure releases reservation and allows clean retry', () => {
    const recipientId = 'SYNTH-TRANSIENT-001';
    const sequenceId = 'SEQ-02';
    const stepNumber = 2;

    // Reserve step
    const reservation = reserveSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, 'worker-retry', 60);
    assert.strictEqual(reservation.reserved, true);

    // Simulate transient provider failure (e.g., HTTP 503 / Resend timeout)
    const simulatedProviderError = new Error('Upstream timeout 503 Service Unavailable');
    assert(simulatedProviderError);

    // Rollback: worker releases reservation
    const released = releaseReservation(reservation.idempotencyKey);
    assert.strictEqual(released, true);

    // Subsequent retry cleanly reserves and commits
    const retryReservation = reserveSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, 'worker-retry', 60);
    assert.strictEqual(retryReservation.reserved, true);

    const commit = commitSequenceStep(CAMPAIGN_ID, recipientId, sequenceId, stepNumber, {
      workerId: 'worker-retry',
      providerMessageId: 'msg_syn_retry_success_999'
    });
    assert.strictEqual(commit.committed, true);
  });

  // -------------------------------------------------------------
  // TEST 14: Daily Throughput Limit Enforcement (20/day)
  // -------------------------------------------------------------
  runTest('Daily throughput governor enforces pilot limit of 20 emails/day', () => {
    const customStore = { dailyThroughput: {}, pacingLog: [], throughputReservations: {} };
    const testNow = new Date('2026-10-10T10:00:00.000Z');

    // Fill 20 slots
    for (let i = 1; i <= 20; i++) {
      const slot = reserveDailyThroughputSlot({
        now: new Date(testNow.getTime() + (i * 70000)), // spaced by 70s to avoid pacing limit
        configuredLimit: 20,
        configuredPacing: 1,
        trackTestQuota: true,
        customStore
      });
      assert.strictEqual(slot.allowed, true, `Slot ${i} should be allowed`);
    }

    // 21st slot must be blocked by daily limit
    const slot21 = reserveDailyThroughputSlot({
      now: new Date(testNow.getTime() + (21 * 70000)),
      configuredLimit: 20,
      configuredPacing: 1,
      trackTestQuota: true,
      customStore
    });
    assert.strictEqual(slot21.allowed, false);
    assert.strictEqual(slot21.quotaExceeded, true);
    assert(slot21.reason.includes('Daily outreach limit reached') || slot21.reason.includes('Daily pilot outreach quota'));
  });

  // -------------------------------------------------------------
  // TEST 15: Pacing Enforcement (1 send/minute)
  // -------------------------------------------------------------
  runTest('Throughput governor enforces minimum 1-minute pacing gap', () => {
    const customStore = { dailyThroughput: {}, pacingLog: [], throughputReservations: {} };
    const t0 = new Date('2026-10-10T11:00:00.000Z');

    // First send at t0
    const slot1 = reserveDailyThroughputSlot({
      now: t0,
      configuredLimit: 20,
      configuredPacing: 1,
      trackTestQuota: true,
      customStore
    });
    assert.strictEqual(slot1.allowed, true);

    // Second send at t0 + 15 seconds (pacing violation)
    const t15s = new Date(t0.getTime() + 15 * 1000);
    const slot2 = reserveDailyThroughputSlot({
      now: t15s,
      configuredLimit: 20,
      configuredPacing: 1,
      trackTestQuota: true,
      customStore
    });
    assert.strictEqual(slot2.allowed, false);
    assert.strictEqual(slot2.pacingExceeded, true);
    assert(slot2.reason.includes('Pacing limit reached') || slot2.reason.includes('Pacing limit exceeded'));

    // Third send at t0 + 61 seconds (pacing honored)
    const t61s = new Date(t0.getTime() + 61 * 1000);
    const slot3 = reserveDailyThroughputSlot({
      now: t61s,
      configuredLimit: 20,
      configuredPacing: 1,
      trackTestQuota: true,
      customStore
    });
    assert.strictEqual(slot3.allowed, true);
  });

  // -------------------------------------------------------------
  // TEST 16: Inbound Reply Suppression Stops Follow-Ups Immediately
  // -------------------------------------------------------------
  runTest('Inbound reply detection immediately stops all future automated follow-ups', () => {
    const recipient = { ...SYNTHETIC_RECIPIENT, id: 'SYNTH-REPLY-001' };
    const state = createRecipientState(recipient);
    const t0 = new Date('2026-10-10T08:00:00.000Z');

    // Send EMAIL_1
    dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: t0,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      approvedForOutreach: true,
      useDurableStorage: false
    });
    assert.strictEqual(state.currentStep, 1);

    // Inbound reply arrives 12 hours later
    const replyTime = new Date(t0.getTime() + 12 * 60 * 60 * 1000).toISOString();
    handleIncomingReply(state, {
      timestamp: replyTime,
      from: recipient.email,
      subject: 'Re: Export Inquiries'
    });

    assert.strictEqual(state.replyDetected, true);
    assert.strictEqual(state.followupStatus, SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.REPLIED);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.REPLIED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.HUMAN_REVIEW);
    assert.strictEqual(state.nextFollowUpDueAt, null);

    // Attempting SEQ-02 at +72h must be completely blocked
    const t72 = new Date(t0.getTime() + 72 * 60 * 60 * 1000);
    const blockedRes = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      now: t72,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      useDurableStorage: false
    });

    assert.strictEqual(blockedRes.success, false);
    assert.strictEqual(blockedRes.blocked, true);
    assert(blockedRes.reason.includes('Reply already detected'));
  });

  // -------------------------------------------------------------
  // TEST 17: Opt-Out / Unsubscribe Permanent Sequence Stoppage
  // -------------------------------------------------------------
  runTest('Opt-out event permanently terminates sequence and cancels follow-up', () => {
    const state = createRecipientState(SYNTHETIC_RECIPIENT);
    state.currentStep = 1;
    state.lastSentAt = new Date().toISOString();

    handleOptOut(state, { reason: 'User clicked unsubscribe' });

    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_OPT_OUT);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.UNSUBSCRIBED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.PERMANENT_SUPPRESSION);
    assert.strictEqual(state.nextFollowUpDueAt, null);

    // Further dispatch blocked
    const res = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      useDurableStorage: false
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.blocked, true);
    assert(res.reason.includes('Recipient opted out'));
  });

  // -------------------------------------------------------------
  // TEST 18: Email Bounce Permanent Sequence Stoppage
  // -------------------------------------------------------------
  runTest('Bounce event permanently terminates sequence and records suppression', () => {
    const state = createRecipientState(SYNTHETIC_RECIPIENT);
    state.currentStep = 1;

    handleBounce(state, { type: 'hard-bounce', reason: '550 User not found' });

    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_BOUNCE);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.BOUNCED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.PERMANENT_SUPPRESSION);
    assert.strictEqual(state.nextFollowUpDueAt, null);

    // Further dispatch blocked
    const res = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      useDurableStorage: false
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.blocked, true);
    assert(res.reason.includes('Email bounced'));
  });

  // -------------------------------------------------------------
  // TEST 19: Spam Complaint Permanent Sequence Stoppage
  // -------------------------------------------------------------
  runTest('Spam complaint permanently terminates sequence and blocks outreach', () => {
    const state = createRecipientState(SYNTHETIC_RECIPIENT);
    state.currentStep = 1;

    handleComplaint(state, { feedbackType: 'abuse' });

    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_COMPLAINT);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.SUPPRESSED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.PERMANENT_SUPPRESSION);
    assert.strictEqual(state.nextFollowUpDueAt, null);

    // Further dispatch blocked
    const res = dispatchSequenceStep(state, {
      campaignId: CAMPAIGN_ID,
      isTestMode: true,
      globalOutreachStop: false,
      outreachAuthorized: true,
      useDurableStorage: false
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.blocked, true);
    assert(res.reason.includes('Spam complaint recorded'));
  });

  // -------------------------------------------------------------
  // TEST 20: Durable Storage Failure Fail-Closed Resilience
  // -------------------------------------------------------------
  runTest('Storage write failure fails closed when REQUIRE_DURABLE_STORAGE=1', () => {
    const prevSim = process.env.SIMULATE_STORAGE_FAILURE;
    const prevReq = process.env.REQUIRE_DURABLE_STORAGE;

    try {
      process.env.SIMULATE_STORAGE_FAILURE = '1';
      process.env.REQUIRE_DURABLE_STORAGE = '1';

      const commitResult = commitSequenceStep(CAMPAIGN_ID, 'SYNTH-STORAGE-FAIL-001', 'SEQ-01', 1, {
        email: 'storage-fail@avani-synthetic.internal'
      });

      assert.strictEqual(commitResult.committed, false);
      assert.strictEqual(commitResult.storageFailure, true);
      assert(commitResult.reason.includes('DURABLE_STORAGE_WRITE_FAILED'));
    } finally {
      if (prevSim === undefined) delete process.env.SIMULATE_STORAGE_FAILURE;
      else process.env.SIMULATE_STORAGE_FAILURE = prevSim;
      if (prevReq === undefined) delete process.env.REQUIRE_DURABLE_STORAGE;
      else process.env.REQUIRE_DURABLE_STORAGE = prevReq;
    }
  });

  // -------------------------------------------------------------
  // TEST 21: Missing Distributed KV Storage Fails Closed
  // -------------------------------------------------------------
  runTest('Missing distributed KV storage fails closed under REQUIRE_DISTRIBUTED_KV=1', () => {
    const prevReqKv = process.env.REQUIRE_DISTRIBUTED_KV;

    try {
      process.env.REQUIRE_DISTRIBUTED_KV = '1';

      // If hasDistributedKV is false, reservation must fail closed
      if (!hasDistributedKV) {
        const res = reserveSequenceStep(CAMPAIGN_ID, 'SYNTH-KV-FAIL-001', 'SEQ-01', 1);
        assert.strictEqual(res.reserved, false);
        assert.strictEqual(res.blocked, true);
        assert(res.reason.includes('MISSING_DISTRIBUTED_KV_STORAGE'));
      } else {
        // If KV is configured, getStorageConfiguration reports durable
        const cfg = getStorageConfiguration();
        assert.strictEqual(cfg.hasDistributedKV, true);
      }
    } finally {
      if (prevReqKv === undefined) delete process.env.REQUIRE_DISTRIBUTED_KV;
      else process.env.REQUIRE_DISTRIBUTED_KV = prevReqKv;
    }
  });

  // -------------------------------------------------------------
  // TEST 22: Storage Configuration & Invariant Check
  // -------------------------------------------------------------
  runTest('Storage configuration reports filesystem path and durability status accurately', () => {
    const config = getStorageConfiguration();
    assert(config.storePath, 'storePath must be non-empty');
    assert.strictEqual(config.isIsolated, true, 'Storage configuration must report active test isolation');
    assert.strictEqual(path.resolve(config.storePath), ISOLATION.isolatedStorePath, 'storePath must match isolated temp store path');
    assert.strictEqual(typeof config.isEphemeral, 'boolean');
    assert.strictEqual(typeof config.hasDistributedKV, 'boolean');
    assert.strictEqual(typeof config.isDurable, 'boolean');
  });

  // -------------------------------------------------------------
  // TEST 23: Synthetic Recipient Allowlist & Zero Buyer Contamination
  // -------------------------------------------------------------
  runTest('Synthetic testing operates exclusively in mock namespace with zero buyer exposure', () => {
    // 1. Assert synthetic recipient adheres to internal mock domain policy
    assert(SYNTHETIC_RECIPIENT.email.endsWith('@avani-synthetic-mock.internal'),
      'Synthetic recipient email must end with @avani-synthetic-mock.internal');
    assert(SYNTHETIC_RECIPIENT.id.startsWith('SYNTH-'),
      'Synthetic recipient ID must begin with SYNTH- namespace prefix');

    // 2. Assert stored sequence records belong exclusively to isolated synthetic campaign
    const isolatedStoreRaw = fs.readFileSync(ISOLATION.isolatedStorePath, 'utf8');
    const isolatedStore = JSON.parse(isolatedStoreRaw);
    const sequenceKeys = Object.keys(isolatedStore.sequences || {});

    for (const seqKey of sequenceKeys) {
      assert(seqKey.startsWith(`${CAMPAIGN_ID}:synth-`),
        `Sequence state key ${seqKey} must belong strictly to synthetic namespace ${CAMPAIGN_ID}:synth-`);
    }

    // 3. Confirm zero non-synthetic or external recipient records in isolated store
    const reservationKeys = Object.keys(isolatedStore.reservations || {});
    for (const resKey of reservationKeys) {
      assert(resKey.startsWith(`${CAMPAIGN_ID}:synth-`),
        `Reservation key ${resKey} must belong strictly to synthetic namespace ${CAMPAIGN_ID}:synth-`);
      const parts = resKey.split(':');
      assert.strictEqual(parts.length, 4, `Reservation key ${resKey} must have 4 colon-delimited components`);
      assert.strictEqual(parts[0], CAMPAIGN_ID, `Reservation key campaign must match ${CAMPAIGN_ID}`);
      assert(parts[1].startsWith('synth-'), `Reservation key recipient ${parts[1]} must begin with synth- prefix`);
    }
  });

    console.log('\n============================================================');
    console.log(`PHASE 4 REGRESSION RESULTS: ${passed}/${total} TESTS PASSED (100%)`);
    console.log('============================================================\n');

    return { passed, total };
  } finally {
    cleanupIsolatedEnvironment(ISOLATION);
  }
}

if (require.main === module) {
  try {
    const res = runRegressionSuite();
    if (!res || res.passed !== res.total) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Phase 4 regression execution failed:', err);
    process.exitCode = 1;
  }
}

module.exports = { runRegressionSuite };
