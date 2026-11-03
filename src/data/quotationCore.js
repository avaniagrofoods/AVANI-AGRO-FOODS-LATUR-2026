// ============================================================
// AVANI AGRO FOODS — PURE QUOTATION CORE
// Browser- and Server-Safe Pure Quotation Calculation & Defaults
// Zero Node.js built-ins, zero document libraries, zero env lookups
// ============================================================

import {
  getProductById,
  matchProductMaster,
  parseQuantityKg,
  parseUnitRate
} from './productMaster.js';

export const DEFAULT_COMMERCIAL_TERMS = [
  '1. Payment Terms: 50% Advance Payment, Balance 50% Before Dispatch.',
  '2. Price Basis: FOB Shipment terms (Final port details to be confirmed by Buyer).',
  '3. Delivery Timeline: Shipment within 60–75 days from the date of advance payment confirmation.',
  '4. Packaging: 25 kg Food-Grade HDPE Bags included.',
  '5. Validity: This quotation is valid until 12 Oct 2026.',
  '6. Inspection: Pre-dispatch inspection permitted at seller\'s warehouse at buyer\'s cost.',
  '7. Jurisdiction: All disputes are subject to the exclusive jurisdiction of competent courts in Latur, Maharashtra, India.'
];

/**
 * Calculates a complete, single-source-of-truth quotation record
 */
