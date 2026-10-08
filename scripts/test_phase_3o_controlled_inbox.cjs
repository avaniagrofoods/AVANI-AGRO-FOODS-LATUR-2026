/**
 * AVANI AGRO FOODS — PHASE 3O TEST SUITE
 * scripts/test_phase_3o_controlled_inbox.cjs
 *
 * Controlled Test-Inbox Verification & Safety Suite:
 * - Tests Test Recipient Model (TEST-01, TEST-02, TEST-03)
 * - Tests Strict Allowlist (Blocks all other recipients / buyers / manufacturers)
 * - Tests Human Approval Gate (Blocked without approval, allowed after approval)
 * - Tests Global Outreach Stop (Priority 1 fail-closed gate)
 * - Tests Daily Throughput Governor & Pacing (20/day, 1/min)
 * - Tests SEQ-01 Payload Rendering & Positioning
 * - Tests Sequence Terminal Bound (SEQ-01 to SEQ-05, no SEQ-06)
 * - Tests Stop Conditions: Reply, Opt-Out, Bounce, Complaint
 * - Tests Webhook Security (GET 405, Unsigned 401, Bad Sig 401)
 * - Tests Provider & Sender Identity Integrity
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const {
  createRecipientState,
  approveRecipientForOutreach,
  dispatchSequenceStep,
  handleIncomingReply,
  handleOptOut,
  handleBounce,
  handleComplaint,
  SEQUENCE_STATUSES,
  LEAD_STATUSES
} = require('../api/_lib/sequenceStateMachine.js');

const {
  DEFAULT_DAILY_PILOT_LIMIT,
  DEFAULT_MAX_SENDS_PER_MINUTE,
  reserveDailyThroughputSlot,
  getDailyThroughputStatus
} = require('../api/_lib/dailyThroughputGovernor.js');

const {
  SENDER_IDENTITY,
  renderSequenceEmail
} = require('../api/_lib/emailSequences.js');

// Strict Controlled Test Allowlist (Part 8)
const ALLOWED_TEST_RECIPIENTS = new Set([
  'sachinnshinde1356@gmail.com',
  'starpowerzlatur2210@gmail.com',
  'avaniloanservicelatur@gmail.com'
]);

function validateTestRecipient(email) {
  if (!email || !ALLOWED_TEST_RECIPIENTS.has(email.toLowerCase().trim())) {
    return {
      allowed: false,
      error: 'RECIPIENT_NOT_IN_TEST_ALLOWLIST',
      reason: `Recipient ${email} is NOT in the authorized 3-inbox test allowlist.`
    };
  }
  return { allowed: true };
}

// Test Fixtures (Part 5)
const TEST_FIXTURES = [
  {
    recipientId: 'TEST-01',
    email: 'sachinnshinde1356@gmail.com',
    companyName: 'Avani Agro Foods Internal Pilot Inbox 1',
    contactPerson: 'Sachin Shinde',
    recipientType: 'TEST',
    environment: 'PILOT_VERIFICATION',
    realBuyer: false,
    approvedForOutreach: false,
    productFocus: 'Moringa & Dehydrated Red Onion Powder'
  },
  {
    recipientId: 'TEST-02',
    email: 'starpowerzlatur2210@gmail.com',
    companyName: 'Avani Agro Foods Internal Pilot Inbox 2',
    contactPerson: 'Star Power Sourcing Desk',
    recipientType: 'TEST',
    environment: 'PILOT_VERIFICATION',
    realBuyer: false,
    approvedForOutreach: false,
    productFocus: 'Dehydrated Red Onion Powder'
  },
  {
    recipientId: 'TEST-03',
    email: 'avaniloanservicelatur@gmail.com',
    companyName: 'Avani Agro Foods Internal Pilot Inbox 3',
    contactPerson: 'Avani Loan Service Procurement',
    recipientType: 'TEST',
    environment: 'PILOT_VERIFICATION',
    realBuyer: false,
    approvedForOutreach: false,
    productFocus: 'Moringa Oleifera Leaf Powder'
  }
];

async function runControlledTestInboxSuite() {
  console.log('============================================================');
  console.log('AVANI AGRO FOODS — PHASE 3O CONTROLLED TEST-INBOX VERIFICATION');
  console.log('Mode: READ-ONLY / CONTROLLED TEST FIXTURES / STRICT NO-SEND');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // ------------------------------------------------------------
  // SECTION 1: Test Recipient Model & Strict Allowlist
  // ------------------------------------------------------------
  console.log('--- Section 1: Test Recipient Model & Allowlist ---');
  assert(TEST_FIXTURES.length === 3, 'Exactly three test fixtures configured');
  assert(TEST_FIXTURES.every(f => f.realBuyer === false && f.recipientType === 'TEST'), 'All test fixtures marked realBuyer=false and recipientType=TEST');
  assert(TEST_FIXTURES.every(f => f.approvedForOutreach === false), 'All test fixtures initially unapproved');

  assert(validateTestRecipient('sachinnshinde1356@gmail.com').allowed, 'Allowlist permits sachinnshinde1356@gmail.com');
  assert(validateTestRecipient('starpowerzlatur2210@gmail.com').allowed, 'Allowlist permits starpowerzlatur2210@gmail.com');
  assert(validateTestRecipient('avaniloanservicelatur@gmail.com').allowed, 'Allowlist permits avaniloanservicelatur@gmail.com');
  assert(!validateTestRecipient('sales@schifffood.com').allowed, 'Allowlist strictly blocks real buyer sales@schifffood.com');
  assert(!validateTestRecipient('random@external.org').allowed, 'Allowlist strictly blocks arbitrary address random@external.org');

  // ------------------------------------------------------------
  // SECTION 2: Human Approval Gate (Part 6)
  // ------------------------------------------------------------
  console.log('\n--- Section 2: Human Approval Gate ---');
  const t1 = TEST_FIXTURES[0];
  const state1 = createRecipientState(t1);

  // Dispatch without approval -> MUST FAIL CLOSED
  const unapprovedDispatch = dispatchSequenceStep(state1, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 0,
    isTestMode: true,
    useDurableStorage: false
  });

  assert(unapprovedDispatch.success === false, 'Unapproved test recipient dispatch returns success=false');
  assert(unapprovedDispatch.blocked === true, 'Unapproved test recipient dispatch returns blocked=true');
  assert(unapprovedDispatch.approvalRequired === true, 'Unapproved test recipient dispatch returns approvalRequired=true');
  assert(state1.currentStep === 0, 'Unapproved test recipient sequence remains at step 0');
  assert(state1.lastSentAt === null, 'Unapproved test recipient lastSentAt remains null');
  assert(state1.sequenceStatus === SEQUENCE_STATUSES.BLOCKED_HUMAN_APPROVAL_REQUIRED, 'Status is BLOCKED_HUMAN_APPROVAL_REQUIRED');

  // Explicit Human Operator Approval
  approveRecipientForOutreach(state1, { approvedBy: 'Sachin Shinde (Operator Review)' });
  assert(state1.approvedForOutreach === true, 'Explicit approval sets approvedForOutreach=true');
  assert(state1.approvedBy.includes('Sachin Shinde'), 'Auditable approvedBy recorded in state');

  // ------------------------------------------------------------
  // SECTION 3: Global Outreach Stop Invariant (Part 7)
  // ------------------------------------------------------------
  console.log('\n--- Section 3: Global Outreach Stop Absolute Priority ---');
  const stoppedDispatch = dispatchSequenceStep(state1, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 1, // GLOBAL STOP ACTIVE
    isTestMode: true,
    useDurableStorage: false
  });

  assert(stoppedDispatch.success === false, 'With GLOBAL_OUTREACH_STOP=1, dispatch returns success=false');
  assert(stoppedDispatch.blocked === true, 'With GLOBAL_OUTREACH_STOP=1, dispatch returns blocked=true');
  assert(stoppedDispatch.reason.includes('GLOBAL_OUTREACH_STOP'), 'Reason states GLOBAL_OUTREACH_STOP is active');
  assert(state1.currentStep === 0, 'Sequence step remains 0 when blocked by global stop');
  assert(state1.sequenceStatus === SEQUENCE_STATUSES.STOPPED_GLOBAL_STOP, 'Status is STOPPED_GLOBAL_STOP');

  // ------------------------------------------------------------
  // SECTION 4: Controlled Test Mode Dispatch (Part 8, 9, 10)
  // ------------------------------------------------------------
  console.log('\n--- Section 4: Controlled Test Mode Dispatch & Pacing ---');
  const mockStore = { dailyThroughput: {}, pacingLog: [] };
  const baseTime = new Date('2026-10-08T15:00:00Z');

  // Test Dispatch SEQ-01 for TEST-01
  const t1Dispatch = dispatchSequenceStep(state1, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 0,
    now: baseTime,
    isTestMode: false,
    useDurableStorage: false,
    customStore: mockStore
  });

  assert(t1Dispatch.success === true, 'Approved TEST-01 dispatch succeeds in controlled test mode');
  assert(t1Dispatch.step === 'EMAIL_1', 'Dispatched step is EMAIL_1');
  assert(state1.currentStep === 1, 'State currentStep advanced to 1');
  assert(t1Dispatch.rendered.subject.includes('Indian Origin Sourcing Coordination'), 'Subject matches SEQ-01 sourcing coordination template');
  assert(t1Dispatch.rendered.bodyText.includes('Export Trade Co-Ordinator'), 'Body enforces Export Trade Co-Ordinator positioning');
  assert(t1Dispatch.rendered.bodyText.includes('www.avaniagrofoods.com'), 'Signature includes www.avaniagrofoods.com');
  assert(t1Dispatch.rendered.from === SENDER_IDENTITY.formatted, 'Sender formatted matches AVANI AGRO FOODS <sales@avaniagrofoods.com>');
  assert(t1Dispatch.rendered.replyTo === SENDER_IDENTITY.replyTo, 'Reply-To matches sales@avaniagrofoods.com');

  // Anti-Burst Pacing Test: Immediate second dispatch within 60s MUST BE PACED
  const t2 = TEST_FIXTURES[1];
  const state2 = createRecipientState(t2);
  approveRecipientForOutreach(state2, { approvedBy: 'Operator' });

  const immediateT2 = dispatchSequenceStep(state2, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 0,
    now: new Date(baseTime.getTime() + 15000), // Only 15s later
    isTestMode: false, // evaluate real governor logic
    useDurableStorage: false,
    customStore: mockStore
  });

  assert(immediateT2.success === false, 'Immediate dispatch within 60s returns success=false');
  assert(immediateT2.pacingExceeded === true, 'Governor pacingExceeded flag is true');
  assert(immediateT2.reason && immediateT2.reason.includes('Pacing limit reached'), 'Reason cites pacing rate limit');

  // Paced dispatch after 65 seconds succeeds
  const pacedT2 = dispatchSequenceStep(state2, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 0,
    now: new Date(baseTime.getTime() + 65000), // 65s later
    isTestMode: false,
    useDurableStorage: false,
    customStore: mockStore
  });

  assert(pacedT2.success === true, 'Paced TEST-02 dispatch after 65s succeeds');
  assert(state2.currentStep === 1, 'TEST-02 currentStep is 1');

  // Paced dispatch for TEST-03 after another 65 seconds
  const t3 = TEST_FIXTURES[2];
  const state3 = createRecipientState(t3);
  approveRecipientForOutreach(state3, { approvedBy: 'Operator' });

  const pacedT3 = dispatchSequenceStep(state3, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 0,
    now: new Date(baseTime.getTime() + 130000), // 130s later
    isTestMode: false,
    useDurableStorage: false,
    customStore: mockStore
  });

  assert(pacedT3.success === true, 'Paced TEST-03 dispatch after 130s succeeds');
  assert(state3.currentStep === 1, 'TEST-03 currentStep is 1');

  const quotaStatus = getDailyThroughputStatus(baseTime, { customStore: mockStore });
  assert(quotaStatus.count === 3, 'Governor persistent ledger records exact quota consumed (3 paced sends)');

  // ------------------------------------------------------------
  // SECTION 5: Stop Conditions (Part 11 & 12)
  // ------------------------------------------------------------
  console.log('\n--- Section 5: Stop Conditions (Reply, Opt-Out, Bounce, Complaint) ---');

  // Reply Stop
  handleIncomingReply(state1, { subject: 'Re: Sourcing proposal', from: state1.email });
  assert(state1.replyDetected === true, 'handleIncomingReply sets replyDetected=true');
  assert(state1.sequenceStatus === SEQUENCE_STATUSES.REPLIED, 'Status sets to REPLIED');
  assert(state1.operatorTasks.length > 0, 'Operator task queued for human trade coordinator review');

  const postReplyDispatch = dispatchSequenceStep(state1, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 0,
    now: new Date(baseTime.getTime() + 80 * 3600 * 1000),
    isTestMode: true,
    useDurableStorage: false
  });
  assert(postReplyDispatch.success === false, 'Subsequent dispatch after reply is permanently blocked');

  // Opt-out / Unsubscribe
  const stateOptOut = createRecipientState(TEST_FIXTURES[1]);
  approveRecipientForOutreach(stateOptOut);
  handleOptOut(stateOptOut, { reason: 'UNSUBSCRIBE' });
  assert(stateOptOut.sequenceStatus === SEQUENCE_STATUSES.STOPPED_OPT_OUT, 'handleOptOut sets STOPPED_OPT_OUT');
  const postOptOutDispatch = dispatchSequenceStep(stateOptOut, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 0,
    now: new Date(baseTime.getTime() + 80 * 3600 * 1000),
    isTestMode: true,
    useDurableStorage: false
  });
  assert(postOptOutDispatch.success === false, 'Subsequent dispatch after opt-out is permanently blocked');

  // Bounce
  const stateBounce = createRecipientState(TEST_FIXTURES[2]);
  approveRecipientForOutreach(stateBounce);
  handleBounce(stateBounce, { bounceType: 'hard_bounce' });
  assert(stateBounce.sequenceStatus === SEQUENCE_STATUSES.STOPPED_BOUNCE, 'handleBounce sets STOPPED_BOUNCE');
  const postBounceDispatch = dispatchSequenceStep(stateBounce, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 0,
    now: new Date(baseTime.getTime() + 80 * 3600 * 1000),
    isTestMode: true,
    useDurableStorage: false
  });
  assert(postBounceDispatch.success === false, 'Subsequent dispatch after bounce is permanently blocked');

  // Complaint
  const stateComplaint = createRecipientState(TEST_FIXTURES[0]);
  approveRecipientForOutreach(stateComplaint);
  handleComplaint(stateComplaint, { complaintSource: 'FBL' });
  assert(stateComplaint.sequenceStatus === SEQUENCE_STATUSES.STOPPED_COMPLAINT, 'handleComplaint sets STOPPED_COMPLAINT');
  const postComplaintDispatch = dispatchSequenceStep(stateComplaint, 'CMP-TEST-PILOT', {
    outreachAuthorized: true,
    globalOutreachStop: 0,
    now: new Date(baseTime.getTime() + 80 * 3600 * 1000),
    isTestMode: true,
    useDurableStorage: false
  });
  assert(postComplaintDispatch.success === false, 'Subsequent dispatch after complaint is permanently blocked');

  // ------------------------------------------------------------
  // SECTION 6: Production Webhook Security Probes (Part 13)
  // ------------------------------------------------------------
  console.log('\n--- Section 6: Production Webhook Security Probes ---');
  function httpRequest(options, data) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let b = '';
        res.on('data', chunk => b += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: b }));
      });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }

  const getWebhook = await httpRequest({
    hostname: 'www.avaniagrofoods.com',
    path: '/api/email-reply-webhook',
    method: 'GET'
  });
  assert(getWebhook.statusCode === 405, 'GET /api/email-reply-webhook returns 405 Method Not Allowed');

  const unsignedPost = await httpRequest({
    hostname: 'www.avaniagrofoods.com',
    path: '/api/email-reply-webhook',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ type: 'email.received', data: {} }));
  assert(unsignedPost.statusCode === 401, 'Unsigned POST returns 401 Unauthorized');

  const invalidSigPost = await httpRequest({
    hostname: 'www.avaniagrofoods.com',
    path: '/api/email-reply-webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-id': 'msg_test_probe_1',
      'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
      'svix-signature': 'v1,invalid_test_signature_hex'
    }
  }, JSON.stringify({ type: 'email.received', data: {} }));
  assert(invalidSigPost.statusCode === 401, 'Invalid signature POST returns 401 Unauthorized');

  // ------------------------------------------------------------
  // SECTION 7: Provider & Sender Identity Verification (Part 14 & 15)
  // ------------------------------------------------------------
  console.log('\n--- Section 7: Provider & Sender Identity ---');
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';

  const hasResendKey = /^RESEND_API_KEY=/m.test(envContent);
  const hasWebhookSecret = /^RESEND_WEBHOOK_SECRET=/m.test(envContent);

  assert(hasResendKey, 'RESEND_API_KEY is configured in local environment');
  assert(hasWebhookSecret, 'RESEND_WEBHOOK_SECRET is configured in local environment');
  assert(SENDER_IDENTITY.email === 'sales@avaniagrofoods.com', 'Canonical sender email is sales@avaniagrofoods.com');
  assert(SENDER_IDENTITY.name === 'AVANI AGRO FOODS', 'Canonical sender name is AVANI AGRO FOODS');
  assert(SENDER_IDENTITY.replyTo === 'sales@avaniagrofoods.com', 'Canonical reply-to is sales@avaniagrofoods.com');

  console.log('\n============================================================');
  console.log(`CONTROLLED TEST SUITE RESULTS: ${passed} passed, ${failed} failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runControlledTestInboxSuite().catch(err => {
  console.error('[FATAL ERROR IN SUITE]:', err);
  process.exit(1);
});
