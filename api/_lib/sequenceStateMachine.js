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

import { EMAIL_SEQUENCES, renderSequenceEmail } from './emailSequences.js';
import {
  reserveSequenceStep,
  commitSequenceStep,
  saveRecipientSequenceState,
  getRecipientSequenceState,
  recordReplyReceived,
  releaseReservation,
  generateStepIdempotencyKey
} from './sequencePersistence.js';
import {
  reserveDailyThroughputSlot,
  releaseDailyThroughputSlot,
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
  MANUAL_REVIEW_REQUIRED: 'MANUAL_REVIEW_REQUIRED'
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
export function dispatchSequenceStep(state, campaignId, options = {}) {
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
  } = options;

  const nowIso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();

  // Resolve globalOutreachStop & outreachAuthorized with strict fail-closed defaults
  const isGlobalStopActive = options.globalOutreachStop !== undefined
    ? Boolean(options.globalOutreachStop === true || options.globalOutreachStop === 1 || options.globalOutreachStop === '1')
    : (!isTestMode ? true : false);

  const isOutreachAuthorized = options.outreachAuthorized !== undefined
    ? Boolean(options.outreachAuthorized === true || options.outreachAuthorized === 1 || options.outreachAuthorized === '1')
    : (!isTestMode ? false : true);

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
  const isApproved = Boolean(state.approvedForOutreach === true || options.approvedForOutreach === true);
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
  const idempotencyKey = generateIdempotencyKey(campaignId, state.recipientId, sequenceId, nextStepNum);

  // 4. Concurrency Protection & Durable Reservation
  if (useDurableStorage) {
    const reservation = reserveSequenceStep(campaignId, state.recipientId, sequenceId, nextStepNum, workerId);
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
    email: state.email
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
    commitSequenceStep(campaignId, state.recipientId, sequenceId, nextStepNum, {
      email: state.email,
      companyName: state.companyName,
      contactName: state.contactName,
      providerMessageId: options.providerMessageId || null
    });
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

