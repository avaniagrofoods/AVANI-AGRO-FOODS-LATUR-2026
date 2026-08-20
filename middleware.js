// ============================================================
// AVANI AGRO FOODS — Vercel Edge Middleware (Web Standard API)
// Protects /affiliate/* and private routes with server-side cookie check.
// Uses standard Web Request/Response APIs (compatible with pure Vite SPA).
// Password is stored only in Vercel Environment Variables.
// ============================================================

export const config = {
  matcher: ['/affiliate/:path*'],
}

function verifyCookieFormat(signedValue) {
  if (!signedValue || typeof signedValue !== 'string') return false
  const lastDot = signedValue.lastIndexOf('.')
  if (lastDot === -1) return false
  const value = signedValue.slice(0, lastDot)
  const signature = signedValue.slice(lastDot + 1)
  return (
    value.startsWith('avani_affiliate_sess_') ||
    value.startsWith('avani_sess_') ||
    value.startsWith('affiliate_authenticated_')
  ) && signature.length > 10
}

export default function middleware(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Allow public authentication endpoints and pages
  if (pathname === '/affiliate-login' || pathname.startsWith('/api/')) {
    return
  }

  // Check incoming cookie header
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=')
      return [k.trim(), decodeURIComponent(v.join('='))]
    }).filter(([k]) => Boolean(k))
  )

  const sessionCookie = cookies['avani_affiliate_session'] || cookies['affiliate_session']

  if (!sessionCookie || !verifyCookieFormat(sessionCookie)) {
    // Redirect unauthenticated requests to login page
    const loginUrl = new URL('/affiliate-login', request.url)
    loginUrl.searchParams.set('redirect', pathname)

    const headers = new Headers({
      'Location': loginUrl.toString(),
      'Set-Cookie': 'avani_affiliate_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict',
    })

    return new Response(null, {
      status: 307,
      headers,
    })
  }

  // Authorized request: pass through with strict security headers
  const headers = new Headers()
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'SAMEORIGIN')

  return new Response(null, {
    headers,
  })
}
