import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

export default function AffiliateAuthGuard({ children }) {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    async function verifySession() {
      try {
        const res = await fetch('/api/affiliate-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ action: 'verify' }),
        })

        if (res.ok) {
          if (isMounted) {
            setAuthenticated(true)
            setChecking(false)
          }
        } else {
          if (isMounted) {
            navigate(`/affiliate-login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
          }
        }
      } catch (err) {
        // In local development or if offline, handle gracefully
        if (isMounted) {
          navigate(`/affiliate-login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
        }
      }
    }

    verifySession()

    return () => { isMounted = false }
  }, [location.pathname, navigate])

  if (checking) {
    return (
      <div className="page-top" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Loader2 size={36} color="var(--color-primary)" className="animate-spin" />
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', fontWeight: 600 }}>
          Verifying authorized session...
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}
