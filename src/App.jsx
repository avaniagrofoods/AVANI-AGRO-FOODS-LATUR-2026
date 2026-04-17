import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppBubble from './components/WhatsAppBubble'

import Home from './pages/Home'
import About from './pages/About'
import Products from './pages/Products'
import B2BStore from './pages/B2BStore'
import Affiliate from './pages/Affiliate'
import AffiliateDashboard from './pages/AffiliateDashboard'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Contact from './pages/Contact'
import FreeAiTools from './pages/FreeAiTools'
import Manufacturers from './pages/Manufacturers'
import Importers from './pages/Importers'
import Privacy from './pages/Privacy'
import Disclaimer from './pages/Disclaimer'
import AffiliateDisclaimer from './pages/AffiliateDisclaimer'

function ScrollToTop() {
  const location = window.location
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
  return null
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/b2b" element={<B2BStore />} />
          <Route path="/affiliate" element={<Affiliate />} />
          <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/tools" element={<FreeAiTools />} />
          <Route path="/manufacturers" element={<Manufacturers />} />
          <Route path="/importers" element={<Importers />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/affiliate-disclaimer" element={<AffiliateDisclaimer />} />
          <Route path="*" element={
            <div className="page-top" style={{ textAlign: 'center', padding: '140px 24px' }}>
              <h1 style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--color-primary)', marginBottom: 16 }}>404</h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--color-text-light)', marginBottom: 32 }}>Page not found</p>
              <a href="/" className="btn btn-primary">← Back to Home</a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
      <WhatsAppBubble />
    </Router>
  )
}
