// ============================================================
// AVANI AGRO FOODS — CENTRALIZED BUSINESS & RESOURCES CONFIGURATION
// Single Source of Truth for Business Contact, Product Sourcing & Resources
// ============================================================

// ── Official Business Information ─────────────────────────
export const BUSINESS_INFO = {
  name: 'AVANI AGRO FOODS',
  tagline: 'Indian Agricultural Export Coordination & B2B Sourcing',
  owner: 'Sachin Shinde',
  businessType: 'Export Coordination / Merchant Sourcing',
  registration: 'Udyam / MSME Registered',
  phone: '+91 7219053645',
  whatsapp: '917219053645', // E.164 format without +
  email: 'sales@avaniagrofoods.com',
  website: 'https://www.avaniagrofoods.com',
  address: {
    line1: 'Old Barshi Road, Kulswamininagar',
    line2: '5 No Chauk, Next to Sai School',
    city: 'Latur',
    state: 'Maharashtra',
    pin: '413512',
    country: 'India',
    countryCode: 'IN',
    full: 'Old Barshi Road, Kulswamininagar, 5 No Chauk, Next to Sai School, Latur – 413512, Maharashtra, India',
    lines: [
      'Old Barshi Road, Kulswamininagar,',
      '5 No Chauk, Next to Sai School,',
      'Latur – 413512,',
      'Maharashtra, India',
    ],
  },
  primaryProducts: [
    {
      id: 'moringa-powder',
      name: 'Moringa Powder',
      hscode: '0712.90.90',
      description: 'Export-grade Moringa oleifera leaf powder sourced from Maharashtra processor partners.',
    },
    {
      id: 'red-onion-powder',
      name: 'Red Onion Powder',
      hscode: '0712.20.00',
      description: 'Dehydrated Indian red onion powder with consistent pungency for food manufacturing.',
    },
  ],
}

// Convenience aliases for legacy imports across codebase
export const WHATSAPP_NUMBER = BUSINESS_INFO.whatsapp
export const OWNER_EMAIL = BUSINESS_INFO.email
export const CATALOG_LINK = '/catalog.html'

// ── Third-Party Recommended Resources & Product Links ─────────
// Independent educational and product recommendations.
// AVANI AGRO FOODS may earn a referral commission on qualifying purchases at no extra cost to the buyer.
export const RECOMMENDED_RESOURCES = [
  {
    id: 'rec_moringa_superfoods',
    name: 'Organic India Moringa Leaf Powder',
    category: 'Superfoods & Food Products',
    platform: 'Amazon',
    description: 'Certified organic whole leaf moringa powder packaged in airtight containers for retail and kitchen use.',
    targetAudience: 'Consumers, wellness retailers, and small-batch food preparers.',
    url: 'https://tinyurl.com/ywenv6wz',
    badge: 'Popular Choice',
    pros: ['Certified organic', 'Widely available', 'Consistent grind'],
    cons: ['Retail package size only (100g-250g)'],
    whoItsFor: 'Ideal for testing moringa formulations or everyday dietary smoothies.',
    whoShouldAvoid: 'Commercial B2B buyers requiring 25kg bulk export drums (contact AVANI directly).',
    lastUpdated: '2026-08',
  },
  {
    id: 'rec_kuli_kuli',
    name: 'Kuli Kuli Pure Moringa Vegetable Powder',
    category: 'Superfoods & Food Products',
    platform: 'Amazon Global',
    description: 'Sustainably sourced moringa powder recognized in US & global natural food markets.',
    targetAudience: 'Global wellness enthusiasts and specialty grocers.',
    url: 'https://amzn.to/4v7LZmw',
    badge: 'Global Favorite',
    pros: ['High purity standards', 'Well-established international retail brand'],
    cons: ['Higher cost per gram than bulk sourcing'],
    whoItsFor: 'Retail buyers in the Americas and Europe.',
    whoShouldAvoid: 'Industrial food processors needing ton-scale raw materials.',
    lastUpdated: '2026-08',
  },
  {
    id: 'rec_himalayan_organics',
    name: 'Himalayan Organics Moringa Powder',
    category: 'Superfoods & Food Products',
    platform: 'Amazon India',
    description: 'Fine ground moringa powder suitable for herbal supplements, beverages, and cosmetic masks.',
    targetAudience: 'Herbal brand developers and consumer wellness buyers.',
    url: 'https://tinyurl.com/efttfn8x',
    badge: 'Herbal Grade',
    pros: ['Fine 80-mesh powder', 'Lab tested for heavy metals'],
    cons: ['Retail packaging only'],
    whoItsFor: 'Individuals and small businesses exploring herbal recipes.',
    whoShouldAvoid: 'Bulk commodity traders.',
    lastUpdated: '2026-08',
  },
  {
    id: 'rec_iherb_wellness',
    name: 'iHerb Global Superfood & Herbal Selection',
    category: 'Food Ingredients & Processing',
    platform: 'iHerb',
    description: 'Curated international marketplace featuring dietary supplements, organic herbs, and superfood ingredients.',
    targetAudience: 'International health and wellness product buyers.',
    url: 'https://iherb.co/ocZkYDSJ',
    badge: 'International Marketplace',
    pros: ['Worldwide shipping to 150+ countries', 'Extensive brand selection', 'Strict temperature control'],
    cons: ['Cross-border import duties may apply based on destination'],
    whoItsFor: 'International shoppers seeking verified wellness brands.',
    whoShouldAvoid: 'Buyers looking for industrial FOB container shipments.',
    lastUpdated: '2026-08',
  },
]

// Legacy structure compatibility alias
export const AFFILIATE_LINKS = {
  AMAZON: {
    GLOBAL: {
      name: 'Amazon Global (Moringa Central)',
      url: 'https://www.amazon.com/b?node=53629917011',
      platform: 'Amazon US',
      market: 'Global Buyers',
    },
    ORGANIC_INDIA: {
      name: 'Organic India Moringa',
      url: 'https://tinyurl.com/ywenv6wz',
      platform: 'Amazon India',
      market: 'India Buyers',
    },
    HIMALAYAN_ORGANICS: {
      name: 'Himalayan Organics Moringa',
      url: 'https://tinyurl.com/efttfn8x',
      platform: 'Amazon India',
      market: 'India Buyers',
    },
    KULI_KULI: {
      name: 'Kuli Kuli Moringa (Global)',
      url: 'https://amzn.to/4v7LZmw',
      platform: 'Amazon Global',
      market: 'Global Buyers',
    },
  },
  IHERB: {
    INDIA: {
      name: 'iHerb India Selection',
      url: 'https://in.iherb.com/info/affiliates?rcode=PQZ1679',
      platform: 'iHerb India',
      market: 'India Buyers',
    },
    US: {
      name: 'iHerb US / Global',
      url: 'https://iherb.co/ocZkYDSJ',
      platform: 'iHerb US',
      market: 'Global Buyers',
    },
  },
}

export const STRIPE_ENABLED = false
export const STRIPE_LINKS = { INDIA: {}, GLOBAL: {} }
