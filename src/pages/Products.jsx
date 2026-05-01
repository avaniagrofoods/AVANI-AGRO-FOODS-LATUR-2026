import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { WHATSAPP_NUMBER, CATALOG_LINK } from '../data/links'
import { sendContactEmail } from '../lib/emailjs'
import { 
  CheckCircle, Package, Globe, Award, Zap, 
  ArrowRight, X, Mail, User, Send, Check
} from 'lucide-react'

const PRODUCTS = [
  {
    id: 'moringa',
    name: 'Moringa Powder',
    tagline: 'The World\'s Most Nutrient-Dense Superfood',
    category: 'Herbal Supplement · Export Grade A',
    description: 'Avani Agro Foods Moringa Powder is sourced from premium Moringa oleifera trees grown in Maharashtra, India. Sun-dried and processed at low temperatures to preserve maximum nutrients, color, and bioavailability.',
    img: '/moringa.png',
    hscode: '0712.90.90',
    badge: '🌿 Bestseller Product',
    specs: [
      { label: 'Origin', value: 'Maharashtra, India' },
      { label: 'Grade', value: 'Export Grade A' },
      { label: 'Mesh Size', value: '60-100 mesh' },
      { label: 'Moisture', value: '<7%' },
      { label: 'Protein', value: '27-30% (dry weight)' },
      { label: 'Color', value: 'Vibrant deep green' },
      { label: 'Shelf Life', value: '24 months' },
      { label: 'HS Code', value: '0712.90.90' },
    ],
    certifications: ['FSSAI', 'APEDA', 'ISO Compliant', 'NABL Tested'],
    packSizes: ['100g Retail', '250g Retail', '500g Retail', '1 kg', '5 kg', '25 kg Export Bag'],
    moq: '25 kg (samples available)',
    highlights: [
      '7x more Vitamin C than oranges',
      '4x more Calcium than milk',
      '3x more Iron than spinach',
      'Rich in all 9 essential amino acids',
      'ORAC value: 157,000 μmol TE/100g',
      'Zero additives — 100% pure Moringa leaf powder',
    ],
    markets: ['USA', 'Germany', 'UK', 'UAE', 'France', 'Japan', 'Australia', 'Canada'],
    applications: ['Health supplements', 'Food fortification', 'Protein bars & snacks', 'Functional beverages', 'Baby food', 'Nutraceuticals'],
    price: 'From USD 3.50/kg (FOB)',
  },
  {
    id: 'onion',
    name: 'Red Onion Powder',
    tagline: 'Premium Dehydrated — Consistent Pungency, 24-Month Shelf Life',
    category: 'Food Ingredient · Dehydrated Grade',
    description: 'Avani Agro Foods Red Onion Powder is made from the finest Indian red onions (N-53 variety), dehydrated at controlled temperatures to preserve Quercetin, sulfur compounds, and authentic flavor.',
    img: '/onion.png',
    hscode: '0712.20.00',
    badge: '🧅 High Demand Product',
    specs: [
      { label: 'Origin', value: 'Maharashtra / Karnataka, India' },
      { label: 'Variety', value: 'Red Onion (N-53, Bhima Shakti)' },
      { label: 'Mesh Size', value: '60-80 mesh' },
      { label: 'Moisture', value: '<7%' },
      { label: 'Pungency', value: '90+ Pyruvic Acid' },
      { label: 'Color', value: 'Light pink to red-purple' },
      { label: 'Shelf Life', value: '24 months' },
      { label: 'HS Code', value: '0712.20.00' },
    ],
    certifications: ['FSSAI', 'APEDA', 'EU MRL Compliant', 'NABL Tested'],
    packSizes: ['500g Retail', '1 kg', '5 kg', '25 kg Multi-wall Bag', '50 kg Export Bag'],
    moq: '100 kg',
    highlights: [
      '12:1 concentration ratio (vs fresh onion)',
      'Consistent pungency — no seasonal variation',
      'No cold chain required',
      'Sulfur compounds fully preserved',
      'Quercetin rich — 90+ pyruvic acid',
      'Nitrogen-flushed packaging for maximum shelf life',
    ],
    markets: ['USA', 'EU', 'UK', 'Middle East', 'Japan', 'Australia', 'South Korea'],
    applications: ['Soups & sauces', 'Instant noodles', 'Snack seasonings', 'Meat processing', 'Ready-to-eat meals', 'Airline catering'],
    price: 'From USD 2.00/kg (FOB)',
  },
]

