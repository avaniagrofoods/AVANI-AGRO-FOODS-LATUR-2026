// ============================================================
// AVANI AGRO FOODS — B2B LEADS SERVERLESS ENDPOINT (P4.1)
// Endpoint: POST /api/leads
// ============================================================

import { validateLeadPayload, createLeadRecord } from './_lib/leadModel.js';
import { getClientIp, checkRateLimit, isAllowedOrigin } from './_lib/auth.js';

// In-memory deduplication cache (60s window)
const recentLeadSubmissions = new Map();

function cleanupOldSubmissions() {
  const now = Date.now();
  for (const [key, item] of recentLeadSubmissions.entries()) {
    if (now - item.timestamp > 60000) {
      recentLeadSubmissions.delete(key);
    }
  }
}

export default async function handler(req, res) {
  // 1. HTTP Method Restriction (POST only)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'This endpoint accepts only POST requests for RFQ lead creation.'
    });
  }

  // 2. Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // 3. Origin Verification
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ success: false, error: 'Forbidden origin' });
  }

  try {
    // 4. Rate Limiting Check
    const ip = getClientIp(req);
    const rateCheck = await checkRateLimit(ip, 'rfq_lead_submission');
    if (rateCheck.limited) {
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `Too many submissions from this IP. Please wait ${rateCheck.minutesLeft} minute(s) before trying again.`
      });
    }

    cleanupOldSubmissions();

    // 5. Payload Validation
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ success: false, error: 'Bad Request', message: 'Invalid JSON payload.', errors: ['Invalid JSON payload.'] });
    }

    // Check payload size
    const bodyString = JSON.stringify(body);
    if (bodyString.length > 50000) {
      return res.status(413).json({ success: false, error: 'Payload Too Large', message: 'RFQ payload exceeds permitted size.', errors: ['Payload too large.'] });
    }

    // 6. Schema Validation & Sanitization
    const validationResult = validateLeadPayload(body);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: validationResult.error,
        errors: validationResult.errors || [validationResult.error]
      });
    }

    const sanitizedData = validationResult.sanitized;

    // 7. Deduplication Detection (keyed by email + product + quantity within 60s)
    const dedupKey = `${sanitizedData.email}_${sanitizedData.productId}_${sanitizedData.quantity}`;
    if (recentLeadSubmissions.has(dedupKey)) {
      const existing = recentLeadSubmissions.get(dedupKey);
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'RFQ received successfully (duplicate submission acknowledged).',
        leadId: existing.leadId,
        lead: existing.lead,
        nextStep: 'Our team will review your requirement and contact you regarding specifications, availability, sample/COA requirements, and quotation.'
      });
    }

    // 8. Create Canonical Lead Record
    const lead = createLeadRecord(sanitizedData);

    // Save to deduplication store
    recentLeadSubmissions.set(dedupKey, {
      leadId: lead.leadId,
      lead,
      timestamp: Date.now()
    });

    // 9. Return Structured Success Response (strictly preserving commercial data without PII leakage)
    return res.status(201).json({
      success: true,
      message: 'RFQ received successfully.',
      leadId: lead.leadId,
      lead,
      nextStep: 'Our team will review your requirement and contact you regarding specifications, availability, sample/COA requirements, and quotation.'
    });

  } catch (err) {
    console.error('[Leads API] Server error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to record B2B requirement. Please contact sales@avaniagrofoods.com directly.'
    });
  }
}

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  module.exports.default = handler;
}
