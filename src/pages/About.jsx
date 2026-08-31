import SEO from '../components/SEO'
import { BUSINESS_INFO, WHATSAPP_NUMBER, CATALOG_LINK } from '../data/links'
import { Globe, Award, Target, Leaf, MapPin, Phone, Mail, ArrowRight, Shield, CheckCircle2, Building2, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'

const SOURCING_VALUES = [
  {
    icon: Shield,
    title: 'Batch Quality & COA Verification',
    desc: 'Every production lot is coordinated with certified laboratory test reports (COA) verifying moisture, mesh size, microbiological parameters, and heavy metal limits.'
  },
  {
    icon: Globe,
    title: 'Export Compliance & Documentation',
    desc: 'We coordinate end-to-end commercial and regulatory export documents — including Invoices, Packing Lists, Certificates of Origin, and Phytosanitary certificates.'
  },
  {
    icon: Target,
    title: 'Transparent Sourcing Model',
    desc: 'We operate as an open, merchant sourcing firm connecting international buyers directly with qualified Indian agricultural processors with clear commercial terms.'
  },
  {
    icon: Leaf,
    title: 'Regional Agricultural Roots',
    desc: 'Headquartered in Latur, Maharashtra, we leverage direct proximity to major regional agricultural growing belts for Moringa oleifera and Indian red onions.'
  }
]

export default function About() {
  return (
    <>
      <SEO
        title="About AVANI AGRO FOODS — Sourcing Coordination, Latur, India"
        description="Learn about AVANI AGRO FOODS, an Indian agricultural export coordination and B2B sourcing business founded by Sachin Shinde in Latur, Maharashtra. Focused on Moringa Powder & Red Onion Powder."
        keywords="about avani agro foods, sachin shinde latur, moringa sourcing india, agricultural export coordination maharashtra, latur agro trade"
      />

      <div className="page-top">
        {/* Hero Section */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '96px 0', color: 'white' }}>
          <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 48, alignItems: 'center' }}>
            <div>
              <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 20 }}>
                🌿 Indian Agricultural Sourcing
              </div>
              <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 24 }}>
                Bridging Indian Agricultural Processors &amp; Global B2B Buyers
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 32 }}>
                <strong>AVANI AGRO FOODS</strong> is an Indian agricultural export coordination and B2B sourcing firm based in Latur, Maharashtra. Founded by <strong>Sachin Shinde</strong>, we specialize in coordinating the procurement, quality testing verification, and export logistics of premium <strong>Moringa Powder</strong> and <strong>Red Onion Powder</strong> from vetted Indian processing partners for international commercial buyers.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/contact" className="btn btn-primary" style={{ background: 'var(--color-accent)' }}>
                  Request B2B Sourcing Quote
                </Link>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
                  Connect on WhatsApp
                </a>
              </div>
            </div>

            {/* Founder Profile Card */}
            <div>
              <div className="card" style={{ padding: '36px 28px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo.png" alt="AVANI AGRO FOODS" style={{ height: 80, width: 80, objectFit: 'contain', borderRadius: '50%', background: 'white', padding: 4 }} />
                  <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'white', overflow: 'hidden', border: '3px solid #e6a817' }}>
                    <img src="/sachin.png" alt="Sachin Shinde" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: 4, textAlign: 'center' }}>
                  Sachin Shinde
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#e6a817', marginBottom: 20, textAlign: 'center', fontWeight: 700 }}>
                  Founder &amp; Managing Director — AVANI AGRO FOODS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <MapPin size={16} color="#e6a817" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{BUSINESS_INFO.address.full}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Phone size={16} color="#e6a817" style={{ flexShrink: 0 }} />
                    <span>{BUSINESS_INFO.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Mail size={16} color="#e6a817" style={{ flexShrink: 0 }} />
                    <span>{BUSINESS_INFO.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Model Explanation */}
        <div style={{ padding: '80px 0', background: 'white' }}>
          <div className="container">
            <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center', marginBottom: 56 }}>
              <div className="section-tag" style={{ justifyContent: 'center' }}>Our Business Model</div>
              <h2 className="section-title">Transparent Merchant Sourcing &amp; Quality Oversight</h2>
              <p className="section-desc">
                AVANI AGRO FOODS operates as an agricultural sourcing coordinator. Rather than operating our own single processing plant, we collaborate with vetted Indian manufacturing and dehydration facilities across Maharashtra and western India.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {SOURCING_VALUES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card card-hover" style={{ padding: '32px 24px', textAlign: 'left' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={22} color="var(--color-primary)" />
                  </div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.08rem', marginBottom: 10, color: 'var(--color-text)' }}>{title}</h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Processing Infrastructure Gallery in Partner Network */}
        <div style={{ padding: '80px 0', background: 'var(--color-bg-alt)' }}>
          <div className="container">
            <div className="section-header" style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 48px' }}>
              <div className="section-tag" style={{ justifyContent: 'center' }}>Supplier Network</div>
              <h2 className="section-title">Partner Processing &amp; Quality Standards</h2>
              <p className="section-desc">
                Representative stages of dehydration, pulverization, testing, and export packaging utilized across our Indian processing partner network.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
              {[
                { url: '/gallery/processing.png', title: 'Controlled Drying & Milling Facilities' },
                { url: '/gallery/packaging.png', title: 'Export-Grade Barrier Drum Packaging' },
                { url: '/gallery/quality.webp', title: 'Accredited Batch Laboratory Testing' },
                { url: '/gallery/research.webp', title: 'Product Specification & COA Review' },
              ].map((img, i) => (
                <div key={i} className="card card-hover" style={{ overflow: 'hidden', padding: 0, background: 'white' }}>
                  <img src={img.url} alt={img.title} style={{ width: '100%', height: 220, objectFit: 'cover' }} />
                  <div style={{ padding: '16px', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center', color: 'var(--color-text)' }}>
                    {img.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Clear Separation of Business Channels */}
        <div style={{ padding: '80px 0', background: 'white' }}>
          <div className="container">
            <div style={{ maxWidth: 840, margin: '0 auto' }}>
              <div className="section-tag" style={{ justifyContent: 'center', display: 'flex', margin: '0 auto 16px' }}>Business Architecture</div>
              <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 24 }}>Two Distinct Operating Channels</h2>
              <p style={{ color: 'var(--color-text-light)', textAlign: 'center', lineHeight: 1.7, marginBottom: 40 }}>
                To maintain strict transparency with clients, partners, and affiliate networks, AVANI AGRO FOODS operates two clearly delineated channels:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                <div className="card" style={{ padding: '32px', borderLeft: '4px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Building2 size={22} color="var(--color-primary)" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Core B2B Agricultural Sourcing</h3>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.7, marginBottom: 16 }}>
                    Commercial coordination of Moringa Powder and Red Onion Powder for overseas importers, wholesale distributors, and food processors. Involves formal RFQs, custom packaging, lab COA verification, and Incoterm logistics (FOB / CIF).
                  </p>
                  <Link to="/products" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    View B2B Products →
                  </Link>
                </div>

                <div className="card" style={{ padding: '32px', borderLeft: '4px solid #e6a817' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Leaf size={22} color="#b45309" />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Educational Resources &amp; Reviews</h3>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.7, marginBottom: 16 }}>
                    Independent publishing channel providing educational guides, industry articles, and third-party product recommendations (Amazon, iHerb, equipment brands). Full FTC affiliate disclosures apply.
                  </p>
                  <Link to="/resources" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309' }}>
                    View Recommended Resources →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Registration & Compliance Statement */}
        <div style={{ padding: '72px 0', background: 'var(--color-bg-alt)' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: 800 }}>
            <div className="section-tag" style={{ justifyContent: 'center' }}>Official Compliance</div>
            <h2 className="section-title">Registration &amp; Standards</h2>
            <p style={{ color: 'var(--color-text-light)', margin: '0 auto 32px', fontSize: '0.92rem', lineHeight: 1.7 }}>
              AVANI AGRO FOODS is registered under the Ministry of Micro, Small and Medium Enterprises (Udyam / MSME). Sourced batches are produced in facilities adhering to Indian and international food safety standards, with required COA, Phytosanitary, and destination regulatory documentation coordinated per shipment.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div className="card" style={{ padding: '16px 24px', fontSize: '0.9rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--color-primary)" /> Udyam / MSME Registered
              </div>
              <div className="card" style={{ padding: '16px 24px', fontSize: '0.9rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--color-primary)" /> Batch Lab COA Verification
              </div>
              <div className="card" style={{ padding: '16px 24px', fontSize: '0.9rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--color-primary)" /> Phytosanitary Support
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '80px 0', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: 'white', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>
              Connect with AVANI AGRO FOODS
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 32, maxWidth: 520, margin: '0 auto 32px' }}>
              Let us know your product specification, volume, and destination requirements for a formal proforma quotation.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-primary" style={{ background: 'var(--color-accent)', padding: '12px 28px' }}>
                Submit B2B RFQ Inquiry <ArrowRight size={16} />
              </Link>
              <Link to="/products" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', padding: '12px 24px' }}>
                Explore Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
