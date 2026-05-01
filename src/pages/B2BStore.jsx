import { useState } from 'react'
import SEO from '../components/SEO'
import { B2B_PARTNERS } from '../data/b2bPartners'
import { 
  Building2, MapPin, CheckCircle2, 
  ExternalLink, Search, Filter, 
  X, Briefcase, Globe, Phone
} from 'lucide-react'

export default function B2BStore() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [isPaid, setIsPaid] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [password, setPassword] = useState('')

  const handleUnlock = () => {
    if (password === 'Samarth@1356') {
      setIsPaid(true)
      setShowLogin(false)
      alert('Access Granted! Global Importers unlocked.')
    } else {
      alert('Incorrect Membership Code.')
    }
  }

  // Filter logic: Free users only see "reg_" (registrations), Paid see all
  const accessiblePartners = isPaid 
    ? B2B_PARTNERS 
    : B2B_PARTNERS.filter(p => p.id.startsWith('reg_'))

  const filteredPartners = accessiblePartners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <SEO 
        title="B2B Directory & Global Partners"
        description="Premium B2B directory of global superfood importers, manufacturers, and trade partners. Access verified leads for Moringa and Onion Powder exports."
        keywords="global importers directory, B2B superfood trade, export partners india, agri trade leads"
      />

      <div className="page-top" style={{ minHeight: '100vh', background: '#fcfdfc', padding: '120px 0' }}>
        <div className="container">
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: 16 }}>B2B Store <span style={{ color: 'var(--color-primary)' }}>Directory</span></h1>
            <p style={{ color: 'var(--color-text-light)', fontSize: '1.2rem', maxWidth: 700, margin: '0 auto 40px' }}>
              Connect with our verified network of global exporters, importers, and wholesale distributors.
            </p>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', maxWidth: 400, width: '100%' }}>
                <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} size={20} />
                <input 
                  className="input" 
                  style={{ paddingLeft: 48, height: 56, borderRadius: 28, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }} 
                  placeholder="Search registered businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <a href="/b2b/register" className="btn btn-primary" style={{ height: 56, borderRadius: 28, padding: '0 32px' }}>
                Join the Network
              </a>
              {!isPaid && (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="btn" 
                  style={{ height: 56, borderRadius: 28, padding: '0 32px', background: '#333', color: 'white', border: 'none' }}
                >
                  Unlock Global Importers
                </button>
              )}
            </div>
          </div>

          {!isPaid && (
            <div style={{ 
              background: 'linear-gradient(135deg, #1a472a 0%, #2d5a27 100%)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '30px 40px', 
              color: 'white', 
              marginBottom: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 24,
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8, color: 'white' }}>Upgrade to Paid Membership</h3>
                <p style={{ opacity: 0.9, fontSize: '1rem' }}>Get instant access to 30+ Global Importers specifically for Moringa and Onion powder.</p>
              </div>
              <button 
                onClick={() => setShowLogin(true)}
                className="btn" 
                style={{ background: 'var(--color-accent)', color: 'black', border: 'none', padding: '12px 32px', fontSize: '1rem' }}
              >
                Access Premium Data
              </button>
            </div>
          )}

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
            {filteredPartners.map(partner => (
              <div key={partner.id} className="card card-hover shadow-sm" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <div style={{ height: 160, overflow: 'hidden' }}>
                    <img src={partner.images[0]} alt={partner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <img src={partner.logo} alt={partner.name} style={{ width: 48, height: 48, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {partner.name} {partner.verified && <CheckCircle2 size={16} color="var(--color-primary)" />}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {partner.location}
                      </div>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: 20, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {partner.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    {partner.specialization.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-bg-alt)', padding: '4px 10px', borderRadius: 12 }}>{s}</span>
                    ))}
                  </div>

                  <button 
                    onClick={() => setSelectedPartner(partner)}
                    className="btn" 
                    style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPartners.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ color: 'var(--color-text-light)' }}>No matching businesses found. Try a different search term.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal/View */}
      {selectedPartner && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="animate-in" style={{
            background: 'white', maxWidth: 800, width: '100%', 
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            maxHeight: '90vh', overflowY: 'auto', position: 'relative'
          }}>
            <button 
                onClick={() => setSelectedPartner(null)}
                style={{ position: 'absolute', top: 20, right: 20, background: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-md)', zIndex: 10 }}
            >
                <X size={20} />
            </button>

            <div style={{ height: 280, position: 'relative' }}>
                <img src={selectedPartner.images[0]} alt={selectedPartner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: -30, left: 40, background: 'white', padding: 10, borderRadius: 12, boxShadow: 'var(--shadow-lg)' }}>
                    <img src={selectedPartner.logo} alt={selectedPartner.name} style={{ width: 80, height: 80, borderRadius: 8 }} />
                </div>
            </div>

            <div style={{ padding: '60px 40px 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                            {selectedPartner.name} {selectedPartner.verified && <CheckCircle2 color="var(--color-primary)" />}
                        </h2>
                        <div style={{ display: 'flex', gap: 16, color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={16} /> {selectedPartner.industry}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} /> {selectedPartner.location}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
                    <div>
                        <h4 style={{ fontWeight: 800, marginBottom: 12 }}>About Business</h4>
                        <p style={{ color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 24 }}>{selectedPartner.description}</p>
                        
                        <h4 style={{ fontWeight: 800, marginBottom: 12 }}>Product Specialization</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {selectedPartner.specialization.map(s => (
                                <span key={s} style={{ background: 'var(--color-bg-alt)', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem' }}>{s}</span>
                            ))}
                        </div>
                    </div>

                    <div style={{ background: '#f8faf8', padding: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <h4 style={{ fontWeight: 800, marginBottom: 20 }}>Contact Information</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Contact Person</div>
                                <div style={{ fontWeight: 700 }}>{selectedPartner.contact.name}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 4 }}>Business Email</div>
                                <div style={{ fontWeight: 700 }}>{selectedPartner.contact.email}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 4 }}>WhatsApp</div>
                                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{selectedPartner.contact.whatsapp}</div>
                            </div>
                        </div>
                        <a 
                            href={`https://wa.me/${selectedPartner.contact.whatsapp.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', marginTop: 24, gap: 8 }}
                        >
                            <Phone size={18} /> Connect on WhatsApp
                        </a>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-in { animation: modalIn 0.4s ease-out; }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Unlock Modal */}
      {showLogin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', 
          backdropFilter: 'blur(10px)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="animate-in" style={{
            background: 'white', maxWidth: 400, width: '100%', 
            borderRadius: 'var(--radius-lg)', padding: 40, position: 'relative',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => setShowLogin(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <Globe size={48} color="var(--color-primary)" style={{ marginBottom: 20 }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12 }}>Unlock Global Importers</h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: 32, fontSize: '0.9rem' }}>
              Enter your Paid Membership Code to access our full database of 30+ international importers.
            </p>

            <input 
              type="password"
              className="input"
              placeholder="Enter Access Code"
              style={{ marginBottom: 16, textAlign: 'center', fontSize: '1.1rem', letterSpacing: '4px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <button 
              onClick={handleUnlock}
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', height: 56 }}
            >
              Unlock Access
            </button>
            <p style={{ marginTop: 20, fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
              Contact support if you don't have a code.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
