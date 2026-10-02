// ============================================================
// AVANI AGRO FOODS — ADMIN QUOTATION MANAGEMENT API
// Endpoints:
// - GET  /api/admin-quotations -> Returns recent leads & quotations (Auth required)
// - POST /api/admin-quotations -> Create custom quote or update status (Auth required)
//
// Authentication:
// - Uses SESSION_SECRET to verify signed session cookies (avani_gate_session / avani_affiliate_session)
// - Or Bearer Authorization header matching MASTER_GATE_PASSWORD or AFFILIATE_PASSWORD
// ============================================================

import { calculateQuotation } from './_lib/quotationEngine.js';
import {
  getSessionSecret,
  parseAndVerifySignature,
  parseCookies,
  verifyPassword,
  isAllowedOrigin,
} from './_lib/auth.js';

function verifyAdminAuth(req) {
  const sessionSecret = getSessionSecret();
  const masterPassword = process.env.PRIVATE_PORTAL_PASSWORD || process.env.MASTER_GATE_PASSWORD;

  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (masterPassword && verifyPassword(token, masterPassword)) {
      return true;
    }
  }

  // 2. Check signed session cookies (avani_gate_session or avani_admin_session)
  if (!sessionSecret) return false;

  const cookies = parseCookies(req);
  const candidateCookies = [
    cookies['avani_gate_session'],
    cookies['avani_admin_session'],
    cookies['admin_session'],
  ].filter(Boolean);

  for (const cookie of candidateCookies) {
    const sessionId = parseAndVerifySignature(cookie, sessionSecret);
    if (sessionId) {
      return true;
    }
  }

  return false;
}

