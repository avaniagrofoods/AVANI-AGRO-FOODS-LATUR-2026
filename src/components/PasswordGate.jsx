import { useState } from 'react'
import { Lock, Unlock, ShieldAlert } from 'lucide-react'

export default function PasswordGate({ children, password = "password", title = "Secure Access Required", description = "Please enter the password to access this document." }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === password) {
      setError(false)
      setAuthenticated(true)
    } else {
      setError(true)
    }
  }

  if (authenticated) {
    return <>{children}</>
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: '40px auto', padding: '40px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(26, 77, 46, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
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
            style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }}
          />
          {error && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 8, fontWeight: 700 }}>Incorrect password. Please try again.</div>}
        </div>
        
        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', gap: 8 }}>
          <Unlock size={18} /> Unlock Access
        </button>
      </form>
      
      <div style={{ marginTop: 24, fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
        Authorized Access Only • Avani Agro Foods
      </div>
    </div>
  )
}
