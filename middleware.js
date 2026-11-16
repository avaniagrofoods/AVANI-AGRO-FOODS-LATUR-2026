// ============================================================
// AVANI AGRO FOODS — Vercel Edge Middleware (Web Standard API)
// Secures private administrative routes while allowing public indexing
// of commercial, export, blog, and resources pages.
// ============================================================

export const config = {
  matcher: ['/admin/:path*', '/api/admin-:path*'],
}

function verifyCookieFormat(signedValue) {
  if (!signedValue || typeof signedValue !== 'string') return false
  const lastDot = signedValue.lastIndexOf('.')
  if (lastDot <= 0) return false
  const value = signedValue.slice(0, lastDot)
  const signature = signedValue.slice(lastDot + 1)
  
  // Accept standard 64-character hexadecimal session identifier (Package 3F.106/108)
  // or legacy prefixed identifiers, paired with valid signature length
  const isHex64 = /^[a-f0-9]{64}$/i.test(value)
  const isPrefixed = (
    value.startsWith('avani_gate_sess_') ||
    value.startsWith('avani_admin_sess_') ||
    value.startsWith('avani_sess_') ||
    value.startsWith('admin_authenticated_')
  )
  const isValidSignature = signature.length >= 16

  return (isHex64 || isPrefixed) && isValidSignature
}

export default function middleware(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Pass through if not a protected admin path
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin-')) {
    return
  }

  // Exact Webhook Exemption: Allow delivery-webhook POST directly to API handler
  // The handler itself enforces strict Svix cryptographic signature verification.
  // No other admin API route receives this exemption.
  const actionParam = url.searchParams.get('action')
  if (
    request.method === 'POST' &&
    pathname === '/api/admin-quotations' &&
    actionParam === 'delivery-webhook'
  ) {
    return // Pass through to handler for Svix cryptographic signature verification
  }

  // Check incoming Authorization header for authorized programmatic Bearer tokens (CRON_SECRET or ADMIN_API_KEY)
  // Master password as Bearer token is strictly forbidden and rejected.
  const authHeader = request.headers.get('authorization') || ''
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    const cronSecret = (process.env.CRON_SECRET || '').trim()
    const adminApiKey = (process.env.ADMIN_API_KEY || '').trim()
    if ((cronSecret && token === cronSecret) || (adminApiKey && token === adminApiKey)) {
      return // Authorized programmatic request: pass through to serverless handler
    }
  }

  // Check incoming cookie header
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k.trim(), decodeURIComponent(v.join('='))]
    }).filter(([k]) => Boolean(k))
  )

  const sessionCookie = cookies['avani_gate_session'] || cookies['avani_admin_session'] || cookies['admin_session']

  if (!sessionCookie || !verifyCookieFormat(sessionCookie)) {
    // For API routes, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized admin access' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // For web views (/admin/...), allow through to client SPA so PasswordGate can render
    return
  }

  // Syntactically valid admin cookie: pass through to downstream handler for
  // authoritative server-side signature verification, expiry check, and KV lookup.
  return
}
