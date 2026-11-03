// ============================================================
// AVANI AGRO FOODS — Inbound Email & Reply Webhook Endpoint
// api/email-reply-webhook.js
// Phase 3J & Phase 2: Secure Inbound Webhook, Stream Raw-Body Svix Verification & Auto-Cancel
// ============================================================

import crypto from 'crypto';
import { processInboundReply, processInboundReplyAsync } from './_lib/replyDetector.js';
import {
  hasEventBeenProcessed,
  recordProcessedEvent,
  claimEventDistributed,
  completeEventDistributed,
  recordBounceDistributed,
  isDistributedKvRequired
} from './_lib/sequencePersistence.js';

/**
 * Vercel Serverless Function Config
 * Disable automated body parsing so exact incoming bytes are preserved for Svix HMAC verification.
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1 MB ceiling

/**
 * Safely resolves raw body bytes and parsed payload.
 * Supports readable streams (Vercel serverless / HTTP), string bodies, and mock objects.
 */
async function getRawBodyAndPayload(req) {
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
          } catch (e) {
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

  // Mode B: String body (Passed in unit tests / pre-buffered runners)
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
    } catch (e) {
      parsed = null;
    }
    return { rawBody: req.body, payload: parsed };
  }

  // Mode C: Pre-parsed object (Existing mock test harnesses)
  const rawBody = JSON.stringify(req.body || {});
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_PAYLOAD_BYTES) {
    const err = new Error('Payload exceeds maximum allowed size of 1MB');
    err.code = 'PAYLOAD_TOO_LARGE';
    err.statusCode = 413;
    throw err;
  }
  return { rawBody, payload: req.body };
}

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
        const computedBuf = Buffer.from(computedHmac);
        const sigBuf = Buffer.from(sigValue);
        if (computedBuf.length !== sigBuf.length) return false;
        return crypto.timingSafeEqual(computedBuf, sigBuf);
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
    const provBuf = Buffer.from(provided);
    const secBuf = Buffer.from(secret);
    if (provBuf.length !== secBuf.length) return false;
    return crypto.timingSafeEqual(provBuf, secBuf);
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

  // 3. Resolve incoming payload & enforce body size limits
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

  // 4. Webhook Authentication (Fail-Closed)
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET || process.env.CRM_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[EmailWebhook] Rejected: No webhook secret configured in environment.');
    return res.status(500).json({
      error: 'Webhook endpoint is unconfigured. Failing closed for safety.',
      code: 'WEBHOOK_UNCONFIGURED'
    });
  }

  const headers = req.headers || {};
  const isSvixValid = headers['svix-signature'] ? verifySvixSignature(rawBody, headers, webhookSecret) : false;
  const isDirectValid = verifyDirectSecret(headers, webhookSecret);

  if (!isSvixValid && !isDirectValid) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing webhook signature/secret.',
      code: 'WEBHOOK_UNAUTHORIZED'
    });
  }

  // 5. Payload Validation (Must be valid JSON object)
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({
      error: 'Bad Request: Malformed JSON payload.',
      code: 'PAYLOAD_MALFORMED'
    });
  }

  // 5. Replay & Duplicate Event Protection (Distributed Atomic Claim with Lease)
  const eventId = String(
    headers['svix-id'] || payload.id || payload.eventId || payload.data?.id || payload.data?.email_id || ''
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
      // Non-strict fallback to sync in-memory check (isolated test / local development only)
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

    // 6. Handle Delivery / Bounce Events
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

    // 7. Handle Inbound Reply Events (email.received or direct inbound)
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
