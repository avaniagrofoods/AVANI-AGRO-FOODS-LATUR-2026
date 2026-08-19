// ============================================================
// AVANI AGRO FOODS — APPROVED EXPORT COSTING & PRODUCT SPECIFICATIONS
// Derived from: Export Cost Calculator & Product Costing System
// ============================================================

export const COMPANY_DETAILS = {
  name: 'AVANI AGRO FOODS',
  division: 'Export & B2B Trade Division',
  owner: 'Sachin Shinde',
  phone: '+91 7219053645',
  whatsapp: '917219053645',
  email: 'sales@avaniagrofoods.com',
  website: 'https://www.avaniagrofoods.com',
  address: {
    line1: 'Old Barshi Road, Kulswamininagar',
    line2: '5 No Chauk, Next to Sai School',
    city: 'Latur',
    state: 'Maharashtra',
    pin: '413512',
    country: 'India',
    full: 'Old Barshi Road, Kulswamininagar, 5 No Chauk, Next to Sai School, Latur – 413512, Maharashtra, India'
  },
  registration: {
    udyam: 'UDYAM-MH-19-0000000',
    compliance: 'Trade Co-ordination Framework (Partner FSSAI, APEDA, IEC, GST & ISO Compliant)'
  }
};

export const STANDARD_PRODUCTS = {
  'moringa-powder': {
    id: 'moringa-powder',
    name: 'Moringa Leaf Powder (Food Grade / Organic)',
    hscode: '12119029',
    unit: 'kg',
    moqKg: 100,
    baseFobInrPerKg: 400,
    baseFobUsdPerKg: 4.82,
    packaging: '25 kg Food Grade Laminated HDPE Drums / 4-Layer Vacuum Pouches',
    specs: '100% Pure Organic Moringa Oleifera Leaf Powder, Mesh 80-100, Moisture < 7%, Green Fine Powder',
    leadTime: '10-15 working days from PO confirmation'
  },
  'red-onion-powder': {
    id: 'red-onion-powder',
    name: 'Dehydrated Red Onion Powder (Premium Export Grade)',
    hscode: '07122000',
    unit: 'kg',
    moqKg: 100,
    baseFobInrPerKg: 800,
    baseFobUsdPerKg: 9.64,
    packaging: '20 kg / 25 kg Poly-lined Corrugated Export Cartons',
    specs: 'Dehydrated Allium Cepa, 80-100 Mesh, Moisture < 6%, Characteristic Pungent Aroma, Pinkish Red',
    leadTime: '10-15 working days from PO confirmation'
  },
  'garlic-powder': {
    id: 'garlic-powder',
    name: 'Dehydrated Garlic Powder (Premium Grade)',
    hscode: '07129020',
    unit: 'kg',
    moqKg: 100,
    baseFobInrPerKg: 680,
    baseFobUsdPerKg: 8.19,
    packaging: '25 kg Corrugated Export Cartons with Inner Liner',
    specs: 'Pure Dehydrated Garlic, Moisture < 5%, Mesh 80-100, Strong Pungency',
    leadTime: '12-18 working days'
  },
  'ginger-powder': {
    id: 'ginger-powder',
    name: 'Dried Ginger Powder (Zingiber Officinale)',
    hscode: '09101110',
    unit: 'kg',
    moqKg: 100,
    baseFobInrPerKg: 660,
    baseFobUsdPerKg: 7.95,
    packaging: '25 kg Kraft Paper Bags with Poly Inner',
    specs: 'Sun-dried & Fine Ground Ginger, Gingerol content standard, Moisture < 8%',
    leadTime: '12-18 working days'
  },
  'turmeric-powder': {
    id: 'turmeric-powder',
    name: 'Turmeric Powder (High Curcumin 3-5%)',
    hscode: '09103020',
    unit: 'kg',
    moqKg: 100,
    baseFobInrPerKg: 400,
    baseFobUsdPerKg: 4.82,
    packaging: '25 kg Double Poly-lined Bags in Fiber Drums',
    specs: 'Curcuma Longa, Curcumin >= 3.5%, Brilliant Yellow, Moisture < 8%',
    leadTime: '10-15 working days'
  },
  'beetroot-powder': {
    id: 'beetroot-powder',
    name: 'Beetroot Powder (Natural Colorant)',
    hscode: '07129090',
    unit: 'kg',
    moqKg: 100,
    baseFobInrPerKg: 450,
    baseFobUsdPerKg: 5.42,
    packaging: '20 kg Foil-laminated Export Bags in Cartons',
    specs: 'Spray-dried / Dehydrated Beta Vulgaris, Rich Betanin Pigment, Moisture < 6%',
    leadTime: '12-18 working days'
  }
};

export const STANDARD_TRADE_TERMS = {
  validityDays: 30,
  paymentTerms: '30% Advance T/T with Purchase Order, 70% against Bill of Lading (B/L) copy or Irrevocable L/C at sight',
  origin: 'Latur, Maharashtra, India',
  loadingPort: 'JNPT / Nhava Sheva Port, Mumbai (Sea) or Mumbai Air Cargo (Air)',
  insuranceRatePercent: 0.5,
  defaultExportDocFeeInr: 5000,
  defaultExportDocFeeUsd: 60,
  inrToUsdRate: 83.0,
  inspection: 'NABL Accredited Third-Party Lab Certificate of Analysis (COA) & Phytosanitary Certificate included',
  samplePolicy: 'Product samples (100g-250g) available upon request. Sample cost credited against first commercial PO.'
};

/**
 * Normalizes user product inquiry string to a standard product key
 */
export function matchProductKey(query) {
  if (!query || typeof query !== 'string') return 'moringa-powder';
  const q = query.toLowerCase();
  if (q.includes('onion')) return 'red-onion-powder';
  if (q.includes('garlic')) return 'garlic-powder';
  if (q.includes('ginger')) return 'ginger-powder';
  if (q.includes('turmeric') || q.includes('curcumin')) return 'turmeric-powder';
  if (q.includes('beet') || q.includes('beetroot')) return 'beetroot-powder';
  return 'moringa-powder';
}
