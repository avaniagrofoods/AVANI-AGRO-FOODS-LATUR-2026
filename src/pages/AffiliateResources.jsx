import { useState } from 'react'
import SEO from '../components/SEO'
import { Link } from 'react-router-dom'
import { RECOMMENDED_RESOURCES, AFFILIATE_SYSTEM_ENABLED, BUSINESS_INFO } from '../data/links'
import {
  Package, Search, Filter, Shield,
  CheckCircle2, XCircle, Info, Sparkles,
  ChevronRight, Clock, ExternalLink
} from 'lucide-react'

const RESOURCE_CATEGORIES = [
  'All',
  'Superfoods & Wellness Products',
  'Kitchen & Dehydration Equipment',
  'Agricultural & Sourcing Tools'
]

export default function AffiliateResources() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredResources = RECOMMENDED_RESOURCES.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <SEO
        title="Resources & Recommended Equipment References | AVANI AGRO FOODS"
        description="Independent informational references for superfoods, kitchen dehydration equipment, and agricultural testing tools. Transparent affiliate disclosure notice."
        keywords="moringa equipment references, food dehydrators, moisture meters, agricultural tools, commercial kitchen equipment"
      />

      <div className="page-top" style={{ minHeight: '100vh', background: '#f8faf8', paddingBottom: 96 }}>
        
        {/* Header Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0a1f0d, #1a4d2e)', padding: '80px 0 60px', color: 'white', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 840 }}>
            <div className="section-tag" style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.15)', color: 'white', display: 'inline-flex', marginBottom: 16 }}>
              <Sparkles size={14} /> Educational References &amp; Equipment Guides
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: 'white', marginBottom: 16 }}>
              Resources &amp; Equipment References
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 auto 28px' }}>
              Curated third-party product references, kitchen equipment overviews, and testing tools for agricultural formulators, food processors, and agro entrepreneurs.
            </p>
          </div>
        </div>

        {/* Affiliate Disclosure Notice Banner */}
        <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '16px 0' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#92400e' }}>
              <Info size={18} color="#b45309" style={{ flexShrink: 0 }} />
              <span>
                <strong>Future Affiliate Disclosure:</strong> AVANI AGRO FOODS may participate in third-party affiliate programs in the future. All affiliate links currently remain inactive until official program approval.
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
                placeholder="Search tools, equipment, superfoods..."
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
            Showing <strong>{filteredResources.length}</strong> equipment &amp; product references
          </div>

          {/* Resources Grid */}
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 12 }}>
                    {item.name}
                  </h3>

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

                {/* Footer Action — Disabled until active program registration */}
                <div style={{ padding: '16px 28px', background: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                    Updated: {item.lastUpdated}
                  </span>
                  <button
                    disabled
                    className="btn"
                    style={{
                      fontSize: '0.78rem',
                      padding: '8px 14px',
                      background: '#e2e8f0',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      cursor: 'not-allowed',
                      gap: 6
                    }}
                    title="Affiliate link will be available after program registration"
                  >
                    <Clock size={12} /> Link Coming Soon
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sourcing Cross-Link */}
          <div style={{ marginTop: 64, padding: '36px', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 8 }}>
              Looking for Commercial Bulk Agricultural Sourcing?
            </h3>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.92rem', maxWidth: 640, margin: '0 auto 20px', lineHeight: 1.7 }}>
              If you require commercial ton-scale consignments of Moringa Powder or Red Onion Powder with formal proforma quotations, batch COAs, and port logistics, connect with AVANI AGRO FOODS.
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
