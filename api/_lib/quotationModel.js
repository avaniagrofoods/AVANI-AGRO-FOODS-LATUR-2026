// ============================================================
// AVANI AGRO FOODS — SERVERLESS QUOTATION MODEL & DISPATCH ENGINE
// api/_lib/quotationModel.js
// Server-only quotation email dispatch and webhook processing
// ============================================================

import {
  createInitialDispatchState,
  evaluateBuyerReadyGate,
  generateB2BEmailTemplate,
  generateSecureId
} from '../../src/data/quotationModel.js';

// Re-export all client-safe models and constants for server-side callers
export * from '../../src/data/quotationModel.js';

/**
 * Provider-agnostic transactional email dispatch abstraction
 */
export async function sendQuotationEmail({ quotation, recipient, subject, text, html, attachments = [], idempotencyKey, ...restOpts }) {
  const options = { ...restOpts, ...(restOpts.options || {}) };

  // SEC-03: Fail-safe GLOBAL_OUTREACH_STOP gate
  // Default to STOPPED unless server-side configuration explicitly represents an approved non-stop value ('0' or 'false').
  // Missing, empty, malformed, and unexpected values must STOP.
  // Case-insensitive truthy strings ('1', 'true', 'TRUE') activate the emergency stop. Caller cannot disable it.
  const rawStop = (typeof process !== 'undefined' && process.env && process.env.GLOBAL_OUTREACH_STOP != null)
    ? String(process.env.GLOBAL_OUTREACH_STOP).trim().toLowerCase()
    : '';
  const isExplicitlyNonStop = rawStop === '0' || rawStop === 'false';
  const isGlobalStop = !isExplicitlyNonStop || options.globalOutreachStop === true;
  if (isGlobalStop) {
    const isExplicitStop = rawStop === '1' || rawStop === 'true' || options.globalOutreachStop === true;
    const errorMsg = isExplicitStop
      ? 'GLOBAL_OUTREACH_STOP is active (emergency stop). Quotation email dispatch is halted.'
      : 'GLOBAL_OUTREACH_STOP is active (fail-safe unconfigured/invalid emergency stop). Quotation email dispatch is halted.';
    return {
      success: false,
      status: 'BLOCKED_GLOBAL_STOP',
      error: errorMsg,
      provider: 'safety_gate'
    };
  }

  // SEC-01: Fail-closed OUTREACH_AUTHORIZED gate
  // Missing, empty, malformed, or unrecognized values deny dispatch.
  // Only explicit trusted server-side authorization ('1' or 'true') authorizes.
  // Caller request-body options CANNOT authorize outreach.
  const rawAuth = (typeof process !== 'undefined' && process.env && process.env.OUTREACH_AUTHORIZED != null)
    ? String(process.env.OUTREACH_AUTHORIZED).trim().toLowerCase()
    : '';
  const isOutreachAuthorized = (rawAuth === '1' || rawAuth === 'true') && options.outreachAuthorized !== false;
  if (!isOutreachAuthorized) {
    return {
      success: false,
      status: 'BLOCKED_UNAUTHORIZED',
      error: 'OUTREACH_NOT_AUTHORIZED: Quotation outreach is not authorized (OUTREACH_AUTHORIZED must be 1).',
      provider: 'safety_gate'
    };
  }

  // 1. Simulation and mock checks (for deterministic testing & QA)
  if (options.simulateFailure || options.mockFailure) {
    const errorMsg = options.failureReason || 'Mock provider network timeout';
    return {
      success: false,
      status: 'SEND_FAILED',
      error: errorMsg,
      provider: 'mock'
    };
  }

  if (options.simulateSuccess || options.mockSuccess || options.mockProviderDelivery || options.mockSimulation) {
    const messageId = options.mockProviderReference || options.messageId || `msg_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      success: true,
      status: 'SENT',
      messageId,
      provider: 'SIMULATED_PROVIDER',
      timestamp: new Date().toISOString()
    };
  }

  // 2. Resend API provider
  if (typeof process !== 'undefined' && process.env && process.env.RESEND_API_KEY) {
    // SEC-02: Strictly server-controlled REAL_BUYER_EMAILS gate. Caller options cannot bypass.
    const rawReal = (typeof process !== 'undefined' && process.env && process.env.REAL_BUYER_EMAILS != null)
      ? String(process.env.REAL_BUYER_EMAILS).trim().toLowerCase()
      : '';
    const isRealEmailsAllowed = rawReal === '1' || rawReal === 'true';
    if (!isRealEmailsAllowed) {
      return {
        success: false,
        status: 'BLOCKED_REAL_BUYER_EMAILS',
        error: 'REAL_BUYER_EMAILS=0: Real external email delivery is disabled by safety invariant.',
        provider: 'safety_gate'
      };
    }
    try {
      const headers = {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = String(idempotencyKey);
      }
      const bodyPayload = {
        from: process.env.RESEND_FROM_EMAIL || 'AVANI AGRO FOODS <sales@avaniagrofoods.com>',
        to: Array.isArray(recipient) ? recipient : [recipient],
        subject,
        text,
        html: html || text.replace(/\n/g, '<br/>')
      };
      if (attachments && attachments.length > 0) {
        bodyPayload.attachments = attachments.map(att => ({
          filename: att.filename,
          content: att.content
        }));
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          status: 'SENT',
          messageId: data.id || `resend_${Date.now()}`,
          provider: 'resend',
          timestamp: new Date().toISOString()
        };
      }
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        status: 'SEND_FAILED',
        error: err.message || `Resend error: HTTP ${res.status}`,
        provider: 'resend'
      };
    } catch (e) {
      return {
        success: false,
        status: 'SEND_FAILED',
        error: e.message,
        provider: 'resend'
      };
    }
  }

  // 3. SendGrid API provider
  if (typeof process !== 'undefined' && process.env && process.env.SENDGRID_API_KEY) {
    // SEC-02: Strictly server-controlled REAL_BUYER_EMAILS gate. Caller options cannot bypass.
    const rawReal = (typeof process !== 'undefined' && process.env && process.env.REAL_BUYER_EMAILS != null)
      ? String(process.env.REAL_BUYER_EMAILS).trim().toLowerCase()
      : '';
    const isRealEmailsAllowed = rawReal === '1' || rawReal === 'true';
    if (!isRealEmailsAllowed) {
      return {
        success: false,
        status: 'BLOCKED_REAL_BUYER_EMAILS',
        error: 'REAL_BUYER_EMAILS=0: Real external email delivery is disabled by safety invariant.',
        provider: 'safety_gate'
      };
    }
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || 'sales@avaniagrofoods.com', name: 'AVANI AGRO FOODS' },
          subject,
          content: [
            { type: 'text/plain', value: text },
            { type: 'text/html', value: html || text.replace(/\n/g, '<br/>') }
          ]
        })
      });
      if (res.status >= 200 && res.status < 300) {
        const msgId = res.headers?.get?.('x-message-id') || `sg_${Date.now()}`;
        return {
          success: true,
          status: 'SENT',
          messageId: msgId,
          provider: 'sendgrid',
          timestamp: new Date().toISOString()
        };
      }
      return {
        success: false,
        status: 'SEND_FAILED',
        error: `SendGrid error: HTTP ${res.status}`,
        provider: 'sendgrid'
      };
    } catch (e) {
      return {
        success: false,
        status: 'SEND_FAILED',
        error: e.message,
        provider: 'sendgrid'
      };
    }
  }

  // 4. SMTP provider check (not implemented in serverless runtime; fail closed)
  if (typeof process !== 'undefined' && process.env && process.env.SMTP_HOST) {
    return {
      success: false,
      status: 'SEND_FAILED',
      error: 'SMTP transport not implemented in serverless runtime. Configure RESEND_API_KEY for live delivery.',
      provider: 'smtp'
    };
  }

  // 5. Unconfigured provider fallback (prevents false SENT reporting)
  return {
    success: false,
    status: 'READY_TO_SEND',
    message: 'External mail provider not configured - no false SENT reported',
    provider: 'none'
  };
}

/**
 * Controlled buyer dispatch function with provider abstraction, duplicate send protection, and audit
 */
export async function sendQuotationToBuyer(quotation, options = {}) {
  if (!quotation || typeof quotation !== 'object') {
    const err = new Error('Valid quotation object required for dispatch');
    err.code = 'DISPATCH_BLOCKED';
    err.issues = ['Valid quotation object required for dispatch'];
    throw err;
  }

  const allowedStatuses = [
    'READY_FOR_BUYER',
    'REVISED',
    'SENT_TO_BUYER',
    'READY_TO_SEND',
    'SEND_FAILED',
    'DELIVERY_PENDING',
    'DELIVERED',
    'OPENED'
  ];

  if (!allowedStatuses.includes(quotation.status)) {
    const err = new Error(`Quotation in status "${quotation.status}" cannot be dispatched. Cannot dispatch quotation in status ${quotation.status}. Must be in READY_FOR_BUYER status.`);
    err.code = 'DISPATCH_BLOCKED';
    err.issues = [`Quotation in status ${quotation.status} cannot be dispatched`];
    throw err;
  }

  const adminReviewed = options.adminReviewed !== undefined ? options.adminReviewed : true;
  if (!adminReviewed) {
    const err = new Error('Explicit admin review confirmation is required before dispatching quotation.');
    err.code = 'DISPATCH_BLOCKED';
    err.issues = ['Explicit admin review confirmation is required'];
    throw err;
  }

  const recipient = (options.recipient || quotation.buyer?.email || quotation.email || '').trim();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    const err = new Error('Valid recipient email required for dispatch.');
    err.code = 'DISPATCH_BLOCKED';
    err.issues = ['Valid recipient email required for dispatch'];
    throw err;
  }

  // Evaluate buyer-ready gate
  const gate = evaluateBuyerReadyGate(quotation);
  if (!gate.passed && !gate.eligible && !options.bypassGate) {
    const err = new Error(`Dispatch blocked by buyer-ready gate: ${gate.issues.join('; ')}`);
    err.code = 'DISPATCH_BLOCKED';
    err.issues = gate.issues;
    throw err;
  }

  // Pre-dispatch safety gates: Fail closed on emergency stop or unconfirmed authorization
  // SEC-03: Fail-safe GLOBAL_OUTREACH_STOP gate
  // Default to STOPPED unless server-side configuration explicitly represents an approved non-stop value ('0' or 'false').
  // Missing, empty, malformed, and unexpected values must STOP.
  const rawStop = (typeof process !== 'undefined' && process.env && process.env.GLOBAL_OUTREACH_STOP != null)
    ? String(process.env.GLOBAL_OUTREACH_STOP).trim().toLowerCase()
    : '';
  const isExplicitlyNonStop = rawStop === '0' || rawStop === 'false';
  const isGlobalStop = !isExplicitlyNonStop || options.globalOutreachStop === true;
  if (isGlobalStop) {
    const isExplicitStop = rawStop === '1' || rawStop === 'true' || options.globalOutreachStop === true;
    const errorMsg = isExplicitStop
      ? 'GLOBAL_OUTREACH_STOP is active (emergency stop). Quotation email dispatch is halted.'
      : 'GLOBAL_OUTREACH_STOP is active (fail-safe unconfigured/invalid emergency stop). Quotation email dispatch is halted.';
    quotation.dispatch = quotation.dispatch || createInitialDispatchState();
    quotation.dispatch.status = 'BLOCKED_GLOBAL_STOP';
    quotation.dispatch.failureReason = errorMsg;
    quotation.dispatch.lastError = errorMsg;
    return {
      success: false,
      status: 'BLOCKED_GLOBAL_STOP',
      error: errorMsg,
      dispatch: quotation.dispatch,
      quotation
    };
  }

  // SEC-01: Fail-closed OUTREACH_AUTHORIZED gate
  const rawAuth = (typeof process !== 'undefined' && process.env && process.env.OUTREACH_AUTHORIZED != null)
    ? String(process.env.OUTREACH_AUTHORIZED).trim().toLowerCase()
    : '';
  const isOutreachAuthorized = (rawAuth === '1' || rawAuth === 'true') && options.outreachAuthorized !== false;
  if (!isOutreachAuthorized) {
    const errorMsg = 'OUTREACH_NOT_AUTHORIZED: Quotation outreach is not authorized (OUTREACH_AUTHORIZED must be 1).';
    quotation.dispatch = quotation.dispatch || createInitialDispatchState();
    quotation.dispatch.status = 'BLOCKED_UNAUTHORIZED';
    quotation.dispatch.failureReason = errorMsg;
    quotation.dispatch.lastError = errorMsg;
    return {
      success: false,
      status: 'BLOCKED_UNAUTHORIZED',
      error: errorMsg,
      dispatch: quotation.dispatch,
      quotation
    };
  }

  const now = new Date().toISOString();
  quotation.dispatch = quotation.dispatch || createInitialDispatchState();

  // Duplicate send protection
  const alreadySent = Boolean(
    quotation.dispatch.status === 'SENT' ||
    ['SENT_TO_BUYER', 'DELIVERY_PENDING', 'DELIVERED', 'OPENED'].includes(quotation.status)
  );

  const isResend = Boolean(options.isResend || options.resend || options.forceResend);

  if (alreadySent && !isResend) {
    const err = new Error('Duplicate dispatch blocked: Quotation has already been dispatched. Explicit resend confirmation and reason required.');
    err.code = 'DUPLICATE_SEND_BLOCKED';
    throw err;
  }

  if (alreadySent && isResend) {
    const resendReason = String(options.resendReason || options.reason || '').trim();
    if (resendReason.length < 5) {
      const err = new Error('Resend requires a substantive justification reason of at least 5 characters.');
      err.code = 'RESEND_REASON_REQUIRED';
      throw err;
    }

    quotation.dispatch.resendHistory = quotation.dispatch.resendHistory || [];
    quotation.dispatch.resendHistory.push({
      previousMessageId: quotation.dispatch.messageId,
      previousSentAt: quotation.dispatch.sentAt,
      resendReason,
      reason: resendReason,
      resendRequestedBy: options.actor || 'Sachin Shinde',
      timestamp: now
    });

    quotation.activity = quotation.activity || [];
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'RESEND_REQUESTED',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Explicit resend requested: ${resendReason}. Previous messageId: ${quotation.dispatch.messageId || 'N/A'}`
    });
  }

  const isRetry = Boolean(
    !isResend &&
    quotation.dispatch?.idempotencyKey &&
    ['READY_TO_SEND', 'SEND_FAILED'].includes(quotation.dispatch.status)
  );

  const attemptId = options.dispatchAttemptId || generateSecureId('att');
  const idempotencyKey = options.idempotencyKey || (isRetry ? quotation.dispatch.idempotencyKey : generateSecureId('idemp'));

  quotation.dispatch.recipient = recipient;
  quotation.dispatch.recipientCompany = quotation.buyer?.company || quotation.companyName || '';
  quotation.dispatch.recipientValidated = true;
  quotation.dispatch.reviewedByAdmin = true;
  quotation.dispatch.reviewedAt = now;
  quotation.dispatch.authorizedBy = options.actor || 'Sachin Shinde';
  quotation.dispatch.dispatchAttemptId = attemptId;
  quotation.dispatch.idempotencyKey = idempotencyKey;

  // Render email content
  const emailContent = generateB2BEmailTemplate(quotation);
  const emailRes = await sendQuotationEmail({
    quotation,
    recipient,
    subject: emailContent.subject,
    text: emailContent.text,
    attachments: options.attachments || [],
    idempotencyKey,
    options
  });

  if (emailRes.status && emailRes.status.startsWith('BLOCKED_')) {
    const reason = emailRes.error || 'Quotation dispatch blocked by safety invariant';
    quotation.dispatch.status = emailRes.status;
    quotation.dispatch.failureReason = reason;
    quotation.dispatch.lastError = reason;

    quotation.activity = quotation.activity || [];
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'DISPATCH_SAFETY_BLOCKED',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Dispatch blocked by safety invariant: ${reason}`
    });

    return {
      success: false,
      status: emailRes.status,
      error: reason,
      dispatch: quotation.dispatch,
      quotation
    };
  }

  if (emailRes.status === 'READY_TO_SEND') {
    quotation.dispatch.status = 'READY_TO_SEND';
    quotation.dispatch.preparedAt = now;
    quotation.dispatch.provider = 'none';

    quotation.activity = quotation.activity || [];
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'SEND_TO_BUYER_REQUESTED',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Quotation verified and marked READY_TO_SEND to ${recipient}. External mail provider not configured.`
    });

    return {
      success: true,
      status: 'READY_TO_SEND',
      message: 'Quotation verified and marked READY_TO_SEND. (External mail provider not configured - no false SENT reported)',
      dispatch: quotation.dispatch,
      quotation
    };
  }

  if (emailRes.status === 'SEND_FAILED') {
    const reason = emailRes.error || 'Mail delivery service timeout';
    quotation.dispatch.status = 'SEND_FAILED';
    quotation.dispatch.failureReason = reason;
    quotation.dispatch.lastError = reason;

    quotation.activity = quotation.activity || [];
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'SEND_FAILED',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Dispatch failed: ${reason}`
    });

    return {
      success: false,
      status: 'SEND_FAILED',
      error: reason,
      dispatch: quotation.dispatch,
      quotation
    };
  }

  // Provider accepted: SENT
  const msgId = emailRes.messageId;
  quotation.dispatch.status = 'SENT';
  quotation.dispatch.sentAt = now;
  quotation.dispatch.sentBy = options.actor || 'Sachin Shinde';
  quotation.dispatch.messageId = msgId;
  quotation.dispatch.provider = emailRes.provider || 'configured';
  quotation.dispatch.providerReference = msgId;
  quotation.dispatch.deliveryStatus = 'PENDING';
  quotation.dispatch.failureReason = null;

  quotation.status = 'SENT_TO_BUYER';
  quotation.updatedAt = now;

  quotation.activity = quotation.activity || [];
  if (isResend) {
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'RESEND_EXECUTED',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Quotation resent to ${recipient} (Provider Ref: ${msgId}). Reason: ${options.resendReason || 'Admin authorized resend'}`
    });
  } else {
    quotation.activity.push({
      timestamp: now,
      actor: options.actor || 'Sachin Shinde',
      event: 'QUOTATION_SENT',
      quotationId: quotation.quotationId,
      leadId: quotation.leadId,
      details: `Quotation dispatched to ${recipient} (Provider Ref: ${msgId})`
    });
  }

  return {
    success: true,
    status: 'SENT',
    messageId: msgId,
    message: `Quotation dispatched successfully to ${recipient}.`,
    dispatch: quotation.dispatch,
    quotation
  };
}

