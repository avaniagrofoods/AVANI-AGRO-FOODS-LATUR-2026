import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Globe, ChevronDown, Languages } from 'lucide-react'
import { CATALOG_LINK } from '../data/links'
import { useLanguage } from '../context/LanguageContext'

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Products', href: '/products' },
  {
    label: 'Directory',
    children: [
      { label: '🏭 Manufacturers DB', href: '/manufacturers' },
      { label: '🌍 Global Importers', href: '/importers' },
    ]
  },
  { label: 'Blog', href: '/blog' },
  { label: 'Affiliate', href: '/affiliate' },
  { label: 'Free AI Tools', href: '/tools' },
  { label: 'B2B Store', href: '/b2b' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const { lang, setLang, t, isRTL } = useLanguage()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  const isActive = (href) => location.pathname === href

  return (
    <nav className="navbar" style={{ boxShadow: scrolled ? 'var(--shadow-md)' : 'var(--shadow-sm)' }}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src="/logo.png" alt="Avani Agro Foods Logo" style={{ height: 48, width: 'auto' }} onError={(e) => { e.target.onerror = null; e.target.src = "/logo.jpeg"; }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="navbar-logo-text">
              <span style={{ color: 'var(--color-accent)' }}>AVANI</span> <span>AGRO FOODS</span>
            </div>
            <div className="navbar-logo-sub">THE GROUP OF HEALTHY LIFESTYLE</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar-nav hide-mobile" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>{t.home}</Link>
          </li>
          <li>
            <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>{t.about}</Link>
          </li>
          <li>
            <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>{t.products}</Link>
          </li>
          <li onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)} style={{ position: 'relative' }}>
            <button className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {t.directory} <ChevronDown size={14} />
            </button>
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: isRTL ? 'auto' : 0, right: isRTL ? 0 : 'auto',
                minWidth: 200, background: 'white', boxShadow: 'var(--shadow-lg)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                padding: '8px', zIndex: 100
              }}>
                <Link to="/manufacturers" className="nav-link" style={{ display: 'block', padding: '10px 14px' }}>{t.manufacturers}</Link>
                <Link to="/importers" className="nav-link" style={{ display: 'block', padding: '10px 14px' }}>{t.importers}</Link>
              </div>
            )}
          </li>
          <li>
            <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`}>{t.blog}</Link>
          </li>
          <li>
            <Link to="/affiliate" className={`nav-link ${isActive('/affiliate') ? 'active' : ''}`}>{t.affiliate}</Link>
          </li>
          <li>
            <Link to="/b2b" className={`nav-link ${isActive('/b2b') ? 'active' : ''}`}>{t.b2bStore}</Link>
          </li>
          <li>
            <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>{t.contact}</Link>
          </li>
          
          <li style={{ marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Language Switcher */}
            <div onMouseEnter={() => setLangOpen(true)} onMouseLeave={() => setLangOpen(false)} style={{ position: 'relative' }}>
              <button className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--color-bg-alt)', borderRadius: 20 }}>
                <Languages size={16} /> <span style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: '0.75rem' }}>{lang}</span>
              </button>
              {langOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, minWidth: 120,
                  background: 'white', boxShadow: 'var(--shadow-lg)',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                  padding: '4px', zIndex: 100
                }}>
                  <button onClick={() => setLang('en')} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: lang === 'en' ? 'var(--color-bg-alt)' : 'none', cursor: 'pointer', fontSize: '0.85rem' }}>English</button>
                  <button onClick={() => setLang('ar')} style={{ width: '100%', padding: '8px 12px', textAlign: 'right', border: 'none', background: lang === 'ar' ? 'var(--color-bg-alt)' : 'none', cursor: 'pointer', fontSize: '0.85rem' }}>العربية</button>
                  <button onClick={() => setLang('fr')} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: lang === 'fr' ? 'var(--color-bg-alt)' : 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Français</button>
                </div>
              )}
            </div>

            <a href={CATALOG_LINK} target="_blank" rel="noopener noreferrer" className="nav-cta" style={{ gap: 6 }}>
              <Globe size={14} /> {t.viewCatalog}
            </a>
          </li>
        </ul>

        {/* Mobile burger */}
        <button
          className="burger"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          style={{ display: 'none' }}
          id="mobile-burger"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          position: 'fixed', top: 72, left: 0, right: 0, background: 'white',
          padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4,
          borderBottom: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', zIndex: 999
        }}>
          {NAV_ITEMS.map((item) => (
            item.children ? (
              <div key={item.label}>
                <div style={{ padding: '10px 0', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{item.label}</div>
                {item.children.map(c => (
                  <Link key={c.href} to={c.href} className="nav-link" style={{ display: 'block', padding: '10px 16px' }}>
                    {c.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link key={item.label} to={item.href} className={`nav-link ${isActive(item.href) ? 'active' : ''}`} style={{ display: 'block', textAlign: 'left', padding: '12px 4px' }}>
                {item.label}
              </Link>
            )
          ))}
          <a href={CATALOG_LINK} target="_blank" rel="noopener noreferrer" className="nav-cta" style={{ textAlign: 'center', marginTop: 8 }}>
            📄 View Catalog
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 1023px) {
          .hide-mobile { display: none !important; }
          #mobile-burger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
