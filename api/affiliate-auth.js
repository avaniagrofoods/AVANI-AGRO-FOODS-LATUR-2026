// ============================================================
// AVANI AGRO FOODS — Unified Authentication & Session API
// Vercel Serverless Function (Node.js runtime)
// POST /api/affiliate-auth
//
// Supports:
//   1. Distributed Server-Side Session Store & Revocation (via Upstash Redis / Vercel KV)
//   2. Distributed Rate Limiting (via Upstash Redis / Vercel KV)
//   3. High-Security In-Memory / Stateless HMAC Fallback
//
// Environment variables:
//   AFFILIATE_PASSWORD      — Password for affiliate / protected areas
//   SESSION_SECRET          — 32+ character random secret for HMAC signing
//   KV_REST_API_URL / UPSTASH_REDIS_REST_URL     — (Optional) Distributed KV Endpoint
//   KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN — (Optional) Distributed KV Token
// ============================================================

import crypto from 'crypto'

// ── LOCAL FALLBACK STORAGE ──────────────────────────────────────
const localAttempts = new Map()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

// ── KV / REDIS REST CLIENT HELPERS ──────────────────────────────
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const hasDistributedKV = Boolean(kvUrl && kvToken)

async function execKVCommand(command, ...args) {
  if (!hasDistributedKV) return null
  try {
    const url = `${kvUrl.replace(/\/$/, '')}/${command}/${args.map(encodeURIComponent).join('/')}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${kvToken}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.result
  } catch (err) {
    console.error('KV Execution Error:', err.message)
    return null
  }
}

// ── RATE LIMITING ───────────────────────────────────────────────
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    '127.0.0.1'
  )
}

async function checkRateLimit(ip) {
  // 1. Try Distributed KV Rate Limiting if configured
  if (hasDistributedKV) {
    try {
      const key = `ratelimit:auth:${ip}`
      const current = await execKVCommand('INCR', key)
      if (current === 1) {
        await execKVCommand('EXPIRE', key, '900') // 15 minutes
      }
      if (current > MAX_ATTEMPTS) {
        const ttl = (await execKVCommand('TTL', key)) || 900
        const minutesLeft = Math.ceil(Number(ttl) / 60) || 15
        return { limited: true, minutesLeft, isDistributed: true }
      }
      return { limited: false, remaining: Math.max(0, MAX_ATTEMPTS - Number(current)), isDistributed: true }
    } catch {
      // Fall through to local limiter
    }
  }

  // 2. Fallback: Local In-Memory Rate Limiter
  const now = Date.now()
  const record = localAttempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS }

  if (now > record.resetAt) {
    localAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { limited: false, remaining: MAX_ATTEMPTS - 1, isDistributed: false }
  }

  if (record.count >= MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((record.resetAt - now) / 60000)
    return { limited: true, minutesLeft, isDistributed: false }
  }

  localAttempts.set(ip, { ...record, count: record.count + 1 })
  return { limited: false, remaining: MAX_ATTEMPTS - record.count - 1, isDistributed: false }
}

async function resetRateLimit(ip) {
  if (hasDistributedKV) {
    await execKVCommand('DEL', `ratelimit:auth:${ip}`)
  }
  localAttempts.delete(ip)
}

// ── SESSION MANAGEMENT & CRYPTOGRAPHY ───────────────────────────
function signSessionId(sessionId, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(sessionId)
  const sig = hmac.digest('base64url')
  return `${sessionId}.${sig}`
}

function parseAndVerifySignature(signedCookie, secret) {
  if (!signedCookie || typeof signedCookie !== 'string') return null
  const lastDot = signedCookie.lastIndexOf('.')
  if (lastDot === -1) return null

  const sessionId = signedCookie.slice(0, lastDot)
  const signature = signedCookie.slice(lastDot + 1)

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(sessionId)
  const expectedSig = hmac.digest('base64url')

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expectedSig)

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }
  return sessionId
}

// ── MAIN SERVERLESS HANDLER ─────────────────────────────────────
export default async function handler(req, res) {
  // CORS & Security Headers
  const origin = req.headers.origin || ''
  const isAllowedOrigin =
    !origin ||
    origin.includes('avaniagrofoods.com') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.endsWith('.vercel.app')

  if (!isAllowedOrigin) {
    return res.status(403).json({ error: 'Forbidden origin' })
  }

  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sessionSecret = process.env.SESSION_SECRET || 'avani_default_session_secret_2026_secure'
  const correctPassword = process.env.AFFILIATE_PASSWORD

  const body = req.body || {}
  const { action, password } = body

  // 1. ACTION: LOGOUT (Session Invalidation)
  if (action === 'logout') {
    const cookieHeader = req.headers.cookie || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=')
        return [k.trim(), decodeURIComponent(v.join('='))]
      })
    )
    const sessionCookie = cookies['affiliate_session']
    const sessionId = parseAndVerifySignature(sessionCookie, sessionSecret)

    // Revoke from distributed store if present
    if (sessionId && hasDistributedKV) {
      await execKVCommand('DEL', `session:${sessionId}`)
    }

    res.setHeader(
      'Set-Cookie',
      'affiliate_session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
    )
    return res.status(200).json({ success: true, message: 'Logged out successfully' })
  }

  // 2. ACTION: VERIFY SESSION
  if (action === 'verify') {
    const cookieHeader = req.headers.cookie || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=')
        return [k.trim(), decodeURIComponent(v.join('='))]
      })
    )
    const sessionCookie = cookies['affiliate_session']
    const sessionId = parseAndVerifySignature(sessionCookie, sessionSecret)

    if (!sessionId) {
      return res.status(401).json({ authenticated: false })
    }

    // Check distributed revocation store if configured
    if (hasDistributedKV) {
      const sessionData = await execKVCommand('GET', `session:${sessionId}`)
      if (!sessionData) {
        return res.status(401).json({ authenticated: false, message: 'Session revoked or expired' })
      }
    }

    return res.status(200).json({ authenticated: true })
  }

  // 3. ACTION: LOGIN (Password verification & Session creation)
  const ip = getClientIp(req)
  const rateCheck = await checkRateLimit(ip)

  if (rateCheck.limited) {
    return res.status(429).json({
      error: `Too many failed attempts. Access is temporarily locked. Please wait ${rateCheck.minutesLeft} minute(s).`,
      retryAfterMinutes: rateCheck.minutesLeft,
    })
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' })
  }

  if (!correctPassword) {
    console.error('Configuration Notice: AFFILIATE_PASSWORD is not configured in Vercel environment variables.')
    return res.status(500).json({ error: 'Authentication service configuration pending' })
  }

  // Constant-time string comparison to prevent timing attacks
  const inputBuf = Buffer.from(password)
  const correctBuf = Buffer.from(correctPassword)

  let match = false
  if (inputBuf.length === correctBuf.length) {
    match = crypto.timingSafeEqual(inputBuf, correctBuf)
  }

  if (!match) {
    return res.status(401).json({
      error: 'Incorrect password. Please try again.',
      remainingAttempts: rateCheck.remaining,
    })
  }

  // Reset rate limiting on successful login
  await resetRateLimit(ip)

  // Generate cryptographically random session identifier
  const rawSessionId = `avani_sess_${crypto.randomUUID()}_${Date.now()}`
  const signedCookieValue = signSessionId(rawSessionId, sessionSecret)

  // Save to distributed KV store if available
  if (hasDistributedKV) {
    await execKVCommand('SET', `session:${rawSessionId}`, JSON.stringify({
      created: Date.now(),
      ip,
      role: 'affiliate',
    }))
    await execKVCommand('EXPIRE', `session:${rawSessionId}`, String(SESSION_TTL_SECONDS))
  }

  // Set secure cookie (HttpOnly, Secure, SameSite=Strict, Path=/, 7-day max-age)
  res.setHeader(
    'Set-Cookie',
    `affiliate_session=${encodeURIComponent(signedCookieValue)}; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}; Path=/`
  )

  return res.status(200).json({
    success: true,
    message: 'Authenticated successfully',
    sessionType: hasDistributedKV ? 'distributed_kv_revocable' : 'stateless_hmac_signed',
  })
}