export default function Products() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    quantity: '',
    requirements: '',
    company: ''
  })

  useEffect(() => {
    let timer
    if (submitted && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000)
    } else if (submitted && countdown === 0) {
      navigate('/quotation-sheet')
    }
    return () => clearInterval(timer)
  }, [submitted, countdown, navigate])

  const handleInquirySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Mapping to match EmailJS template fields
      await sendContactEmail({
        firstName: formData.name,
        lastName: `(Importer from ${formData.country})`,
        email: formData.email,
        inquiryType: `Bulk Quote: ${selectedProduct?.name}`,
        message: `Quantity: ${formData.quantity} kg. Requirements: ${formData.requirements}. Company: ${formData.company}`,
        phone: 'N/A',
        company: formData.company
      })
      
      setLoading(false)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert('Error sending inquiry. Please try again.')
      setLoading(false)
    }
  }

  const openModal = (p) => {
    setSelectedProduct(p)
    setModalOpen(true)
  }

  return (
    <>
      <SEO
        title="Products — Moringa Powder & Red Onion Powder Export"
        description="Premium export-grade Moringa Powder and Red Onion Powder from Avani Agro Foods, Latur. Full specifications, certifications, and B2B pricing for global importers."
        keywords="moringa powder specifications, red onion powder wholesale, moringa export grade india, onion powder B2B"
      />

      <div className="page-top">
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '72px 0', textAlign: 'center' }}>
          <div className="container">
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <Package size={14} /> Product Catalog
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>Export-Grade Products</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 560, margin: '0 auto', fontSize: '1.05rem' }}>
              Two premium, globally certified agricultural products — ready for B2B wholesale, private label, and export.
            </p>
          </div>
        </div>

        <div className="container" style={{ padding: '72px 24px' }}>
          {PRODUCTS.map((product, idx) => (
            <div key={product.id} id={product.id} style={{ marginBottom: 96, scrollMarginTop: 100 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 64, alignItems: 'center' }}>
                <div style={{ order: idx % 2 === 0 ? 0 : 1 }}>
                  <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                    <img src={product.img} alt={product.name} style={{ width: '100%', height: 420, objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 20, left: 20, background: 'var(--color-accent)', color: 'white', fontSize: '0.75rem', fontWeight: 800, borderRadius: 30, padding: '6px 14px' }}>{product.badge}</div>
                    <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: 'white', fontSize: '0.8rem', fontWeight: 700, borderRadius: 8, padding: '8px 14px' }}>
                      HS: {product.hscode}
                    </div>
                  </div>
                </div>

                <div style={{ order: idx % 2 === 0 ? 1 : 0 }}>
                  <span className="badge" style={{ marginBottom: 16, display: 'inline-block' }}>{product.category}</span>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 12 }}>{product.name}</h2>
                  <div style={{ fontSize: '1.1rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 20 }}>{product.tagline}</div>
                  <p style={{ color: 'var(--color-text-light)', lineHeight: 1.75, marginBottom: 28, fontSize: '1.05rem' }}>{product.description}</p>

                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-text-light)', marginBottom: 16 }}>Key Export Highlights</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {product.highlights.map(h => (
                        <div key={h} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.9rem' }}>
                          <CheckCircle size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
                    {product.certifications.map(c => <span key={c} className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>✅ {c}</span>)}
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <button onClick={() => openModal(product)} className="btn btn-primary" style={{ gap: 8, padding: '14px 28px' }}>
                      <Zap size={18} /> Get Global Quote
                    </button>
                    <Link to="/contact" className="btn" style={{ gap: 8 }}>
                      Request Samples <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Specs & Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginTop: 48 }}>
                <div className="card" style={{ padding: '32px' }}>
                  <h3 style={{ fontWeight: 900, marginBottom: 24, fontSize: '1.1rem', borderBottom: '2px solid var(--color-primary)', display: 'inline-block', paddingBottom: 4 }}>Specifications</h3>
                  {product.specs.map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--color-text-light)' }}>{s.label}</span>
                      <span style={{ fontWeight: 700, textAlign: 'right' }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: '32px' }}>
                  <h3 style={{ fontWeight: 900, marginBottom: 24, fontSize: '1.1rem', borderBottom: '2px solid var(--color-primary)', display: 'inline-block', paddingBottom: 4 }}>Export Packaging</h3>
                  {product.packSizes.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <Package size={16} color="var(--color-primary)" />
                      <span style={{ fontSize: '0.9rem' }}>{s}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 24, padding: '16px', background: 'rgba(230,168,23,0.1)', border: '1px solid rgba(230,168,23,0.2)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 800 }}>Minimum Order</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-primary)' }}>{product.moq}</div>
                  </div>
                </div>

                <div className="card" style={{ padding: '32px' }}>
                  <h3 style={{ fontWeight: 900, marginBottom: 16, fontSize: '1.1rem', borderBottom: '2px solid var(--color-primary)', display: 'inline-block', paddingBottom: 4 }}>Global Markets</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32, marginTop: 12 }}>
                    {product.markets.map(m => <span key={m} className="badge" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}><Globe size={12} />{m}</span>)}
                  </div>
                  <h3 style={{ fontWeight: 900, marginBottom: 16, fontSize: '1.1rem', borderBottom: '2px solid var(--color-primary)', display: 'inline-block', paddingBottom: 4 }}>Key Applications</h3>
                  <div style={{ marginTop: 12 }}>
                    {product.applications.map(a => (
                      <div key={a} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.9rem', marginBottom: 10 }}>
                        <Award size={15} color="var(--color-accent)" />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INQUIRY MODAL ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => !loading && setModalOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(26,77,46,0.85)', backdropFilter: 'blur(5px)' }} />
          
          <div className="card animate-in" style={{ position: 'relative', width: '100%', maxWidth: 540, padding: 40, background: 'white', borderRadius: 24, boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
            {!submitted ? (
              <>
                <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, border: 'none', background: 'none', color: 'var(--color-text-light)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Mail size={32} color="var(--color-primary)" />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Inquiry for {selectedProduct?.name}</h2>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Fill details to receive the official B2B quotation sheet.</p>
                </div>

                <form onSubmit={handleInquirySubmit} style={{ display: 'grid', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="label">Contact Name *</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--color-text-light)' }} />
                        <input className="input" style={{ paddingLeft: 40 }} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Business Email *</label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--color-text-light)' }} />
                        <input type="email" className="input" style={{ paddingLeft: 40 }} required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="office@company.com" />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label className="label">Country *</label>
                      <input className="input" required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} placeholder="e.g. USA, Germany" />
                    </div>
                    <div>
                      <label className="label">Est. Quantity (kg) *</label>
                      <input type="number" className="input" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="Min 25" min="25" />
                    </div>
                  </div>

                  <div>
                    <label className="label">Company Name</label>
                    <input className="input" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Global Trade Ltd" />
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', py: 16, fontSize: '1rem', marginTop: 8 }}>
                    {loading ? 'Sending Request...' : 'Get Official Quotation'} <Send size={18} style={{ marginLeft: 8 }} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'scaleUp 0.5s ease' }}>
                  <Check size={40} color="white" />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Inquiry Sent!</h2>
                <p style={{ color: 'var(--color-text-light)', marginBottom: 32, fontSize: '1.05rem' }}>
                  Thank you, <strong>{formData.name}</strong>. Your inquiry has been logged in our Zoho CRM. Our sales team will reach out shortly.
                </p>
                <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: 16, border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 700 }}>
                    Redirecting to Secure Quotation Sheet in...
                  </p>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-primary)', marginTop: 8 }}>
                    {countdown}
                  </div>
                </div>
                <button onClick={() => navigate('/quotation-sheet')} className="btn" style={{ marginTop: 24, fontSize: '0.85rem', textDecoration: 'underline', border: 'none' }}>
                  Click here if not redirected
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .animate-in { animation: slideUp 0.5s ease forwards; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleUp {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}
