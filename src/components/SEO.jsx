import { useEffect } from 'react'

export default function SEO({ title, description, keywords, image }) {
  useEffect(() => {
    document.title = title ? `${title} | Avani Agro Foods` : 'Avani Agro Foods — Premium Moringa & Onion Powder Export'
    
    const setMeta = (name, content, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(isProperty ? 'property' : 'name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    if (description) {
      setMeta('description', description)
      setMeta('og:description', description, true)
      setMeta('twitter:description', description)
    }
    if (keywords) setMeta('keywords', keywords)
    if (title) {
      setMeta('og:title', `${title} | Avani Agro Foods`, true)
      setMeta('twitter:title', `${title} | Avani Agro Foods`)
    }
    if (image) {
      setMeta('og:image', image, true)
      setMeta('twitter:image', image)
    }
  }, [title, description, keywords, image])

  return null
}
