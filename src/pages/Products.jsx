import { useState } from 'react'
import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { WHATSAPP_NUMBER, BUSINESS_INFO } from '../data/links'
import { sendContactEmail } from '../lib/emailjs'
import { 
  CheckCircle, Package, Globe, Award, Zap, 
  ArrowRight, X, Mail, User, Send, Check, Shield, FileText
} from 'lucide-react'

const PRODUCTS = [
  {
    id: 'moringa',
    name: 'Moringa Powder',
    tagline: 'Pure Dried Moringa oleifera Leaf Powder — Export Grade',
    category: 'Botanical Leaf Powder · Sourcing Coordination',
    description: 'AVANI AGRO FOODS coordinates sourcing of export-grade Moringa oleifera leaf powder from vetted processing facilities in Maharashtra, India. Carefully shade-dried and milled under hygienic controls to protect sensitive chlorophyll, amino acids, and micronutrients.',
    img: '/moringa.png',
    hscode: '0712.90.90',
    badge: '🌿 Key Botanical Ingredient',
    specs: [
      { label: 'Botanical Name', value: 'Moringa oleifera' },
      { label: 'Origin', value: 'Maharashtra, India' },
      { label: 'Mesh Size', value: '80–100 Mesh (Fine Powder)' },
      { label: 'Moisture Content', value: '≤ 7.0%' },
      { label: 'Crude Protein', value: '25–28% (dry basis)' },
      { label: 'Appearance', value: 'Homogeneous vibrant green' },
      { label: 'Shelf Life', value: '24 months in sealed original packaging' },
      { label: 'HS Code', value: '0712.90.90' },
    ],
    qualityDocumentation: [
      'Batch Certificate of Analysis (COA)',
      'Microbiological Screening Report',
      'Heavy Metals & Pesticide Residue Assays',
      'Phytosanitary Certificate Support'
    ],
    packSizes: ['1 kg Sample Pack', '5 kg Food-Grade Poly Liner', '25 kg HDPE Drums / Multi-Wall Kraft Sacks'],
    moq: '100 kg (Commercial Sourcing)',
    highlights: [
      'Dense natural plant protein and complete amino acid profile',
      'Concentrated plant chlorophyll and bioavailable minerals',
      'Non-GMO raw botanical leaf source',
      'Shade-dried under temperature-controlled protocols',
      'Coordinated third-party NABL-accredited laboratory test reports',
      'Zero additives, synthetic carriers, or fillers',
    ],
    targetRegions: ['North America (USA, Canada)', 'European Union & UK', 'GCC / Middle East', 'Asia-Pacific (Japan, Australia)'],
    applications: ['Dietary supplement capsules & tablets', 'Functional beverage powders', 'Superfood blends & smoothies', 'Clean-label food fortification'],
  },
  {
    id: 'onion',
    name: 'Red Onion Powder',
    tagline: 'Dehydrated Indian Red Onion Powder — Food Processing Grade',
    category: 'Dehydrated Food Ingredient · Sourcing Coordination',
    description: 'Manufactured from selected Indian red onion varieties (N-53, Bhima Shakti) via multi-stage controlled dehydration. Engineered to provide standardized pungency, extended 24-month ambient shelf life, and ease of incorporation for commercial food manufacturing.',
    img: '/onion.png',
    hscode: '0712.20.00',
    badge: '🧅 Commercial Food Ingredient',
    specs: [
      { label: 'Botanical Source', value: 'Allium cepa (Red Onion)' },
      { label: 'Origin', value: 'Maharashtra / Western India' },
      { label: 'Mesh Size', value: '60–80 Mesh' },
      { label: 'Moisture Content', value: '≤ 6.0%' },
      { label: 'Pungency Standard', value: 'High Pyruvic Acid Index' },
      { label: 'Appearance', value: 'Fine light pinkish-tan powder' },
      { label: 'Shelf Life', value: '24 months in sealed barrier liners' },
      { label: 'HS Code', value: '0712.20.00' },
    ],
    qualityDocumentation: [
      'Batch Certificate of Analysis (COA)',
      'Total Plate Count & Microbial Test Report',
      'Moisture & Volatile Oil Analysis',
      'Certificate of Origin (COO)'
    ],
    packSizes: ['5 kg Inner Liner Bags', '20 kg Corrugated Export Cartons', '25 kg Poly-Lined Export Sacks'],
    moq: '100 kg (Commercial Sourcing)',
    highlights: [
      '10–12 kg fresh onion concentration into 1 kg dehydrated powder',
      'Eliminates fresh bulb peeling waste and cold chain storage costs',
      'Consistent aromatic profile across all seasonal harvest windows',
      'Strictly screened for foreign matter and metal fragments',
      'Moisture-barrier export packaging prevents ambient clumping',
    ],
    targetRegions: ['North America', 'European Union', 'Middle East & North Africa', 'Southeast Asia'],
    applications: ['Dry soup mixes & bouillon cubes', 'Snack seasonings & extruded coatings', 'Processed meat & plant protein binders', 'Sauces, gravies & culinary premixes'],
  },
]

