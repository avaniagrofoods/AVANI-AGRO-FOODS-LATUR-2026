// ============================================================
// AVANI AGRO FOODS — LEAD QUALIFICATION SERVERLESS ENDPOINT (P4.2)
// Endpoint: POST /api/lead-qualification
// Evaluates commercial qualification & processor requirement matching
// ============================================================

import { evaluateLeadQualification } from './_lib/qualificationModel.js';
import { getClientIp, checkRateLimit, isAllowedOrigin } from './_lib/auth.js';

export default async function handler(req, res) {
  // 1. HTTP Method Restriction (POST only)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'This endpoint accepts only POST requests for lead qualification analysis.'
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
    const rateCheck = await checkRateLimit(ip, 'lead_qualification');
    if (rateCheck.limited) {
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: `Too many qualification requests from this IP. Please wait ${rateCheck.minutesLeft} minute(s).`
      });
    }

    // 5. Payload Validation
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid JSON payload. Expected lead or qualification evaluation object.'
      });
    }

    // Check payload size (Max 50KB)
    const bodyString = JSON.stringify(body);
    if (bodyString.length > 50000) {
      return res.status(413).json({
        success: false,
        error: 'Payload Too Large',
        message: 'Qualification payload exceeds permitted size.'
      });
    }

    // 6. Extract lead object
    const lead = body.lead || body;
    const leadId = body.leadId || lead.leadId || 'AAF-L-NEW';

    // 7. Execute Deterministic Lead Qualification
    const qualResult = evaluateLeadQualification(lead);

    // 8. Return structured qualification assessment (zero sensitive PII leakage)
    return res.status(200).json({
      success: true,
      leadId,
      qualificationStatus: qualResult.qualificationStatus,
      qualificationScore: qualResult.qualificationScore,
      completenessScore: qualResult.completenessScore,
      priority: qualResult.priority,
      priorityReasons: qualResult.priorityReasons,
      buyerType: qualResult.buyerType,
      missingFields: qualResult.missingFields,
      missingFieldLabels: qualResult.missingFieldLabels,
      qualificationReasons: qualResult.qualificationReasons,
      specificationMatch: qualResult.specificationMatch,
      specificationMatchNotes: qualResult.specificationMatchNotes,
      processorRequirements: qualResult.processorRequirements,
      requirementsToConfirm: qualResult.requirementsToConfirm,
      nextAction: qualResult.nextAction
    });

  } catch (err) {
    console.error('[Lead Qualification API] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process lead qualification.'
    });
  }
}

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  module.exports.default = handler;
}
