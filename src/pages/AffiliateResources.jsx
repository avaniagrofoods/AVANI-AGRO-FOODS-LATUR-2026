import { useState } from 'react'
import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import {
  Package, Search, Filter, ExternalLink, Shield,
  CheckCircle2, XCircle, Info, Sparkles, Utensils,
  Leaf, Truck, Wrench, ChevronRight, HelpCircle
} from 'lucide-react'

const RESOURCE_CATEGORIES = [
  'All',
  'Superfoods & Wellness Products',
  'Food Ingredients & Processing',
  'Kitchen & Dehydration Equipment',
  'Packaging & Storage',
  'Agricultural & Sourcing Tools',
  'Export & Trade Software'
]

const RESOURCES_DATA = [
  {
    id: 'res_01',
    name: 'Organic India Moringa Leaf Powder',
    category: 'Superfoods & Wellness Products',
    platform: 'Amazon India / Global',
    badge: 'Popular Superfood',
    problemSolved: 'Provides verified organic, single-origin Moringa oleifera leaf powder in consumer-ready protective packaging.',
    description: 'Certified organic whole leaf moringa powder processed at low temperatures. Ideal for daily smoothies, teas, and small-batch nutritional recipes.',
    specs: ['100g / 250g Airtight Jar', 'USDA & India Organic Certified', 'Non-GMO Project Verified', 'Fine 80-mesh powder'],
    pros: ['Widely available with fast delivery', 'Certified organic with transparent lab testing', 'Pleasant mild herbal flavor'],
    cons: ['Retail package size only (not suited for bulk industrial production)'],
    whoItsFor: 'Consumers, wellness enthusiasts, and formulators testing retail moringa recipes.',
    whoShouldAvoid: 'Bulk commercial importers requiring 25kg export drums (contact AVANI directly).',
    affiliateUrl: 'https://tinyurl.com/ywenv6wz',
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_02',
    name: 'Kuli Kuli Pure Moringa Powder',
    category: 'Superfoods & Wellness Products',
    platform: 'Amazon Global',
    badge: 'Global Retail Choice',
    problemSolved: 'Sustainably sourced moringa leaf powder tailored for international consumers and retail health grocers.',
    description: 'A leading brand in North American natural food stores, offering sustainably sourced, nutrient-dense moringa leaf powder with high protein and iron density.',
    specs: ['8 oz (227g) Resealable Pouch', 'Certified B-Corp Sourcing', 'Rich in Dietary Iron & Calcium'],
    pros: ['Excellent fine texture that dissolves smoothly', 'Strict quality and microbiological standards'],
    cons: ['Higher price per gram compared to direct commodity sourcing'],
    whoItsFor: 'North American and European health shoppers looking for a trusted retail brand.',
    whoShouldAvoid: 'Large-scale food processors looking for wholesale raw materials.',
    affiliateUrl: 'https://amzn.to/4v7LZmw',
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_03',
    name: 'Himalayan Organics Moringa Powder',
    category: 'Superfoods & Wellness Products',
    platform: 'Amazon India',
    badge: 'Herbal Supplement',
    problemSolved: 'Provides laboratory-tested moringa leaf powder suitable for dietary supplements and topical cosmetic masks.',
    description: 'Fine ground botanical powder prepared from raw shade-dried moringa leaves, packed in UV-resistant containers to preserve active carotenoids.',
    specs: ['200g Protective Jar', 'Third-Party Lab Tested for Heavy Metals', 'No Artificial Fillers'],
    pros: ['Consistently vibrant green color', 'Affordable entry point for wellness routines'],
    cons: ['Plastic container rather than glass packaging'],
    whoItsFor: 'Health conscious buyers and herbal brand developers in India.',
    whoShouldAvoid: 'Overseas importers requiring ocean container shipments.',
    affiliateUrl: 'https://tinyurl.com/efttfn8x',
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_04',
    name: 'iHerb Global Superfood & Herbal Selection',
    category: 'Food Ingredients & Processing',
    platform: 'iHerb Global',
    badge: 'International Marketplace',
    problemSolved: 'Direct access to thousands of authentic international vitamins, organic superfoods, and dietary supplements with global shipping.',
    description: 'A trusted global distributor operating climate-controlled distribution centers with international delivery across 150+ countries.',
    specs: ['Worldwide Express Shipping', 'Strict Temperature Control', 'Verified Customer Reviews'],
    pros: ['Unmatched variety of superfood powders and extracts', 'Authenticity guarantee on all listed brands'],
    cons: ['Import duties may apply depending on destination country customs thresholds'],
    whoItsFor: 'International shoppers seeking verified global wellness brands.',
    whoShouldAvoid: 'Bulk commodity traders looking for FOB Nhava Sheva container loads.',
    affiliateUrl: 'https://iherb.co/ocZkYDSJ',
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_05',
    name: 'Commercial Stainless Steel Food Dehydrator (10-Tray)',
    category: 'Kitchen & Dehydration Equipment',
    platform: 'Amazon / Specialist Supplier',
    badge: 'Equipment Review',
    problemSolved: 'Enables consistent, low-temperature drying of fresh vegetables, onion slices, herbs, and fruits for test batches.',
    description: 'Heavy-duty digital food dehydrator with horizontal rear-mounted fan for uniform airflow and adjustable 30°C–90°C thermostat.',
    specs: ['10 Food-Grade 304 Stainless Steel Trays', '1000W Heating Element', 'Digital Timer (up to 24 hours)', 'Transparent Glass Door'],
    pros: ['Precise temperature control prevents chlorophyll damage', 'Quiet operation and durable steel construction'],
    cons: ['Large countertop footprint; requires dedicated workspace'],
    whoItsFor: 'Small-batch food entrepreneurs, culinary test kitchens, and artisanal dehydrators.',
    whoShouldAvoid: 'Industrial processing plants requiring multi-ton continuous tunnel dryers.',
    affiliateUrl: 'https://www.amazon.com/dp/B07PY5M579?tag=avaniagro-20',
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_06',
    name: 'Heavy-Duty Commercial High-Speed Blender (2200W)',
    category: 'Kitchen & Dehydration Equipment',
    platform: 'Amazon',
    badge: 'Kitchen Machinery',
    problemSolved: 'Pulverizes fibrous botanical leaves, dehydrated onion flakes, and tough roots into ultra-fine powders.',
    description: 'Commercial-grade blender equipped with hardened stainless steel blades and a 2200W industrial copper motor for smooth nutrient extraction.',
    specs: ['2.0L BPA-Free Tritan Jar', 'Variable Speed Control + Pulse', 'Overheat & Overload Protection'],
    pros: ['Easily blends moringa powders into smooth emulsion without grit', 'Robust motor handles heavy daily commercial use'],
    cons: ['Louder decibel output under maximum pulverization speed'],
    whoItsFor: 'Smoothie bar operators, catering kitchens, and home superfood formulators.',
    whoShouldAvoid: 'Large industrial mills requiring 100-mesh pin mill pulverizers.',
    affiliateUrl: 'https://www.amazon.com/dp/B08NVT5485?tag=avaniagro-20',
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_07',
    name: 'Automatic Vacuum Sealer with Nitrogen Port Capability',
    category: 'Packaging & Storage',
    platform: 'Amazon',
    badge: 'Packaging Tool',
    problemSolved: 'Prevents oxidation and moisture degradation in dehydrated food powders by removing oxygen before sealing.',
    description: 'Commercial chamber/channel vacuum packaging machine designed for sealing high-barrier mylar and foil pouches.',
    specs: ['Dual Sealing Wire', 'Dry/Moist/Pulse Modes', 'External Vacuum Hose Attachment Included'],
    pros: ['Significantly extends powder shelf life by eliminating atmospheric humidity', 'Works with heavy-gauge foil bags'],
    cons: ['Requires compatible textured or multi-layer vacuum pouches'],
    whoItsFor: 'Small food packaging businesses, sample preparation labs, and bulk food preservers.',
    whoShouldAvoid: 'High-speed automated packaging lines handling 100+ bags per minute.',
    affiliateUrl: 'https://www.amazon.com/dp/B07N376VVR?tag=avaniagro-20',
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_08',
    name: 'Digital Grain & Powder Moisture Meter Tester',
    category: 'Agricultural & Sourcing Tools',
    platform: 'Amazon / Lab Equipment',
    badge: 'Quality Control',
    problemSolved: 'Provides rapid, on-site moisture percentage readings for dried botanical leaves and agricultural commodities.',
    description: 'Handheld digital moisture meter featuring dual high-precision probe sensors to measure moisture content in powders and grains within seconds.',
    specs: ['Measurement Range: 2% to 30%', 'LCD Backlit Display', 'Automatic Temperature Compensation'],
    pros: ['Essential for on-field quality inspection', 'Helps prevent accepting lots exceeding moisture limits'],
    cons: ['Requires periodic calibration against oven-drying reference standards'],
    whoItsFor: 'Agricultural procurement officers, quality inspectors, and food processors.',
    whoShouldAvoid: 'Casual buyers who do not handle bulk raw commodities.',
    affiliateUrl: 'https://www.amazon.com/dp/B08GC8M7Q4?tag=avaniagro-20',
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_09',
    name: 'Freightos International Freight Rate & Booking Platform',
    category: 'Export & Trade Software',
    platform: 'Direct Partner',
    badge: 'Logistics Tool',
    problemSolved: 'Enables instant comparison of ocean and air freight shipping rates across global freight forwarders.',
    description: 'Digital freight marketplace connecting international cargo shippers with top logistics providers for transparent ocean container and air freight quotes.',
    specs: ['Live FCL / LCL & Air Freight Rates', 'Customs Brokerage Integration', 'Real-Time Container Tracking'],
    pros: ['Transparent fee breakdown with no hidden destination surcharges', 'Simplifies international logistics comparison'],
    cons: ['Peak season capacity may fluctuate across individual ocean carriers'],
    whoItsFor: 'Importers, exporters, and supply chain managers booking international cargo.',
    whoShouldAvoid: 'Individuals seeking domestic small parcel postal shipping.',
    affiliateUrl: 'https://www.freightos.com',
    lastUpdated: 'August 2026'
  }
]

