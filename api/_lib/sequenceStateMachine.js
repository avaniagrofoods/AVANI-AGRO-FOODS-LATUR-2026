// ============================================================
// AVANI AGRO FOODS — Email Workflow State Machine & Scheduler
// api/_lib/sequenceStateMachine.js
// Phase 3J: Deterministic Reply / No-Reply State Machine & Persistent Sync
//
// Rules & Timing:
// - FOLLOWUP_DELAY_HOURS = 72
// - Reply stops all automated follow-ups immediately:
//     reply_detected = true
//     followup_status = 'STOPPED_REPLY_RECEIVED'
//     lead_status = 'REPLIED'
//     next_action = 'HUMAN_REVIEW'
// - No-reply advances through SEQ-01 -> SEQ-02 -> SEQ-03 -> SEQ-04 -> SEQ-05 -> COMPLETED
// - EMAIL 5 is polite close / thank-you, after which sequence_status = COMPLETED (No EMAIL 6)
// - Idempotency key: campaign_id + recipient_id + sequence_id + step
// - Global outreach stop: fail-closed safety gate
// ============================================================

import crypto from 'crypto';
import { EMAIL_SEQUENCES, renderSequenceEmail } from './emailSequences.js';
import {
  reserveSequenceStep,
  commitSequenceStep,
  saveRecipientSequenceState,
  getRecipientSequenceState,
  recordReplyReceived,
  releaseReservation,
  generateStepIdempotencyKey,
  reserveSequenceStepDistributed,
  commitSequenceStepDistributed,
  releaseReservationDistributed,
  getRecipientSequenceStateDistributed,
  saveRecipientSequenceStateDistributed,
  saveDispatchIntentDistributed,
  getDispatchIntentDistributed,
  updateDispatchIntentStatusDistributed,
  reconcileSecondaryIndexesDistributed,
  commitReconciledSequenceStepDistributed,
  getKvConfig,
  execKVCommand,
  resolveCanonicalRecipientEmail,
  maskEmail,
  isProductionOrVercelRuntime
} from './sequencePersistence.js';
import {
  reserveDailyThroughputSlot,
  releaseDailyThroughputSlot,
  reserveDailyThroughputSlotDistributed,
  latchReservationInFlightDistributed,
  releasePacingLockDistributed,
  getDailyThroughputStatus,
  DEFAULT_DAILY_PILOT_LIMIT,
  DEFAULT_MAX_SENDS_PER_MINUTE
} from './dailyThroughputGovernor.js';

export const FOLLOWUP_DELAY_HOURS = 72;

export const SEQUENCE_STATUSES = {
  PROSPECT: 'PROSPECT',
  EMAIL_1_SENT: 'EMAIL_1_SENT',
  WAITING_REPLY: 'WAITING_REPLY',
  REPLIED: 'REPLIED',
  HUMAN_REVIEW: 'HUMAN_REVIEW',
  WAIT_72_HOURS: 'WAIT_72_HOURS',
  EMAIL_2_SENT: 'EMAIL_2_SENT',
  EMAIL_3_SENT: 'EMAIL_3_SENT',
  EMAIL_4_SENT: 'EMAIL_4_SENT',
  EMAIL_5_SENT: 'EMAIL_5_SENT',
  COMPLETED: 'COMPLETED',
  STOPPED_REPLY_RECEIVED: 'STOPPED_REPLY_RECEIVED',
  STOPPED_OPT_OUT: 'STOPPED_OPT_OUT',
  STOPPED_BOUNCE: 'STOPPED_BOUNCE',
  STOPPED_COMPLAINT: 'STOPPED_COMPLAINT',
  STOPPED_DUPLICATE: 'STOPPED_DUPLICATE',
  STOPPED_INVALID: 'STOPPED_INVALID',
  STOPPED_GLOBAL_STOP: 'STOPPED_GLOBAL_STOP',
  STOPPED_UNAUTHORIZED: 'STOPPED_UNAUTHORIZED',
  BLOCKED_HUMAN_APPROVAL_REQUIRED: 'BLOCKED_HUMAN_APPROVAL_REQUIRED',
  BLOCKED_DAILY_LIMIT: 'BLOCKED_DAILY_LIMIT',
  BLOCKED_PACING: 'BLOCKED_PACING',
  MANUAL_REVIEW_REQUIRED: 'MANUAL_REVIEW_REQUIRED',
  UNCERTAIN_DISPATCH: 'UNCERTAIN_DISPATCH'
};


export const LEAD_STATUSES = {
  NEW: 'NEW',
  OUTREACH_PENDING: 'OUTREACH_PENDING',
  OUTREACH_ACTIVE: 'OUTREACH_ACTIVE',
  REPLIED: 'REPLIED',
  UNSUBSCRIBED: 'UNSUBSCRIBED',
  BOUNCED: 'BOUNCED',
  COMPLETED_NO_REPLY: 'COMPLETED_NO_REPLY',
  SUPPRESSED: 'SUPPRESSED',
  MANUAL_REVIEW: 'MANUAL_REVIEW'
};

export const NEXT_ACTIONS = {
  AWAIT_REPLY_OR_DELAY: 'AWAIT_REPLY_OR_DELAY',
  SEND_NEXT_SEQUENCE: 'SEND_NEXT_SEQUENCE',
  HUMAN_REVIEW: 'HUMAN_REVIEW',
  PERMANENT_SUPPRESSION: 'PERMANENT_SUPPRESSION',
  NONE_SEQUENCE_COMPLETED: 'NONE_SEQUENCE_COMPLETED'
};

/**
 * Generate unique idempotency key
 */
export function generateIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber) {
  if (!campaignId || !recipientId || !sequenceId) {
    throw new Error('campaignId, recipientId, and sequenceId are required for idempotency');
  }
  return generateStepIdempotencyKey(campaignId, recipientId, sequenceId, stepNumber);
}

/**
 * Initialize a recipient state for a sequence campaign
 */
export function createRecipientState(recipient) {
  const recipientId = recipient.id || recipient.recipientId || recipient.email;
  const isApproved = Boolean(recipient.approvedForOutreach === true);
  return {
    recipientId,
    email: recipient.email,
    companyName: recipient.companyName || recipient.name,
    contactName: recipient.contactPerson || recipient.contactName || 'Procurement Executive',
    currentSequenceId: null,
    currentStep: 0,
    sequenceStatus: SEQUENCE_STATUSES.PROSPECT,
    leadStatus: LEAD_STATUSES.NEW,
    followupStatus: 'ACTIVE',
    replyDetected: false,
    repliedAt: null,
    lastSentAt: null,
    nextFollowUpDueAt: null,
    nextAction: NEXT_ACTIONS.SEND_NEXT_SEQUENCE,
    approvedForOutreach: isApproved,
    approvedBy: recipient.approvedBy || null,
    approvedAt: recipient.approvedAt || null,
    approvalSource: recipient.approvalSource || null,
    history: [],
    dispatchedKeys: new Set(),
    operatorTasks: []
  };
}

/**
 * Explicit Human Approval Gate (CTRL-HUMAN-APPROVAL-PER-LEAD)
 * Grants per-recipient approval required before SEQ-01 dispatch.
 */
export function approveRecipientForOutreach(state, options = {}) {
  const nowIso = options.now instanceof Date
    ? options.now.toISOString()
    : (options.now || new Date().toISOString());

  state.approvedForOutreach = true;
  state.approvedBy = options.approvedBy || 'human-operator';
  state.approvedAt = options.approvedAt || nowIso;
  state.approvalSource = options.approvalSource || 'manual-review';

  state.history.push({
    event: 'RECIPIENT_APPROVED_FOR_OUTREACH',
    approvedBy: state.approvedBy,
    approvedAt: state.approvedAt,
    approvalSource: state.approvalSource,
    timestamp: nowIso
  });

  return state;
}

/**
 * Dispatch next sequence step for a recipient (in-memory & durable)
 */
