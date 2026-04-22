import { useState } from 'react'
import { FileText, Send, CheckCircle, Download, ArrowRight } from 'lucide-react'
import { sendContactEmail } from '../lib/emailjs'

export default function LeadMagnet() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await sendContactEmail({
        firstName: formData.name,
        lastName: `(Market Report Lead)`,
        email: formData.email,
        inquiryType: 'Lead Magnet: Global Superfood Report 2026',
        message: `Company: ${formData.company}. User requested the 2026 Market Report.`,
        phone: 'N/A',
        company: formData.company
      })

      setLoading(false)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Error processing request. Please check your internet connection.')
      setLoading(false)
    }
  }

  return (
    <section id="lead-magnet" style={{ 
      padding: '80px 0', 
      background: 'linear-gradient(135deg, #1a4d2e 0%, #064e3b 100%)',
      color: 'white',
      overflow: 'hidden'
    }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 64, alignItems: 'center' }}>
        
        {/* Left: Visual */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, height: 400, background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
            zIndex: 0
          }} />
          <img 
            src="/report-cover.png" 
            alt="Global Superfood Report 2026" 
            style={{ 
              width: '100%', maxWidth: 380, borderRadius: 12, 
              boxShadow: '0 30px 60px rgba(0,0,0,0.5)', 
              transform: 'rotate(-2deg)',
              zIndex: 1,
              transition: 'transform 0.5s ease'
            }} 
            onMouseOver={(e) => e.target.style.transform = 'rotate(0deg) scale(1.02)'}
            onMouseOut={(e) => e.target.style.transform = 'rotate(-2deg) scale(1)'}
          />
          <div style={{ 
            position: 'absolute', bottom: -20, right: 20, 
            background: 'var(--color-accent)', color: 'white', 
            padding: '12px 24px', borderRadius: 12, fontWeight: 900, fontSize: '0.8rem',
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)', zIndex: 2
          }}>
            PREMIUM RESEARCH 2026
          </div>
        </div>

        {/* Right: Pitch & Form */}
        <div>
          {!submitted ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 30, padding: '6px 16px', marginBottom: 24 }}>
                <FileText size={14} /> <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>For Global Importers</span>
              </div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 16, lineHeight: 1.2 }}>
                Get the <span style={{ color: 'var(--color-accent)' }}>Global Superfood</span> Market Report 2026
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 32 }}>
                Exclusive insights into the Moringa and Red Onion powder export markets. Data-driven projections for USA, EU, and Gulf markets. 
                <span style={{ display: 'block', mt: 10, fontWeight: 700 }}>Free for B2B professionals.</span>
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <input 
                    className="input" 
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} 
                    placeholder="Your Name" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  <input 
                    className="input" 
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} 
                    type="email" 
                    placeholder="Business Email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <input 
                  className="input" 
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }} 
                  placeholder="Company Name" 
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary" 
                  style={{ background: 'var(--color-accent)', justifyContent: 'center', py: 16, fontSize: '1rem' }}
                >
                  {loading ? 'Processing...' : 'Send My Free Report'} <Send size={18} style={{ ml: 8 }} />
                </button>
              </form>
              <div style={{ marginTop: 16, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                Join 500+ global importers receiving our weekly export updates.
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: 48, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle size={40} color="white" />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 12 }}>Check Your Inbox!</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32, fontSize: '1.1rem' }}>
                Thank you, <strong>{formData.name}</strong>. The 2026 Global Superfood Report is on its way to your email.
              </p>
              <div style={{ display: 'grid', gap: 12 }}>
                <a 
                  href="/products" 
                  className="btn btn-primary" 
                  style={{ background: 'white', color: 'var(--color-primary)', justifyContent: 'center' }}
                >
                  Explore Products <ArrowRight size={18} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
