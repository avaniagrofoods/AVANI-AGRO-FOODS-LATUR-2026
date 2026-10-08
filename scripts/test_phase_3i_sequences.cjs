// ============================================================
// AVANI AGRO FOODS — Phase 3I Sequence State Machine & Simulations
// scripts/test_phase_3i_sequences.cjs
//
// Tests:
// 1. Five-sequence mapping and rendering (SEQ-01 to SEQ-05)
// 2. Export Trade Co-Ordinator positioning in all sequences
// 3. Section 10: Reply detection simulation -> stops automated follow-ups immediately
//    - reply_detected = true
//    - followup_status = STOPPED_REPLY_RECEIVED
//    - lead_status = REPLIED
//    - next_action = HUMAN_REVIEW
//    - Operator task created
// 4. Section 11: No-Reply simulation (72h intervals)
//    - Step 1: EMAIL 1 sent
//    - Step 2: 72h later -> EMAIL 2 sent
//    - Step 3: 72h later -> EMAIL 3 sent
//    - Step 4: 72h later -> EMAIL 4 sent
//    - Step 5: 72h later -> EMAIL 5 sent
//    - Step 6: sequence_status = COMPLETED, no EMAIL 6 exists
// 5. Idempotency prevents duplicate dispatch
// 6. Fail-closed safety: unauthorized dispatch blocked
// 7. Fail-closed safety: global outreach stop blocks dispatch
// 8. Opt-out permanently suppresses recipient
// 9. Bounce stops sequence and records suppression
// ============================================================

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
  EMAIL_SEQUENCES,
  SENDER_IDENTITY,
  renderSequenceEmail
} = require('../api/_lib/emailSequences.js');

const {
  FOLLOWUP_DELAY_HOURS,
  SEQUENCE_STATUSES,
  LEAD_STATUSES,
  NEXT_ACTIONS,
  generateIdempotencyKey,
  createRecipientState,
  dispatchSequenceStep,
  handleIncomingReply,
  handleOptOut,
  handleBounce
} = require('../api/_lib/sequenceStateMachine.js');

