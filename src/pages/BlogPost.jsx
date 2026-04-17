import { useParams, Link } from 'react-router-dom'
import { getBlogBySlug, BLOGS } from '../data/blogs'
import SEO from '../components/SEO'
import { Clock, ArrowLeft, ArrowRight, Share2, ExternalLink } from 'lucide-react'
import { WHATSAPP_NUMBER } from '../data/links'
import ReactMarkdown from 'react-markdown'

export default function BlogPost() {
  const { slug } = useParams()
  const blog = getBlogBySlug(slug)

  if (!blog) {
    return (
      <div className="page-top" style={{ textAlign: 'center', padding: '120px 24px' }}>
        <h1>Article not found</h1>
        <Link to="/blog" className="btn btn-primary" style={{ marginTop: 24 }}>← Back to Blog</Link>
      </div>
    )
  }

  const related = BLOGS.filter(b => b.category === blog.category && b.slug !== blog.slug).slice(0, 3)
  const shareUrl = `https://www.avaniagrofoods.com/blog/${blog.slug}`
  const waShare = `https://wa.me/?text=${encodeURIComponent(`${blog.title} - ${shareUrl}`)}`

  return (
    <>
      <SEO title={blog.seoTitle || blog.title} description={blog.seoDesc || blog.excerpt} keywords={blog.keywords?.join(', ')} image={blog.thumbnail} />

      <div className="page-top">
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', padding: '72px 24px', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginBottom: 20, display: 'inline-block' }}>{blog.category}</span>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 900, color: 'white', lineHeight: 1.25, marginBottom: 20 }}>{blog.title}</h1>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                <Clock size={14} /> {blog.readTime} read
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>By {blog.author}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{blog.date}</span>
            </div>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 900, padding: '64px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 48, alignItems: 'flex-start' }}>

            {/* Main Content */}
            <div>
              <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: 32 }}>
                <ArrowLeft size={14} /> Back to Blog
              </Link>

              <img src={blog.thumbnail} alt={blog.title} style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: 40, maxHeight: 400, objectFit: 'cover' }} />

              {/* Article Body */}
              <article style={{ lineHeight: 1.85, color: 'var(--color-text)' }}>
                <div style={{
                  '--prose-h2-size': '1.5rem',
                  '--prose-h3-size': '1.2rem',
                }}>
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: 40, marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid var(--color-primary)', color: 'var(--color-primary-dark)' }}>{children}</h2>,
                      h3: ({ children }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 28, marginBottom: 12 }}>{children}</h3>,
                      p: ({ children }) => <p style={{ marginBottom: 18, lineHeight: 1.85 }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 20 }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 20 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ marginBottom: 8, lineHeight: 1.7 }}>{children}</li>,
                      blockquote: ({ children }) => <blockquote style={{ borderLeft: '4px solid var(--color-primary)', paddingLeft: 20, color: 'var(--color-text-light)', fontStyle: 'italic', margin: '24px 0' }}>{children}</blockquote>,
                      code: ({ children, className }) => className ? <pre style={{ background: '#f4f6f4', padding: '16px', borderRadius: 8, overflow: 'auto', fontSize: '0.85rem' }}><code>{children}</code></pre> : <code style={{ background: '#f0f4f0', padding: '2px 6px', borderRadius: 4, fontSize: '0.88em', color: 'var(--color-primary-dark)' }}>{children}</code>,
                      table: ({ children }) => <div style={{ overflowX: 'auto', marginBottom: 24 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>{children}</table></div>,
                      th: ({ children }) => <th style={{ background: 'var(--color-primary)', color: 'white', padding: '10px 14px', textAlign: 'left', fontSize: '0.78rem' }}>{children}</th>,
                      td: ({ children }) => <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>{children}</td>,
                      strong: ({ children }) => <strong style={{ color: 'var(--color-primary-dark)', fontWeight: 800 }}>{children}</strong>,
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{children}</a>,
                    }}
                  >
                    {blog.content}
                  </ReactMarkdown>
                </div>
              </article>

              {/* Affiliate Disclaimer */}
              <div style={{ marginTop: 48, padding: '20px', background: 'rgba(230,168,23,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(230,168,23,0.2)', fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                <strong>📋 Affiliate Disclosure:</strong> This article may contain affiliate links to Amazon and iHerb. If you purchase through these links, Avani Agro Foods earns a small commission at no additional cost to you. This helps support our free content. All opinions are our own.
                <br /><br />
                <strong>⚕️ Medical Disclaimer:</strong> The health information provided is for educational purposes only and is not a substitute for professional medical advice.
              </div>

              {/* Share */}
              <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Share2 size={16} /> Share:</span>
                <a href={waShare} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#25D366', color: 'white', fontSize: '0.85rem' }}>📱 WhatsApp</a>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#1DA1F2', color: 'white', fontSize: '0.85rem' }}>🐦 Twitter</a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#0A66C2', color: 'white', fontSize: '0.85rem' }}>💼 LinkedIn</a>
              </div>
            </div>

            {/* Sidebar */}
            <aside>
              {/* CTA Card */}
              <div className="card" style={{ padding: '28px', marginBottom: 24, background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))' }}>
                <h3 style={{ color: 'white', fontWeight: 900, marginBottom: 12 }}>Need Bulk Moringa?</h3>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.6 }}>Export-grade. Lab certified. 25 kg minimum. Samples available.</p>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I read your blog about moringa and I need pricing.`} target="_blank" rel="noopener noreferrer" className="btn" style={{ background: '#25D366', color: 'white', width: '100%', justifyContent: 'center' }}>
                  📱 WhatsApp Us
                </a>
              </div>

              {/* Related Posts */}
              {related.length > 0 && (
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ fontWeight: 900, marginBottom: 20, fontSize: '1rem' }}>Related Articles</h3>
                  {related.map(r => (
                    <Link to={`/blog/${r.slug}`} key={r.slug} style={{ textDecoration: 'none', display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                      <img src={r.thumbnail} alt={r.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.4, color: 'var(--color-text)', marginBottom: 4 }}>{r.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} /> {r.readTime}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}
