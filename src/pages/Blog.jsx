import { useState, useMemo } from 'react'
import SEO from '../components/SEO'
import { BLOGS, CATEGORIES } from '../data/blogs'
import { Link } from 'react-router-dom'
import { Search, Clock, ArrowRight, Shield, Send, CheckCircle2, BookOpen, Filter } from 'lucide-react'
import B2BQuickEnquiry from '../components/B2BQuickEnquiry'

export default function Blog() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    return BLOGS.filter(b => {
      const q = search.toLowerCase().trim()
      const matchSearch = !q || 
        b.title.toLowerCase().includes(q) || 
        b.excerpt.toLowerCase().includes(q) || 
        b.keywords?.some(k => k.toLowerCase().includes(q)) ||
        b.category.toLowerCase().includes(q)

      let matchCat = true
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Moringa Powder') {
          matchCat = b.category === 'Moringa Powder' || b.title.toLowerCase().includes('moringa')
        } else if (selectedCategory === 'Red Onion Powder') {
          matchCat = b.category === 'Red Onion Powder' || b.title.toLowerCase().includes('onion')
        } else {
          matchCat = b.category === selectedCategory
        }
      }
      return matchSearch && matchCat
    })
  }, [search, selectedCategory])

  const moringaFeatured = BLOGS.find(b => b.id === 1) || BLOGS[0]
  const onionFeatured = BLOGS.find(b => b.id === 16) || BLOGS[15]

  const blogBreadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Agricultural Export & Sourcing Knowledge Library | AVANI AGRO FOODS",
    "description": "30 comprehensive B2B sourcing guides for bulk Moringa leaf powder and dehydrated Red Onion powder from India.",
    "url": "https://www.avaniagrofoods.com/blog",
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": filtered.slice(0, 10).map((b, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `https://www.avaniagrofoods.com/blog/${b.slug}`,
        "name": b.title
      }))
    }
  }

  return (
    <>
      <SEO
        title="B2B Sourcing Library — Moringa & Red Onion Powder Guides"
        description="Comprehensive collection of 30 international B2B sourcing guides for bulk Moringa Powder and dehydrated Red Onion Powder from India. Authored by Sachin Shinde, Trade Coordinator."
        keywords="moringa powder sourcing guide, red onion powder exporter india, bulk agro ingredients b2b, export documentation india, allium cepa powder"
        schema={blogBreadcrumbSchema}
      />

      <div className="page-top" style={{ backgroundColor: '#fcfdfd' }}>
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2e1b 0%, #1a4d2e 60%, #2d6a4f 100%)',
          padding: '80px 24px 72px',
          color: 'white',
          position: 'relative'
        }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 30,
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(8px)',
              fontSize: '0.82rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#86efac',
              marginBottom: 20
            }}>
              <Shield size={16} /> INTERNATIONAL B2B KNOWLEDGE BASE
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.4rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: 20,
              color: 'white',
              letterSpacing: '-0.02em'
            }}>
              Agricultural Export & Sourcing Library
            </h1>

            <p style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              maxWidth: 680,
              margin: '0 auto 36px',
              lineHeight: 1.65
            }}>
              30 comprehensive technical guides, specification manuals, and procurement frameworks for international buyers sourcing bulk <strong>Moringa Powder</strong> and <strong>Red Onion Powder</strong> from Maharashtra, India.
            </p>

            {/* Live Search Bar */}
            <div style={{ position: 'relative', maxWidth: 540, margin: '0 auto' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.7)'
                }}
              />
              <input
                id="blog-search-input"
                type="text"
                className="input"
                placeholder="Search by topic, mesh size, lab specs, or destination..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 24px 16px 54px',
                  borderRadius: 36,
                  background: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 72, zIndex: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div className="container" style={{ padding: '16px 24px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 'max-content' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginRight: 6 }}>
                <Filter size={14} /> FILTER:
              </span>
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat
                const count = cat === 'All' ? BLOGS.length : BLOGS.filter(b => {
                  if (cat === 'Moringa Powder') return b.category === 'Moringa Powder' || b.title.toLowerCase().includes('moringa')
                  if (cat === 'Red Onion Powder') return b.category === 'Red Onion Powder' || b.title.toLowerCase().includes('onion')
                  return b.category === cat
                }).length

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: isSelected ? '1px solid var(--color-dark-green, #1a4d2e)' : '1px solid #e2e8f0',
                      background: isSelected ? 'var(--color-dark-green, #1a4d2e)' : '#f8fafc',
                      color: isSelected ? 'white' : '#334155'
                    }}
                  >
                    {cat} <span style={{ opacity: isSelected ? 0.9 : 0.6, fontSize: '0.78rem' }}>({count})</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="container" style={{ padding: '48px 24px 80px', maxWidth: 1240, margin: '0 auto' }}>
          {/* Results Counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.92rem', color: '#475569' }}>
              Showing <strong>{filtered.length}</strong> of {BLOGS.length} verified sourcing guides
              {selectedCategory !== 'All' && <span> in <strong>{selectedCategory}</strong></span>}
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', fontWeight: 700, padding: '8px 18px' }}
            >
              <Send size={14} /> Request Custom Price Quotation
            </button>
          </div>

          {/* Dual Featured Article Cards (Shown when viewing "All" and no search active) */}
          {!search && selectedCategory === 'All' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 32, marginBottom: 56 }}>
              {/* Featured 1: Moringa */}
              <Link to={`/blog/${moringaFeatured.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card card-hover" style={{
                  height: '100%',
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: 'white',
                  border: '1px solid #bbf7d0',
                  boxShadow: '0 10px 30px rgba(34,197,94,0.08)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
                    <img
                      src={moringaFeatured.thumbnail}
                      alt={moringaFeatured.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
                      <span className="badge" style={{ background: '#166534', color: 'white', fontWeight: 800 }}>🌿 Moringa Pillar Guide</span>
                    </div>
                  </div>
                  <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748b', marginBottom: 12 }}>
                      <Clock size={14} /> {moringaFeatured.readTime} read • {moringaFeatured.date}
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.35, marginBottom: 14 }}>
                      {moringaFeatured.title}
                    </h2>
                    <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 20, flex: 1 }}>
                      {moringaFeatured.excerpt}
                    </p>
                    <div style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Read Comprehensive Guide <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Featured 2: Red Onion */}
              <Link to={`/blog/${onionFeatured.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card card-hover" style={{
                  height: '100%',
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: 'white',
                  border: '1px solid #fecdd3',
                  boxShadow: '0 10px 30px rgba(225,29,72,0.08)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
                    <img
                      src={onionFeatured.thumbnail}
                      alt={onionFeatured.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="eager"
                    />
                    <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
                      <span className="badge" style={{ background: '#9f1239', color: 'white', fontWeight: 800 }}>🧅 Red Onion Pillar Guide</span>
                    </div>
                  </div>
                  <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748b', marginBottom: 12 }}>
                      <Clock size={14} /> {onionFeatured.readTime} read • {onionFeatured.date}
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.35, marginBottom: 14 }}>
                      {onionFeatured.title}
                    </h2>
                    <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 20, flex: 1 }}>
                      {onionFeatured.excerpt}
                    </p>
                    <div style={{ color: '#e11d48', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Read Comprehensive Guide <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Standard Article Grid (3 columns) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 32
          }}>
            {filtered.map((blog) => {
              const isM = blog.category === 'Moringa Powder' || blog.title.toLowerCase().includes('moringa')
              const badgeBg = isM ? 'rgba(34, 197, 94, 0.12)' : 'rgba(225, 29, 72, 0.12)'
              const badgeColor = isM ? '#166534' : '#9f1239'

              return (
                <Link to={`/blog/${blog.slug}`} key={blog.slug} style={{ textDecoration: 'none' }}>
                  <div
                    className="card card-hover"
                    style={{
                      height: '100%',
                      background: 'white',
                      borderRadius: 18,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ height: 200, overflow: 'hidden', background: '#f1f5f9' }}>
                      <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          background: badgeBg,
                          color: badgeColor,
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {blog.category}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#64748b' }}>
                          <Clock size={12} /> {blog.readTime}
                        </div>
                      </div>

                      <h3 style={{
                        fontSize: '1.08rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        lineHeight: 1.4,
                        marginBottom: 12
                      }}>
                        {blog.title}
                      </h3>

                      <p style={{
                        color: '#64748b',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        marginBottom: 18,
                        flex: 1
                      }}>
                        {blog.excerpt}
                      </p>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: 14,
                        fontSize: '0.78rem',
                        color: '#94a3b8'
                      }}>
                        <span>{blog.date}</span>
                        <span style={{
                          fontWeight: 800,
                          color: isM ? '#16a34a' : '#e11d48',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          Read Guide <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px', background: 'white', borderRadius: 20, border: '1px dashed #cbd5e1' }}>
              <BookOpen size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
                No sourcing guides found for "{search}"
              </h3>
              <p style={{ color: '#64748b', marginBottom: 24, maxWidth: 450, margin: '0 auto 24px' }}>
                Try adjusting your search terms or select another category filter to explore our 30 export guides.
              </p>
              <button
                onClick={() => { setSearch(''); setSelectedCategory('All') }}
                className="btn btn-primary"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Central Commercial Conversion Section */}
          <div style={{ marginTop: 80 }}>
            <B2BQuickEnquiry
              productDefault="Both Products"
              title="Need Bulk Pricing for International Export?"
              subtitle="Submit your target volume and destination seaport to receive an itemized FOB Nhava Sheva or CIF destination proforma quotation within 24 hours."
              sourceContext="Blog_Index_Bottom_Callout"
            />
          </div>
        </div>
      </div>

      {modalOpen && (
        <B2BQuickEnquiry
          productDefault="Both Products"
          title="Direct B2B Sourcing Quotation"
          subtitle="Submit your requirements to AVANI AGRO FOODS Trade Coordination Desk."
          isModal={true}
          onClose={() => setModalOpen(false)}
          sourceContext="Modal_Blog_Index"
        />
      )}
    </>
  )
}
