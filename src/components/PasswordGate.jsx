import { useState, useEffect } from 'react'
import { Lock, Unlock, ShieldAlert, Loader2 } from 'lucide-react'

export default function PasswordGate({
  children,
  title = "Protected Directory Access",
  description = "Please enter the authorized access password to view this directory.",
  storageKey = null,
  onUnlock = null
}) {
  const [authenticated, setAuthenticated] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Verify existing session on mount via server-side session cookie
  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const res = await fetch('/api/verify-gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ action: 'verify' }),
        })
        if (res.ok && isMounted) {
          setAuthenticated(true)
          if (onUnlock) onUnlock()
        }
      } catch (err) {
        // Fallback gracefully if API is unreachable
      } finally {
        if (isMounted) setCheckingSession(false)
      }
    }

    checkAuth()
    return () => { isMounted = false }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/verify-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password: input }),
      })

      if (res.ok) {
        setAuthenticated(true)
        setError('')
        if (onUnlock) onUnlock()
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setError(data.error || 'Too many attempts. Please wait 15 minutes.')
        } else {
          setError(data.error || 'Incorrect password. Please try again.')
        }
      }
    } catch (err) {
      setError('Network connection error. Please try again.')
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  if (checkingSession) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Loader2 size={32} color="var(--color-primary)" className="animate-spin" />
      </div>
    )
  }

  if (authenticated) {
    return <>{children}</>
  }

  return (
    <div className="card" style={{ maxWidth: 440, margin: '60px auto', padding: '40px 32px', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(26, 77, 46, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        border: `1px solid ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(26, 77, 46, 0.2)'}`
      }}>
        {error ? <ShieldAlert size={32} color="#ef4444" /> : <Lock size={32} color="var(--color-primary)" />}
      </div>
      
      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 12 }}>{title}</h2>
      <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 32 }}>{description}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <input
            type="password"
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter password..."
            autoFocus
            disabled={loading}
            required
            style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: 10, fontWeight: 700 }}>{error}</div>}
        </div>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !input.trim()}
          style={{ justifyContent: 'center', gap: 8, height: 48 }}
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Verifying...</>
          ) : (
            <><Unlock size={18} /> Unlock Access</>
          )}
        </button>
      </form>
      
      <div style={{ marginTop: 24, fontSize: '0.72rem', color: 'var(--color-text-light)' }}>
        Authorized Access Only • AVANI AGRO FOODS
      </div>
    </div>
  )
}
