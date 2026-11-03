import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBlogBySlug, getRelatedBlogs, BLOGS } from '../data/blogs'
import SEO from '../components/SEO'
import B2BQuickEnquiry from '../components/B2BQuickEnquiry'
import { Clock, ArrowLeft, ArrowRight, Share2, Phone, Mail, FileText, CheckCircle2, Shield, HelpCircle, ChevronDown, ChevronRight, Send, Download } from 'lucide-react'
import { BUSINESS_INFO, WHATSAPP_NUMBER } from '../data/links'
import ReactMarkdown from 'react-markdown'

export default function BlogPost() {
  const { slug } = useParams()
  const blog = getBlogBySlug(slug)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeToc, setActiveToc] = useState('')

  if (!blog) {
    return (
      <div className="page-top" style={{ textAlign: 'center', padding: '140px 24px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-dark-green, #1a4d2e)', marginBottom: 16 }}>Article Not Found</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 32 }}>The requested educational article may have moved or been updated.</p>
        <Link to="/blog" className="btn btn-primary">← Explore 30 Sourcing Guides</Link>
      </div>
    )
  }

  const isMoringa = blog.category === 'Moringa Powder' || blog.title.toLowerCase().includes('moringa')
  const isOnion = blog.category === 'Red Onion Powder' || blog.title.toLowerCase().includes('onion')
  const defaultProduct = isMoringa ? 'Moringa Powder' : (isOnion ? 'Red Onion Powder' : 'Both Products')

  const related = getRelatedBlogs(blog, 4)
  const shareUrl = `https://www.avaniagrofoods.com/blog/${blog.slug}`
  const waShare = `https://wa.me/?text=${encodeURIComponent(`${blog.title} — AVANI AGRO FOODS: ${shareUrl}`)}`
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(shareUrl)}`

  // Extract headings for Table of Contents
  const headings = []
  if (blog.content) {
    const lines = blog.content.split('\n')
    lines.forEach((line) => {
      const match = line.match(/^##\s+(.+)$/)
      if (match) {
        const title = match[1].replace(/[*_#]/g, '').trim()
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        headings.push({ title, id })
      }
    })
  }

  // Schema.org Structured Data: BlogPosting + BreadcrumbList
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.seoTitle || blog.title,
    "description": blog.seoDesc || blog.excerpt,
    "image": blog.thumbnail ? `https://www.avaniagrofoods.com${blog.thumbnail.startsWith('/') ? '' : '/'}${blog.thumbnail}` : "https://www.avaniagrofoods.com/og-image.jpg",
    "author": {
      "@type": "Person",
      "name": blog.author || "Sachin Shinde",
      "jobTitle": "Trade Coordinator",
      "worksFor": {
        "@type": "Organization",
        "name": "AVANI AGRO FOODS",
        "url": "https://www.avaniagrofoods.com"
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": "AVANI AGRO FOODS",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.avaniagrofoods.com/logo.png"
      }
    },
    "datePublished": blog.date,
    "dateModified": blog.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": shareUrl
    }
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.avaniagrofoods.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Resources & Blog",
        "item": "https://www.avaniagrofoods.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": blog.title,
        "item": shareUrl
      }
    ]
  }

  return (
    <>
      <SEO
        title={blog.seoTitle || blog.title}
        description={blog.seoDesc || blog.excerpt}
        keywords={blog.keywords?.join(', ')}
        image={blog.thumbnail}
        schema={[articleSchema, breadcrumbSchema]}
      />

      <div className="page-top" style={{ backgroundColor: '#fafbfc' }}>
        {/* Top Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #143d24 0%, #1a4d2e 50%, #22543d 100%)',
          padding: '72px 24px 64px',
          color: 'white',
          position: 'relative'
        }}>
          <div className="container" style={{ maxWidth: 960, margin: '0 auto' }}>
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" style={{ marginBottom: 20 }}>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <li>
                  <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Home</Link>
                </li>
                <li style={{ color: 'rgba(255,255,255,0.4)' }}>/</li>
                <li>
                  <Link to="/blog" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Resources</Link>
                </li>
                <li style={{ color: 'rgba(255,255,255,0.4)' }}>/</li>
                <li style={{ color: '#86efac', fontWeight: 600 }}>{blog.category}</li>
              </ol>
            </nav>

            {/* Category Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 18 }}>
              <span>{blog.category}</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(1.8rem, 4.5vw, 2.9rem)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.25,
              marginBottom: 24,
              letterSpacing: '-0.02em'
            }}>
              {blog.title}
            </h1>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={16} /> <span>{blog.readTime} reading time</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <div>By <strong>{blog.author}</strong></div>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <div>Published: {blog.date}</div>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <div>Origin: Latur, Maharashtra, India</div>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="container" style={{ maxWidth: 1180, margin: '0 auto', padding: '48px 24px 80px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: 48,
            alignItems: 'flex-start'
          }}>

            {/* Main Article Content */}
            <main>
              {/* Featured Image with SEO Alt */}
              <div style={{
                borderRadius: 'var(--radius-lg, 24px)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                marginBottom: 36,
                background: '#e2e8f0',
                maxHeight: 520
              }}>
                <img
                  src={blog.thumbnail}
                  alt={blog.title}
                  style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }}
                  loading="eager"
                />
              </div>

              {/* Executive Summary Card */}
              <div style={{
                background: 'white',
                borderLeft: '5px solid var(--color-primary-dark, #16a34a)',
                padding: '24px 28px',
                borderRadius: '12px',
                marginBottom: 36,
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary-dark, #16a34a)', fontWeight: 800, fontSize: '0.85rem', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Shield size={18} /> Executive Summary for Procurement Teams
                </div>
                <p style={{ fontSize: '1.02rem', lineHeight: 1.7, color: '#334155', margin: 0 }}>
                  {blog.excerpt}
                </p>
              </div>

              {/* Interactive Table of Contents */}
              {headings.length > 2 && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: '24px 28px',
                  marginBottom: 40
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-dark-green, #1a4d2e)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={18} /> Table of Contents
                  </div>
                  <nav aria-label="Table of Contents">
                    <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.88rem' }}>
                      {headings.map((h, i) => (
                        <li key={i}>
                          <a
                            href={`#${h.id}`}
                            style={{ color: '#0f766e', textDecoration: 'none', fontWeight: 600 }}
                            onClick={(e) => {
                              e.preventDefault()
                              const target = document.getElementById(h.id)
                              if (target) {
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                setActiveToc(h.id)
                              }
                            }}
                          >
                            {h.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              )}

              {/* Main Markdown Article Body */}
              <article style={{ lineHeight: 1.85, color: '#1e293b', fontSize: '1.02rem' }}>
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => {
                      const text = String(children || '')
                      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      return (
                        <h2
                          id={id}
                          style={{
                            fontSize: '1.65rem',
                            fontWeight: 900,
                            marginTop: 48,
                            marginBottom: 20,
                            paddingBottom: 10,
                            borderBottom: '2px solid rgba(34, 197, 94, 0.4)',
                            color: 'var(--color-dark-green, #1a4d2e)',
                            letterSpacing: '-0.01em',
                            scrollMarginTop: 100
                          }}
                        >
                          {children}
                        </h2>
                      )
                    },
                    h3: ({ children }) => (
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 32, marginBottom: 14, color: '#0f172a' }}>
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p style={{ marginBottom: 20, lineHeight: 1.85 }}>{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul style={{ paddingLeft: 24, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol style={{ paddingLeft: 24, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li style={{ lineHeight: 1.75 }}>{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote style={{
                        borderLeft: '4px solid var(--color-primary-dark, #16a34a)',
                        background: 'rgba(34, 197, 94, 0.05)',
                        padding: '18px 24px',
                        borderRadius: '0 12px 12px 0',
                        color: '#334155',
                        margin: '28px 0',
                        fontSize: '0.98rem'
                      }}>
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div style={{ overflowX: 'auto', margin: '32px 0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderRadius: 12 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left', background: 'white' }}>
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead style={{ background: '#1a4d2e', color: 'white' }}>{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th style={{ padding: '14px 18px', fontWeight: 700, borderBottom: '2px solid #143d24' }}>{children}</th>
                    ),
                    td: ({ children }) => (
                      <td style={{ padding: '12px 18px', borderBottom: '1px solid #e2e8f0', color: '#334155' }}>{children}</td>
                    ),
                    code: ({ children, className }) => {
                      if (className) {
                        return (
                          <pre style={{
                            background: '#0f172a',
                            color: '#e2e8f0',
                            padding: '20px',
                            borderRadius: 12,
                            overflowX: 'auto',
                            fontSize: '0.85rem',
                            margin: '24px 0',
                            lineHeight: 1.6
                          }}>
                            <code>{children}</code>
                          </pre>
                        )
                      }
                      return (
                        <code style={{
                          background: '#f1f5f9',
                          color: '#0f766e',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.9em',
                          fontWeight: 600
                        }}>
                          {children}
                        </code>
                      )
                    },
                    strong: ({ children }) => (
                      <strong style={{ color: '#0f172a', fontWeight: 800 }}>{children}</strong>
                    ),
                    a: ({ href, children }) => {
                      const isInternal = href && (href.startsWith('/') || href.includes('avaniagrofoods.com'))
                      if (isInternal) {
                        const internalPath = href.replace('https://www.avaniagrofoods.com', '')
                        return (
                          <Link to={internalPath} style={{ color: 'var(--color-primary-dark, #16a34a)', fontWeight: 700, textDecoration: 'underline' }}>
                            {children}
                          </Link>
                        )
                      }
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-dark, #16a34a)', fontWeight: 600 }}>
                          {children}
                        </a>
                      )
                    }
                  }}
                >
                  {blog.content}
                </ReactMarkdown>
              </article>

              {/* Mid/Bottom Commercial Action Callout */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '1px solid #bbf7d0',
                borderRadius: 20,
                padding: '36px 32px',
                margin: '48px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
                flexWrap: 'wrap'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Commercial Sourcing Opportunity
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#14532d', marginTop: 4, marginBottom: 8 }}>
                    {isMoringa ? 'Discuss Your Bulk Moringa Powder Requirements' : 'Request a Red Onion Powder Quotation'}
                  </h3>
                  <p style={{ color: '#334155', fontSize: '0.92rem', maxWidth: 540 }}>
                    Direct coordination from Maharashtra, India. NABL laboratory COAs provided with every commercial batch. FOB Nhava Sheva & CIF world ports.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="btn btn-primary"
                    style={{ fontWeight: 800, padding: '12px 24px' }}
                  >
                    <Send size={16} /> Quick Commercial Quote
                  </button>
                  <Link
                    to={isMoringa ? '/catalog/moringa-powder' : '/catalog/red-onion-powder'}
                    className="btn btn-outline"
                    style={{ fontWeight: 700 }}
                  >
                    View Product Specs
                  </Link>
                </div>
              </div>

              {/* Inline B2B Enquiry Form */}
              <div style={{ margin: '48px 0' }}>
                <B2BQuickEnquiry
                  productDefault={defaultProduct}
                  title={`Request a Proforma Quote for ${defaultProduct}`}
                  subtitle="Submit your target volume and packaging requirements directly to Sachin Shinde at AVANI AGRO FOODS."
                  sourceContext={`Blog_Article_${blog.id}_${blog.slug}`}
                />
              </div>

              {/* Factual Integrity & Trade Coordination Disclosure */}
              <div style={{
                marginTop: 48,
                padding: '24px 28px',
                background: '#f8fafc',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
                color: '#64748b',
                lineHeight: 1.65
              }}>
                <div style={{ fontWeight: 800, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={16} color="#16a34a" /> Verified Commercial Disclosure & Sourcing Standards
                </div>
                <p style={{ margin: 0, marginBottom: 12 }}>
                  <strong>AVANI AGRO FOODS</strong> operates as an independent Indian Agricultural Trade Coordination Partner based in Latur, Maharashtra. We coordinate sourcing, processing oversight, third-party laboratory verification, and export execution with audited, FSSAI-licensed regional facilities.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Technical Disclaimer:</strong> Specifications, mesh parameters, and regulatory references reflect standard commercial export guidelines. Batch-specific Certificates of Analysis issued by independent, NABL-accredited laboratories are provided for client sign-off prior to ocean container stuffing.
                </p>
              </div>

              {/* Social Sharing */}
              <div style={{ display: 'flex', gap: 12, marginTop: 40, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Share2 size={16} /> Share Sourcing Guide:
                </span>
                <a href={waShare} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#25D366', color: 'white', fontSize: '0.82rem', padding: '8px 16px' }}>
                  📱 WhatsApp
                </a>
                <a href={linkedinShare} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#0A66C2', color: 'white', fontSize: '0.82rem', padding: '8px 16px' }}>
                  💼 LinkedIn
                </a>
                <a href={twitterShare} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#1DA1F2', color: 'white', fontSize: '0.82rem', padding: '8px 16px' }}>
                  🐦 Twitter
                </a>
              </div>
            </main>

            {/* Sidebar Sticky Panel */}
            <aside style={{ position: 'sticky', top: 96, display: 'flex', flexDirection: 'column', gap: 28 }}>
              {/* Quick Inquiry Sticky Card */}
              <div style={{
                background: 'linear-gradient(135deg, #1a4d2e 0%, #143d24 100%)',
                color: 'white',
                padding: '28px',
                borderRadius: 20,
                boxShadow: '0 15px 35px rgba(26,77,46,0.18)'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(255,255,255,0.18)', padding: '4px 10px', borderRadius: 12, display: 'inline-block', marginBottom: 12 }}>
                  FAST B2B QUOTATION
                </span>
                <h3 style={{ color: 'white', fontWeight: 900, fontSize: '1.25rem', marginBottom: 10, lineHeight: 1.3 }}>
                  Source {defaultProduct} Directly from India
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.6 }}>
                  Direct farmgate coordination, verified NABL lab test results, and export container stuffing at Nhava Sheva Port.
                </p>

                <button
                  onClick={() => setModalOpen(true)}
                  className="btn"
                  style={{
                    background: '#22c55e',
                    color: '#0f291e',
                    fontWeight: 900,
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    marginBottom: 12
                  }}
                >
                  <Send size={16} /> Request Proforma Quote
                </button>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Sachin, I am reviewing your sourcing guide on ${blog.title} and want to discuss pricing for ${defaultProduct}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: 'white',
                    width: '100%',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.25)',
                    fontSize: '0.85rem'
                  }}
                >
                  <Phone size={14} /> WhatsApp Trade Coordinator
                </a>
              </div>

              {/* Product Direct Links */}
              <div style={{ background: 'white', padding: '24px', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: 16 }}>
                  Commercial Product Catalogs
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link
                    to="/catalog/moringa-powder"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: isMoringa ? '#f0fdf4' : '#f8fafc',
                      border: isMoringa ? '1px solid #86efac' : '1px solid #e2e8f0',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: isMoringa ? '#166534' : '#334155'
                    }}
                  >
                    <span>🌿 Moringa Leaf Powder</span>
                    <ArrowRight size={14} />
                  </Link>

                  <Link
                    to="/catalog/red-onion-powder"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: isOnion ? '#fff1f2' : '#f8fafc',
                      border: isOnion ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: isOnion ? '#9f1239' : '#334155'
                    }}
                  >
                    <span>🧅 Dehydrated Red Onion</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Related Cluster Articles */}
              {related.length > 0 && (
                <div style={{ background: 'white', padding: '24px', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: 16 }}>
                    Related Sourcing Guides
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {related.map(r => (
                      <Link
                        to={`/blog/${r.slug}`}
                        key={r.slug}
                        style={{
                          textDecoration: 'none',
                          display: 'flex',
                          gap: 12,
                          alignItems: 'flex-start',
                          group: 'hover'
                        }}
                      >
                        <img
                          src={r.thumbnail}
                          alt={r.title}
                          style={{ width: 68, height: 50, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                          loading="lazy"
                        />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.4, color: '#1e293b', marginBottom: 4 }}>
                            {r.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> {r.readTime}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {modalOpen && (
        <B2BQuickEnquiry
          productDefault={defaultProduct}
          title={`Request Proforma Quote for ${defaultProduct}`}
          subtitle="Receive indicative FOB/CIF proforma pricing within 24 hours from AVANI AGRO FOODS Trade Coordination Desk."
          isModal={true}
          onClose={() => setModalOpen(false)}
          sourceContext={`Modal_Blog_${blog.slug}`}
        />
      )}
    </>
  )
}
