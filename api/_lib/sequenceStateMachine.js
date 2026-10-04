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
    history: [],
    dispatchedKeys: new Set(),
    operatorTasks: []
  };
}

/**
 * Dispatch next sequence step for a recipient (in-memory & durable)
 */
export function dispatchSequenceStep(state, campaignId, options = {}) {
  const {
    now = new Date(),
    globalOutreachStop = true,
    outreachAuthorized = false,
    isTestMode = false,
    dispatchedStorage = new Set(),
    useDurableStorage = false,
    workerId = 'worker-1'
  } = options;

  // 1. Safety Gate: Global Outreach Stop & Authorization (FAIL CLOSED)
  if (!isTestMode) {
    if (globalOutreachStop) {
      state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_GLOBAL_STOP;
      state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
      state.history.push({
        event: 'DISPATCH_BLOCKED',
        reason: 'GLOBAL_OUTREACH_STOP is active',
        timestamp: now.toISOString()
      });
      return { success: false, blocked: true, reason: 'GLOBAL_OUTREACH_STOP is active' };
    }
    if (!outreachAuthorized) {
      state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_UNAUTHORIZED;
      state.nextAction = NEXT_ACTIONS.NONE_SEQUENCE_COMPLETED;
      state.history.push({
        event: 'DISPATCH_BLOCKED',
        reason: 'OUTREACH_NOT_AUTHORIZED',
        timestamp: now.toISOString()
      });
      return { success: false, blocked: true, reason: 'OUTREACH_NOT_AUTHORIZED' };
    }
  }

  // 2. Stop conditions check: Reply overrides scheduled timer permanently (PART C, PART H)
  if (state.replyDetected || state.followups_cancelled || state.sequenceStatus === SEQUENCE_STATUSES.REPLIED) {
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED;
    state.followupStatus = SEQUENCE_STATUSES.STOPPED_REPLY_RECEIVED;
    state.nextAction = NEXT_ACTIONS.HUMAN_REVIEW;
    state.nextFollowUpDueAt = null;
    return { success: false, blocked: true, reason: 'Reply already detected from recipient. All follow-ups cancelled.' };
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

  const sequenceId = `SEQ-0${nextStepNum}`;
  const idempotencyKey = generateIdempotencyKey(campaignId, state.recipientId, sequenceId, nextStepNum);

  // 3. Concurrency Protection & Durable Reservation (PART E, PART F)
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

  // 3b. In-memory Idempotency Check
  if (state.dispatchedKeys && (state.dispatchedKeys.has(idempotencyKey) || dispatchedStorage.has(idempotencyKey))) {
    state.sequenceStatus = SEQUENCE_STATUSES.STOPPED_DUPLICATE;
    state.history.push({
      event: 'DISPATCH_SKIPPED_DUPLICATE',
      idempotencyKey,
      timestamp: now.toISOString()
    });
    if (useDurableStorage) releaseReservation(idempotencyKey);
    return { success: false, duplicate: true, reason: 'Duplicate dispatch prevented by idempotency key' };
  }

  // 4. Check 72-hour delay if not step 1 (PART G)
  if (state.currentStep > 0 && state.lastSentAt) {
    const hoursSinceLast = (now.getTime() - new Date(state.lastSentAt).getTime()) / (1000 * 60 * 60);
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

  // 5. Render payload with strictly verified "Export Trade Co-Ordinator" positioning
  const rendered = renderSequenceEmail(sequenceId, {
    contact_name: state.contactName,
    company_name: state.companyName,
    email: state.email
  });

  // 6. Update State
  if (state.dispatchedKeys) {
    state.dispatchedKeys.add(idempotencyKey);
  }
  dispatchedStorage.add(idempotencyKey);
  state.currentSequenceId = sequenceId;
  state.currentStep = nextStepNum;
  state.lastSentAt = now.toISOString();

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
    const nextDue = new Date(now.getTime() + FOLLOWUP_DELAY_HOURS * 60 * 60 * 1000);
    state.nextFollowUpDueAt = nextDue.toISOString();
    state.nextAction = NEXT_ACTIONS.AWAIT_REPLY_OR_DELAY;
  }

  state.history.push({
    event: 'SEQUENCE_DISPATCHED',
    sequenceId,
    step: `EMAIL_${nextStepNum}`,
    idempotencyKey,
    timestamp: now.toISOString()
  });

  // 7. Commit to Durable Storage if enabled
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
