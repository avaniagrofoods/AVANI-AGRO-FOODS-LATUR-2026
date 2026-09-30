// ============================================================
// AVANI AGRO FOODS — CENTRALIZED PRODUCT MASTER
// Single Source of Truth for Products, HS Codes, Descriptions & Specs
// ============================================================

export const PRODUCT_MASTER = [
  {
    productId: 'moringa-leaf-powder',
    productName: 'Moringa Leaf Powder',
    shortName: 'Moringa Powder',
    botanicalName: 'Moringa Oleifera',
    fullDescription: 'Moringa Leaf Powder — Natural Green — 80–100 Mesh — Moisture Max 7–8% — 100% Pure — 25 kg Food-Grade HDPE Bags',
    hsCode: '12119029',
    unit: 'KG',
    defaultPackaging: '25 kg Food-Grade HDPE Bags',
    defaultSpecifications: 'Natural Green, 80–100 Mesh, Moisture Max 7–8%, 100% Pure Moringa Oleifera Leaf Powder',
    defaultIncoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
    defaultCurrency: 'INR',
    defaultRateInr: 350.00,
    defaultRateUsd: 4.80,
    moqKg: 100,
    active: true,
    lastUpdated: '2026-09-29T16:25:00Z',
    verificationStatus: 'VERIFIED_ACTIVE'
  },
  {
    productId: 'red-onion-powder',
    productName: 'Dehydrated Red Onion Powder',
    shortName: 'Red Onion Powder',
    botanicalName: 'Allium Cepa',
    fullDescription: 'Dehydrated Red Onion Powder — Premium Export Grade — 80–100 Mesh — Moisture < 6% — 20/25 kg Corrugated Export Cartons',
    hsCode: '07122000',
    unit: 'KG',
    defaultPackaging: '20 kg / 25 kg Poly-lined Corrugated Export Cartons',
    defaultSpecifications: 'Dehydrated Allium Cepa, 80–100 Mesh, Moisture < 6%, Characteristic Pungent Aroma, Pinkish Red',
    defaultIncoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
    defaultCurrency: 'INR',
    defaultRateInr: 800.00,
    defaultRateUsd: 9.60,
    moqKg: 100,
    active: true,
    lastUpdated: '2026-09-29T16:25:00Z',
    verificationStatus: 'VERIFIED_ACTIVE'
  },
  {
    productId: 'garlic-powder',
    productName: 'Dehydrated Garlic Powder',
    shortName: 'Garlic Powder',
    botanicalName: 'Allium Sativum',
    fullDescription: 'Dehydrated Garlic Powder — Premium Export Grade — 80–100 Mesh — Moisture < 5% — 25 kg Export Cartons with Inner Liner',
    hsCode: '07129020',
    unit: 'KG',
    defaultPackaging: '25 kg Corrugated Export Cartons with Inner Liner',
    defaultSpecifications: 'Pure Dehydrated Garlic, Moisture < 5%, Mesh 80–100, Strong Pungency',
    defaultIncoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
    defaultCurrency: 'INR',
    defaultRateInr: 680.00,
    defaultRateUsd: 8.19,
    moqKg: 100,
    active: true,
    lastUpdated: '2026-09-29T16:25:00Z',
    verificationStatus: 'VERIFIED_ACTIVE'
  },
  {
    productId: 'ginger-powder',
    productName: 'Dried Ginger Powder',
    shortName: 'Ginger Powder',
    botanicalName: 'Zingiber Officinale',
    fullDescription: 'Dried Ginger Powder (Zingiber Officinale) — Sun-dried & Fine Ground — Moisture < 8% — 25 kg Kraft Paper Bags with Poly Inner',
    hsCode: '09101110',
    unit: 'KG',
    defaultPackaging: '25 kg Kraft Paper Bags with Poly Inner',
    defaultSpecifications: 'Sun-dried & Fine Ground Ginger, Gingerol standard, Moisture < 8%',
    defaultIncoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
    defaultCurrency: 'INR',
    defaultRateInr: 660.00,
    defaultRateUsd: 7.95,
    moqKg: 100,
    active: true,
    lastUpdated: '2026-09-29T16:25:00Z',
    verificationStatus: 'VERIFIED_ACTIVE'
  },
  {
    productId: 'turmeric-powder',
    productName: 'Turmeric Powder (High Curcumin)',
    shortName: 'Turmeric Powder',
    botanicalName: 'Curcuma Longa',
    fullDescription: 'Turmeric Powder (High Curcumin 3.5%+) — Brilliant Yellow — Moisture < 8% — 25 kg Double Poly-lined Bags in Fiber Drums',
    hsCode: '09103020',
    unit: 'KG',
    defaultPackaging: '25 kg Double Poly-lined Bags in Fiber Drums',
    defaultSpecifications: 'Curcuma Longa, Curcumin >= 3.5%, Brilliant Yellow, Moisture < 8%',
    defaultIncoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
    defaultCurrency: 'INR',
    defaultRateInr: 400.00,
    defaultRateUsd: 4.82,
    moqKg: 100,
    active: true,
    lastUpdated: '2026-09-29T16:25:00Z',
    verificationStatus: 'VERIFIED_ACTIVE'
  },
  {
    productId: 'beetroot-powder',
    productName: 'Beetroot Powder',
    shortName: 'Beetroot Powder',
    botanicalName: 'Beta Vulgaris',
    fullDescription: 'Beetroot Powder (Natural Colorant) — Spray-dried Beta Vulgaris — Rich Betanin Pigment — 20 kg Foil-laminated Export Bags in Cartons',
    hsCode: '07129090',
    unit: 'KG',
    defaultPackaging: '20 kg Foil-laminated Export Bags in Cartons',
    defaultSpecifications: 'Spray-dried / Dehydrated Beta Vulgaris, Rich Betanin Pigment, Moisture < 6%',
    defaultIncoterm: 'FOB Nhava Sheva (JNPT Mumbai)',
    defaultCurrency: 'INR',
    defaultRateInr: 450.00,
    defaultRateUsd: 5.42,
    moqKg: 100,
    active: true,
    lastUpdated: '2026-09-29T16:25:00Z',
    verificationStatus: 'VERIFIED_ACTIVE'
  }
];

