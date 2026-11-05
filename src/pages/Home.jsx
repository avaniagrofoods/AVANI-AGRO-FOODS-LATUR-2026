import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe, Package, ArrowRight, Leaf, Shield,
  CheckCircle2, FileText, Send, HelpCircle,
  Truck, Award, Building2, FlaskConical
} from 'lucide-react'
import SEO from '../components/SEO'
import { BUSINESS_INFO } from '../data/links'
import { useLanguage } from '../context/LanguageContext'

const STATS = [
  { label: 'Core Export Products', value: 'Moringa & Onion', desc: 'Botanical & Dehydrated Powders', icon: Package },
  { label: 'Sourcing Hub', value: 'Latur, Maharashtra', desc: 'Agricultural Production Belt', icon: Building2 },
  { label: 'Business Model', value: 'B2B Sourcing', desc: 'Indian Export Coordination', icon: Globe },
  { label: 'Quality Standard', value: 'COA & Lab Reports', desc: 'Tested per Buyer Specs', icon: FlaskConical },
]

const PRODUCTS_PREVIEW = [
  {
    id: 'moringa',
    name: 'Moringa Powder',
    subtitle: 'Moringa oleifera Leaf Powder — Export Grade',
    desc: 'Pure dried Moringa oleifera leaf powder sourced from verified processing partners in Maharashtra. Rich in plant protein, polyphenols, and chlorophyll. Coordinated with batch testing reports.',
    img: '/moringa.png',
    hsCode: 'HS 1211.90.29',
    tags: ['80–100 Mesh', '≤ 7% Moisture', 'Batch COA', '25 kg Drums / Bags'],
    badge: '🌿 Key Botanical',
    link: '/products#moringa'
  },
  {
    id: 'onion',
    name: 'Red Onion Powder',
    subtitle: 'Dehydrated Indian Red Onion Powder',
    desc: 'Dehydrated red onion powder engineered for commercial food manufacturing, seasonings, and sauce formulations. 1 kg powder replaces 10–12 kg fresh bulbs without refrigeration.',
    img: '/onion.png',
    hsCode: 'HS 0712.20.00',
    tags: ['60–80 Mesh', '≤ 6% Moisture', 'High Pungency', '20/25 kg Cartons'],
    badge: '🧅 Food Grade Ingredient',
    link: '/products#onion'
  }
]

const SOURCING_STEPS = [
  {
    step: '01',
    title: 'Requirement & RFQ',
    desc: 'Buyer submits product specification, required volume, target destination port, and delivery timeline.',
    icon: FileText
  },
  {
    step: '02',
    title: 'Supplier & Lot Matching',
    desc: 'We match requirements with qualified Indian manufacturing and processing partners equipped with compliant facilities.',
    icon: Building2
  },
  {
    step: '03',
    title: 'Specification & Lab Review',
    desc: 'Batch samples and third-party laboratory analysis (COA, micro, heavy metals, moisture) are validated against buyer standards.',
    icon: FlaskConical
  },
  {
    step: '04',
    title: 'Commercial Terms & Proforma',
    desc: 'Formal proforma quotation issued detailing Incoterms (FOB Nhava Sheva / CIF), payment structure, and packaging formats.',
    icon: Shield
  },
  {
    step: '05',
    title: 'Documentation Coordination',
    desc: 'Commercial Invoices, Packing Lists, Certificates of Origin, and Phytosanitary documentation prepared for customs clearance.',
    icon: Award
  },
  {
    step: '06',
    title: 'Port Logistics & Dispatch',
    desc: 'Coordinated transportation to JNPT / Nhava Sheva Seaport or Mumbai Air Cargo with container tracking updates.',
    icon: Truck
  }
]

