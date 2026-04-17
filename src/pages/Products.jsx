import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { WHATSAPP_NUMBER, CATALOG_LINK } from '../data/links'
import { CheckCircle, Package, Globe, Award, Zap, ArrowRight } from 'lucide-react'

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
            <div key={product.id} style={{ marginBottom: 96 }}>
              <div style={{ display: 'grid', gridTemplateColumns: idx % 2 === 0 ? '1fr 1fr' : '1fr 1fr', gap: 64, alignItems: 'center', flexDirection: idx % 2 === 0 ? 'row' : 'row-reverse' }}>
                <div style={{ order: idx % 2 === 0 ? 0 : 1 }}>
                  <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <img src={product.img} alt={product.name} style={{ width: '100%', height: 420, objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 20, left: 20, background: 'var(--color-accent)', color: 'white', fontSize: '0.75rem', fontWeight: 800, borderRadius: 30, padding: '6px 14px' }}>{product.badge}</div>
                    <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: 'white', fontSize: '0.8rem', fontWeight: 700, borderRadius: 8, padding: '8px 14px' }}>
                      HS: {product.hscode}
                    </div>
                  </div>
                </div>

                <div style={{ order: idx % 2 === 0 ? 1 : 0 }}>
                  <span className="badge" style={{ marginBottom: 16, display: 'inline-block' }}>{product.category}</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 12 }}>{product.name}</h2>
                  <div style={{ fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 20 }}>{product.tagline}</div>
                  <p style={{ color: 'var(--color-text-light)', lineHeight: 1.75, marginBottom: 28 }}>{product.description}</p>

                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-text-light)', marginBottom: 14 }}>Key Highlights</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {product.highlights.map(h => (
                        <div key={h} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.85rem' }}>
                          <CheckCircle size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                    {product.certifications.map(c => <span key={c} className="badge">✅ {c}</span>)}
                  </div>

                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: 20 }}>
                    {product.price}
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I need pricing for ${product.name}. Quantity: `)}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ gap: 8 }}>
                      <Zap size={16} /> Get Instant Quote
                    </a>
                    <Link to="/contact" className="btn" style={{ gap: 8 }}>
                      Request Sample <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Specs & Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginTop: 48 }}>
                {/* Specifications */}
                <div className="card" style={{ padding: '28px' }}>
                  <h3 style={{ fontWeight: 900, marginBottom: 20, fontSize: '1rem' }}>Technical Specifications</h3>
                  {product.specs.map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-light)' }}>{s.label}</span>
                      <span style={{ fontWeight: 700, textAlign: 'right' }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Packaging */}
                <div className="card" style={{ padding: '28px' }}>
                  <h3 style={{ fontWeight: 900, marginBottom: 20, fontSize: '1rem' }}>Packaging Options</h3>
                  {product.packSizes.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                      <Package size={14} color="var(--color-primary)" />
                      <span style={{ fontSize: '0.85rem' }}>{s}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: '12px', background: 'rgba(26,77,46,0.08)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                    MOQ: {product.moq}
                  </div>
                </div>

                {/* Markets & Uses */}
                <div className="card" style={{ padding: '28px' }}>
                  <h3 style={{ fontWeight: 900, marginBottom: 16, fontSize: '1rem' }}>Export Markets</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                    {product.markets.map(m => <span key={m} className="badge" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={11} />{m}</span>)}
                  </div>
                  <h3 style={{ fontWeight: 900, marginBottom: 12, fontSize: '1rem' }}>Key Applications</h3>
                  {product.applications.map(a => (
                    <div key={a} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.85rem', marginBottom: 6 }}>
                      <Award size={13} color="var(--color-accent)" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* CTA */}
          <div style={{ textAlign: 'center', padding: '64px 0', borderTop: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 16 }}>Request a Free Sample</h2>
            <p style={{ color: 'var(--color-text-light)', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7 }}>
              We provide free samples (courier cost at buyer) for verified B2B buyers. Contact us with your company details.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={CATALOG_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-primary">📄 Download Full Catalog</a>
              <Link to="/contact" className="btn">📩 Send Inquiry</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
