import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppBubble from './components/WhatsAppBubble'
import { Loader2 } from 'lucide-react'

// Eagerly loaded primary public pages
import Home from './pages/Home'
import About from './pages/About'
import Products from './pages/Products'
import Contact from './pages/Contact'
import ExportProcess from './pages/ExportProcess'
import AffiliateResources from './pages/AffiliateResources'

// Lazy-loaded routes for performance & code splitting
const B2BRegistration = lazy(() => import('./pages/B2BRegistration'))
const B2BStore = lazy(() => import('./pages/B2BStore'))
const ManufacturerRequirements = lazy(() => import('./pages/ManufacturerRequirements'))
const ExportCompliance = lazy(() => import('./pages/ExportCompliance'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Manufacturers = lazy(() => import('./pages/Manufacturers'))
const Importers = lazy(() => import('./pages/Importers'))
const FreeAiTools = lazy(() => import('./pages/FreeAiTools'))
const QuotationSheet = lazy(() => import('./pages/QuotationSheet'))
const AdminQuotations = lazy(() => import('./pages/AdminQuotations'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Disclaimer = lazy(() => import('./pages/Disclaimer'))
const AffiliateDisclaimer = lazy(() => import('./pages/AffiliateDisclaimer'))

function PageLoading() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Loader2 size={32} color="var(--color-primary)" className="animate-spin" />
    </div>
  )
}

function RouteChangeHandler() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Update canonical tag dynamically
    let canonicalTag = document.querySelector('link[rel="canonical"]')
    if (!canonicalTag) {
      canonicalTag = document.createElement('link')
      canonicalTag.rel = 'canonical'
      document.head.appendChild(canonicalTag)
    }
    const rawPath = location.pathname
    const cleanPath = rawPath === '/' ? '/' : rawPath.replace(/\/$/, '')
    canonicalTag.href = `https://www.avaniagrofoods.com${cleanPath === '/' ? '/' : cleanPath}`

    // Fire GA4 page_view on route change (SPA navigation)
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname,
        page_title: document.title,
      })
    }
  }, [location.pathname])
  return null
}

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <RouteChangeHandler />
        <Navbar />
        <main>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              {/* Primary Public B2B Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/export-process" element={<ExportProcess />} />
              <Route path="/contact" element={<Contact />} />

              {/* Trade & Compliance Guides */}
              <Route path="/export-compliance" element={<ExportCompliance />} />
              <Route path="/manufacturer-requirements" element={<ManufacturerRequirements />} />
              <Route path="/b2b" element={<B2BRegistration />} />
              <Route path="/b2b/store" element={<B2BStore />} />
              <Route path="/b2b/register" element={<B2BRegistration />} />

              {/* Public Resources & Product Recommendations */}
              <Route path="/resources" element={<AffiliateResources />} />
              <Route path="/affiliate" element={<AffiliateResources />} />

              {/* Directories & Tools */}
              <Route path="/manufacturers" element={<Manufacturers />} />
              <Route path="/importers" element={<Importers />} />
              <Route path="/tools" element={<FreeAiTools />} />

              {/* Educational Blog */}
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* Secure Quotations & Admin */}
              <Route path="/quotation-sheet" element={<QuotationSheet />} />
              <Route path="/admin/quotations" element={<AdminQuotations />} />

              {/* Legal & Compliance Disclosures */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/affiliate-disclaimer" element={<AffiliateDisclaimer />} />
              <Route path="/affiliate-disclosure" element={<AffiliateDisclaimer />} />

              {/* 404 Catch-All */}
              <Route path="*" element={
                <div className="page-top" style={{ textAlign: 'center', padding: '140px 24px' }}>
                  <h1 style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: 16 }}>404</h1>
                  <p style={{ fontSize: '1.2rem', color: 'var(--color-text-light)', marginBottom: 32 }}>Page not found</p>
                  <a href="/" className="btn btn-primary">← Return to Homepage</a>
                </div>
              } />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <WhatsAppBubble />
      </LanguageProvider>
    </Router>
  )
}