export function calculateQuotation(input = {}) {
  const quoteId = input.quoteId || input.id || `AAF-Q-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const inquiryId = input.inquiryId || input.leadId || `AAF-INQ-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
  const date = input.date || new Date().toISOString().split('T')[0];
  const validUntil = input.validUntil || '12 Oct 2026';

  const customerName = (input.customerName || input.buyerName || input.buyer?.name || input.name || 'Valued Trade Partner').trim();
  const companyName = (input.companyName || input.buyer?.company || input.company || 'Direct Buyer').trim();
  const email = (input.email || input.buyer?.email || 'sales@avaniagrofoods.com').trim();
  const phone = (input.phone || input.buyer?.phone || input.mobile || '+91 7219053645').trim();
  const country = (input.country || input.buyer?.country || 'INDIA').trim();
  const destinationPort = (input.destinationPort || input.destination || input.port || 'FOB NHAVA SHEVA (JNPT MUMBAI)').trim();
  const origin = input.origin || 'Latur, Maharashtra, India / JNPT Nhava Sheva, Mumbai';
  const incoterm = (input.incoterm || 'FOB NHAVA SHEVA (JNPT MUMBAI)').toUpperCase().trim();
  const currency = (input.currency || (country.toUpperCase() === 'INDIA' ? 'INR' : 'USD')).toUpperCase().trim();

  // Parse items
  let items = [];
  if (Array.isArray(input.items) && input.items.length > 0) {
    items = input.items.map((item, idx) => {
      const pm = item.productId ? getProductById(item.productId) : matchProductMaster(item.description || item.name || '');
      // Prioritize explicit item.quantity directly without polluting with packaging text from description
      const qty = parseQuantityKg(item.quantity);
      
      // Clean and parse rate safely (preserves 0, handles currency strings e.g. "INR 350", "350.00", etc.)
      const rawRate = item.rate !== undefined && item.rate !== null && item.rate !== '' 
        ? item.rate 
        : (item.unitRate !== undefined && item.unitRate !== null && item.unitRate !== '' ? item.unitRate : null);
      let rate;
      if (rawRate !== null) {
        const parsedRate = parseUnitRate(rawRate, null);
        rate = parsedRate !== null ? parsedRate : (currency === 'INR' ? pm.defaultRateInr : pm.defaultRateUsd);
      } else {
        rate = currency === 'INR' ? pm.defaultRateInr : pm.defaultRateUsd;
      }

      const total = Number((qty * rate).toFixed(2));
      const description = item.description || item.fullDescription || pm.fullDescription;
      const hscode = item.hscode || item.hsCode || pm.hsCode;
      return {
        sr: idx + 1,
        id: item.id || idx + 1,
        productId: pm.productId,
        name: item.name || pm.productName,
        description,
        hscode,
        hsCode: hscode,
        quantity: qty,
        unit: (item.unit || pm.unit || 'KG').toUpperCase(),
        rate,
        unitRate: rate,
        total,
        amount: total,
        packaging: item.packaging || pm.defaultPackaging
      };
    });
  } else {
    // Single item from input parameters
    const rawProd = input.product || input.productName || input.inquiryType || 'Moringa Leaf Powder';
    const pm = matchProductMaster(rawProd);
    const parsedQty = parseQuantityKg(input.quantity, input.buyerRequirement || input.message || '');
    
    // Determine rate: preserve explicitly entered rate, otherwise fallback to product master
    let rate;
    const rawRate = input.unitRate !== undefined && input.unitRate !== null && input.unitRate !== ''
      ? input.unitRate
      : (input.rate !== undefined && input.rate !== null && input.rate !== '' ? input.rate : null);
    if (rawRate !== null) {
      const parsedRate = parseUnitRate(rawRate, null);
      rate = parsedRate !== null ? parsedRate : (currency === 'INR' ? pm.defaultRateInr : pm.defaultRateUsd);
    } else {
      rate = currency === 'INR' ? pm.defaultRateInr : pm.defaultRateUsd;
    }

    const total = Number((parsedQty * rate).toFixed(2));
    const description = input.fullDescription || input.productRequirement || input.description || pm.fullDescription;
    const hscode = input.hsCode || input.hscode || pm.hsCode;

    items = [
      {
        sr: 1,
        id: 1,
        productId: pm.productId,
        name: pm.productName,
        description,
        hscode,
        hsCode: hscode,
        quantity: parsedQty,
        unit: 'KG',
        rate,
        unitRate: rate,
        total,
        amount: total,
        packaging: input.packaging || pm.defaultPackaging
      }
    ];
  }

  // Financial calculations
  const subtotal = Number(items.reduce((sum, item) => sum + (Number(item.total) || 0), 0).toFixed(2));
  const freight = Number(Number(input.freight || input.freightCharges || 0).toFixed(2));
  const insurance = Number(Number(input.insurance || input.insuranceCharges || 0).toFixed(2));
  const documentation = Number(Number(input.documentation || input.documentationCharges || 0).toFixed(2));
  const otherCharges = Number(Number(input.otherCharges || 0).toFixed(2));

  const grandTotal = Number((subtotal + freight + insurance + documentation + otherCharges).toFixed(2));

  // Commercial terms
  const commercialTerms = Array.isArray(input.commercialTerms) && input.commercialTerms.length > 0
    ? input.commercialTerms
    : [...DEFAULT_COMMERCIAL_TERMS];

  const deliveryTimeline = input.deliveryTimeline || 'Shipment within 60–75 days from the date of advance payment confirmation.';
  const paymentTerms = input.paymentTerms || '50% Advance Payment, Balance 50% Before Dispatch.';
  const inspectionTerms = input.inspectionTerms || 'Pre-dispatch inspection permitted at seller\'s warehouse at buyer\'s cost.';
  const jurisdiction = input.jurisdiction || 'All disputes are subject to the exclusive jurisdiction of competent courts in Latur, Maharashtra, India.';

  return {
    quoteId,
    inquiryId,
    leadId: inquiryId,
    date,
    validUntil,
    buyerName: customerName,
    customerName,
    companyName,
    email,
    phone,
    country,
    destination: destinationPort,
    destinationPort,
    origin,
    incoterm,
    currency,
    items,
    subtotal,
    subtotalFob: subtotal,
    freight,
    insurance,
    documentation,
    otherCharges,
    grandTotal,
    commercialTerms,
    deliveryTimeline,
    paymentTerms,
    inspectionTerms,
    jurisdiction,
    status: input.status || 'DRAFT',
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: input.updatedBy || 'Admin (Sachin Shinde)'
  };
}
