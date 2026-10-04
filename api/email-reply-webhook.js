// ============================================================
// AVANI AGRO FOODS — Inbound Email & Reply Webhook Endpoint
// api/email-reply-webhook.js
// Phase 3J: Secure Inbound Webhook, Svix Verification & Auto-Cancel
// ============================================================

import crypto from 'crypto';
import { processInboundReply } from './_lib/replyDetector.js';
import {
  hasEventBeenProcessed,
  recordProcessedEvent,
  recordBounce
} from './_lib/sequencePersistence.js';

/**
 * Verify Svix Webhook Signature (Resend Standard)
 */
function verifySvixSignature(rawBody, headers, secret) {
  if (!secret) return false;

  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Prevent replay attacks: timestamp must be within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const msgTime = parseInt(svixTimestamp, 10);
  if (isNaN(msgTime) || Math.abs(now - msgTime) > 300) {
    return false;
  }

  try {
    // Secret may start with whsec_ and be base64-encoded
    const cleanSecret = secret.startsWith('whsec_') ? secret.substring(6) : secret;
    const key = Buffer.from(cleanSecret, 'base64');
    const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
    
    const computedHmac = crypto.createHmac('sha256', key).update(toSign).digest('base64');

    // Split multiple signatures if present (e.g. v1,sig1 v1,sig2)
    const passedSignatures = svixSignature.split(' ').map(s => s.trim());
    return passedSignatures.some(sig => {
      const parts = sig.split(',');
      if (parts.length < 2) return false;
      const sigValue = parts[1];
      try {
        return crypto.timingSafeEqual(Buffer.from(computedHmac), Buffer.from(sigValue));
      } catch (e) {
        return false;
      }
    });
  } catch (err) {
    return false;
  }
}

/**
 * Direct Secret Verification (Fallback for CRM/Zapier/direct proxy webhooks)
 */
function verifyDirectSecret(headers, secret) {
  if (!secret) return false;
  const provided = headers['x-webhook-secret'] || (headers['authorization'] ? headers['authorization'].replace(/^Bearer\s+/i, '') : null);
  if (!provided) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
  } catch (e) {
    return false;
  }
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

  // 3. Webhook Authentication (Fail-Closed)
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET || process.env.CRM_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[EmailWebhook] Rejected: No webhook secret configured in environment.');
    return res.status(500).json({
      error: 'Webhook endpoint is unconfigured. Failing closed for safety.',
      code: 'WEBHOOK_UNCONFIGURED'
    });
  }

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const headers = req.headers || {};

  const isSvixValid = headers['svix-signature'] ? verifySvixSignature(rawBody, headers, webhookSecret) : false;
  const isDirectValid = verifyDirectSecret(headers, webhookSecret);

  if (!isSvixValid && !isDirectValid) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing webhook signature/secret.',
      code: 'WEBHOOK_UNAUTHORIZED'
    });
  }

  // 4. Payload Validation
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({
      error: 'Bad Request: Malformed JSON payload.',
      code: 'PAYLOAD_MALFORMED'
    });
  }

  // 5. Replay & Duplicate Event Protection (PART I)
  const eventId = String(
    headers['svix-id'] || payload.id || payload.eventId || payload.data?.id || payload.data?.email_id || ''
  ).trim();

  if (eventId && hasEventBeenProcessed(eventId)) {
    return res.status(200).json({
      success: true,
      duplicate: true,
      message: `Event ${eventId} has already been processed. Idempotent acknowledgment.`,
      code: 'EVENT_ALREADY_PROCESSED'
    });
  }

  try {
    const eventType = String(payload.type || payload.event || '').toLowerCase();

    // 6. Handle Delivery / Bounce Events
    if (eventType.includes('bounce')) {
      const email = payload.data?.to?.[0] || payload.data?.email || payload.recipient;
      if (eventId) recordProcessedEvent(eventId, { type: 'BOUNCE', email });
      return res.status(200).json({
        success: true,
        action: 'BOUNCE_ACKNOWLEDGED',
        recipient: email
      });
    }

    // 7. Handle Inbound Reply Events (email.received or direct inbound)
    const replyResult = processInboundReply(payload);

    if (eventId) {
      recordProcessedEvent(eventId, {
        type: eventType,
        action: replyResult.action,
        matched: replyResult.success,
        recipientId: replyResult.recipientId || null
      });
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
      message: 'Webhook processed; event did not match an active outbound outreach sequence.',
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
