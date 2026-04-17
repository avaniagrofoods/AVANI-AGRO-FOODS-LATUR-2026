import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe, Award, Users, TrendingUp, ArrowRight, Leaf, Package,
  Star, CheckCircle, Zap, Shield, BarChart3, ExternalLink
} from 'lucide-react'
import SEO from '../components/SEO'
import { CATALOG_LINK, WHATSAPP_NUMBER, AFFILIATE_LINKS, STRIPE_LINKS } from '../data/links'

const STATS = [
  { label: 'Export Countries', value: '25+', icon: Globe },
  { label: 'Affiliates Active', value: '120+', icon: Users },
  { label: 'Products', value: '2 Premium', icon: Package },
  { label: 'Revenue Goal', value: '₹1 Crore', icon: TrendingUp },
]

const PRODUCTS_PREVIEW = [
  {
    name: 'Moringa Powder',
    subtitle: 'Organic Export Grade A',
    desc: 'The #1 superfood globally — 7x Vitamin C, 4x Calcium. FSSAI/APEDA certified, heavy-metal tested.',
    img: '/moringa.png',
    tags: ['60-100 Mesh', '<7% Moisture', 'FSSAI Certified'],
    badge: '🌿 Bestseller',
    link: '/products'
  },
  {
    name: 'Red Onion Powder',
    subtitle: 'Dehydrated Export Grade',
    desc: 'Sharp & aromatic. Perfect for food manufacturers — 24 months shelf life, consistent pungency, no cold chain.',
    img: '/onion.png',
    tags: ['60-80 Mesh', 'HS 0712.20.00', 'EU Safe'],
    badge: '🧅 High Demand',
    link: '/products'
  }
]

const WHY_US = [
  { icon: Shield, title: 'Quality Certified', desc: 'FSSAI, APEDA, ISO compliant. NABL lab-tested with full CoA on every batch.' },
  { icon: Globe, title: 'Direct Export', desc: 'No middlemen. Farm to port. FOB/CIF quotes from Nhava Sheva & Chennai ports.' },
  { icon: Zap, title: 'Fast Turnaround', desc: 'Ready stock for samples. 14-21 day lead time for bulk orders.' },
  { icon: BarChart3, title: 'Affiliate Support', desc: '15-20% commissions on B2B referrals. Real-time tracking dashboard.' },
  { icon: Award, title: 'Premium Packaging', desc: 'Nitrogen-flushed bags. Custom white-label available. OEM accepted.' },
  { icon: Users, title: 'Dedicated Support', desc: 'WhatsApp + Email support. Pre-shipment samples always available.' },
]

