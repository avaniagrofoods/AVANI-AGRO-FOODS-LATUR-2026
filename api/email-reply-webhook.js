// ============================================================
// AVANI AGRO FOODS — Inbound Email & Reply Webhook Endpoint
// api/email-reply-webhook.js
// Package 3F.106 Hardened (CC-06, CC-08):
// - Confirmed provider: Resend (Svix webhook signature protocol)
// - Strictly verifies raw-body HMAC-SHA256 signature (svix-id, svix-timestamp, svix-signature)
// - Enforces 5-minute timestamp tolerance and distributed atomic event-ID replay protection
// - Rejects plaintext secrets in query parameters, request body fields, or static headers
// - Fails closed (503) if RESEND_WEBHOOK_SECRET or required distributed KV is unavailable
// ============================================================

import { processInboundReplyAsync } from './_lib/replyDetector.js';
import {
  hasEventBeenProcessed,
  recordProcessedEvent,
  claimEventDistributed,
  completeEventDistributed,
  isDistributedKvRequired
} from './_lib/sequencePersistence.js';
import {
  getClientIp,
  checkRateLimit,
  verifySvixSignature
} from './_lib/auth.js';

/**
 * Vercel Serverless Function Config
 * Disable automated body parsing so exact incoming bytes are preserved for Svix HMAC verification.
 */
export const config = {
  api: {
    bodyParser: false
  }
};

const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1 MB ceiling

/**
 * Safely resolves raw body bytes and parsed payload.
 * Supports readable streams (Vercel serverless / HTTP), string/Buffer bodies, and mock objects with rawBody.
 */
async function getRawBodyAndPayload(req) {
  if (typeof req.rawBody === 'string' || Buffer.isBuffer(req.rawBody)) {
    const rawStr = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : req.rawBody;
    if (Buffer.byteLength(rawStr, 'utf8') > MAX_PAYLOAD_BYTES) {
      const err = new Error('Payload exceeds maximum allowed size of 1MB');
      err.code = 'PAYLOAD_TOO_LARGE';
      err.statusCode = 413;
      throw err;
    }
    let parsed = req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : null;
    if (!parsed && rawStr.trim()) {
      try {
        parsed = JSON.parse(rawStr);
      } catch {
        parsed = null;
      }
    }
    return { rawBody: rawStr, payload: parsed };
  }

  // Mode A: Readable stream (Standard Node.js / Vercel with bodyParser: false)
  if (typeof req.on === 'function' && (!req.body || Buffer.isBuffer(req.body))) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let totalBytes = 0;
      let exceeded = false;

      req.on('data', (chunk) => {
        if (exceeded) return;
        totalBytes += chunk.length;
        if (totalBytes > MAX_PAYLOAD_BYTES) {
          exceeded = true;
          const err = new Error('Payload exceeds maximum allowed size of 1MB');
          err.code = 'PAYLOAD_TOO_LARGE';
          err.statusCode = 413;
          return reject(err);
        }
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      });

      req.on('end', () => {
        if (exceeded) return;
        const rawBody = Buffer.concat(chunks).toString('utf8');
        let parsed = null;
        if (rawBody.trim()) {
          try {
            parsed = JSON.parse(rawBody);
          } catch {
            parsed = null;
          }
        }
        resolve({ rawBody, payload: parsed });
      });

      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  // Mode B: String body
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > MAX_PAYLOAD_BYTES) {
      const err = new Error('Payload exceeds maximum allowed size of 1MB');
      err.code = 'PAYLOAD_TOO_LARGE';
      err.statusCode = 413;
      throw err;
    }
    let parsed = null;
    try {
      parsed = JSON.parse(req.body);
    } catch {
      parsed = null;
    }
    return { rawBody: req.body, payload: parsed };
  }

  // Mode C: Pre-parsed object (Test harness fallback)
  const rawBody = JSON.stringify(req.body || {});
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_PAYLOAD_BYTES) {
    const err = new Error('Payload exceeds maximum allowed size of 1MB');
    err.code = 'PAYLOAD_TOO_LARGE';
    err.statusCode = 413;
    throw err;
  }
  return { rawBody, payload: req.body };
}