export const advanceSequenceStep = (state, campaignId, options) => dispatchSequenceStep(state, campaignId, options);

export function dispatchSequenceStep(state, campaignId, options = {}) {
  // Support both (state, campaignId, options) and (state, options)
  let resolvedCampaignId = campaignId;
  let resolvedOptions = options;
  if (typeof campaignId === 'object' && campaignId !== null) {
    resolvedOptions = campaignId;
    resolvedCampaignId = resolvedOptions.campaignId || 'DEFAULT_CAMPAIGN';
  } else if (!resolvedCampaignId) {
    resolvedCampaignId = 'DEFAULT_CAMPAIGN';
  }
  const opts = resolvedOptions || {};

  const {
    now = new Date(),
    isTestMode = false,
    dispatchedStorage = new Set(),
    useDurableStorage = false,
    workerId = 'worker-1',
    configuredLimit,
    configuredPacing,
    trackTestQuota = false,
    customStore = null
  } = opts;

  // Worker ID validation if explicitly supplied
  if (opts.workerId !== undefined) {
    if (typeof opts.workerId !== 'string') {
      return {
        success: false,
        blocked: true,
        error: 'INVALID_WORKER_ID',
        reason: 'Supplied workerId must be a string matching /^[a-zA-Z0-9_-]{1,64}$/'
      };
    }
    const trimmedWorker = opts.workerId.trim();
    if (trimmedWorker.length === 0 || !/^[a-zA-Z0-9_-]{1,64}$/.test(trimmedWorker)) {
      return {
        success: false,
        blocked: true,
        error: 'INVALID_WORKER_ID',
        reason: 'Supplied workerId must be non-empty, max 64 characters, and match /^[a-zA-Z0-9_-]{1,64}$/'
      };
    }
  }

  const nowIso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();

  // 0. Production Runtime Guard: Local file-based sequence dispatch forbidden in production
  if (isProductionOrVercelRuntime()) {
    return {
      success: false,
      blocked: true,
      error: 'PRODUCTION_LOCAL_DISPATCH_FORBIDDEN',
      reason: 'Local file-based sequence dispatch must never execute in production runtime. Use distributed dispatch.'
    };
  }

  // Resolve authoritative server-side gates: caller options may NARROW, never BROADEN authority
  const isIsolatedTest = process.env.SEQUENCE_TEST_ISOLATION === '1';
  const envGlobalStop = (isIsolatedTest && opts._testMockGlobalStop !== undefined)
    ? String(opts._testMockGlobalStop).trim()
    : process.env.GLOBAL_OUTREACH_STOP;
  const envOutreachAuth = (isIsolatedTest && opts._testMockOutreachAuthorized !== undefined)
    ? String(opts._testMockOutreachAuthorized).trim()
    : process.env.OUTREACH_AUTHORIZED;

  let isGlobalStopActive;
  if (envGlobalStop !== undefined && envGlobalStop !== null) {
    const envStopEngaged = String(envGlobalStop).trim() !== '0';
    const callerAssertsStop = Boolean(opts.globalOutreachStop === true || opts.globalOutreachStop === 1 || opts.globalOutreachStop === '1');
    isGlobalStopActive = envStopEngaged || callerAssertsStop;
  } else if (opts.globalOutreachStop !== undefined) {
    isGlobalStopActive = Boolean(opts.globalOutreachStop === true || opts.globalOutreachStop === 1 || opts.globalOutreachStop === '1');
  } else {
    isGlobalStopActive = true; // FAIL CLOSED: Unset GLOBAL_OUTREACH_STOP must always default to STOPPED
  }

  let isOutreachAuthorized;
  if (envOutreachAuth !== undefined && envOutreachAuth !== null) {
    const envAuthGranted = String(envOutreachAuth).trim() === '1';
    const callerDeniesAuth = (opts.outreachAuthorized === false || opts.outreachAuthorized === 0 || opts.outreachAuthorized === '0');
    isOutreachAuthorized = envAuthGranted && !callerDeniesAuth;
  } else if (opts.outreachAuthorized !== undefined) {
    isOutreachAuthorized = Boolean(opts.outreachAuthorized === true || opts.outreachAuthorized === 1 || opts.outreachAuthorized === '1');
  } else {
    isOutreachAuthorized = false; // FAIL CLOSED: Unset OUTREACH_AUTHORIZED must always default to UNAUTHORIZED
  }

  // 1. Safety Gate: Global Outreach Stop (TOP PRIORITY - FAIL CLOSED)
  if (isGlobalStopActive) {
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_GLOBAL_STOP;
    state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
    state.history.push({
      event: 'DISPATCH_BLOCKED',
      reason: 'GLOBAL_OUTREACH_STOP is active',
      timestamp: nowIso
    });
    return { success: false, blocked: true, reason: 'GLOBAL_OUTREACH_STOP is active' };
  }

  // 1b. Safety Gate: Authorization Gate (FAIL CLOSED)
  if (!isOutreachAuthorized) {
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_UNAUTHORIZED;
    state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
    state.history.push({
      event: 'DISPATCH_BLOCKED',
      reason: 'OUTREACH_NOT_AUTHORIZED',
      timestamp: nowIso
    });
    return { success: false, blocked: true, reason: 'OUTREACH_NOT_AUTHORIZED' };
  }

  // 2. Stop conditions check: Reply, Opt-Out, Bounce, Complaint, Completed
  if (state.replyDetected || state.followups_cancelled || state.sequenceStatus === SEQUENCE_STATUSES.REPLIED || state.sequenceStatus === SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED) {
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED;
    state.followupStatus = SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED;
    state.nextAction = NEXT_ACTIONS.HUMAN_REVIEW;
    state.nextFollowUpDueAt = null;
    return { success: false, blocked: true, reason: 'Reply already detected from recipient. All follow-ups cancelled.' };
  }

  if (state.sequenceStatus === SEQUENCE_STATUSES.STOPPED_OPT_OUT || state.leadStatus === LEAD_STATUSES.UNSUBSCRIBED) {
    return { success: false, blocked: true, reason: 'Recipient opted out. Sequence permanently stopped.' };
  }

  if (state.sequenceStatus === SEQUENCE_STATUSES.STOPPED_BOUNCE || state.leadStatus === LEAD_STATUSES.BOUNCED) {
    return { success: false, blocked: true, reason: 'Email bounced. Sequence permanently stopped.' };
  }

  if (state.sequenceStatus === SEQUENCE_STATUSES.STOPPED_COMPLAINT) {
    return { success: false, blocked: true, reason: 'Spam complaint recorded. Sequence permanently stopped.' };
  }

  if (state.sequenceStatus === SEQUENCE_STATUSES.COMPLETED) {
    return { success: false, blocked: true, reason: 'Sequence already completed (SEQ-05 finished)' };
  }

  // Determine which sequence step to send (Hard cap at 5: NO SEQ-06)
  const nextStepNum = state.currentStep + 1;
  if (nextStepNum > 5) {
    state.sequenceStatus = SEQUENCE_STATUSES.COMPLETED;
    state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
    return { success: false, blocked: true, reason: 'No sequence step beyond SEQ-05 exists' };
  }

  // 3. Mandatory Per-Recipient Human Approval Gate for SEQ-01 (CTRL-HUMAN-APPROVAL-PER-LEAD)
  const isApproved = Boolean(state.approvedForOutreach === true || opts.approvedForOutreach === true);
  if (nextStepNum === 1 && !isApproved) {
    state.sequenceStatus = SEQUENCE_STATUSES.BLOCKED_HUMAN_APPROVAL_REQUIRED;
    state.history.push({
      event: 'DISPATCH_BLOCKED',
      reason: 'BLOCKED_HUMAN_APPROVAL_REQUIRED',
      recipientId: state.recipientId,
      timestamp: nowIso
    });
    return {
      success: false,
      blocked: true,
      approvalRequired: true,
      reason: 'BLOCKED_HUMAN_APPROVAL_REQUIRED: Explicit per-recipient human operator approval required before SEQ-01.'
    };
  }

  const sequenceId = `SEQ-0${nextStepNum}`;
  const idempotencyKey = generateIdempotencyKey(resolvedCampaignId, state.recipientId, sequenceId, nextStepNum);

  // 4. Concurrency Protection & Durable Reservation
  let reservation = null;
  if (useDurableStorage) {
    reservation = reserveSequenceStep(resolvedCampaignId, state.recipientId, sequenceId, nextStepNum, workerId);
    if (!reservation || !reservation.reserved || !reservation.leaseToken) {
      if (reservation?.alreadySent) {
        state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_DUPLICATE;
        return { success: false, duplicate: true, reason: 'ALREADY_SENT', idempotencyKey };
      }
      if (reservation?.alreadyReserved) {
        return { success: false, reserved: false, reason: 'ALREADY_RESERVED', workerId: reservation?.workerId, idempotencyKey };
      }
      return { success: false, blocked: true, reason: reservation?.reason || 'RESERVATION_FAILED_MISSING_LEASE_TOKEN' };
    }
  }

  // 4b. In-memory Idempotency Check
  if (state.dispatchedKeys && (state.dispatchedKeys.has(idempotencyKey) || dispatchedStorage.has(idempotencyKey))) {
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_DUPLICATE;
    state.history.push({
      event: 'DISPATCH_SKIPPED_DUPLICATE',
      idempotencyKey,
      timestamp: nowIso
    });
    if (useDurableStorage) releaseReservation(idempotencyKey);
    return { success: false, duplicate: true, reason: 'Duplicate dispatch prevented by idempotency key' };
  }

  // 5. Check 72-hour delay if not step 1
  if (state.currentStep > 0 && state.lastSentAt) {
    const hoursSinceLast = (nowMs - new Date(state.lastSentAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLast < FOLLOWUP_DELAY_HOURS) {
      if (useDurableStorage) releaseReservation(idempotencyKey);
      return {
        success: false,
        timingBlocked: true,
        hoursRemaining: FOLLOWUP_DELAY_HOURS - hoursSinceLast,
        reason: `72-hour follow-up delay has not elapsed (${hoursSinceLast.toFixed(1)}h / 72h)`
      };
    }
  }

  // 5b. Resolve and Validate Canonical Recipient Email (Fail-closed before quota reservation/rendering)
  const emailValidation = resolveCanonicalRecipientEmail(state);
  if (!emailValidation.valid) {
    if (useDurableStorage) releaseReservation(idempotencyKey);
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_INVALID;
    if (state.history) {
      state.history.push({
        event: 'DISPATCH_REJECTED_INVALID_EMAIL',
        error: emailValidation.error,
        reason: emailValidation.reason,
        timestamp: nowIso
      });
    }
    return {
      success: false,
      blocked: true,
      error: emailValidation.error,
      reason: emailValidation.reason
    };
  }
  const canonicalEmail = emailValidation.canonicalEmail;
  state.email = canonicalEmail;

  // 6. Daily Throughput Governor & Pacing Check (CTRL-RATE-LIMIT)
  const quotaResult = reserveDailyThroughputSlot({
    now,
    configuredLimit,
    configuredPacing,
    workerId,
    isTestMode,
    trackTestQuota,
    customStore
  });

  if (!quotaResult.allowed) {
    if (useDurableStorage) releaseReservation(idempotencyKey);
    if (quotaResult.quotaExceeded) {
      state.sequenceStatus = SEQUENCE_STATUSES.BLOCKED_DAILY_LIMIT;
    } else if (quotaResult.pacingExceeded) {
      state.sequenceStatus = SEQUENCE_STATUSES.BLOCKED_PACING;
    } else {
      state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_INVALID;
    }
    state.history.push({
      event: 'DISPATCH_BLOCKED_GOVERNOR',
      reason: quotaResult.reason,
      error: quotaResult.error || null,
      timestamp: nowIso
    });
    return {
      success: false,
      blocked: true,
      ...quotaResult
    };
  }

  // 7. Render payload with strictly verified "Export Trade Co-Ordinator" positioning
  const rendered = renderSequenceEmail(sequenceId, {
    contact_name: state.contactName,
    company_name: state.companyName,
    email: canonicalEmail
  });

  // 8. Update State
  if (state.dispatchedKeys) {
    state.dispatchedKeys.add(idempotencyKey);
  }
  dispatchedStorage.add(idempotencyKey);
  state.currentSequenceId = sequenceId;
  state.currentStep = nextStepNum;
  state.lastSentAt = nowIso;

  if (nextStepNum === 1) {
    state.sequenceStatus = SEQUENCE_STATUSES.EMAIL_1_SENT;
    state.leadStatus = LEAD_STATUSES.OUTREACH_ACTIVE;
  } else if (nextStepNum === 2) {
    state.sequenceStatus = SEQUENCE_STATUSES.EMAIL_2_SENT;
  } else if (nextStepNum === 3) {
    state.sequenceStatus = SEQUENCE_STATUSES.EMAIL_3_SENT;
  } else if (nextStepNum === 4) {
    state.sequenceStatus = SEQUENCE_STATUSES.EMAIL_4_SENT;
  } else if (nextStepNum === 5) {
    state.sequenceStatus = SEQUENCE_STATUSES.COMPLETED;
    state.leadStatus = LEAD_STATUSES.COMPLETED_NO_REPLY;
    state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
    state.followupStatus = 'COMPLETED';
    state.nextFollowUpDueAt = null;
  }

  if (nextStepNum < 5) {
    const nextDue = new Date(nowMs + FOLLOWUP_DELAY_HOURS * 60 * 60 * 1000);
    state.nextFollowUpDueAt = nextDue.toISOString();
    state.nextAction = NEXT_ACTIONS.AWAIT_REPLY_OR_DELAY;
  }

  state.history.push({
    event: 'SEQUENCE_DISPATCHED',
    sequenceId,
    step: `EMAIL_${nextStepNum}`,
    idempotencyKey,
    reservationId: quotaResult.reservationId || null,
    timestamp: nowIso
  });

  // 9. Commit to Durable Storage if enabled
  if (useDurableStorage) {
    if (!reservation || !reservation.leaseToken) {
      state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_INVALID;
      return {
        success: false,
        fencingViolation: true,
        reason: 'FENCING_VIOLATION: Missing local reservation or lease token before commit'
      };
    }
    const payloadDigest = crypto.createHash('sha256').update(JSON.stringify(rendered)).digest('hex');
    const commitResult = commitSequenceStep(resolvedCampaignId, state.recipientId, sequenceId, nextStepNum, {
      workerId: workerId,
      leaseToken: reservation.leaseToken,
      email: canonicalEmail,
      companyName: state.companyName,
      contactName: state.contactName,
      providerMessageId: opts.providerMessageId || null,
      payloadDigest
    });

    if (commitResult && commitResult.committed === false) {
      state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_INVALID;
      state.history.push({
        event: 'COMMIT_FAILED',
        reason: commitResult.reason,
        fencingViolation: Boolean(commitResult.fencingViolation),
        leaseExpired: Boolean(commitResult.leaseExpired),
        timestamp: nowIso
      });
      // Policy O-02: dispatch attempt recorded; do NOT refund quota on commit failure.
      return {
        success: false,
        fencingViolation: Boolean(commitResult.fencingViolation),
        leaseExpired: Boolean(commitResult.leaseExpired),
        reason: commitResult.reason,
        error: commitResult.reason
      };
    }
  }

  return {
    success: true,
    sequenceId,
    step: `EMAIL_${nextStepNum}`,
    idempotencyKey,
    rendered,
    quotaReservation: quotaResult,
    state
  };
}

/**
 * Handle incoming customer reply event
 */
export function handleIncomingReply(state, replyEvent = {}) {
  const now = replyEvent.timestamp || new Date().toISOString();

  state.replyDetected = true;
  state.repliedAt = now;
  state.followupStatus = SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED;
  state.leadStatus = LEAD_STATUSES.REPLIED;
  state.sequenceStatus = SEQUENCE_STATUSES.REPLIED;
  state.nextAction = NEXT_ACTIONS.HUMAN_REVIEW;
  state.nextFollowUpDueAt = null; // Cancel any scheduled automated follow-up

  const task = {
    taskId: `TASK-${Date.now()}-${state.recipientId}`,
    type: 'INCOMING_BUYER_REPLY',
    recipientId: state.recipientId,
    email: state.email,
    companyName: state.companyName,
    subject: replyEvent.subject || 'Buyer Reply Received',
    preview: replyEvent.body || 'Customer response received',
    status: 'PENDING_HUMAN_OPERATOR_REVIEW',
    createdAt: now
  };

  state.operatorTasks = state.operatorTasks || [];
  state.operatorTasks.push(task);

  state.history.push({
    event: 'REPLY_RECEIVED',
    replyEvent,
    timestamp: now,
    actionTaken: 'ALL_AUTOMATED_FOLLOWUPS_CANCELLED'
  });

  // Sync to durable persistent store if campaignId available
  const campaignId = replyEvent.campaignId || state.campaignId;
  if (campaignId && state.recipientId) {
    recordReplyReceived(campaignId, state.recipientId, {
      from: replyEvent.from || state.email,
      subject: replyEvent.subject || '',
      inReplyTo: replyEvent.inReplyTo || '',
      messageId: replyEvent.messageId || '',
      timestamp: now
    });
  }

  return {
    success: true,
    replyDetected: true,
    followupStatus: SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED,
    leadStatus: LEAD_STATUSES.REPLIED,
    nextAction: NEXT_ACTIONS.HUMAN_REVIEW,
    operatorTask: task,
    state
  };
}

/**
 * Handle opt-out / unsubscribe event
 */
export function handleOptOut(state, optOutEvent = {}) {
  const now = optOutEvent.timestamp || new Date().toISOString();

  state.followupStatus = SEQUENCE_STATUSES.STOPPED_OPT_OUT;
  state.leadStatus = LEAD_STATUSES.UNSUBSCRIBED;
  state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_OPT_OUT;
  state.nextAction = NEXT_ACTIONS.PERMANENT_SUPPRESSION;
  state.nextFollowUpDueAt = null;

  state.history.push({
    event: 'OPT_OUT_RECEIVED',
    optOutEvent,
    timestamp: now,
    actionTaken: 'PERMANENTLY_SUPPRESSED'
  });

  return {
    success: true,
    followupStatus: SEQUENCE_STATUSES.STOPPED_OPT_OUT,
    leadStatus: LEAD_STATUSES.UNSUBSCRIBED,
    nextAction: NEXT_ACTIONS.PERMANENT_SUPPRESSION,
    state
  };
}

/**
 * Handle delivery bounce event
 */
export function handleBounce(state, bounceEvent = {}) {
  const now = bounceEvent.timestamp || new Date().toISOString();

  state.followupStatus = SEQUENCE_STATUSES.STOPPED_BOUNCE;
  state.leadStatus = LEAD_STATUSES.BOUNCED;
  state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_BOUNCE;
  state.nextAction = NEXT_ACTIONS.PERMANENT_SUPPRESSION;
  state.nextFollowUpDueAt = null;

  state.history.push({
    event: 'BOUNCE_RECEIVED',
    bounceEvent,
    timestamp: now,
    actionTaken: 'SUPPRESSED_DUE_TO_BOUNCE'
  });

  return {
    success: true,
    followupStatus: SEQUENCE_STATUSES.STOPPED_BOUNCE,
    leadStatus: LEAD_STATUSES.BOUNCED,
    state
  };
}

/**
 * Handle spam complaint event
 */
export function handleComplaint(state, complaintEvent = {}) {
  const now = complaintEvent.timestamp || new Date().toISOString();

  state.followupStatus = SEQUENCE_STATUSES.STOPPED_COMPLAINT;
  state.leadStatus = LEAD_STATUSES.SUPPRESSED;
  state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_COMPLAINT;
  state.nextAction = NEXT_ACTIONS.PERMANENT_SUPPRESSION;
  state.nextFollowUpDueAt = null;

  state.history.push({
    event: 'COMPLAINT_RECEIVED',
    complaintEvent,
    timestamp: now,
    actionTaken: 'SUPPRESSED_DUE_TO_SPAM_COMPLAINT'
  });

  return {
    success: true,
    followupStatus: SEQUENCE_STATUSES.STOPPED_COMPLAINT,
    leadStatus: LEAD_STATUSES.SUPPRESSED,
    state
  };
}

/**
 * Distributed Sequence Dispatch Orchestrator (Async)
 * Provides multi-phase transactional protocol across distributed serverless instances:
 * Phase 1: Pre-flight fail-closed safety gates (Global Stop, Authorization, Stop Conditions, 72h Delay, Human Approval Gate)
 * Phase 2: Atomic step reservation via Redis SET NX EX (reserveSequenceStepDistributed)
 * Phase 3: Late reply / cancellation check in distributed KV (aborts and releases lease if reply landed)
 * Phase 4: Daily throughput governor slot allocation (releases reservation on quota exhaustion)
 * Phase 5: External transmission execution (transmitterFn) with automatic reservation release on failure
 * Phase 6: Post-transmission fencing commit (commitSequenceStepDistributed) validating worker lease ownership
 */
export async function dispatchSequenceStepDistributed(state, campaignId = null, options = {}, transmitterFn = null) {
  let resolvedCampaignId = campaignId;
  let resolvedOptions = options;
  let resolvedTransmitter = transmitterFn;

  if (typeof campaignId === 'object' && campaignId !== null) {
    resolvedTransmitter = options;
    resolvedOptions = campaignId;
    resolvedCampaignId = resolvedOptions.campaignId || 'DEFAULT_CAMPAIGN';
  } else if (!resolvedCampaignId) {
    resolvedCampaignId = 'DEFAULT_CAMPAIGN';
  }
  const opts = resolvedOptions || {};
  const transmitter = typeof resolvedTransmitter === 'function'
    ? resolvedTransmitter
    : (typeof opts.transmitter === 'function' ? opts.transmitter : (typeof opts.transmitterFn === 'function' ? opts.transmitterFn : null));

  const {
    now = new Date(),
    isTestMode = false,
    dispatchedStorage = new Set(),
    workerId = 'worker-1',
    ttlSeconds = 300,
    configuredLimit,
    configuredPacing,
    trackTestQuota = false,
    customStore = null
  } = opts;

  // Worker ID validation if explicitly supplied
  if (opts.workerId !== undefined) {
    if (typeof opts.workerId !== 'string') {
      return {
        success: false,
        blocked: true,
        error: 'INVALID_WORKER_ID',
        reason: 'Supplied workerId must be a string matching /^[a-zA-Z0-9_-]{1,64}$/'
      };
    }
    const trimmedWorker = opts.workerId.trim();
    if (trimmedWorker.length === 0 || !/^[a-zA-Z0-9_-]{1,64}$/.test(trimmedWorker)) {
      return {
        success: false,
        blocked: true,
        error: 'INVALID_WORKER_ID',
        reason: 'Supplied workerId must be non-empty, max 64 characters, and match /^[a-zA-Z0-9_-]{1,64}$/'
      };
    }
  }

  const nowIso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();

  // Resolve authoritative server-side gates: caller options may NARROW, never BROADEN authority
  const isIsolatedTest = process.env.SEQUENCE_TEST_ISOLATION === '1';
  const envGlobalStop = (isIsolatedTest && opts._testMockGlobalStop !== undefined)
    ? String(opts._testMockGlobalStop).trim()
    : process.env.GLOBAL_OUTREACH_STOP;
  const envOutreachAuth = (isIsolatedTest && opts._testMockOutreachAuthorized !== undefined)
    ? String(opts._testMockOutreachAuthorized).trim()
    : process.env.OUTREACH_AUTHORIZED;

  // In distributed dispatch: unset env vars MUST strictly FAIL CLOSED.
  // GLOBAL_OUTREACH_STOP is active unless explicitly '0'. Unset -> stop engaged.
  // OUTREACH_AUTHORIZED requires explicit '1'. Unset -> unauthorized.
  // Caller may narrow (assert stop / deny auth), but can NEVER broaden authority.
  const envStopEngaged = (envGlobalStop !== undefined && envGlobalStop !== null)
    ? String(envGlobalStop).trim() !== '0'
    : true; // FAIL CLOSED: active unless explicitly '0'
  const callerAssertsStop = Boolean(opts.globalOutreachStop === true || opts.globalOutreachStop === 1 || opts.globalOutreachStop === '1');
  const isGlobalStopActive = envStopEngaged || callerAssertsStop;

  const envAuthGranted = (envOutreachAuth !== undefined && envOutreachAuth !== null)
    ? String(envOutreachAuth).trim() === '1'
    : false; // FAIL CLOSED: requires explicit '1'
  const callerDeniesAuth = (opts.outreachAuthorized === false || opts.outreachAuthorized === 0 || opts.outreachAuthorized === '0');
  const isOutreachAuthorized = envAuthGranted && !callerDeniesAuth;

  // 1. Safety Gate: Global Outreach Stop (TOP PRIORITY - FAIL CLOSED)
  if (isGlobalStopActive) {
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_GLOBAL_STOP;
    state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
    if (state.history) {
      state.history.push({
        event: 'DISPATCH_BLOCKED',
        reason: 'GLOBAL_OUTREACH_STOP is active',
        timestamp: nowIso
      });
    }
    return { success: false, blocked: true, reason: 'GLOBAL_OUTREACH_STOP is active' };
  }

  // 1b. Safety Gate: Authorization Gate (FAIL CLOSED)
  if (!isOutreachAuthorized) {
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_UNAUTHORIZED;
    state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
    if (state.history) {
      state.history.push({
        event: 'DISPATCH_BLOCKED',
        reason: 'OUTREACH_NOT_AUTHORIZED',
        timestamp: nowIso
      });
    }
    return { success: false, blocked: true, reason: 'OUTREACH_NOT_AUTHORIZED' };
  }

  // 2. Stop conditions check: Reply, Opt-Out, Bounce, Complaint, Completed
  if (state.replyDetected || state.reply_detected || state.followups_cancelled || state.sequenceStatus === SEQUENCE_STATUSES.REPLIED || state.sequenceStatus === SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED) {
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED;
    state.followupStatus = SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED;
    state.nextAction = NEXT_ACTIONS.HUMAN_REVIEW;
    state.nextFollowUpDueAt = null;
    return { success: false, blocked: true, reason: 'Reply already detected from recipient. All follow-ups cancelled.' };
  }

  if (state.sequenceStatus === SEQUENCE_STATUSES.STOPPED_OPT_OUT || state.leadStatus === LEAD_STATUSES.UNSUBSCRIBED) {
    return { success: false, blocked: true, reason: 'Recipient opted out. Sequence permanently stopped.' };
  }

  if (state.sequenceStatus === SEQUENCE_STATUSES.STOPPED_BOUNCE || state.leadStatus === LEAD_STATUSES.BOUNCED) {
    return { success: false, blocked: true, reason: 'Email bounced. Sequence permanently stopped.' };
  }

  if (state.sequenceStatus === SEQUENCE_STATUSES.STOPPED_COMPLAINT) {
    return { success: false, blocked: true, reason: 'Spam complaint recorded. Sequence permanently stopped.' };
  }

  if (state.sequenceStatus === SEQUENCE_STATUSES.COMPLETED) {
    return { success: false, blocked: true, reason: 'Sequence already completed (SEQ-05 finished)' };
  }

  // Determine which sequence step to send (Hard cap at 5: NO SEQ-06)
  const currentStepNum = state.currentStep !== undefined ? state.currentStep : (state.current_step || 0);
  const nextStepNum = currentStepNum + 1;
  if (nextStepNum > 5) {
    state.sequenceStatus = SEQUENCE_STATUSES.COMPLETED;
    state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
    return { success: false, blocked: true, reason: 'No sequence step beyond SEQ-05 exists' };
  }

  // 3. Mandatory Per-Recipient Human Approval Gate for SEQ-01 (CTRL-HUMAN-APPROVAL-PER-LEAD)
  const isApproved = Boolean(state.approvedForOutreach === true || opts.approvedForOutreach === true);
  if (nextStepNum === 1 && !isApproved) {
    state.sequenceStatus = SEQUENCE_STATUSES.BLOCKED_HUMAN_APPROVAL_REQUIRED;
    if (state.history) {
      state.history.push({
        event: 'DISPATCH_BLOCKED',
        reason: 'BLOCKED_HUMAN_APPROVAL_REQUIRED',
        recipientId: state.recipientId || state.recipient_id,
        timestamp: nowIso
      });
    }
    return {
      success: false,
      blocked: true,
      approvalRequired: true,
      reason: 'BLOCKED_HUMAN_APPROVAL_REQUIRED: Explicit per-recipient human operator approval required before SEQ-01.'
    };
  }

  // 4. Check 72-hour delay if not step 1
  const lastSentAt = state.lastSentAt || state.last_sent_at;
  if (currentStepNum > 0 && lastSentAt) {
    const hoursSinceLast = (nowMs - new Date(lastSentAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLast < FOLLOWUP_DELAY_HOURS) {
      return {
        success: false,
        timingBlocked: true,
        hoursRemaining: FOLLOWUP_DELAY_HOURS - hoursSinceLast,
        reason: `72-hour follow-up delay has not elapsed (${hoursSinceLast.toFixed(1)}h / 72h)`
      };
    }
  }

  const sequenceId = `SEQ-0${nextStepNum}`;
  const recipientId = state.recipientId || state.recipient_id;
  const idempotencyKey = generateStepIdempotencyKey(resolvedCampaignId, recipientId, sequenceId, nextStepNum);

  // 4b. Pre-Dispatch Dependency Check: Trusted Transmitter MUST be a function
  // Fail-closed before acquiring locks, reserving quota, or mutating state
  if (typeof transmitter !== 'function') {
    return {
      success: false,
      blocked: true,
      error: 'TRANSMITTER_REQUIRED',
      reason: 'A valid trusted transmitter function is required to execute sequence step dispatch.'
    };
  }

  // 5. Distributed Atomic Reservation (SET NX EX)
  const reservation = await reserveSequenceStepDistributed(resolvedCampaignId, recipientId, sequenceId, nextStepNum, workerId, ttlSeconds);
  if (!reservation.reserved) {
    if (reservation.alreadySent) {
      state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_DUPLICATE;
      return { success: false, duplicate: true, reason: 'ALREADY_SENT', idempotencyKey };
    }
    if (reservation.alreadyReserved) {
      return { success: false, reserved: false, reason: 'ALREADY_RESERVED', workerId: reservation.workerId, idempotencyKey };
    }
    return { success: false, blocked: true, reason: reservation.reason };
  }

  // 6. Late Reply / Cancellation Check in Distributed KV
  const distState = await getRecipientSequenceStateDistributed(resolvedCampaignId, recipientId);
  if (distState && (distState.reply_detected || distState.followups_cancelled || distState.status === 'REPLIED' || distState.status === 'STOPPED_REPLY_RECEIVED')) {
    await releaseReservationDistributed(idempotencyKey, workerId);
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED;
    state.followupStatus = SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED;
    state.replyDetected = true;
    state.nextAction = NEXT_ACTIONS.HUMAN_REVIEW;
    state.nextFollowUpDueAt = null;
    return {
      success: false,
      blocked: true,
      lateReply: true,
      reason: 'Late reply detected in distributed KV after reservation. Follow-ups cancelled.'
    };
  }

  // 6b. Deterministic Recipient Email Validation (Fail-closed before quota reservation/rendering)
  const emailValidation = resolveCanonicalRecipientEmail(state);
  if (!emailValidation.valid) {
    let cleanupSuccess = false;
    let cleanupError = null;
    try {
      cleanupSuccess = await releaseReservationDistributed(idempotencyKey, workerId);
    } catch (cleanupErr) {
      cleanupSuccess = false;
      cleanupError = cleanupErr.message || String(cleanupErr);
    }
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_INVALID;
    if (state.history) {
      state.history.push({
        event: 'DISPATCH_REJECTED_INVALID_EMAIL',
        error: emailValidation.error,
        reason: emailValidation.reason,
        timestamp: nowIso
      });
    }
    return {
      success: false,
      blocked: true,
      error: emailValidation.error,
      reason: emailValidation.reason,
      cleanupSuccess,
      cleanupError
    };
  }
  const canonicalEmail = emailValidation.canonicalEmail;
  state.email = canonicalEmail;

  // 7. Daily Throughput Governor & Pacing Check (CTRL-RATE-LIMIT)
  const quotaResult = await reserveDailyThroughputSlotDistributed({
    now,
    configuredLimit,
    configuredPacing,
    workerId,
    isTestMode,
    trackTestQuota,
    customStore
  });

  if (!quotaResult.allowed) {
    await releaseReservationDistributed(idempotencyKey, workerId);
    if (quotaResult.quotaExceeded) {
      state.sequenceStatus = SEQUENCE_STATUSES.BLOCKED_DAILY_LIMIT;
    } else if (quotaResult.pacingExceeded) {
      state.sequenceStatus = SEQUENCE_STATUSES.BLOCKED_PACING;
    } else {
      state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_INVALID;
    }
    if (state.history) {
      state.history.push({
        event: 'DISPATCH_BLOCKED_GOVERNOR',
        reason: quotaResult.reason,
        error: quotaResult.error || null,
        timestamp: nowIso
      });
    }
    return {
      success: false,
      blocked: true,
      ...quotaResult
    };
  }

  // 8. Render Email Template
  const emailAddr = canonicalEmail;
  const contactName = state.contactName || state.contact_name || '';
  const companyName = state.companyName || state.company_name || '';
  const rendered = renderSequenceEmail(sequenceId, {
    contact_name: contactName,
    company_name: companyName,
    email: emailAddr
  });

  // 9. Durable Dispatch Intent & External Transmission Execution
  let providerMessageId = opts.providerMessageId || null;
  let sesMessageId = opts.sesMessageId || null;

  const payloadDigest = crypto.createHash('sha256').update(JSON.stringify(rendered)).digest('hex');

  const intentId = `INTENT-${idempotencyKey}`;
  const intentRecord = {
    intentId,
    idempotencyKey,
    campaignId: resolvedCampaignId,
    recipientId,
    sequenceId,
    stepNumber: nextStepNum,
    email: emailAddr,
    workerId,
    leaseToken: reservation.leaseToken || null,
    reservationId: quotaResult.reservationId || null,
    reservationNonce: quotaResult.nonce || null,
    dateKey: quotaResult.dateKey || null,
    payloadDigest,
    status: 'DISPATCH_IN_FLIGHT',
    createdAt: nowIso
  };
  await saveDispatchIntentDistributed(idempotencyKey, intentRecord);

  // Latch the quota reservation into DISPATCH_IN_FLIGHT to fence out concurrent pre-flight release
  let latchConfirmed = false;
  let latchError = null;
  try {
    if (quotaResult.reservationId) {
      latchConfirmed = await latchReservationInFlightDistributed(quotaResult.reservationId, workerId, quotaResult.nonce, { customStore });
    } else {
      latchConfirmed = false;
    }
  } catch (err) {
    latchError = err;
    latchConfirmed = false;
  }

  if (!latchConfirmed) {
    const failureReason = latchError
      ? `RESERVATION_LATCH_ERROR: Latch execution failed (${latchError.message}). Outcome ambiguous; quota preserved as consumed.`
      : 'RESERVATION_LATCH_UNCONFIRMED: Reservation could not be positively latched into DISPATCH_IN_FLIGHT.';

    let holdPersisted = false;
    let holdPersistenceError = null;
    try {
      const holdRes = await updateDispatchIntentStatusDistributed(idempotencyKey, 'RECONCILIATION_HOLD', {
        expectedStatus: 'DISPATCH_IN_FLIGHT',
        error: failureReason,
        errorAt: new Date().toISOString()
      });
      holdPersisted = Boolean(holdRes && (holdRes.status === 'RECONCILIATION_HOLD' || holdRes.updated !== false));
    } catch (err) {
      holdPersistenceError = err?.message || String(err);
      holdPersisted = false;
    }

    state.sequenceStatus = SEQUENCE_STATUSES.UNCERTAIN_DISPATCH;
    if (state.history) {
      state.history.push({
        event: 'DISPATCH_BLOCKED_LATCH_FAILURE',
        reason: failureReason,
        idempotencyKey,
        reservationId: quotaResult.reservationId || null,
        timestamp: nowIso,
        holdPersisted,
        holdPersistenceError,
        note: 'Wire dispatch halted. Allocation held pending operator reconciliation.'
      });
    }

    let statePersisted = false;
    try {
      await saveRecipientSequenceStateDistributed(resolvedCampaignId, recipientId, state);
      statePersisted = true;
    } catch {}

    return {
      success: false,
      blocked: true,
      latchFailed: true,
      holdPersisted,
      holdPersistenceError,
      statePersisted,
      error: 'RESERVATION_LATCH_FAILED',
      reason: failureReason,
      idempotencyKey
    };
  }

  let txResult = null;
  try {
    txResult = await transmitter(rendered, {
      campaignId: resolvedCampaignId,
      recipientId,
      sequenceId,
      stepNumber: nextStepNum,
      idempotencyKey,
      email: emailAddr
    });
  } catch (txError) {
    // Classify transmission error: timeout after acceptance / uncertain vs standard transmission rejection
    const isUncertainOutcome = Boolean(
      txError.uncertainOutcome === true ||
      txError.timeoutAfterDispatch === true ||
      txError.timeoutAfterAcceptance === true ||
      opts.requireReconciliationOnTimeout === true ||
      txError.code === 'PROVIDER_TIMEOUT_AFTER_ACCEPTANCE' ||
      txError.code === 'ETIMEDOUT' ||
      txError.code === 'ECONNRESET' ||
      txError.code === 'ESOCKETTIMEDOUT' ||
      txError.status === 'UNKNOWN_OUTCOME' ||
      txError.status === 504 ||
      txError.statusCode === 504
    );

    if (isUncertainOutcome) {
      // UNCERTAIN OUTCOME: Provider may have accepted the email before connection dropped!
      // DO NOT release reservation or daily quota slot.
      // Transition to durable RECONCILIATION_HOLD and block automatic retry to protect buyer from duplicate sends.
      await updateDispatchIntentStatusDistributed(idempotencyKey, 'RECONCILIATION_HOLD', {
        expectedStatus: 'DISPATCH_IN_FLIGHT',
        error: txError.message,
        errorCode: txError.code || null,
        errorAt: new Date().toISOString()
      });

      state.sequenceStatus = SEQUENCE_STATUSES.UNCERTAIN_DISPATCH;
      if (state.history) {
        state.history.push({
          event: 'DISPATCH_UNCERTAIN_OUTCOME',
          error: txError.message,
          idempotencyKey,
          timestamp: nowIso,
          note: 'Transmission timed out or disconnected. Automatic retry halted pending provider reconciliation.'
        });
      }
      await saveRecipientSequenceStateDistributed(resolvedCampaignId, recipientId, state);

      return {
        success: false,
        transmissionFailed: true,
        uncertainOutcome: true,
        status: 'RECONCILIATION_HOLD',
        idempotencyKey,
        reason: `TRANSMISSION_UNCERTAIN_OUTCOME: Provider call timed out (${txError.message}). Outcome uncertain; auto-resend blocked to prevent duplicate buyer email.`,
        error: txError.message
      };
    }

    // DEFINITIVE REJECTION: Client validation or pre-flight rejection
    await updateDispatchIntentStatusDistributed(idempotencyKey, 'DEFINITIVE_REJECTION', {
      expectedStatus: 'DISPATCH_IN_FLIGHT',
      error: txError.message,
      errorAt: new Date().toISOString()
    });
    await releaseReservationDistributed(idempotencyKey, workerId);
    // Owner Policy O-02: All wire attempts consume quota permanently. No quota release on transmission rejection.
    if (state.history) {
      state.history.push({
        event: 'DISPATCH_TRANSMISSION_FAILED',
        error: txError.message,
        quotaPolicy: 'O-02_ATTEMPT_CONSUMED',
        reservationId: quotaResult.reservationId || null,
        timestamp: nowIso
      });
    }
    return {
      success: false,
      transmissionFailed: true,
      definitiveRejection: true,
      reason: `TRANSMISSION_FAILED: ${txError.message}`,
      error: txError.message
    };
  }

  // Validate trusted acceptance result: MUST have valid non-empty providerMessageId
  const resolvedProviderId = txResult && typeof txResult === 'object'
    ? (txResult.providerMessageId || txResult.id)
    : null;
  const isAccepted = txResult && (
    txResult.success === true ||
    txResult.status === 'ACCEPTED' ||
    txResult.status === 'DELIVERED'
  ) && Boolean(resolvedProviderId && typeof resolvedProviderId === 'string' && resolvedProviderId.trim().length > 0);

  if (!isAccepted) {
    // Malformed transmitter result: do NOT commit as sent!
    await updateDispatchIntentStatusDistributed(idempotencyKey, 'MALFORMED_TRANSMITTER_RESULT', {
      expectedStatus: 'DISPATCH_IN_FLIGHT',
      error: 'Transmitter returned without a validated provider acceptance result (providerMessageId required)',
      errorAt: new Date().toISOString()
    });
    await releaseReservationDistributed(idempotencyKey, workerId);
    // Owner Policy O-02: Wire transmission was attempted; quota remains consumed.
    if (state.history) {
      state.history.push({
        event: 'DISPATCH_TRANSMISSION_FAILED',
        error: 'MALFORMED_TRANSMITTER_RESULT',
        quotaPolicy: 'O-02_ATTEMPT_CONSUMED',
        reservationId: quotaResult.reservationId || null,
        timestamp: nowIso
      });
    }
    return {
      success: false,
      transmissionFailed: true,
      error: 'MALFORMED_TRANSMITTER_RESULT',
      reason: 'Transmitter returned without a validated provider acceptance result (providerMessageId required).'
    };
  }

  providerMessageId = resolvedProviderId.trim();
  sesMessageId = txResult.sesMessageId || sesMessageId;

  const intentCasResult = await updateDispatchIntentStatusDistributed(idempotencyKey, 'PROVIDER_ACCEPTED', {
    expectedStatus: 'DISPATCH_IN_FLIGHT',
    providerMessageId,
    sesMessageId,
    transmittedAt: new Date().toISOString()
  });

  if (intentCasResult && intentCasResult.updated === false) {
    state.sequenceStatus = SEQUENCE_STATUSES.UNCERTAIN_DISPATCH;
    if (state.history) {
      state.history.push({
        event: 'INTENT_CAS_FAILED_HOLD',
        reason: intentCasResult.reason || 'CAS transition to PROVIDER_ACCEPTED failed',
        providerMessageId,
        idempotencyKey,
        timestamp: nowIso
      });
    }
    await saveRecipientSequenceStateDistributed(resolvedCampaignId, recipientId, state);
    return {
      success: false,
      transmissionFailed: true,
      casConflict: true,
      error: 'INTENT_CAS_FAILED',
      reason: `Intent state transition failed (${intentCasResult.reason || 'conflict'}). Frozen in UNCERTAIN_DISPATCH.`
    };
  }

  // 10. Post-Transmission Fencing Commit (commitSequenceStepDistributed)
  const commitResult = await commitSequenceStepDistributed(resolvedCampaignId, recipientId, sequenceId, nextStepNum, {
    workerId,
    leaseToken: reservation.leaseToken || null,
    email: emailAddr,
    companyName,
    contactName,
    providerMessageId,
    sesMessageId,
    payloadDigest
  });

  if (commitResult && commitResult.committed === false) {
    // CRITICAL SAFETY GUARD: Email was already accepted by provider!
    // Do NOT release quota slot (the email was accepted and is in transit).
    // Transition to RECONCILIATION_HOLD and freeze sequence in UNCERTAIN_DISPATCH
    // to prevent duplicate sends by another worker or retry attempt.
    await updateDispatchIntentStatusDistributed(idempotencyKey, 'COMMIT_FAILED_HOLD', {
      expectedStatus: 'PROVIDER_ACCEPTED',
      error: commitResult.reason,
      providerMessageId,
      sesMessageId,
      fencingViolation: Boolean(commitResult.fencingViolation),
      leaseExpired: Boolean(commitResult.leaseExpired),
      errorAt: new Date().toISOString()
    });

    state.sequenceStatus = SEQUENCE_STATUSES.UNCERTAIN_DISPATCH;
    if (state.history) {
      state.history.push({
        event: 'COMMIT_FAILED_HOLD',
        reason: commitResult.reason,
        providerMessageId,
        fencingViolation: Boolean(commitResult.fencingViolation),
        leaseExpired: Boolean(commitResult.leaseExpired),
        timestamp: nowIso
      });
    }
    await saveRecipientSequenceStateDistributed(resolvedCampaignId, recipientId, state);

    return {
      success: false,
      uncertainOutcome: true,
      status: 'RECONCILIATION_HOLD',
      fencingViolation: Boolean(commitResult.fencingViolation),
      leaseExpired: Boolean(commitResult.leaseExpired),
      reason: `COMMIT_FAILED_AFTER_TRANSMISSION: Email accepted by provider (${providerMessageId}) but commit failed (${commitResult.reason}). Frozen in RECONCILIATION_HOLD to prevent duplicate dispatch.`,
      providerMessageId,
      idempotencyKey,
      error: commitResult.reason
    };
  }

  // 11. Update Local State & Return Success
  if (state.dispatchedKeys) {
    state.dispatchedKeys.add(idempotencyKey);
  }
  dispatchedStorage.add(idempotencyKey);
  state.currentSequenceId = sequenceId;
  state.currentStep = nextStepNum;
  state.lastSentAt = nowIso;

  if (nextStepNum === 1) {
    state.sequenceStatus = SEQUENCE_STATUSES.EMAIL_1_SENT;
    state.leadStatus = LEAD_STATUSES.OUTREACH_ACTIVE;
  } else if (nextStepNum === 2) {
    state.sequenceStatus = SEQUENCE_STATUSES.EMAIL_2_SENT;
  } else if (nextStepNum === 3) {
    state.sequenceStatus = SEQUENCE_STATUSES.EMAIL_3_SENT;
  } else if (nextStepNum === 4) {
    state.sequenceStatus = SEQUENCE_STATUSES.EMAIL_4_SENT;
  } else if (nextStepNum === 5) {
    state.sequenceStatus = SEQUENCE_STATUSES.COMPLETED;
    state.leadStatus = LEAD_STATUSES.COMPLETED_NO_REPLY;
    state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
    state.followupStatus = 'COMPLETED';
    state.nextFollowUpDueAt = null;
  }

  if (nextStepNum < 5) {
    const nextDue = new Date(nowMs + FOLLOWUP_DELAY_HOURS * 60 * 60 * 1000);
    state.nextFollowUpDueAt = nextDue.toISOString();
    state.nextAction = NEXT_ACTIONS.AWAIT_REPLY_OR_DELAY;
  }

  if (state.history) {
    state.history.push({
      event: 'SEQUENCE_DISPATCHED_DISTRIBUTED',
      sequenceId,
      step: `EMAIL_${nextStepNum}`,
      idempotencyKey,
      providerMessageId,
      reservationId: quotaResult.reservationId || null,
      timestamp: nowIso
    });
  }

  await updateDispatchIntentStatusDistributed(idempotencyKey, 'COMMITTED', {
    expectedStatus: 'PROVIDER_ACCEPTED'
  });

  return {
    success: true,
    sequenceId,
    step: `EMAIL_${nextStepNum}`,
    idempotencyKey,
    providerMessageId,
    rendered,
    quotaReservation: quotaResult,
    commitResult,
    state
  };
}

/**
 * Reconcile an uncertain dispatch outcome (Phase 3D - DEFECT-3C-01)
 * Concurrency-safe, idempotent, and handles reconciliation after the original 5-minute lease expires.
 * Requires trustworthy evidence for confirmed outcomes and keeps ambiguous outcomes frozen.
 */
export async function reconcileUncertainDispatchIntentDistributed(idempotencyKey, reconciliationData = {}) {
  const intent = await getDispatchIntentDistributed(idempotencyKey);
  if (!intent) {
    return { reconciled: false, reason: 'INTENT_NOT_FOUND', idempotencyKey };
  }

  // Idempotency check: if intent was already reconciled, return deterministic cached outcome
  if (intent.status === 'RECONCILED_CONFIRMED_SENT') {
    return {
      reconciled: true,
      alreadyReconciled: true,
      outcome: 'CONFIRMED_SENT',
      idempotencyKey,
      details: intent
    };
  }
  if (intent.status === 'RECONCILED_CONFIRMED_NOT_SENT') {
    return {
      reconciled: true,
      alreadyReconciled: true,
      outcome: 'CONFIRMED_NOT_SENT',
      idempotencyKey,
      details: intent
    };
  }

  const {
    providerStatus, // 'DELIVERED' | 'ACCEPTED' | 'NOT_SENT' | 'REJECTED'
    providerMessageId = null,
    sesMessageId = null,
    evidenceSource = 'manual_operator_review',
    reconciledBy = 'operator',
    reconciliationNotes = ''
  } = reconciliationData;

  const { campaignId, recipientId, sequenceId, stepNumber, workerId, reservationId, dateKey, email } = intent;

  // 1. REJECT AMBIGUOUS OR CONFLICTING EVIDENCE (FAIL-CLOSED)
  // Ambiguous outcomes must remain frozen in UNCERTAIN_DISPATCH; never blindly resend.
  if (!providerStatus || providerStatus === 'UNKNOWN' || providerStatus === 'PENDING' || providerStatus === 'UNCONFIRMED') {
    return {
      reconciled: false,
      ambiguous: true,
      reason: 'AMBIGUOUS_EVIDENCE_REJECTED',
      message: 'Ambiguous or unconfirmed provider status. Sequence must remain frozen in UNCERTAIN_DISPATCH.',
      idempotencyKey
    };
  }

  // 2. CONFIRMED SENT TRANSITION
  if (providerStatus === 'DELIVERED' || providerStatus === 'ACCEPTED' || providerStatus === 'CONFIRMED_SENT') {
    const resolvedMsgId = providerMessageId || intent.providerMessageId;
    if (!resolvedMsgId || typeof resolvedMsgId !== 'string' || resolvedMsgId.trim().length === 0) {
      return {
        reconciled: false,
        invalidEvidence: true,
        reason: 'TRUSTWORTHY_EVIDENCE_REQUIRED',
        message: 'Confirmed outcome requires a verified non-empty providerMessageId.',
        idempotencyKey
      };
    }

    // Safely commit the step using dedicated reconciliation commit (works after 5-minute lease expiry)
    const commitResult = await commitReconciledSequenceStepDistributed(campaignId, recipientId, sequenceId, stepNumber, {
      workerId: reconciledBy || workerId || 'reconciler',
      email,
      providerMessageId: resolvedMsgId.trim(),
      sesMessageId: sesMessageId || intent.sesMessageId || null,
      evidenceSource,
      reconciliationNotes
    });

    if (!commitResult.committed) {
      return {
        reconciled: false,
        commitFailed: true,
        reason: commitResult.reason,
        idempotencyKey
      };
    }

    await updateDispatchIntentStatusDistributed(idempotencyKey, 'RECONCILED_CONFIRMED_SENT', {
      expectedStatus: 'RECONCILIATION_HOLD,COMMIT_FAILED_HOLD,MALFORMED_TRANSMITTER_RESULT',
      providerStatus,
      providerMessageId: resolvedMsgId.trim(),
      sesMessageId: sesMessageId || intent.sesMessageId || null,
      reconciledAt: new Date().toISOString(),
      reconciledBy,
      evidenceSource,
      reconciliationNotes
    });

    return {
      reconciled: true,
      outcome: 'CONFIRMED_SENT',
      commitResult,
      idempotencyKey
    };
  }

  // 3. CONFIRMED NOT SENT TRANSITION
  if (providerStatus === 'NOT_SENT' || providerStatus === 'REJECTED' || providerStatus === 'CONFIRMED_NOT_SENT') {
    // Acquire dedicated reconciliation lock to prevent concurrent races
    const recLockKey = `seq_rec_lock:${idempotencyKey}`;
    const isKvConfigured = getKvConfig().hasDistributedKV;
    if (isKvConfigured || process.env.REQUIRE_DISTRIBUTED_KV === '1') {
      const lockAcquired = await execKVCommand('SET', recLockKey, reconciledBy, 'NX', 'EX', '30');
      if (lockAcquired !== 'OK') {
        return {
          reconciled: false,
          reconciliationLocked: true,
          reason: 'RECONCILIATION_IN_PROGRESS: Another reconciler holds the lock for this intent.'
        };
      }
    }

    try {
      // Release reservation in KV
      await releaseReservationDistributed(idempotencyKey, workerId || reconciledBy);
      // Under Owner Policies O-02 & O-03: All wire attempts consume quota permanently.
      // Daily throughput quota is NOT restored for post-dispatch reconciliation.

      // Unfreeze recipient sequence state in distributed KV
      const currentState = await getRecipientSequenceStateDistributed(campaignId, recipientId);
      if (currentState && (currentState.status === SEQUENCE_STATUSES.UNCERTAIN_DISPATCH || currentState.sequenceStatus === SEQUENCE_STATUSES.UNCERTAIN_DISPATCH)) {
        const unfreezeStep = Math.max(0, (currentState.current_step || 1) - 1);
        currentState.status = unfreezeStep === 0 ? 'PROSPECT' : `EMAIL_${unfreezeStep}_SENT`;
        currentState.sequenceStatus = currentState.status;
        currentState.haltReason = null;
        currentState.updated_at = new Date().toISOString();
        await saveRecipientSequenceStateDistributed(campaignId, recipientId, currentState);
      }

      await updateDispatchIntentStatusDistributed(idempotencyKey, 'RECONCILED_CONFIRMED_NOT_SENT', {
        expectedStatus: 'RECONCILIATION_HOLD,COMMIT_FAILED_HOLD,MALFORMED_TRANSMITTER_RESULT',
        providerStatus,
        reconciledAt: new Date().toISOString(),
        reconciledBy,
        evidenceSource,
        reconciliationNotes
      });

      return {
        reconciled: true,
        outcome: 'CONFIRMED_NOT_SENT',
        idempotencyKey
      };
    } finally {
      if (isKvConfigured || process.env.REQUIRE_DISTRIBUTED_KV === '1') {
        await execKVCommand('DEL', recLockKey).catch(() => {});
      }
    }
  }

  return {
    reconciled: false,
    reason: 'INVALID_PROVIDER_STATUS',
    message: 'providerStatus must be DELIVERED, ACCEPTED, NOT_SENT, or REJECTED',
    idempotencyKey
  };
}