export default function Products() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    quantity: '',
    company: '',
    packaging: '25 kg Drums / Cartons',
    incoterm: 'FOB Nhava Sheva (Mumbai)',
    message: ''
  })

  const handleInquirySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await sendContactEmail({
        firstName: formData.name,
        lastName: `(${formData.country})`,
        email: formData.email,
        inquiryType: `B2B Sourcing Quote: ${selectedProduct?.name}`,
        message: `Company: ${formData.company}. Target Quantity: ${formData.quantity} kg. Packaging: ${formData.packaging}. Incoterm: ${formData.incoterm}. Additional Notes: ${formData.message}`,
        phone: 'N/A',
        company: formData.company
      })
      
      setLoading(false)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Error sending inquiry. Please reach us directly at sales@avaniagrofoods.com')
      setLoading(false)
    }
  }

  const openModal = (p) => {
    setSelectedProduct(p)
    setSubmitted(false)
    setModalOpen(true)
  }

  return (
    <>
      <SEO
        title="B2B Sourcing: Moringa Powder & Red Onion Powder | AVANI AGRO FOODS"
        description="Specifications, packaging details, and export parameters for Moringa Powder and Red Onion Powder coordinated by AVANI AGRO FOODS from India. Request B2B FOB/CIF quotes."
        keywords="moringa powder specifications, red onion powder wholesale, moringa export grade india, onion powder B2B india, moringa leaf powder supplier"
      />

      <div className="page-top">
        {/* Header Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '80px 0', textAlign: 'center', color: 'white' }}>
          <div className="container">
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <Package size={14} /> Agricultural Sourcing Catalog
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 900, color: 'white', marginBottom: 16 }}>
              Export-Grade Sourced Products
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 640, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Technical specifications, packaging configurations, and commercial parameters for Moringa Powder and Red Onion Powder coordinated for global B2B buyers.
            </p>
          </div>
        </div>

        {/* Compliance Notice Banner */}
        <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '16px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.88rem', color: '#166534' }}>
            <Shield size={18} color="#166534" style={{ flexShrink: 0 }} />
            <span>
              <strong>Quality Assurance:</strong> Product specifications, batch lab testing reports (COA), and applicable export certifications are coordinated directly with qualified partner processors based on destination country and buyer requirements.
            </span>
          </div>
        </div>

        {/* Products List */}
        <div className="container" style={{ padding: '72px 24px' }}>
          {PRODUCTS.map((product, idx) => (
            <div key={product.id} id={product.id} style={{ marginBottom: 96, scrollMarginTop: 100 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 56, alignItems: 'center' }}>
                
                {/* Product Image */}
                <div style={{ order: idx % 2 === 0 ? 0 : 1 }}>
                  <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                    <img src={product.img} alt={product.name} style={{ width: '100%', height: 380, objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--color-primary)', color: 'white', fontSize: '0.75rem', fontWeight: 800, borderRadius: 20, padding: '6px 14px' }}>
                      {product.badge}
                    </div>
                    <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', color: 'white', fontSize: '0.8rem', fontWeight: 700, borderRadius: 8, padding: '6px 12px' }}>
                      HS: {product.hscode}
                    </div>
                  </div>
                </div>

                {/* Product Description */}
                <div style={{ order: idx % 2 === 0 ? 1 : 0 }}>
                  <span className="badge" style={{ marginBottom: 12, display: 'inline-block' }}>{product.category}</span>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 8, color: 'var(--color-text)' }}>{product.name}</h2>
                  <div style={{ fontSize: '1.05rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 18 }}>{product.tagline}</div>
                  <p style={{ color: 'var(--color-text-light)', lineHeight: 1.75, marginBottom: 24, fontSize: '0.95rem' }}>{product.description}</p>

                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-light)', marginBottom: 12 }}>
                      Key Product Highlights
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                      {product.highlights.slice(0, 4).map(h => (
                        <div key={h} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: 'var(--color-text)' }}>
                          <CheckCircle size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 3 }} />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <button onClick={() => openModal(product)} className="btn btn-primary" style={{ gap: 8, padding: '12px 24px' }}>
                      <Zap size={16} /> Request B2B Quote
                    </button>
                    <Link to="/contact" className="btn" style={{ gap: 8, background: 'white', border: '1px solid var(--color-border)' }}>
                      Request Samples <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Specs & Information Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 40 }}>
                
                {/* Specifications Card */}
                <div className="card" style={{ padding: '28px', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '2px solid var(--color-primary)', paddingBottom: 8 }}>
                    <FileText size={18} color="var(--color-primary)" />
                    <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>Baseline Specifications</h3>
                  </div>
                  {product.specs.map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-light)' }}>{s.label}</span>
                      <span style={{ fontWeight: 700, textAlign: 'right' }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Packaging & MOQ Card */}
                <div className="card" style={{ padding: '28px', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '2px solid var(--color-primary)', paddingBottom: 8 }}>
                    <Package size={18} color="var(--color-primary)" />
                    <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>Packaging &amp; MOQ</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {product.packSizes.map(s => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--color-primary)' }}>📦</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '14px', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 800 }}>Minimum Order Quantity</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)', marginTop: 2 }}>{product.moq}</div>
                  </div>
                </div>

                {/* Quality Documentation & Applications */}
                <div className="card" style={{ padding: '28px', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '2px solid var(--color-primary)', paddingBottom: 8 }}>
                    <Shield size={18} color="var(--color-primary)" />
                    <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>Testing &amp; Compliance</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {product.qualityDocumentation.map(doc => (
                      <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--color-text)' }}>
                        <CheckCircle size={14} color="var(--color-primary)" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: 8 }}>
                      Primary Applications
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {product.applications.map(app => (
                        <span key={app} style={{ fontSize: '0.72rem', background: 'var(--color-bg-alt)', padding: '4px 10px', borderRadius: 12 }}>
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── B2B RFQ MODAL ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => !loading && setModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(10,30,15,0.8)', backdropFilter: 'blur(5px)' }} />
          
          <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 560, padding: 36, background: 'white', borderRadius: 20, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            {!submitted ? (
              <>
                <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: 20, right: 20, border: 'none', background: 'none', color: 'var(--color-text-light)', cursor: 'pointer' }}>
                  <X size={22} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(26,77,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Mail size={26} color="var(--color-primary)" />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 4 }}>
                    RFQ Inquiry: {selectedProduct?.name}
                  </h2>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                    Submit your sourcing requirements for a formal proforma quote from AVANI AGRO FOODS.
                  </p>
                </div>

                <form onSubmit={handleInquirySubmit} style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="label">Contact Name *</label>
                      <input className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                    </div>
                    <div>
                      <label className="label">Business Email *</label>
                      <input type="email" className="input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="purchasing@company.com" />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="label">Company Name *</label>
                      <input className="input" required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Company Ltd" />
                    </div>
                    <div>
                      <label className="label">Destination Country / Port *</label>
                      <input className="input" required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} placeholder="e.g. Los Angeles, USA" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="label">Estimated Volume (kg) *</label>
                      <input type="number" className="input" required min="100" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="Min 100" />
                    </div>
                    <div>
                      <label className="label">Target Incoterm</label>
                      <select className="input" value={formData.incoterm} onChange={e => setFormData({...formData, incoterm: e.target.value})}>
                        <option value="FOB Nhava Sheva (Mumbai)">FOB Nhava Sheva (Mumbai)</option>
                        <option value="CIF Destination Port">CIF Destination Port</option>
                        <option value="CFR Destination Port">CFR Destination Port</option>
                        <option value="Air Cargo (Mumbai)">Air Cargo (Mumbai)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Specific Requirements (mesh size, packaging, testing)</label>
                    <textarea className="input" rows={3} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Mention required testing panels, target lead time, or private label needs..." />
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}>
                    {loading ? 'Submitting Request...' : 'Send RFQ Inquiry'} <Send size={16} style={{ marginLeft: 8 }} />
                  </button>

                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', textAlign: 'center', margin: 0 }}>
                    We respect your privacy. Data is used strictly for commercial quotation coordination.
                  </p>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Check size={32} color="white" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8, color: 'var(--color-primary)' }}>
                  RFQ Request Received
                </h2>
                <p style={{ color: 'var(--color-text-light)', marginBottom: 24, fontSize: '0.92rem', lineHeight: 1.6 }}>
                  Thank you, <strong>{formData.name}</strong>. Your requirement for {selectedProduct?.name} has been logged. Our export coordination team will review specifications and respond to <strong>{formData.email}</strong> within 24–48 business hours.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={() => setModalOpen(false)} className="btn btn-primary">
                    Close Window
                  </button>
                  <a href={`https://wa.me/${BUSINESS_INFO.whatsapp}?text=${encodeURIComponent(`Hi Sachin, I submitted an RFQ for ${selectedProduct?.name}.`)}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                    Follow Up on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
