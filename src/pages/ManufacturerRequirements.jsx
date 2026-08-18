import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { FileText, Shield, Package, FlaskConical, Award, Tag, GitBranch, Plane, Globe, CheckSquare, Send, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { BUSINESS_INFO } from '../data/links'
import { trackManufacturerApplication } from '../lib/analytics'

const SECTIONS = [
  {
    id: 'company-docs',
    icon: FileText,
    title: '1. Company Documents',
    color: '#1a4d2e',
    items: [
      { label: 'Certificate of Incorporation / Partnership Deed', required: true },
      { label: 'GST Registration Certificate', required: true },
      { label: 'Udyam / MSME Registration (if applicable)', required: false },
      { label: 'PAN Card (Company / Proprietor)', required: true },
      { label: 'Bank Account Details & Cancelled Cheque', required: true },
      { label: 'Authorized Signatory ID Proof', required: true },
    ],
  },
  {
    id: 'factory-docs',
    icon: Shield,
    title: '2. Factory & Facility Documents',
    color: '#2d5a27',
    items: [
      { label: 'FSSAI Food Business Operator (FBO) License', required: true },
      { label: 'Factory Registration Certificate', required: true },
      { label: 'IEC — Import Export Code (if exporting directly)', required: true },
      { label: 'APEDA Registration Certificate (for eligible products)', required: false },
      { label: 'Factory Floor Plan / Layout Drawing', required: false },
      { label: 'Factory Photographs (exterior & interior processing / packing areas)', required: true },
      { label: 'Processing Machinery & Equipment List (Dryers, Pulverizers, Sifters, Metal Detectors)', required: true },
      { label: 'Monthly Production & Processing Capacity Statement (in MT)', required: true },
      { label: 'Pest Control Contract & Recent Pest Control Report', required: true },
      { label: 'Water Testing Report (potable water source under IS 10500)', required: true },
    ],
  },
  {
    id: 'product-docs',
    icon: Package,
    title: '3. Product Documents',
    color: '#3a7c4c',
    items: [
      { label: 'Product Specification Sheet (per product / grade)', required: true },
      { label: 'Product Catalogue with photos and packaging options', required: false },
      { label: 'Label Sample (draft or approved label)', required: true },
      { label: 'Packaging Photographs (inner + outer)', required: true },
      { label: 'MOQ (Minimum Order Quantity) Statement', required: true },
      { label: 'Export Price List (FOB / CIF — in USD or INR)', required: true },
      { label: 'Lead Time Statement', required: true },
      { label: 'Private Label Capability Declaration', required: false },
    ],
  },
  {
    id: 'lab-reports',
    icon: FlaskConical,
    title: '4. Laboratory & Quality Reports',
    color: '#1a4d2e',
    items: [
      { label: 'Certificate of Analysis (COA) — recent batch', required: true },
      { label: 'Microbiology Report (TPC, Yeast & Mould, E. coli, Salmonella)', required: true },
      { label: 'Heavy Metal Report (Lead, Cadmium, Arsenic, Mercury)', required: true },
      { label: 'Pesticide Residue Report (as per EU/MRL or destination market)', required: true },
      { label: 'Moisture Analysis Report', required: true },
      { label: 'NABL / Accredited Lab Test Reports (preferred)', required: false },
      { label: 'Aflatoxin Test Report (for applicable products)', required: false },
    ],
  },
  {
    id: 'certifications',
    icon: Award,
    title: '5. Quality Certifications (where held)',
    color: '#2d5a27',
    items: [
      { label: 'ISO 22000:2018 Food Safety Management Certificate', required: false },
      { label: 'HACCP Certificate or HACCP Plan Document', required: false },
      { label: 'BRCGS / IFS Food Safety Certificate', required: false },
      { label: 'Halal Certification (for Gulf / Muslim-majority markets)', required: false },
      { label: 'Organic Certification (NPOP / NOP / EU Organic)', required: false },
      { label: 'US FDA Food Facility Registration (for USA exports)', required: false },
      { label: 'Kosher Certification (for applicable markets)', required: false },
    ],
  },
  {
    id: 'packaging',
    icon: Tag,
    title: '6. Packaging & Labelling',
    color: '#3a7c4c',
    items: [
      { label: 'Packaging Material Specification (food-grade declaration)', required: true },
      { label: 'Sample Label with: product name, net weight, ingredients, MFG date, expiry, batch no., contact', required: true },
      { label: 'Country of Origin Declaration', required: true },
      { label: 'Allergen Information Declaration', required: true },
      { label: 'GMO Status Declaration (Non-GMO / GMO)', required: false },
      { label: 'Shelf Life Statement with storage conditions', required: true },
    ],
  },
  {
    id: 'traceability',
    icon: GitBranch,
    title: '7. Batch Traceability',
    color: '#1a4d2e',
    items: [
      { label: 'Batch Traceability SOP or System Description', required: true },
      { label: 'Raw Material Procurement Records (farmer / supplier details)', required: false },
      { label: 'Production Batch Records Sample', required: false },
      { label: 'Quality Assurance SOP Document', required: false },
      { label: 'Recall Procedure Document', required: false },
    ],
  },
  {
    id: 'export-docs',
    icon: Plane,
    title: '8. Commercial Export Documents (supplied per shipment)',
    color: '#2d5a27',
    items: [
      { label: 'Commercial Invoice', required: true },
      { label: 'Packing List', required: true },
      { label: 'Certificate of Origin (CO — from APEDA / Chamber)', required: true },
      { label: 'Phytosanitary Certificate (where required by destination)', required: false },
      { label: 'Health Certificate (where required by destination)', required: false },
      { label: 'Fumigation Certificate (if required)', required: false },
      { label: 'Bill of Lading / Airway Bill', required: true },
      { label: 'Insurance Certificate', required: false },
    ],
  },
  {
    id: 'commercial',
    icon: Globe,
    title: '9. Commercial Terms',
    color: '#3a7c4c',
    items: [
      { label: 'Accepted Payment Terms (LC, TT, advance, etc.)', required: true },
      { label: 'Incoterms (EXW, FOB, CIF, DAP, etc.)', required: true },
      { label: 'Export Experience — countries exported to', required: false },
      { label: 'References from previous buyers (optional)', required: false },
    ],
  },
]

const MORINGA_SPECS = [
  { param: 'Botanical Source', value: 'Moringa oleifera leaves' },
  { param: 'Appearance', value: 'Fine green powder' },
  { param: 'Moisture', value: '≤ 7%' },
  { param: 'Mesh Size', value: '80–100 mesh' },
  { param: 'Foreign Matter', value: 'Nil' },
  { param: 'Additives / Preservatives', value: 'None' },
  { param: 'Shelf Life', value: '24 months' },
  { param: 'Packaging Options', value: '5 / 10 / 20 / 25 kg food-grade bags' },
  { param: 'GMO Status', value: 'Non-GMO preferred' },
]

const ONION_SPECS = [
  { param: 'Source', value: 'Dehydrated red onion' },
  { param: 'Appearance', value: 'Fine pink/light purple powder' },
  { param: 'Moisture', value: '≤ 6%' },
  { param: 'Mesh Size', value: '80–100 mesh' },
  { param: 'Foreign Matter', value: 'Nil' },
  { param: 'Additives / Preservatives', value: 'None' },
  { param: 'Shelf Life', value: '24 months' },
  { param: 'Packaging Options', value: '5 / 10 / 20 / 25 kg food-grade bags' },
  { param: 'GMO Status', value: 'Non-GMO preferred' },
]

export default function ManufacturerRequirements() {
  const [form, setForm] = useState({
    companyName: '', contactPerson: '', email: '', phone: '', website: '',
    factoryLocation: '', products: '', capacity: '', moq: '',
    certifications: [], message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    trackManufacturerApplication(form.products)
    setTimeout(() => { setSubmitted(true); setLoading(false) }, 800)
  }

  return (
    <>
      <SEO
        title="Manufacturer Requirements & Export Compliance | AVANI AGRO FOODS"
        description="Requirements for Indian food manufacturers to partner with Avani Agro Foods. FSSAI, IEC, COA, lab reports, packaging, traceability and export documentation checklist for Moringa and Red Onion Powder."
        keywords="manufacturer requirements exporter india, food manufacturer documentation, FSSAI manufacturer requirements, export compliance india, moringa manufacturer india, onion powder manufacturer"
      />

      <div className="page-top">
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '96px 0' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.1)', color: 'white', display: 'inline-flex', marginBottom: 20 }}>
              <Shield size={14} /> Manufacturer Requirements
            </div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 20 }}>
              Manufacturer Requirements &amp; Export Compliance
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.7 }}>
              A comprehensive guide for Indian food manufacturers seeking to supply Moringa Powder and Red Onion Powder to AVANI AGRO FOODS for export markets.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#checklist" className="btn btn-primary">View Full Checklist</a>
              <a href="#submit" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>Submit Documents</a>
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        <div style={{ background: '#fff8e1', borderBottom: '2px solid #e6a817', padding: '20px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <AlertCircle size={20} color="#e6a817" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#7a5c00', lineHeight: 1.6 }}>
              <strong>Important:</strong> This document is AVANI AGRO FOODS' manufacturer onboarding baseline — not a legal regulation. Requirements vary by destination market. See our{' '}
              <Link to="/export-compliance" style={{ color: '#e6a817', fontWeight: 700 }}>Export Compliance Guide</Link> for country-specific regulatory requirements. All specifications listed are buyer requirements and internal quality standards unless otherwise stated.
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '72px 24px' }}>

          {/* Product Specifications */}
          <div style={{ marginBottom: 72 }}>
            <div className="section-header">
              <div className="section-tag"><Package size={12} /> Baseline Product Specifications</div>
              <h2 className="section-title">AVANI Agro Foods Buyer Specifications</h2>
              <p className="section-desc">These are AVANI AGRO FOODS manufacturer onboarding specifications and buyer requirements for the export market. Manufacturers must meet or exceed these baselines.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 32 }}>
              {/* Moringa */}
              <div className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <span style={{ fontSize: '2rem' }}>🌿</span>
                  <div>
                    <h3 style={{ fontWeight: 900, marginBottom: 4 }}>Moringa Powder</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Export Grade Specifications</div>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <tbody>
                    {MORINGA_SPECS.map(({ param, value }) => (
                      <tr key={param} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 0', fontWeight: 700, color: 'var(--color-text-light)', width: '45%' }}>{param}</td>
                        <td style={{ padding: '10px 0', fontWeight: 600 }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--color-text-light)', lineHeight: 1.5 }}>
                  Every batch must be accompanied by COA, microbiology, heavy metal and pesticide residue reports where required by the applicable market.
                </p>
              </div>

              {/* Red Onion Powder */}
              <div className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <span style={{ fontSize: '2rem' }}>🧅</span>
                  <div>
                    <h3 style={{ fontWeight: 900, marginBottom: 4 }}>Red Onion Powder</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Export Grade Specifications</div>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <tbody>
                    {ONION_SPECS.map(({ param, value }) => (
                      <tr key={param} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 0', fontWeight: 700, color: 'var(--color-text-light)', width: '45%' }}>{param}</td>
                        <td style={{ padding: '10px 0', fontWeight: 600 }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--color-text-light)', lineHeight: 1.5 }}>
                  Every batch must be accompanied by COA, microbiology, heavy metal and pesticide residue reports where required by the applicable market.
                </p>
              </div>
            </div>
          </div>

          {/* Document Sections */}
          <div id="checklist" style={{ marginBottom: 72 }}>
            <div className="section-header">
              <div className="section-tag"><CheckSquare size={12} /> Documentation Checklist</div>
              <h2 className="section-title">Complete Manufacturer Documentation Guide</h2>
              <p className="section-desc">Use this as your onboarding checklist. <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Required</span> items are mandatory for onboarding. <span style={{ color: 'var(--color-text-light)' }}>Recommended</span> items strengthen your application.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {SECTIONS.map(section => (
                <div key={section.id} className="card" style={{ padding: '32px', borderLeft: `4px solid ${section.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${section.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <section.icon size={22} color={section.color} />
                    </div>
                    <h3 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>{section.title}</h3>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {section.items.map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ color: item.required ? 'var(--color-primary)' : 'var(--color-text-light)', fontSize: '1.1rem', lineHeight: 1, flexShrink: 0, marginTop: 2 }}>
                          {item.required ? '✅' : '⭕'}
                        </span>
                        <div>
                          <span style={{ fontSize: '0.9rem', fontWeight: item.required ? 700 : 400 }}>{item.label}</span>
                          {item.required && <span style={{ marginLeft: 8, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary)' }}>Required</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <span>✅ <strong>Required</strong> — Mandatory for onboarding</span>
              <span>⭕ <strong>Recommended</strong> — Strengthens application / market-specific</span>
            </div>
          </div>

          {/* Submit Form */}
          <div id="submit" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="section-header">
              <div className="section-tag"><Send size={12} /> Become a Partner</div>
              <h2 className="section-title">Submit Manufacturer Application</h2>
              <p className="section-desc">Complete this form and we will contact you within 48 hours to begin the onboarding process.</p>
            </div>

            {submitted ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                <h3 style={{ fontWeight: 900, color: 'var(--color-primary)', fontSize: '1.5rem', marginBottom: 12 }}>Application Received!</h3>
                <p style={{ color: 'var(--color-text-light)' }}>Thank you for your interest in becoming an AVANI AGRO FOODS manufacturing partner. Our team will review your application and contact you within 48 hours at the email provided.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label" htmlFor="mfr-company">Company / Factory Name *</label>
                    <input id="mfr-company" className="input" required value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="ABC Foods Pvt Ltd" />
                  </div>
                  <div>
                    <label className="label" htmlFor="mfr-contact">Contact Person *</label>
                    <input id="mfr-contact" className="input" required value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} placeholder="Full Name" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label" htmlFor="mfr-email">Business Email *</label>
                    <input id="mfr-email" type="email" className="input" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@factory.com" />
                  </div>
                  <div>
                    <label className="label" htmlFor="mfr-phone">Phone / WhatsApp *</label>
                    <input id="mfr-phone" className="input" required value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="mfr-location">Factory Location *</label>
                  <input id="mfr-location" className="input" required value={form.factoryLocation} onChange={e => set('factoryLocation', e.target.value)} placeholder="City, State, India" />
                </div>
                <div>
                  <label className="label" htmlFor="mfr-products">Products You Manufacture *</label>
                  <input id="mfr-products" className="input" required value={form.products} onChange={e => set('products', e.target.value)} placeholder="e.g. Moringa Powder, Red Onion Powder, Turmeric Powder..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="label" htmlFor="mfr-capacity">Monthly Production Capacity</label>
                    <input id="mfr-capacity" className="input" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="e.g. 10 MT / month" />
                  </div>
                  <div>
                    <label className="label" htmlFor="mfr-moq">Minimum Order Quantity (MOQ)</label>
                    <input id="mfr-moq" className="input" value={form.moq} onChange={e => set('moq', e.target.value)} placeholder="e.g. 500 kg" />
                  </div>
                </div>
                <div>
                  <label className="label">Certifications Held (select all that apply)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {['FSSAI', 'IEC', 'APEDA', 'ISO 22000', 'HACCP', 'BRCGS', 'Halal', 'Organic (NPOP)', 'Organic (NOP)', 'US FDA'].map(cert => (
                      <label key={cert} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', background: form.certifications.includes(cert) ? 'rgba(26,77,46,0.1)' : 'var(--color-bg-alt)', padding: '6px 14px', borderRadius: 20, border: `1px solid ${form.certifications.includes(cert) ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
                        <input
                          type="checkbox"
                          checked={form.certifications.includes(cert)}
                          onChange={e => set('certifications', e.target.checked ? [...form.certifications, cert] : form.certifications.filter(c => c !== cert))}
                          style={{ display: 'none' }}
                        />
                        {form.certifications.includes(cert) ? '✅' : '⬜'} {cert}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="mfr-message">Additional Information / Export Experience</label>
                  <textarea id="mfr-message" className="input" rows={4} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Tell us about your export experience, countries supplied to, quality processes, and any other relevant information..." style={{ resize: 'vertical' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', height: 56 }}>
                  {loading ? 'Submitting...' : <><Send size={18} /> Submit Manufacturer Application</>}
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textAlign: 'center', margin: 0 }}>
                  To attach documents, email them to <a href={`mailto:${BUSINESS_INFO.email}`} style={{ color: 'var(--color-primary)' }}>{BUSINESS_INFO.email}</a> with subject "Manufacturer Application — [Your Company Name]"
                </p>
              </form>
            )}
          </div>

          {/* Country Link */}
          <div style={{ marginTop: 72, padding: '40px', background: 'linear-gradient(135deg, var(--color-primary), #2d8f5c)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'white' }}>
            <Globe size={40} style={{ margin: '0 auto 16px', opacity: 0.8 }} />
            <h3 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: 12 }}>Need Country-Specific Requirements?</h3>
            <p style={{ opacity: 0.8, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>Our Global Export Compliance Guide covers documentation requirements for 40+ destination markets.</p>
            <Link to="/export-compliance" className="btn" style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 800 }}>
              View Export Compliance Guide →
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
