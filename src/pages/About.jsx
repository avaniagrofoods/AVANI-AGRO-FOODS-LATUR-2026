import SEO from '../components/SEO'
import { WHATSAPP_NUMBER, CATALOG_LINK } from '../data/links'
import { Globe, Award, Target, Leaf, MapPin, Phone, Mail, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const TIMELINE = [
  { year: '2024', event: 'Avani Agro Foods founded in Latur, Maharashtra' },
  { year: '2025', event: 'First export shipment to UAE; FSSAI & APEDA registration' },
  { year: '2025', event: 'Moringa Powder & Red Onion Powder product lines established' },
  { year: '2026', event: 'Affiliate program launched; B2B export scaling begins' },
  { year: '2026', event: 'Target: ₹1 Crore revenue — 25+ export countries' },
]

const VALUES = [
  { icon: Award, title: 'Quality First', desc: 'Every batch is NABL lab tested. We never compromise on quality.' },
  { icon: Globe, title: 'Export Excellence', desc: 'We understand international standards — EU, US, UAE compliance built in.' },
  { icon: Target, title: 'Transparent Business', desc: 'Fair pricing, honest communication, and complete documentation always.' },
  { icon: Leaf, title: 'Sustainable Sourcing', desc: 'Directly sourced from Maharashtra farms with ethical procurement practices.' },
]

export default function About() {
  return (
    <>
      <SEO
        title="About Avani Agro Foods — Sachin Shinde, Latur"
        description="About Avani Agro Foods — export company based in Latur, Maharashtra. Owner Sachin Shinde. Specializing in Moringa Powder and Red Onion Powder export globally."
        keywords="avani agro foods about, sachin shinde latur, moringa exporter maharashtra, latur agri export"
      />

      <div className="page-top">
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '96px 0' }}>
          <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 20 }}>
                🌿 Our Story
              </div>
              <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 24 }}>Building India's Premier Agri-Export Brand</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 32 }}>
                Avani Agro Foods was born in Latur, Maharashtra — the heartland of Indian agriculture. Founded by <strong style={{ color: 'white' }}>Sachin Shinde</strong>, we started with a mission to bring the health power of Moringa and the culinary magic of Red Onion Powder to the world.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">📱 Connect with Sachin</a>
                <a href={CATALOG_LINK} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>📄 Our Catalog</a>
              </div>
            </div>
            <div>
              <div className="card" style={{ padding: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, #e6a817, #f99f1f)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, fontSize: '2.5rem' }}>
                  👨‍💼
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: 8 }}>Sachin Shinde</h2>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>Founder & Export Director — Avani Agro Foods</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: MapPin, text: 'Latur, Maharashtra, India' },
                    { icon: Phone, text: '+91 7219053645' },
                    { icon: Mail, text: 'avaniagrofoods1356@gmail.com' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      <Icon size={15} color="#e6a817" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission */}
        <div style={{ padding: '96px 0', background: 'white' }}>
          <div className="container">
            <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: 72 }}>
              <div className="section-tag" style={{ justifyContent: 'center' }}>Our Mission</div>
              <h2 className="section-title">₹0 → ₹1 Crore in 12 Months</h2>
              <p className="section-desc" style={{ fontSize: '1.05rem' }}>
                Our 12-month roadmap is to build India's most trusted small-scale agri-export brand by combining the power of direct B2B exports, affiliate marketing, and digital presence. Moringa Powder is our hero product — a global superfood with $10 billion market potential.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
              {VALUES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card card-hover" style={{ padding: '32px', textAlign: 'center' }}>
                  <Icon size={40} color="var(--color-primary)" style={{ margin: '0 auto 20px' }} />
                  <h3 style={{ fontWeight: 900, marginBottom: 10 }}>{title}</h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ padding: '96px 0', background: '#f8faf8' }}>
          <div className="container">
            <div className="section-header">
              <div className="section-tag">Growth Timeline</div>
              <h2 className="section-title">Our Journey</h2>
            </div>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              {TIMELINE.map((t, i) => (
                <div key={t.year + i} style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', color: 'white', flexShrink: 0 }}>{t.year}</div>
                    {i < TIMELINE.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--color-border)', marginTop: 8 }} />}
                  </div>
                  <div className="card" style={{ flex: 1, padding: '20px 24px', marginBottom: i < TIMELINE.length - 1 ? 8 : 0 }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.7 }}>{t.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div style={{ padding: '72px 0', background: 'white' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="section-tag" style={{ justifyContent: 'center' }}>Certifications</div>
            <h2 className="section-title">Trusted, Certified, Compliant</h2>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40 }}>
              {['🏅 FSSAI Registered', '🌾 APEDA Member', '📋 IEC Holder', '✅ ISO Compliant', '🌿 HACCP Standards'].map(cert => (
                <div key={cert} className="card" style={{ padding: '20px 32px', fontSize: '1rem', fontWeight: 700 }}>{cert}</div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '80px 0', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>Partner With Us</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }}>Whether you're a buyer, importer, affiliate, or collaborator — we'd love to connect.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-primary" style={{ background: 'var(--color-accent)' }}>Send Inquiry <ArrowRight size={16} /></Link>
              <Link to="/affiliate" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>Affiliate Program</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
