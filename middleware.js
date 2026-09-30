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
  if (lastDot === -1) return false
  const value = signedValue.slice(0, lastDot)
  const signature = signedValue.slice(lastDot + 1)
  return (
    value.startsWith('avani_gate_sess_') ||
    value.startsWith('avani_admin_sess_') ||
    value.startsWith('avani_sess_') ||
    value.startsWith('admin_authenticated_')
  ) && signature.length > 10
}

export default function middleware(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Pass through if not a protected admin path
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin-')) {
    return
  }

  // Check incoming Authorization header for API Bearer token
  const authHeader = request.headers.get('authorization') || ''
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    const masterPassword = process.env.PRIVATE_PORTAL_PASSWORD || process.env.MASTER_GATE_PASSWORD
    if (masterPassword && token === masterPassword) {
      return // Authorized API request: pass through to serverless handler
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

  // Authorized admin request: pass through to downstream handler
  return
}
