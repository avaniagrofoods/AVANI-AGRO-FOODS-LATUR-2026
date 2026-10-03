// ============================================================
// AVANI AGRO FOODS — Global Importers Database API
// Vercel Serverless Function (Node.js runtime)
// GET /api/importers | POST /api/importers
//
// Access Control:
// - Protected by Master Password
// - Requires valid signed session cookie (avani_gate_session)
//   or Authorization: Bearer <MASTER_GATE_PASSWORD>
//
// Phase 8 Hardening:
// - verificationStatus normalized: NEEDS REVIEW → UNVERIFIED
// - contactabilityScore / Level computed per Phase 5
// - emailAvailable / phoneAvailable / websiteAvailable / whatsappAvailable added
// ============================================================

import { IMPORTERS } from './_data/importersData.js';
import {
  getSessionSecret,
  parseAndVerifySignature,
  parseCookies,
  verifyPassword,
  isAllowedOrigin,
} from './_lib/auth.js';

// ── Verification Status Normalization ────────────────────────
// Per spec: only VERIFIED | UNVERIFIED | NOT_AVAILABLE are valid.
// "NEEDS REVIEW" from source data → UNVERIFIED (pending external confirmation).
// This normalization runs at the API response layer only.
// Source data (api/_data/importersData.js) is NOT modified.
const VALID_VERIFICATION_VALUES = new Set(['VERIFIED', 'UNVERIFIED', 'NOT_AVAILABLE']);
function normalizeVerificationStatus(raw) {
  if (!raw || String(raw).trim() === '') return 'NOT_AVAILABLE';
  const upper = String(raw).trim().toUpperCase();
  if (VALID_VERIFICATION_VALUES.has(upper)) return upper;
  if (upper === 'NEEDS REVIEW' || upper === 'NEEDS_REVIEW') return 'UNVERIFIED';
  if (upper === 'PENDING') return 'UNVERIFIED';
  if (upper === 'ACTIVE') return 'UNVERIFIED';
  return 'UNVERIFIED';
}

// ── Contact Field Helpers ─────────────────────────────────────
function isRealContact(v) {
  if (!v) return false;
  const s = String(v).trim();
  return s !== '' && s !== 'Not Available' && s !== 'N/A' && s !== 'NA';
}

function isRealWebsite(v) {
  if (!isRealContact(v)) return false;
  return /^https?:\/\/.+\..+/.test(String(v).trim());
}

function isRealPhone(v) {
  if (!isRealContact(v)) return false;
  const digits = String(v).replace(/\D/g, '');
  return digits.length >= 7;
}

function isRealEmail(v) {
  if (!isRealContact(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
}

// ── Contactability Score (Phase 5) ────────────────────────────
function calcContactability(imp) {
  const e = isRealEmail(imp.email);
  const p = isRealPhone(imp.phone);
  const w = isRealWebsite(imp.website);
  const wa = isRealPhone(imp.whatsapp);
  const score = (e ? 1 : 0) + (p ? 1 : 0) + (w ? 1 : 0);
  let level;
  if (score >= 3) level = 'HIGH';
  else if (score === 2) level = 'MEDIUM';
  else if (score === 1) level = 'LOW';
  else level = 'ZERO';
  return { score, level, emailAvailable: e, phoneAvailable: p, websiteAvailable: w, whatsappAvailable: wa };
}

// ── Record Normalization ──────────────────────────────────────
function normalizeImporter(imp) {
  const c = calcContactability(imp);
  return {
    ...imp,
    // Phase 4: standardize verificationStatus values
    verificationStatus: normalizeVerificationStatus(imp.verificationStatus),
    // Phase 5: contactability fields
    emailAvailable: c.emailAvailable,
    phoneAvailable: c.phoneAvailable,
    websiteAvailable: c.websiteAvailable,
    whatsappAvailable: c.whatsappAvailable,
    contactabilityScore: c.score,
    contactabilityLevel: c.level,
    // Phase 6: product interest normalization
    moringaInterest: imp.moringaInterest || 'UNKNOWN',
    redOnionInterest: imp.redOnionInterest || 'UNKNOWN',
  };
}

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

  // Normalize all records at response layer (source data unchanged)
  const normalized = IMPORTERS.map(normalizeImporter);

  return res.status(200).json({
    success: true,
    count: normalized.length,
    importers: normalized,
    _meta: {
      verificationNormalized: true,
      contactabilityCalculated: true,
      dataIntegrityVersion: '8.1',
      auditTimestamp: new Date().toISOString(),
    },
  });
}
