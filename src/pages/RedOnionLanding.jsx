import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import B2BRFQForm from '../components/B2BRFQForm'
import { SOURCING_PRODUCTS, TRADE_COORDINATION_POLICY, CERTIFICATION_FRAMEWORK } from '../data/centralProductConfig'
import { getWhatsAppInquiryUrl } from '../data/links'
import { 
  CheckCircle2, Shield, Package, Globe, Truck, FileText, 
  Award, HelpCircle, ArrowRight, Phone, Mail, ChevronDown, Check,
  Flame, Utensils, Layers, Clock, AlertCircle
} from 'lucide-react'

export default function RedOnionLanding() {
  const [openFaq, setOpenFaq] = useState(null)
  const product = SOURCING_PRODUCTS.redOnion
  const waUrl = getWhatsAppInquiryUrl('Dehydrated Red Onion Powder', 'Red Onion Bulk Supplier Page')

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const faqs = [
    {
      q: 'What is the Minimum Order Quantity (MOQ) for bulk Red Onion Powder?',
      a: 'Our standard commercial MOQ is 100 kg for commercial trials. For maritime containerized export, a standard 20ft Full Container Load (FCL) accommodates approximately 14 to 16 Metric Tons (MT) in 20 kg export cartons or 25 kg poly-lined multi-wall bags. Palletized LCL shipments are also supported.'
    },
    {
      q: 'Does AVANI AGRO FOODS own dehydrator manufacturing plants?',
      a: 'No. AVANI AGRO FOODS operates as an independent Indian agricultural trade coordination business headquartered in Latur, Maharashtra. We coordinate commercial procurement, processing oversight, third-party laboratory verification, and export execution with vetted, FSSAI-licensed dehydration facilities in the Maharashtra onion belt. We never make false claims of factory ownership.'
    },
    {
      q: 'How do you prevent clumping and moisture absorption during ocean transit?',
      a: 'Dehydrated red onion powder is hygroscopic due to its natural fruit and vegetable sugars. We coordinate export packing inside 5 kg vacuum-sealed high-barrier poly bags or double virgin food-grade PE liners packed in heavy-duty 20 kg corrugated export master cartons with silica desiccant pouches. This guarantees moisture levels stay ≤ 6.0% throughout tropical and maritime transit.'
    },
    {
      q: 'What onion varieties are used and how is pungency standardized?',
      a: 'Our processor partners utilize high-solids Indian red onion varieties (predominantly N-53, Bhima Shakti, and Dark Red) grown in the Nashik, Pune, and Latur agricultural belts. Dehydration is carried out under controlled temperatures to retain volatile sulfur compounds (high pyruvic acid concentration), delivering consistent commercial flavor impact.'
    },
    {
      q: 'What export Incoterms and sea ports do you coordinate?',
      a: 'Shipments depart through Nhava Sheva (JNPT Mumbai, Port Code: INNSA), India’s primary international container port. We provide FOB Nhava Sheva as well as CIF / CFR to international ports including New York, Long Beach, Felixstowe, Rotterdam, Jebel Ali, Hamburg, and Sydney. Air cargo via Mumbai (BOM) is available for express commercial trial batches.'
    },
    {
      q: 'Can we test representative pre-shipment lot samples in our seasoning recipes?',
      a: 'Yes. We coordinate representative 100g to 500g pre-shipment evaluation samples from the allocated lot for verified commercial food processors, spice blenders, and importers. Samples are sent via DHL or FedEx Express along with preliminary batch COA parameters.'
    }
  ]

  // SEO Schema
  const schema = [
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.avaniagrofoods.com/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Products', 'item': 'https://www.avaniagrofoods.com/products' },
        { '@type': 'ListItem', 'position': 3, 'name': 'Red Onion Powder Bulk Supplier India', 'item': 'https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india' }
      ]
    },
    {
      '@type': 'Product',
      'name': 'Dehydrated Red Onion Powder (Bulk Export Grade)',
      'image': 'https://www.avaniagrofoods.com/onion.png',
      'description': 'Industrial-grade dehydrated Indian Red Onion Powder. Standardized 60–80 mesh, ≤ 6.0% moisture, high pyruvic acid pungency, batch NABL laboratory COA. Coordinated FOB Nhava Sheva & CIF world ports by AVANI AGRO FOODS.',
      'sku': 'AAF-ONN-EXP-01',
      'mpn': '07122000',
      'brand': {
        '@type': 'Brand',
        'name': 'AVANI AGRO FOODS'
      },
      'offers': {
        '@type': 'AggregateOffer',
        'priceCurrency': 'USD',
        'lowPrice': '3.20',
        'highPrice': '5.80',
        'offerCount': '1',
        'availability': 'https://schema.org/InStock',
        'seller': {
          '@type': 'Organization',
          'name': 'AVANI AGRO FOODS'
        }
      }
    },
    {
      '@type': 'FAQPage',
      'mainEntity': faqs.map(f => ({
        '@type': 'Question',
        'name': f.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': f.a
        }
      }))
    }
  ]

  const relatedArticles = [
    {
      title: 'What is Red Onion Powder? Complete B2B Buyer’s Sourcing Guide',
      slug: 'what-is-red-onion-powder-complete-b2b-buyers-guide',
      excerpt: 'Comprehensive overview of Indian dehydration technology, bulb-to-powder conversion ratios (10:1), and quality parameters.'
    },
    {
      title: 'Red Onion Powder Specifications: Mesh, Moisture & Pyruvic Acid',
      slug: 'red-onion-powder-specifications-mesh-moisture-pyruvic-acid',
      excerpt: 'Technical deep-dive on 60–80 mesh particle sizes, pyruvic acid index measurement, and ash tolerances for industrial seasoning.'
    },
    {
      title: 'Red Onion Powder Applications in Commercial Food Manufacturing',
      slug: 'red-onion-powder-applications-food-manufacturing',
      excerpt: 'Formulation strategies for dry soup mixes, snack seasonings, meat processing, and culinary sauce manufacture.'
    },
    {
      title: 'Red Onion Powder Packaging, Moisture Control & Bulk Storage',
      slug: 'red-onion-powder-packaging-moisture-control-bulk-storage',
      excerpt: 'Best practices for vacuum barrier packaging, desiccants, and ambient warehouse storage to prevent clumping.'
    }
  ]

  return (
    <div className="page-top" style={{ paddingBottom: 80 }}>
      <SEO
        title="Red Onion Powder Bulk Supplier India | Dehydrated B2B Wholesale"
        description="Bulk dehydrated Red Onion Powder from Maharashtra, India. 60–80 mesh, ≤6% moisture, high pyruvic acid pungency, batch NABL COA, FOB Nhava Sheva & CIF world ports."
        keywords="red onion powder bulk supplier india, dehydrated red onion powder wholesale, indian onion powder exporter, red onion powder FOB nhava sheva, bulk onion powder food manufacturing"
        image="https://www.avaniagrofoods.com/onion.png"
        schema={schema}
      />

      {/* ── 1. HERO SECTION ────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #2a111a 0%, #4a1928 60%, #35121e 100%)',
        color: '#ffffff',
        padding: '70px 24px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Breadcrumb */}
          <nav style={{ fontSize: '0.85rem', color: '#fbcfe8', marginBottom: 20 }}>
            <Link to="/" style={{ color: '#fbcfe8', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <Link to="/products" style={{ color: '#fbcfe8', textDecoration: 'none' }}>Products</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: '#ffffff' }}>Red Onion Powder Bulk Supplier India</span>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                background: 'rgba(244, 114, 182, 0.15)',
                border: '1px solid rgba(244, 114, 182, 0.35)',
                borderRadius: 999,
                fontSize: '0.85rem',
                color: '#f472b6',
                fontWeight: 700,
                marginBottom: 20
              }}>
                <Flame size={16} />
                Dehydrated Vegetable Ingredient · Sourcing Coordination
              </div>

              <h1 style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.2rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#ffffff',
                marginBottom: 20,
                letterSpacing: '-0.02em'
              }}>
                Bulk Dehydrated Red Onion Powder Supplier & Export Coordinator from India
              </h1>

              <p style={{
                fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
                color: '#fce7f3',
                lineHeight: 1.6,
                marginBottom: 28,
                maxWidth: 620
              }}>
                Standardized dehydrated red onion powder processed from high-solids Maharashtra crops (Nashik/Latur belt). Engineered for intense pungency (high pyruvic acid), standardized 60–80 mesh particle size, ≤ 6.0% moisture, and batch analytical verification through independent NABL-accredited laboratories. Full container loads via Nhava Sheva (JNPT Mumbai) to USA, Europe, UK, GCC, and worldwide.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 36 }}>
                <a
                  href="#rfq-section"
                  className="btn btn-primary"
                  style={{
                    padding: '15px 30px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    borderRadius: 12,
                    background: '#f43f5e',
                    color: '#ffffff',
                    boxShadow: '0 10px 25px rgba(244, 63, 94, 0.35)'
                  }}
                >
                  Request Bulk Quotation (RFQ)
                </a>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{
                    padding: '15px 24px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 12,
                    color: '#ffffff',
                    borderColor: 'rgba(255,255,255,0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Phone size={18} />
                  WhatsApp Trade Desk
                </a>
              </div>

              {/* Trust Badges */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 12,
                borderTop: '1px solid rgba(255,255,255,0.12)',
                paddingTop: 24
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#fbcfe8' }}>Entity Type</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>Udyam / MSME Direct</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#fbcfe8' }}>Pungency Profile</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>High Pyruvic Acid</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#fbcfe8' }}>Export Port</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>JNPT Nhava Sheva</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#fbcfe8' }}>Container FCL</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>~14–16 MT (20ft)</div>
                </div>
              </div>
            </div>

            {/* Product Image Card */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 24,
                padding: 24,
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                maxWidth: 440,
                margin: '0 auto'
              }}>
                <img
                  src="/onion.png"
                  alt="Dehydrated Red Onion Powder Bulk Supplier India"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 16,
                    objectFit: 'cover',
                    maxHeight: 320
                  }}
                  loading="eager"
                />
                <div style={{ marginTop: 18, textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>Allium cepa L. Powder</span>
                    <span style={{ background: '#f43f5e', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                      HS 0712.20.00
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#fce7f3', margin: 0 }}>
                    Pure single-ingredient dehydrated red onion powder. Standardized 60–80 mesh, rich aromatic pungency, moisture ≤ 6.0%. 10:1 concentration ratio over raw bulb.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SOURCING TRANSPARENCY BANNER (OPERATING MODEL) ────────── */}
      <section style={{ maxWidth: 1200, margin: '-30px auto 40px', padding: '0 24px', position: 'relative', zIndex: 3 }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '24px 28px',
          boxShadow: '0 10px 35px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 780 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#fdf2f8',
              color: '#db2777',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Shield size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                Independent Indian Agricultural Trade Coordinator
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {TRADE_COORDINATION_POLICY.operatingModelStatement}
              </p>
            </div>
          </div>
          <div>
            <Link to="/trade-coordination" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '10px 18px', whiteSpace: 'nowrap' }}>
              Learn About Our Model →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. PRODUCT SPECIFICATIONS TABLE ────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '60px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#be185d', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Technical Profile & Export Standards
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
            Indicative Export Specifications: Dehydrated Red Onion Powder
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 640, margin: '0 auto' }}>
            All parameters represent standard export-grade commercial lots. Batch-specific Certificates of Analysis issued by NABL-accredited laboratories are confirmed prior to shipment.
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#fdf2f8', borderBottom: '2px solid #fbcfe8' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#831843', textTransform: 'uppercase' }}>Parameter</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#831843', textTransform: 'uppercase' }}>Standard Export Value</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#831843', textTransform: 'uppercase' }}>Verification Protocol</th>
                </tr>
              </thead>
              <tbody>
                {product.indicativeSpecifications.map((spec, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#fdfafc' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
                      {spec.label}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#334155', fontSize: '0.92rem', fontWeight: 500 }}>
                      {spec.value}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '0.85rem' }}>
                      {spec.verified ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600 }}>
                          <CheckCircle2 size={16} /> Verified Parameter
                        </span>
                      ) : (
                        <span>{spec.note || 'Confirmed via Batch COA'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '14px 20px', background: '#fdf2f8', borderTop: '1px solid #fbcfe8', fontSize: '0.82rem', color: '#831843' }}>
            * Note: Custom mesh sizing (60–80 mesh for topical seasonings, 80–100 mesh for bouillon cubes) and free-flow anti-caking aids (silicon dioxide) strictly per buyer specification.
          </div>
        </div>
      </section>

      {/* ── 4. APPLICATIONS IN FOOD MANUFACTURING ──────────────────── */}
      <section style={{ background: '#fdfafc', padding: '70px 24px', borderTop: '1px solid #fce7f3', borderBottom: '1px solid #fce7f3' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#be185d', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Industrial Formulation Scope
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
              Commercial Applications for Dehydrated Red Onion Powder
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 640, margin: '0 auto' }}>
              Eliminates fresh bulb peeling waste, high water content, and cold chain costs while delivering uniform aroma, extended ambient shelf life, and predictable hydration.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              {
                icon: Utensils,
                title: 'Snack Seasonings & Topical Rubs',
                desc: 'Fine 60–80 mesh sizing provides uniform electrostatic adhesion to potato chips, tortilla chips, extruded snack curls, and commercial barbecue dry rubs without dusting off.'
              },
              {
                icon: Layers,
                title: 'Dry Soups, Bouillons & Gravies',
                desc: 'Rehydrates rapidly in boiling water without forming chewy clumps. Delivers rich umami and aromatic depth to instant noodle seasoning sachets, dehydrated stews, and sauce premixes.'
              },
              {
                icon: Flame,
                title: 'Processed Meats & Plant Proteins',
                desc: 'Standardized microbial thresholds make it safe for incorporation into sausages, burger patties, meat marinades, and textured soy/pea protein vegan meat binders.'
              },
              {
                icon: Award,
                title: 'Canned Foods & Food Service RTE',
                desc: 'Eliminates moisture dilution in commercial recipe batches, providing standardized flavor across seasonal harvest variations with 24-month ambient shelf life.'
              }
            ].map((app, i) => (
              <div 
                key={i}
                style={{
                  background: '#ffffff',
                  padding: 28,
                  borderRadius: 16,
                  border: '1px solid #fce7f3',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#fdf2f8',
                  color: '#be185d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18
                }}>
                  <app.icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                  {app.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                  {app.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. THREE-TIER CERTIFICATION GOVERNANCE ─────────────────── */}
      <section style={{ maxWidth: 1200, margin: '70px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Compliance & Documentation Integrity
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
            Three-Tier Quality & Certification Architecture
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 680, margin: '0 auto' }}>
            We strictly differentiate between our direct government trade registrations, the food safety certifications of our audited processor partners, and batch-specific laboratory test reports.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Tier 1 */}
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: 28,
            border: '2px solid #e2e8f0',
            boxShadow: '0 8px 25px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: '#f1f5f9',
              color: '#334155',
              borderRadius: 6,
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: 14
            }}>
              Tier 1: Direct Trade Entity
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              AVANI AGRO FOODS
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 20 }}>
              Direct government registrations held in our company name:
            </p>
            <ul style={{ paddingLeft: 18, margin: 0, color: '#334155', fontSize: '0.9rem', lineHeight: 1.7 }}>
              {CERTIFICATION_FRAMEWORK.directRegistrations.map((d, i) => (
                <li key={i}>
                  <strong>{d.name}:</strong> {d.description}
                </li>
              ))}
            </ul>
          </div>

          {/* Tier 2 */}
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: 28,
            border: '2px solid #e2e8f0',
            boxShadow: '0 8px 25px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: '#fdf2f8',
              color: '#be185d',
              borderRadius: 6,
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: 14
            }}>
              Tier 2: Processing Partners
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Partner Facility Compliance
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 20 }}>
              Food safety and hygiene certifications of our vetted dehydration units:
            </p>
            <ul style={{ paddingLeft: 18, margin: 0, color: '#334155', fontSize: '0.9rem', lineHeight: 1.7 }}>
              {CERTIFICATION_FRAMEWORK.partnerFacilityCertifications.map((p, i) => (
                <li key={i}>
                  <strong>{p.name}:</strong> {p.description}
                </li>
              ))}
            </ul>
          </div>

          {/* Tier 3 */}
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            padding: 28,
            border: '2px solid #f43f5e',
            boxShadow: '0 8px 25px rgba(244, 63, 94, 0.08)'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: '#ffe4e6',
              color: '#e11d48',
              borderRadius: 6,
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: 14
            }}>
              Tier 3: Batch Analytical Reports
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Independent NABL Testing
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: 20 }}>
              Mandatory third-party laboratory documentation provided for every shipment:
            </p>
            <ul style={{ paddingLeft: 18, margin: 0, color: '#334155', fontSize: '0.9rem', lineHeight: 1.7 }}>
              {CERTIFICATION_FRAMEWORK.batchSpecificDocumentation.map((b, i) => (
                <li key={i}>
                  <strong>{b.name}:</strong> {b.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 6. PACKAGING & GLOBAL LOGISTICS ────────────────────────── */}
      <section style={{ background: '#fdfafc', padding: '70px 24px', borderTop: '1px solid #fce7f3', borderBottom: '1px solid #fce7f3' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#be185d', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Maritime Export & Packaging
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
              Export Packaging Options & Seaport Logistics
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 640, margin: '0 auto' }}>
              Hermetic barrier solutions designed to stop atmospheric humidity absorption and cake formation during transoceanic shipping.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, border: '1px solid #fce7f3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <Package size={24} color="#be185d" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Packaging Specifications
                </h3>
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
                <li><strong>20 kg Heavy-Duty Corrugated Cartons:</strong> With 4 x 5kg vacuum-sealed high-barrier inner poly bags.</li>
                <li><strong>25 kg Poly-Lined Multi-Wall Sacks:</strong> 5-ply Kraft sacks with heavy gauge heat-sealed food-grade PE liner.</li>
                <li><strong>Desiccant Pouch Placement:</strong> Active food-grade silica gel pouches inserted to absorb headspace moisture.</li>
                <li><strong>Stretch-Wrapped Palletization:</strong> Heat-treated ISPM-15 wooden or plastic pallets wrapped with anti-UV film.</li>
                <li><strong>Custom Barcode Labelling:</strong> Full buyer trace codes, gross/net weights, and country of origin markings.</li>
              </ul>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, border: '1px solid #fce7f3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <Truck size={24} color="#be185d" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Logistics & Port Operations
                </h3>
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
                <li><strong>Primary Seaport:</strong> Nhava Sheva (JNPT Mumbai, Port Code: INNSA) — direct access from the Maharashtra onion belt.</li>
                <li><strong>20ft FCL Capacity:</strong> Approx. 14,000 to 16,000 kg depending on palletization and packaging mode.</li>
                <li><strong>40ft High Cube (HC):</strong> Approx. 24,000 to 26,000 kg.</li>
                <li><strong>Express Air Cargo:</strong> Mumbai International Airport (BOM) for fast pilot orders and sample evaluations.</li>
                <li><strong>Incoterms Supported:</strong> FOB Nhava Sheva, CIF Destination Seaport, CFR, and EXW Partner Plant.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. EMBEDDED RFQ FORM SECTION ───────────────────────────── */}
      <section id="rfq-section" style={{ maxWidth: 1200, margin: '80px auto', padding: '0 24px' }}>
        <B2BRFQForm
          defaultProduct="Dehydrated Red Onion Powder"
          formTitle="Request a Bulk Red Onion Powder Quotation (RFQ)"
          formSubtitle="Receive indicative FOB Nhava Sheva or CIF destination pricing, specification sheets, and batch allocation data within 24 hours."
          sourcePage="Red_Onion_Landing_Page"
        />
      </section>

      {/* ── 8. WHATSAPP FAST DESK CALLOUT ──────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto 70px', padding: '0 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #128c7e 0%, #075e54 100%)',
          borderRadius: 20,
          padding: '32px',
          color: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 15px 40px rgba(7, 94, 84, 0.25)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
              Need Immediate Commercial Clarification?
            </h3>
            <p style={{ color: '#e6fffa', fontSize: '0.95rem', margin: 0, maxWidth: 520 }}>
              Speak directly with Trade Coordinator Sachin Shinde on WhatsApp for immediate lot availability, sample courier booking, or custom specification confirmation.
            </p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              background: '#25d366',
              color: '#075e54',
              fontWeight: 800,
              padding: '14px 26px',
              borderRadius: 12,
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Phone size={18} />
            Connect on WhatsApp (+91 7219053645)
          </a>
        </div>
      </section>

      {/* ── 9. FREQUENTLY ASKED QUESTIONS ───────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#be185d', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Procurement FAQs
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
            Frequently Asked Questions for International Buyers
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Essential answers on minimums, moisture prevention, operating model, and maritime export execution.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  borderRadius: 14,
                  border: isOpen ? '1px solid #f43f5e' : '1px solid #e2e8f0',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '18px 22px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0f172a'
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    color={isOpen ? '#e11d48' : '#64748b'}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                      marginLeft: 12
                    }}
                  />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 22px 20px', color: '#475569', fontSize: '0.92rem', lineHeight: 1.6, borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ margin: '12px 0 0' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 10. CONTEXTUAL RELATED ARTICLES ────────────────────────── */}
      <section style={{ background: '#fdfafc', padding: '70px 24px 80px', borderTop: '1px solid #fce7f3' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#be185d', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              B2B Knowledge Base
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
              Related Red Onion Sourcing & Technical Guides
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Explore comprehensive commercial guides prepared by Trade Coordinator Sachin Shinde.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {relatedArticles.map((art, idx) => (
              <div 
                key={idx}
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: 24,
                  border: '1px solid #fce7f3',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 10, lineHeight: 1.4 }}>
                    {art.title}
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.86rem', lineHeight: 1.5, margin: 0 }}>
                    {art.excerpt}
                  </p>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Link
                    to={`/blog/${art.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#be185d',
                      textDecoration: 'none'
                    }}
                  >
                    Read Technical Guide <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