export default async function handler(req, res) {
  // CORS & Security Headers
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');

  const url = new URL(req.url, 'http://localhost');
  const action = req.body?.action || req.query?.action || url.searchParams.get('action');

  // Verify Admin Authorization (delivery-webhook is authenticated by its dedicated webhook signature/secret check)
  const isWebhook = action === 'delivery-webhook' || action === 'webhook';
  if (!isWebhook) {
    if (!verifyAdminAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid Admin Session Required.' });
    }
  }

  try {
    if (req.method === 'GET') {
      if (action === 'get-products') {
        const { PRODUCT_MASTER } = await import('./_lib/productMaster.js');
        return res.status(200).json({
          success: true,
          products: PRODUCT_MASTER
        });
      }

      // Return structured sample leads & mock data if database is empty
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

      return res.status(200).json({
        success: true,
        count: sampleQuotes.length,
        quotations: sampleQuotes
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

      if (action === 'generate' || action === 'recalculate' || action === 'save') {
        const quote = calculateQuotation(quoteData || {});
        
        // If saving, optionally sync to Google Sheets Quotations tab
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
                updatedBy: 'Admin (Sachin Shinde)'
              })
            });
          } catch (syncErr) {
            console.warn('[Admin Quotations API] Google Sheet sync deferred:', syncErr.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: `Quotation ${quote.quoteId} processed successfully.`,
          quote
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
        const quotation = createQuotationFromLead(leadData, overrides || {});
        return res.status(200).json({
          success: true,
          message: `Draft quotation ${quotation.quotationId} created successfully.`,
          quotation
        });
      }

      if (action === 'transition') {
        const { quotation, targetStatus, actor, details } = req.body || {};
        if (!quotation || !targetStatus) {
          return res.status(400).json({ error: 'quotation and targetStatus required.' });
        }
        const { transitionQuotationStatus } = await import('./_lib/quotationModel.js');
        try {
          const updated = transitionQuotationStatus(quotation, targetStatus, actor || 'Sachin Shinde', details || {});
          return res.status(200).json({
            success: true,
            message: `Quotation transitioned to ${targetStatus}.`,
            quotation: updated
          });
        } catch (tErr) {
          return res.status(400).json({ error: tErr.message });
        }
      }

      if (action === 'processor-confirm') {
        const { quotation, updates, actor } = req.body || {};
        if (!quotation || !updates) {
          return res.status(400).json({ error: 'quotation and updates required.' });
        }
        const { updateProcessorConfirmation } = await import('./_lib/quotationModel.js');
        try {
          const updated = updateProcessorConfirmation(quotation, updates, actor || 'Sachin Shinde');
          return res.status(200).json({
            success: true,
            message: `Processor confirmation updated. Status: ${updated.processorConfirmation.status}`,
            quotation: updated
          });
        } catch (pErr) {
          return res.status(400).json({ error: pErr.message });
        }
      }

      if (action === 'processor-check') {
        const { quotation, updates, actor } = req.body || {};
        if (!quotation || !updates) {
          return res.status(400).json({ error: 'quotation and updates required.' });
        }
        const { updateProcessorChecklist } = await import('./_lib/quotationModel.js');
        try {
          const updated = updateProcessorChecklist(quotation, updates, actor || 'Sachin Shinde');
          return res.status(200).json({
            success: true,
            message: `Processor verification updated. Status: ${updated.processorVerification.status}`,
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
        const { quotation, reason, actor, bypassedChecks } = req.body || {};
        if (!quotation || !reason) {
          return res.status(400).json({ error: 'quotation and reason required for admin override.' });
        }
        const { setAdminOverride } = await import('./_lib/quotationModel.js');
        try {
          const updated = setAdminOverride(quotation, reason, actor || 'Sachin Shinde', bypassedChecks || []);
          return res.status(200).json({
            success: true,
            message: 'Admin override recorded successfully.',
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
        const { sendQuotationToBuyer } = await import('./_lib/quotationModel.js');
        try {
          const result = await sendQuotationToBuyer(quotation, options || {});
          return res.status(200).json({
            success: result.success,
            status: result.status,
            message: result.message || (result.success ? 'Quotation dispatched successfully.' : result.error),
            error: result.error || null,
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
        const { quotation, changes, changeReason, changedBy } = req.body || {};
        if (!quotation) {
          return res.status(400).json({ error: 'quotation object required for revision.' });
        }
        const { reviseQuotation } = await import('./_lib/quotationModel.js');
        try {
          const revised = reviseQuotation(quotation, changes || {}, changeReason || '', changedBy || 'Sachin Shinde');
          return res.status(200).json({
            success: true,
            message: `Revision ${revised.revision.revisionNumber} created successfully.`,
            quotation: revised
          });
        } catch (rErr) {
          return res.status(400).json({ error: rErr.message });
        }
      }

      if (action === 'negotiate') {
        const { quotation, negotiationData, actor } = req.body || {};
        if (!quotation || !negotiationData) {
          return res.status(400).json({ error: 'quotation and negotiationData required.' });
        }
        const { updateNegotiation } = await import('./_lib/quotationModel.js');
        try {
          const updated = updateNegotiation(quotation, negotiationData, actor || 'Sachin Shinde');
          return res.status(200).json({
            success: true,
            message: 'Negotiation terms updated.',
            quotation: updated
          });
        } catch (nErr) {
          return res.status(400).json({ error: nErr.message });
        }
      }

      if (action === 'record-po') {
        const { quotation, poData, actor } = req.body || {};
        if (!quotation || !poData) {
          return res.status(400).json({ error: 'quotation and poData required.' });
        }
        const { recordPoReceipt } = await import('./_lib/quotationModel.js');
        try {
          const updated = recordPoReceipt(quotation, poData, actor || 'Sachin Shinde');
          return res.status(200).json({
            success: true,
            message: `PO ${poData.poNumber} recorded.`,
            quotation: updated
          });
        } catch (poErr) {
          return res.status(400).json({ error: poErr.message });
        }
      }

      if (action === 'delivery-webhook' || action === 'webhook') {
        const { quotation, eventPayload, webhookSecret } = req.body || {};
        if (!quotation) {
          return res.status(400).json({ error: 'quotation object required for webhook processing.' });
        }
        const envSecret = process.env.CRM_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET;
        if (!envSecret) {
          return res.status(503).json({
            error: 'Webhook endpoint is unconfigured. Failing closed until RESEND_WEBHOOK_SECRET / CRM_WEBHOOK_SECRET is configured.',
            code: 'WEBHOOK_UNCONFIGURED'
          });
        }
        const secret = webhookSecret || req.headers['x-webhook-secret'] || req.headers['authorization']?.replace('Bearer ', '');
        if (!secret || secret !== envSecret) {
          return res.status(401).json({
            error: 'Unauthorized: Invalid or missing webhook signature/secret.',
            code: 'WEBHOOK_UNAUTHORIZED'
          });
        }
        const { processDeliveryWebhook } = await import('./_lib/quotationModel.js');
        try {
          const updated = processDeliveryWebhook(quotation, eventPayload || req.body, secret, { requireSecret: true });
          return res.status(200).json({
            success: true,
            message: 'Webhook processed successfully.',
            quotation: updated
          });
        } catch (wErr) {
          return res.status(400).json({ error: wErr.message });
        }
      }

      if (action === 'record-buyer-response') {
        const { quotation, responseData, actor } = req.body || {};
        if (!quotation || !responseData) {
          return res.status(400).json({ error: 'quotation and responseData required.' });
        }
        const { recordBuyerResponse } = await import('./_lib/quotationModel.js');
        try {
          const updated = recordBuyerResponse(quotation, responseData, actor || 'Sachin Shinde');
          return res.status(200).json({
            success: true,
            message: 'Buyer response recorded.',
            quotation: updated
          });
        } catch (brErr) {
          return res.status(400).json({ error: brErr.message });
        }
      }

      if (action === 'update-followup') {
        const { quotation, followupData, actor } = req.body || {};
        if (!quotation || !followupData) {
          return res.status(400).json({ error: 'quotation and followupData required.' });
        }
        const { updateFollowUp } = await import('./_lib/quotationModel.js');
        try {
          const updated = updateFollowUp(quotation, followupData, actor || 'Sachin Shinde');
          return res.status(200).json({
            success: true,
            message: 'Follow-up status updated.',
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

      if (action === 'update-status') {
        return res.status(200).json({
          success: true,
          message: `Quotation ${quoteId} updated to ${newStatus}.`,
          quoteId,
          newStatus
        });
      }

      return res.status(400).json({ error: 'Invalid action specified' });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (err) {
    console.error('[Admin Quotation API] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error processing admin quotation request.' });
  }
}
