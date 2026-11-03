import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import B2BRFQForm from '../components/B2BRFQForm'
import { SOURCING_PRODUCTS, TRADE_COORDINATION_POLICY, CERTIFICATION_FRAMEWORK } from '../data/centralProductConfig'
import { getWhatsAppInquiryUrl } from '../data/links'
import { 
  CheckCircle2, Shield, Package, Globe, Truck, FileText, 
  Award, HelpCircle, ArrowRight, Phone, Mail, ChevronDown, Check,
  Leaf, Beaker, Layers, Clock, AlertCircle
} from 'lucide-react'

export default function MoringaLanding() {
  const [openFaq, setOpenFaq] = useState(null)
  const product = SOURCING_PRODUCTS.moringa
  const waUrl = getWhatsAppInquiryUrl('Moringa Powder', 'Moringa Bulk Supplier Page')

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const faqs = [
    {
      q: 'What is the Minimum Order Quantity (MOQ) for bulk Moringa Powder?',
      a: 'Our standard commercial MOQ is 100 kg for trial consignments. For full commercial maritime export, we coordinate Full Container Loads (20ft FCL holds approx. 8–10 MT of Moringa Powder in 25 kg fiber drums or multi-wall sacks). Palletized LCL orders are also supported.'
    },
    {
      q: 'Does AVANI AGRO FOODS own manufacturing factories or farming estates?',
      a: 'No. AVANI AGRO FOODS operates strictly as an independent Indian agricultural trade coordination business headquartered in Latur, Maharashtra. We coordinate commercial procurement, processing oversight, third-party laboratory verification, and export documentation with vetted, FSSAI-licensed regional facilities. We do not make false claims of factory ownership.'
    },
    {
      q: 'How is batch quality, heavy metal content, and microbiological safety verified?',
      a: 'Each commercial shipment undergoes rigorous testing through independent, third-party NABL-accredited (ISO/IEC 17025) analytical laboratories (such as Eurofins, SGS, Vimta, or TUV). Every lot is accompanied by a formal Certificate of Analysis (COA) confirming mesh size, moisture (≤ 7%), heavy metals (Lead, Cadmium, Arsenic, Mercury), and microbial counts (TPC, Yeast & Mold, E. coli, Salmonella).'
    },
    {
      q: 'Can international buyers request pre-shipment evaluation samples?',
      a: 'Yes. We coordinate representative 100g to 500g pre-shipment evaluation samples from the allocated processor batch for verified commercial buyers, food processors, and importers. Samples are dispatched via DHL or FedEx Express along with preliminary batch test parameters.'
    },
    {
      q: 'What export Incoterms and sea ports do you support?',
      a: 'Our primary export sea gate is Nhava Sheva (JNPT Mumbai, Port Code: INNSA), India’s largest container port located in Maharashtra. We offer FOB Nhava Sheva as well as CIF / CFR to major seaports including New York, Long Beach, Felixstowe, Rotterdam, Hamburg, Jebel Ali, and Sydney. Air cargo shipments via Mumbai Air Cargo (BOM) are available for urgent orders.'
    },
    {
      q: 'What are the packaging standards for ocean freight to prevent moisture pickup?',
      a: 'Moringa powder is highly hygroscopic. We coordinate export packing using 25 kg food-grade HDPE drums or 5-ply multi-wall Kraft paper sacks, lined with double virgin polyethylene (PE) food-grade inner barriers with silica desiccant pouches. Vacuum-sealed inner bags are available upon buyer specification.'
    }
  ]

  // SEO Schema
  const schema = [
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.avaniagrofoods.com/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Products', 'item': 'https://www.avaniagrofoods.com/products' },
        { '@type': 'ListItem', 'position': 3, 'name': 'Moringa Powder Bulk Supplier India', 'item': 'https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india' }
      ]
    },
    {
      '@type': 'Product',
      'name': 'Moringa Powder (Bulk Export Grade)',
      'image': 'https://www.avaniagrofoods.com/moringa.png',
      'description': 'Export-grade dehydrated Indian Moringa oleifera leaf powder. Standardized 80–100 mesh, ≤ 7.0% moisture, batch NABL laboratory COA. Coordinated FOB Nhava Sheva & CIF world ports by AVANI AGRO FOODS.',
      'sku': 'AAF-MOR-EXP-01',
      'mpn': '12119029',
      'brand': {
        '@type': 'Brand',
        'name': 'AVANI AGRO FOODS'
      },
      'offers': {
        '@type': 'AggregateOffer',
        'priceCurrency': 'USD',
        'lowPrice': '6.50',
        'highPrice': '12.00',
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
      title: 'Moringa Powder Export from India: International Buyer Guide',
      slug: 'moringa-powder-export-from-india-international-buyer-guide',
      excerpt: 'Comprehensive procedural walkthrough covering documentation, APEDA regulations, phytosanitary requirements, and port logistics from Nhava Sheva.'
    },
    {
      title: 'Moringa Powder Quality Checklist for Bulk Buyers',
      slug: 'moringa-powder-quality-checklist-bulk-buyers',
      excerpt: '10 essential testing criteria every procurement team should inspect before confirming Indian bulk moringa container shipments.'
    },
    {
      title: 'Moringa Powder Specifications: Mesh, Moisture & Microbiology Standards',
      slug: 'moringa-powder-specifications-mesh-moisture-microbiology-standards',
      excerpt: 'Detailed analysis of 80 vs 100 mesh, moisture thresholds (≤7%), and microbial limits required for US FDA and EU compliance.'
    },
    {
      title: 'Moringa Powder Packaging & Storage for International Buyers',
      slug: 'moringa-powder-packaging-storage-international-buyers',
      excerpt: 'Moisture-barrier engineering: HDPE drums, multi-wall Kraft sacks, vacuum sealing, and temperature management during ocean transit.'
    }
  ]

  return (
    <div className="page-top" style={{ paddingBottom: 80 }}>
      <SEO
        title="Moringa Powder Bulk Supplier India | Export Grade B2B Wholesale"
        description="Source export-grade Indian Moringa oleifera leaf powder in bulk. 80–100 mesh, ≤7% moisture, batch NABL COA, FOB Nhava Sheva & CIF world ports from AVANI AGRO FOODS."
        keywords="moringa powder bulk supplier india, bulk moringa powder wholesale, moringa oleifera export india, moringa leaf powder manufacturer supplier, moringa powder FOB nhava sheva"
        image="https://www.avaniagrofoods.com/moringa.png"
        schema={schema}
      />

      {/* ── 1. HERO SECTION ────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0e291a 0%, #1a4d2e 60%, #153e24 100%)',
        color: '#ffffff',
        padding: '70px 24px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Breadcrumb */}
          <nav style={{ fontSize: '0.85rem', color: '#a7f3d0', marginBottom: 20 }}>
            <Link to="/" style={{ color: '#a7f3d0', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <Link to="/products" style={{ color: '#a7f3d0', textDecoration: 'none' }}>Products</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: '#ffffff' }}>Moringa Powder Bulk Supplier India</span>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                borderRadius: 999,
                fontSize: '0.85rem',
                color: '#6ee7b7',
                fontWeight: 700,
                marginBottom: 20
              }}>
                <Leaf size={16} />
                Export-Grade Botanical Ingredient · Sourcing Coordination
              </div>

              <h1 style={{
                fontSize: 'clamp(2.1rem, 4vw, 3.2rem)',
                fontWeight: 900,
                lineHeight: 1.15,
                color: '#ffffff',
                marginBottom: 20,
                letterSpacing: '-0.02em'
              }}>
                Bulk Moringa Powder Supplier & Export Coordinator from India
              </h1>

              <p style={{
                fontSize: 'clamp(1.05rem, 1.8vw, 1.2rem)',
                color: '#d1fae5',
                lineHeight: 1.6,
                marginBottom: 28,
                maxWidth: 620
              }}>
                Premium dehydrated <em>Moringa oleifera</em> leaf powder coordinated from vetted Maharashtra processing facilities. Standardized 80–100 mesh, ≤ 7.0% moisture, batch-verified by third-party NABL laboratories. Commercial container shipments via Nhava Sheva (JNPT Mumbai) to USA, Europe, UK, GCC, and worldwide.
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
                    background: '#22c55e',
                    color: '#0e291a',
                    boxShadow: '0 10px 25px rgba(34, 197, 94, 0.35)'
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
                  <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>Registration</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>Udyam / MSME Direct</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>Quality Protocol</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>NABL Batch COA</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>Primary Seaport</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>JNPT Nhava Sheva</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>Commercial MOQ</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>100 kg Trial / FCL</div>
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
                  src="/moringa.png"
                  alt="Export Grade Moringa Powder Bulk Supplier India"
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
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>Moringa oleifera Leaf Powder</span>
                    <span style={{ background: '#22c55e', color: '#092514', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                      HS 1211.90.29
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#d1fae5', margin: 0 }}>
                    Shade-dried green botanical powder. Fine 80–100 mesh, rich chlorophyll & complete plant amino acids. Zero carrier agents or fillers.
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
              background: '#ecfdf5',
              color: '#059669',
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
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Technical Profile & Export Standards
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
            Indicative Export Specifications: Moringa Powder
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
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Parameter</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Standard Export Value</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Verification Protocol</th>
                </tr>
              </thead>
              <tbody>
                {product.indicativeSpecifications.map((spec, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#fcfdfd' }}>
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
          <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem', color: '#64748b' }}>
            * Note: Custom mesh sizing (e.g. 120-mesh super-fine for cosmetics or cold beverages) and tight moisture thresholds can be accommodated upon advance contract specification.
          </div>
        </div>
      </section>

      {/* ── 4. APPLICATIONS IN FOOD & NUTRACEUTICALS ────────────────── */}
      <section style={{ background: '#f8fafc', padding: '70px 24px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Industrial Formulation Scope
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
              Commercial B2B Applications for Moringa Powder
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 640, margin: '0 auto' }}>
              Engineered for seamless dispersibility, uniform green tint, and active botanical bioavailability across industrial food and wellness product manufacturing.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              {
                icon: Beaker,
                title: 'Nutraceuticals & Encapsulation',
                desc: 'Fine 80–100 mesh particle distribution enables high-density capsule filling, tableting, and standalone green superfood supplement powders without clogging hopper feeds.'
              },
              {
                icon: Leaf,
                title: 'Functional Beverages & Juices',
                desc: 'Suspends cleanly in cold-pressed juices, RTD green elixirs, instant smoothie dry mixes, and functional herbal tea infusions with natural emerald tint.'
              },
              {
                icon: Layers,
                title: 'Clean-Label Food Fortification',
                desc: 'Used as a plant-based botanical protein booster and clean-label natural green colorant in gluten-free pasta, bakery premixes, energy bars, and extruded snack coatings.'
              },
              {
                icon: Award,
                title: 'Cosmetics & Personal Care',
                desc: 'High antioxidant polyphenol content and natural chlorophyll profile make it an ideal botanical active for purifying clay face masks, herbal shampoos, and skin creams.'
              }
            ].map((app, i) => (
              <div 
                key={i}
                style={{
                  background: '#ffffff',
                  padding: 28,
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#ecfdf5',
                  color: 'var(--color-primary)',
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
              background: '#ecfdf5',
              color: '#059669',
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
              Food safety and hygiene certifications of our vetted processing units:
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
            border: '2px solid #22c55e',
            boxShadow: '0 8px 25px rgba(34, 197, 94, 0.08)'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: '#dcfce7',
              color: '#15803d',
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
      <section style={{ background: '#f8fafc', padding: '70px 24px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Maritime Export & Packaging
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
              Export Packaging Options & Seaport Logistics
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 640, margin: '0 auto' }}>
              Comprehensive barrier protection engineered to withstand tropical humidity and ocean transit conditions from India to North America, Europe, and the Middle East.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <Package size={24} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Packaging Specifications
                </h3>
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
                <li><strong>25 kg HDPE Fiber Drums:</strong> Tamper-evident locking band, heavy-gauge double food-grade polyethylene (PE) inner liner.</li>
                <li><strong>25 kg Multi-Wall Kraft Sacks:</strong> 5-ply Kraft paper with internal high-barrier moisture extrusion coating.</li>
                <li><strong>5 kg Vacuum Sealed Poly Bags:</strong> Available in 20kg master export corrugated shipping cartons.</li>
                <li><strong>Desiccant Pouches:</strong> Food-grade silica gel pouches inserted inside secondary barriers to eliminate micro-condensation.</li>
                <li><strong>Private Label Bulk:</strong> Customized drum labelling with buyer lot codes, SKU, and barcode compliance.</li>
              </ul>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <Truck size={24} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Logistics & Port Operations
                </h3>
              </div>
              <ul style={{ paddingLeft: 18, margin: 0, color: '#475569', fontSize: '0.92rem', lineHeight: 1.8 }}>
                <li><strong>Primary Seaport:</strong> Nhava Sheva (JNPT Mumbai, Port Code: INNSA) — direct access from Maharashtra.</li>
                <li><strong>20ft FCL Capacity:</strong> Approx. 8,000 to 10,000 kg depending on packaging format (drums vs sacks).</li>
                <li><strong>40ft High Cube (HC):</strong> Approx. 18,000 to 20,000 kg.</li>
                <li><strong>Express Air Cargo:</strong> Chhatrapati Shivaji Maharaj International Airport (BOM), Mumbai for sample and urgent consignments.</li>
                <li><strong>Incoterms Supported:</strong> FOB Nhava Sheva, CIF Worldwide Ports, CFR, and EXW Partner Unit.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. EMBEDDED RFQ FORM SECTION ───────────────────────────── */}
      <section id="rfq-section" style={{ maxWidth: 1200, margin: '80px auto', padding: '0 24px' }}>
        <B2BRFQForm
          defaultProduct="Moringa Powder"
          formTitle="Request a Bulk Moringa Powder Quotation (RFQ)"
          formSubtitle="Receive indicative FOB Nhava Sheva or CIF destination pricing, specification sheets, and batch allocation data within 24 hours."
          sourcePage="Moringa_Landing_Page"
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
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Procurement FAQs
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
            Frequently Asked Questions for International Buyers
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Essential answers on minimums, testing protocols, operating structure, and maritime export execution.
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
                  border: isOpen ? '1px solid #22c55e' : '1px solid #e2e8f0',
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
                    color={isOpen ? '#16a34a' : '#64748b'}
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
      <section style={{ background: '#f8fafc', padding: '70px 24px 80px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              B2B Knowledge Base
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 12px' }}>
              Related Moringa Sourcing & Technical Guides
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
                  border: '1px solid #e2e8f0',
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
                      color: 'var(--color-primary)',
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
