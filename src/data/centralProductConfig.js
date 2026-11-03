// ============================================================
// AVANI AGRO FOODS — CENTRAL PRODUCT & SOURCING CONFIGURATION
// Single Source of Truth for Product Specifications, Operating Model,
// Quality Documentation, and Certification Governance.
// ============================================================

export const TRADE_COORDINATION_POLICY = {
  businessName: 'AVANI AGRO FOODS',
  entityType: 'Agricultural Trade Coordination & Export Merchant',
  tradeCoordinator: 'Sachin Shinde',
  headquarters: 'Latur, Maharashtra, India',
  phone: '+91 7219053645',
  whatsappE164: '917219053645',
  email: 'sales@avaniagrofoods.com',
  website: 'https://www.avaniagrofoods.com',
  primarySeaPort: 'Nhava Sheva (JNPT Mumbai, Port Code: INNSA)',
  operatingModelStatement:
    'AVANI AGRO FOODS operates as an independent Indian agricultural trade coordinator headquartered in Latur, Maharashtra. We coordinate commercial procurement, processing oversight, third-party laboratory verification, and export execution with vetted, FSSAI-licensed regional facilities. We do not own manufacturing factories or farming estates.',
  qualificationDisclaimer:
    'Specifications, mesh sizes, and moisture parameters reflect standard commercial export grades and are subject to confirmation against the selected product batch and buyer contract. Batch-specific Certificates of Analysis issued by independent NABL-accredited laboratories are provided prior to container dispatch.'
};

/**
 * Three-Tier Certification Framework
 * Explicitly separates direct registrations, partner facility licenses, and batch-specific lab tests.
 */
export const CERTIFICATION_FRAMEWORK = {
  directRegistrations: [
    {
      name: 'Udyam / MSME Registration',
      holder: 'AVANI AGRO FOODS',
      description: 'Registered micro enterprise under Ministry of MSME, Government of India.',
      verified: true
    }
  ],
  partnerFacilityCertifications: [
    {
      name: 'FSSAI Food Safety License',
      holder: 'Regional Processing Partner Units',
      description: 'Mandatory manufacturing compliance under Food Safety and Standards Authority of India.',
      verified: true
    },
    {
      name: 'ISO 22000:2018 / BRCGS (Batch Specific)',
      holder: 'Audited Partner Processing Facilities',
      description: 'HACCP-based food safety management systems maintained across export processing units.',
      verified: true
    },
    {
      name: 'Halal & Kosher Compliance',
      holder: 'Selected Processing Facilities',
      description: 'Available upon buyer request through qualified processing and packaging units.',
      verified: true
    }
  ],
  batchSpecificDocumentation: [
    {
      name: 'Certificate of Analysis (COA)',
      issuer: 'Independent NABL-Accredited ISO/IEC 17025 Laboratories',
      description: 'Complete physicochemical and active compound profiling for each commercial shipment.',
      verified: true
    },
    {
      name: 'Microbiological Safety Assay',
      issuer: 'Accredited Third-Party Testing Labs',
      description: 'Standard screening for Total Plate Count, Yeast & Mold, E. coli, and Salmonella spp.',
      verified: true
    },
    {
      name: 'Heavy Metals & Pesticide Multi-Residue Panels',
      issuer: 'Third-Party NABL Labs (Eurofins / SGS / Vimta / TUV)',
      description: 'Screening to verify compliance with destination standards (US FDA / EU MRL / Codex).',
      verified: true
    },
    {
      name: 'Phytosanitary Certificate',
      issuer: 'National Plant Protection Organization (NPPO / Ministry of Agriculture, India)',
      description: 'Official government biological clearance issued prior to seaport loading.',
      verified: true
    },
    {
      name: 'Certificate of Origin (COO)',
      issuer: 'Authorized Indian Chamber of Commerce / Export Inspection Agency',
      description: 'Official proof of Indian origin for preferential or standard customs clearance.',
      verified: true
    }
  ]
};