export default async function handler(req, res) {
  // 1. Strict Method Restriction (POST only)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Inbound email webhook requires POST requests.'
    });
  }

  // 2. Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // 3. CC-06: Reject any plaintext secret passed via query parameters
  const reqUrl = new URL(req.url || '/api/email-reply-webhook', 'http://localhost');
  if (
    req.query?.secret !== undefined ||
    req.query?.webhookSecret !== undefined ||
    req.query?.token !== undefined ||
    reqUrl.searchParams.has('secret') ||
    reqUrl.searchParams.has('webhookSecret') ||
    reqUrl.searchParams.has('token')
  ) {
    return res.status(400).json({
      error: 'Bad Request: Plaintext webhook secrets in query parameters are forbidden.',
      code: 'UNTRUSTED_SECRET_SOURCE'
    });
  }

  // 4. Resolve incoming payload & enforce body size limits
  let rawBody = '';
  let payload = null;
  try {
    const resolved = await getRawBodyAndPayload(req);
    rawBody = resolved.rawBody;
    payload = resolved.payload;
  } catch (bErr) {
    if (bErr.code === 'PAYLOAD_TOO_LARGE' || bErr.statusCode === 413) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'Webhook request exceeds maximum allowed size of 1MB.',
        code: 'PAYLOAD_TOO_LARGE'
      });
    }
    return res.status(400).json({
      error: 'Bad Request',
      message: bErr.message || 'Error processing request body.',
      code: 'BODY_READ_ERROR'
    });
  }

  // 5. CC-06: Reject any plaintext secret passed via untrusted body fields
  if (payload && typeof payload === 'object' && (payload.webhookSecret !== undefined || payload.secret !== undefined)) {
    return res.status(400).json({
      error: 'Bad Request: Plaintext webhook secrets in request body fields are forbidden.',
      code: 'UNTRUSTED_SECRET_SOURCE'
    });
  }

  // 6. CC-06: Provider-Confirmed Webhook Authentication (Resend / Svix Raw-Body HMAC + Timestamp)
  // If RESEND_WEBHOOK_SECRET is not configured, keep the webhook safely disabled (503).
  const resendWebhookSecret = (process.env.RESEND_WEBHOOK_SECRET || '').trim();
  if (!resendWebhookSecret) {
    console.error('[EmailWebhook] Rejected: RESEND_WEBHOOK_SECRET is not configured. Webhook safely disabled.');
    return res.status(503).json({
      error: 'Webhook endpoint is disabled: RESEND_WEBHOOK_SECRET is not configured. Failing closed.',
      code: 'WEBHOOK_UNCONFIGURED'
    });
  }

  const headers = req.headers || {};
  const svixCheck = verifySvixSignature(rawBody, headers, resendWebhookSecret);
  if (!svixCheck.valid) {
    return res.status(401).json({
      error: `Unauthorized: ${svixCheck.reason}`,
      code: 'WEBHOOK_UNAUTHORIZED'
    });
  }

  // 7. CC-08: Distributed Rate Limiting
  const clientIp = getClientIp(req);
  const rateLimit = await checkRateLimit(clientIp, 'email_reply_webhook', { maxAttempts: 120, windowSeconds: 900 });
  if (rateLimit.limited) {
    if (rateLimit.backendUnavailable) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: rateLimit.error || 'Distributed state backend unavailable. Failing closed under mandatory distributed KV policy.',
        code: 'DISTRIBUTED_KV_UNAVAILABLE'
      });
    }
    return res.status(429).json({
      error: 'Too Many Requests',
      code: rateLimit.code || 'RATE_LIMIT_EXCEEDED'
    });
  }

  // 8. Payload Validation (Must be valid JSON object)
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({
      error: 'Bad Request: Malformed JSON payload.',
      code: 'PAYLOAD_MALFORMED'
    });
  }

  // 9. Replay & Duplicate Event Protection (Distributed Atomic Claim with Lease)
  const eventId = String(
    svixCheck.svixId || headers['svix-id'] || payload.id || payload.eventId || payload.data?.id || payload.data?.email_id || ''
  ).trim();

  if (!eventId) {
    return res.status(400).json({
      error: 'Bad Request: Missing required event identifier.',
      message: 'Webhook payloads must contain a unique event ID (svix-id header, id, eventId, data.id, or data.email_id) for deduplication and idempotency.',
      code: 'MISSING_EVENT_ID'
    });
  }

  const workerId = `worker_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let claimResult = null;
  if (eventId) {
    try {
      claimResult = await claimEventDistributed(eventId, workerId);
      if (claimResult.duplicate) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: `Event ${eventId} has already been processed or is in-flight. Idempotent acknowledgment.`,
          code: claimResult.status === 'CLAIMED' ? 'EVENT_IN_FLIGHT' : 'EVENT_ALREADY_PROCESSED'
        });
      }
    } catch (err) {
      if (isDistributedKvRequired()) {
        console.error('[EmailWebhook] Distributed KV failure under strict enforcement:', err.message);
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Distributed state backend unavailable. Failing closed under mandatory distributed KV policy.',
          code: 'DISTRIBUTED_KV_UNAVAILABLE'
        });
      }
      if (hasEventBeenProcessed(eventId)) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: `Event ${eventId} has already been processed. Idempotent acknowledgment.`,
          code: 'EVENT_ALREADY_PROCESSED'
        });
      }
    }
  }

  try {
    const eventType = String(payload.type || payload.event || '').toLowerCase();
    const messageId = payload.data?.email_id || payload.messageId || payload.data?.messageId || null;

    // Sync quotation delivery status if messageId maps to an outgoing quotation in Supabase
    if (messageId && (eventType.includes('deliver') || eventType.includes('bounce') || eventType.includes('complain') || eventType.includes('open') || eventType.includes('sent'))) {
      try {
        const { isSupabaseConfigured, getQuotationByMessageIdFromSupabase, updateQuotationDeliveryStatusInSupabase } = await import('./_lib/supabaseClient.js');
        if (isSupabaseConfigured()) {
          const lookup = await getQuotationByMessageIdFromSupabase(messageId);
          if (lookup.success && lookup.quotation) {
            const qId = lookup.quotation.quotation_id;
            let deliveryStatus = lookup.quotation.delivery_status || 'pending';
            let updateStatus = lookup.quotation.status || 'DRAFT';
            let deliveredAt = lookup.quotation.delivered_at || null;
            let bouncedAt = lookup.quotation.bounced_at || null;
            const eventTime = payload.timestamp || payload.data?.created_at || new Date().toISOString();
            if (eventType.includes('deliver')) {
              deliveryStatus = 'delivered';
              updateStatus = 'DELIVERED';
              deliveredAt = eventTime;
            } else if (eventType.includes('bounce')) {
              deliveryStatus = 'bounced';
              updateStatus = 'SEND_FAILED';
              bouncedAt = eventTime;
            } else if (eventType.includes('complain')) {
              deliveryStatus = 'complained';
            } else if (eventType.includes('open')) {
              deliveryStatus = 'opened';
              if (updateStatus === 'SENT_TO_BUYER') updateStatus = 'OPENED';
            } else if (eventType.includes('sent') && deliveryStatus === 'pending') {
              deliveryStatus = 'sent';
            }
            await updateQuotationDeliveryStatusInSupabase(qId, {
              status: updateStatus,
              deliveryStatus,
              deliveredAt,
              bouncedAt,
              updatedBy: 'resend_webhook_bridge'
            });
          }
        }
      } catch (qSyncErr) {
        console.warn('[EmailWebhook] Quotation delivery sync notice:', qSyncErr.message);
      }
    }

    // 10. Handle Delivery / Bounce Events
    if (eventType.includes('bounce')) {
      const email = payload.data?.to?.[0] || payload.data?.email || payload.recipient;
      if (eventId) {
        recordProcessedEvent(eventId, { type: 'BOUNCE', email });
        await completeEventDistributed(eventId, { type: 'BOUNCE', email }, 604800, workerId).catch(() => {});
      }
      return res.status(200).json({
        success: true,
        action: 'BOUNCE_ACKNOWLEDGED',
        recipient: email
      });
    }

    // 11. Handle Inbound Reply Events (email.received or direct inbound)
    const replyResult = await processInboundReplyAsync(payload);

    if (eventId) {
      const details = {
        type: eventType,
        action: replyResult.action,
        matched: replyResult.success,
        recipientId: replyResult.recipientId || null
      };
      recordProcessedEvent(eventId, details);
      await completeEventDistributed(eventId, details, 604800, workerId).catch(() => {});
    }

    if (replyResult.success) {
      return res.status(200).json({
        success: true,
        action: replyResult.action,
        message: 'Inbound buyer reply processed. All future automated follow-up sequences have been permanently cancelled.',
        recipientId: replyResult.recipientId,
        campaignId: replyResult.campaignId,
        sequenceStatus: replyResult.state?.status
      });
    }

    if (replyResult.action === 'FLAGGED_MANUAL_REVIEW') {
      return res.status(200).json({
        success: true,
        action: 'FLAGGED_MANUAL_REVIEW',
        message: 'Ambiguous reply match. Follow-ups held and record flagged for manual human operator review.',
        reason: replyResult.reason
      });
    }

    return res.status(200).json({
      success: true,
      action: 'IGNORED_UNMATCHED',
      message: 'Webhook processed; event did not match an active outbound outbound outreach sequence.',
      reason: replyResult.reason
    });

  } catch (err) {
    console.error('[EmailWebhook] Internal processing error:', err.message);
    return res.status(500).json({
      error: 'Internal Webhook Processing Error',
      message: err.message
    });
  }
}
