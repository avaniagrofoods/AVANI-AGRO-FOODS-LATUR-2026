// ============================================================
// AVANI AGRO FOODS — ADMIN QUOTATION MANAGEMENT API
// Endpoints:
// - GET  /api/admin-quotations -> Returns recent leads & quotations (Auth required)
// - POST /api/admin-quotations -> Create custom quote or update status (Auth + CSRF required)
//
// Security Hardening (Package 3F.106 — CC-01, CC-02, CC-03, CC-04, CC-06, CC-07, CC-08):
// - Master password Bearer token bypass removed
// - Verified server-side session (avani_gate_session) with KV revocation required
// - Exact Origin/Referer and session-bound CSRF token required on POST mutations
// - Audit actor derived strictly from verified server session (never req.body.actor)
// - Distributed rate limiting enforced
// - Delivery webhook requires verified Resend/Svix raw-body HMAC signature + timestamp
// ============================================================

import { calculateQuotation } from './_lib/quotationEngine.js';
import {
  getClientIp,
  checkRateLimit,
  verifyServerSession,
  isAllowedOrigin,
  verifyCsrfRequest,
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

const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1 MB payload limit

/**
 * Safely resolves raw body bytes and parsed payload from readable stream or buffer.
 */
async function getRawBodyAndPayload(req) {
  if (req.rawBody === null) {
    return { rawBody: null, payload: req.body || null };
  }

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

  // Mode C: Pre-parsed object (Test harness / framework fallback)
  const rawBody = JSON.stringify(req.body || {});
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_PAYLOAD_BYTES) {
    const err = new Error('Payload exceeds maximum allowed size of 1MB');
    err.code = 'PAYLOAD_TOO_LARGE';
    err.statusCode = 413;
    throw err;
  }
  return { rawBody, payload: req.body };
}

