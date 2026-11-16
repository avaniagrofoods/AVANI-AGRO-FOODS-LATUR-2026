// ============================================================
// AVANI AGRO FOODS — Global Importers Database API
// Vercel Serverless Function (Node.js runtime)
// GET /api/importers
//
// Access Control (Package 3F.106 Hardened — CC-01, CC-02, CC-03, CC-04, CC-08):
// - Strictly requires verified server-side session cookie (avani_gate_session)
// - Master password Bearer token bypass removed
// - Read-only GET method enforced
// - Distributed rate limiting and KV revocation checks enforced
// ============================================================

import { IMPORTERS } from './_data/importersData.js';
import {
  getClientIp,
  checkRateLimit,
  verifyServerSession,
  isAllowedOrigin
} from './_lib/auth.js';
import {
  normalizeCountry,
  normalizeImporterWithVerification,
  getVerificationDashboardMetrics
} from './_lib/importerVerificationModel.js';

// Export canonical country normalization for consumers & tests
export { normalizeCountry };

export async function verifyGateAccess(req) {
  return await verifyServerSession(req, 'gate');
}

export default async function handler(req, res) {
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({
      error: 'Forbidden origin',
      code: 'ORIGIN_FORBIDDEN'
    });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');

  // CC-04: Keep safe read-only methods separate from mutations
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CC-08: Distributed rate limiting
  const clientIp = getClientIp(req);
  const rateLimit = await checkRateLimit(clientIp, 'importers_api', { maxAttempts: 60, windowSeconds: 900 });
  if (rateLimit.limited) {
    return res.status(rateLimit.statusCode || 429).json({
      error: rateLimit.error || 'Too many requests. Please try again later.',
      code: rateLimit.code,
      authenticated: false
    });
  }

  // CC-01 & CC-03: Async server-side session & revocation verification
  const authResult = await verifyGateAccess(req);
  if (!authResult.authenticated) {
    return res.status(authResult.statusCode || 401).json({
      error: authResult.error || 'Unauthorized: Master gate authentication required.',
      code: authResult.code,
      authenticated: false
    });
  }

  // Normalize all records with Phase 2 verification layer (source baseline unchanged)
  const normalized = IMPORTERS.map(normalizeImporterWithVerification);
  const metrics = getVerificationDashboardMetrics(normalized);

  return res.status(200).json({
    success: true,
    count: normalized.length,
    importers: normalized,
    metrics,
    _meta: {
      verificationNormalized: true,
      contactabilityCalculated: true,
      verificationEngineVersion: '2.0',
      dataIntegrityVersion: '8.2',
      auditTimestamp: new Date().toISOString()
    }
  });
}