/**
 * Find product by ID
 */
export function getProductById(id) {
  if (!id) return PRODUCT_MASTER[0];
  const cleanId = String(id).toLowerCase().trim();
  return PRODUCT_MASTER.find(p => p.productId === cleanId) || PRODUCT_MASTER[0];
}

/**
 * Match product query string (from website form or buyer inquiry)
 */
export function matchProductMaster(query) {
  if (!query || typeof query !== 'string') return PRODUCT_MASTER[0];
  const q = query.toLowerCase().trim();
  if (q.includes('onion')) return PRODUCT_MASTER.find(p => p.productId === 'red-onion-powder');
  if (q.includes('garlic')) return PRODUCT_MASTER.find(p => p.productId === 'garlic-powder');
  if (q.includes('ginger')) return PRODUCT_MASTER.find(p => p.productId === 'ginger-powder');
  if (q.includes('turmeric') || q.includes('curcumin')) return PRODUCT_MASTER.find(p => p.productId === 'turmeric-powder');
  if (q.includes('beet') || q.includes('beetroot')) return PRODUCT_MASTER.find(p => p.productId === 'beetroot-powder');
  if (q.includes('moringa')) return PRODUCT_MASTER.find(p => p.productId === 'moringa-leaf-powder');
  return PRODUCT_MASTER[0];
}

/**
 * Parse quantity in KG safely from user string or numeric input
 * e.g., "18 MT" -> 18000, "18,000" -> 18000, "18,000 KG" -> 18000
 */
export function parseQuantityKg(qtyInput, rawText = '') {
  if (typeof qtyInput === 'number' && !isNaN(qtyInput) && qtyInput > 0) {
    return Math.round(qtyInput);
  }
  const str = `${qtyInput || ''} ${rawText || ''}`.toLowerCase();
  
  // Check for Metric Tons (MT / Metric Ton)
  const mtMatch = str.match(/([\d,]+(?:\.\d+)?)\s*(?:mt|metric\s*ton)/i);
  if (mtMatch) {
    const val = parseFloat(mtMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) return Math.round(val * 1000);
  }

  // Check for KG
  const kgMatch = str.match(/([\d,]+(?:\.\d+)?)\s*(?:kg|kgs|kilogram)/i);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) return Math.round(val);
  }

  // Pure number fallback (stripping commas and extra text)
  if (typeof qtyInput === 'string') {
    const cleanNum = parseFloat(qtyInput.replace(/,/g, '').replace(/[^\d.]/g, ''));
    if (!isNaN(cleanNum) && cleanNum > 0) return Math.round(cleanNum);
  }

  return 100; // Default only when completely unspecified
}

/**
 * Parse unit rate cleanly from input (handles "INR 350", "₹350", "350.00", etc.)
 */
export function parseUnitRate(rateInput, fallback = 350) {
  if (typeof rateInput === 'number' && !isNaN(rateInput) && rateInput > 0) {
    return rateInput;
  }
  if (typeof rateInput === 'string') {
    const clean = parseFloat(rateInput.replace(/,/g, '').replace(/[^\d.]/g, ''));
    if (!isNaN(clean) && clean > 0) return clean;
  }
  return fallback;
}

/**
 * Get active products list
 */
export function getActiveProducts() {
  return PRODUCT_MASTER.filter(p => p.active);
}
