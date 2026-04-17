import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import { getLocalEvents } from '../lib/googleSheets'
import { AFFILIATE_LINKS, WHATSAPP_NUMBER, GOOGLE_SHEET_URL } from '../data/links'
import { BarChart3, Link as LinkIcon, Users, TrendingUp, ExternalLink, Copy, CheckCircle, Activity } from 'lucide-react'

export default function AffiliateDashboard() {
  const [affData, setAffData] = useState(null)
  const [events, setEvents] = useState([])
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const affiliates = JSON.parse(localStorage.getItem('affiliates') || '[]')
    if (affiliates.length > 0) {
      setAffData(affiliates[affiliates.length - 1])
    }
    setEvents(getLocalEvents())
  }, [])

  const copyLink = (url) => {
    const affSuffix = affData?.affId ? `?ref=${affData.affId}` : ''
    navigator.clipboard.writeText(url + affSuffix)
    setCopied(url)
    setTimeout(() => setCopied(''), 2000)
  }

  const clicks = events.filter(e => e.type === 'CLICK').length
  const registrations = events.filter(e => e.type === 'REGISTRATION').length
  const sales = events.filter(e => e.type === 'SALE').length

  const STATS = [
    { label: 'Total Clicks', value: clicks, icon: Activity, color: '#3b82f6' },
    { label: 'Registrations', value: registrations, icon: Users, color: 'var(--color-primary)' },
    { label: 'Conversions', value: sales, icon: TrendingUp, color: 'var(--color-accent)' },
    { label: 'Est. Earnings', value: `₹${(clicks * 0.02 * 800 * 0.08).toFixed(0)}`, icon: BarChart3, color: '#7c3aed' },
  ]

  const ALL_LINKS = [
    { ...AFFILIATE_LINKS.AMAZON.GLOBAL, category: 'Amazon Global' },
    { ...AFFILIATE_LINKS.AMAZON.ORGANIC_INDIA, category: 'Amazon India' },
    { ...AFFILIATE_LINKS.AMAZON.HIMALAYAN_ORGANICS, category: 'Amazon India' },
    { ...AFFILIATE_LINKS.AMAZON.KULI_KULI, category: 'Amazon Global' },
    { ...AFFILIATE_LINKS.IHERB.INDIA, category: 'iHerb India' },
    { ...AFFILIATE_LINKS.IHERB.US, category: 'iHerb Global' },
  ]

  return (
    <>
      <SEO title="Affiliate Dashboard" description="Avani Agro Foods affiliate dashboard. Track your clicks, commissions, and access all affiliate links." />

      <div className="page-top">
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '72px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 12 }}>
                  <BarChart3 size={14} /> Affiliate Dashboard
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: 8 }}>
                  {affData ? `Welcome back, ${affData.name.split(' ')[0]}!` : 'Affiliate Dashboard'}
                </h1>
                {affData && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>Your ID:</span>
                    <code style={{ fontSize: '1rem', fontWeight: 900, color: '#e6a817', background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: 8 }}>{affData.affId}</code>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ExternalLink size={14} /> Live Sheet (Admin)
                </a>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I need help with my affiliate account. ID: ${affData?.affId || 'N/A'}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ background: '#25D366' }}>
                  📱 WhatsApp Support
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '48px 24px' }}>
          {!affData && (
            <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: 32, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No affiliate data found. <a href="/affiliate" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Register first →</a></p>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 40 }}>
            {STATS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Icon size={22} color={color} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Note about Google Sheets */}
          <div style={{ background: 'rgba(26,77,46,0.08)', border: '1px solid rgba(26,77,46,0.2)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>📊 Google Sheets Integration Active</div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                  All clicks and registrations are logged to the Avani Agro Foods tracking sheet. Admin can view all affiliate activity in real time.
                </p>
              </div>
              <a href={GOOGLE_SHEET_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                View Live Sheet <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Affiliate Links */}
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 24 }}>
            <LinkIcon size={20} style={{ display: 'inline', marginRight: 8 }} />
            Your Affiliate Links
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 48 }}>
            {ALL_LINKS.map(link => (
              <div key={link.name} className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="badge">{link.category}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-accent)' }}>{link.commission}</span>
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 8 }}>{link.name}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginBottom: 16 }}>
                  {link.url.slice(0, 45)}…
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => copyLink(link.url)} className="btn" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', gap: 4 }}>
                    {copied === link.url ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                  </button>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}>
                    Open <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 24 }}>
            <Activity size={20} style={{ display: 'inline', marginRight: 8 }} />
            Recent Activity
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-light)', marginLeft: 12 }}>({events.length} local events)</span>
          </h2>

          {events.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
              <Activity size={48} color="var(--color-border)" style={{ marginBottom: 16 }} />
              <p style={{ color: 'var(--color-text-light)', margin: 0 }}>No activity logged yet. Start sharing your affiliate links!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-primary)', color: 'white' }}>
                    {['Timestamp', 'Event Type', 'Affiliate ID', 'Product / Platform', 'Amount'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.slice().reverse().slice(0, 20).map((ev, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 16px', fontSize: '0.78rem', color: 'var(--color-text-light)' }}>{new Date(ev.timestamp).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 30, background: ev.type === 'REGISTRATION' ? 'rgba(26,77,46,0.12)' : ev.type === 'CLICK' ? 'rgba(59,130,246,0.12)' : 'rgba(230,168,23,0.15)', color: ev.type === 'REGISTRATION' ? 'var(--color-primary)' : ev.type === 'CLICK' ? '#3b82f6' : '#b45309' }}>
                          {ev.type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, fontFamily: 'monospace' }}>{ev.affId}</td>
                      <td style={{ padding: '10px 16px' }}>{ev.product || ev.platform}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 700 }}>{ev.amount ? `₹${ev.amount}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