const FAQS = [
  {
    q: 'What is the core business of AVANI AGRO FOODS?',
    a: 'AVANI AGRO FOODS operates as an Indian agricultural export coordination and B2B merchant sourcing firm based in Latur, Maharashtra. We coordinate the sourcing, lab testing verification, export documentation, and logistics of Moringa Powder and Red Onion Powder from vetted Indian processors for international B2B buyers.'
  },
  {
    q: 'Can you provide pre-shipment product samples and lab test reports?',
    a: 'Yes. Commercial product samples (100g–250g) and recent batch Certificates of Analysis (COA covering microbiological parameters, moisture, and heavy metals) can be coordinated for verified buyers prior to bulk contract confirmation.'
  },
  {
    q: 'What are your standard Minimum Order Quantities (MOQs)?',
    a: 'Our standard baseline MOQ is 100 kg for trial air or LCL consignments, with full container load (FCL) coordination available for large commercial buyers seeking maximum freight efficiency.'
  },
  {
    q: 'What Incoterms and payment terms are supported?',
    a: 'We coordinate FOB shipments (primarily from Nhava Sheva / JNPT Port, Mumbai) as well as CIF terms to your designated port of entry. Standard commercial payments utilize advance TT with balance against B/L or Irrevocable Letters of Credit (L/C) for qualifying high-volume orders.'
  },
  {
    q: 'How does AVANI AGRO FOODS coordinate with Indian processing facilities?',
    a: 'We partner directly with vetted agricultural processors and dehydrators in Maharashtra and South India. We audit facility compliance, inspect pre-shipment batches, arrange independent third-party laboratory testing (heavy metals, microbiological, pesticide residues), oversee compliant export packaging, and handle export documentation directly to Nhava Sheva / JNPT port.'
  }
]

