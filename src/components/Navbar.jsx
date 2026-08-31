import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Globe, ChevronDown, Languages, Sparkles, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATALOG_LINK } from '../data/links'
import { useLanguage } from '../context/LanguageContext'

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Products', href: '/products' },
  { label: 'Export Process', href: '/export-process' },
  {
    label: 'Trade Guides',
    children: [
      { label: '🌍 35-Market Compliance Guide', href: '/export-compliance' },
      { label: '🏭 Manufacturer Requirements', href: '/manufacturer-requirements' },
      { label: '💼 B2B Trade Directory', href: '/b2b' },
    ]
  },
  { label: 'Resources & Reviews', href: '/resources' },
  { label: 'Blog', href: '/blog' },
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
          <img src="/logo.png" alt="AVANI AGRO FOODS Logo" style={{ height: 44, width: 'auto' }} onError={(e) => { e.target.onerror = null; e.target.src = "/logo.jpeg"; }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="navbar-logo-text">
              <span style={{ color: 'var(--color-accent)' }}>AVANI</span> <span>AGRO FOODS</span>
            </div>
            <div className="navbar-logo-sub">INDIAN AGRICULTURAL EXPORT COORDINATION</div>
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
          <li>
            <Link to="/export-process" className={`nav-link ${isActive('/export-process') ? 'active' : ''}`}>{t.exportProcess}</Link>
          </li>
          
          {/* Trade Guides Dropdown */}
          <li onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)} style={{ position: 'relative' }}>
            <button className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Trade Guides <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute', top: '100%', left: isRTL ? 'auto' : 0, right: isRTL ? 0 : 'auto', minWidth: 240,
                    background: 'white', boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    padding: '8px 0', zIndex: 100, marginTop: 4
                  }}
                >
                  <Link to="/export-compliance" className="nav-link" style={{ display: 'block', padding: '10px 18px', fontSize: '0.85rem' }}>
                    🌍 35-Market Compliance Guide
                  </Link>
                  <Link to="/manufacturer-requirements" className="nav-link" style={{ display: 'block', padding: '10px 18px', fontSize: '0.85rem' }}>
                    🏭 Manufacturer Requirements
                  </Link>
                  <Link to="/b2b" className="nav-link" style={{ display: 'block', padding: '10px 18px', fontSize: '0.85rem' }}>
                    💼 B2B Directory
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </li>

          <li>
            <Link to="/resources" className={`nav-link ${isActive('/resources') || isActive('/affiliate') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={13} color="var(--color-accent)" /> {t.resources}
            </Link>
          </li>

          <li>
            <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`}>{t.blog}</Link>
          </li>

          <li>
            <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>{t.contact}</Link>
          </li>
          
          <li style={{ marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0, display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Language Switcher */}
            <div onMouseEnter={() => setLangOpen(true)} onMouseLeave={() => setLangOpen(false)} style={{ position: 'relative' }}>
              <button className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'var(--color-bg-alt)', borderRadius: 20, fontSize: '0.75rem' }}>
                <Languages size={14} /> <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{lang}</span>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                      position: 'absolute', top: '100%', right: 0, minWidth: 120,
                      background: 'white', boxShadow: 'var(--shadow-lg)',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      padding: '4px', zIndex: 100, marginTop: 4
                    }}
                  >
                    <button onClick={() => setLang('en')} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: lang === 'en' ? 'var(--color-bg-alt)' : 'none', cursor: 'pointer', fontSize: '0.82rem' }}>English</button>
                    <button onClick={() => setLang('ar')} style={{ width: '100%', padding: '8px 12px', textAlign: 'right', border: 'none', background: lang === 'ar' ? 'var(--color-bg-alt)' : 'none', cursor: 'pointer', fontSize: '0.82rem' }}>العربية</button>
                    <button onClick={() => setLang('fr')} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: lang === 'fr' ? 'var(--color-bg-alt)' : 'none', cursor: 'pointer', fontSize: '0.82rem' }}>Français</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/contact" className="nav-cta" style={{ gap: 6, padding: '8px 18px', fontSize: '0.82rem' }}>
              <Send size={13} /> {t.getQuote}
            </Link>
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
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 72, left: 0, right: 0, background: 'white',
              padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4,
              borderBottom: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', zIndex: 999,
              maxHeight: 'calc(100vh - 80px)', overflowY: 'auto'
            }}
          >
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} style={{ padding: '10px 4px' }}>Home</Link>
            <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`} style={{ padding: '10px 4px' }}>About</Link>
            <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`} style={{ padding: '10px 4px' }}>Products</Link>
            <Link to="/export-process" className={`nav-link ${isActive('/export-process') ? 'active' : ''}`} style={{ padding: '10px 4px' }}>Export Process</Link>
            <Link to="/export-compliance" className={`nav-link ${isActive('/export-compliance') ? 'active' : ''}`} style={{ padding: '10px 4px' }}>Export Compliance Guide</Link>
            <Link to="/manufacturer-requirements" className={`nav-link ${isActive('/manufacturer-requirements') ? 'active' : ''}`} style={{ padding: '10px 4px' }}>Manufacturer Onboarding</Link>
            <Link to="/resources" className={`nav-link ${isActive('/resources') ? 'active' : ''}`} style={{ padding: '10px 4px' }}>Resources &amp; Reviews</Link>
            <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`} style={{ padding: '10px 4px' }}>Blog</Link>
            <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`} style={{ padding: '10px 4px' }}>Contact &amp; RFQ</Link>

            <Link to="/contact" className="btn btn-primary" style={{ textAlign: 'center', marginTop: 12, justifyContent: 'center' }}>
              Request a B2B Quote
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 1023px) {
          .hide-mobile { display: none !important; }
          #mobile-burger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
