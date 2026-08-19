// ============================================================
// AVANI AGRO FOODS — CENTRALIZED BUSINESS CONFIGURATION
// Update this file to change contact info site-wide.
// ============================================================

// ── Official Business Information ─────────────────────────
export const BUSINESS_INFO = {
  name: 'AVANI AGRO FOODS',
  owner: 'Sachin Shinde',
  phone: '+91 7219053645',
  whatsapp: '917219053645',        // E.164 format without +
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
    // One-line version for structured data / meta
    full: 'Old Barshi Road, Kulswamininagar, 5 No Chauk, Next to Sai School, Latur – 413512, Maharashtra, India',
    // Multi-line for display (footer, contact page, etc.)
    lines: [
      'Old Barshi Road, Kulswamininagar,',
      '5 No Chauk, Next to Sai School,',
      'Latur – 413512,',
      'Maharashtra, India',
    ],
  },
}

// Convenience aliases — used by legacy imports across the codebase
export const WHATSAPP_NUMBER = BUSINESS_INFO.whatsapp      // '917219053645'
export const OWNER_EMAIL = BUSINESS_INFO.email

// ── Stripe Payment Links (DISABLED — B2B Direct RFQ / Quotation Model Active) ──
export const STRIPE_ENABLED = false;

export const STRIPE_LINKS = {
  INDIA: {
    MONTHLY:     null,
    YEARLY:      null,
    THREE_YEARS: null,
  },
  GLOBAL: {
    MONTHLY:     null,
    YEARLY:      null,
    THREE_YEARS: null,
  },
}

// ── Affiliate Program Links ────────────────────────────────
export const AFFILIATE_LINKS = {
  AMAZON: {
    GLOBAL: {
      name: 'Amazon Global (Moringa Central)',
      url: 'https://www.amazon.com/b?node=53629917011',
      platform: 'Amazon US',
      market: 'Global Buyers',
      commission: '2%',
    },
    ORGANIC_INDIA: {
      name: 'Organic India Moringa',
      url: 'https://tinyurl.com/ywenv6wz',
      platform: 'Amazon India',
      market: 'India Buyers',
      commission: '2%',
    },
    HIMALAYAN_ORGANICS: {
      name: 'Himalayan Organics Moringa',
      url: 'https://tinyurl.com/efttfn8x',
      platform: 'Amazon India',
      market: 'India Buyers',
      commission: '2%',
    },
    KULI_KULI: {
      name: 'Kuli Kuli Moringa (Global)',
      url: 'https://amzn.to/4v7LZmw',
      platform: 'Amazon Global',
      market: 'Global Buyers',
      commission: '2%',
    },
  },
  IHERB: {
    INDIA: {
      name: 'iHerb India Affiliate',
      url: 'https://in.iherb.com/info/affiliates?rcode=PQZ1679',
      platform: 'iHerb India',
      market: 'India Buyers',
      commission: '3%',
    },
    US: {
      name: 'iHerb US / Global',
      url: 'https://iherb.co/ocZkYDSJ',
      platform: 'iHerb US',
      market: 'Global Buyers',
      commission: '3%',
    },
  },
  FUTURE: [
    { id: 'future_1', name: 'Future Affiliate Link #1', url: '', platform: '', market: '', commission: '', placeholder: true },
    { id: 'future_2', name: 'Future Affiliate Link #2', url: '', platform: '', market: '', commission: '', placeholder: true },
    { id: 'future_3', name: 'Future Affiliate Link #3', url: '', platform: '', market: '', commission: '', placeholder: true },
    { id: 'future_4', name: 'Future Affiliate Link #4', url: '', platform: '', market: '', commission: '', placeholder: true },
    { id: 'future_5', name: 'Future Affiliate Link #5', url: '', platform: '', market: '', commission: '', placeholder: true },
  ],
}

// ── Misc Links ─────────────────────────────────────────────
export const CATALOG_LINK = '/catalog.html'
export const ZOHO_CRM_DASHBOARD = 'https://crmplus.zoho.in/avaniagrofoods/index.do/cxapp/crm/org60068319712/tab/Home/begin'
export const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1X2TTc9iQ2IWCTQV0RknH37A3lmIFaaC0ImT4rfBPuLI/edit?gid=0#gid=0'
