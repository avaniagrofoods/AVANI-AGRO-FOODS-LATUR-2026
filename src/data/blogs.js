// ============================================================
// AVANI AGRO FOODS — 30 B2B CONTENT MARKETING LIBRARY & EXPORT SOURCING GUIDES
// Author: Sachin Shinde, Trade Coordinator, AVANI AGRO FOODS
// Location: Latur, Maharashtra, India
// Contact: sales@avaniagrofoods.com | +91 7219053645
// ============================================================

import { MORINGA_ARTICLES } from './articles/moringaArticles.js'
import { ONION_ARTICLES } from './articles/onionArticles.js'

export const CATEGORIES = [
  'All',
  'Moringa Powder',
  'Red Onion Powder',
  'Quality Assurance',
  'Supplier Evaluation',
  'Product Applications',
  'Packaging & Storage',
  'Specifications',
  'Export Procedures',
  'Private Label',
  'International Compliance',
  'Quotation & Pricing'
]

// All 30 authoritative B2B articles
export const BLOGS = [
  ...MORINGA_ARTICLES,
  ...ONION_ARTICLES
]

// Backward-compatibility alias map for historical URLs
export const SLUG_ALIASES = {
  'uses-of-moringa-powder-food-beverage-ingredient-applications': 'moringa-powder-applications-food-beverage-manufacturing',
  'moringa-powder-benefits-nutritional-profile-uses-considerations': 'what-is-moringa-powder-b2b-buyer-sourcing-guide-india',
  'how-much-moringa-powder-to-use-serving-guidance': 'moringa-powder-applications-food-beverage-manufacturing',
  'moringa-powder-vs-fresh-moringa-leaves-format-comparison': 'what-is-moringa-powder-b2b-buyer-sourcing-guide-india',
  'how-to-identify-good-quality-moringa-powder': 'moringa-powder-quality-checklist-bulk-buyers',
  'red-onion-powder-uses-food-applications-buying-guide': 'red-onion-powder-applications-food-manufacturing',
  'red-onion-powder-vs-fresh-onion-cost-convenience-advantages': 'what-is-red-onion-powder-complete-b2b-buyers-guide',
  'how-international-buyers-source-moringa-powder-from-india': 'moringa-powder-export-from-india-international-buyer-guide',
  'how-to-source-red-onion-powder-from-indian-manufacturers': 'how-to-choose-reliable-red-onion-powder-supplier-india',
  'indian-agricultural-ingredient-export-process-buyer-to-shipment': 'moringa-powder-export-from-india-international-buyer-guide',
  'moringa-powder-packaging-for-international-b2b-buyers': 'moringa-powder-packaging-storage-international-buyers',
  'what-international-buyers-should-ask-an-indian-ingredient-supplier': 'questions-to-ask-before-choosing-moringa-powder-supplier',
  'fob-vs-cif-what-importers-need-to-know': 'bulk-moringa-powder-important-factors-before-importing',
  'moq-lead-time-packaging-guide-bulk-ingredient-buyers': 'bulk-red-onion-powder-guide-importers-distributors',
  'how-to-evaluate-an-indian-food-ingredient-supplier-before-ordering': 'how-to-choose-reliable-moringa-powder-supplier-india'
}

/**
 * Retrieve article by slug with automatic legacy alias resolution
 */
export const getBlogBySlug = (slug) => {
  if (!slug) return null
  
  // Direct match
  const directMatch = BLOGS.find(b => b.slug === slug)
  if (directMatch) return directMatch

  // Check legacy aliases
  const targetSlug = SLUG_ALIASES[slug]
  if (targetSlug) {
    const aliasedMatch = BLOGS.find(b => b.slug === targetSlug)
    if (aliasedMatch) return aliasedMatch
  }

  // Case-insensitive fallback
  const normalized = slug.toLowerCase()
  return BLOGS.find(b => b.slug.toLowerCase() === normalized) || null
}

/**
 * Get related articles filtered by product category or related tags
 */
export const getRelatedBlogs = (currentBlog, limit = 3) => {
  if (!currentBlog) return []
  return BLOGS.filter(b => 
    b.slug !== currentBlog.slug && 
    (b.category === currentBlog.category || 
     (currentBlog.keywords && b.keywords && currentBlog.keywords.some(k => b.keywords.includes(k))))
  ).slice(0, limit)
}