export async function verifyAdminAuth(req) {
  return await verifyServerSession(req, 'gate');
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // If POST, safely consume raw stream and resolve req.rawBody & req.body
  if (req.method === 'POST') {
    try {
      const { rawBody, payload } = await getRawBodyAndPayload(req);
      req.rawBody = rawBody;
      req.body = payload || {};
    } catch (bodyErr) {
      return res.status(bodyErr.statusCode || 400).json({
        error: bodyErr.message || 'Invalid request body stream.',
        code: bodyErr.code || 'INVALID_REQUEST_BODY'
      });
    }
  }

  const url = new URL(req.url || '/api/admin-quotations', 'http://localhost');
  const action = req.body?.action || req.query?.action || url.searchParams.get('action');
  const isWebhook = req.method === 'POST' && (action === 'delivery-webhook' || action === 'webhook');

  // Exact browser Origin validation for interactive requests.
  // Delivery webhooks use cryptographic Svix signature verification instead of browser Origin headers.
  if (!isWebhook && !isAllowedOrigin(req)) {
    return res.status(403).json({
      error: 'Forbidden origin',
      code: 'ORIGIN_FORBIDDEN'
    });
  }

  // CC-08: Distributed rate limiting
  const clientIp = getClientIp(req);
  const rateLimit = await checkRateLimit(clientIp, 'admin_quotations', { maxAttempts: 60, windowSeconds: 900 });
  if (rateLimit.limited) {
    return res.status(rateLimit.statusCode || 429).json({
      error: rateLimit.error || 'Too many requests. Please try again later.',
      code: rateLimit.code
    });
  }

  // CC-06: Handle delivery-webhook strictly via verified Resend/Svix raw-body signature
  if (isWebhook) {
    const querySecret = req.query?.secret || req.query?.webhookSecret || url.searchParams.get('secret') || url.searchParams.get('webhookSecret');
    const bodySecret = req.body?.webhookSecret || req.body?.secret || req.body?.eventPayload?.webhookSecret || req.body?.eventPayload?.secret;
    if (querySecret !== undefined && querySecret !== null || bodySecret !== undefined && bodySecret !== null) {
      return res.status(400).json({
        error: 'Plaintext webhook secrets in query parameters or request body fields are forbidden.',
        code: 'UNTRUSTED_SECRET_SOURCE'
      });
    }

    const resendSecret = (process.env.RESEND_WEBHOOK_SECRET || '').trim();
    if (!resendSecret) {
      return res.status(503).json({
        error: 'Webhook endpoint is disabled: RESEND_WEBHOOK_SECRET is not configured.',
        code: 'WEBHOOK_UNCONFIGURED'
      });
    }

    if (req.rawBody === undefined || req.rawBody === null || (typeof req.rawBody !== 'string' && !Buffer.isBuffer(req.rawBody))) {
      return res.status(503).json({
        error: 'Webhook endpoint requires raw request body stream for Resend/Svix cryptographic verification.',
        code: 'WEBHOOK_RAW_BODY_REQUIRED'
      });
    }

    const sigCheck = verifySvixSignature(req.rawBody, req.headers || {}, resendSecret);
    if (!sigCheck.valid) {
      return res.status(401).json({
        error: `Unauthorized webhook: ${sigCheck.reason}`,
        code: 'WEBHOOK_UNAUTHORIZED'
      });
    }

    const rawBodyObj = req.body || {};
    const quotation = rawBodyObj.quotation;
    const eventPayload = rawBodyObj.eventPayload || rawBodyObj;

    const eventId = sigCheck.svixId || eventPayload?.id || rawBodyObj?.id || eventPayload?.data?.id;
    if (!eventId) {
      return res.status(400).json({
        error: 'MISSING_EVENT_ID: Webhook event ID is required for replay protection.',
        code: 'MISSING_EVENT_ID'
      });
    }

    const eventType = String(eventPayload?.type || eventPayload?.eventType || rawBodyObj?.type || '').toLowerCase();
    const messageId = eventPayload?.data?.email_id || eventPayload?.messageId || rawBodyObj?.data?.email_id || rawBodyObj?.messageId;

    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const {
      processDeliveryWebhook,
      claimQuotationWebhookDistributed,
      completeQuotationWebhookDistributed,
      releaseQuotationWebhookDistributed
    } = await import('./_lib/quotationModel.js');

    let claim = null;
    if (eventId) {
      claim = await claimQuotationWebhookDistributed(eventId, workerId);
      if (claim.duplicate) {
        if (quotation && typeof quotation === 'object') {
          return res.status(400).json({
            error: `Duplicate webhook event rejected (replay protection): ${eventId}`,
            code: 'DUPLICATE_WEBHOOK_EVENT'
          });
        }
        if (claim.status === 'CLAIMED') {
          // Owner Decision 2 (FIND-111-05): Active in-flight webhook claims must return HTTP 429 with Retry-After: 15
          res.setHeader('Retry-After', '15');
          return res.status(429).json({
            error: `Webhook event ${eventId} is currently in-flight. Retry requested.`,
            code: 'EVENT_IN_FLIGHT',
            retryAfter: 15
          });
        }
        return res.status(200).json({
          success: true,
          duplicate: true,
          message: `Webhook event ${eventId} already processed. Idempotent acknowledgment.`,
          code: 'EVENT_ALREADY_PROCESSED'
        });
      }
    }

    if (quotation && typeof quotation === 'object') {
      const payloadWithEventId = {
        ...(eventPayload && typeof eventPayload === 'object' ? eventPayload : {}),
        id: eventId,
        type: eventType,
        messageId
      };

      try {
        const updated = processDeliveryWebhook(quotation, payloadWithEventId, '', {
          verifiedSignature: true,
          requireSecret: true,
          requireEventId: true,
          deferClaimCompletion: true
        });

        // If Supabase is configured, persist delivery update strictly (FIND-111-04)
        const { isSupabaseConfigured, saveQuotationToSupabase } = await import('./_lib/supabaseClient.js');
        if (isSupabaseConfigured()) {
          const persistResult = await saveQuotationToSupabase(updated);
          if (!persistResult.persisted) {
            console.error('[Admin Quotations API] Webhook Supabase save failed:', persistResult.error);
            if (eventId && claim?.leaseToken) {
              await releaseQuotationWebhookDistributed(eventId, workerId, claim.leaseToken).catch(() => {});
            }
            return res.status(503).json({
              error: 'Database persistence unavailable during delivery webhook processing. Failing closed for retry.',
              code: 'DATABASE_UNAVAILABLE'
            });
          }
        }

        if (eventId) {
          const completion = await completeQuotationWebhookDistributed(
            eventId,
            {
              type: eventType,
              messageId,
              quotationId: updated.quotationId,
              status: updated.status
            },
            604800,
            workerId,
            claim?.leaseToken || null
          );
          if (!completion.completed) {
            return res.status(409).json({
              error: completion.error || 'Webhook lease ownership lost before completion.',
              code: completion.reason || 'WEBHOOK_LEASE_LOST'
            });
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Webhook processed successfully.',
          quotation: updated
        });
      } catch (wErr) {
        if (eventId && claim?.leaseToken) {
          await releaseQuotationWebhookDistributed(eventId, workerId, claim.leaseToken).catch(() => {});
        }
        return res.status(400).json({
          error: wErr.message,
          code: wErr.code || 'WEBHOOK_PROCESSING_ERROR'
        });
      }
    }

    // Direct provider delivery webhook (without attached quotation payload, e.g. from Resend)
    let dbUpdateSuccess = true;
    let dbErrorMessage = null;

    if (messageId) {
      const { isSupabaseConfigured, getQuotationByMessageIdFromSupabase, updateQuotationDeliveryStatusInSupabase } = await import('./_lib/supabaseClient.js');
      if (isSupabaseConfigured()) {
        try {
          const lookup = await getQuotationByMessageIdFromSupabase(messageId);
          if (!lookup.success) {
            dbUpdateSuccess = false;
            dbErrorMessage = lookup.error || 'Supabase lookup failed during delivery webhook';
          } else if (lookup.quotation) {
            const qId = lookup.quotation.quotation_id;
            const currentDelivery = lookup.quotation.delivery_status || 'pending';
            const currentStatus = lookup.quotation.status || 'DRAFT';
            let deliveryStatus = currentDelivery;
            let updateStatus = currentStatus;
            let deliveredAt = lookup.quotation.delivered_at || null;
            let bouncedAt = lookup.quotation.bounced_at || null;
            const eventTime = eventPayload?.timestamp || eventPayload?.data?.timestamp || new Date().toISOString();

            // Strict Monotonic Delivery State Machine (FIND-111-06)
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
              if (updateStatus === 'SENT_TO_BUYER') {
                updateStatus = 'OPENED';
              }
            } else if (eventType.includes('sent')) {
              if (currentDelivery === 'pending') {
                deliveryStatus = 'sent';
              }
            }
            // Other events (e.g. click, delay) leave deliveryStatus intact without regressing to pending

            const updateResult = await updateQuotationDeliveryStatusInSupabase(qId, {
              status: updateStatus,
              deliveryStatus,
              deliveredAt,
              bouncedAt,
              updatedBy: 'resend_webhook'
            });

            if (!updateResult.success) {
              dbUpdateSuccess = false;
              dbErrorMessage = updateResult.error;
            }
          }
        } catch (dbErr) {
          dbUpdateSuccess = false;
          dbErrorMessage = dbErr.message;
        }
      }
    }

    if (!dbUpdateSuccess) {
      console.error('[Admin Quotations API] Delivery tracking DB failure:', dbErrorMessage);
      if (eventId && claim?.leaseToken) {
        await releaseQuotationWebhookDistributed(eventId, workerId, claim.leaseToken).catch(() => {});
      }
      return res.status(503).json({
        error: 'Database persistence unavailable during delivery webhook tracking. Failing closed for retry.',
        code: 'DATABASE_UNAVAILABLE'
      });
    }

    if (eventId) {
      const completion = await completeQuotationWebhookDistributed(
        eventId,
        {
          type: eventType,
          messageId: messageId || null
        },
        604800,
        workerId,
        claim?.leaseToken || null
      );
      if (!completion.completed) {
        return res.status(409).json({
          error: completion.error || 'Webhook lease ownership lost before completion.',
          code: completion.reason || 'WEBHOOK_LEASE_LOST'
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook signature verified and delivery event recorded.',
      eventId,
      eventType,
      messageId: messageId || null
    });
  }

  // CC-01 & CC-03: Verify server-side session & revocation for all admin routes
  const authSession = await verifyAdminAuth(req);
  if (!authSession.authenticated) {
    return res.status(authSession.statusCode || 401).json({
      error: authSession.error || 'Unauthorized: Valid Admin Session Required.',
      code: authSession.code,
      authenticated: false
    });
  }

  // CC-04: Enforce Origin/Referer and CSRF token verification on all POST mutations
  if (req.method === 'POST') {
    const csrfCheck = verifyCsrfRequest(req, authSession);
    if (!csrfCheck.valid) {
      return res.status(csrfCheck.statusCode || 403).json({
        error: csrfCheck.error,
        code: csrfCheck.code
      });
    }
  }

  // CC-07: Derive authenticated actor strictly from verified server-side session
  const authenticatedActor = authSession.actor;
  const authenticatedRole = authSession.actorRole;

  try {
    if (req.method === 'GET') {
      if (action === 'get-products') {
        const { PRODUCT_MASTER } = await import('./_lib/productMaster.js');
        return res.status(200).json({
          success: true,
          products: PRODUCT_MASTER
        });
      }

      if (action === 'ecosystem-operations') {
        const { getUnifiedEcosystemOperationsView } = await import('./_lib/ecosystemIntegration.js');
        const { isSupabaseConfigured, fetchQuotationsFromSupabase } = await import('./_lib/supabaseClient.js');
        let supaQuotes = [];
        if (isSupabaseConfigured()) {
          try {
            const sq = await fetchQuotationsFromSupabase({ limit: 100, offset: 0 });
            if (sq.success && Array.isArray(sq.quotations)) supaQuotes = sq.quotations;
          } catch (_) {}
        }
        return res.status(200).json({
          success: true,
          operations: getUnifiedEcosystemOperationsView({ quotations: supaQuotes })
        });
      }

      const sampleQuotes = [
        {
          quoteId: 'AAF-2026-1001',
          leadId: 'LEAD-20260818-4821',
          date: '2026-08-18',
          validUntil: '2026-09-17',
          customerName: 'Sarah Jenkins',
          companyName: 'Nordic Organic Superfoods Oy',
          email: 'sarah@nordicorganic.fi',
          phone: '+358 40 1234567',
          country: 'Finland',
          destination: 'Port of Helsinki',
          product: 'Moringa Leaf Powder (Food Grade / Organic)',
          quantity: 500,
          currency: 'USD',
          incoterm: 'CIF',
          grandTotal: 2632.80,
          status: 'SENT',
          emailStatus: 'DELIVERED',
          whatsAppStatus: 'SENT',
          createdAt: '2026-08-18T10:30:00Z'
        },
        {
          quoteId: 'AAF-2026-1002',
          leadId: 'LEAD-20260818-9182',
          date: '2026-08-18',
          validUntil: '2026-09-17',
          customerName: 'Ahmed Al-Mansoor',
          companyName: 'Gulf Spices & Food Trading LLC',
          email: 'ahmed@gulfspices.ae',
          phone: '+971 50 9876543',
          country: 'United Arab Emirates',
          destination: 'Jebel Ali Port, Dubai',
          product: 'Dehydrated Red Onion Powder (Premium Export Grade)',
          quantity: 1000,
          currency: 'USD',
          incoterm: 'CIF',
          grandTotal: 9904.50,
          status: 'GENERATED',
          emailStatus: 'READY',
          whatsAppStatus: 'NOT_CONFIGURED',
          createdAt: '2026-08-18T14:15:00Z'
        }
      ];

      const { isSupabaseConfigured, fetchQuotationsFromSupabase } = await import('./_lib/supabaseClient.js');
      if (isSupabaseConfigured()) {
        try {
          const statusFilter = req.query?.status || null;
          const searchFilter = req.query?.search || null;
          const limit = Number(req.query?.limit) || 50;
          const offset = Number(req.query?.offset) || 0;
          const supaResult = await fetchQuotationsFromSupabase({ limit, offset, status: statusFilter, search: searchFilter });
          if (supaResult.success && supaResult.quotations.length > 0) {
            return res.status(200).json({
              success: true,
              count: supaResult.count,
              quotations: supaResult.quotations,
              source: 'supabase'
            });
          }
        } catch (supaErr) {
          console.warn('[Admin Quotations API] Supabase query deferred, falling back to local dataset:', supaErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        count: sampleQuotes.length,
        quotations: sampleQuotes,
        source: 'fallback'
      });
    }

    if (req.method === 'POST') {
      const { quoteData, quoteId, newStatus } = req.body || {};

      if (action === 'get-products') {
        const { PRODUCT_MASTER } = await import('./_lib/productMaster.js');
        return res.status(200).json({
          success: true,
          products: PRODUCT_MASTER
        });
      }

      if (action === 'ecosystem-operations') {
        const { getUnifiedEcosystemOperationsView } = await import('./_lib/ecosystemIntegration.js');
        const { isSupabaseConfigured, fetchQuotationsFromSupabase } = await import('./_lib/supabaseClient.js');
        let supaQuotes = [];
        if (isSupabaseConfigured()) {
          try {
            const sq = await fetchQuotationsFromSupabase({ limit: 100, offset: 0 });
            if (sq.success && Array.isArray(sq.quotations)) supaQuotes = sq.quotations;
          } catch (_) {}
        }
        return res.status(200).json({
          success: true,
          operations: getUnifiedEcosystemOperationsView({ quotations: supaQuotes })
        });
      }

      if (action === 'generate' || action === 'recalculate' || action === 'save') {
        const safeQuoteData = {
          ...(quoteData || {}),
          updatedBy: authenticatedActor,
          owner: authenticatedActor
        };
        const quote = calculateQuotation(safeQuoteData);
        quote.updatedBy = authenticatedActor;
        quote.owner = authenticatedActor;

        const GOOGLE_SHEETS_WEBHOOK = process.env.GOOGLE_SHEETS_WEBHOOK || process.env.VITE_GOOGLE_SHEETS_WEBHOOK;
        if (action === 'save' && GOOGLE_SHEETS_WEBHOOK && !GOOGLE_SHEETS_WEBHOOK.includes('YOUR_DEPLOYMENT_ID')) {
          try {
            await fetch(GOOGLE_SHEETS_WEBHOOK, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetSheet: 'Quotations',
                type: 'QUOTATION',
                webhookSecret: process.env.CRM_WEBHOOK_SECRET || '',
                quotationId: quote.quoteId,
                inquiryId: quote.inquiryId || '',
                quoteDate: quote.date,
                validityDate: quote.validUntil,
                buyer: quote.buyerName,
                company: quote.companyName,
                country: quote.country,
                product: quote.items.map(i => i.name).join(' + '),
                hsCode: quote.items.map(i => i.hscode).join(', '),
                description: quote.items.map(i => i.description).join(' | '),
                quantityKg: quote.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
                unit: 'KG',
                unitRate: quote.items[0]?.rate || 0,
                currency: quote.currency,
                subtotal: quote.subtotal,
                freight: quote.freight,
                insurance: quote.insurance,
                documentation: quote.documentation,
                grandTotal: quote.grandTotal,
                incoterm: quote.incoterm,
                destinationPort: quote.destinationPort,
                paymentTerms: quote.paymentTerms,
                deliveryTimeline: quote.deliveryTimeline,
                quotationStatus: quote.status,
                pdfLink: `/api/quotation?action=download-pdf&id=${quote.quoteId}`,
                docxLink: `/api/quotation?action=download-docx&id=${quote.quoteId}`,
                lastUpdated: new Date().toISOString(),
                updatedBy: authenticatedActor,
                updatedByRole: authenticatedRole
              })
            });
          } catch (syncErr) {
            console.warn('[Admin Quotations API] Google Sheet sync deferred:', syncErr.message);
          }
        }

        const { isSupabaseConfigured, saveQuotationToSupabase } = await import('./_lib/supabaseClient.js');
        let supabasePersist = null;
        if (isSupabaseConfigured()) {
          try {
            supabasePersist = await saveQuotationToSupabase(quote);
          } catch (persErr) {
            console.warn('[Admin Quotations API] Supabase quotation persistence deferred:', persErr.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: `Quotation ${quote.quoteId} processed successfully.`,
          actor: authenticatedActor,
          role: authenticatedRole,
          quote,
          persisted: supabasePersist?.persisted || false
        });
      }

      if (action === 'create-draft') {
        const { leadData, overrides } = req.body || {};
        if (!leadData || typeof leadData !== 'object') {
          return res.status(400).json({ error: 'Valid leadData object required to create draft quotation.' });
        }
        const { createQuotationFromLead, validateLeadForQuotation } = await import('./_lib/quotationModel.js');
        const validation = validateLeadForQuotation(leadData);
        if (!validation.eligible) {
          return res.status(400).json({
            error: `Quotation cannot be prepared yet. Missing: ${validation.errors.join('; ')}`,
            validation
          });
        }
        const safeOverrides = {
          ...(overrides && typeof overrides === 'object' ? overrides : {}),
          actor: authenticatedActor,
          owner: authenticatedActor
        };
        const quotation = createQuotationFromLead(leadData, safeOverrides);
        return res.status(200).json({
          success: true,
          message: `Draft quotation ${quotation.quotationId} created successfully.`,
          actor: authenticatedActor,
          role: authenticatedRole,
          quotation
        });
      }

      if (action === 'transition') {
        const { quotation, targetStatus, details } = req.body || {};
        if (!quotation || !targetStatus) {
          return res.status(400).json({ error: 'quotation and targetStatus required.' });
        }
        const { transitionQuotationStatus } = await import('./_lib/quotationModel.js');
        try {
          const updated = transitionQuotationStatus(quotation, targetStatus, authenticatedActor, details || {});
          return res.status(200).json({
            success: true,
            message: `Quotation transitioned to ${targetStatus}.`,
            actor: authenticatedActor,
            role: authenticatedRole,
            quotation: updated
          });
        } catch (tErr) {
          return res.status(400).json({ error: tErr.message });
        }
      }

      if (action === 'processor-confirm') {
        const { quotation, updates } = req.body || {};
        if (!quotation || !updates) {
          return res.status(400).json({ error: 'quotation and updates required.' });
        }
        const safeUpdates = {
          ...updates,
          ...(updates.adminOverride && typeof updates.adminOverride === 'object'
            ? { adminOverride: { ...updates.adminOverride, actor: authenticatedActor } }
            : {})
        };
        const { updateProcessorConfirmation } = await import('./_lib/quotationModel.js');
        try {
          const updated = updateProcessorConfirmation(quotation, safeUpdates, authenticatedActor);
          return res.status(200).json({
            success: true,
            message: `Processor confirmation updated. Status: ${updated.processorConfirmation.status}`,
            actor: authenticatedActor,
            role: authenticatedRole,
            quotation: updated
          });
        } catch (pErr) {
          return res.status(400).json({ error: pErr.message });
        }
      }

      if (action === 'processor-check') {
        const { quotation, updates } = req.body || {};
        if (!quotation || !updates) {
          return res.status(400).json({ error: 'quotation and updates required.' });
        }
        const { updateProcessorChecklist } = await import('./_lib/quotationModel.js');
        try {
          const updated = updateProcessorChecklist(quotation, updates, authenticatedActor);
          return res.status(200).json({
            success: true,
            message: `Processor verification updated. Status: ${updated.processorVerification.status}`,
            actor: authenticatedActor,
            role: authenticatedRole,
            quotation: updated
          });
        } catch (pErr) {
          return res.status(400).json({ error: pErr.message });
        }
      }

      if (action === 'buyer-ready-gate') {
        const { quotation } = req.body || {};
        if (!quotation) {
          return res.status(400).json({ error: 'quotation object required for buyer-ready gate evaluation.' });
        }
        const { evaluateBuyerReadyGate } = await import('./_lib/quotationModel.js');
        const gate = evaluateBuyerReadyGate(quotation);
        return res.status(200).json({
          success: true,
          gate
        });
      }

      if (action === 'admin-override') {
        const { quotation, reason, bypassedChecks } = req.body || {};
        if (!quotation || !reason) {
          return res.status(400).json({ error: 'quotation and reason required for admin override.' });
        }
        const safeReason = typeof reason === 'object' && reason !== null
          ? { ...reason, actor: authenticatedActor }
          : reason;
        const { setAdminOverride } = await import('./_lib/quotationModel.js');
        try {
          const updated = setAdminOverride(quotation, safeReason, authenticatedActor, bypassedChecks || []);
          return res.status(200).json({
            success: true,
            message: 'Admin override recorded successfully.',
            actor: authenticatedActor,
            role: authenticatedRole,
            quotation: updated
          });
        } catch (oErr) {
          return res.status(400).json({ error: oErr.message });
        }
      }

      if (action === 'three-way-audit') {
        const { quotation } = req.body || {};
        if (!quotation) {
          return res.status(400).json({ error: 'quotation object required.' });
        }
        const { generateThreeWayAudit } = await import('./_lib/quotationModel.js');
        const audit = generateThreeWayAudit(quotation);
        return res.status(200).json({
          success: true,
          audit
        });
      }

      if (action === 'prepare-dispatch') {
        const { quotation } = req.body || {};
        if (!quotation) {
          return res.status(400).json({ error: 'quotation object required.' });
        }
        const { generateB2BEmailTemplate, evaluateBuyerReadyGate } = await import('./_lib/quotationModel.js');
        const gate = evaluateBuyerReadyGate(quotation);
        const emailTemplate = generateB2BEmailTemplate(quotation);
        return res.status(200).json({
          success: true,
          gate,
          emailTemplate,
          recipient: quotation.buyer?.email || '',
          buyerName: quotation.buyer?.name || '',
          company: quotation.buyer?.company || ''
        });
      }

      if (action === 'send-buyer') {
        const { quotation, options } = req.body || {};
        if (!quotation) {
          return res.status(400).json({ error: 'quotation object required for buyer dispatch.' });
        }
        const safeOptions = {
          ...(options && typeof options === 'object' ? options : {}),
          actor: authenticatedActor,
          verifiedActor: authenticatedActor
        };
        const { sendQuotationToBuyer } = await import('./_lib/quotationModel.js');
        try {
          const result = await sendQuotationToBuyer(quotation, safeOptions);
          if (result.success && result.messageId) {
            const { isSupabaseConfigured, updateQuotationDeliveryStatusInSupabase, getQuotationByIdFromSupabase, saveQuotationToSupabase } = await import('./_lib/supabaseClient.js');
            if (isSupabaseConfigured()) {
              try {
                const qId = quotation.quoteId || quotation.quotationId;
                const sentTime = new Date().toISOString();
                const existing = await getQuotationByIdFromSupabase(qId);
                if (!existing.success || !existing.quotation) {
                  await saveQuotationToSupabase({
                    ...quotation,
                    status: 'SENT_TO_BUYER',
                    deliveryStatus: 'sent',
                    sentAt: sentTime,
                    providerMessageId: result.messageId,
                    providerName: result.provider || 'resend',
                    updatedBy: authenticatedActor
                  });
                } else {
                  await updateQuotationDeliveryStatusInSupabase(qId, {
                    status: 'SENT_TO_BUYER',
                    deliveryStatus: 'sent',
                    sentAt: sentTime,
                    providerMessageId: result.messageId,
                    providerName: result.provider || 'resend',
                    updatedBy: authenticatedActor
                  });
                }
              } catch (dbErr) {
                console.warn('[Admin Quotations API] Delivery dispatch tracking deferred:', dbErr.message);
              }
            }
          }
          return res.status(200).json({
            success: result.success,
            status: result.status,
            message: result.message || (result.success ? 'Quotation dispatched successfully.' : result.error),
            error: result.error || null,
            actor: authenticatedActor,
            role: authenticatedRole,
            dispatch: result.dispatch,
            quotation: result.quotation || quotation
          });
        } catch (sErr) {
          return res.status(400).json({
            error: sErr.message,
            code: sErr.code || 'DISPATCH_ERROR',
            issues: sErr.issues || [sErr.message]
          });
        }
      }

      if (action === 'revise') {
        const { quotation, changes, changeReason } = req.body || {};
        if (!quotation) {
          return res.status(400).json({ error: 'quotation object required for revision.' });
        }
        const { reviseQuotation } = await import('./_lib/quotationModel.js');
        try {
          const revised = reviseQuotation(quotation, changes || {}, changeReason || '', authenticatedActor);
          return res.status(200).json({
            success: true,
            message: `Revision ${revised.revision.revisionNumber} created successfully.`,
            actor: authenticatedActor,
            role: authenticatedRole,
            quotation: revised
          });
        } catch (rErr) {
          return res.status(400).json({ error: rErr.message });
        }
      }

      if (action === 'negotiate') {
        const { quotation, negotiationData } = req.body || {};
        if (!quotation || !negotiationData) {
          return res.status(400).json({ error: 'quotation and negotiationData required.' });
        }
        const { updateNegotiation } = await import('./_lib/quotationModel.js');
        try {
          const updated = updateNegotiation(quotation, negotiationData, authenticatedActor);
          return res.status(200).json({
            success: true,
            message: 'Negotiation terms updated.',
            actor: authenticatedActor,
            role: authenticatedRole,
            quotation: updated
          });
        } catch (nErr) {
          return res.status(400).json({ error: nErr.message });
        }
      }

      if (action === 'record-po') {
        const { quotation, poData } = req.body || {};
        if (!quotation || !poData) {
          return res.status(400).json({ error: 'quotation and poData required.' });
        }
        const { recordPoReceipt } = await import('./_lib/quotationModel.js');
        try {
          const updated = recordPoReceipt(quotation, poData, authenticatedActor);
          return res.status(200).json({
            success: true,
            message: `PO ${poData.poNumber} recorded.`,
            actor: authenticatedActor,
            role: authenticatedRole,
            quotation: updated
          });
        } catch (poErr) {
          return res.status(400).json({ error: poErr.message });
        }
      }

      if (action === 'record-buyer-response') {
        const { quotation, responseData } = req.body || {};
        if (!quotation || !responseData) {
          return res.status(400).json({ error: 'quotation and responseData required.' });
        }
        const { recordBuyerResponse } = await import('./_lib/quotationModel.js');
        try {
          const updated = recordBuyerResponse(quotation, responseData, authenticatedActor);
          return res.status(200).json({
            success: true,
            message: 'Buyer response recorded.',
            actor: authenticatedActor,
            role: authenticatedRole,
            quotation: updated
          });
        } catch (brErr) {
          return res.status(400).json({ error: brErr.message });
        }
      }

      if (action === 'update-followup') {
        const { quotation, followupData } = req.body || {};
        if (!quotation || !followupData) {
          return res.status(400).json({ error: 'quotation and followupData required.' });
        }
        const safeFollowupData = {
          ...followupData,
          owner: authenticatedActor,
          followUpOwner: authenticatedActor
        };
        const { updateFollowUp } = await import('./_lib/quotationModel.js');
        try {
          const updated = updateFollowUp(quotation, safeFollowupData, authenticatedActor);
          return res.status(200).json({
            success: true,
            message: 'Follow-up status updated.',
            actor: authenticatedActor,
            role: authenticatedRole,
            quotation: updated
          });
        } catch (fuErr) {
          return res.status(400).json({ error: fuErr.message });
        }
      }

      if (action === 'compute-document-hash') {
        const { quotation } = req.body || {};
        if (!quotation) {
          return res.status(400).json({ error: 'quotation object required.' });
        }
        const { computeDocumentHash } = await import('./_lib/quotationModel.js');
        const hash = computeDocumentHash(quotation);
        return res.status(200).json({
          success: true,
          documentHash: hash
        });
      }

      if (action === 'evaluate-outreach-gate') {
        const { contact, context: gateContext } = req.body || {};
        if (!contact || typeof contact !== 'object') {
          return res.status(400).json({ error: 'Valid contact object required.' });
        }
        const { evaluateOutreachReadinessGate } = await import('./_lib/ecosystemIntegration.js');
        const gate = evaluateOutreachReadinessGate(contact, gateContext || {});
        return res.status(200).json({
          success: true,
          actor: authenticatedActor,
          gate
        });
      }

      if (action === 'ecosystem-sync') {
        const { eventType, payload: ecoPayload } = req.body || {};
        if (!eventType || !ecoPayload || typeof ecoPayload !== 'object') {
          return res.status(400).json({ error: 'eventType and payload object required.' });
        }
        const { classifyLeadAndMarket, createSignedEcosystemEvent } = await import('./_lib/ecosystemIntegration.js');
        const classification = classifyLeadAndMarket(ecoPayload);
        const signed = process.env.ECOSYSTEM_SYNC_SECRET
          ? createSignedEcosystemEvent(eventType, ecoPayload, process.env.ECOSYSTEM_SYNC_SECRET)
          : null;
        return res.status(200).json({
          success: true,
          actor: authenticatedActor,
          classification,
          signedEnvelopeCreated: Boolean(signed),
          idempotencyKey: signed?.envelope?.idempotencyKey || null
        });
      }

      if (action === 'update-status') {
        return res.status(200).json({
          success: true,
          message: `Quotation ${quoteId} updated to ${newStatus}.`,
          actor: authenticatedActor,
          role: authenticatedRole,
          quoteId,
          newStatus
        });
      }

      return res.status(400).json({ error: 'Invalid action specified' });
    }
  } catch (err) {
    console.error('[Admin Quotation API] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error processing admin quotation request.' });
  }
}
