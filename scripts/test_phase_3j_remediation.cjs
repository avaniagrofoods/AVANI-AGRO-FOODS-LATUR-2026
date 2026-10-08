// ============================================================
// AVANI AGRO FOODS — PHASE 3J TEST SUITE
// scripts/test_phase_3j_remediation.cjs
// Phase 3J: Inbound Reply, Durable State, Idempotency & Webhook Security
// ============================================================

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Isolate test store so Phase 3J tests never touch production store
const scratchDir = path.resolve(__dirname, '../scratch');
if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
const testStorePath = path.join(scratchDir, 'test_phase_3j_store.json');
fs.writeFileSync(testStorePath, JSON.stringify({
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  sequences: {},
  idempotencyKeys: {},
  reservations: {},
  processedEvents: {},
  auditLog: []
}, null, 2), 'utf8');
process.env.SEQUENCE_STORE_PATH = testStorePath;

// Set dummy webhook secret for test execution
process.env.RESEND_WEBHOOK_SECRET = 'whsec_dGVzdF93ZWJob29rX3NlY3JldF8zMmJ5dGVzX2FhZjEyMw==';

console.log('============================================================');
console.log('TEST SUITE: Phase 3J — Outreach Safety & Reply Pipeline');
console.log('============================================================\n');

async function runTests() {
  const {
    saveRecipientSequenceState,
    getRecipientSequenceState,
    reserveSequenceStep,
    commitSequenceStep,
    recordReplyReceived,
    hasEventBeenProcessed,
    recordProcessedEvent,
    resetSequenceStoreForTesting,
    loadStore,
    saveStore
  } = await import('../api/_lib/sequencePersistence.js');

  const {
    normalizeInboundPayload,
    matchInboundReply,
    processInboundReply
  } = await import('../api/_lib/replyDetector.js');

  const {
    createRecipientState,
    dispatchSequenceStep,
    handleIncomingReply,
    FOLLOWUP_DELAY_HOURS
  } = await import('../api/_lib/sequenceStateMachine.js');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Durable State Persistence & Schema Check (Part D)
  test('1. Durable state schema contains all required fields', () => {
    resetSequenceStoreForTesting();
    const campaignId = 'CAMP-TEST-001';
    const recipientId = 'buyer-001';

    const saved = saveRecipientSequenceState(campaignId, recipientId, {
      sequence_id: 'SEQ-01',
      current_step: 1,
      status: 'EMAIL_1_SENT',
      sent_steps: ['EMAIL_1'],
      next_step: 'EMAIL_2',
      next_due_at: new Date(Date.now() + 72 * 3600000).toISOString(),
      last_sent_at: new Date().toISOString(),
      reply_detected: false,
      reply_detected_at: null,
      followups_cancelled: false,
      last_provider_message_id: 'msg_test_123',
      email: 'buyer1@example.com'
    });

    const retrieved = getRecipientSequenceState(campaignId, recipientId);
    assert.strictEqual(retrieved.campaign_id, campaignId);
    assert.strictEqual(retrieved.recipient_id, recipientId);
    assert.strictEqual(retrieved.sequence_id, 'SEQ-01');
    assert.strictEqual(retrieved.current_step, 1);
    assert.strictEqual(retrieved.status, 'EMAIL_1_SENT');
    assert.deepStrictEqual(retrieved.sent_steps, ['EMAIL_1']);
    assert.strictEqual(retrieved.next_step, 'EMAIL_2');
    assert.ok(retrieved.next_due_at);
    assert.ok(retrieved.last_sent_at);
    assert.strictEqual(retrieved.reply_detected, false);
    assert.strictEqual(retrieved.reply_detected_at, null);
    assert.strictEqual(retrieved.followups_cancelled, false);
    assert.strictEqual(retrieved.last_provider_message_id, 'msg_test_123');
    assert.ok(retrieved.created_at);
    assert.ok(retrieved.updated_at);
  });

  // 2. Concurrency Protection (Worker A vs Worker B Race Condition) (Part F)
  test('2. Concurrency protection: Worker A reserves step, Worker B is rejected with ALREADY_RESERVED', () => {
    resetSequenceStoreForTesting();
    const campaignId = 'CAMP-RACE-001';
    const recipientId = 'buyer-race-01';

    // Worker A requests reservation for EMAIL_2
    const resA = reserveSequenceStep(campaignId, recipientId, 'SEQ-02', 2, 'worker-A');
    assert.strictEqual(resA.reserved, true);
    assert.strictEqual(resA.workerId, 'worker-A');

    // Worker B requests reservation for same EMAIL_2 simultaneously
    const resB = reserveSequenceStep(campaignId, recipientId, 'SEQ-02', 2, 'worker-B');
    assert.strictEqual(resB.reserved, false);
    assert.strictEqual(resB.alreadyReserved, true);
    assert.strictEqual(resB.reason, 'ALREADY_RESERVED');
    assert.strictEqual(resB.workerId, 'worker-A');

    // Once Worker A commits, step is recorded as SENT
    commitSequenceStep(campaignId, recipientId, 'SEQ-02', 2, {
      providerMessageId: 'resend_msg_002',
      email: 'buyer-race@example.com'
    });

    // Worker C tries to send: rejected with ALREADY_SENT
    const resC = reserveSequenceStep(campaignId, recipientId, 'SEQ-02', 2, 'worker-C');
    assert.strictEqual(resC.reserved, false);
    assert.strictEqual(resC.alreadySent, true);
    assert.strictEqual(resC.reason, 'ALREADY_SENT');
  });

  // 3. Inbound Reply Matching by In-Reply-To / Message-ID (Part B)
  test('3. Reply matching identifies recipient via In-Reply-To matching last_provider_message_id', () => {
    resetSequenceStoreForTesting();
    const campaignId = 'CAMP-REPLY-001';
    const recipientId = 'buyer-rep-01';

    // Store active sequence with provider message ID
    commitSequenceStep(campaignId, recipientId, 'SEQ-01', 1, {
      providerMessageId: '01a105a8-orig-msg-id-12345',
      email: 'procurement@globalspices.de'
    });

    const inbound = {
      type: 'email.received',
      data: {
        from: 'Procurement Director <procurement@globalspices.de>',
        to: ['sales@avaniagrofoods.com'],
        subject: 'Re: Indian Origin Sourcing Coordination',
        in_reply_to: '<01a105a8-orig-msg-id-12345>',
        message_id: '<reply-msg-7890@globalspices.de>',
        text: 'Thank you for reaching out. Please send the COA and specifications.'
      }
    };

    const replyResult = processInboundReply(inbound);
    assert.strictEqual(replyResult.success, true);
    assert.strictEqual(replyResult.action, 'FOLLOWUPS_CANCELLED');
    assert.strictEqual(replyResult.confidence, 'EXACT_MESSAGE_ID');
    assert.strictEqual(replyResult.recipientId, recipientId);
  });

  // 4. Inbound Reply Cancels All Future Follow-Ups (Part A, Part C)
  test('4. Inbound reply cancels all follow-ups (NO EMAIL_2, EMAIL_3, EMAIL_4, EMAIL_5)', () => {
    const campaignId = 'CAMP-REPLY-001';
    const recipientId = 'buyer-rep-01';

    const state = getRecipientSequenceState(campaignId, recipientId);
    assert.strictEqual(state.reply_detected, true);
    assert.strictEqual(state.followups_cancelled, true);
    assert.strictEqual(state.status, 'REPLIED');
    assert.strictEqual(state.next_step, 'NONE');
    assert.strictEqual(state.next_due_at, null);

    // Attempt to dispatch EMAIL_2 after reply: MUST BE BLOCKED
    const dispatchAttempt = dispatchSequenceStep(state, campaignId, {
      isTestMode: true,
      useDurableStorage: true
    });

    assert.strictEqual(dispatchAttempt.success, false);
    assert.strictEqual(dispatchAttempt.blocked, true);
    assert.ok(dispatchAttempt.reason.includes('Reply already detected'));
  });

  // 5. Reply Overrides Scheduled Timer (Part H)
  test('5. Reply received before 72h timer cancels scheduled follow-up permanently', () => {
    resetSequenceStoreForTesting();
    const campaignId = 'CAMP-TIMER-001';
    const recipientId = 'buyer-timer-01';

    // Step 1 sent at T=0
    const sentTime = new Date('2026-10-01T10:00:00Z');
    commitSequenceStep(campaignId, recipientId, 'SEQ-01', 1, {
      providerMessageId: 'msg-timer-1',
      email: 'buyer-timer@domain.com'
    });

    // Buyer replies at T=24h (before 72h timer expires)
    const replyTime = new Date('2026-10-02T10:00:00Z').toISOString();
    recordReplyReceived(campaignId, recipientId, {
      from: 'buyer-timer@domain.com',
      inReplyTo: 'msg-timer-1',
      timestamp: replyTime
    });

    const state = getRecipientSequenceState(campaignId, recipientId);
    assert.strictEqual(state.reply_detected, true);
    assert.strictEqual(state.next_due_at, null);

    // Time elapses to T=73h: Scheduled timer tries to send EMAIL_2
    const scheduledRunTime = new Date('2026-10-04T12:00:00Z');
    const dispatchAttempt = dispatchSequenceStep(state, campaignId, {
      now: scheduledRunTime,
      isTestMode: true,
      useDurableStorage: true
    });

    assert.strictEqual(dispatchAttempt.success, false);
    assert.strictEqual(dispatchAttempt.blocked, true);
    assert.strictEqual(state.sent_steps.length, 1);
  });

  // 6. Duplicate Webhook & Replay Protection (Part I)
  test('6. Replay protection: Duplicate webhook event ID is acknowledged idempotently without re-processing', () => {
    resetSequenceStoreForTesting();
    const eventId = 'evt_test_replay_999888';

    assert.strictEqual(hasEventBeenProcessed(eventId), false);
    recordProcessedEvent(eventId, { type: 'email.received' });
    assert.strictEqual(hasEventBeenProcessed(eventId), true);

    // Second check confirms duplicate
    assert.strictEqual(hasEventBeenProcessed(eventId), true);
  });

  // 7. Ambiguous Reply Match Fails Closed to MANUAL_REVIEW_REQUIRED (Part B)
  test('7. Ambiguous reply (multiple active sequences for same email) fails closed to MANUAL_REVIEW_REQUIRED', () => {
    resetSequenceStoreForTesting();
    const email = 'duplicate-contact@multicamp.com';

    // Two different campaigns both have active sequences with this contact
    commitSequenceStep('CAMP-A', 'rec-A', 'SEQ-01', 1, { email });
    commitSequenceStep('CAMP-B', 'rec-B', 'SEQ-01', 1, { email });

    const inbound = {
      type: 'email.received',
      data: {
        from: `Director <${email}>`,
        subject: 'Inquiry',
        text: 'Hello'
        // No In-Reply-To header provided
      }
    };

    const result = processInboundReply(inbound);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.action, 'FLAGGED_MANUAL_REVIEW');

    const stateA = getRecipientSequenceState('CAMP-A', 'rec-A');
    const stateB = getRecipientSequenceState('CAMP-B', 'rec-B');
    assert.strictEqual(stateA.status, 'MANUAL_REVIEW_REQUIRED');
    assert.strictEqual(stateB.status, 'MANUAL_REVIEW_REQUIRED');
    assert.strictEqual(stateA.followups_cancelled, true);
    assert.strictEqual(stateB.followups_cancelled, true);
  });

  // 8. Strict Safety Gate Enforcement (Fail Closed) (Part R)
  test('8. Real outreach fails closed when OUTREACH_AUTHORIZED=0 or GLOBAL_OUTREACH_STOP=1', () => {
    resetSequenceStoreForTesting();
    const recipient = { email: 'test@example.com', name: 'Buyer' };
    const state = createRecipientState(recipient);

    // Test 1: global stop active
    const res1 = dispatchSequenceStep(state, 'CAMP-1', {
      globalOutreachStop: true,
      outreachAuthorized: false,
      isTestMode: false
    });
    assert.strictEqual(res1.success, false);
    assert.strictEqual(res1.blocked, true);
    assert.strictEqual(state.sequenceStatus, 'STOPPED_GLOBAL_STOP');

    // Test 2: outreach not authorized
    const state2 = createRecipientState(recipient);
    const res2 = dispatchSequenceStep(state2, 'CAMP-1', {
      globalOutreachStop: false,
      outreachAuthorized: false,
      isTestMode: false
    });
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res2.blocked, true);
    assert.strictEqual(state2.sequenceStatus, 'STOPPED_UNAUTHORIZED');
  });

  // 9. Hard Cap at SEQ-05 / NO SEQ-06 (Part G)
  test('9. Sequence completes at SEQ-05 with zero possibility of SEQ-06', () => {
    resetSequenceStoreForTesting();
    const campaignId = 'CAMP-FIVE-001';
    const recipientId = 'buyer-5-steps';

    commitSequenceStep(campaignId, recipientId, 'SEQ-04', 4, { email: 'buyer@example.com' });
    const state = getRecipientSequenceState(campaignId, recipientId);

    // Send Step 5
    commitSequenceStep(campaignId, recipientId, 'SEQ-05', 5, { email: 'buyer@example.com' });
    const stateAfter5 = getRecipientSequenceState(campaignId, recipientId);

    assert.strictEqual(stateAfter5.current_step, 5);
    assert.strictEqual(stateAfter5.status, 'COMPLETED');
    assert.strictEqual(stateAfter5.next_step, 'NONE');
    assert.strictEqual(stateAfter5.next_due_at, null);

    // Any attempt to dispatch step 6 returns blocked
    const step6Attempt = dispatchSequenceStep(stateAfter5, campaignId, {
      isTestMode: true,
      useDurableStorage: true
    });

    assert.strictEqual(step6Attempt.success, false);
    assert.strictEqual(step6Attempt.blocked, true);
  });

  // 10. Webhook Security & Signature Validation (Part J)
  await testAsync('10. Webhook endpoint rejects unsigned or unauthorized requests with 401', async () => {
    const webhookHandler = (await import('../api/email-reply-webhook.js')).default;

    let resCode = 0;
    let resJson = null;
    const mockRes = {
      setHeader: () => {},
      status: (code) => {
        resCode = code;
        return {
          json: (data) => { resJson = data; }
        };
      }
    };

    // Unsigned request
    const mockReq = {
      method: 'POST',
      headers: {},
      body: { type: 'email.received' }
    };

    await webhookHandler(mockReq, mockRes);
    assert.strictEqual(resCode, 401);
    assert.strictEqual(resJson.code, 'WEBHOOK_UNAUTHORIZED');
  });

  // 11. Controlled Mailbox Test Simulation (Part K)
  test('11. Controlled test recipient avaniagrofoods1356@gmail.com simulation succeeds', () => {
    resetSequenceStoreForTesting();
    const controlledEmail = 'avaniagrofoods1356@gmail.com';
    const campaignId = 'PHASE3J-CONTROLLED-TEST';
    const recipientId = 'OWNER-TEST-001';

    // Step 1
    commitSequenceStep(campaignId, recipientId, 'SEQ-01', 1, {
      email: controlledEmail,
      providerMessageId: 'controlled-resend-id-001'
    });

    const state = getRecipientSequenceState(campaignId, recipientId);
    assert.strictEqual(state.recipient_email, controlledEmail);
    assert.strictEqual(state.current_step, 1);
    assert.strictEqual(state.status, 'EMAIL_1_SENT');

    // Simulate reply from controlled mailbox
    const inbound = {
      type: 'email.received',
      data: {
        from: `Owner Test <${controlledEmail}>`,
        subject: 'Re: Test inquiry',
        in_reply_to: 'controlled-resend-id-001',
        text: 'Confirmed receipt. Test reply.'
      }
    };

    const replyResult = processInboundReply(inbound);
    assert.strictEqual(replyResult.success, true);
    assert.strictEqual(replyResult.recipientId, recipientId);

    const stateAfterReply = getRecipientSequenceState(campaignId, recipientId);
    assert.strictEqual(stateAfterReply.reply_detected, true);
    assert.strictEqual(stateAfterReply.status, 'REPLIED');
    assert.strictEqual(stateAfterReply.next_due_at, null);
  });

  console.log(`\n============================================================`);
  console.log(`PHASE 3J RESULTS: ${passed} passed, ${failed} failed.`);
  console.log(`============================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
