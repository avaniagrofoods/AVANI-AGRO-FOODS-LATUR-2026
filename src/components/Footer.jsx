import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Globe, Leaf, Shield, FileText, ExternalLink } from 'lucide-react'
import { CATALOG_LINK, WHATSAPP_NUMBER, OWNER_EMAIL } from '../data/links'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
          
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img src="/logo.jpeg" alt="Logo" style={{ height: 44, width: 44, objectFit: 'contain', borderRadius: 8 }} onError={e => e.target.style.display='none'} />
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'white' }}>AVANI AGRO FOODS</div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>Export · Affiliate · B2B</div>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', opacity: 0.65, lineHeight: 1.7, marginBottom: 20 }}>
              Premium Moringa Powder &amp; Red Onion Powder exporter from Latur, Maharashtra, India. Certified quality for global markets.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={`mailto:${OWNER_EMAIL}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
                <Mail size={14} color="var(--color-accent)" /> {OWNER_EMAIL}
              </a>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
                <Phone size={14} color="var(--color-accent)" /> +91 7219053645
              </a>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)' }}>
                <MapPin size={14} color="var(--color-accent)" /> Latur, Maharashtra, India
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 20 }}>Quick Links</h4>
            <nav className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/">Home</Link>
              <Link to="/about">About Avani Agro</Link>
              <Link to="/products">Products</Link>
              <Link to="/blog">Export & Health Blog</Link>
              <Link to="/affiliate">Affiliate Program</Link>
              <Link to="/b2b-store">B2B Store</Link>
              <Link to="/contact">Contact & Inquiry</Link>
              <a href={CATALOG_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                📄 Product Catalog <ExternalLink size={12} />
              </a>
            </nav>
          </div>

          {/* Trade Directory */}
          <div>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 20 }}>Trade Directory</h4>
            <nav className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/manufacturers">Indian Manufacturers DB</Link>
              <Link to="/importers">Global Importers DB</Link>
              <Link to="/affiliate/dashboard">Affiliate Dashboard</Link>
            </nav>
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 16 }}>Products</h4>
              <nav className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/products">🌿 Moringa Powder</Link>
                <Link to="/products">🧅 Red Onion Powder</Link>
              </nav>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 20 }}>Legal</h4>
            <nav className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link to="/privacy"><Shield size={13} style={{ display: 'inline', marginRight: 6 }} />Privacy Policy</Link>
              <Link to="/disclaimer"><FileText size={13} style={{ display: 'inline', marginRight: 6 }} />Medical Disclaimer</Link>
              <Link to="/affiliate-disclaimer"><Leaf size={13} style={{ display: 'inline', marginRight: 6 }} />Affiliate Disclosure</Link>
            </nav>

            <div style={{ marginTop: 28, padding: '20px', background: 'rgba(230,168,23,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(230,168,23,0.2)' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: 8 }}>Certifications</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.75rem', opacity: 0.8 }}>
                <span>✅ FSSAI Registered</span>
                <span>✅ APEDA Member</span>
                <span>✅ IEC Holder</span>
                <span>✅ ISO Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <span>© {year} Avani Agro Foods, Latur, Maharashtra, India. Owner: Sachin Shinde.</span>
          <span>*Affiliate links on this site earn commissions. <Link to="/affiliate-disclaimer" style={{ color: 'var(--color-accent)' }}>See disclosure.</Link></span>
          <span>Built for Global Export Excellence 🌍</span>
        </div>
      </div>
    </footer>
  )
}