const TESTIMONIALS = [
  { name: 'Ravi Patel', location: 'Dubai, UAE', role: 'Supplement Importer', text: 'Best quality moringa powder I\'ve sourced from India. CoA was perfect, delivery on time. Will order again.', rating: 5 },
  { name: 'Sarah Chen', location: 'Toronto, Canada', role: 'Health Store Owner', text: 'Avani Agro Foods is my go-to supplier. The moringa is vibrant green and the documentation is flawless.', rating: 5 },
  { name: 'Amrita Singh', location: 'Bangalore, India', role: 'Affiliate Partner', text: 'Earned ₹45,000 in my first 3 months with the affiliate program! Great support team.', rating: 5 },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState('Global')

  return (
    <>
      <SEO
        title="Premium Moringa & Onion Powder Exporter from India"
        description="Avani Agro Foods — India's premium Moringa Powder & Red Onion Powder exporter. FSSAI/APEDA certified. Export to USA, UK, UAE & 25+ countries. B2B, wholesale & affiliate program."
        keywords="moringa powder export india, red onion powder wholesale, moringa powder bulk buy, B2B agri export india, Latur Maharashtra export"
      />

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #f0fdf4 100%)',
        position: 'relative', overflow: 'hidden', paddingTop: 80
      }}>
        {/* Ambient blobs */}
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 30, padding: '6px 16px', marginBottom: 24 }}>
              <Globe size={14} color="var(--color-primary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-primary)' }}>Exporting from Latur, Maharashtra</span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.15, marginBottom: 24 }}>
              India's Finest
              <span style={{ display: 'block', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Moringa Powder</span>
              Global Export
            </h1>

            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-light)', lineHeight: 1.7, maxWidth: 500, marginBottom: 40 }}>
              Premium FSSAI & APEDA-certified Moringa Powder and Red Onion Powder — export-ready for USA, UK, UAE, and 25+ countries. Minimum 100 kg. Samples available.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I need a quote for Moringa Powder bulk order.')}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ gap: 8 }}>
                <Zap size={18} /> Get Bulk Quote
              </a>
              <a href={CATALOG_LINK} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', gap: 8 }}>
                <Package size={18} /> View Catalog
              </a>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              {['✅ FSSAI Certified', '✅ APEDA Registered', '✅ Lab Tested', '✅ Samples Available'].map(b => (
                <span key={b} style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-light)', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 30, padding: '5px 12px' }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {PRODUCTS_PREVIEW.map((p, i) => (
              <div key={p.name} style={{
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                background: 'white', border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-lg)',
                transform: i === 1 ? 'translateY(24px)' : 'translateY(-12px)',
                transition: 'transform 0.3s ease'
              }}>
                <div style={{ position: 'relative' }}>
                  <img src={p.img} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '0.65rem', fontWeight: 700, background: 'var(--color-accent)', color: 'white', borderRadius: 30, padding: '3px 10px' }}>{p.badge}</div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', marginBottom: 12 }}>{p.subtitle}</div>
                  {p.tags.map(t => (
                    <span key={t} style={{ display: 'inline-block', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(34,197,94,0.1)', color: 'var(--color-primary)', borderRadius: 30, padding: '2px 8px', marginRight: 4, marginBottom: 4 }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee bottom strip */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(34,197,94,0.05)', borderTop: '1px solid rgba(34,197,94,0.1)', padding: '10px 0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 48, animation: 'marquee 40s linear infinite', whiteSpace: 'nowrap' }}>
            {Array(3).fill(['🌿 MORINGA POWDER', '🧅 RED ONION POWDER', '🌍 25+ COUNTRIES', '✅ FSSAI CERTIFIED', '✈️ EXPORT READY', '📦 MOQ 100 KG', '💰 AFFILIATE 15-20%']).flat().map((t, i) => (
              <span key={i} style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--color-primary)' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--color-primary)', padding: '64px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {STATS.map(({ label, value, icon: Icon }) => (
              <div key={label} style={{ textAlign: 'center', padding: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Icon size={32} color="white" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section style={{ padding: '96px 0', background: 'white' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag"><Leaf size={12} /> Products</div>
            <h2 className="section-title">Export-Grade Products</h2>
            <p className="section-desc">Two premium agri products, globally certified, ready for B2B wholesale and export.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            {PRODUCTS_PREVIEW.map(p => (
              <div key={p.name} className="card card-hover" style={{ overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
                  <img src={p.img} alt={p.name} style={{ width: '100%', height: 220, objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--color-accent)', color: 'white', fontSize: '0.7rem', fontWeight: 800, borderRadius: 30, padding: '4px 12px' }}>{p.badge}</div>
                </div>
                <div style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 4 }}>{p.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 14 }}>{p.subtitle}</div>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 20 }}>{p.desc}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                    {p.tags.map(t => <span key={t} className="badge">{t}</span>)}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Link to={p.link} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>View Details</Link>
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I need pricing for ${p.name}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ flex: 1, justifyContent: 'center' }}>Get Quote</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/products" className="btn btn-primary" style={{ gap: 8 }}>View All Product Details <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* ── AFFILIATE LINKS ── */}
      <section style={{ padding: '96px 0', background: 'var(--color-bg-alt)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-accent)', border: '1px solid rgba(239,68,68,0.2)' }}>Global Affiliate Program</div>
            <h2 className="section-title">Shop Our Partner Products</h2>
            <p className="section-desc">Discover top-rated Moringa products on Amazon and iHerb. Hand-picked for quality & authenticity.</p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
            {['Global', 'India'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className="btn" style={{
                background: activeTab === t ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
                color: 'white'
              }}>{t === 'Global' ? '🌍 Global Buyers' : '🇮🇳 India Buyers'}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {activeTab === 'Global' ? (
              <>
                {[AFFILIATE_LINKS.AMAZON.GLOBAL, AFFILIATE_LINKS.AMAZON.KULI_KULI, AFFILIATE_LINKS.IHERB.US].map(link => (
                  <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', textDecoration: 'none',
                    background: 'white', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', padding: '24px', transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-primary)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 30 }}>{link.platform}</span>
                      <ExternalLink size={14} color="var(--color-text-light)" />
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>{link.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 14 }}>{link.market} — Commission: {link.commission}</div>
                    <div className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem' }}>
                      Shop Now <ExternalLink size={14} />
                    </div>
                  </a>
                ))}
              </>
            ) : (
              <>
                {[AFFILIATE_LINKS.AMAZON.ORGANIC_INDIA, AFFILIATE_LINKS.AMAZON.HIMALAYAN_ORGANICS, AFFILIATE_LINKS.IHERB.INDIA].map(link => (
                  <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', textDecoration: 'none',
                    background: 'white', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', padding: '24px', transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-primary)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 30 }}>{link.platform}</span>
                      <ExternalLink size={14} color="var(--color-text-light)" />
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>{link.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: 14 }}>{link.market} — Commission: {link.commission}</div>
                    <div className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem' }}>
                      Shop Now <ExternalLink size={14} />
                    </div>
                  </a>
                ))}
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/affiliate" className="btn" style={{ background: 'var(--color-accent)', color: 'white', gap: 8 }}>
              Become an Affiliate Partner <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section style={{ padding: '96px 0', background: 'white' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Why Avani Agro Foods</div>
            <h2 className="section-title">Your Trusted Export Partner</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {WHY_US.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card card-hover" style={{ padding: '32px 28px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={24} color="var(--color-primary)" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 10 }}>{title}</h3>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '96px 0', background: 'white' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Testimonials</div>
            <h2 className="section-title">Trusted by Partners Globally</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card" style={{ padding: '32px 28px' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {Array(t.rating).fill(0).map((_, i) => <Star key={i} size={16} fill="#e6a817" color="#e6a817" />)}
                </div>
                <p style={{ color: 'var(--color-text)', fontSize: '0.95rem', lineHeight: 1.75, fontStyle: 'italic', marginBottom: 24 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '1.1rem' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{t.role} — {t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>
            Ready to Start Your Export Journey?
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', maxWidth: 600, margin: '0 auto 40px' }}>
            Request a free sample, get a wholesale price list, or join our affiliate program today.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-primary" style={{ background: 'var(--color-accent)', gap: 8 }}>
              <CheckCircle size={18} /> Request Quote
            </Link>
            <Link to="/affiliate" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', gap: 8 }}>
              <Users size={18} /> Affiliate Program
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (max-width: 1023px) {
          .container > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}
