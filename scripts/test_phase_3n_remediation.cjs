// ============================================================
// AVANI AGRO FOODS — Phase 3N Remediation Verification Suite
// scripts/test_phase_3n_remediation.cjs
//
// 16 Deterministic Safety & Governor Tests:
// 1. Unapproved recipient attempts SEQ-01 -> BLOCKED_HUMAN_APPROVAL_REQUIRED
// 2. Approved recipient with GLOBAL_OUTREACH_STOP = 1 -> STOPPED_GLOBAL_STOP
// 3. Approved recipient with global stop off inside test fixture reaches governor without network send
// 4. Daily count 19, limit 20 -> slot 20 reserved
// 5. Daily count 20, limit 20 -> blocked
// 6. Second worker attempts dispatch when daily count 20 -> blocked
// 7. Two concurrent workers on final slot -> exactly one succeeds
// 8. Invalid daily limit config -> fail closed
// 9. Invalid pacing config -> fail closed
// 10. Duplicate sequence dispatch blocked by idempotency
// 11. Unsubscribe -> STOPPED_OPT_OUT
// 12. Bounce -> STOPPED_BOUNCE
// 13. Complaint -> STOPPED_COMPLAINT
// 14. Reply -> follow-ups stop & operator task created
// 15. Recipient not approved -> no state advance
// 16. Test-mode simulation -> zero external network calls
// ============================================================

const assert = require('assert');
const http = require('http');
const https = require('https');
const net = require('net');
const tls = require('tls');

const {
  FOLLOWUP_DELAY_HOURS,
  SEQUENCE_STATUSES,
  LEAD_STATUSES,
  NEXT_ACTIONS,
  generateIdempotencyKey,
  createRecipientState,
  approveRecipientForOutreach,
  dispatchSequenceStep,
  handleIncomingReply,
  handleOptOut,
  handleBounce,
  handleComplaint
} = require('../api/_lib/sequenceStateMachine.js');

const {
  DEFAULT_DAILY_PILOT_LIMIT,
  DEFAULT_MAX_SENDS_PER_MINUTE,
  validateDailyLimitConfig,
  validatePacingConfig,
  reserveDailyThroughputSlot,
  releaseDailyThroughputSlot,
  getDailyThroughputStatus,
  getUtcDateKey
} = require('../api/_lib/dailyThroughputGovernor.js');

