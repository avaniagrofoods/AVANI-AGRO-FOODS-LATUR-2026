import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../data/links'
import {
  FileText, Search, Building2, ShieldCheck, FlaskConical,
  Calculator, CheckCircle, Truck, ArrowRight, Send,
  Globe, HelpCircle, Users, CheckCircle2
} from 'lucide-react'

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Buyer Requirement Intake',
    desc: 'The international buyer submits their required product (Moringa Powder or Red Onion Powder), target volume, mesh size, packaging format, Incoterm preference (FOB / CIF), and destination port of entry.',
    icon: FileText
  },
  {
    step: '02',
    title: 'Product & Specification Review',
    desc: 'AVANI reviews technical parameters, microbiological standards, destination customs compliance thresholds, and feasibility against Indian agricultural harvest availability.',
    icon: Search
  },
  {
    step: '03',
    title: 'Supplier & Processor Matching',
    desc: 'We match buyer requirements with qualified Indian manufacturing, dehydration, and milling facilities in Maharashtra that operate compliant machinery and hygienic infrastructure.',
    icon: Building2
  },
  {
    step: '04',
    title: 'Supplier Verification & Commercial Discussion',
    desc: 'We verify processing facility readiness, raw material batch quality, production capacity, and negotiate competitive commercial pricing on behalf of the transaction.',
    icon: ShieldCheck
  },
  {
    step: '05',
    title: 'Sample & Quality Documentation Coordination',
    desc: 'Representative batch samples and third-party laboratory analysis reports (COA for moisture, mesh, heavy metals, pesticide residues) are coordinated and dispatched to the buyer.',
    icon: FlaskConical
  },
  {
    step: '06',
    title: 'Formal Indicative Quotation',
    desc: 'A formal Proforma Invoice / quotation is issued detailing itemized unit costs, shipping freight estimates (JNPT / Nhava Sheva or Mumbai Air), payment milestones, and production lead times.',
    icon: Calculator
  },
  {
    step: '07',
    title: 'Order & Production Coordination',
    desc: 'Upon commercial agreement and proforma confirmation, production schedules, export barrier packaging, batch labeling, and pre-dispatch inspections are supervised.',
    icon: CheckCircle
  },
  {
    step: '08',
    title: 'Logistics & Shipment Coordination',
    desc: 'Complete export documentation (Commercial Invoice, Packing List, Certificate of Origin, Phytosanitary Certificate) and port transport to Nhava Sheva Seaport are executed.',
    icon: Truck
  }
]

