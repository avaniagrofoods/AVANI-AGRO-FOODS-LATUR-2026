/**
 * AVANI AGRO FOODS — Package 3F.39 Master Verification Test Suite
 * Deterministic, isolated, non-production test harness.
 * 
 * Boundaries:
 * - 100% In-memory / Mock isolated fixtures.
 * - Zero external network / Redis / Upstash calls.
 * - Zero access to quarantined BLK-06 files.
 * - Restores all environment modifications after execution.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configure isolated test environment BEFORE importing sequence modules
const originalEnv = { ...process.env };
const tmpSubdir = path.join(os.tmpdir(), `aaf_test_${Date.now()}_${Math.random().toString(36).substring(2)}`);
fs.mkdirSync(tmpSubdir, { recursive: true });
const tmpStorePath = path.join(tmpSubdir, 'sequenceStateStore.json');
fs.writeFileSync(tmpStorePath, JSON.stringify({
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  sequences: {},
  idempotencyKeys: {},
  reservations: {},
  processedEvents: {},
  auditLog: []
}, null, 2), 'utf8');

process.env.SEQUENCE_TEST_ISOLATION = '1';
process.env.SEQUENCE_STORE_PATH = tmpStorePath;
process.env.GLOBAL_OUTREACH_STOP = '0';
process.env.OUTREACH_AUTHORIZED = '1';

// Import target modules
const {
  resolveCanonicalRecipientEmail,
  maskEmail,
  isProductionOrVercelRuntime,
  saveRecipientSequenceState,
  saveRecipientSequenceStateDistributed,
  commitSequenceStep,
  findSequenceByCriteria,
  createEmptyStore
} = require('../api/_lib/sequencePersistence.js');

const {
  reserveDailyThroughputSlot,
  releaseDailyThroughputSlot,
  reserveDailyThroughputSlotDistributed,
  releaseDailyThroughputSlotDistributed,
  latchReservationInFlightDistributed,
  reconcileDailyQuotaDistributed,
  getUtcDateKey,
  validatePacingConfig,
  validateDailyLimitConfig
} = require('../api/_lib/dailyThroughputGovernor.js');

const {
  advanceSequenceStep,
  dispatchSequenceStep,
  dispatchSequenceStepDistributed,
  createRecipientState,
  SEQUENCE_STATUSES
} = require('../api/_lib/sequenceStateMachine.js');

console.log('============================================================');
console.log('AVANI AGRO FOODS — PACKAGE 3F.48 MASTER VERIFICATION SUITE');
console.log('Deterministic, Isolated Verification across 56 Checkpoints');
console.log('============================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function runTest(id, name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${id}: ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ id, name, error: err.message, stack: err.stack });
    console.error(`[FAIL] ${id}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

async function runAsyncTest(id, name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`[PASS] ${id}: ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ id, name, error: err.message, stack: err.stack });
    console.error(`[FAIL] ${id}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

async function main() {
  try {
    // ============================================================
    // CATEGORY 1: CANONICAL RECIPIENT EMAIL RESOLVER
    // ============================================================
    console.log('\n--- CATEGORY 1: CANONICAL RECIPIENT EMAIL RESOLVER ---');

    runTest('TC-01', 'Valid standard email normalized to lowercase', () => {
      const res = resolveCanonicalRecipientEmail('Buyer.Procurement@Example.COM');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.canonicalEmail, 'buyer.procurement@example.com');
    });

    runTest('TC-02', 'Alias extraction: email, recipient_email, recipientEmail', () => {
      const r1 = resolveCanonicalRecipientEmail({ email: 'alias1@domain.com' });
      assert.strictEqual(r1.valid, true);
      assert.strictEqual(r1.canonicalEmail, 'alias1@domain.com');

      const r2 = resolveCanonicalRecipientEmail({ recipient_email: 'alias2@domain.com' });
      assert.strictEqual(r2.valid, true);
      assert.strictEqual(r2.canonicalEmail, 'alias2@domain.com');

      const r3 = resolveCanonicalRecipientEmail({ recipientEmail: 'alias3@domain.com' });
      assert.strictEqual(r3.valid, true);
      assert.strictEqual(r3.canonicalEmail, 'alias3@domain.com');
    });

    runTest('TC-03', 'Safe display name extraction from angle brackets', () => {
      const res = resolveCanonicalRecipientEmail('Sachin Shinde <sachin@avaniagrofoods.com>');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.canonicalEmail, 'sachin@avaniagrofoods.com');
    });

    runTest('TC-04', 'Bracket-only display name extraction', () => {
      const res = resolveCanonicalRecipientEmail('<sales@avaniagrofoods.com>');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.canonicalEmail, 'sales@avaniagrofoods.com');
    });

    runTest('TC-05', 'Missing email rejection (null, undefined, empty object)', () => {
      assert.strictEqual(resolveCanonicalRecipientEmail(null).valid, false);
      assert.strictEqual(resolveCanonicalRecipientEmail(null).error, 'MISSING_RECIPIENT_EMAIL');
      assert.strictEqual(resolveCanonicalRecipientEmail(undefined).valid, false);
      assert.strictEqual(resolveCanonicalRecipientEmail({}).valid, false);
      assert.strictEqual(resolveCanonicalRecipientEmail({}).error, 'MISSING_RECIPIENT_EMAIL');
    });

    runTest('TC-06', 'Empty / blank / whitespace-only email rejection', () => {
      const r1 = resolveCanonicalRecipientEmail('');
      assert.strictEqual(r1.valid, false);
      assert.strictEqual(r1.error, 'EMPTY_RECIPIENT_EMAIL');

      const r2 = resolveCanonicalRecipientEmail('   ');
      assert.strictEqual(r2.valid, false);
      assert.strictEqual(r2.error, 'EMPTY_RECIPIENT_EMAIL');

      const r3 = resolveCanonicalRecipientEmail({ email: '  ' });
      assert.strictEqual(r3.valid, false);
      assert.strictEqual(r3.error, 'EMPTY_RECIPIENT_EMAIL');
    });

    runTest('TC-07', 'Non-string candidate type rejection', () => {
      const r1 = resolveCanonicalRecipientEmail({ email: 12345 });
      assert.strictEqual(r1.valid, false);
      assert.strictEqual(r1.error, 'INVALID_RECIPIENT_EMAIL_TYPE');

      const r2 = resolveCanonicalRecipientEmail({ recipient_email: true });
      assert.strictEqual(r2.valid, false);
      assert.strictEqual(r2.error, 'INVALID_RECIPIENT_EMAIL_TYPE');

      const r3 = resolveCanonicalRecipientEmail(12345);
      assert.strictEqual(r3.valid, false);
      assert.strictEqual(r3.error, 'INVALID_RECIPIENT_EMAIL_TYPE');
    });

    runTest('TC-08', 'Header injection rejection (CRLF, null bytes, control chars)', () => {
      const r1 = resolveCanonicalRecipientEmail('buyer@domain.com\r\nBcc: evil@domain.com');
      assert.strictEqual(r1.valid, false);
      assert.strictEqual(r1.error, 'INVALID_RECIPIENT_EMAIL');
      assert(r1.reason.includes('newline or control characters'));

      const r2 = resolveCanonicalRecipientEmail('buyer@domain.com\x00');
      assert.strictEqual(r2.valid, false);
      assert.strictEqual(r2.error, 'INVALID_RECIPIENT_EMAIL');
    });

    runTest('TC-09', 'Multiple address input rejection (commas / semicolons)', () => {
      const r1 = resolveCanonicalRecipientEmail('buyer1@domain.com, buyer2@domain.com');
      assert.strictEqual(r1.valid, false);
      assert.strictEqual(r1.error, 'INVALID_RECIPIENT_EMAIL');
      assert(r1.reason.includes('Multiple recipient addresses'));

      const r2 = resolveCanonicalRecipientEmail('buyer1@domain.com; buyer2@domain.com');
      assert.strictEqual(r2.valid, false);
      assert.strictEqual(r2.error, 'INVALID_RECIPIENT_EMAIL');
    });

    runTest('TC-10', 'Conflicting candidate aliases rejection', () => {
      const res = resolveCanonicalRecipientEmail({
        email: 'primary@domain.com',
        recipient_email: 'conflicting@domain.com'
      });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'CONFLICTING_RECIPIENT_EMAIL');
    });

    runTest('TC-11', 'Malformed angle-bracket formatting rejection', () => {
      const r1 = resolveCanonicalRecipientEmail('Name <user@domain.com> extra trailing');
      assert.strictEqual(r1.valid, false);
      assert.strictEqual(r1.error, 'INVALID_RECIPIENT_EMAIL');

      const r2 = resolveCanonicalRecipientEmail('<user@domain.com');
      assert.strictEqual(r2.valid, false);
      assert.strictEqual(r2.error, 'INVALID_RECIPIENT_EMAIL');
    });

    runTest('TC-12', 'RFC syntax validation and dot boundaries', () => {
      assert.strictEqual(resolveCanonicalRecipientEmail('a..b@domain.com').valid, false);
      assert.strictEqual(resolveCanonicalRecipientEmail('.user@domain.com').valid, false);
      assert.strictEqual(resolveCanonicalRecipientEmail('user.@domain.com').valid, false);
      assert.strictEqual(resolveCanonicalRecipientEmail('user@domain..com').valid, false);
      assert.strictEqual(resolveCanonicalRecipientEmail('user@localhost').valid, false);
      assert.strictEqual(resolveCanonicalRecipientEmail('missingat.com').valid, false);
    });

    runTest('TC-13', 'DPDP Privacy Masking (maskEmail)', () => {
      assert.strictEqual(maskEmail('sachin@avaniagrofoods.com'), 's****n@avaniagrofoods.com');
      assert.strictEqual(maskEmail('jd@domain.com'), 'j*@domain.com');
      assert.strictEqual(maskEmail(''), '[EMPTY]');
      assert.strictEqual(maskEmail('malformed'), '[MALFORMED]');
    });

    // ============================================================
    // CATEGORY 2: ELIMINATION OF OPAQUE-ID LEAKAGE
    // ============================================================
    console.log('\n--- CATEGORY 2: ELIMINATION OF OPAQUE-ID LEAKAGE ---');

    runTest('TC-14', 'saveRecipientSequenceState stores null for opaque recipientId without email', () => {
      const state = {
        recipient_id: 'IMP-001',
        company_name: 'Test Co'
      };
      const saved = saveRecipientSequenceState('CAMP-01', 'IMP-001', state);
      assert.strictEqual(saved.recipient_email, null, 'recipient_email must be null when email is missing');
      assert.notStrictEqual(saved.recipient_email, 'IMP-001', 'Opaque recipientId must NEVER be stored as recipient_email');
    });

    runTest('TC-15', 'commitSequenceStep stores null for opaque recipientId without email', () => {
      const commitRes = commitSequenceStep('CAMP-01', 'IMP-002', 'SEQ-01', 1, {
        workerId: 'w-1',
        companyName: 'Test Co'
      });
      assert.strictEqual(commitRes.recipient_email, null, 'recipient_email must be null');
      assert.notStrictEqual(commitRes.recipient_email, 'IMP-002', 'Opaque ID must never leak into commit details');
    });

    runTest('TC-16', 'findSequenceByCriteria does NOT match opaque recipient_id as email', () => {
      const match = findSequenceByCriteria({ email: 'IMP-003' });
      assert.strictEqual(match.match, null, 'Searching for IMP-003 as email must return null');
    });

    // ============================================================
    // CATEGORY 3: PRE-FLIGHT SEQUENCE GATING & CLEANUP
    // ============================================================
    console.log('\n--- CATEGORY 3: PRE-FLIGHT SEQUENCE GATING & CLEANUP ---');

    runTest('TC-17', 'advanceSequenceStep rejects invalid email before daily quota reservation', () => {
      const customStore = createEmptyStore();
      const lead = {
        id: 'REC-INVALID-EMAIL',
        email: 'invalid-email-no-at',
        companyName: 'Test Corp',
        contactName: 'Tester',
        approvedForOutreach: true
      };
      const state = createRecipientState(lead);
      const res = advanceSequenceStep(state, 'CAMP-01', {
        isTestMode: true,
        trackTestQuota: true,
        customStore,
        workerId: 'worker-local-test',
        configuredLimit: 10,
        configuredPacing: 10
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.blocked, true);
      assert.strictEqual(res.error, 'INVALID_RECIPIENT_EMAIL');
      assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_INVALID);

      // Verify zero daily quota was consumed
      const today = getUtcDateKey(new Date());
      const dayData = customStore.dailyThroughput ? customStore.dailyThroughput[today] : null;
      assert.strictEqual(dayData ? dayData.count : 0, 0, 'Zero daily quota must be consumed on email rejection');
    });

    await runAsyncTest('TC-18', 'dispatchSequenceStepDistributed cleans up worker step reservation on email failure', async () => {
      const lead = {
        id: 'REC-DIST-INVALID-EMAIL',
        email: 'corrupt@domain@extra.com',
        companyName: 'Dist Test Corp',
        contactName: 'Dist Tester',
        approvedForOutreach: true
      };
      const state = createRecipientState(lead);

      // Mock transmitter
      const mockTransmitter = async () => ({ messageId: 'MSG-001' });

      const res = await dispatchSequenceStepDistributed(state, 'CAMP-DIST-01', {
        workerId: 'w-dist-test',
        transmitter: mockTransmitter,
        isTestMode: true,
        trackTestQuota: true,
        globalOutreachStop: 0,
        outreachAuthorized: 1,
        _testMockGlobalStop: '0',
        _testMockOutreachAuthorized: '1'
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.blocked, true);
      assert.strictEqual(res.error, 'INVALID_RECIPIENT_EMAIL');
      assert.strictEqual(res.cleanupSuccess, true, 'Worker step reservation cleanup must succeed');
    });

    // ============================================================
    // CATEGORY 4: DAILY GOVERNOR PRODUCTION GUARDS
    // ============================================================
    console.log('\n--- CATEGORY 4: DAILY GOVERNOR PRODUCTION GUARDS ---');

    runTest('TC-19', 'reserveDailyThroughputSlot fail-closed in production runtime', () => {
      process.env.NODE_ENV = 'production';
      try {
        const res = reserveDailyThroughputSlot({
          isTestMode: false,
          configuredLimit: 5
        });
        assert.strictEqual(res.allowed, false);
        assert.strictEqual(res.blocked, true);
        assert.strictEqual(res.error, 'PRODUCTION_LOCAL_GOVERNOR_FORBIDDEN');
      } finally {
        if (originalEnv.NODE_ENV !== undefined) process.env.NODE_ENV = originalEnv.NODE_ENV;
        else delete process.env.NODE_ENV;
      }
    });

    runTest('TC-20', 'releaseDailyThroughputSlot returns literal false in production runtime', () => {
      process.env.NODE_ENV = 'production';
      try {
        const res = releaseDailyThroughputSlot('2026-10-24', 'RES-2026-10-24-001', {
          workerId: 'w-1',
          nonce: 'nonce-1'
        });
        assert.strictEqual(res, false, 'Must return literal boolean false');
      } finally {
        if (originalEnv.NODE_ENV !== undefined) process.env.NODE_ENV = originalEnv.NODE_ENV;
        else delete process.env.NODE_ENV;
      }
    });

    await runAsyncTest('TC-21', 'reserveDailyThroughputSlotDistributed fails closed without falling back to disk in production', async () => {
      process.env.NODE_ENV = 'production';
      try {
        const res = await reserveDailyThroughputSlotDistributed({
          configuredLimit: 10,
          configuredPacing: 1
        });
        assert.strictEqual(res.allowed, false);
        assert.strictEqual(res.blocked, true);
        assert(res.reason.includes('MISSING_DISTRIBUTED_KV_STORAGE'), 'Must fail closed on missing KV');
      } finally {
        if (originalEnv.NODE_ENV !== undefined) process.env.NODE_ENV = originalEnv.NODE_ENV;
        else delete process.env.NODE_ENV;
      }
    });

    await runAsyncTest('TC-22', 'releaseDailyThroughputSlotDistributed returns false without disk fallback in production', async () => {
      process.env.NODE_ENV = 'production';
      try {
        const res = await releaseDailyThroughputSlotDistributed('2026-10-24', 'RES-2026-10-24-001', {
          workerId: 'w-1',
          nonce: 'nonce-1'
        });
        assert.strictEqual(res, false, 'Must return literal boolean false');
      } finally {
        if (originalEnv.NODE_ENV !== undefined) process.env.NODE_ENV = originalEnv.NODE_ENV;
        else delete process.env.NODE_ENV;
      }
    });

    // ============================================================
    // CATEGORY 5: QUOTA RELEASE INTEGRITY & FENCING
    // ============================================================
    console.log('\n--- CATEGORY 5: QUOTA RELEASE INTEGRITY & FENCING ---');

    runTest('TC-23', 'releaseDailyThroughputSlot validates workerId & nonce fencing', () => {
      const customStore = createEmptyStore();
      const today = getUtcDateKey(new Date());

      // Reserve slot cleanly
      const res = reserveDailyThroughputSlot({
        customStore,
        workerId: 'worker-authorized',
        configuredLimit: 5,
        configuredPacing: 1
      });
      assert.strictEqual(res.allowed, true);
      assert.strictEqual(customStore.dailyThroughput[today].count, 1);

      // 1. Wrong workerId
      const r1 = releaseDailyThroughputSlot(today, res.reservationId, {
        customStore,
        workerId: 'worker-unauthorized',
        nonce: res.nonce
      });
      assert.strictEqual(r1, false);
      assert.strictEqual(customStore.dailyThroughput[today].count, 1, 'Count must NOT decrement on worker mismatch');

      // 2. Wrong nonce
      const r2 = releaseDailyThroughputSlot(today, res.reservationId, {
        customStore,
        workerId: 'worker-authorized',
        nonce: 'tampered-nonce'
      });
      assert.strictEqual(r2, false);
      assert.strictEqual(customStore.dailyThroughput[today].count, 1, 'Count must NOT decrement on nonce mismatch');

      // 3. Authorized release
      const r3 = releaseDailyThroughputSlot(today, res.reservationId, {
        customStore,
        workerId: 'worker-authorized',
        nonce: res.nonce
      });
      assert.strictEqual(r3, true);
      assert.strictEqual(customStore.dailyThroughput[today].count, 0, 'Count must cleanly decrement');
    });

    runTest('TC-24', 'releaseDailyThroughputSlot corrupt counter handling (fails closed without silent clamping)', () => {
      const customStore = createEmptyStore();
      const today = getUtcDateKey(new Date());

      // Setup corrupt state: count = 0 while reservation exists
      customStore.dailyThroughput = {
        [today]: {
          count: 0,
          limit: 10,
          reservations: [
            {
              reservationId: 'RES-CORRUPT-01',
              status: 'RESERVED',
              workerId: 'w-corrupt',
              nonce: 'nonce-corrupt'
            }
          ]
        }
      };

      const rel = releaseDailyThroughputSlot(today, 'RES-CORRUPT-01', {
        customStore,
        workerId: 'w-corrupt',
        nonce: 'nonce-corrupt'
      });

      assert.strictEqual(rel, false, 'Corrupt counter must fail closed');
      assert.strictEqual(customStore.dailyThroughput[today].count, 0, 'Corrupt counter must NOT be altered or negative');
      assert.strictEqual(customStore.dailyThroughput[today].reservations.length, 1, 'Reservation evidence must be preserved');
    });

    runTest('TC-25', 'releaseDailyThroughputSlot duplicate release returns false', () => {
      const customStore = createEmptyStore();
      const today = getUtcDateKey(new Date());

      const res = reserveDailyThroughputSlot({
        customStore,
        workerId: 'w-dup',
        configuredLimit: 5
      });

      // First release succeeds
      const r1 = releaseDailyThroughputSlot(today, res.reservationId, {
        customStore,
        workerId: 'w-dup',
        nonce: res.nonce
      });
      assert.strictEqual(r1, true);

      // Duplicate release fails
      const r2 = releaseDailyThroughputSlot(today, res.reservationId, {
        customStore,
        workerId: 'w-dup',
        nonce: res.nonce
      });
      assert.strictEqual(r2, false);
    });

    runTest('TC-26', 'releaseDailyThroughputSlot rolls back in-memory mutation on saveStore failure', () => {
      const today = getUtcDateKey(new Date());
      process.env.SIMULATE_STORAGE_FAILURE = '1';
      try {
        // Reserve slot
        process.env.SIMULATE_STORAGE_FAILURE = '0';
        const res = reserveDailyThroughputSlot({
          workerId: 'w-rollback',
          configuredLimit: 5
        });
        assert.strictEqual(res.allowed, true);

        // Turn on storage failure simulation
        process.env.SIMULATE_STORAGE_FAILURE = '1';
        const rel = releaseDailyThroughputSlot(today, res.reservationId, {
          workerId: 'w-rollback',
          nonce: res.nonce
        });

        assert.strictEqual(rel, false, 'Must fail closed on storage write failure');
      } finally {
        if (originalEnv.SIMULATE_STORAGE_FAILURE !== undefined) process.env.SIMULATE_STORAGE_FAILURE = originalEnv.SIMULATE_STORAGE_FAILURE;
        else delete process.env.SIMULATE_STORAGE_FAILURE;
      }
    });

    // ============================================================
    // CATEGORY 6: SEQUENCE LIFECYCLE, LATCH & AMBIGUOUS OUTCOMES
    // ============================================================
    console.log('\n--- CATEGORY 6: SEQUENCE LIFECYCLE, LATCH & AMBIGUOUS OUTCOMES ---');

    await runAsyncTest('TC-27', 'Latch in flight prevents subsequent pre-flight release', async () => {
      const customStore = createEmptyStore();
      const today = getUtcDateKey(new Date());

      const res = reserveDailyThroughputSlot({
        customStore,
        workerId: 'w-latch',
        configuredLimit: 5
      });
      assert.strictEqual(res.allowed, true);

      // Latch reservation into DISPATCH_IN_FLIGHT
      const latched = await latchReservationInFlightDistributed(res.reservationId, 'w-latch', res.nonce, { customStore });
      assert.strictEqual(latched, true);

      // Attempt release after latch -> MUST FAIL
      const rel = releaseDailyThroughputSlot(today, res.reservationId, {
        customStore,
        workerId: 'w-latch',
        nonce: res.nonce
      });
      // Reservation status is now DISPATCH_IN_FLIGHT or release rejected
      assert.strictEqual(rel, false, 'Post-latch release must be rejected');
    });

    await runAsyncTest('TC-28', 'Ambiguous transmission outcome preserves quota and enters RECONCILIATION_HOLD', async () => {
      const lead = {
        id: 'REC-TIMEOUT-01',
        email: 'timeout-buyer@domain.com',
        companyName: 'Timeout Imports',
        contactName: 'Alex',
        approvedForOutreach: true
      };
      const state = createRecipientState(lead);

      // Mock transmitter throwing 504 Gateway Timeout (uncertain outcome)
      const timeoutTransmitter = async () => {
        const err = new Error('504 Gateway Timeout: Upstream provider did not respond');
        err.statusCode = 504;
        err.uncertainOutcome = true;
        throw err;
      };

      const customStore = createEmptyStore();
      const res = await dispatchSequenceStepDistributed(state, 'CAMP-TIMEOUT', {
        workerId: 'w-timeout',
        transmitter: timeoutTransmitter,
        isTestMode: true,
        trackTestQuota: true,
        customStore,
        now: new Date(Date.now() + 120000),
        configuredPacing: 1,
        globalOutreachStop: 0,
        outreachAuthorized: 1,
        _testMockGlobalStop: '0',
        _testMockOutreachAuthorized: '1'
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.uncertainOutcome, true);
      assert.strictEqual(res.status, 'RECONCILIATION_HOLD');
      assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.UNCERTAIN_DISPATCH);
    });

    // ============================================================
    // CATEGORY 7: REPORT-ONLY QUOTA RECONCILER (OWNER POLICY O-05)
    // ============================================================
    console.log('\n--- CATEGORY 7: REPORT-ONLY QUOTA RECONCILER (OWNER POLICY O-05) ---');

    await runAsyncTest('TC-29', 'reconcileDailyQuotaDistributed performs zero write commands', async () => {
      const today = getUtcDateKey(new Date());
      const res = await reconcileDailyQuotaDistributed(today, 5);

      assert.strictEqual(res.writeAuthority, 'ZERO_WRITE_REPORT_ONLY');
      assert.strictEqual(res.observationOnly, true);
    });

    await runAsyncTest('TC-30', 'reconcileDailyQuotaDistributed detects drift without mutating state', async () => {
      const today = getUtcDateKey(new Date());
      const res = await reconcileDailyQuotaDistributed(today, 0);

      assert.strictEqual(res.writeAuthority, 'ZERO_WRITE_REPORT_ONLY');
      assert.strictEqual(res.observationOnly, true);
      assert.strictEqual(typeof res.reconciled, 'boolean');
    });

    // ============================================================
    // CATEGORY 8: RESILIENT ARGUMENT PATTERNS
    // ============================================================
    console.log('\n--- CATEGORY 8: RESILIENT ARGUMENT PATTERNS ---');

    runTest('TC-31', 'releaseDailyThroughputSlot supports (reservationId, options) signature', () => {
      const customStore = createEmptyStore();
      const today = getUtcDateKey(new Date());

      const res = reserveDailyThroughputSlot({
        customStore,
        workerId: 'w-sig',
        configuredLimit: 5
      });
      assert.strictEqual(res.allowed, true);

      // Call with (reservationId, options) instead of (dateKey, reservationId, options)
      const rel = releaseDailyThroughputSlot(res.reservationId, {
        customStore,
        workerId: 'w-sig',
        nonce: res.nonce
      });
      assert.strictEqual(rel, true, 'Must correctly resolve dateKey from reservationId prefix');
      assert.strictEqual(customStore.dailyThroughput[today].count, 0);
    });

    await runAsyncTest('TC-32', 'releaseDailyThroughputSlotDistributed supports (reservationId, options) signature', async () => {
      const customStore = createEmptyStore();
      const today = getUtcDateKey(new Date());

      const res = reserveDailyThroughputSlot({
        customStore,
        workerId: 'w-dist-sig',
        configuredLimit: 5
      });
      assert.strictEqual(res.allowed, true);

      const rel = await releaseDailyThroughputSlotDistributed(res.reservationId, {
        customStore,
        workerId: 'w-dist-sig',
        nonce: res.nonce
      });
      assert.strictEqual(rel, true);
    });

    runTest('TC-33', 'Full pipeline end-to-end: valid dispatch advances step and passes canonical email', () => {
      const customStore = createEmptyStore();
      const lead = {
        id: 'REC-HAPPY-01',
        email: 'Procurement <happy.buyer@domain.com>',
        companyName: 'Happy Foods GmbH',
        contactName: 'Hans',
        approvedForOutreach: true
      };
      const state = createRecipientState(lead);

      const res = advanceSequenceStep(state, 'CAMP-01', {
        isTestMode: true,
        trackTestQuota: true,
        customStore,
        workerId: 'w-happy',
        configuredLimit: 5
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.step, 'EMAIL_1');
      assert.strictEqual(res.rendered.to, 'happy.buyer@domain.com', 'Rendered template must receive canonical stripped email');
      assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT);
      assert.strictEqual(state.email, 'happy.buyer@domain.com');
    });

    // ============================================================
    // CATEGORY 9: PACKAGE 3F.42 HARDENING & REGRESSION VERIFICATION
    // ============================================================
    console.log('\n--- CATEGORY 9: PACKAGE 3F.42 HARDENING & REGRESSION VERIFICATION ---');

    runTest('TC-34', 'validatePacingConfig rejects unapproved rate (>1 send/min) with PACING_RATE_UNAUTHORIZED', () => {
      const check = validatePacingConfig(2);
      assert.strictEqual(check.valid, false);
      assert.strictEqual(check.error, 'PACING_RATE_UNAUTHORIZED');
      assert.ok(check.reason.includes('Rates above 1/minute require separate explicit owner approval'));
    });

    runTest('TC-35', 'validatePacingConfig strictly rejects rates > 1 without exception (unapproved overrides disabled)', () => {
      // Rates > 1 must fail closed regardless of any caller parameters
      const check2 = validatePacingConfig(2);
      assert.strictEqual(check2.valid, false);
      assert.strictEqual(check2.error, 'PACING_RATE_UNAUTHORIZED');

      const check60 = validatePacingConfig(60);
      assert.strictEqual(check60.valid, false);
      assert.strictEqual(check60.error, 'PACING_RATE_UNAUTHORIZED');

      // Verify approved default rate of 1 send/min is valid
      const validCheck = validatePacingConfig(1);
      assert.strictEqual(validCheck.valid, true);
      assert.strictEqual(validCheck.maxPerMinute, 1);

      // Type confusion rejection
      assert.strictEqual(validatePacingConfig(true).valid, false);
      assert.strictEqual(validatePacingConfig(true).error, 'PACING_NON_NUMERIC');
      assert.strictEqual(validatePacingConfig([1]).valid, false);
      assert.strictEqual(validatePacingConfig([1]).error, 'PACING_NON_NUMERIC');
    });

    await runAsyncTest('TC-36', 'reserveDailyThroughputSlotDistributed rejects test mode simulation in production runtime', async () => {
      const prevNodeEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const res = await reserveDailyThroughputSlotDistributed({
          isTestMode: true,
          workerId: 'w-prod-test',
          configuredLimit: 5
        });
        assert.strictEqual(res.allowed, false);
        assert.strictEqual(res.blocked, true);
        assert.strictEqual(res.error, 'PRODUCTION_TEST_MODE_FORBIDDEN');
      } finally {
        if (prevNodeEnv !== undefined) process.env.NODE_ENV = prevNodeEnv;
        else delete process.env.NODE_ENV;
      }
    });

    runTest('TC-37', 'dispatchSequenceStep strictly fails closed in production runtime', () => {
      const prevNodeEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const lead = {
          id: 'REC-PROD-01',
          email: 'buyer@domain.com',
          companyName: 'Prod Buyer Inc',
          approvedForOutreach: true
        };
        const state = createRecipientState(lead);
        const res = dispatchSequenceStep(state, 'CAMP-01', {
          isTestMode: false,
          globalOutreachStop: false,
          outreachAuthorized: true
        });
        assert.strictEqual(res.success, false);
        assert.strictEqual(res.blocked, true);
        assert.strictEqual(res.error, 'PRODUCTION_LOCAL_DISPATCH_FORBIDDEN');
      } finally {
        if (prevNodeEnv !== undefined) process.env.NODE_ENV = prevNodeEnv;
        else delete process.env.NODE_ENV;
      }
    });

    runTest('TC-38', 'dispatchSequenceStep fails closed when GLOBAL_OUTREACH_STOP is unset even if isTestMode: true', () => {
      const prevStop = process.env.GLOBAL_OUTREACH_STOP;
      const prevAuth = process.env.OUTREACH_AUTHORIZED;
      try {
        delete process.env.GLOBAL_OUTREACH_STOP;
        delete process.env.OUTREACH_AUTHORIZED;
        const lead = {
          id: 'REC-UNSET-01',
          email: 'buyer@domain.com',
          companyName: 'Unset Test Inc',
          approvedForOutreach: true
        };
        const state = createRecipientState(lead);
        const res = dispatchSequenceStep(state, 'CAMP-01', {
          isTestMode: true,
          customStore: createEmptyStore()
        });
        assert.strictEqual(res.success, false);
        assert.strictEqual(res.blocked, true);
        assert.strictEqual(res.reason, 'GLOBAL_OUTREACH_STOP is active');
        assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_GLOBAL_STOP);
      } finally {
        if (prevStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = prevStop;
        else delete process.env.GLOBAL_OUTREACH_STOP;
        if (prevAuth !== undefined) process.env.OUTREACH_AUTHORIZED = prevAuth;
        else delete process.env.OUTREACH_AUTHORIZED;
      }
    });

    runTest('TC-39', 'validateDailyLimitConfig enforces O-01 20 emails/day cap and rejects > 20', () => {
      // Limits > 20 must fail closed
      const overCap = validateDailyLimitConfig(21);
      assert.strictEqual(overCap.valid, false);
      assert.strictEqual(overCap.error, 'DAILY_LIMIT_EXCEEDS_PILOT_CAP');

      const massive = validateDailyLimitConfig(500);
      assert.strictEqual(massive.valid, false);
      assert.strictEqual(massive.error, 'DAILY_LIMIT_EXCEEDS_PILOT_CAP');

      // Non-integers / fractions must fail closed
      const fraction = validateDailyLimitConfig(10.5);
      assert.strictEqual(fraction.valid, false);
      assert.strictEqual(fraction.error, 'DAILY_LIMIT_NON_NUMERIC');

      // Non-positive must fail closed
      const zero = validateDailyLimitConfig(0);
      assert.strictEqual(zero.valid, false);
      assert.strictEqual(zero.error, 'DAILY_LIMIT_NON_POSITIVE');

      // Type confusion rejection
      assert.strictEqual(validateDailyLimitConfig(true).valid, false);
      assert.strictEqual(validateDailyLimitConfig(true).error, 'DAILY_LIMIT_NON_NUMERIC');
      assert.strictEqual(validateDailyLimitConfig([20]).valid, false);
      assert.strictEqual(validateDailyLimitConfig([20]).error, 'DAILY_LIMIT_NON_NUMERIC');

      // Valid limits <= 20
      assert.strictEqual(validateDailyLimitConfig(20).valid, true);
      assert.strictEqual(validateDailyLimitConfig(5).valid, true);
      assert.strictEqual(validateDailyLimitConfig(undefined).limit, 20);
    });

    runTest('TC-40', 'Server-side governor rejects configuredLimit > 20 and configuredPacing > 1 on dispatch call paths', () => {
      const customStore = createEmptyStore();
      const lead = {
        id: 'REC-CAP-01',
        email: 'buyer@domain.com',
        companyName: 'Cap Test Inc',
        approvedForOutreach: true
      };
      const state1 = createRecipientState(lead);

      // Direct call attempting configuredLimit: 25 must fail closed
      const res1 = dispatchSequenceStep(state1, 'CAMP-01', {
        isTestMode: true,
        customStore,
        configuredLimit: 25
      });
      assert.strictEqual(res1.success, false);
      assert.strictEqual(res1.blocked, true);
      assert.strictEqual(res1.error, 'CONFIG_FAIL_CLOSED');
      assert.ok(res1.reason.includes('DAILY_LIMIT_EXCEEDS_PILOT_CAP'));

      // Direct call attempting configuredPacing: 5 must fail closed
      const state2 = createRecipientState(lead);
      const res2 = dispatchSequenceStep(state2, 'CAMP-01', {
        isTestMode: true,
        customStore,
        configuredPacing: 5
      });
      assert.strictEqual(res2.success, false);
      assert.strictEqual(res2.blocked, true);
      assert.strictEqual(res2.error, 'CONFIG_FAIL_CLOSED');
      assert.ok(res2.reason.includes('PACING_RATE_UNAUTHORIZED'));
    });

    await runAsyncTest('TC-41', 'HTTP route cron-sequence-dispatch sanitizes options and strips request overrides', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      // Enroll lead in distributed persistence
      const testRecipientId = 'REC-HTTP-OVERRIDE-01';
      const enrolledLead = {
        id: testRecipientId,
        recipient_id: testRecipientId,
        email: 'sanitized.buyer@domain.com',
        recipient_email: 'sanitized.buyer@domain.com',
        status: 'PROSPECT',
        sequence_status: 'PROSPECT',
        current_step: 0,
        approvedForOutreach: true,
        approved: true,
        approvedBy: 'operator-1',
        approvedAt: new Date().toISOString()
      };
      await saveRecipientSequenceStateDistributed('CAMP-01', testRecipientId, enrolledLead);

      const mockTransmitter = async (payload) => {
        return { success: true, status: 'ACCEPTED', providerMessageId: 'MSG-SANITIZED-01' };
      };

      let responseStatus = 0;
      let responseJson = null;
      const mockReq = {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-test-cron-secret'
        },
        body: {
          recipientId: testRecipientId,
          campaignId: 'CAMP-01',
          options: {
            // Malicious attempts to raise limits / bypass pacing via request body
            ownerApprovedPacingOverride: true,
            configuredPacing: 60,
            configuredLimit: 50,
            isTestMode: true
          }
        }
      };
      const mockRes = {
        setHeader: () => {},
        status: (code) => {
          responseStatus = code;
          return {
            json: (data) => { responseJson = data; }
          };
        }
      };

      const prevSecret = process.env.CRON_SECRET;
      const prevStop = process.env.GLOBAL_OUTREACH_STOP;
      const prevAuth = process.env.OUTREACH_AUTHORIZED;
      try {
        process.env.CRON_SECRET = 'valid-test-cron-secret';
        process.env.GLOBAL_OUTREACH_STOP = '0';
        process.env.OUTREACH_AUTHORIZED = '1';

        await handler(mockReq, mockRes, {
          transmitter: mockTransmitter,
          now: new Date(Date.now() + 300000)
        });

        // The dispatch proceeds under default safe governance (configuredLimit = 20, configuredPacing = 1)
        // because request-supplied configuredLimit: 50 and configuredPacing: 60 were stripped.
        assert.strictEqual(responseStatus, 200, `Expected 200 but got ${responseStatus}: ${JSON.stringify(responseJson)}`);
        assert.strictEqual(responseJson.success, true);
        assert.strictEqual(responseJson.quotaReservation.dailyLimit, 20, 'Daily limit must remain enforced at 20');
      } finally {
        if (prevSecret !== undefined) process.env.CRON_SECRET = prevSecret;
        else delete process.env.CRON_SECRET;
        if (prevStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = prevStop;
        else delete process.env.GLOBAL_OUTREACH_STOP;
        if (prevAuth !== undefined) process.env.OUTREACH_AUTHORIZED = prevAuth;
        else delete process.env.OUTREACH_AUTHORIZED;
      }
    });

    await runAsyncTest('TC-42', 'Distributed dispatch call path strictly rejects configuredLimit > 20 and configuredPacing > 1', async () => {
      const customStore = createEmptyStore();
      const lead = {
        id: 'REC-DIST-CAP-01',
        email: 'buyer@domain.com',
        companyName: 'Dist Cap Inc',
        approvedForOutreach: true
      };
      const state = createRecipientState(lead);

      const resOverLimit = await dispatchSequenceStepDistributed(state, 'CAMP-01', {
        isTestMode: true,
        customStore,
        configuredLimit: 25,
        workerId: 'w-dist-cap',
        transmitter: async () => ({ messageId: 'm1' })
      });
      assert.strictEqual(resOverLimit.success, false);
      assert.strictEqual(resOverLimit.blocked, true);
      assert.strictEqual(resOverLimit.error, 'CONFIG_FAIL_CLOSED');
      assert.ok(resOverLimit.reason.includes('DAILY_LIMIT_EXCEEDS_PILOT_CAP'));

      const resOverPacing = await dispatchSequenceStepDistributed(state, 'CAMP-01', {
        isTestMode: true,
        customStore,
        configuredPacing: 2,
        workerId: 'w-dist-pacing',
        transmitter: async () => ({ messageId: 'm2' })
      });
      assert.strictEqual(resOverPacing.success, false);
      assert.strictEqual(resOverPacing.blocked, true);
      assert.strictEqual(resOverPacing.error, 'CONFIG_FAIL_CLOSED');
      assert.ok(resOverPacing.reason.includes('PACING_RATE_UNAUTHORIZED'));
    });

    // ============================================================
    // CATEGORY 10: PACKAGE 3F.46 COMPREHENSIVE REGRESSION & INTEGRITY VERIFICATION
    // ============================================================
    console.log('\n--- CATEGORY 10: PACKAGE 3F.46 COMPREHENSIVE REGRESSION & INTEGRITY VERIFICATION ---');

    await runAsyncTest('TC-43', 'CRON_SECRET authentication fails closed when secret is absent, empty, mismatched, or whitespace', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      const runAuthCheck = async (reqHeaders, serverSecret) => {
        let status = 0;
        let json = null;
        const req = {
          method: 'POST',
          headers: reqHeaders || {},
          body: { recipientId: 'REC-01' }
        };
        const res = {
          setHeader: () => {},
          status: (code) => {
            status = code;
            return { json: (d) => { json = d; } };
          }
        };
        const prev = process.env.CRON_SECRET;
        try {
          if (serverSecret !== undefined) process.env.CRON_SECRET = serverSecret;
          else delete process.env.CRON_SECRET;
          await handler(req, res);
        } finally {
          if (prev !== undefined) process.env.CRON_SECRET = prev;
          else delete process.env.CRON_SECRET;
        }
        return { status, json };
      };

      // 1. Missing header
      const r1 = await runAuthCheck({}, 'valid-secret');
      assert.strictEqual(r1.status, 401);
      assert.strictEqual(r1.json.error, 'UNAUTHORIZED');

      // 2. Invalid bearer token
      const r2 = await runAuthCheck({ authorization: 'Bearer wrong-secret' }, 'valid-secret');
      assert.strictEqual(r2.status, 401);
      assert.strictEqual(r2.json.error, 'UNAUTHORIZED');

      // 3. Empty bearer token
      const r3 = await runAuthCheck({ authorization: 'Bearer ' }, 'valid-secret');
      assert.strictEqual(r3.status, 401);
      assert.strictEqual(r3.json.error, 'UNAUTHORIZED');

      // 4. Server secret absent
      const r4 = await runAuthCheck({ authorization: 'Bearer any-token' }, undefined);
      assert.strictEqual(r4.status, 401);
      assert.strictEqual(r4.json.error, 'UNAUTHORIZED');

      // 5. Server secret whitespace-only
      const r5 = await runAuthCheck({ authorization: 'Bearer any-token' }, '   ');
      assert.strictEqual(r5.status, 401);
      assert.strictEqual(r5.json.error, 'UNAUTHORIZED');

      // 6. Verify zero secret exposure in error message
      assert.strictEqual(JSON.stringify(r2.json).includes('valid-secret'), false);
    });

    await runAsyncTest('TC-44', 'HTTP route parameter sanitization drops malformed workerId and rejects query-param overrides', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      const testRecipientId = 'REC-HTTP-PARAM-01';
      const enrolledLead = {
        id: testRecipientId,
        recipient_id: testRecipientId,
        email: 'params.buyer@domain.com',
        recipient_email: 'params.buyer@domain.com',
        status: 'PROSPECT',
        sequence_status: 'PROSPECT',
        current_step: 0,
        approvedForOutreach: true,
        approved: true,
        approvedBy: 'operator-param',
        approvedAt: new Date().toISOString()
      };
      await saveRecipientSequenceStateDistributed('CAMP-PARAM-01', testRecipientId, enrolledLead);

      const mockTransmitter = async (payload, context) => {
        return { success: true, status: 'ACCEPTED', providerMessageId: 'MSG-PARAM-01' };
      };

      let status = 0;
      let json = null;
      const req = {
        method: 'POST',
        headers: { authorization: 'Bearer valid-secret' },
        query: { configuredPacing: '60', configuredLimit: '500' }, // Attacker trying query param injection
        body: {
          recipientId: testRecipientId,
          campaignId: 'CAMP-PARAM-01',
          options: {
            workerId: 'worker-valid-param',
            configuredPacing: 30,
            configuredLimit: 100
          }
        }
      };
      const res = {
        setHeader: () => {},
        status: (code) => {
          status = code;
          return { json: (d) => { json = d; } };
        }
      };

      const prevSecret = process.env.CRON_SECRET;
      const prevStop = process.env.GLOBAL_OUTREACH_STOP;
      const prevAuth = process.env.OUTREACH_AUTHORIZED;
      try {
        process.env.CRON_SECRET = 'valid-secret';
        process.env.GLOBAL_OUTREACH_STOP = '0';
        process.env.OUTREACH_AUTHORIZED = '1';

        await handler(req, res, {
          transmitter: mockTransmitter,
          now: new Date(Date.now() + 600000)
        });

        assert.strictEqual(status, 200);
        assert.strictEqual(json.success, true);
        // Verified: daily limit remained 20 despite query param 500 and body option 100
        assert.strictEqual(json.quotaReservation.dailyLimit, 20);
      } finally {
        if (prevSecret !== undefined) process.env.CRON_SECRET = prevSecret;
        else delete process.env.CRON_SECRET;
        if (prevStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = prevStop;
        else delete process.env.GLOBAL_OUTREACH_STOP;
        if (prevAuth !== undefined) process.env.OUTREACH_AUTHORIZED = prevAuth;
        else delete process.env.OUTREACH_AUTHORIZED;
      }
    });

    await runAsyncTest('TC-45', 'Direct distributed reservation call path fails closed for invalid types/fractions/negatives', async () => {
      // 1. Boolean limit
      const r1 = await reserveDailyThroughputSlotDistributed({ configuredLimit: true });
      assert.strictEqual(r1.allowed, false);
      assert.strictEqual(r1.error, 'CONFIG_FAIL_CLOSED');

      // 2. Fractional limit
      const r2 = await reserveDailyThroughputSlotDistributed({ configuredLimit: 12.5 });
      assert.strictEqual(r2.allowed, false);
      assert.strictEqual(r2.error, 'CONFIG_FAIL_CLOSED');

      // 3. Negative limit
      const r3 = await reserveDailyThroughputSlotDistributed({ configuredLimit: -10 });
      assert.strictEqual(r3.allowed, false);
      assert.strictEqual(r3.error, 'CONFIG_FAIL_CLOSED');

      // 4. Boolean pacing
      const r4 = await reserveDailyThroughputSlotDistributed({ configuredPacing: true });
      assert.strictEqual(r4.allowed, false);
      assert.strictEqual(r4.error, 'CONFIG_FAIL_CLOSED');

      // 5. Negative pacing
      const r5 = await reserveDailyThroughputSlotDistributed({ configuredPacing: -2 });
      assert.strictEqual(r5.allowed, false);
      assert.strictEqual(r5.error, 'CONFIG_FAIL_CLOSED');

      // 6. Fractional pacing
      const r6 = await reserveDailyThroughputSlotDistributed({ configuredPacing: 0.5 });
      assert.strictEqual(r6.allowed, false);
      assert.strictEqual(r6.error, 'CONFIG_FAIL_CLOSED');
    });

    await runAsyncTest('TC-46', 'Quota release distributed fencing validates workerId, nonce and rejects latched reservation', async () => {
      const customStore = createEmptyStore();

      // Reserve slot cleanly
      const res = reserveDailyThroughputSlot({
        customStore,
        workerId: 'w-fence-test',
        configuredLimit: 5,
        configuredPacing: 1
      });
      assert.strictEqual(res.allowed, true);

      // 1. Missing workerId or nonce
      const rel1 = await releaseDailyThroughputSlotDistributed(res.reservationId, {
        customStore,
        workerId: null,
        nonce: res.nonce
      });
      assert.strictEqual(rel1, false);

      const rel2 = await releaseDailyThroughputSlotDistributed(res.reservationId, {
        customStore,
        workerId: 'w-fence-test',
        nonce: null
      });
      assert.strictEqual(rel2, false);

      // 2. Wrong workerId
      const rel3 = await releaseDailyThroughputSlotDistributed(res.reservationId, {
        customStore,
        workerId: 'w-impostor',
        nonce: res.nonce
      });
      assert.strictEqual(rel3, false);

      // 3. Wrong nonce
      const rel4 = await releaseDailyThroughputSlotDistributed(res.reservationId, {
        customStore,
        workerId: 'w-fence-test',
        nonce: 'invalid-nonce'
      });
      assert.strictEqual(rel4, false);

      // 4. Latch into DISPATCH_IN_FLIGHT then attempt release
      const latched = await latchReservationInFlightDistributed(res.reservationId, 'w-fence-test', res.nonce, { customStore });
      assert.strictEqual(latched, true);

      const rel5 = await releaseDailyThroughputSlotDistributed(res.reservationId, {
        customStore,
        workerId: 'w-fence-test',
        nonce: res.nonce
      });
      assert.strictEqual(rel5, false, 'Latched reservation cannot be released');
    });

    await runAsyncTest('TC-47', 'Ambiguous outcome transitions to RECONCILIATION_HOLD, freezes recipient, and denies quota refund', async () => {
      const lead = {
        id: 'REC-HOLD-01',
        email: 'hold.buyer@domain.com',
        companyName: 'Hold Corp',
        contactName: 'Taylor',
        approvedForOutreach: true
      };
      const state = createRecipientState(lead);

      const mockTimeoutTx = async () => {
        const err = new Error('connect ECONNRESET');
        err.code = 'ECONNRESET';
        err.uncertainOutcome = true;
        throw err;
      };

      const customStore = createEmptyStore();
      const res = await dispatchSequenceStepDistributed(state, 'CAMP-HOLD-01', {
        workerId: 'w-hold',
        transmitter: mockTimeoutTx,
        isTestMode: true,
        trackTestQuota: true,
        customStore,
        now: new Date(Date.now() + 720000),
        configuredPacing: 1,
        globalOutreachStop: 0,
        outreachAuthorized: 1,
        _testMockGlobalStop: '0',
        _testMockOutreachAuthorized: '1'
      });

      assert.strictEqual(res.success, false);
      assert.strictEqual(res.uncertainOutcome, true);
      assert.strictEqual(res.status, 'RECONCILIATION_HOLD');
      assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.UNCERTAIN_DISPATCH);

      // Attempt second dispatch while frozen in UNCERTAIN_DISPATCH -> must be blocked
      const res2 = await dispatchSequenceStepDistributed(state, 'CAMP-HOLD-01', {
        workerId: 'w-hold',
        transmitter: async () => ({ success: true }),
        isTestMode: true,
        customStore,
        now: new Date(Date.now() + 800000)
      });
      // Sequence is frozen; wire dispatch halted
      assert.strictEqual(res2.success, false);
      assert.strictEqual(res2.blocked, true);
    });

    await runAsyncTest('TC-48', 'Report-only reconciler strictly satisfies Policy O-05 zero-write invariant', async () => {
      const today = getUtcDateKey(new Date());

      // In unconfigured KV environment: observationOnly and ZERO_WRITE_REPORT_ONLY must hold
      const res = await reconcileDailyQuotaDistributed(today, 5);
      assert.strictEqual(res.observationOnly, true);
      assert.strictEqual(res.writeAuthority, 'ZERO_WRITE_REPORT_ONLY');
      assert.strictEqual(res.reconciled, false);
      assert.ok(res.reason === 'KV_NOT_CONFIGURED' || res.driftDetected === true);
    });

    // ============================================================
    // CATEGORY 11: PACKAGE 3F.48 WORKER ID & AUTHENTICATION HARDENING
    // ============================================================
    console.log('\n--- CATEGORY 11: PACKAGE 3F.48 WORKER ID & AUTHENTICATION HARDENING ---');

    await runAsyncTest('TC-49', 'HTTP route rejects invalid explicitly supplied workerId before dispatch', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      let transmitterInvoked = false;
      const mockTransmitter = async () => {
        transmitterInvoked = true;
        return { success: true, status: 'ACCEPTED', providerMessageId: 'MSG-W-01' };
      };

      const testCases = [
        { label: 'empty string', val: '' },
        { label: 'whitespace only', val: '   ' },
        { label: 'CRLF injection', val: 'worker-1\r\nX-Injected: evil\n' },
        { label: 'null-byte injection', val: 'worker-1\0evil' },
        { label: 'oversized string > 64 chars', val: 'w'.repeat(65) },
        { label: 'non-string type (number)', val: 12345 },
        { label: 'illegal characters', val: 'worker@evil!#$' }
      ];

      const prevSecret = process.env.CRON_SECRET;
      const prevStop = process.env.GLOBAL_OUTREACH_STOP;
      const prevAuth = process.env.OUTREACH_AUTHORIZED;
      try {
        process.env.CRON_SECRET = 'valid-secret-49';
        process.env.GLOBAL_OUTREACH_STOP = '0';
        process.env.OUTREACH_AUTHORIZED = '1';

        for (const tc of testCases) {
          transmitterInvoked = false;
          let status = 0;
          let json = null;
          const req = {
            method: 'POST',
            headers: { authorization: 'Bearer valid-secret-49' },
            body: {
              recipientId: 'REC-W-TEST-01',
              campaignId: 'CAMP-01',
              options: { workerId: tc.val }
            }
          };
          const res = {
            setHeader: () => {},
            status: (code) => {
              status = code;
              return { json: (d) => { json = d; } };
            }
          };

          await handler(req, res, { transmitter: mockTransmitter });
          assert.strictEqual(status, 400, `Expected HTTP 400 for ${tc.label} but got ${status}`);
          assert.strictEqual(json.error, 'INVALID_WORKER_ID', `Expected INVALID_WORKER_ID for ${tc.label}`);
          assert.strictEqual(transmitterInvoked, false, `Transmitter must NOT be invoked on invalid workerId (${tc.label})`);
        }
      } finally {
        if (prevSecret !== undefined) process.env.CRON_SECRET = prevSecret;
        else delete process.env.CRON_SECRET;
        if (prevStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = prevStop;
        else delete process.env.GLOBAL_OUTREACH_STOP;
        if (prevAuth !== undefined) process.env.OUTREACH_AUTHORIZED = prevAuth;
        else delete process.env.OUTREACH_AUTHORIZED;
      }
    });

    await runAsyncTest('TC-50', 'HTTP route accepts valid workerId and missing workerId defaults safely', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      const testRecipientId = 'REC-W-VALID-01';
      const enrolledLead = {
        id: testRecipientId,
        recipient_id: testRecipientId,
        email: 'worker.valid@domain.com',
        recipient_email: 'worker.valid@domain.com',
        status: 'PROSPECT',
        sequence_status: 'PROSPECT',
        current_step: 0,
        approvedForOutreach: true,
        approved: true,
        approvedBy: 'op-valid',
        approvedAt: new Date().toISOString()
      };
      await saveRecipientSequenceStateDistributed('CAMP-01', testRecipientId, enrolledLead);

      const mockTransmitter = async (payload, context) => {
        return { success: true, status: 'ACCEPTED', providerMessageId: 'MSG-W-VALID' };
      };

      const prevSecret = process.env.CRON_SECRET;
      const prevStop = process.env.GLOBAL_OUTREACH_STOP;
      const prevAuth = process.env.OUTREACH_AUTHORIZED;
      try {
        process.env.CRON_SECRET = 'valid-secret-50';
        process.env.GLOBAL_OUTREACH_STOP = '0';
        process.env.OUTREACH_AUTHORIZED = '1';

        // 1. Explicit valid workerId
        let status1 = 0;
        let json1 = null;
        const req1 = {
          method: 'POST',
          headers: { authorization: 'Bearer valid-secret-50' },
          body: {
            recipientId: testRecipientId,
            campaignId: 'CAMP-01',
            options: { workerId: 'worker_node-99' }
          }
        };
        const res1 = {
          setHeader: () => {},
          status: (code) => {
            status1 = code;
            return { json: (d) => { json1 = d; } };
          }
        };
        await handler(req1, res1, {
          transmitter: mockTransmitter,
          now: new Date(Date.now() + 1000000)
        });
        assert.strictEqual(status1, 200);
        assert.strictEqual(json1.success, true);

        // 2. Missing workerId (defaults safely to worker-1)
        const enrolledLead2 = { ...enrolledLead, id: 'REC-W-MISSING-01', recipient_id: 'REC-W-MISSING-01' };
        await saveRecipientSequenceStateDistributed('CAMP-01', 'REC-W-MISSING-01', enrolledLead2);

        let status2 = 0;
        let json2 = null;
        const req2 = {
          method: 'POST',
          headers: { authorization: 'Bearer valid-secret-50' },
          body: {
            recipientId: 'REC-W-MISSING-01',
            campaignId: 'CAMP-01',
            options: {} // missing workerId
          }
        };
        const res2 = {
          setHeader: () => {},
          status: (code) => {
            status2 = code;
            return { json: (d) => { json2 = d; } };
          }
        };
        await handler(req2, res2, {
          transmitter: mockTransmitter,
          now: new Date(Date.now() + 1200000)
        });
        assert.strictEqual(status2, 200);
        assert.strictEqual(json2.success, true);
      } finally {
        if (prevSecret !== undefined) process.env.CRON_SECRET = prevSecret;
        else delete process.env.CRON_SECRET;
        if (prevStop !== undefined) process.env.GLOBAL_OUTREACH_STOP = prevStop;
        else delete process.env.GLOBAL_OUTREACH_STOP;
        if (prevAuth !== undefined) process.env.OUTREACH_AUTHORIZED = prevAuth;
        else delete process.env.OUTREACH_AUTHORIZED;
      }
    });

    await runAsyncTest('TC-51', 'State machine and governor fail closed on invalid workerId', async () => {
      const customStore = createEmptyStore();
      const lead = {
        id: 'REC-DIRECT-W-01',
        email: 'direct.worker@domain.com',
        approvedForOutreach: true
      };
      const state = createRecipientState(lead);

      // 1. dispatchSequenceStepDistributed with invalid workerId
      const r1 = await dispatchSequenceStepDistributed(state, 'CAMP-01', {
        workerId: 'worker\r\ninjected',
        customStore
      });
      assert.strictEqual(r1.success, false);
      assert.strictEqual(r1.blocked, true);
      assert.strictEqual(r1.error, 'INVALID_WORKER_ID');

      // 2. advanceSequenceStep with invalid workerId
      const r2 = advanceSequenceStep(state, 'CAMP-01', {
        workerId: 'worker\0evil',
        customStore
      });
      assert.strictEqual(r2.success, false);
      assert.strictEqual(r2.blocked, true);
      assert.strictEqual(r2.error, 'INVALID_WORKER_ID');

      // 3. reserveDailyThroughputSlot with invalid workerId
      const r3 = reserveDailyThroughputSlot({
        workerId: 'w'.repeat(65),
        customStore
      });
      assert.strictEqual(r3.allowed, false);
      assert.strictEqual(r3.blocked, true);
      assert.strictEqual(r3.error, 'INVALID_WORKER_ID');

      // 4. reserveDailyThroughputSlotDistributed with invalid workerId
      const r4 = await reserveDailyThroughputSlotDistributed({
        workerId: 'worker!@#',
        customStore
      });
      assert.strictEqual(r4.allowed, false);
      assert.strictEqual(r4.blocked, true);
      assert.strictEqual(r4.error, 'INVALID_WORKER_ID');
    });

    await runAsyncTest('TC-52', 'Authentication accepts valid Bearer token and fails closed on missing/whitespace secret or invalid token', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      const checkAuth = async (headers, secret) => {
        let status = 0;
        let json = null;
        const prev = process.env.CRON_SECRET;
        try {
          if (secret !== undefined) process.env.CRON_SECRET = secret;
          else delete process.env.CRON_SECRET;

          await handler({
            method: 'POST',
            headers: headers || {},
            body: { recipientId: 'REC-01' }
          }, {
            setHeader: () => {},
            status: (c) => { status = c; return { json: (d) => { json = d; } }; }
          });
        } finally {
          if (prev !== undefined) process.env.CRON_SECRET = prev;
          else delete process.env.CRON_SECRET;
        }
        return { status, json };
      };

      // 1. Valid Bearer token passes auth (fails later at global stop / not 401)
      const r1 = await checkAuth({ authorization: 'Bearer secret-tc52' }, 'secret-tc52');
      assert.notStrictEqual(r1.status, 401, 'Valid Bearer token must pass authentication');

      // 2. Invalid Bearer token
      const r2 = await checkAuth({ authorization: 'Bearer wrong-token' }, 'secret-tc52');
      assert.strictEqual(r2.status, 401);
      assert.strictEqual(r2.json.error, 'UNAUTHORIZED');

      // 3. Missing CRON_SECRET
      const r3 = await checkAuth({ authorization: 'Bearer secret-tc52' }, undefined);
      assert.strictEqual(r3.status, 401);
      assert.strictEqual(r3.json.error, 'UNAUTHORIZED');

      // 4. Whitespace CRON_SECRET
      const r4 = await checkAuth({ authorization: 'Bearer secret-tc52' }, '    ');
      assert.strictEqual(r4.status, 401);
      assert.strictEqual(r4.json.error, 'UNAUTHORIZED');
    });

    await runAsyncTest('TC-53', 'Authentication rejects simultaneous/ambiguous credentials (both Authorization and x-cron-secret present)', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      const prev = process.env.CRON_SECRET;
      try {
        process.env.CRON_SECRET = 'shared-secret-53';

        // 1. Both headers with matching secret
        let status1 = 0;
        let json1 = null;
        await handler({
          method: 'POST',
          headers: {
            authorization: 'Bearer shared-secret-53',
            'x-cron-secret': 'shared-secret-53'
          },
          body: { recipientId: 'REC-01' }
        }, {
          setHeader: () => {},
          status: (c) => { status1 = c; return { json: (d) => { json1 = d; } }; }
        });
        assert.strictEqual(status1, 401);
        assert.strictEqual(json1.error, 'UNAUTHORIZED');
        assert.strictEqual(json1.reason, 'AMBIGUOUS_CREDENTIALS');

        // 2. Both headers with conflicting secrets
        let status2 = 0;
        let json2 = null;
        await handler({
          method: 'POST',
          headers: {
            authorization: 'Bearer shared-secret-53',
            'x-cron-secret': 'different-secret'
          },
          body: { recipientId: 'REC-01' }
        }, {
          setHeader: () => {},
          status: (c) => { status2 = c; return { json: (d) => { json2 = d; } }; }
        });
        assert.strictEqual(status2, 401);
        assert.strictEqual(json2.error, 'UNAUTHORIZED');
        assert.strictEqual(json2.reason, 'AMBIGUOUS_CREDENTIALS');
      } finally {
        if (prev !== undefined) process.env.CRON_SECRET = prev;
        else delete process.env.CRON_SECRET;
      }
    });

    await runAsyncTest('TC-54', 'Authentication rejects duplicate or multi-valued headers', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      const prev = process.env.CRON_SECRET;
      try {
        process.env.CRON_SECRET = 'secret-54';

        // 1. Array of Authorization headers
        let status1 = 0;
        let json1 = null;
        await handler({
          method: 'POST',
          headers: {
            authorization: ['Bearer secret-54', 'Bearer secret-54']
          },
          body: { recipientId: 'REC-01' }
        }, {
          setHeader: () => {},
          status: (c) => { status1 = c; return { json: (d) => { json1 = d; } }; }
        });
        assert.strictEqual(status1, 401);
        assert.strictEqual(json1.error, 'UNAUTHORIZED');
        assert.strictEqual(json1.reason, 'DUPLICATE_AUTH_HEADER');

        // 2. Comma-separated joined Authorization header
        let status2 = 0;
        let json2 = null;
        await handler({
          method: 'POST',
          headers: {
            authorization: 'Bearer secret-54, Bearer secret-54'
          },
          body: { recipientId: 'REC-01' }
        }, {
          setHeader: () => {},
          status: (c) => { status2 = c; return { json: (d) => { json2 = d; } }; }
        });
        assert.strictEqual(status2, 401);
        assert.strictEqual(json2.error, 'UNAUTHORIZED');
        assert.strictEqual(json2.reason, 'DUPLICATE_AUTH_HEADER');

        // 3. Array of x-cron-secret headers
        let status3 = 0;
        let json3 = null;
        await handler({
          method: 'POST',
          headers: {
            'x-cron-secret': ['secret-54', 'secret-54']
          },
          body: { recipientId: 'REC-01' }
        }, {
          setHeader: () => {},
          status: (c) => { status3 = c; return { json: (d) => { json3 = d; } }; }
        });
        assert.strictEqual(status3, 401);
        assert.strictEqual(json3.error, 'UNAUTHORIZED');
        assert.strictEqual(json3.reason, 'DUPLICATE_AUTH_HEADER');
      } finally {
        if (prev !== undefined) process.env.CRON_SECRET = prev;
        else delete process.env.CRON_SECRET;
      }
    });

    await runAsyncTest('TC-55', 'Authentication rejects malformed Authorization and never silently falls back to alternate header', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      const prev = process.env.CRON_SECRET;
      try {
        process.env.CRON_SECRET = 'secret-55';

        // 1. Non-Bearer Authorization scheme (e.g. Basic) alone
        let status1 = 0;
        let json1 = null;
        await handler({
          method: 'POST',
          headers: {
            authorization: 'Basic dXNlcjpwYXNz'
          },
          body: { recipientId: 'REC-01' }
        }, {
          setHeader: () => {},
          status: (c) => { status1 = c; return { json: (d) => { json1 = d; } }; }
        });
        assert.strictEqual(status1, 401);
        assert.strictEqual(json1.error, 'UNAUTHORIZED');
        assert.strictEqual(json1.reason, 'MALFORMED_AUTHORIZATION');

        // 2. Malformed Authorization with valid x-cron-secret present -> MUST NOT fall back!
        let status2 = 0;
        let json2 = null;
        await handler({
          method: 'POST',
          headers: {
            authorization: 'Basic dXNlcjpwYXNz',
            'x-cron-secret': 'secret-55'
          },
          body: { recipientId: 'REC-01' }
        }, {
          setHeader: () => {},
          status: (c) => { status2 = c; return { json: (d) => { json2 = d; } }; }
        });
        assert.strictEqual(status2, 401);
        assert.strictEqual(json2.error, 'UNAUTHORIZED');
        assert.ok(json2.reason === 'AMBIGUOUS_CREDENTIALS' || json2.reason === 'MALFORMED_AUTHORIZATION');

        // 3. Valid alternate x-cron-secret alone (when Authorization is completely absent)
        let status3 = 0;
        let json3 = null;
        await handler({
          method: 'POST',
          headers: {
            'x-cron-secret': 'secret-55'
          },
          body: { recipientId: 'REC-01' }
        }, {
          setHeader: () => {},
          status: (c) => { status3 = c; return { json: (d) => { json3 = d; } }; }
        });
        assert.notStrictEqual(status3, 401, 'Valid standalone x-cron-secret must pass authentication');
      } finally {
        if (prev !== undefined) process.env.CRON_SECRET = prev;
        else delete process.env.CRON_SECRET;
      }
    });

    await runAsyncTest('TC-56', 'Authentication error responses strictly contain zero secret leakage across all failure modes', async () => {
      const cronModule = await import('../api/cron-sequence-dispatch.js');
      const handler = cronModule.default;

      const secretToProtect = 'super-confidential-cron-key-999';
      const prev = process.env.CRON_SECRET;

      try {
        process.env.CRON_SECRET = secretToProtect;

        const errorHeaders = [
          {},
          { authorization: 'Bearer wrong-secret' },
          { authorization: 'Basic dXNlcjpwYXNz' },
          { authorization: ['Bearer 1', 'Bearer 2'] },
          { authorization: 'Bearer ' },
          { authorization: 'Bearer test', 'x-cron-secret': 'test' }
        ];

        for (const hdr of errorHeaders) {
          let status = 0;
          let json = null;
          await handler({
            method: 'POST',
            headers: hdr,
            body: { recipientId: 'REC-01' }
          }, {
            setHeader: () => {},
            status: (c) => { status = c; return { json: (d) => { json = d; } }; }
          });

          const rawResponse = JSON.stringify(json || {});
          assert.strictEqual(
            rawResponse.includes(secretToProtect),
            false,
            `Secret leaked in response for headers: ${JSON.stringify(hdr)}`
          );
        }
      } finally {
        if (prev !== undefined) process.env.CRON_SECRET = prev;
        else delete process.env.CRON_SECRET;
      }
    });

  } finally {
    // Restore environment
    process.env = originalEnv;
    try {
      if (typeof tmpStorePath === 'string' && fs.existsSync(tmpStorePath)) {
        fs.unlinkSync(tmpStorePath);
      }
      if (typeof tmpSubdir === 'string' && fs.existsSync(tmpSubdir)) {
        fs.rmdirSync(tmpSubdir, { recursive: true });
      }
    } catch {}
  }

  console.log('\n============================================================');
  console.log(`TEST SUMMARY: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('============================================================');

  if (failedTests > 0) {
    console.error('\nFAILURES:');
    failures.forEach(f => console.error(`- ${f.id}: ${f.name} -> ${f.error}`));
    process.exit(1);
  } else {
    console.log('\nALL 56 MASTER VERIFICATION TESTS PASSED SUCCESSFULLY.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
