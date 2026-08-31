import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../data/links'
import {
  FileText, Building2, FlaskConical, Shield, Award,
  Truck, CheckCircle2, ArrowRight, Clock, HelpCircle, Send
} from 'lucide-react'

const PROCESS_STEPS = [
  {
    step: 'Stage 01',
    title: 'Requirement & RFQ Submission',
    desc: 'The buyer shares their target product specification (Moringa Powder or Red Onion Powder), required volume, target mesh size, packaging preference, target Incoterm (FOB or CIF), and destination port of entry.',
    icon: FileText,
    highlights: ['Detailed RFQ review', 'Destination compliance check', 'Sample requirement determination']
  },
  {
    step: 'Stage 02',
    title: 'Supplier & Processor Matching',
    desc: 'AVANI AGRO FOODS matches the buyer requirements with qualified Indian manufacturing and processing partners in Maharashtra possessing appropriate dehydration, grinding, and sorting machinery.',
    icon: Building2,
    highlights: ['Qualified processing units', 'Hygienic facility standards', 'Raw material quality check']
  },
  {
    step: 'Stage 03',
    title: 'Specification & Lab Analysis Review',
    desc: 'Representative batch samples and third-party laboratory analysis reports (COA covering microbiological parameters, moisture, mesh, and heavy metals) are reviewed and shared with the buyer for approval.',
    icon: FlaskConical,
    highlights: ['NABL accredited lab testing', 'Batch Certificate of Analysis (COA)', 'Pre-shipment sample dispatch']
  },
  {
    step: 'Stage 04',
    title: 'Commercial Terms & Proforma Invoice',
    desc: 'We issue a formal Proforma Invoice detailing unit pricing, Incoterm structure (FOB Nhava Sheva, JNPT Mumbai / CIF destination port), payment terms, packaging details, and production lead times.',
    icon: Shield,
    highlights: ['Transparent FOB/CIF pricing', 'Formal Proforma Invoice', 'Clear payment schedule']
  },
  {
    step: 'Stage 05',
    title: 'Export Documentation Coordination',
    desc: 'Complete commercial and regulatory document sets are coordinated — including Commercial Invoices, Packing Lists, Certificates of Origin, and Phytosanitary certificates in compliance with destination import rules.',
    icon: Award,
    highlights: ['Commercial Invoice & Packing List', 'Certificate of Origin (COO)', 'Phytosanitary certification support']
  },
  {
    step: 'Stage 06',
    title: 'Port Logistics & Container Dispatch',
    desc: 'Final packaged goods are transported from partner processing facilities in Maharashtra to container terminals at JNPT / Nhava Sheva Seaport or Mumbai Air Cargo, with bill of lading and tracking provided.',
    icon: Truck,
    highlights: ['Container stuffing oversight', 'Customs clearance at port', 'Bill of Lading (B/L) issuance']
  }
]

export default function ExportProcess() {
  return (
    <>
      <SEO
        title="Export Process & Trade Workflow | AVANI AGRO FOODS"
        description="Understand the 6-stage agricultural export coordination workflow with AVANI AGRO FOODS: RFQ, supplier matching, batch testing, proforma, documentation, and port dispatch."
        keywords="agricultural export process india, moringa export workflow, how to import agro products from india, B2B food export coordination"
      />

      <div className="page-top">
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '80px 0', textAlign: 'center', color: 'white' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <Shield size={14} /> End-to-End Trade Coordination
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, color: 'white', marginBottom: 16 }}>
              Our Export Sourcing Process
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 auto 32px' }}>
              A transparent, step-by-step framework ensuring consistent quality, batch testing verification, and reliable shipment execution for overseas agricultural ingredient buyers.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-primary" style={{ background: 'var(--color-accent)' }}>
                Start an Inquiry
              </Link>
              <Link to="/products" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
                View Sourced Products
              </Link>
            </div>
          </div>
        </div>

        {/* Process Steps Section */}
        <div className="container" style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {PROCESS_STEPS.map((stage) => {
                const Icon = stage.icon
                return (
                  <div
                    key={stage.step}
                    className="card"
                    style={{
                      padding: '36px 32px',
                      background: 'white',
                      borderLeft: '5px solid var(--color-primary)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'rgba(26,77,46,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={22} color="var(--color-primary)" />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)' }}>
                          {stage.step}
                        </span>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-text)', margin: 0 }}>
                          {stage.title}
                        </h2>
                      </div>
                    </div>

                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 20 }}>
                      {stage.desc}
                    </p>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {stage.highlights.map((item) => (
                        <span
                          key={item}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background: 'var(--color-bg-alt)',
                            color: 'var(--color-text)',
                            padding: '6px 14px',
                            borderRadius: 20,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <CheckCircle2 size={13} color="var(--color-primary)" /> {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Turnaround & Communication Notice */}
            <div style={{ marginTop: 56, padding: '32px', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <Clock size={36} color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: 8 }}>Typical Sourcing Lead Times</h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.92rem', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 24px' }}>
                Pre-shipment sample dispatch: <strong>3–5 business days</strong>.<br />
                Commercial production and container packaging: <strong>14–21 business days</strong> from proforma confirmation.
              </p>
              <Link to="/contact" className="btn btn-primary" style={{ gap: 8 }}>
                <Send size={16} /> Request Sourcing Proforma
              </Link>
            </div>

          </div>
        </div>

        {/* Global Compliance Link */}
        <div style={{ padding: '60px 0', background: 'white', borderTop: '1px solid var(--color-border)' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: 680 }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 12 }}>Need Destination-Specific Regulatory Guidance?</h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: 24 }}>
              Explore our country-by-country export documentation matrix covering USA, EU, GCC, Japan, and Australia import regulations.
            </p>
            <Link to="/export-compliance" className="btn" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', gap: 8 }}>
              View 35-Market Compliance Guide <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