export default function AffiliateResources() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredResources = RESOURCES_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.problemSolved.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <SEO
        title="Resources & Recommended Products | AVANI AGRO FOODS"
        description="Independent educational guides, kitchen equipment reviews, food packaging tools, and third-party product recommendations. Transparent affiliate disclosures apply."
        keywords="moringa reviews, kitchen dehydrator reviews, food packaging tools, superfood recommendations, agricultural tools"
      />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 96 }}>
        
        {/* Header Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '80px 0 60px', color: 'white', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 840 }}>
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <Sparkles size={14} /> Educational Channel &amp; Recommendations
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: 'white', marginBottom: 16 }}>
              AVANI Resources &amp; Recommended Products
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 auto 28px' }}>
              Independent product evaluations, kitchen equipment guides, packaging tools, and curated third-party resources for food processors, wellness enthusiasts, and agro entrepreneurs.
            </p>
          </div>
        </div>

        {/* Affiliate Disclosure Notice */}
        <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '16px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#92400e' }}>
              <Info size={18} color="#b45309" style={{ flexShrink: 0 }} />
              <span>
                <strong>Affiliate Transparency Notice:</strong> Links on this page are independent third-party recommendations. We may earn a referral commission at zero additional cost to you.
              </span>
            </div>
            <Link to="/affiliate-disclosure" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'underline' }}>
              Read Full Disclosure →
            </Link>
          </div>
        </div>

        <div className="container" style={{ padding: '48px 24px' }}>
          
          {/* Search & Category Filter Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
            <div style={{ position: 'relative', maxWidth: 480 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input
                className="input"
                style={{ paddingLeft: 46, height: 48, borderRadius: 24, background: 'white' }}
                placeholder="Search tools, equipment, superfoods, or software..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {RESOURCE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    borderRadius: 20,
                    fontWeight: 700,
                    background: selectedCategory === cat ? 'var(--color-primary)' : 'white',
                    color: selectedCategory === cat ? 'white' : 'var(--color-text)',
                    border: selectedCategory === cat ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: 24 }}>
            Showing <strong>{filteredResources.length}</strong> recommended resources
          </div>

          {/* Resources Grid with Structured Review Templates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 32 }}>
            {filteredResources.map(item => (
              <div
                key={item.id}
                className="card card-hover"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  background: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ padding: '28px' }}>
                  {/* Category & Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span className="badge" style={{ fontSize: '0.7rem' }}>{item.category}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', background: 'var(--color-bg-alt)', padding: '2px 8px', borderRadius: 10 }}>
                      {item.platform}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
                    {item.name}
                  </h3>

                  {/* Problem Solved */}
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 14 }}>
                    <strong>Key Benefit:</strong> {item.problemSolved}
                  </div>

                  {/* Detailed Description */}
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', lineHeight: 1.65, marginBottom: 20 }}>
                    {item.description}
                  </p>

                  {/* Specifications */}
                  <div style={{ marginBottom: 20, background: 'var(--color-bg-alt)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: 8 }}>
                      Specifications &amp; Features
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.6 }}>
                      {item.specs.map(spec => (
                        <li key={spec}>{spec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Pros & Cons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <CheckCircle2 size={13} color="#166534" /> Strengths
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: 1.5 }}>
                        {item.pros.map(pro => <li key={pro}>{pro}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <XCircle size={13} color="#991b1b" /> Limitations
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: 1.5 }}>
                        {item.cons.map(con => <li key={con}>{con}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Audience Guidance */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                    <p style={{ margin: '0 0 6px 0' }}><strong>Who it is for:</strong> {item.whoItsFor}</p>
                    <p style={{ margin: 0, color: 'var(--color-text-light)' }}><strong>Who should avoid:</strong> {item.whoShouldAvoid}</p>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ padding: '16px 28px', background: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                    Updated: {item.lastUpdated}
                  </span>
                  <a
                    href={item.affiliateUrl}
                    target="_blank"
                    rel="nofollow noopener sponsored"
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '8px 16px', gap: 6 }}
                  >
                    Check Current Price <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 'var(--radius-lg)' }}>
              <p style={{ color: 'var(--color-text-light)' }}>No resources found matching your search. Try resetting the category filter.</p>
              <button onClick={() => { setSelectedCategory('All'); setSearchQuery('') }} className="btn btn-primary" style={{ marginTop: 12 }}>
                Reset Filters
              </button>
            </div>
          )}

          {/* Sourcing Cross-Link */}
          <div style={{ marginTop: 64, padding: '36px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 8 }}>
              Looking for Bulk Commercial Export Consignments?
            </h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.92rem', maxWidth: 640, margin: '0 auto 20px', lineHeight: 1.7 }}>
              If you require commercial ton-scale container loads of Moringa Powder or Red Onion Powder with formal export documentation and batch COAs, connect with our B2B trade coordination desk.
            </p>
            <Link to="/contact" className="btn btn-primary" style={{ gap: 8 }}>
              Submit Commercial RFQ <ChevronRight size={16} />
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