export default function TradeCoordination() {
  const tradeBreadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.avaniagrofoods.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Trade Coordination",
        "item": "https://www.avaniagrofoods.com/trade-coordination"
      }
    ]
  }

  return (
    <>
      <SEO
        title="B2B Trade Coordination & Sourcing Services | AVANI AGRO FOODS"
        description="Learn how AVANI AGRO FOODS coordinates agricultural export sourcing from India. 8-stage trade coordination process connecting global buyers with qualified Indian processors."
        keywords="trade coordination india, agricultural sourcing partner, B2B food export coordination, moringa sourcing agent india, red onion powder coordinator"
        schema={tradeBreadcrumbSchema}
      />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 80 }}>
        
        {/* Hero Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '80px 0 60px', color: 'white', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 840 }}>
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <Globe size={14} /> Trade Coordination &amp; Sourcing Partner
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: 'white', marginBottom: 16 }}>
              Agricultural Trade Coordination
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 auto 28px' }}>
              AVANI AGRO FOODS acts as a dedicated trade coordinator and B2B sourcing partner in Maharashtra, India — bridging international buyers with vetted agricultural manufacturers and processing facilities.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-primary" style={{ background: 'var(--color-accent)', color: 'white' }}>
                Submit Buyer Requirement
              </Link>
              <Link to="/catalog" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
                View Sourced Catalog
              </Link>
            </div>
          </div>
        </div>

        {/* Business Identity & Role Statement */}
        <div className="container" style={{ paddingTop: 48 }}>
          <div className="card" style={{ padding: '36px', background: 'white', borderLeft: '5px solid var(--color-primary)', marginBottom: 56 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 12 }}>
              Our Role &amp; Business Model
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.8, marginBottom: 16 }}>
              <strong>AVANI AGRO FOODS</strong> (led by <strong>Sachin Shinde</strong>, Trade Coordinator) operates as an Indian agricultural export coordination and B2B sourcing business. We specialize in coordinating commercial supplies of <strong>Moringa Powder</strong> and <strong>Red Onion Powder</strong> for global importers, distributors, food processors, and supplement brands.
            </p>
            <div style={{ background: '#f0fdf4', padding: '18px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0', fontSize: '0.88rem', color: '#166534', lineHeight: 1.7 }}>
              <strong>Important Transparency Disclosure:</strong> AVANI AGRO FOODS coordinates with independent, qualified Indian manufacturers, dehydration plants, and processing facilities. AVANI does not represent partner processing facilities as its own manufacturing units. Sourcing, quality assays, and export certifications are managed collaboratively with vetted processors to match destination import standards.
            </div>
          </div>

          {/* 8-Stage Visual Process */}
          <div style={{ marginBottom: 64 }}>
            <div className="section-header">
              <div className="section-tag"><CheckCircle2 size={12} /> The 8-Stage Sourcing Workflow</div>
              <h2 className="section-title">How AVANI Coordinates Your Export Orders</h2>
              <p className="section-desc">From initial requirement submission to container dispatch at Nhava Sheva seaport.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 24 }}>
              {WORKFLOW_STEPS.map((s) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.step}
                    className="card"
                    style={{
                      padding: '28px',
                      background: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderTop: '4px solid var(--color-primary)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={22} color="var(--color-primary)" />
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-accent)', fontFamily: 'monospace' }}>
                          {s.step}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 10 }}>
                        {s.title}
                      </h3>
                      <p style={{ fontSize: '0.86rem', color: 'var(--color-text-light)', lineHeight: 1.65, margin: 0 }}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Why Work With AVANI */}
          <div style={{ marginBottom: 64 }}>
            <div className="section-header">
              <div className="section-tag"><Users size={12} /> Sourcing Advantages</div>
              <h2 className="section-title">Why Global Importers Partner with AVANI</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                {
                  title: 'On-Ground Sourcing in Maharashtra',
                  desc: 'Direct geographic proximity to major moringa farming regions and the onion capital of western India, enabling real-time harvest monitoring and competitive pricing.'
                },
                {
                  title: 'Vetted Processing Network',
                  desc: 'We pre-screen processing facilities for hygienic stainless steel machinery, proper dehydration temperature controls, and multi-stage magnet/sifter filtration.'
                },
                {
                  title: 'Batch Lab Testing Verification',
                  desc: 'Every commercial consignment is tested at NABL-accredited independent laboratories for microbiology (TPC, Yeast/Mould, Salmonella), heavy metals, and moisture.'
                },
                {
                  title: 'End-to-End Export Logistics',
                  desc: 'Coordination of port transport to JNPT / Nhava Sheva (Mumbai), phytosanitary certification, Certificate of Origin, and customs clearance support.'
                }
              ].map(adv => (
                <div key={adv.title} className="card" style={{ padding: '28px', background: 'white' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 10, color: 'var(--color-text)' }}>
                    {adv.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.65, margin: 0 }}>
                    {adv.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Final Call to Action */}
          <div style={{ padding: '40px', background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'white' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12 }}>
              Ready to Discuss Your Sourcing Requirements?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', maxWidth: 600, margin: '0 auto 24px', lineHeight: 1.7 }}>
              Submit your required product specification, estimated volume, target Incoterm, and destination port. Our trade coordination desk will respond within 24 business hours.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-primary" style={{ background: 'var(--color-accent)' }}>
                Request Indicative Quotation
              </Link>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Sachin, I would like to discuss sourcing agricultural ingredients from India.')}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 800 }}>
                WhatsApp Sachin Directly
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
