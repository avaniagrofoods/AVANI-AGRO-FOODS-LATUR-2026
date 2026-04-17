import { useState } from 'react'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'

const DIRECTORY_PASSWORD = "Samarth@1356"

export default function PasswordGate({ title = "Protected Directory", subtitle = "This directory is password protected.", storageKey = "dir_access", children }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)

  const isAuthenticated = sessionStorage.getItem(storageKey) === 'true'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === DIRECTORY_PASSWORD) {
      sessionStorage.setItem(storageKey, 'true')
      setError('')
      window.location.reload()
    } else {
      setError('Incorrect password. Please contact Avani Agro Foods for access.')
      setInput('')
    }
  }

  if (isAuthenticated) return children

  return (
    <div className="page-top" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '48px 40px', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Lock size={36} color="white" />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(26,77,46,0.08)', padding: '4px 14px', borderRadius: 20, marginBottom: 20 }}>
          <Shield size={12} color="var(--color-primary)" />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)' }}>Restricted Access</span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 10 }}>{title}</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 32, fontSize: '0.9rem', lineHeight: 1.6 }}>
          {subtitle}
          <br /><br />
          This directory contains verified B2B contacts. Access is restricted to verified partners.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <input
              id="dir-password"
              type={show ? 'text' : 'password'}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter directory password"
              className="input"
              style={{ width: '100%', paddingRight: 48 }}
              required
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}>
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="badge" style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626', fontSize: '0.8rem', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Lock size={16} /> Unlock Directory
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
          Need access? Contact us at <a href="mailto:avaniagrofoods1356@gmail.com" style={{ color: 'var(--color-primary)' }}>avaniagrofoods1356@gmail.com</a>
        </p>
      </div>
    </div>
  )
}
