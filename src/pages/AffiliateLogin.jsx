import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import { Lock, ShieldCheck, LogIn, AlertCircle } from 'lucide-react'
import { trackAffiliateLogin } from '../lib/analytics'

export default function AffiliateLogin() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/affiliate'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/affiliate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        trackAffiliateLogin()
        // Session cookie set by server — navigate to affiliate page
        navigate(redirectTo, { replace: true })
      } else {
        const data = await res.json().catch(() => ({}))
        setAttempts(a => a + 1)
        if (res.status === 429) {
          setError('Too many attempts. Please wait 15 minutes before trying again.')
        } else {
          setError(data.error || 'Incorrect password. Please try again.')
        }
        setPassword('')
      }
    } catch {
      setError('Connection error. Please check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO
        title="Affiliate Programme Login — Authorized Partners Only"
        description="Secure login for AVANI AGRO FOODS affiliate programme partners."
        noindex={true}
      />

      <div
        className="page-top"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a1f0d 0%, #1a4d2e 50%, #0a1f0d 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <img
              src="/logo.png"
              alt="AVANI AGRO FOODS"
              style={{ height: 72, width: 72, objectFit: 'contain', borderRadius: 16, background: 'white', padding: 8, marginBottom: 20 }}
              onError={e => e.target.style.display = 'none'}
            />
            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              AVANI AGRO FOODS
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', marginBottom: 8 }}>
              Affiliate Programme
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>
              Authorized partners only
            </p>
          </div>

          {/* Login Card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '40px',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Lock Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: error ? 'rgba(239,68,68,0.15)' : 'rgba(230,168,23,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 32px',
              border: `1px solid ${error ? 'rgba(239,68,68,0.3)' : 'rgba(230,168,23,0.3)'}`,
              transition: 'all 0.3s ease',
            }}>
              {error
                ? <AlertCircle size={28} color="#ef4444" />
                : <Lock size={28} color="#e6a817" />
              }
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label
                  htmlFor="affiliate-password"
                  style={{
                    display: 'block', fontSize: '0.75rem', fontWeight: 700,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)', marginBottom: 10,
                  }}
                >
                  Partner Password
                </label>
                <input
                  id="affiliate-password"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  disabled={loading}
                  style={{
                    width: '100%', height: 56, padding: '0 20px',
                    background: 'rgba(255,255,255,0.07)',
                    border: `1.5px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 12, color: 'white', fontSize: '1rem',
                    letterSpacing: '0.15em', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                />
                {error && (
                  <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: 8, fontWeight: 600 }}>
                    {error}
                    {attempts >= 3 && attempts < 5 && (
                      <span style={{ opacity: 0.75 }}> ({5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining)</span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password.trim()}
                style={{
                  height: 56, borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? 'rgba(230,168,23,0.5)' : 'var(--color-accent, #e6a817)',
                  color: 'black', fontWeight: 800, fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.2s ease',
                  opacity: loading || !password.trim() ? 0.7 : 1,
                }}
              >
                {loading
                  ? <><span style={{ opacity: 0.8 }}>Verifying...</span></>
                  : <><LogIn size={20} /> Access Affiliate Programme</>
                }
              </button>
            </form>

            <div style={{
              marginTop: 32, paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldCheck size={14} color="rgba(255,255,255,0.35)" />
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
                  SECURE · AUTHORIZED ACCESS ONLY
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                Don't have access? Contact{' '}
                <a
                  href="mailto:sales@avaniagrofoods.com"
                  style={{ color: 'rgba(230,168,23,0.7)', textDecoration: 'none' }}
                >
                  sales@avaniagrofoods.com
                </a>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a
              href="/"
              style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textDecoration: 'none' }}
            >
              ← Back to AVANI AGRO FOODS
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
