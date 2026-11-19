// ============================================================
// AVANI AGRO FOODS — Indian Manufacturers Database API
// Vercel Serverless Function (Node.js runtime)
// GET /api/manufacturers
//
// Access Control (Package 3F.106 Hardened — CC-01, CC-02, CC-03, CC-04, CC-08):
// - Strictly requires verified server-side session cookie (avani_gate_session)
// - Master password Bearer token bypass removed
// - Read-only GET method enforced
// - Distributed rate limiting and KV revocation checks enforced
// ============================================================

import { MANUFACTURERS } from './_data/manufacturersData.js';
import {
  getClientIp,
  checkRateLimit,
  verifyServerSession,
  isAllowedOrigin
} from './_lib/auth.js';

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
  const rateLimit = await checkRateLimit(clientIp, 'manufacturers_api', { maxAttempts: 60, windowSeconds: 900 });
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

  const all = [...MANUFACTURERS.small, ...MANUFACTURERS.medium, ...MANUFACTURERS.large];

  const metrics = {
    totalRecords: all.length,
    smallScale: MANUFACTURERS.small.length,
    mediumScale: MANUFACTURERS.medium.length,
    largeScale: MANUFACTURERS.large.length,
    verified: all.filter(m => m.verificationStatus === 'VERIFIED').length,
    underReview: all.filter(m => m.verificationStatus === 'UNDER_REVIEW').length,
    unverified: all.filter(m => !m.verificationStatus || m.verificationStatus === 'UNVERIFIED').length,
    locationUnverified: all.filter(m => !m.location || m.location === 'Location not verified' || m.state === 'Unverified').length,
    missingContact: all.filter(m => (!m.email || m.email === 'Not Available') && (!m.phone || m.phone === 'Not Available')).length,
    missingProducts: all.filter(m => !m.products || !String(m.products).trim()).length
  };

  return res.status(200).json({
    success: true,
    count: all.length,
    manufacturers: MANUFACTURERS,
    all,
    metrics
  });
}