export default function Home() {
  const { t, isRTL } = useLanguage()
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <>
      <SEO
        title="Indian Agricultural Ingredients for Global B2B Buyers | AVANI AGRO FOODS"
        description="AVANI AGRO FOODS coordinates sourcing of export-grade Moringa Powder and Red Onion Powder from qualified Indian processors for international importers and food manufacturers. FOB/CIF quotations available."
        keywords="moringa powder export india, red onion powder wholesale, agricultural sourcing india, moringa leaf powder supplier, B2B food ingredients india, latur agricultural export"
      />

      {/* ── HERO SECTION ── */}
      <section style={{
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f7faf7 0%, #ffffff 50%, #f0f6f1 100%)',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 100,
        paddingBottom: 60
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: 56,
            alignItems: 'center',
            direction: isRTL ? 'rtl' : 'ltr'
          }}>
            
            {/* Hero Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              style={{ textAlign: isRTL ? 'right' : 'left' }}
            >
              {/* Location Tag */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(26,77,46,0.08)',
                border: '1px solid rgba(26,77,46,0.2)',
                borderRadius: 30,
                padding: '6px 16px',
                marginBottom: 20
              }}>
                <Globe size={14} color="var(--color-primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)' }}>
                  Indian Export Sourcing &amp; Coordination
                </span>
              </div>

              {/* Main Headline */}
              <h1 style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
                fontWeight: 900,
                color: 'var(--color-text)',
                lineHeight: 1.18,
                marginBottom: 20
              }}>
                Indian Agricultural Ingredients for{' '}
                <span style={{
                  background: 'linear-gradient(135deg, var(--color-primary), #2d8f5c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>
                  Global B2B Buyers
                </span>
              </h1>

              {/* Factual Subheadline */}
              <p style={{
                fontSize: '1.08rem',
                color: 'var(--color-text-light)',
                lineHeight: 1.7,
                maxWidth: 560,
                marginBottom: 32
              }}>
                <strong>AVANI AGRO FOODS</strong> coordinates sourcing of export-grade <strong>Moringa Powder</strong> and <strong>Red Onion Powder</strong> from qualified Indian manufacturing and processing partners for importers, distributors, food businesses, and ingredient buyers worldwide.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
                <Link to="/contact" className="btn btn-primary" style={{ gap: 8, padding: '14px 28px', fontSize: '0.95rem' }}>
                  <Send size={16} /> Request a B2B Quote
                </Link>
                <Link to="/products" className="btn" style={{ background: 'white', color: 'var(--color-text)', border: '1px solid var(--color-border)', gap: 8, padding: '14px 24px', fontSize: '0.95rem' }}>
                  <Package size={16} /> Explore Products
                </Link>
                <Link to="/export-process" className="btn" style={{ background: 'transparent', color: 'var(--color-primary)', border: '1px dashed var(--color-primary)', gap: 6, padding: '14px 20px', fontSize: '0.9rem' }}>
                  Sourcing Process <ArrowRight size={14} />
                </Link>
              </div>

              {/* Factual Verification Badges */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', background: 'white', border: '1px solid var(--color-border)', borderRadius: 20, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="var(--color-primary)" /> Sourcing Hub: Latur, Maharashtra
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', background: 'white', border: '1px solid var(--color-border)', borderRadius: 20, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="var(--color-primary)" /> Udyam / MSME Registered
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', background: 'white', border: '1px solid var(--color-border)', borderRadius: 20, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="var(--color-primary)" /> Batch Lab COA Verification
                </span>
              </div>
            </motion.div>

            {/* Hero Right Visual: Two Key Sourced Products */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            >
              {PRODUCTS_PREVIEW.map((p) => (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    background: 'white',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div style={{ position: 'relative', height: 160, overflow: 'hidden', background: '#f4f6f4' }}>
                    <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: 'rgba(26,77,46,0.9)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      borderRadius: 20,
                      padding: '3px 10px',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {p.badge}
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
                      {p.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 8 }}>
                      {p.hsCode}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                      {p.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{ fontSize: '0.68rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          • {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={p.link}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        padding: '8px 12px',
                        background: 'var(--color-bg-alt)',
                        borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none'
                      }}
                    >
                      View Sourcing Specs →
                    </Link>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: 'var(--color-primary)', padding: '48px 0', color: 'white' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24
          }}>
            {STATS.map(({ label, value, desc, icon: Icon }) => (
              <div key={label} style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}>
                <Icon size={24} color="#e6a817" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'white', marginBottom: 4 }}>
                  {value}
                </div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)' }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOURCING & EXPORT WORKFLOW (TRUST ARCHITECTURE) ── */}
      <section style={{ padding: '96px 0', background: 'white' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
            <div className="section-tag" style={{ justifyContent: 'center' }}>
              <Shield size={12} /> Transparent Coordination
            </div>
            <h2 className="section-title">How We Coordinate Agricultural Sourcing</h2>
            <p className="section-desc">
              A structured 6-stage trade workflow designed to provide overseas buyers with consistent product quality, verified laboratory testing, and seamless export logistics from India.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24
          }}>
            {SOURCING_STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.step}
                  className="card card-hover"
                  style={{
                    padding: '32px 24px',
                    position: 'relative',
                    borderLeft: '4px solid var(--color-primary)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16
                  }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'rgba(26,77,46,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={20} color="var(--color-primary)" />
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'rgba(26,77,46,0.25)' }}>
                      {step.step}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 10, color: 'var(--color-text)' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.65, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              )
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/export-process" className="btn btn-primary" style={{ gap: 8 }}>
              Learn Detailed Export Process <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS SECTION ── */}
      <section style={{ padding: '96px 0', background: 'var(--color-bg-alt)' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
            <div className="section-tag" style={{ justifyContent: 'center' }}>
              <Leaf size={12} /> Export Products
            </div>
            <h2 className="section-title">Moringa Powder &amp; Red Onion Powder</h2>
            <p className="section-desc">
              Sourced from qualified Indian partner facilities, packaged in export-ready barrier containers, and tested to meet international standards.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: 32
          }}>
            {/* Product 1: Moringa */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
                <img src="/moringa.png" alt="Moringa Powder Bulk Export" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>
                  HS Code: 1211.90.29
                </div>
              </div>
              <div style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 6 }}>
                  Moringa Powder (Moringa oleifera)
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 16 }}>
                  Export-Grade Botanical Leaf Powder
                </div>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 20 }}>
                  Carefully shade-dried, fine-milled leaf powder sourced from Maharashtra farms. Rich in natural chlorophyll, amino acids, and plant minerals. Widely utilized in dietary supplements, green blends, and functional foods.
                </p>

                <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: 24, fontSize: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><strong>Mesh Size:</strong> 80–100 Mesh</div>
                    <div><strong>Moisture:</strong> ≤ 7.0%</div>
                    <div><strong>MOQ:</strong> 100 kg</div>
                    <div><strong>Packaging:</strong> 25 kg Drums / Bags</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Link to="/products#moringa" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Full Sourcing Specs
                  </Link>
                  <Link to="/contact" className="btn" style={{ flex: 1, justifyContent: 'center', background: 'white', border: '1px solid var(--color-border)' }}>
                    Request RFQ Quote
                  </Link>
                </div>
              </div>
            </div>

            {/* Product 2: Red Onion */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden' }}>
                <img src="/onion.png" alt="Dehydrated Red Onion Powder Export" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 16, left: 16, background: '#a82c2c', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20 }}>
                  HS Code: 0712.20.00
                </div>
              </div>
              <div style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 6 }}>
                  Dehydrated Red Onion Powder
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#a82c2c', fontWeight: 700, marginBottom: 16 }}>
                  Premium Food Processing Grade
                </div>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 20 }}>
                  Coordinated sourcing of Red Onion Powder produced from select Indian red onions via controlled multi-stage dehydration by vetted processing partners. Delivers sharp aroma, consistent flavor profile, and extended 24-month stability for soup mixes, snack seasonings, and processed foods.
                </p>

                <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: 24, fontSize: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><strong>Mesh Size:</strong> 60–80 Mesh</div>
                    <div><strong>Moisture:</strong> ≤ 6.0%</div>
                    <div><strong>MOQ:</strong> 100 kg</div>
                    <div><strong>Packaging:</strong> 20 / 25 kg Cartons</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Link to="/products#onion" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Full Sourcing Specs
                  </Link>
                  <Link to="/contact" className="btn" style={{ flex: 1, justifyContent: 'center', background: 'white', border: '1px solid var(--color-border)' }}>
                    Request RFQ Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMERCIAL BUYER PERSONAS & EXPORT SOURCING ARCHITECTURE ── */}
      <section style={{ padding: '96px 0', background: 'white' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 48px' }}>
            <div className="section-tag" style={{ justifyContent: 'center' }}>
              <Building2 size={12} /> B2B Commercial Supply
            </div>
            <h2 className="section-title">Built for Global Food &amp; Nutraceutical Buyers</h2>
            <p className="section-desc">
              AVANI AGRO FOODS coordinates reliable ingredient sourcing from verified Indian agricultural processors to international manufacturers, importers, and brand owners.
            </p>
          </div>

          {/* 4 Commercial Buyer Profiles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
            marginBottom: 48
          }}>
            <div className="card" style={{ padding: '28px 24px', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(26,71,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <FlaskConical size={22} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-text)' }}>
                Food &amp; Seasoning Manufacturers
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
                Snack seasoning, ready meals, dehydrated soups, instant noodles, and savory blends requiring consistent pungency, mesh fineness, and low moisture.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                ✓ Dehydrated Red Onion Powder (60–80 Mesh)
              </div>
            </div>

            <div className="card" style={{ padding: '28px 24px', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(26,71,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Leaf size={22} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-text)' }}>
                Nutraceutical &amp; Supplement Brands
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
                Dietary supplements, capsule filling, superfood green powders, and herbal tea blends demanding verified batch COAs and microbiological purity.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                ✓ Moringa Leaf Powder (80–100 Mesh)
              </div>
            </div>

            <div className="card" style={{ padding: '28px 24px', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(26,71,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Globe size={22} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-text)' }}>
                Bulk Importers &amp; Distributors
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
                Regional food ingredient importers across USA, UK, UAE, Europe, and Australia seeking steady containerized ocean freight and competitive FOB/CIF contracts.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                ✓ FCL &amp; LCL Freight Coordination
              </div>
            </div>

            <div className="card" style={{ padding: '28px 24px', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(26,71,42,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Package size={22} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 8, color: 'var(--color-text)' }}>
                Private-Label &amp; Foodservice
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
                Commercial brands and catering ingredient suppliers requiring custom bulk export packaging (20 kg / 25 kg multi-wall paper bags or HDPE drums) and private labeling.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                ✓ Export Grade Multi-Wall Packaging
              </div>
            </div>
          </div>

          {/* Sourcing & Documentation Architecture Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0d2818 0%, #1a472a 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 32px',
            color: 'white',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
            alignItems: 'center'
          }}>
            <div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#a3e635', border: '1px solid rgba(163,230,53,0.3)', marginBottom: 12 }}>
                Export Quality Assurance
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white', marginBottom: 12 }}>
                Direct Export Hub from Maharashtra to Global Ports
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 20 }}>
                Every consignment is audited at the processing facility, lab-tested with batch COA, and dispatched directly through JNPT / Nhava Sheva Seaport or Mumbai Air Cargo.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Link
                  to="/moringa-powder-bulk-supplier-india"
                  className="btn"
                  style={{ background: '#22c55e', color: 'white', fontWeight: 700, fontSize: '0.85rem', padding: '10px 18px' }}
                >
                  Moringa Bulk Sourcing <ArrowRight size={14} />
                </Link>
                <Link
                  to="/red-onion-powder-bulk-supplier-india"
                  className="btn"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700, fontSize: '0.85rem', padding: '10px 18px' }}
                >
                  Red Onion Bulk Sourcing <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.12)'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fef08a', marginBottom: 14 }}>
                Commercial Export Guarantee
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                  <CheckCircle2 size={16} color="#4ade80" style={{ flexShrink: 0 }} /> Batch Certificate of Analysis (COA) included
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                  <CheckCircle2 size={16} color="#4ade80" style={{ flexShrink: 0 }} /> FOB Nhava Sheva / CIF Global Seaports
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                  <CheckCircle2 size={16} color="#4ade80" style={{ flexShrink: 0 }} /> Phytosanitary &amp; Origin Documentation
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                  <CheckCircle2 size={16} color="#4ade80" style={{ flexShrink: 0 }} /> Commercial Sample Dispatch prior to contract
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section style={{ padding: '96px 0', background: 'var(--color-bg-alt)' }}>
        <div className="container" style={{ maxWidth: 840 }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-tag" style={{ justifyContent: 'center' }}>
              <HelpCircle size={12} /> Frequently Asked Questions
            </div>
            <h2 className="section-title">B2B Trade &amp; Sourcing FAQ</h2>
            <p className="section-desc">Clear answers regarding our sourcing model, laboratory testing, Incoterms, and orders.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '24px',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                      {faq.q}
                    </h3>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </div>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}
                    >
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', lineHeight: 1.7, margin: 0 }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── B2B RFQ CALL TO ACTION STRIP ── */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #153e24 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: 16, color: 'white' }}>
            Ready to Request an Export Quotation?
          </h2>
          <p style={{ fontSize: '1.08rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 36 }}>
            Share your required product specifications, volume, and target destination port. We will coordinate directly with our Indian processing partners to provide a competitive proforma quote.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-primary" style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 800, padding: '14px 32px' }}>
              Submit B2B RFQ Inquiry
            </Link>
            <a
              href={`https://wa.me/${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent('Hello Sachin, I would like to inquire about B2B sourcing of Moringa Powder / Red Onion Powder.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '14px 28px' }}
            >
              WhatsApp Us (+91 7219053645)
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
