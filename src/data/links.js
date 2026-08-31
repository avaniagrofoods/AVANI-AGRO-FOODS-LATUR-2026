// ============================================================
// AVANI AGRO FOODS — CENTRALIZED BUSINESS & SOURCING CONFIGURATION
// Single Source of Truth for Business Contact, Product Sourcing & Trade Coordination
// ============================================================

// ── Official Business Identity ─────────────────────────────
export const BUSINESS_INFO = {
  name: 'AVANI AGRO FOODS',
  tagline: 'Indian Agricultural Export Coordination & B2B Sourcing',
  owner: 'Sachin Shinde',
  role: 'Trade Coordinator',
  businessType: 'Export Coordination / Merchant Sourcing Partner',
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
      slug: 'moringa-powder',
      name: 'Moringa Powder',
      botanicalName: 'Moringa oleifera',
      hscode: '0712.90.90',
      description: 'Export-grade Moringa oleifera leaf powder coordinated from qualified Maharashtra processor partners.',
      mesh: '80–100 Mesh (Fine Powder)',
      moisture: '≤ 7.0% (typical)',
      packaging: '5 kg Poly Liners / 25 kg HDPE Drums or Multi-Wall Kraft Bags',
      moq: '100 kg (Commercial Sourcing)',
      leadTime: 'Pre-shipment samples: 3–5 days; Commercial orders: 14–21 days from confirmation'
    },
    {
      id: 'red-onion-powder',
      slug: 'red-onion-powder',
      name: 'Red Onion Powder',
      botanicalName: 'Allium cepa',
      hscode: '0712.20.00',
      description: 'Dehydrated Indian red onion powder engineered for standardized aroma and commercial food processing.',
      mesh: '60–80 Mesh',
      moisture: '≤ 6.0% (typical)',
      packaging: '5 kg Inner Liners / 20 kg Cartons / 25 kg Poly-Lined Sacks',
      moq: '100 kg (Commercial Sourcing)',
      leadTime: 'Pre-shipment samples: 3–5 days; Commercial orders: 14–21 days from confirmation'
    },
  ],
}

// Convenience exports for backwards compatibility
export const WHATSAPP_NUMBER = BUSINESS_INFO.whatsapp
export const OWNER_EMAIL = BUSINESS_INFO.email
export const CATALOG_LINK = '/catalog'

// ── Centralized Affiliate Programs Architecture ────────────
// STATUS: AVANI AGRO FOODS is NOT currently registered with affiliate networks.
// All affiliate programs are disabled (enabled: false).
// CTA buttons render "Coming Soon" or "Affiliate link will be available after program registration."
export const affiliatePrograms = {
  amazonAssociatesIndia: {
    programName: 'Amazon Associates India',
    network: 'Amazon.in',
    status: 'NOT_REGISTERED',
    affiliateId: null,
    baseUrl: 'https://www.amazon.in',
    enabled: false,
    disclosure: 'AVANI AGRO FOODS may participate in Amazon Associates in the future.',
    trackingUrl: null
  },
  amazonAssociatesUS: {
    programName: 'Amazon Associates US / Global',
    network: 'Amazon.com',
    status: 'NOT_REGISTERED',
    affiliateId: null,
    baseUrl: 'https://www.amazon.com',
    enabled: false,
    disclosure: 'AVANI AGRO FOODS may participate in Amazon Associates Global in the future.',
    trackingUrl: null
  },
  iHerbRewards: {
    programName: 'iHerb Rewards & Affiliate',
    network: 'iHerb',
    status: 'NOT_REGISTERED',
    affiliateId: null,
    baseUrl: 'https://www.iherb.com',
    enabled: false,
    disclosure: 'AVANI AGRO FOODS may participate in iHerb partner referral program in the future.',
    trackingUrl: null
  }
}

// Global master switch
export const AFFILIATE_SYSTEM_ENABLED = false;

// Educational Resources & Third-Party Product References (Informational Only)
export const RECOMMENDED_RESOURCES = [
  {
    id: 'res_01',
    name: 'Organic Moringa Leaf Powder (Reference Brand)',
    category: 'Superfoods & Wellness Products',
    platform: 'Amazon (Future Affiliate)',
    description: 'Certified organic whole leaf moringa powder in consumer-ready packaging for culinary tests and retail recipes.',
    specs: ['100g / 250g Jar', 'USDA / India Organic Standards', 'Fine 80-Mesh'],
    pros: ['Widely available in retail', 'Useful for kitchen benchmarking'],
    cons: ['Retail package size only (not industrial bulk)'],
    whoItsFor: 'Consumers and food developers testing recipes.',
    whoShouldAvoid: 'B2B commercial importers requiring container shipments (contact AVANI directly).',
    enabled: false,
    affiliateUrl: null,
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_02',
    name: 'Commercial Stainless Steel Food Dehydrator (10-Tray)',
    category: 'Kitchen & Dehydration Equipment',
    platform: 'Specialist Equipment (Future Affiliate)',
    description: 'Digital food dehydrator with horizontal rear fan for controlled low-temperature drying of herbs and vegetables.',
    specs: ['10 Food-Grade 304 Stainless Steel Trays', 'Adjustable 30°C–90°C Thermostat', 'Digital Timer'],
    pros: ['Precise temperature regulation', 'Durable stainless steel construction'],
    cons: ['Countertop scale; not suited for multi-ton industrial drying'],
    whoItsFor: 'Small-batch food entrepreneurs and recipe developers.',
    whoShouldAvoid: 'Industrial processing factories requiring continuous tunnel dryers.',
    enabled: false,
    affiliateUrl: null,
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_03',
    name: 'Heavy-Duty Commercial High-Speed Blender (2200W)',
    category: 'Kitchen & Dehydration Equipment',
    platform: 'Equipment Supplier (Future Affiliate)',
    description: 'Commercial pulverizing blender equipped with hardened blades for turning dried flakes and botanicals into fine powders.',
    specs: ['2.0L BPA-Free Container', '2200W Copper Motor', 'Variable Speed + Pulse'],
    pros: ['High pulverization power', 'Robust commercial motor'],
    cons: ['High decibel level at maximum RPM'],
    whoItsFor: 'Smoothie bars, test kitchens, and artisanal formulators.',
    whoShouldAvoid: 'Industrial flour and spice mills requiring 100-mesh pin mills.',
    enabled: false,
    affiliateUrl: null,
    lastUpdated: 'August 2026'
  },
  {
    id: 'res_04',
    name: 'Digital Grain & Powder Moisture Meter',
    category: 'Agricultural & Sourcing Tools',
    platform: 'Testing Instruments (Future Affiliate)',
    description: 'Handheld digital moisture meter with probe sensors for fast on-site verification of moisture content in agricultural commodities.',
    specs: ['Range: 2% to 30%', 'LCD Backlit Display', 'Automatic Temperature Compensation'],
    pros: ['Quick non-destructive field testing', 'Essential for initial lot screening'],
    cons: ['Requires laboratory oven test confirmation for official export COA'],
    whoItsFor: 'Procurement coordinators, agricultural inspectors, and quality controllers.',
    whoShouldAvoid: 'General retail shoppers.',
    enabled: false,
    affiliateUrl: null,
    lastUpdated: 'August 2026'
  }
]

export const STRIPE_ENABLED = false
export const STRIPE_LINKS = { INDIA: {}, GLOBAL: {} }
