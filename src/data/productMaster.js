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
 * e.g., "18 MT" -> 18000, "18,000" -> 18000, "18,000 KG" -> 18000, 0 -> 0
 * Prioritizes qtyInput directly so packaging text (e.g. "25 kg bags") in rawText
 * cannot corrupt an explicit order quantity.
 */
export function parseQuantityKg(qtyInput, rawText = '') {
  // 1. Explicit numeric input (preserves 0 for sample line items, clamps negative to 1)
  if (typeof qtyInput === 'number' && !isNaN(qtyInput)) {
    if (qtyInput === 0) return 0;
    if (qtyInput < 0) return 1;
    return Math.round(qtyInput);
  }

  // 2. String input in qtyInput — parse directly without polluting with rawText!
  if (typeof qtyInput === 'string' && qtyInput.trim() !== '') {
    const s = qtyInput.trim();

    // Check for Metric Tons (e.g. "18 MT", "18.5 metric ton")
    const mtMatch = s.match(/^([\d,]+(?:\.\d+)?)\s*(?:mt|metric\s*ton)/i);
    if (mtMatch) {
      const val = parseFloat(mtMatch[1].replace(/,/g, ''));
      if (!isNaN(val)) return val <= 0 ? 0 : Math.round(val * 1000);
    }

    // Check for KG (e.g. "18,000 KG", "18000 kg", "25kg")
    const kgMatch = s.match(/^([\d,]+(?:\.\d+)?)\s*(?:kg|kgs|kilogram)/i);
    if (kgMatch) {
      const val = parseFloat(kgMatch[1].replace(/,/g, ''));
      if (!isNaN(val)) return val <= 0 ? 0 : Math.round(val);
    }

    // Pure number fallback (e.g. "18,000", "18000", "25", "0")
    const cleanNumStr = s.replace(/,/g, '').replace(/[^\d.]/g, '');
    if (cleanNumStr !== '') {
      const val = parseFloat(cleanNumStr);
      if (!isNaN(val)) {
        if (val === 0) return 0;
        if (val < 0) return 1;
        return Math.round(val);
      }
    }
  }

  // 3. Fallback: Only if qtyInput was completely absent/empty, extract from rawText (buyer inquiry message)
  // Be careful to ignore packaging specifications (e.g. "25 kg HDPE bags")
  if (rawText && typeof rawText === 'string' && rawText.trim() !== '') {
    const mtMatch = rawText.match(/(?:need|order|quantity|qty|volume|require|requirement)?[:\s]*([\d,]+(?:\.\d+)?)\s*(?:mt|metric\s*ton)/i);
    if (mtMatch) {
      const val = parseFloat(mtMatch[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) return Math.round(val * 1000);
    }

    const kgMatches = [...rawText.matchAll(/([\d,]+(?:\.\d+)?)\s*(?:kg|kgs|kilogram)/gi)];
    for (const m of kgMatches) {
      const idx = m.index;
      const surrounding = rawText.substring(Math.max(0, idx - 15), Math.min(rawText.length, idx + m[0].length + 20)).toLowerCase();
      // Skip if surrounding text indicates packaging rather than order quantity
      if (!surrounding.includes('bag') && !surrounding.includes('pack') && !surrounding.includes('carton') && !surrounding.includes('drum')) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) return Math.round(val);
      }
    }
  }

  return 0; // Return 0 when unspecified so caller can detect missing/unspecified quantity
}

/**
 * Parse unit rate cleanly from input (handles "INR 350", "₹350", "350.00", 0, etc.)
 */
export function parseUnitRate(rateInput, fallback = 350) {
  if (typeof rateInput === 'number' && !isNaN(rateInput) && rateInput >= 0) {
    return rateInput;
  }
  if (typeof rateInput === 'string' && rateInput.trim() !== '') {
    const clean = parseFloat(rateInput.replace(/,/g, '').replace(/[^0-9.]/g, ''));
    if (!isNaN(clean) && clean >= 0) return clean;
  }
  return fallback;
}

/**
 * Validates a quotation object for strict calculation and data integrity.
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateQuotation(quote) {
  if (!quote || typeof quote !== 'object') {
    return { valid: false, error: 'Quotation payload is missing or invalid' };
  }

  const items = Array.isArray(quote.items) ? quote.items : (quote.product ? [quote] : []);
  if (items.length === 0) {
    return { valid: false, error: 'Quotation must have at least one product line item' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const idx = item.sr || i + 1;
    
    // Check missing quantity
    if (item.quantity === undefined || item.quantity === null || (typeof item.quantity === 'string' && item.quantity.trim() === '')) {
      return { valid: false, error: `Item #${idx} (${item.name || 'Product'}): Missing quantity. Please specify quantity.` };
    }
    const qNum = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity).replace(/,/g, '').replace(/[^\d.]/g, ''));
    if (isNaN(qNum) || qNum < 0) {
      return { valid: false, error: `Item #${idx} (${item.name || 'Product'}): Invalid quantity value.` };
    }

    // Check missing rate
    const rawRate = item.rate !== undefined && item.rate !== null && item.rate !== '' ? item.rate : (item.unitRate !== undefined && item.unitRate !== null && item.unitRate !== '' ? item.unitRate : null);
    if (rawRate === null || (typeof rawRate === 'string' && rawRate.trim() === '')) {
      return { valid: false, error: `Item #${idx} (${item.name || 'Product'}): Missing unit rate. Please specify rate.` };
    }
    const rNum = typeof rawRate === 'number' ? rawRate : parseFloat(String(rawRate).replace(/,/g, '').replace(/[^0-9.]/g, ''));
    if (isNaN(rNum) || rNum < 0) {
      return { valid: false, error: `Item #${idx} (${item.name || 'Product'}): Invalid unit rate value.` };
    }
  }

  return { valid: true };
}

/**
 * Get active products list
 */
export function getActiveProducts() {
  return PRODUCT_MASTER.filter(p => p.active);
}
