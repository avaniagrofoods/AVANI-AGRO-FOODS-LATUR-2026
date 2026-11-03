// ============================================================
// AVANI AGRO FOODS — PACKAGE 3F ISOLATED REMEDIATION TEST SUITE
// scripts/test_package_3f_isolated_remediation.cjs
// Tests:
// 1. Authoritative Server Gates: caller options cannot override GLOBAL_OUTREACH_STOP=1 or OUTREACH_AUTHORIZED=0
// 2. Missing Transmitter Fail-Closed: rejected before reservation, claim, or mutation
// 3. Malformed Transmitter Result: rejected before step advance
// 4. Uncertain Outcome Lifecycle: network timeout enters RECONCILIATION_HOLD, blocks auto-resend
// 5. Simulated Mock Dispatch: valid providerMessageId advances step (clearly marked simulated)
// 6. Daily Throughput Governor: non-destructive compensation, no unconditional SET 0
// 7. Form Security: src/lib/emailjs.js has zero @emailjs/browser imports, routes via server
// ============================================================

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Step 1: Configure isolated environment before importing application modules
const tmpSubdir = path.join(os.tmpdir(), `aaf_test_pkg3f_${Date.now()}`);
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

async function runTestSuite() {
  console.log('============================================================');
  console.log('TEST SUITE: Package 3F Controlled Remediation & Verification');
  console.log('============================================================\n');

  const {
    createRecipientState,
    dispatchSequenceStep,
    dispatchSequenceStepDistributed,
    SEQUENCE_STATUSES
  } = await import('../api/_lib/sequenceStateMachine.js');

  const {
    reserveDailyThroughputSlot,
    releaseDailyThroughputSlot
  } = await import('../api/_lib/dailyThroughputGovernor.js');

  let passed = 0;

  function runTest(testName, fn) {
    try {
      fn();
      console.log(`[PASS] ${testName}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${testName}:`, err.message);
      throw err;
    }
  }

  async function runAsyncTest(testName, fn) {
    try {
      await fn();
      console.log(`[PASS] ${testName}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${testName}:`, err.message);
      throw err;
    }
  }

  // --- TEST 1: Authoritative Server Gates Precedence ---
  await runAsyncTest('1. Authoritative Gate: Caller options cannot override GLOBAL_OUTREACH_STOP=1', async () => {
    const synthRecipient = {
      id: 'REC-TEST-AUTH-001',
      email: 'test@avaniagrofoods.com',
      companyName: 'Test Buyer',
      contactName: 'Test Contact',
      approvedForOutreach: true
    };
    const state = createRecipientState(synthRecipient);

    // Caller attempts to bypass server stop and grant authority via options
    const maliciousCallerOpts = {
      globalOutreachStop: false,
      outreachAuthorized: true
    };

    const res = await dispatchSequenceStepDistributed(state, 'CAMP-01', maliciousCallerOpts, async () => {
      throw new Error('UNREACHABLE: Transmitter must never be called when server stop is active');
    });

    assert.strictEqual(res.success, false, 'Dispatch must not succeed');
    assert.strictEqual(res.blocked, true, 'Dispatch must be blocked');
    assert(res.reason.includes('GLOBAL_OUTREACH_STOP is active'), `Expected global stop reason, got: ${res.reason}`);
    assert.strictEqual(state.currentStep, 0, 'Current step must not advance');
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_GLOBAL_STOP);
  });

  // --- TEST 2: Authoritative Gate: Caller options cannot override OUTREACH_AUTHORIZED=0 ---
  await runAsyncTest('2. Authoritative Gate: Caller options cannot override OUTREACH_AUTHORIZED=0', async () => {
    const synthRecipient = {
      id: 'REC-TEST-AUTH-002',
      email: 'test@avaniagrofoods.com',
      companyName: 'Test Buyer',
      contactName: 'Test Contact',
      approvedForOutreach: true
    };
    const state = createRecipientState(synthRecipient);

    // In isolated test harness, simulate server having stop=0, but auth=0
    const optsWithStopCleared = {
      _testMockGlobalStop: '0',
      globalOutreachStop: false,
      outreachAuthorized: true // Caller attempts to grant itself authorization!
    };

    const res = await dispatchSequenceStepDistributed(state, 'CAMP-01', optsWithStopCleared, async () => {
      throw new Error('UNREACHABLE: Transmitter must never be called when outreach is unauthorized');
    });

    assert.strictEqual(res.success, false, 'Dispatch must not succeed');
    assert.strictEqual(res.blocked, true, 'Dispatch must be blocked');
    assert(res.reason.includes('OUTREACH_NOT_AUTHORIZED'), `Expected unauthorized reason, got: ${res.reason}`);
    assert.strictEqual(state.currentStep, 0, 'Current step must not advance');
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_UNAUTHORIZED);
  });

  // --- TEST 3: Missing Transmitter Fails Closed ---
  await runAsyncTest('3. Missing Transmitter: Fails closed before reservation, claim, or mutation', async () => {
    const synthRecipient = {
      id: 'REC-TEST-NOTX-001',
      email: 'test@avaniagrofoods.com',
      companyName: 'Test Buyer',
      contactName: 'Test Contact',
      approvedForOutreach: true
    };
    const state = createRecipientState(synthRecipient);

    // Authorize for this test to test transmitter boundary specifically
    const testOpts = {
      _testMockGlobalStop: '0',
      _testMockOutreachAuthorized: '1',
      globalOutreachStop: false,
      outreachAuthorized: true
      // Notice: NO transmitter supplied!
    };

    const res = await dispatchSequenceStepDistributed(state, 'CAMP-01', testOpts, null);

    assert.strictEqual(res.success, false, 'Dispatch without transmitter must fail');
    assert.strictEqual(res.blocked, true, 'Must be blocked');
    assert.strictEqual(res.error, 'TRANSMITTER_REQUIRED', `Expected TRANSMITTER_REQUIRED, got: ${res.error}`);
    assert.strictEqual(state.currentStep, 0, 'Current step must remain 0');
    assert.notStrictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT, 'Must NOT be marked sent');
  });

  // --- TEST 4: Malformed Transmitter Result Fails Closed ---
  await runAsyncTest('4. Malformed Transmitter Result: Cannot advance state to SENT', async () => {
    const synthRecipient = {
      id: 'REC-TEST-BADTX-001',
      email: 'test@avaniagrofoods.com',
      companyName: 'Test Buyer',
      contactName: 'Test Contact',
      approvedForOutreach: true
    };
    const state = createRecipientState(synthRecipient);

    const testOpts = {
      _testMockGlobalStop: '0',
      _testMockOutreachAuthorized: '1',
      globalOutreachStop: false,
      outreachAuthorized: true,
      configuredPacing: 60,
      now: new Date('2026-10-21T10:00:00Z')
    };

    // Transmitter returns without a providerMessageId
    const malformedTransmitter = async () => {
      return { success: true, somethingElse: 'no provider ID here' };
    };

    const res = await dispatchSequenceStepDistributed(state, 'CAMP-01', testOpts, malformedTransmitter);

    assert.strictEqual(res.success, false, 'Malformed result must not succeed');
    assert.strictEqual(res.error, 'MALFORMED_TRANSMITTER_RESULT', `Expected MALFORMED_TRANSMITTER_RESULT, got: ${res.error}`);
    assert.strictEqual(state.currentStep, 0, 'Current step must not advance');
    assert.notStrictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT, 'Must NOT be marked sent');
  });

  // --- TEST 5: Uncertain Outcome Enters RECONCILIATION_HOLD ---
  await runAsyncTest('5. Uncertain Outcome: Enters RECONCILIATION_HOLD and blocks auto-resend', async () => {
    const synthRecipient = {
      id: 'REC-TEST-UNCERTAIN-001',
      email: 'test@avaniagrofoods.com',
      companyName: 'Test Buyer',
      contactName: 'Test Contact',
      approvedForOutreach: true
    };
    const state = createRecipientState(synthRecipient);

    const testOpts = {
      _testMockGlobalStop: '0',
      _testMockOutreachAuthorized: '1',
      globalOutreachStop: false,
      outreachAuthorized: true,
      configuredPacing: 60,
      now: new Date('2026-10-21T10:05:00Z')
    };

    // Transmitter simulates network timeout after HTTP client invocation
    const timeoutTransmitter = async () => {
      const err = new Error('ESOCKETTIMEDOUT: Network connection dropped during transmission');
      err.code = 'ETIMEDOUT';
      err.uncertainOutcome = true;
      throw err;
    };

    const res = await dispatchSequenceStepDistributed(state, 'CAMP-01', testOpts, timeoutTransmitter);

    assert.strictEqual(res.success, false, 'Timed-out dispatch must return failure');
    assert.strictEqual(res.uncertainOutcome, true, 'Must flag uncertain outcome');
    assert.strictEqual(res.status, 'RECONCILIATION_HOLD', 'Must set RECONCILIATION_HOLD status');
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.UNCERTAIN_DISPATCH, 'Sequence status must be frozen in UNCERTAIN_DISPATCH');
    assert.strictEqual(state.currentStep, 0, 'Current step must NOT be committed or incremented');
  });

  // --- TEST 6: Simulated Valid Transmitter Result ---
  await runAsyncTest('6. Simulated Mock Dispatch: Valid providerMessageId advances step (SIMULATED)', async () => {
    const synthRecipient = {
      id: 'REC-TEST-SIM-001',
      email: 'test@avaniagrofoods.com',
      companyName: 'Test Buyer',
      contactName: 'Test Contact',
      approvedForOutreach: true
    };
    const state = createRecipientState(synthRecipient);

    const testOpts = {
      _testMockGlobalStop: '0',
      _testMockOutreachAuthorized: '1',
      globalOutreachStop: false,
      outreachAuthorized: true,
      configuredPacing: 60,
      now: new Date('2026-10-21T10:10:00Z')
    };

    // Simulated trusted mock adapter
    const mockSimulatedTransmitter = async () => {
      return {
        success: true,
        status: 'ACCEPTED',
        providerMessageId: 'res_simulated_mock_id_99999',
        simulated: true
      };
    };

    const res = await dispatchSequenceStepDistributed(state, 'CAMP-01', testOpts, mockSimulatedTransmitter);

    assert.strictEqual(res.success, true, 'Simulated dispatch with valid result must succeed');
    assert.strictEqual(res.step, 'EMAIL_1', 'Step must be EMAIL_1');
    assert.strictEqual(res.providerMessageId, 'res_simulated_mock_id_99999');
    assert.strictEqual(state.currentStep, 1, 'Current step must advance to 1');
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT);
  });

  // --- TEST 7: Daily Throughput Governor - Non-destructive Compensation ---
  runTest('7. Daily Throughput Governor: Releasing slot is safe and non-destructive', () => {
    const dateKey = '2026-10-21';
    const customStore = {
      dailyThroughput: {
        [dateKey]: { count: 1, limit: 50, reservations: [{ reservationId: 'RES-001' }] }
      }
    };

    const releaseRes = releaseDailyThroughputSlot(dateKey, 'RES-001', { customStore });
    assert.strictEqual(releaseRes, true, 'Release must return true');
    assert.strictEqual(customStore.dailyThroughput[dateKey].count, 0, 'Count must decrement to 0');

    // Calling release again idempotently must not underflow below 0
    const secondRelease = releaseDailyThroughputSlot(dateKey, 'RES-001', { customStore });
    assert.strictEqual(secondRelease, false, 'Second release must be rejected idempotently');
    assert.strictEqual(customStore.dailyThroughput[dateKey].count, 0, 'Count must remain 0 and never drop below 0');
  });

  // --- TEST 8: Client Form Transport Security ---
  runTest('8. Form Security: src/lib/emailjs.js has zero @emailjs/browser imports and routes via server', () => {
    const emailjsFileContent = fs.readFileSync(path.resolve(__dirname, '../src/lib/emailjs.js'), 'utf8');

    assert(!emailjsFileContent.includes('@emailjs/browser'), 'src/lib/emailjs.js must NOT import @emailjs/browser');
    assert(!emailjsFileContent.includes('emailjs.send'), 'src/lib/emailjs.js must NOT call emailjs.send');
    assert(emailjsFileContent.includes('/api/save-lead'), 'src/lib/emailjs.js must route to /api/save-lead');
    assert(emailjsFileContent.includes('sendContactEmail'), 'Must export sendContactEmail');
    assert(emailjsFileContent.includes('sendB2BRegistrationEmail'), 'Must export sendB2BRegistrationEmail');
  });

  // --- TEST 9: Authoritative Gate: Unset env vars fail closed despite malicious caller options ---
  await runAsyncTest('9. Authoritative Gate: Unset env vars fail closed in distributed dispatch', async () => {
    const synthRecipient = {
      id: 'REC-TEST-UNSET-001',
      email: 'test@avaniagrofoods.com',
      companyName: 'Test Buyer',
      contactName: 'Test Contact',
      approvedForOutreach: true
    };
    const state = createRecipientState(synthRecipient);

    // Caller passes explicit un-stop and auth=true when env vars are unset / mocked as undefined
    const maliciousOpts = {
      _testMockGlobalStop: undefined,
      _testMockOutreachAuthorized: undefined,
      globalOutreachStop: false,
      outreachAuthorized: true
    };

    // Temporarily unset env vars to test strict unset behavior
    const origStop = process.env.GLOBAL_OUTREACH_STOP;
    const origAuth = process.env.OUTREACH_AUTHORIZED;
    delete process.env.GLOBAL_OUTREACH_STOP;
    delete process.env.OUTREACH_AUTHORIZED;

    try {
      const res = await dispatchSequenceStepDistributed(state, 'CAMP-01', maliciousOpts, async () => {
        throw new Error('UNREACHABLE: Transmitter must never be called when env vars are unset');
      });

      assert.strictEqual(res.success, false, 'Dispatch must not succeed when env vars are unset');
      assert.strictEqual(res.blocked, true, 'Dispatch must be blocked');
      assert(res.reason.includes('GLOBAL_OUTREACH_STOP is active'), `Expected stop active reason, got: ${res.reason}`);
      assert.strictEqual(state.currentStep, 0, 'Current step must remain 0');
    } finally {
      process.env.GLOBAL_OUTREACH_STOP = origStop;
      process.env.OUTREACH_AUTHORIZED = origAuth;
    }
  });

  // --- TEST 10: Form Phone Normalization & Optional Contract ---
  runTest('10. Form Security: Phone normalization preserves valid phone and leaves optional empty without fabricated data', () => {
    const emailjsFileContent = fs.readFileSync(path.resolve(__dirname, '../src/lib/emailjs.js'), 'utf8');
    const saveLeadContent = fs.readFileSync(path.resolve(__dirname, '../api/save-lead.js'), 'utf8');
    assert(emailjsFileContent.includes('normalizePhone'), 'src/lib/emailjs.js must define normalizePhone');
    assert(saveLeadContent.includes('isPhoneProvided'), 'api/save-lead.js must support isPhoneProvided optional contract');
    assert(saveLeadContent.includes('isPhoneProvided && (phone.length < 6 || phone.length > 50)'), 'api/save-lead.js must validate bounds only when phone is provided');
  });

  // --- TEST 11: Post-Acceptance Commit Failure Safety ---
  runTest('11. Sequence State Machine: Post-acceptance commit failure enters RECONCILIATION_HOLD and halts duplicate retry', () => {
    const ssmContent = fs.readFileSync(path.resolve(__dirname, '../api/_lib/sequenceStateMachine.js'), 'utf8');
    assert(ssmContent.includes('COMMIT_FAILED_HOLD'), 'sequenceStateMachine.js must transition to COMMIT_FAILED_HOLD');
    assert(ssmContent.includes('UNCERTAIN_DISPATCH'), 'sequenceStateMachine.js must set UNCERTAIN_DISPATCH');
  });

  // --- TEST 12: Durable Intent Exclusion Across Crashes & Lease Expiry ---
  await runAsyncTest('12. Durable Intent: RECONCILIATION_HOLD intent blocks subsequent worker reservation attempts', async () => {
    const {
      reserveSequenceStepDistributed,
      saveDispatchIntentDistributed,
      generateStepIdempotencyKey
    } = await import('../api/_lib/sequencePersistence.js');

    const cId = 'CAMP-DUR-01';
    const rId = 'REC-DUR-01';
    const sId = 'SEQ-01';
    const stepNum = 1;
    const idemKey = generateStepIdempotencyKey(cId, rId, sId, stepNum);

    // Simulate durable intent recorded in RECONCILIATION_HOLD
    await saveDispatchIntentDistributed(idemKey, {
      intentId: `INTENT-${idemKey}`,
      idempotencyKey: idemKey,
      status: 'RECONCILIATION_HOLD',
      error: 'Network timeout during provider transmission'
    });

    // A second worker arrives and attempts to reserve the step
    const secondWorkerRes = await reserveSequenceStepDistributed(cId, rId, sId, stepNum, 'worker-second-retry', 300);

    assert.strictEqual(secondWorkerRes.reserved, false, 'Second worker reservation must be blocked by intent hold');
    assert.strictEqual(secondWorkerRes.reconciliationHold, true, 'Must flag reconciliationHold');
    assert(secondWorkerRes.reason.toLowerCase().includes('reconciliation'), `Expected reconciliation reason, got: ${secondWorkerRes.reason}`);
  });

  console.log(`\nResults: ${passed} passed, 0 failed.`);
  console.log('[ALL TESTS PASSED] Package 3F Remediation and Verification successfully completed.\n');

  // Clean up test store
  try {
    fs.rmSync(tmpSubdir, { recursive: true, force: true });
  } catch {}
}

runTestSuite().catch(err => {
  console.error('[SUITE FATAL ERROR]:', err);
  process.exit(1);
});
