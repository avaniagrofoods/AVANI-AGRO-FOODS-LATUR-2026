import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../data/links'
import {
  Package, FileText, CheckCircle2, Shield, Info,
  Mail, Phone, Send, ArrowRight, Download, HelpCircle
} from 'lucide-react'

const CATALOG_ITEMS = [
  {
    slug: 'moringa-powder',
    name: 'Moringa Powder (Export Grade)',
    botanicalName: 'Moringa oleifera',
    hsCode: '0712.90.90',
    category: 'Botanical Leaf Powder · Sourcing Coordination',
    img: '/moringa.png',
    overview: 'High-purity dehydrated Moringa oleifera leaf powder coordinated from vetted Indian processing partners in Maharashtra. Screened, dried, and pulverized under hygienic conditions to maintain natural leaf integrity.',
    applications: [
      'Dietary supplement capsules, tablets, and powders',
      'Functional beverages, smoothie mixes, and herbal teas',
      'Food fortification, bakery premixes, and healthy snack bars',
      'Botanical cosmetic preparations and hair/skin masks'
    ],
    appearance: 'Fine homogeneous light-to-vibrant green powder with characteristic mild herbal aroma.',
    specs: [
      { label: 'Botanical Source', value: 'Moringa oleifera (Leaves)' },
      { label: 'Origin', value: 'Maharashtra, India' },
      { label: 'Mesh Size', value: '80–100 Mesh (Fine Powder)' },
      { label: 'Moisture Content', value: '≤ 7.0% (typical)' },
      { label: 'Crude Protein', value: '25–28% (dry basis)' },
      { label: 'Foreign Matter', value: 'Nil / Non-detectable' },
      { label: 'Shelf Life', value: '24 months in sealed original packaging' },
      { label: 'Storage', value: 'Store in cool, dry, dark conditions (<25°C)' }
    ],
    packagingOptions: [
      '1 kg Sample Pack (Pre-shipment testing)',
      '5 kg Food-Grade Poly Liner Bags',
      '20 kg / 25 kg HDPE Drums with Inner Liner',
      '25 kg Multi-Wall Kraft Paper Sacks with Poly Barrier'
    ],
    moq: '100 kg (Commercial B2B Consignments)',
    sampleAvailability: 'Available on request for verified business buyers (courier charges applicable).',
    privateLabel: 'Coordinated with partner packaging facilities based on buyer artwork and minimum batch volumes.',
    documentation: 'Batch COA, Microbiology Assay, Heavy Metals/Pesticides screening, COO, Phytosanitary support coordinated based on destination market.'
  },
  {
    slug: 'red-onion-powder',
    name: 'Red Onion Powder (Dehydrated)',
    botanicalName: 'Allium cepa',
    hsCode: '0712.20.00',
    category: 'Dehydrated Food Ingredient · Sourcing Coordination',
    img: '/onion.png',
    overview: 'Standardized dehydrated Red Onion powder produced from premium Indian red onion crops. Engineered for consistent pungency, extended ambient shelf stability, and uniform dispersion in commercial food recipes.',
    applications: [
      'Dry soup mixes, bouillon cubes, and gravy bases',
      'Snack food seasoning, chips, and extruded coatings',
      'Processed meat products, burger patties, and plant-based protein binders',
      'Ready-to-eat meal kits, culinary spice blends, and marinades'
    ],
    appearance: 'Fine free-flowing light pinkish-tan powder with characteristic sharp, sweet onion aroma.',
    specs: [
      { label: 'Botanical Source', value: 'Allium cepa (Red Onion)' },
      { label: 'Origin', value: 'Maharashtra / Western India' },
      { label: 'Mesh Size', value: '60–80 Mesh' },
      { label: 'Moisture Content', value: '≤ 6.0% (typical)' },
      { label: 'Pungency Index', value: 'High Pyruvic Acid Content' },
      { label: 'Foreign Matter', value: 'Nil / Non-detectable' },
      { label: 'Shelf Life', value: '24 months in sealed barrier packaging' },
      { label: 'Storage', value: 'Store in airtight containers below 25°C, away from direct sunlight' }
    ],
    packagingOptions: [
      '5 kg Sealed Polyethylene Inner Bags',
      '20 kg Corrugated Export Cartons with Moisture Barrier',
      '25 kg Multi-Layer Poly-Lined Export Sacks'
    ],
    moq: '100 kg (Commercial B2B Consignments)',
    sampleAvailability: 'Available on request for verified commercial food processors.',
    privateLabel: 'Available through partner packaging units subject to volume feasibility.',
    documentation: 'Batch Certificate of Analysis, Total Plate Count, Moisture Report, COO, Phytosanitary certificate support.'
  }
]

