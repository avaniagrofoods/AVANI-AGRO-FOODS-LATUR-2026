// ============================================================
// AVANI AGRO FOODS — Affiliate Portal Authentication API
// Endpoint: /api/affiliate-auth
// Package 3F.106 Hardened (CC-03, CC-04, CC-08)
// ============================================================

import {
  getClientIp,
  checkRateLimit,
  resetRateLimit,
  verifyPassword,
  createServerSession,
  verifyServerSession,
  revokeServerSession,
  createCsrfCookie,
  isAllowedOrigin,
  validateMutationOrigin,
  verifyCsrfRequest
} from './_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({
      success: false,
      authenticated: false,
      code: 'ORIGIN_FORBIDDEN',
      error: 'Forbidden: Invalid request origin.'
    });
  }

  const clientIp = getClientIp(req);
  const action = req.method === 'GET' ? 'verify' : (req.body?.action || 'login');

  // 1. Verify active affiliate session
  if (action === 'verify') {
    const verifyLimit = await checkRateLimit(clientIp, 'affiliate_verify', { maxAttempts: 60, windowSeconds: 900 });
    if (verifyLimit.limited) {
      return res.status(verifyLimit.statusCode || 429).json({
        authenticated: false,
        code: verifyLimit.code,
        error: verifyLimit.error || 'Too many verification requests.'
      });
    }

    const session = await verifyServerSession(req, 'affiliate');
    if (!session.authenticated) {
      return res.status(session.statusCode || 401).json({
        authenticated: false,
        code: session.code,
        error: session.error
      });
    }

    res.setHeader('Set-Cookie', createCsrfCookie(session.csrfToken, undefined, 'affiliate'));
    return res.status(200).json({
      authenticated: true,
      role: session.actorRole,
      actor: session.actor,
      csrfToken: session.csrfToken
    });
  }

  // 2. Logout (State-changing session revocation — requires valid session, Origin & CSRF token)
  if (action === 'logout') {
    const session = await verifyServerSession(req, 'affiliate');
    if (!session.authenticated) {
      return res.status(session.statusCode || 401).json({
        success: false,
        authenticated: false,
        code: session.code,
        error: session.error
      });
    }

    const csrfCheck = verifyCsrfRequest(req, session);
    if (!csrfCheck.valid) {
      return res.status(csrfCheck.statusCode || 403).json({
        success: false,
        code: csrfCheck.code,
        error: csrfCheck.error
      });
    }

    const revokeResult = await revokeServerSession(req, 'affiliate');
    if (revokeResult.cookies) {
      res.setHeader('Set-Cookie', revokeResult.cookies);
    }

    if (!revokeResult.revoked) {
      return res.status(revokeResult.statusCode || 503).json({
        success: false,
        code: revokeResult.code,
        error: revokeResult.error
      });
    }

    return res.status(200).json({ success: true, loggedOut: true });
  }

  // 3. Login (State-changing session issuance)
  const originCheck = validateMutationOrigin(req);
  if (!originCheck.valid) {
    return res.status(originCheck.statusCode || 403).json({
      success: false,
      authenticated: false,
      code: originCheck.code,
      error: originCheck.error
    });
  }

  const rawAffiliatePassword = process.env.AFFILIATE_PORTAL_PASSWORD || process.env.AFFILIATE_GATE_PASSWORD || process.env.AFFILIATE_PASSWORD;
  const masterPassword = typeof rawAffiliatePassword === 'string' && rawAffiliatePassword.trim()
    ? rawAffiliatePassword.trim()
    : null;

  if (!masterPassword) {
    return res.status(503).json({
      success: false,
      authenticated: false,
      code: 'AFFILIATE_CREDENTIAL_MISSING',
      error: 'Affiliate authentication service is not configured on the server.'
    });
  }

  const rateLimit = await checkRateLimit(clientIp, 'affiliate');
  if (rateLimit.limited) {
    const status = rateLimit.statusCode || 429;
    return res.status(status).json({
      success: false,
      authenticated: false,
      code: rateLimit.code,
      error: rateLimit.backendUnavailable
        ? rateLimit.error
        : `Too many failed attempts. Please wait ${rateLimit.minutesLeft} minute(s) before trying again.`
    });
  }

  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      authenticated: false,
      code: 'PASSWORD_REQUIRED',
      error: 'Password is required.'
    });
  }

  const isMatch = verifyPassword(password, masterPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      code: 'INVALID_CREDENTIALS',
      error: `Invalid access password. ${rateLimit.remaining ?? 0} attempt(s) remaining.`
    });
  }

  const session = await createServerSession('affiliate');
  if (!session.ok) {
    return res.status(session.statusCode || 503).json({
      success: false,
      authenticated: false,
      code: session.code,
      error: session.error
    });
  }

  await resetRateLimit(clientIp, 'affiliate');
  res.setHeader('Set-Cookie', session.cookies);

  return res.status(200).json({
    success: true,
    authenticated: true,
    role: session.actorRole,
    actor: session.actor,
    csrfToken: session.csrfToken
  });
}
