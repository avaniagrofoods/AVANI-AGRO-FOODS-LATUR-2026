import { useEffect } from 'react'

export default function SEO({ title, description, keywords, image, noindex = false }) {
  useEffect(() => {
    // Format title
    let fullTitle = 'AVANI AGRO FOODS — Premium Moringa & Onion Powder Exporter'
    if (title) {
      fullTitle = title.includes('AVANI AGRO FOODS') || title.includes('Avani Agro Foods')
        ? title
        : `${title} | AVANI AGRO FOODS`
    }
    document.title = fullTitle

    const setMeta = (name, content, isProperty = false) => {
      if (!content) return
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(isProperty ? 'property' : 'name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    // Robots directive
    const robotsDirective = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    setMeta('robots', robotsDirective)

    if (description) {
      setMeta('description', description)
      setMeta('og:description', description, true)
      setMeta('twitter:description', description)
    }
    if (keywords) setMeta('keywords', keywords)
    
    setMeta('og:title', fullTitle, true)
    setMeta('twitter:title', fullTitle)

    const defaultImage = 'https://www.avaniagrofoods.com/og-image.jpg'
    const ogImage = image || defaultImage
    setMeta('og:image', ogImage, true)
    setMeta('twitter:image', ogImage)

    // Canonical link management (strict self-referencing normalization)
    const rawPath = window.location.pathname
    const cleanPath = rawPath === '/' ? '' : rawPath.replace(/\/$/, '')
    const canonicalUrl = `https://www.avaniagrofoods.com${cleanPath || '/'}`
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonicalUrl)
  }, [title, description, keywords, image, noindex])

  return null
}
