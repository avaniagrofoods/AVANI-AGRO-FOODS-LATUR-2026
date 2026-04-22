import { useState } from 'react'
import SEO from '../components/SEO'
import { logAffiliateRegistration } from '../lib/googleSheets'
import { sendAffiliateEmail } from '../lib/emailjs'
import { WHATSAPP_NUMBER, AFFILIATE_LINKS, STRIPE_LINKS } from '../data/links'
import { Users, TrendingUp, Link as LinkIcon, DollarSign, CheckCircle, ArrowRight, Zap, Star } from 'lucide-react'


function generateAffId() {
  return 'AV-' + Math.random().toString(36).substr(2, 6).toUpperCase()
}

export default function Affiliate() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', platform: '', followers: '', why: '' })
  const [submitted, setSubmitted] = useState(false)
  const [affId, setAffId] = useState('')
  const [loading, setLoading] = useState(false)
  const [pricingRegion, setPricingRegion] = useState(0)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const id = generateAffId()
    setAffId(id)
    
    const affData = { ...form, affId: id, joinedAt: new Date().toISOString() }
    
    // Save locally first
    const existing = JSON.parse(localStorage.getItem('affiliates') || '[]')
    existing.push(affData)
    localStorage.setItem('affiliates', JSON.stringify(existing))
    
    // Log to Google Sheets
    await logAffiliateRegistration({ affId: id, name: form.name, email: form.email, platform: form.platform, followers: form.followers })
    
    // Send email notification
    try { await sendAffiliateEmail({ ...form, affId: id }) } catch {}
    
    setLoading(false)
    setSubmitted(true)
  }

  const open = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I just registered as an Avani Agro Foods Affiliate. My ID is ${affId}. Please send me my affiliate kit!`)}`

  return (
    <>
      <SEO
        title="Affiliate Program — Earn 15-20% Commission"
        description="Join Avani Agro Foods affiliate program. Earn 15-20% commission on B2B referrals. Moringa Powder and Onion Powder affiliate marketing in India and globally."
        keywords="moringa powder affiliate program india, earn commission moringa, avani agro foods affiliate"
      />

      <div className="page-top">
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '96px 0' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(230,168,23,0.15)', color: '#e6a817', border: '1px solid rgba(230,168,23,0.3)', display: 'inline-flex', marginBottom: 20 }}>
              <DollarSign size={14} /> Affiliate Program
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 20 }}>
              Join the <span style={{ background: 'linear-gradient(135deg, #e6a817, #f99f1f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Avani Agro</span><br />Growth Network
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
              Earn 5-20% commission by promoting our premium Moringa and Onion products. 100% Free to join — no hidden fees or subscriptions for marketers.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#register" className="btn btn-primary" style={{ gap: 8 }}><Zap size={18} /> Join Free Now</a>
              <a href="#affiliate-links" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>View Affiliate Links</a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: 'var(--color-accent)', padding: '32px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', gap: 0, justifyContent: 'space-around', flexWrap: 'wrap' }}>
              {[['15-20%', 'Commission Rate'], ['120+', 'Active Affiliates'], ['₹45K', 'Top Affiliate/Month'], ['24h', 'Response Time']].map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center', padding: '12px 24px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{v}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '72px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'flex-start' }}>

            {/* Registration Form */}
            <div id="register">
              {!submitted ? (
                <div className="card" style={{ padding: '40px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Register as Affiliate</h2>
                  <p style={{ color: 'var(--color-text-light)', marginBottom: 32, fontSize: '0.9rem' }}>Get your unique tracking ID in 60 seconds. No payment required.</p>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label className="label">Full Name *</label>
                      <input id="aff-name" className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Priya Sharma" />
                    </div>
                    <div>
                      <label className="label">Email Address *</label>
                      <input id="aff-email" type="email" className="input" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="priya@gmail.com" />
                    </div>
                    <div>
                      <label className="label">WhatsApp / Phone</label>
                      <input id="aff-phone" className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                    </div>
                    <div>
                      <label className="label">Primary Platform *</label>
                      <select id="aff-platform" className="input" required value={form.platform} onChange={e => set('platform', e.target.value)}>
                        <option value="">Select platform</option>
                        {['Instagram', 'YouTube', 'Blog/Website', 'WhatsApp Network', 'Facebook', 'LinkedIn', 'Amazon FBA Seller', 'B2B Trader', 'Other'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Followers / Reach</label>
                      <input id="aff-followers" className="input" value={form.followers} onChange={e => set('followers', e.target.value)} placeholder="e.g. 5,000 Instagram followers" />
                    </div>
                    <div>
                      <label className="label">Why do you want to join?</label>
                      <textarea id="aff-why" className="input" rows={3} value={form.why} onChange={e => set('why', e.target.value)} placeholder="Tell us briefly about your audience and goals..." />
                    </div>
                    <button id="aff-submit" type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                      {loading ? 'Registering...' : <><Users size={18} /> Register & Get My Affiliate ID</>}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), #2d8f5c)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <CheckCircle size={36} color="white" />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>You're In! 🎉</h2>
                  <p style={{ color: 'var(--color-text-light)', marginBottom: 28, lineHeight: 1.7 }}>Welcome to the Avani Agro Foods Affiliate Program, <strong>{form.name}</strong>!</p>

                  <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: 28 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Your Affiliate ID</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#e6a817', letterSpacing: 4, fontFamily: 'monospace' }}>{affId}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>Use this ID in all referrals and communications</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <a href={open} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                      📱 Send to WhatsApp — Get Affiliate Kit
                    </a>
                    <a href="/affiliate/dashboard" className="btn" style={{ justifyContent: 'center' }}>
                      📊 View My Dashboard <ArrowRight size={16} />
                    </a>
                  </div>

                  <div style={{ marginTop: 24, padding: '16px', background: 'rgba(26,77,46,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-text-light)', textAlign: 'left' }}>
                    <strong>Next steps:</strong><br />
                    1. WhatsApp us with your ID above ↑<br />
                    2. We'll send your affiliate link kit within 24h<br />
                    3. Share links and start earning!
                  </div>
                </div>
              )}
            </div>

            {/* Info Column */}
            <div>
              {/* How It Works */}
              <div className="card" style={{ padding: '32px', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 24 }}>How It Works</h2>
                {[
                  { step: '01', title: 'Register Free', desc: 'Fill the form and get your unique Affiliate ID (AV-XXXXXX) instantly.' },
                  { step: '02', title: 'Get Your Links', desc: 'Receive your custom affiliate links for Amazon, iHerb, and Avani direct.' },
                  { step: '03', title: 'Share & Promote', desc: 'Promote on social media, blog, WhatsApp, YouTube — your choice.' },
                  { step: '04', title: 'Earn Commission', desc: '3-10% on Amazon/iHerb orders. 15-20% on B2B direct referrals.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900, fontSize: '0.75rem', color: 'white' }}>{step}</div>
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Commission Table */}
              <div className="card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 20 }}>Commission Rates</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
                      {['Type', 'Platform', 'Rate'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Amazon Global', 'Amazon US', '3-10%'],
                      ['Amazon India', 'Amazon IN', '3-8%'],
                      ['iHerb India', 'iHerb IN', '5-10%'],
                      ['iHerb Global', 'iHerb US', '5-10%'],
                      ['B2B Referral', 'Direct', '15-20%'],
                    ].map(([t, p, r], i) => (
                      <tr key={t} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'white' : '#f8faf8' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{t}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--color-text-light)' }}>{p}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--color-primary)' }}>{r}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Affiliate Links Section */}
          <div id="affiliate-links" style={{ marginTop: 72 }}>
            <div className="section-header">
              <div className="section-tag"><LinkIcon size={12} /> Promoted Links</div>
              <h2 className="section-title">Your Affiliate Links</h2>
              <p className="section-desc">Use these links in your promotions. Register first to get tracked personal links.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              {[
                AFFILIATE_LINKS.AMAZON.GLOBAL,
                AFFILIATE_LINKS.AMAZON.ORGANIC_INDIA,
                AFFILIATE_LINKS.AMAZON.HIMALAYAN_ORGANICS,
                AFFILIATE_LINKS.AMAZON.KULI_KULI,
                AFFILIATE_LINKS.IHERB.INDIA,
                AFFILIATE_LINKS.IHERB.US,
              ].map(link => (
                <div key={link.name} className="card card-hover" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span className="badge">{link.platform}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-accent)' }}>{link.commission}</span>
                  </div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 6 }}>{link.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginBottom: 16 }}>{link.market}</div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
                    Open Affiliate Link <ArrowRight size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