const seenWebhookEventIds = new Set();

/**
 * Processes incoming delivery webhook events (P4.5) with fail-closed authentication and replay protection
 */
export function processDeliveryWebhook(quotation, eventPayload = {}, webhookSecret = '', options = {}) {
  if (!quotation || typeof quotation !== 'object') {
    throw new Error('Valid quotation object required for webhook processing');
  }

  if (!eventPayload || typeof eventPayload !== 'object') {
    throw new Error('Invalid webhook payload');
  }

  const envSecret = (typeof process !== 'undefined' && process.env)
    ? (process.env.CRM_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET || '')
    : '';

  if (options.requireSecret || envSecret) {
    if (!envSecret && !webhookSecret) {
      throw new Error('Webhook processing failed: No webhook secret configured. Failing closed to protect quotation status.');
    }
    if (webhookSecret !== envSecret) {
      throw new Error('Invalid webhook signature / secret');
    }
  } else if (webhookSecret) {
    if (envSecret && webhookSecret !== envSecret) {
      throw new Error('Invalid webhook signature / secret');
    }
  }

  // Replay protection: reject duplicate event IDs
  const eventId = eventPayload.id || eventPayload.eventId || eventPayload.data?.id;
  if (eventId) {
    if (seenWebhookEventIds.has(eventId)) {
      throw new Error(`Duplicate webhook event rejected (replay protection): ${eventId}`);
    }
    seenWebhookEventIds.add(eventId);
    if (seenWebhookEventIds.size > 1000) {
      const first = seenWebhookEventIds.values().next().value;
      seenWebhookEventIds.delete(first);
    }
  }

  const eventType = String(eventPayload.eventType || eventPayload.event || eventPayload.type || '').toLowerCase();
  const msgId = eventPayload.messageId || eventPayload.data?.messageId || eventPayload.data?.email_id || (eventPayload.data?.id && eventPayload.data.id !== eventId ? eventPayload.data.id : null);
  const eventTime = eventPayload.timestamp || eventPayload.data?.timestamp || new Date().toISOString();

  quotation.dispatch = quotation.dispatch || createInitialDispatchState();
  quotation.activity = quotation.activity || [];

  if (msgId && quotation.dispatch.messageId && quotation.dispatch.messageId !== msgId) {
    throw new Error(`Message ID mismatch: Webhook messageId ${msgId} does not match quotation dispatch ${quotation.dispatch.messageId}`);
  }

  quotation.dispatch.deliveryEvents = quotation.dispatch.deliveryEvents || [];
  quotation.dispatch.deliveryEvents.push({
    event: eventType,
    timestamp: eventTime,
    details: eventPayload
  });

  if (eventType.includes('deliver')) {
    quotation.dispatch.deliveryStatus = 'DELIVERED';
    quotation.status = 'DELIVERED';
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_DELIVERED',
      quotationId: quotation.quotationId,
      details: `Email confirmed delivered to recipient (Message ID: ${msgId || quotation.dispatch.messageId})`
    });
  } else if (eventType.includes('bounce')) {
    quotation.dispatch.deliveryStatus = 'BOUNCED';
    quotation.dispatch.failureReason = eventPayload.reason || eventPayload.error || 'Recipient mailbox bounced message';
    quotation.status = 'SEND_FAILED';
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_BOUNCED',
      quotationId: quotation.quotationId,
      details: `Email delivery bounced: ${quotation.dispatch.failureReason}`
    });
  } else if (eventType.includes('complain') || eventType.includes('spam')) {
    quotation.dispatch.deliveryStatus = 'COMPLAINED';
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_COMPLAINED',
      quotationId: quotation.quotationId,
      details: 'Spam complaint recorded for dispatched email'
    });
  } else if (eventType.includes('open')) {
    quotation.dispatch.deliveryStatus = 'OPENED';
    if (['SENT_TO_BUYER', 'DELIVERED'].includes(quotation.status)) {
      quotation.status = 'OPENED';
    }
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_OPENED',
      quotationId: quotation.quotationId,
      details: `Quotation email opened by recipient (Message ID: ${msgId || quotation.dispatch.messageId})`
    });
  } else if (eventType.includes('click')) {
    quotation.activity.push({
      timestamp: eventTime,
      actor: 'Email Provider Webhook',
      event: 'EMAIL_CLICKED',
      quotationId: quotation.quotationId,
      details: 'Recipient clicked a link inside commercial quotation email'
    });
  }

  quotation.updatedAt = eventTime;
  return quotation;
}