export const SOURCING_PRODUCTS = {
  moringa: {
    id: 'moringa-powder',
    slug: 'moringa-powder-bulk-supplier-india',
    name: 'Moringa Powder',
    category: 'Superfoods & Botanical Ingredients',
    botanicalName: 'Moringa oleifera',
    hsCode: '1211.90.29',
    hscodeRaw: '12119029',
    origin: 'Maharashtra & Southern India',
    heroTagline: 'Bulk Indian Moringa Leaf Powder for Global Importers & Food Manufacturers',
    shortDescription:
      'Export-grade dehydrated Moringa oleifera leaf powder coordinated from verified processors in Maharashtra. Shade-dried under controlled temperatures to protect natural emerald-green chlorophyll and complete amino acid profiles.',
    indicativeSpecifications: [
      { label: 'Botanical Identity', value: '100% Moringa oleifera Lam. Leaves', verified: true },
      { label: 'Physical Form', value: 'Fine, free-flowing dry botanical powder', verified: true },
      { label: 'Color & Appearance', value: 'Vibrant olive-to-emerald green', verified: true },
      { label: 'Mesh Particle Size', value: '80–100 Mesh (Fine) / 120 Mesh available', note: 'Subject to batch sieve analysis' },
      { label: 'Moisture Content', value: '≤ 7.0% (typical export standard)', note: 'Verified by batch COA' },
      { label: 'Crude Protein (dry basis)', value: '25.0% to 28.0% (typical)', note: 'AOAC Kjeldahl method' },
      { label: 'Acid Insoluble Ash', value: '≤ 1.0% (Zero extraneous sand/silica)', note: 'ISO 1577' },
      { label: 'Additives / Fillers', value: '100% Pure, Zero synthetic additives, carriers, or preservatives', verified: true },
      { label: 'Shelf Life', value: '24 Months when stored sealed in cool (< 25°C), dry conditions', note: 'In original double-barrier liners' }
    ],
    commercialTerms: {
      moq: '100 kg (Commercial trial consignments) / Full Container Load (20ft FCL: ~8–10 MT)',
      packaging: '5 kg Food-Grade Poly Liners / 25 kg HDPE Drums / Multi-Wall Kraft Bags with Poly Barrier',
      incoterms: 'FOB Nhava Sheva (JNPT Mumbai) / CIF Major Seaports (US, Europe, UK, GCC, Australia)',
      samplePolicy: '100g to 500g pre-shipment representative samples coordinated via DHL/FedEx for commercial buyers.'
    },
    primaryApplications: [
      'Nutraceutical capsule filling, tablets, and powdered supplement formulations',
      'Functional beverages, cold-pressed juice fortification, and instant smoothie blends',
      'Bakery premixes, green pasta, high-protein snack bars, and confectionery',
      'Clean-label natural food colorant and botanical food enrichment',
      'Personal care, cosmetic face masks, and herbal hair preparations'
    ],
    targetMarkets: ['United States', 'United Kingdom', 'European Union', 'United Arab Emirates', 'Canada', 'Australia']
  },

  redOnion: {
    id: 'red-onion-powder',
    slug: 'red-onion-powder-bulk-supplier-india',
    name: 'Dehydrated Red Onion Powder',
    category: 'Dehydrated Vegetables & Seasonings',
    botanicalName: 'Allium cepa',
    hsCode: '0712.20.00',
    hscodeRaw: '07122000',
    origin: 'Maharashtra & Western India (Nashik/Latur/Pune Belt)',
    heroTagline: 'Industrial Dehydrated Red Onion Powder for Seasonings & Food Manufacturing',
    shortDescription:
      'Standardized dehydrated red onion powder processed from high-solids Indian red onion crops. Engineered for intense pungency, consistent aroma, extended ambient shelf life, and uniform reconstitution in commercial food formulations.',
    indicativeSpecifications: [
      { label: 'Botanical Identity', value: '100% Dehydrated Allium cepa L.', verified: true },
      { label: 'Physical Form', value: 'Fine free-flowing dehydrated powder', verified: true },
      { label: 'Color & Appearance', value: 'Light pinkish-tan to characteristic reddish-brown', verified: true },
      { label: 'Mesh Particle Size', value: '60–80 Mesh / 80–100 Mesh available', note: 'Subject to batch sieve analysis' },
      { label: 'Moisture Content', value: '≤ 6.0% (typical export standard)', note: 'Moisture barrier packaging required' },
      { label: 'Pungency Index', value: 'High Natural Pyruvic Acid Content', note: 'Characteristic pungent aroma' },
      { label: 'Total Ash', value: '≤ 5.0% maximum', note: 'AOAC standard' },
      { label: 'Additives / Anti-caking', value: 'Pure single-ingredient; optional anti-caking (SiO2) strictly per buyer specification', verified: true },
      { label: 'Shelf Life', value: '24 Months in hermetically sealed moisture-barrier packaging', note: 'Store below 25°C away from humidity' }
    ],
    commercialTerms: {
      moq: '100 kg (Commercial trial consignments) / Full Container Load (20ft FCL: ~14–16 MT)',
      packaging: '5 kg Vacuum Poly Bags / 20 kg Corrugated Export Cartons / 25 kg Multi-Layer Sacks',
      incoterms: 'FOB Nhava Sheva (JNPT Mumbai) / CIF Major Seaports (US, Europe, UK, GCC, Asia-Pacific)',
      samplePolicy: 'Representative evaluation samples available for verified commercial food processors.'
    },
    primaryApplications: [
      'Dry soup mixes, bouillon cubes, and commercial sauce & gravy formulations',
      'Potato chip seasonings, snack coatings, extruded snacks, and topical rubs',
      'Processed meat products, sausage seasoning, and plant-based protein binders',
      'Canned foods, ready-to-eat (RTE) meal kits, and institutional food service premixes',
      'Curry powders, spice seasoning blends, and culinary marinades'
    ],
    targetMarkets: ['United States', 'United Kingdom', 'European Union', 'Middle East (GCC)', 'Canada', 'Southeast Asia']
  }
};
