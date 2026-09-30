// ============================================================
// AVANI AGRO FOODS — Global Importers Database API
// Vercel Serverless Function (Node.js runtime)
// GET /api/importers | POST /api/importers
//
// Access Control:
// - Protected by Master Password
// - Requires valid signed session cookie (avani_gate_session)
//   or Authorization: Bearer <MASTER_GATE_PASSWORD>
// ============================================================

import { IMPORTERS } from './data/importersData.js';
import {
  getSessionSecret,
  parseAndVerifySignature,
  parseCookies,
  verifyPassword,
  isAllowedOrigin,
} from './lib/auth.js';

function verifyGateAccess(req) {
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

  // 2. Check signed session cookie (avani_gate_session)
  if (sessionSecret) {
    const cookies = parseCookies(req);
    const sessionCookie = cookies['avani_gate_session'];
    if (sessionCookie) {
      const sessionId = parseAndVerifySignature(sessionCookie, sessionSecret);
      if (sessionId) {
        return true;
      }
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

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyGateAccess(req)) {
    return res.status(401).json({
      error: 'Unauthorized: Master gate authentication required.',
      authenticated: false,
    });
  }

  return res.status(200).json({
    success: true,
    count: IMPORTERS.length,
    importers: IMPORTERS,
  });
}