function runTests() {
  console.log('============================================================');
  console.log('TEST SUITE: Phase 3I — Email Sequences, State Machine & Safety');
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

  // 1. Verify Exactly 5 Sequences Exist
  test('1. Exactly five email sequences exist (SEQ-01 to SEQ-05)', () => {
    const seqKeys = Object.keys(EMAIL_SEQUENCES);
    assert.strictEqual(seqKeys.length, 5, `Expected 5 sequences, found ${seqKeys.length}`);
    assert.deepStrictEqual(seqKeys, ['SEQ-01', 'SEQ-02', 'SEQ-03', 'SEQ-04', 'SEQ-05']);
  });

  // 2. Verify Export Trade Co-Ordinator Positioning Across All Sequences
  test('2. All 5 sequences enforce "Export Trade Co-Ordinator" and zero producer claims', () => {
    const prohibitedWords = [/we manufacture/i, /our factory/i, /our farm/i, /certified producer/i, /guaranteed capacity/i];
    Object.values(EMAIL_SEQUENCES).forEach(seq => {
      assert(seq.bodyText.includes('Export Trade Co-Ordinator'), `Sequence ${seq.sequenceId} missing Export Trade Co-Ordinator`);
      assert(seq.bodyText.includes('Latur-413512'), `Sequence ${seq.sequenceId} missing Latur postal address`);
      assert(seq.bodyText.includes('UNSUBSCRIBE'), `Sequence ${seq.sequenceId} missing UNSUBSCRIBE`);
      assert(seq.bodyText.includes('subject to confirmation with the manufacturing/processing partner'), `Sequence ${seq.sequenceId} missing partner disclaimer`);
      prohibitedWords.forEach(pw => {
        assert(!pw.test(seq.bodyText), `Sequence ${seq.sequenceId} contains prohibited pattern: ${pw}`);
      });
    });
  });

  // 3. Section 10: Reply Test Simulation
  test('3. Section 10: Incoming Reply stops all automated follow-ups immediately', () => {
    const recipient = {
      id: 'REC-TEST-OWNED',
      email: 'avaniagrofoods1356@gmail.com',
      companyName: 'Avani Agro Foods Test Desk',
      contactName: 'Sachin Shinde',
      approvedForOutreach: true
    };

    const state = createRecipientState(recipient);
    const campaignId = 'PHASE3I-DELIVERABILITY-TEST-001';

    // Dispatch EMAIL 1 in test mode
    const d1 = dispatchSequenceStep(state, campaignId, { isTestMode: true, now: new Date('2026-10-04T07:00:00Z') });
    assert.strictEqual(d1.success, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT);
    assert.strictEqual(state.currentStep, 1);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.AWAIT_REPLY_OR_DELAY);
    assert(state.nextFollowUpDueAt !== null, 'Follow-up date should be scheduled');

    // Customer replies from owned mailbox
    const replyEvent = {
      from: 'avaniagrofoods1356@gmail.com',
      subject: 'Re: AVANI AGRO FOODS — Phase 3I Email Delivery Test',
      body: 'Thank you for reaching out. Please send over your Moringa specification sheet.',
      timestamp: '2026-10-04T07:15:00Z'
    };

    const replyResult = handleIncomingReply(state, replyEvent);
    assert.strictEqual(replyResult.replyDetected, true);
    assert.strictEqual(state.replyDetected, true);
    assert.strictEqual(state.followupStatus, SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.REPLIED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.HUMAN_REVIEW);
    assert.strictEqual(state.nextFollowUpDueAt, null, 'Next follow up due date must be cleared upon reply');
    assert.strictEqual(state.operatorTasks.length, 1, 'Operator task must be generated');
    assert.strictEqual(state.operatorTasks[0].status, 'PENDING_HUMAN_OPERATOR_REVIEW');

    // Attempting to send follow-up after reply must fail-close
    const nextAttempt = dispatchSequenceStep(state, campaignId, { isTestMode: true, now: new Date('2026-10-07T08:00:00Z') });
    assert.strictEqual(nextAttempt.success, false);
    assert.strictEqual(nextAttempt.blocked, true);
    assert(nextAttempt.reason.includes('Reply already detected'));
  });

  // 4. Section 11: No-Reply 72-Hour Progression Simulation through EMAIL 5 -> COMPLETED
  test('4. Section 11: No-Reply workflow progresses at 72h intervals through SEQ-05 and COMPLETED', () => {
    const synthRecipient = {
      id: 'REC-SYNTH-001',
      email: 'prospect@synthetic-buyer-test.com',
      companyName: 'Global Botanicals Inc',
      contactName: 'Procurement Director',
      approvedForOutreach: true
    };

    const state = createRecipientState(synthRecipient);
    const campaignId = 'PHASE3I-SIMULATION-NOREPLY-001';

    let clock = new Date('2026-10-04T08:00:00Z');

    // Step 1: Send EMAIL 1
    const s1 = dispatchSequenceStep(state, campaignId, { isTestMode: true, now: clock });
    assert.strictEqual(s1.success, true);
    assert.strictEqual(s1.step, 'EMAIL_1');
    assert.strictEqual(s1.sequenceId, 'SEQ-01');
    assert.strictEqual(state.currentStep, 1);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.EMAIL_1_SENT);

    // Attempt to dispatch before 72 hours (e.g. 24 hours later) -> must be blocked
    clock = new Date(clock.getTime() + 24 * 60 * 60 * 1000);
    const premature = dispatchSequenceStep(state, campaignId, { isTestMode: true, now: clock });
    assert.strictEqual(premature.success, false);
    assert.strictEqual(premature.timingBlocked, true);
    assert(premature.reason.includes('72-hour follow-up delay has not elapsed'));

    // Step 2: 72 hours after EMAIL 1 -> EMAIL 2 sent
    clock = new Date('2026-10-04T08:00:00Z').getTime() + 72 * 60 * 60 * 1000;
    clock = new Date(clock);
    const s2 = dispatchSequenceStep(state, campaignId, { isTestMode: true, now: clock });
    assert.strictEqual(s2.success, true);
    assert.strictEqual(s2.step, 'EMAIL_2');
    assert.strictEqual(s2.sequenceId, 'SEQ-02');
    assert.strictEqual(state.currentStep, 2);

    // Step 3: 72 hours after EMAIL 2 -> EMAIL 3 sent
    clock = new Date(clock.getTime() + 72 * 60 * 60 * 1000);
    const s3 = dispatchSequenceStep(state, campaignId, { isTestMode: true, now: clock });
    assert.strictEqual(s3.success, true);
    assert.strictEqual(s3.step, 'EMAIL_3');
    assert.strictEqual(s3.sequenceId, 'SEQ-03');
    assert.strictEqual(state.currentStep, 3);

    // Step 4: 72 hours after EMAIL 3 -> EMAIL 4 sent
    clock = new Date(clock.getTime() + 72 * 60 * 60 * 1000);
    const s4 = dispatchSequenceStep(state, campaignId, { isTestMode: true, now: clock });
    assert.strictEqual(s4.success, true);
    assert.strictEqual(s4.step, 'EMAIL_4');
    assert.strictEqual(s4.sequenceId, 'SEQ-04');
    assert.strictEqual(state.currentStep, 4);

    // Step 5: 72 hours after EMAIL 4 -> EMAIL 5 sent (Polite close / thank-you)
    clock = new Date(clock.getTime() + 72 * 60 * 60 * 1000);
    const s5 = dispatchSequenceStep(state, campaignId, { isTestMode: true, now: clock });
    assert.strictEqual(s5.success, true);
    assert.strictEqual(s5.step, 'EMAIL_5');
    assert.strictEqual(s5.sequenceId, 'SEQ-05');
    assert.strictEqual(state.currentStep, 5);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.COMPLETED);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.COMPLETED_NO_REPLY);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED);
    assert.strictEqual(state.nextFollowUpDueAt, null);

    // Step 6: Verify no EMAIL 6 can ever be sent
    clock = new Date(clock.getTime() + 72 * 60 * 60 * 1000);
    const s6 = dispatchSequenceStep(state, campaignId, { isTestMode: true, now: clock });
    assert.strictEqual(s6.success, false);
    assert.strictEqual(s6.blocked, true);
    assert(s6.reason.includes('completed'));
  });

  // 5. Idempotency Key Duplicate Block
  test('5. Idempotency key prevents duplicate dispatch on retry or page refresh', () => {
    const recipient = { id: 'REC-DUP-01', email: 'dup@test.com', companyName: 'Dup Co', contactName: 'Buyer', approvedForOutreach: true };
    const state = createRecipientState(recipient);
    const campaignId = 'CAMP-DUP-01';

    const d1 = dispatchSequenceStep(state, campaignId, { isTestMode: true });
    assert.strictEqual(d1.success, true);

    // Attempting same step immediately
    const dDuplicate = dispatchSequenceStep(state, campaignId, { isTestMode: true });
    assert.strictEqual(dDuplicate.success, false);
    // Blocked by delay or duplicate check
    assert(dDuplicate.duplicate || dDuplicate.timingBlocked);
  });

  // 6. Fail-closed Safety: Real Outreach Blocked When Authorization is 0
  test('6. Fail-closed: Real outreach fails closed when outreachAuthorized = false', () => {
    const recipient = { id: 'BUYER-REAL-01', email: 'external@realbuyer.com', companyName: 'Real Buyer', contactName: 'Head Buyer', approvedForOutreach: true };
    const state = createRecipientState(recipient);
    const campaignId = 'CAMP-REAL-01';

    // In production mode (isTestMode = false) with outreachAuthorized = false
    const realSend = dispatchSequenceStep(state, campaignId, {
      isTestMode: false,
      outreachAuthorized: false,
      globalOutreachStop: 0
    });
    assert.strictEqual(realSend.success, false);
    assert.strictEqual(realSend.blocked, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_UNAUTHORIZED);
  });

  // 7. Fail-closed Safety: Real Outreach Blocked When GLOBAL_OUTREACH_STOP = 1
  test('7. Fail-closed: Real outreach fails closed when globalOutreachStop = 1', () => {
    const recipient = { id: 'BUYER-REAL-02', email: 'external2@realbuyer.com', companyName: 'Real Buyer 2', contactName: 'Head Buyer', approvedForOutreach: true };
    const state = createRecipientState(recipient);
    const campaignId = 'CAMP-REAL-02';

    // In production mode with globalOutreachStop = true
    const realSend = dispatchSequenceStep(state, campaignId, {
      isTestMode: false,
      outreachAuthorized: true, // Even if mistakenly set to true!
      globalOutreachStop: true
    });
    assert.strictEqual(realSend.success, false);
    assert.strictEqual(realSend.blocked, true);
    assert.strictEqual(state.sequenceStatus, SEQUENCE_STATUSES.STOPPED_GLOBAL_STOP);
  });

  // 8. Opt-out Permanently Suppresses Recipient
  test('8. Opt-out permanently suppresses recipient and clears follow-up', () => {
    const recipient = { id: 'REC-OPTOUT-01', email: 'optout@buyer.com', companyName: 'Opt Co', contactName: 'Buyer', approvedForOutreach: true };
    const state = createRecipientState(recipient);
    dispatchSequenceStep(state, 'CAMP-OPTOUT', { isTestMode: true });

    const optResult = handleOptOut(state, { reason: 'User requested UNSUBSCRIBE' });
    assert.strictEqual(optResult.success, true);
    assert.strictEqual(state.followupStatus, SEQUENCE_STATUSES.STOPPED_OPT_OUT);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.UNSUBSCRIBED);
    assert.strictEqual(state.nextAction, NEXT_ACTIONS.PERMANENT_SUPPRESSION);
    assert.strictEqual(state.nextFollowUpDueAt, null);
  });

  // 9. Bounce Handling
  test('9. Bounce stops sequence and records permanent suppression', () => {
    const recipient = { id: 'REC-BOUNCE-01', email: 'bounce@buyer.com', companyName: 'Bounce Co', contactName: 'Buyer', approvedForOutreach: true };
    const state = createRecipientState(recipient);
    dispatchSequenceStep(state, 'CAMP-BOUNCE', { isTestMode: true });

    const bounceResult = handleBounce(state, { type: 'Permanent 550 Mailbox Not Found' });
    assert.strictEqual(bounceResult.success, true);
    assert.strictEqual(state.followupStatus, SEQUENCE_STATUSES.STOPPED_BOUNCE);
    assert.strictEqual(state.leadStatus, LEAD_STATUSES.BOUNCED);
    assert.strictEqual(state.nextFollowUpDueAt, null);
  });

  console.log(`\nResults: ${passed} passed, 0 failed.`);
  console.log('[ALL TESTS PASSED] Phase 3I Sequence State Machine & Simulations verified.');
}

runTests();
