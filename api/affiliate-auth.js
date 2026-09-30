// ============================================================
// AVANI AGRO FOODS — Affiliate Portal Authentication API
// Vercel Serverless Function (Node.js runtime)
// POST /api/affiliate-auth
//
// Supports:
//   1. Distributed Server-Side Session Store & Revocation (via Upstash Redis / Vercel KV)
//   2. Distributed Rate Limiting (via Upstash Redis / Vercel KV)
//   3. High-Security HMAC Signing using SESSION_SECRET
//
// Environment variables:
//   AFFILIATE_PASSWORD — Password for affiliate portal
//   SESSION_SECRET     — Cryptographic secret for HMAC session signing
// ============================================================

import crypto from 'crypto';
import {
  getSessionSecret,
  signSessionId,
  parseAndVerifySignature,
  verifyPassword,
  parseCookies,
  createSessionCookie,
  createClearCookie,
  getClientIp,
  checkRateLimit,
  resetRateLimit,
  isAllowedOrigin,
  SESSION_TTL_SECONDS,
  hasDistributedKV,
  execKVCommand,
} from './lib/auth.js';

export default async function handler(req, res) {
  // CORS & Security Headers
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionSecret = getSessionSecret();
  const correctPassword = process.env.AFFILIATE_PASSWORD;
  const body = req.body || {};
  const { action, password } = body;

  // 1. ACTION: LOGOUT
  if (action === 'logout') {
    const cookies = parseCookies(req);
    const sessionCookie = cookies['avani_affiliate_session'] || cookies['affiliate_session'];
    const sessionId = parseAndVerifySignature(sessionCookie, sessionSecret);

    if (sessionId && hasDistributedKV) {
      await execKVCommand('DEL', `session:affiliate:${sessionId}`);
    }

    res.setHeader('Set-Cookie', [
      createClearCookie('avani_affiliate_session'),
      createClearCookie('affiliate_session'),
    ]);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  // 2. ACTION: VERIFY EXISTING SESSION
  if (action === 'verify') {
    const cookies = parseCookies(req);
    const sessionCookie = cookies['avani_affiliate_session'] || cookies['affiliate_session'];
    const sessionId = parseAndVerifySignature(sessionCookie, sessionSecret);

    if (!sessionId) {
      return res.status(401).json({ authenticated: false });
    }

    if (hasDistributedKV) {
      const sessionData = await execKVCommand('GET', `session:affiliate:${sessionId}`);
      if (!sessionData) {
        return res.status(401).json({ authenticated: false, message: 'Session revoked or expired' });
      }
    }

    return res.status(200).json({ authenticated: true });
  }

  // 3. ACTION: LOGIN (Password Verification & Session Creation)
  const ip = getClientIp(req);
  const rateCheck = await checkRateLimit(ip, 'affiliate');

  if (rateCheck.limited) {
    return res.status(429).json({
      error: `Too many failed attempts. Access is temporarily locked. Please wait ${rateCheck.minutesLeft} minute(s).`,
      retryAfterMinutes: rateCheck.minutesLeft,
    });
  }

  if (!correctPassword) {
    console.error('[SECURITY CRITICAL] AFFILIATE_PASSWORD is not configured on server.');
    return res.status(500).json({ error: 'Server authentication configuration is missing.' });
  }

  if (!sessionSecret) {
    console.error('[SECURITY CRITICAL] SESSION_SECRET is not configured on server.');
    return res.status(500).json({ error: 'Server session signing configuration is missing.' });
  }

  if (!password || typeof password !== 'string' || !password.trim() || password.length > 256) {
    return res.status(400).json({ error: 'Valid password is required.' });
  }

  const match = verifyPassword(password, correctPassword);

  if (!match) {
    return res.status(401).json({
      error: 'Incorrect password. Please try again.',
      remainingAttempts: rateCheck.remaining,
    });
  }

  // Reset rate limiting on successful login
  await resetRateLimit(ip, 'affiliate');

  // Generate cryptographically random session identifier
  const rawSessionId = `avani_affiliate_sess_${crypto.randomUUID()}_${Date.now()}`;
  const signedCookieValue = signSessionId(rawSessionId, sessionSecret);

  if (hasDistributedKV) {
    await execKVCommand('SET', `session:affiliate:${rawSessionId}`, JSON.stringify({
      created: Date.now(),
      ip,
      role: 'affiliate',
    }));
    await execKVCommand('EXPIRE', `session:affiliate:${rawSessionId}`, String(SESSION_TTL_SECONDS));
  }

  // Set secure cookies: avani_affiliate_session (and affiliate_session for backwards compatibility)
  res.setHeader('Set-Cookie', [
    createSessionCookie('avani_affiliate_session', signedCookieValue, SESSION_TTL_SECONDS),
    createSessionCookie('affiliate_session', signedCookieValue, SESSION_TTL_SECONDS),
  ]);

  return res.status(200).json({
    success: true,
    message: 'Authenticated successfully',
    sessionType: hasDistributedKV ? 'distributed_kv_revocable' : 'stateless_hmac_signed',
  });
}