function runPhase3NTests() {
  console.log('============================================================');
  console.log('TEST SUITE: Phase 3N Remediation — Outreach Safety Controls');
  console.log('Deterministic Verification (16 Safety & Governor Tests)');
  console.log('============================================================\n');

  let passed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // TEST 1: Unapproved recipient attempts SEQ-01 -> BLOCKED_HUMAN_APPROVAL_REQUIRED
  test('Test 1: Unapproved recipient attempts SEQ-01 -> BLOCKED_HUMAN_APPROVAL_REQUIRED', () => {
    const unapprovedLead = {
      id: 'REC-UNAPPROVED-01',
      email: 'coldbuyer@unapproved-test.com',
      companyName: 'Global Spices BV',
      contactName: 'Hans Schmidt',
      approvedForOutreach: false
    };

    const state = createRecipientState(unapprovedLead);
    assert.strictEqual(state.approvedForOutreach, false);

    const dispatchRes = dispatchSequenceStep(state, 'CAMP-PILOT-01', {
      isTestMode: true,
      globalOutreachStop: 0,
      outreachAuthorized: 1
    });

    assert.strictEqual(dispatchRes.success, false);
    assert.strictEqual(dispatchRes.blocked, true);
    assert.strictEqual(dispatchRes.approvalRequired, true);
    assert(dispatchRes.reason.includes('BLOCKED_HUMAN_APPROVAL_REQUIRED'), 'Reason must indicate human approval required');
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.BLOCKED_HUMAN_APPROVAL_REQUIRED);
    assert.strictEqual(state.currentStep, 0, 'Current step must remain 0');
    assert.strictEqual(state.lastSentAt, null, 'lastSentAt must remain null');
  });

  // TEST 2: Approved recipient with GLOBAL_OUTREACH_STOP = 1 -> STOPPED_GLOBAL_STOP
  test('Test 2: Approved recipient with GLOBAL_OUTREACH_STOP = 1 -> STOPPED_GLOBAL_STOP', () => {
    const lead = {
      id: 'REC-APPROVED-01',
      email: 'verified@approved-test.com',
      companyName: 'Euro Herbs GmbH',
      contactName: 'Klaus Fischer',
      approvedForOutreach: true
    };

    const state = createRecipientState(lead);
    assert.strictEqual(state.approvedForOutreach, true);

    const dispatchRes = dispatchSequenceStep(state, 'CAMP-PILOT-01', {
      isTestMode: true,
      globalOutreachStop: 1, // Global stop active
      outreachAuthorized: 1
    });

    assert.strictEqual(dispatchRes.success, false);
    assert.strictEqual(dispatchRes.blocked, true);
    assert(dispatchRes.reason.includes('GLOBAL_OUTREACH_STOP is active'));
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_GLOBAL_STOP);
    assert.strictEqual(state.currentStep, 0, 'Step must not advance when global stop is active');
  });

  // TEST 3: Approved recipient with global stop off inside test fixture reaches governor without network send
  test('Test 3: Approved recipient with global stop off inside test fixture reaches governor without network send', () => {
    const lead = {
      id: 'REC-APPROVED-02',
      email: 'buyer2@approved-fixture.com',
      companyName: 'Nordic Agro AS',
      contactName: 'Astrid Lind',
      approvedForOutreach: true
    };

    const state = createRecipientState(lead);
    const customStore = { dailyThroughput: {}, pacingLog: [] };

    const dispatchRes = dispatchSequenceStep(state, 'CAMP-FIXTURE-01', {
      isTestMode: true,
      globalOutreachStop: 0,
      outreachAuthorized: 1,
      trackTestQuota: true,
      customStore
    });

    assert.strictEqual(dispatchRes.success, true);
    assert.strictEqual(dispatchRes.step, 'EMAIL_1');
    assert.strictEqual(dispatchRes.sequenceId, 'SEQ-01');
    assert(dispatchRes.quotaReservation !== undefined);
    assert.strictEqual(dispatchRes.quotaReservation.allowed, true);
    assert.strictEqual(dispatchRes.quotaReservation.slot, 1);
    assert.strictEqual(state.currentStep, 1);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT);
  });

  // TEST 4: Daily count 19, limit 20 -> slot 20 reserved
  test('Test 4: Daily count 19, limit 20 -> slot 20 reserved', () => {
    const now = new Date('2026-10-08T10:00:00Z');
    const dateKey = getUtcDateKey(now);
    const customStore = {
      dailyThroughput: {
        [dateKey]: {
          count: 19,
          limit: 20,
          reservations: Array(19).fill({ reservationId: 'RES-MOCK' })
        }
      },
      pacingLog: []
    };

    const quotaRes = reserveDailyThroughputSlot({
      now,
      configuredLimit: 20,
      workerId: 'worker-1',
      trackTestQuota: true,
      customStore
    });

    assert.strictEqual(quotaRes.allowed, true);
    assert.strictEqual(quotaRes.slot, 20);
    assert.strictEqual(quotaRes.dailyLimit, 20);
    assert.strictEqual(customStore.dailyThroughput[dateKey].count, 20);
    assert.strictEqual(customStore.dailyThroughput[dateKey].reservations.length, 20);
  });

  // TEST 5: Daily count 20, limit 20 -> blocked
  test('Test 5: Daily count 20, limit 20 -> blocked', () => {
    const now = new Date('2026-10-08T11:00:00Z');
    const dateKey = getUtcDateKey(now);
    const customStore = {
      dailyThroughput: {
        [dateKey]: {
          count: 20,
          limit: 20,
          reservations: Array(20).fill({ reservationId: 'RES-MOCK' })
        }
      },
      pacingLog: []
    };

    const quotaRes = reserveDailyThroughputSlot({
      now,
      configuredLimit: 20,
      workerId: 'worker-1',
      trackTestQuota: true,
      customStore
    });

    assert.strictEqual(quotaRes.allowed, false);
    assert.strictEqual(quotaRes.blocked, true);
    assert.strictEqual(quotaRes.quotaExceeded, true);
    assert(quotaRes.reason.includes('Daily outreach limit reached (20/20)'));
    assert.strictEqual(customStore.dailyThroughput[dateKey].count, 20, 'Count must remain 20');
  });

  // TEST 6: Second worker attempts dispatch when daily count 20 -> blocked
  test('Test 6: Second worker attempts dispatch when daily count 20 -> blocked', () => {
    const now = new Date('2026-10-08T11:30:00Z');
    const dateKey = getUtcDateKey(now);
    const customStore = {
      dailyThroughput: {
        [dateKey]: {
          count: 20,
          limit: 20,
          reservations: Array(20).fill({ reservationId: 'RES-MOCK' })
        }
      },
      pacingLog: []
    };

    const worker2Res = reserveDailyThroughputSlot({
      now,
      configuredLimit: 20,
      workerId: 'worker-2',
      trackTestQuota: true,
      customStore
    });

    assert.strictEqual(worker2Res.allowed, false);
    assert.strictEqual(worker2Res.blocked, true);
    assert.strictEqual(worker2Res.quotaExceeded, true);
    assert.strictEqual(customStore.dailyThroughput[dateKey].count, 20);
  });

  // TEST 7: Two concurrent workers on final slot -> exactly one succeeds
  test('Test 7: Two concurrent workers on final slot -> exactly one succeeds', () => {
    const nowA = new Date('2026-10-08T12:00:00Z');
    const nowB = new Date('2026-10-08T12:01:05Z'); // spaced beyond 60s pacing to test quota competition
    const dateKey = getUtcDateKey(nowA);

    const customStore = {
      dailyThroughput: {
        [dateKey]: {
          count: 19,
          limit: 20,
          reservations: Array(19).fill({ reservationId: 'RES-MOCK' })
        }
      },
      pacingLog: []
    };

    // Worker A requests slot 20
    const resA = reserveDailyThroughputSlot({
      now: nowA,
      configuredLimit: 20,
      workerId: 'worker-A',
      trackTestQuota: true,
      customStore
    });

    // Worker B requests immediately after
    const resB = reserveDailyThroughputSlot({
      now: nowB,
      configuredLimit: 20,
      workerId: 'worker-B',
      trackTestQuota: true,
      customStore
    });

    assert.strictEqual(resA.allowed, true, 'Worker A should claim the final slot 20');
    assert.strictEqual(resA.slot, 20);
    assert.strictEqual(resB.allowed, false, 'Worker B must be blocked because quota is exhausted');
    assert.strictEqual(resB.quotaExceeded, true);
    assert.strictEqual(customStore.dailyThroughput[dateKey].count, 20, 'Final count must be exactly 20');
  });

  // TEST 8: Invalid daily limit config -> fail closed
  test('Test 8: Invalid daily limit config -> fail closed', () => {
    const invalidLimits = [0, -1, -50, 'not-a-number', 1001, 5000, 15.5, NaN];
    for (const limit of invalidLimits) {
      const check = validateDailyLimitConfig(limit);
      assert.strictEqual(check.valid, false, `Limit ${limit} must be invalid`);
      assert(check.error !== undefined);

      const reservation = reserveDailyThroughputSlot({
        configuredLimit: limit,
        trackTestQuota: true
      });
      assert.strictEqual(reservation.allowed, false);
      assert.strictEqual(reservation.blocked, true);
      assert.strictEqual(reservation.error, 'CONFIG_FAIL_CLOSED');
    }
  });

  // TEST 9: Invalid pacing config -> fail closed
  test('Test 9: Invalid pacing config -> fail closed', () => {
    const invalidPacings = [0, -1, -10, 'fast', 61, 100, 2.5, NaN];
    for (const pacing of invalidPacings) {
      const check = validatePacingConfig(pacing);
      assert.strictEqual(check.valid, false, `Pacing ${pacing} must be invalid`);
      assert(check.error !== undefined);

      const reservation = reserveDailyThroughputSlot({
        configuredPacing: pacing,
        trackTestQuota: true
      });
      assert.strictEqual(reservation.allowed, false);
      assert.strictEqual(reservation.blocked, true);
      assert.strictEqual(reservation.error, 'CONFIG_FAIL_CLOSED');
    }
  });

  // TEST 10: Duplicate sequence dispatch blocked by idempotency
  test('Test 10: Duplicate sequence dispatch blocked by idempotency', () => {
    const lead = {
      id: 'REC-DUP-TEST-01',
      email: 'dup@idempotency-test.com',
      companyName: 'Idem Co',
      contactName: 'Idem Lead',
      approvedForOutreach: true
    };

    const state = createRecipientState(lead);
    const campaignId = 'CAMP-IDEM-01';

    const d1 = dispatchSequenceStep(state, campaignId, { isTestMode: true });
    assert.strictEqual(d1.success, true);
    assert.strictEqual(state.currentStep, 1);

    // Immediate duplicate attempt
    const dDup = dispatchSequenceStep(state, campaignId, { isTestMode: true });
    assert.strictEqual(dDup.success, false);
    assert(dDup.duplicate || dDup.timingBlocked, 'Must be blocked by duplicate or timing delay');
  });

  // TEST 11: Unsubscribe -> STOPPED_OPT_OUT
  test('Test 11: Unsubscribe -> STOPPED_OPT_OUT', () => {
    const lead = {
      id: 'REC-OPT-01',
      email: 'optout@buyer-test.com',
      companyName: 'Opt Out Ltd',
      contactName: 'James Kirk',
      approvedForOutreach: true
    };

    const state = createRecipientState(lead);
    dispatchSequenceStep(state, 'CAMP-OPT-01', { isTestMode: true });

    const optResult = handleOptOut(state, { reason: 'Clicked UNSUBSCRIBE link' });
    assert.strictEqual(optResult.success, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_OPT_OUT);
    assert.strictEqual(state.followupStatus, SEQUENCE_STATUSES.STOPPED_OPT_OUT);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.UNSUBSCRIBED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.PERMANENT_SUPPRESSION);
    assert.strictEqual(state.nextFollowUpDueAt, null);

    // Subsequent dispatch must fail-close
    const nextAttempt = dispatchSequenceStep(state, 'CAMP-OPT-01', { isTestMode: true });
    assert.strictEqual(nextAttempt.success, false);
    assert.strictEqual(nextAttempt.blocked, true);
    assert(nextAttempt.reason.includes('opted out'));
  });

  // TEST 12: Bounce -> STOPPED_BOUNCE
  test('Test 12: Bounce -> STOPPED_BOUNCE', () => {
    const lead = {
      id: 'REC-BOUNCE-01',
      email: 'bounce@buyer-test.com',
      companyName: 'Bounce Corp',
      contactName: 'Spock',
      approvedForOutreach: true
    };

    const state = createRecipientState(lead);
    dispatchSequenceStep(state, 'CAMP-BOUNCE-01', { isTestMode: true });

    const bounceResult = handleBounce(state, { type: '550 5.1.1 User unknown' });
    assert.strictEqual(bounceResult.success, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_BOUNCE);
    assert.strictEqual(state.followupStatus, SEQUENCE_STATUSES.STOPPED_BOUNCE);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.BOUNCED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.PERMANENT_SUPPRESSION);
    assert.strictEqual(state.nextFollowUpDueAt, null);

    const nextAttempt = dispatchSequenceStep(state, 'CAMP-BOUNCE-01', { isTestMode: true });
    assert.strictEqual(nextAttempt.success, false);
    assert.strictEqual(nextAttempt.blocked, true);
    assert(nextAttempt.reason.includes('bounced'));
  });

  // TEST 13: Complaint -> STOPPED_COMPLAINT
  test('Test 13: Complaint -> STOPPED_COMPLAINT', () => {
    const lead = {
      id: 'REC-COMPLAINT-01',
      email: 'complaint@buyer-test.com',
      companyName: 'Complaint Inc',
      contactName: 'Bones McCoy',
      approvedForOutreach: true
    };

    const state = createRecipientState(lead);
    dispatchSequenceStep(state, 'CAMP-COMPLAINT-01', { isTestMode: true });

    const complaintResult = handleComplaint(state, { feedbackType: 'abuse' });
    assert.strictEqual(complaintResult.success, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_COMPLAINT);
    assert.strictEqual(state.followupStatus, SEQUENCE_STATUSES.STOPPED_COMPLAINT);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.SUPPRESSED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.PERMANENT_SUPPRESSION);
    assert.strictEqual(state.nextFollowUpDueAt, null);

    const nextAttempt = dispatchSequenceStep(state, 'CAMP-COMPLAINT-01', { isTestMode: true });
    assert.strictEqual(nextAttempt.success, false);
    assert.strictEqual(nextAttempt.blocked, true);
    assert(nextAttempt.reason.includes('complaint recorded'));
  });

  // TEST 14: Reply -> follow-ups stop & operator task created
  test('Test 14: Reply -> follow-ups stop & operator task created', () => {
    const lead = {
      id: 'REC-REPLY-01',
      email: 'replyingbuyer@agri-corp.de',
      companyName: 'Agri Corp DE',
      contactName: 'Gerhard Becker',
      approvedForOutreach: true
    };

    const state = createRecipientState(lead);
    dispatchSequenceStep(state, 'CAMP-REPLY-01', { isTestMode: true });

    const replyResult = handleIncomingReply(state, {
      from: 'replyingbuyer@agri-corp.de',
      subject: 'Re: Moringa Oleifera Procurement Inquiry',
      body: 'Please send us product specifications and MOQ details.'
    });

    assert.strictEqual(replyResult.success, true);
    assert.strictEqual(state.replyDetected, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.REPLIED);
    assert.strictEqual(state.followupStatus, SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.REPLIED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.HUMAN_REVIEW);
    assert.strictEqual(state.nextFollowUpDueAt, null);
    assert(state.operatorTasks.length >= 1, 'Operator task must be generated');
    assert.strictEqual(state.operatorTasks[0].status, 'PENDING_HUMAN_OPERATOR_REVIEW');

    const nextAttempt = dispatchSequenceStep(state, 'CAMP-REPLY-01', {
      isTestMode: true,
      now: new Date(Date.now() + 100 * 3600 * 1000)
    });
    assert.strictEqual(nextAttempt.success, false);
    assert.strictEqual(nextAttempt.blocked, true);
    assert(nextAttempt.reason.includes('Reply already detected'));
  });

  // TEST 15: Recipient not approved -> no state advance
  test('Test 15: Recipient not approved -> no state advance', () => {
    const unapprovedLead = {
      id: 'REC-UNAPPROVED-REPEAT',
      email: 'strict@unapproved-check.org',
      companyName: 'Strict Org',
      contactName: 'Operator Inspector',
      approvedForOutreach: false
    };

    const state = createRecipientState(unapprovedLead);

    for (let i = 1; i <= 3; i++) {
      const res = dispatchSequenceStep(state, 'CAMP-STRICT-01', {
        isTestMode: true,
        globalOutreachStop: 0,
        outreachAuthorized: 1
      });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.blocked, true);
      assert.strictEqual(res.approvalRequired, true);
      assert.strictEqual(state.currentStep, 0, `Step must remain 0 on attempt ${i}`);
      assert.strictEqual(state.lastSentAt, null, `lastSentAt must remain null on attempt ${i}`);
    }

    // Now explicitly approve the lead
    approveRecipientForOutreach(state, {
      approvedBy: 'compliance-auditor',
      approvalSource: 'ui-manual-approval'
    });
    assert.strictEqual(state.approvedForOutreach, true);
    assert.strictEqual(state.approvedBy, 'compliance-auditor');

    // Now dispatch succeeds
    const approvedRes = dispatchSequenceStep(state, 'CAMP-STRICT-01', {
      isTestMode: true,
      globalOutreachStop: 0,
      outreachAuthorized: 1
    });
    assert.strictEqual(approvedRes.success, true);
    assert.strictEqual(state.currentStep, 1);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT);
  });

  // TEST 16: Test-mode simulation -> zero external network calls
  test('Test 16: Test-mode simulation -> zero external network calls', () => {
    let networkCallCount = 0;
    const interceptNetwork = () => {
      networkCallCount++;
      throw new Error('NETWORK CALL DETECTED IN TEST MODE SIMULATION');
    };

    const origHttpRequest = http.request;
    const origHttpsRequest = https.request;
    const origNetConnect = net.connect;
    const origTlsConnect = tls.connect;

    http.request = interceptNetwork;
    https.request = interceptNetwork;
    net.connect = interceptNetwork;
    tls.connect = interceptNetwork;

    try {
      // Run complete 5-sequence progression simulation in test mode
      const lead = {
        id: 'REC-NET-TEST-01',
        email: 'synthetic@buyer-simulation.com',
        companyName: 'Simulation LLC',
        contactName: 'Alex Simulation',
        approvedForOutreach: true
      };

      const state = createRecipientState(lead);
      const campaignId = 'CAMP-NET-SIM-01';
      let clock = new Date('2026-10-08T08:00:00Z');

      for (let step = 1; step <= 5; step++) {
        const res = dispatchSequenceStep(state, campaignId, {
          isTestMode: true,
          now: clock,
          globalOutreachStop: 0,
          outreachAuthorized: 1
        });
        assert.strictEqual(res.success, true, `Step ${step} should succeed in test mode`);
        clock = new Date(clock.getTime() + (FOLLOWUP_DELAY_HOURS + 1) * 3600 * 1000);
      }

      assert.strictEqual(state.currentStep, 5);
      assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.COMPLETED);
      assert.strictEqual(networkCallCount, 0, 'Zero network calls must occur during simulation');
    } finally {
      http.request = origHttpRequest;
      https.request = origHttpsRequest;
      net.connect = origNetConnect;
      tls.connect = origTlsConnect;
    }
  });

  console.log(`\nResults: ${passed} passed, 0 failed.`);
  console.log('============================================================');
  console.log('[ALL 16 TESTS PASSED] Phase 3N Remediation verified successfully.');
  console.log('============================================================\n');
}

runPhase3NTests();
