import SEO from '../components/SEO'
import { STRIPE_LINKS, WHATSAPP_NUMBER, CATALOG_LINK } from '../data/links'
import { Package, Globe, Zap, CheckCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const PRODUCTS = [
  {
    name: 'Moringa Powder — 25 kg Export Bag',
    desc: 'Export Grade A, 60-mesh, <7% moisture. Full documentation included.',
    img: 'https://images.unsplash.com/photo-1556909114-44e1de269b20?w=600&q=80',
    priceINR: '₹8,750',
    priceUSD: '$105',
    includes: ['Certificate of Analysis', 'Phytosanitary Certificate', 'Packing List'],
    stripeIN: STRIPE_LINKS.INDIA.MONTHLY,
    stripeGlobal: STRIPE_LINKS.GLOBAL.MONTHLY,
    badge: 'Bestseller',
    hs: '0712.90.90',
    moq: '25 kg',
  },
  {
    name: 'Red Onion Powder — 25 kg Export Bag',
    desc: 'Dehydrated Export Grade, 60-80 mesh, Pyruvic Acid 90+, 24-month shelf life.',
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    priceINR: '₹5,250',
    priceUSD: '$63',
    includes: ['Certificate of Analysis', 'Certificate of Origin', 'Health Certificate'],
    stripeIN: STRIPE_LINKS.INDIA.YEARLY,
    stripeGlobal: STRIPE_LINKS.GLOBAL.YEARLY,
    badge: 'High Demand',
    hs: '0712.20.00',
    moq: '25 kg',
  },
  {
    name: 'Mixed Bundle — Moringa + Onion (25 kg each)',
    desc: 'Trial combo pack for new importers. 25 kg Moringa + 25 kg Onion Powder.',
    img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
    priceINR: '₹13,500',
    priceUSD: '$162',
    includes: ['Full documentation for both products', 'Separate CoA', 'Combined Invoice'],
    stripeIN: STRIPE_LINKS.INDIA.THREE_YEARS,
    stripeGlobal: STRIPE_LINKS.GLOBAL.THREE_YEARS,
    badge: 'Best Value',
    hs: 'Multiple',
    moq: '50 kg total',
  },
]

const TERMS_DATA = [
  { label: 'Payment Terms', value: '30% advance, 70% before shipment (or LC at sight)' },
  { label: 'Lead Time', value: '14-21 working days from PO confirmation' },
  { label: 'Delivery Terms', value: 'FOB Nhava Sheva / CIF Destination' },
  { label: 'Packaging', value: 'Multi-wall kraft bags, nitrogen-flushed' },
  { label: 'Minimum Order', value: '25 kg (samples) / 100 kg (bulk)' },
  { label: 'Documents Provided', value: 'CoA, Phytosanitary, Health Cert, CoO, Invoice, BL' },
  { label: 'Samples', value: 'Free samples (courier at buyer cost) for verified buyers' },
  { label: 'Certification', value: 'FSSAI, APEDA, ISO Compliant — documents on request' },
]

export default function B2BStore() {
  return (
    <>
      <SEO
        title="B2B Store — Bulk Moringa Powder & Onion Powder"
        description="Order Moringa Powder and Red Onion Powder directly from Avani Agro Foods. B2B bulk pricing, export documentation, and worldwide shipping."
        keywords="moringa powder wholesale india, buy moringa bulk, red onion powder B2B, moringa export order"
      />

      <div className="page-top">
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '72px 0', textAlign: 'center' }}>
          <div className="container">
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <Globe size={14} /> B2B Export Store
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>Order Directly from Source</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 540, margin: '0 auto 32px', fontSize: '1.05rem' }}>
              No middlemen. Factory-direct pricing. Complete documentation. Ship to USA, EU, UAE, and 25+ countries.
            </p>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I want to place a bulk B2B order. Please share your price list.')}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ gap: 8 }}>
              <Zap size={18} /> Get Wholesale Price List
            </a>
          </div>
        </div>

        <div className="container" style={{ padding: '72px 24px' }}>
          {/* Products */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32, marginBottom: 80 }}>
            {PRODUCTS.map(p => (
              <div key={p.name} className="card card-hover" style={{ overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
                  <img src={p.img} alt={p.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 14, left: 14, background: 'var(--color-accent)', color: 'white', fontSize: '0.7rem', fontWeight: 800, borderRadius: 30, padding: '4px 12px' }}>{p.badge}</div>
                  <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.68rem', fontWeight: 700, borderRadius: 8, padding: '4px 10px' }}>HS: {p.hs}</div>
                </div>
                <div style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: 10, lineHeight: 1.3 }}>{p.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', lineHeight: 1.65, marginBottom: 16 }}>{p.desc}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>India Price</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-primary)' }}>{p.priceINR}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Global Price</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-accent)' }}>{p.priceUSD}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    {p.includes.map(inc => (
                      <div key={inc} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', marginBottom: 6 }}>
                        <CheckCircle size={13} color="var(--color-primary)" />
                        {inc}
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: 20 }}>
                    <strong>MOQ:</strong> {p.moq}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <a href={p.stripeIN} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ justifyContent: 'center', gap: 8 }}>
                      🇮🇳 Order India (Stripe)
                    </a>
                    <a href={p.stripeGlobal} target="_blank" rel="noopener noreferrer" className="btn" style={{ justifyContent: 'center', gap: 8, background: 'var(--color-accent)', color: 'white' }}>
                      🌍 Order Global (Stripe)
                    </a>
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I want to order: ${p.name}`)}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ justifyContent: 'center', gap: 8, background: '#25D366', color: 'white' }}>
                      📱 Order via WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Terms */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'flex-start' }}>
            <div className="card" style={{ padding: '36px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 24 }}>📋 Trade Terms & Conditions</h2>
              {TERMS_DATA.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-light)', minWidth: 160, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="card" style={{ padding: '36px', marginBottom: 24, background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>Need a Custom Quote?</h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 24 }}>
                  For quantities above 100 kg, LCL/FCL container loads, or custom packaging — contact us for special pricing.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I need a custom quote for bulk Moringa/Onion Powder order.')}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#25D366', color: 'white', justifyContent: 'center' }}>
                    📱 WhatsApp for Custom Quote
                  </a>
                  <Link to="/contact" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', justifyContent: 'center' }}>
                    📩 Send Email Inquiry
                  </Link>
                </div>
              </div>

              <div className="card" style={{ padding: '28px' }}>
                <h3 style={{ fontWeight: 900, marginBottom: 16 }}>Why Buy Direct?</h3>
                {['No middleman markup — lowest factory prices', 'Full documentation from day 1', 'Sample before bulk order — always', 'Dedicated WhatsApp support', 'Fastest 14-21 day lead time', 'White-label and OEM accepted'].map(b => (
                  <div key={b} style={{ display: 'flex', gap: 8, marginBottom: 10, fontSize: '0.85rem' }}>
                    <CheckCircle size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
