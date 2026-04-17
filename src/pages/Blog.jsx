import { useState } from 'react'
import SEO from '../components/SEO'
import { BLOGS, CATEGORIES } from '../data/blogs'
import { Link } from 'react-router-dom'
import { Search, Clock, ArrowRight } from 'lucide-react'

export default function Blog() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = BLOGS.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.excerpt.toLowerCase().includes(q) || b.keywords?.some(k => k.includes(q))
    const matchCat = category === 'All' || b.category === category
    return matchSearch && matchCat
  })

  return (
    <>
      <SEO
        title="Export & Health Blog — Moringa, Onion, B2B"
        description="Expert blog on Moringa Powder benefits, export business guides, affiliate marketing strategies, and Indian agri-business insights."
        keywords="moringa powder blog, moringa benefits india, export blog india, onion powder food industry"
      />

      <div className="page-top">
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '72px 0' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', marginBottom: 16 }}>Avani Agro Foods Blog</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 540, margin: '0 auto 32px', fontSize: '1.05rem' }}>
              {BLOGS.length} expert articles on Moringa, Export Business, and Affiliate Marketing
            </p>
            <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
              <input
                id="blog-search"
                className="input"
                placeholder="Search articles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 48, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', '::placeholder': { color: 'rgba(255,255,255,0.6)' } }}
              />
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '48px 24px' }}>
          {/* Category Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40, justifyContent: 'center' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} className="btn" style={{
                background: category === cat ? 'var(--color-primary)' : 'white',
                color: category === cat ? 'white' : 'var(--color-text)',
                border: '1px solid var(--color-border)'
              }}>{cat} {cat !== 'All' && `(${BLOGS.filter(b => b.category === cat).length})`}</button>
            ))}
          </div>

          {/* Count */}
          <div style={{ marginBottom: 28, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
            Showing <strong>{filtered.length}</strong> of {BLOGS.length} articles
          </div>

          {/* Featured Article */}
          {filtered.length > 0 && (
            <Link to={`/blog/${filtered[0].slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 48 }}>
              <div className="card card-hover" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', overflow: 'hidden', minHeight: 300 }}>
                <div style={{ padding: '48px 40px' }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
                    <span className="badge badge-accent">Featured</span>
                    <span className="badge">{filtered[0].category}</span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: 16, lineHeight: 1.3 }}>{filtered[0].title}</h2>
                  <p style={{ color: 'var(--color-text-light)', lineHeight: 1.7, marginBottom: 24 }}>{filtered[0].excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                      <Clock size={14} /> {filtered[0].readTime}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{filtered[0].date}</span>
                  </div>
                  <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                    Read Article <ArrowRight size={16} />
                  </div>
                </div>
                <img src={filtered[0].thumbnail} alt={filtered[0].title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              </div>
            </Link>
          )}

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
            {filtered.slice(1).map(blog => (
              <Link to={`/blog/${blog.slug}`} key={blog.slug} style={{ textDecoration: 'none' }}>
                <div className="card card-hover" style={{ overflow: 'hidden', height: '100%' }}>
                  <img src={blog.thumbnail} alt={blog.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      <span className="badge" style={{ fontSize: '0.65rem' }}>{blog.category}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-text-light)' }}>
                        <Clock size={11} /> {blog.readTime}
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 10, lineHeight: 1.4 }}>{blog.title}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-light)', lineHeight: 1.65, marginBottom: 16 }}>{blog.excerpt}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>{blog.date}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>Read <ArrowRight size={14} /></span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 64, color: 'var(--color-text-light)' }}>
              No articles found for "{search}"
            </div>
          )}
        </div>
      </div>
    </>
  )
}