export default function Catalog() {
  const { slug } = useParams()
  const [selectedProductSlug, setSelectedProductSlug] = useState(slug || 'all')

  const displayedProducts = slug 
    ? CATALOG_ITEMS.filter(item => item.slug === slug)
    : (selectedProductSlug === 'all' ? CATALOG_ITEMS : CATALOG_ITEMS.filter(item => item.slug === selectedProductSlug))

  const activeProduct = slug ? CATALOG_ITEMS.find(item => item.slug === slug) : null

  return (
    <>
      <SEO
        title={activeProduct ? `${activeProduct.name} — B2B Export Catalog | AVANI AGRO FOODS` : 'B2B Agricultural Export Catalog | AVANI AGRO FOODS'}
        description={activeProduct ? activeProduct.overview : 'Digital B2B Product Catalog for Moringa Powder and Red Onion Powder coordinated by AVANI AGRO FOODS from India. Technical specifications, packaging, and commercial terms.'}
        keywords="moringa powder catalog, red onion powder export catalog, B2B spice catalog india, agricultural export specifications"
      />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 80 }}>
        
        {/* Catalog Header Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '72px 0 56px', color: 'white', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 840 }}>
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <Package size={14} /> Official B2B Product Catalog
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: 'white', marginBottom: 16 }}>
              {activeProduct ? activeProduct.name : 'Export Product Catalog'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 auto 24px' }}>
              Baseline product specifications, export packaging configurations, and commercial sourcing parameters coordinated by AVANI AGRO FOODS.
            </p>

            {/* Quick Product Tabs */}
            {!slug && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedProductSlug('all')}
                  className="btn"
                  style={{
                    background: selectedProductSlug === 'all' ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  All Products
                </button>
                <button
                  onClick={() => setSelectedProductSlug('moringa-powder')}
                  className="btn"
                  style={{
                    background: selectedProductSlug === 'moringa-powder' ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  🌿 Moringa Powder
                </button>
                <button
                  onClick={() => setSelectedProductSlug('red-onion-powder')}
                  className="btn"
                  style={{
                    background: selectedProductSlug === 'red-onion-powder' ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  🧅 Red Onion Powder
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Company Profile & Business Model Box */}
        <div className="container" style={{ paddingTop: 40 }}>
          <div className="card" style={{ padding: '28px', background: 'white', borderLeft: '4px solid var(--color-primary)', marginBottom: 48 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)' }}>
                  Company Profile &amp; Role
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '4px 0 8px' }}>
                  {BUSINESS_INFO.name}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.6, margin: 0 }}>
                  <strong>Trade Coordinator:</strong> Sachin Shinde | <strong>Registration:</strong> Udyam / MSME Registered<br />
                  <strong>Location:</strong> {BUSINESS_INFO.address.full}<br />
                  <strong>Email:</strong> {BUSINESS_INFO.email} | <strong>WhatsApp:</strong> {BUSINESS_INFO.phone}
                </p>
              </div>
              <div style={{ background: 'var(--color-bg-alt)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                <strong>Business Model:</strong> AVANI AGRO FOODS operates as a trade coordination and B2B sourcing partner, coordinating with independent manufacturers, processors, and suppliers across India to fulfill commercial export requirements.
              </div>
            </div>
          </div>

          {/* Product Listings */}
          {displayedProducts.map(product => (
            <div key={product.slug} id={product.slug} style={{ marginBottom: 64 }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white' }}>
                
                {/* Header row */}
                <div style={{ padding: '32px', borderBottom: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, alignItems: 'center' }}>
                  <div>
                    <span className="badge" style={{ marginBottom: 8 }}>{product.category}</span>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-text)', marginBottom: 4 }}>{product.name}</h2>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 12 }}>
                      Botanical: <em>{product.botanicalName}</em> | HS Code: {product.hsCode}
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--color-text-light)', lineHeight: 1.7, marginBottom: 20 }}>
                      {product.overview}
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Link to="/contact" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '10px 20px', gap: 6 }}>
                        <Send size={14} /> Request Quotation
                      </Link>
                      <Link to="/contact" className="btn" style={{ fontSize: '0.85rem', padding: '10px 20px', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', gap: 6 }}>
                        Request Sample
                      </Link>
                      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi Sachin, I am reviewing the catalog for ${product.name} and would like to request an RFQ.`)}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '0.85rem', padding: '10px 20px', background: '#25D366', color: 'white', border: 'none' }}>
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div style={{ textAlign: 'center' }}>
                    <img src={product.img} alt={product.name} style={{ width: '100%', maxWidth: 360, height: 240, objectFit: 'cover', borderRadius: 'var(--radius-md)', margin: '0 auto', boxShadow: 'var(--shadow-md)' }} />
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: 8, fontStyle: 'italic' }}>
                      Appearance: {product.appearance}
                    </div>
                  </div>
                </div>

                {/* Technical Specifications Grid */}
                <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
                  
                  {/* Baseline Parameters Card */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)', borderBottom: '2px solid var(--color-primary)', paddingBottom: 8, marginBottom: 16 }}>
                      Baseline Technical Specifications
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {product.specs.map(spec => (
                        <div key={spec.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--color-text-light)' }}>{spec.label}</span>
                          <span style={{ fontWeight: 700, textAlign: 'right' }}>{spec.value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--color-text-light)' }}>
                      *Exact technical specifications subject to buyer requirement and final supplier confirmation.
                    </div>
                  </div>

                  {/* Commercial & Packaging Card */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)', borderBottom: '2px solid var(--color-primary)', paddingBottom: 8, marginBottom: 16 }}>
                      Packaging, MOQ &amp; Lead Time
                    </h3>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: 6 }}>Export Packaging Formats</div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                        {product.packagingOptions.map(pkg => (
                          <li key={pkg}>{pkg}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      <div style={{ background: 'var(--color-bg-alt)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 700 }}>MOQ</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)' }}>{product.moq}</div>
                      </div>
                      <div style={{ background: 'var(--color-bg-alt)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', textTransform: 'uppercase', fontWeight: 700 }}>Samples</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Available</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: 1.5 }}>
                      <strong>Private Label:</strong> {product.privateLabel}<br />
                      <strong>Quality Documentation:</strong> {product.documentation}
                    </div>
                  </div>

                  {/* Applications Card */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)', borderBottom: '2px solid var(--color-primary)', paddingBottom: 8, marginBottom: 16 }}>
                      Food &amp; Formulation Applications
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                      {product.applications.map(app => (
                        <div key={app} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: 'var(--color-text)' }}>
                          <CheckCircle2 size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{app}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: '14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#166534', lineHeight: 1.5 }}>
                      <Shield size={14} style={{ display: 'inline', marginRight: 4 }} />
                      <strong>Compliance Statement:</strong> Batch testing reports (COA), microbiological screening, and destination-specific certifications are coordinated directly with qualified partner processors.
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ))}

          {/* Sourcing Action Banner */}
          <div style={{ padding: '40px', background: 'linear-gradient(135deg, var(--color-primary), #2d8f5c)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'white' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12 }}>
              Have a Custom Specification or Volume Requirement?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', maxWidth: 640, margin: '0 auto 24px', lineHeight: 1.7 }}>
              Submit your required mesh size, packaging format, target Incoterm (FOB / CIF), and destination port for an indicative quotation from AVANI AGRO FOODS.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-primary" style={{ background: 'var(--color-accent)', color: 'white' }}>
                Send Product Requirement
              </Link>
              <Link to="/trade-coordination" className="btn" style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 800 }}>
                Learn How We Coordinate Sourcing
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
