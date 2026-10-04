// ============================================================
// AVANI AGRO FOODS — Inbound Reply Detection & Cancellation Pipeline
// api/_lib/replyDetector.js
// Phase 3J: Robust Matching, Multi-factor Attribution & Cancellation
// ============================================================

import {
  findSequenceByCriteria,
  recordReplyReceived,
  getRecipientSequenceState,
  saveRecipientSequenceState
} from './sequencePersistence.js';

/**
 * Normalize an email address for robust matching
 */
export function normalizeEmail(raw) {
  if (!raw || typeof raw !== 'string') return '';
  // Extract email between angle brackets if formatted as "Name <email@domain.com>"
  const match = raw.match(/<([^>]+)>/);
  const email = match ? match[1] : raw;
  return email.trim().toLowerCase();
}

/**
 * Extract clean Message-ID (strip surrounding brackets, quotes, whitespace)
 */
export function cleanMessageId(id) {
  if (!id || typeof id !== 'string') return '';
  return id.replace(/[<>'"\s]/g, '');
}

/**
 * Parse an incoming inbound event (Resend inbound, webhook, or mail router)
 * and normalize it into standard format.
 */
export function normalizeInboundPayload(eventPayload) {
  if (!eventPayload || typeof eventPayload !== 'object') {
    throw new Error('Invalid inbound event payload: object required');
  }

  // Handle Resend webhook wrapper { type: 'email.received', data: { ... } }
  const data = eventPayload.data || eventPayload;

  const eventType = String(eventPayload.type || eventPayload.event || 'email.received').toLowerCase();
  const eventId = String(eventPayload.id || eventPayload.eventId || data.id || data.email_id || '').trim();

  // Extract from address
  const rawFrom = data.from || data.sender || data.headers?.from || '';
  const fromEmail = normalizeEmail(rawFrom);

  // Extract to address
  const rawTo = Array.isArray(data.to) ? data.to.join(',') : (data.to || data.recipient || '');
  const toEmail = normalizeEmail(rawTo);

  // Extract header metadata
  const headers = data.headers || {};
  const messageId = cleanMessageId(data.message_id || data.messageId || headers['message-id'] || headers['Message-ID'] || '');
  const inReplyTo = cleanMessageId(data.in_reply_to || data.inReplyTo || headers['in-reply-to'] || headers['In-Reply-To'] || '');
  const references = cleanMessageId(data.references || headers['references'] || headers['References'] || '');

  const subject = String(data.subject || '').trim();
  const textBody = String(data.text || data.html || data.body || '').trim();
  const timestamp = data.created_at || data.timestamp || new Date().toISOString();

  // Optional campaign/recipient tags if passed in headers or custom query
  const campaignId = data.campaign_id || data.campaignId || headers['x-campaign-id'] || null;
  const recipientId = data.recipient_id || data.recipientId || headers['x-recipient-id'] || null;

  return {
    eventId,
    eventType,
    fromEmail,
    rawFrom,
    toEmail,
    subject,
    textBody,
    messageId,
    inReplyTo,
    references,
    timestamp,
    campaignId,
    recipientId
  };
}

/**
 * Match incoming reply against active sequences using deterministic multi-factor priority
 */
export function matchInboundReply(inbound) {
  // If explicit campaign + recipient given, match directly
  if (inbound.campaignId && inbound.recipientId) {
    const state = getRecipientSequenceState(inbound.campaignId, inbound.recipientId);
    if (state) {
      return {
        matched: true,
        campaignId: inbound.campaignId,
        recipientId: inbound.recipientId,
        confidence: 'EXPLICIT_HEADERS',
        state
      };
    }
  }

  // Multi-factor search: Message-ID > References > Email
  const searchResult = findSequenceByCriteria({
    email: inbound.fromEmail,
    inReplyTo: inbound.inReplyTo,
    references: inbound.references,
    campaignId: inbound.campaignId
  });

  if (searchResult.ambiguous) {
    // Fail-closed on ambiguous match: DO NOT send follow-up, flag for human review
    for (const matchState of searchResult.matches) {
      matchState.status = 'MANUAL_REVIEW_REQUIRED';
      matchState.followups_cancelled = true;
      matchState.reviewReason = `Ambiguous reply matching: multiple sequences found for ${inbound.fromEmail}`;
      saveRecipientSequenceState(matchState.campaign_id, matchState.recipient_id, matchState);
    }

    return {
      matched: false,
      ambiguous: true,
      confidence: 'AMBIGUOUS',
      reason: 'Multiple active sequences matched inbound sender. Failing closed to MANUAL_REVIEW_REQUIRED.',
      candidates: searchResult.matches.map(m => ({ campaign_id: m.campaign_id, recipient_id: m.recipient_id }))
    };
  }

  if (searchResult.match) {
    return {
      matched: true,
      campaignId: searchResult.match.campaign_id,
      recipientId: searchResult.match.recipient_id,
      confidence: searchResult.confidence,
      state: searchResult.match
    };
  }

  // Not found
  return {
    matched: false,
    ambiguous: false,
    confidence: 'NOT_FOUND',
    reason: `No active sequence matching incoming sender ${inbound.fromEmail} or In-Reply-To ${inbound.inReplyTo}`
  };
}

/**
 * Complete pipeline: Ingest, Validate, Match, and Cancel Future Follow-Ups
 */
export function processInboundReply(eventPayload) {
  const inbound = normalizeInboundPayload(eventPayload);

  // Match reply
  const matchResult = matchInboundReply(inbound);

  if (!matchResult.matched) {
    return {
      success: false,
      action: matchResult.ambiguous ? 'FLAGGED_MANUAL_REVIEW' : 'IGNORED_UNMATCHED',
      reason: matchResult.reason,
      inbound
    };
  }

  // Atomic cancellation in persistent store
  const updatedState = recordReplyReceived(matchResult.campaignId, matchResult.recipientId, {
    from: inbound.rawFrom,
    fromEmail: inbound.fromEmail,
    subject: inbound.subject,
    inReplyTo: inbound.inReplyTo,
    messageId: inbound.messageId,
    timestamp: inbound.timestamp
  });

  return {
    success: true,
    action: 'FOLLOWUPS_CANCELLED',
    campaignId: matchResult.campaignId,
    recipientId: matchResult.recipientId,
    confidence: matchResult.confidence,
    state: updatedState,
    inbound
  };
}
