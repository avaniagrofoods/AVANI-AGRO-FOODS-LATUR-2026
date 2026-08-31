import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Globe, Leaf, Shield, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react'
import { BUSINESS_INFO } from '../data/links'
import { useLanguage } from '../context/LanguageContext'

export default function Footer() {
  const { t, isRTL } = useLanguage()
  const year = new Date().getFullYear()
  const { address, phone, email, whatsapp } = BUSINESS_INFO

  return (
    <footer className="footer" style={{ background: '#0a1f0d', color: 'rgba(255,255,255,0.85)', paddingTop: 64, paddingBottom: 32 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 48 }}>

          {/* Brand & Sourcing Profile Column */}
          <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
              <img src="/logo.png" alt="AVANI AGRO FOODS" style={{ height: 44, width: 44, objectFit: 'contain', borderRadius: 8, background: 'white', padding: 2 }} onError={e => e.target.style.display = 'none'} />
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'white' }}>AVANI AGRO FOODS</div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>Indian Agro Export Coordination</div>
              </div>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 20 }}>
              Indian agricultural export coordination and B2B sourcing business. Connecting international importers and food processors with vetted Indian processing partners.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem' }}>
              <div style={{ color: 'var(--color-accent)', fontWeight: 700 }}>
                Sachin Shinde — Trade Coordinator
              </div>
              <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)' }}>
                <Mail size={14} color="var(--color-accent)" /> {email}
              </a>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)' }}>
                <Phone size={14} color="var(--color-accent)" /> {phone}
              </a>
              <address style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'rgba(255,255,255,0.7)', fontStyle: 'normal', lineHeight: 1.5 }}>
                <MapPin size={14} color="var(--color-accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{address.full}</span>
              </address>
            </div>
          </div>

          {/* Core B2B Navigation */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 18 }}>
              Quick Links
            </h4>
            <nav className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
              <Link to="/">Home</Link>
              <Link to="/about">About AVANI AGRO</Link>
              <Link to="/products">Export Products</Link>
              <Link to="/catalog">Digital Catalog</Link>
              <Link to="/trade-coordination">Trade Coordination</Link>
              <Link to="/export-process">6-Stage Process</Link>
              <Link to="/export-compliance">35-Market Guide</Link>
              <Link to="/resources">Resources</Link>
              <Link to="/contact">Request a B2B Quote</Link>
            </nav>
          </div>

          {/* Educational Resources & Blog */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 18 }}>
              Guides &amp; Articles
            </h4>
            <nav className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
              <Link to="/blog">All 15+ Trade Articles</Link>
              <Link to="/catalog/moringa-powder">Moringa Specifications</Link>
              <Link to="/catalog/red-onion-powder">Red Onion Specifications</Link>
              <Link to="/manufacturer-requirements">Manufacturer Checklist</Link>
              <Link to="/b2b">B2B Directory</Link>
            </nav>
            <div style={{ marginTop: 20, padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              *AVANI AGRO FOODS coordinates sourcing with independent Indian processors and facilities.
            </div>
          </div>

          {/* Legal & Compliance Profile */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 18 }}>
              Legal &amp; Transparency
            </h4>
            <nav className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms">Terms &amp; Conditions</Link>
              <Link to="/disclaimer">Disclaimer</Link>
              <Link to="/affiliate-disclosure">Affiliate Disclosure</Link>
              <Link to="/private" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>🔒 Business Portal</Link>
            </nav>

            <div style={{ marginTop: 20, padding: '16px', background: 'rgba(26,77,46,0.3)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(26,77,46,0.5)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 6 }}>Verified Registration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                <span>• Udyam / MSME Registered Firm</span>
                <span>• Batch Laboratory COA Verification</span>
                <span>• Sourced via Qualified Partner Units</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Disclosure Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          <div>
            © {year} AVANI AGRO FOODS. Trade Coordinator: Sachin Shinde. Latur, Maharashtra, India.
          </div>
          <div>
            <Link to="/affiliate-disclosure" style={{ color: 'var(--color-accent)' }}>Affiliate &amp; Editorial Disclosure</Link>
          </div>
          <div>
            Indian Agricultural Export Coordination 🌍
          </div>
        </div>
      </div>
    </footer>
  )
}
