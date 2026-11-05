const fs = require('fs');
const path = require('path');

const keywords = [
  // ── MORINGA BULK HEAD & COMMERCIAL TERMS ──
  {
    keyword: "moringa powder bulk supplier india",
    category: "Moringa Powder",
    theme: "Core Commercial Head Term",
    intent: "Transactional / Commercial",
    persona: "International Food Importer / Procurement Director",
    volumeTier: "High (Commercial Priority)",
    competition: "High",
    currentUrl: "https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india",
    rankingStatus: "Primary Target Landing Page",
    recommendedAction: "Strengthen H1/H2 density, build internal links from all 15 Moringa articles, add direct WhatsApp RFQ pill"
  },
  {
    keyword: "bulk moringa powder wholesale",
    category: "Moringa Powder",
    theme: "Wholesale Procurement",
    intent: "Transactional",
    persona: "Nutraceutical Manufacturer / Bulk Distributor",
    volumeTier: "High (Commercial Priority)",
    competition: "High",
    currentUrl: "https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india",
    rankingStatus: "Secondary Target on Landing Page",
    recommendedAction: "Add dedicated pricing tier block (100 kg trial vs FCL) and packaging options breakdown"
  },
  {
    keyword: "moringa leaf powder export from india",
    category: "Moringa Powder",
    theme: "Export Logistics & Trade",
    intent: "Commercial Investigation",
    persona: "Foreign Sourcing Agent / Import Trader",
    volumeTier: "Medium",
    competition: "Medium",
    currentUrl: "https://www.avaniagrofoods.com/blog/moringa-powder-export-from-india-international-buyer-guide",
    rankingStatus: "Mapped to Blog Article 9",
    recommendedAction: "Add explicit contextual link to /moringa-powder-bulk-supplier-india with anchor 'source bulk moringa powder from India'"
  },
  {
    keyword: "moringa powder FOB nhava sheva price",
    category: "Moringa Powder",
    theme: "Commercial Incoterms & Pricing",
    intent: "Transactional",
    persona: "Commodity Buyer / Supply Chain Manager",
    volumeTier: "Low-Medium (High Intent)",
    competition: "Low",
    currentUrl: "https://www.avaniagrofoods.com/moringa-powder-bulk-supplier-india",
    rankingStatus: "Partial Mention in Pricing Schema",
    recommendedAction: "Create an Incoterm pricing guide table detailing FOB Nhava Sheva (JNPT) vs CIF major global container ports"
  },
  {
    keyword: "moringa powder 80 mesh 100 mesh specification",
    category: "Moringa Powder",
    theme: "Technical Specifications",
    intent: "Commercial / Technical",
    persona: "Food R&D Scientist / QA Formulation Manager",
    volumeTier: "Medium",
    competition: "Low-Medium",
    currentUrl: "https://www.avaniagrofoods.com/blog/moringa-powder-specifications-what-importers-should-check",
    rankingStatus: "Mapped to Blog Article 8",
    recommendedAction: "Include interactive sieve analysis table and downloadable sample COA snippet"
  },
  {
    keyword: "moringa powder COA microbiological testing NABL",
    category: "Moringa Powder",
    theme: "Quality & Compliance",
    intent: "Commercial / Compliance",
    persona: "Regulatory & Quality Assurance Director",
    volumeTier: "Medium (High Conversion)",
    competition: "Low",
    currentUrl: "https://www.avaniagrofoods.com/blog/moringa-powder-quality-checklist-bulk-buyers",
    rankingStatus: "Mapped to Blog Article 3",
    recommendedAction: "Add clear visual checklist showing Eurofins/SGS/Vimta third-party NABL protocol explanation"
  },
  {
    keyword: "bulk moringa powder supplier USA FDA compliance",
    category: "Moringa Powder",
    theme: "Geographic Target: USA",
    intent: "Transactional",
    persona: "US Dietary Supplement Manufacturer / Importer",
    volumeTier: "Medium-High",
    competition: "Medium",
    currentUrl: "https://www.avaniagrofoods.com/blog/moringa-powder-sourcing-india-usa-market-guide",
    rankingStatus: "Mapped to Blog Article 14",
    recommendedAction: "Link Article 14 directly to /moringa-powder-bulk-supplier-india; highlight US FDA Prior Notice & FSVP coordination"
  },
  {
    keyword: "bulk moringa powder Europe EU MRL pesticides",
    category: "Moringa Powder",
    theme: "Geographic Target: Europe",
    intent: "Commercial Investigation",
    persona: "European Botanical Ingredient Distributor (Germany/Netherlands)",
    volumeTier: "Medium",
    competition: "Medium",
    currentUrl: "https://www.avaniagrofoods.com/export-compliance",
    rankingStatus: "Covered generally on /export-compliance",
    recommendedAction: "Publish targeted section on EU pesticide Maximum Residue Limits (MRL) and ethylene oxide (ETO) testing"
  },
  {
    keyword: "moringa powder 25 kg fiber drum export packaging",
    category: "Moringa Powder",
    theme: "Packaging & Moisture Protection",
    intent: "Commercial Investigation",
    persona: "Warehouse Operations / Packaging Specialist",
    volumeTier: "Low-Medium",
    competition: "Low",
    currentUrl: "https://www.avaniagrofoods.com/blog/moringa-powder-packaging-storage-international-buyers",
    rankingStatus: "Mapped to Blog Article 7",
    recommendedAction: "Add high-res diagram of double food-grade PE liner inside 25 kg HDPE drum with silica gel pack"
  },
  {
    keyword: "private label moringa powder packaging supplier",
    category: "Moringa Powder",
    theme: "Value-Added Manufacturing",
    intent: "Transactional",
    persona: "D2C Superfood Brand Founder / Contract Packager",
    volumeTier: "Medium",
    competition: "Medium",
    currentUrl: "https://www.avaniagrofoods.com/blog/moringa-powder-private-label-food-brands",
    rankingStatus: "Mapped to Blog Article 10",
    recommendedAction: "Clarify coordination with audited partner packaging units (stand-up pouches, jars, capsules)"
  },

  // ── RED ONION BULK HEAD & COMMERCIAL TERMS ──
  {
    keyword: "red onion powder bulk supplier india",
    category: "Red Onion Powder",
    theme: "Core Commercial Head Term",
    intent: "Transactional / Commercial",
    persona: "Industrial Food Processor / Seasoning Manufacturer",
    volumeTier: "High (Commercial Priority)",
    competition: "High",
    currentUrl: "https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india",
    rankingStatus: "Primary Target Landing Page",
    recommendedAction: "Strengthen H1/H2 density, build internal links from all 15 Onion articles, emphasize pyruvic acid standardization"
  },
  {
    keyword: "dehydrated red onion powder wholesale india",
    category: "Red Onion Powder",
    theme: "Wholesale Sourcing",
    intent: "Transactional",
    persona: "Bulk Spice Importer / Foodservice Distributor",
    volumeTier: "High (Commercial Priority)",
    competition: "High",
    currentUrl: "https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india",
    rankingStatus: "Secondary Target on Landing Page",
    recommendedAction: "Highlight FCL container economics (~14-16 MT per 20ft container) and volume discount tiers"
  },
  {
    keyword: "indian dehydrated onion powder exporter",
    category: "Red Onion Powder",
    theme: "Export Industry",
    intent: "Commercial Investigation",
    persona: "International Commodity Broker / Sourcing Director",
    volumeTier: "High",
    competition: "High",
    currentUrl: "https://www.avaniagrofoods.com/blog/red-onion-powder-export-from-india-international-buyer-guide",
    rankingStatus: "Mapped to Blog Article 24",
    recommendedAction: "Link Article 24 directly to /red-onion-powder-bulk-supplier-india with anchor 'request bulk export quotation'"
  },
  {
    keyword: "red onion powder 60 80 mesh food grade bulk",
    category: "Red Onion Powder",
    theme: "Technical Specifications",
    intent: "Commercial / Technical",
    persona: "Snack Seasoning Formulator / Industrial Chef",
    volumeTier: "Medium",
    competition: "Low-Medium",
    currentUrl: "https://www.avaniagrofoods.com/blog/red-onion-powder-quality-specifications-importers",
    rankingStatus: "Mapped to Blog Article 20",
    recommendedAction: "Highlight particle size distribution for topical snack dusting and soup dissolve rates"
  },
  {
    keyword: "red onion powder pyruvic acid pungency index",
    category: "Red Onion Powder",
    theme: "Sensory & Chemical Standards",
    intent: "Commercial Investigation",
    persona: "Flavor Chemist / Product Development Scientist",
    volumeTier: "Low-Medium (High Value)",
    competition: "Low",
    currentUrl: "https://www.avaniagrofoods.com/blog/what-is-red-onion-powder-complete-b2b-buyers-guide",
    rankingStatus: "Mapped to Blog Article 16",
    recommendedAction: "Add dedicated section explaining pyruvic acid measurement (micromoles/g) and how dehydration temperature preserves pungency"
  },
  {
    keyword: "dehydrated red onion powder moisture control anti clumping",
    category: "Red Onion Powder",
    theme: "Packaging & Quality Stability",
    intent: "Commercial Investigation",
    persona: "Quality Control Officer / Warehouse Manager",
    volumeTier: "Medium",
    competition: "Low",
    currentUrl: "https://www.avaniagrofoods.com/blog/red-onion-powder-packaging-moisture-control-bulk-storage",
    rankingStatus: "Mapped to Blog Article 23",
    recommendedAction: "Add moisture-barrier packaging breakdown (5 kg vacuum bags inside 20 kg export cartons)"
  },
  {
    keyword: "red onion powder for snack food seasoning manufacturing",
    category: "Red Onion Powder",
    theme: "Industrial Food Applications",
    intent: "Commercial / Formulation",
    persona: "Extruded Snack / Potato Chip Seasoning R&D Lead",
    volumeTier: "Medium",
    competition: "Low-Medium",
    currentUrl: "https://www.avaniagrofoods.com/blog/red-onion-powder-seasonings-sauces-applications",
    rankingStatus: "Mapped to Blog Article 22",
    recommendedAction: "Add salt/powder blend formulation ratios and oil adhesion benchmarks"
  },
  {
    keyword: "bulk red onion powder supplier UAE Dubai GCC",
    category: "Red Onion Powder",
    theme: "Geographic Target: Middle East",
    intent: "Transactional",
    persona: "GCC Food Importer / Jebel Ali Free Zone Trader",
    volumeTier: "Medium-High",
    competition: "Medium",
    currentUrl: "https://www.avaniagrofoods.com/export-compliance",
    rankingStatus: "Covered generally on compliance page",
    recommendedAction: "Add GCC food import protocol section (Halal certificate support, Arabic bilingual labeling requirements)"
  },
  {
    keyword: "red onion powder FOB nhava sheva CIF long beach rotterdam",
    category: "Red Onion Powder",
    theme: "Commercial Freight & Shipping",
    intent: "Transactional",
    persona: "International Freight Forwarder / Procurement Director",
    volumeTier: "Low-Medium",
    competition: "Low",
    currentUrl: "https://www.avaniagrofoods.com/red-onion-powder-bulk-supplier-india",
    rankingStatus: "Partial Mention in Commercial Terms",
    recommendedAction: "Add transit time matrix from Nhava Sheva to Long Beach, New York, Rotterdam, Felixstowe, and Jebel Ali"
  },
  {
    keyword: "compare red onion powder suppliers india price vs quality",
    category: "Red Onion Powder",
    theme: "Supplier Evaluation",
    intent: "Commercial Investigation",
    persona: "Chief Procurement Officer / Supply Chain Auditor",
    volumeTier: "Medium",
    competition: "Low-Medium",
    currentUrl: "https://www.avaniagrofoods.com/blog/how-to-compare-red-onion-powder-suppliers-india",
    rankingStatus: "Mapped to Blog Article 28",
    recommendedAction: "Link directly to /red-onion-powder-bulk-supplier-india; provide vendor audit checklist template"
  }
];

const header = [
  'Keyword',
  'Product_Category',
  'Theme',
  'Search_Intent',
  'Target_Buyer_Persona',
  'Volume_Tier_Estimate',
  'Competition_Level',
  'Current_Mapped_URL',
  'Current_Ranking_Status',
  'Recommended_Action_Optimization'
].join(',');

const escapeCsv = (str) => '"' + String(str || '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';

const rows = keywords.map(k => [
  escapeCsv(k.keyword),
  escapeCsv(k.category),
  escapeCsv(k.theme),
  escapeCsv(k.intent),
  escapeCsv(k.persona),
  escapeCsv(k.volumeTier),
  escapeCsv(k.competition),
  escapeCsv(k.currentUrl),
  escapeCsv(k.rankingStatus),
  escapeCsv(k.recommendedAction)
].join(','));

const targetPath = path.resolve(__dirname, '../KEYWORD_OPPORTUNITY_MAP.csv');
fs.writeFileSync(targetPath, header + '\n' + rows.join('\n'), 'utf8');
console.log('Successfully generated KEYWORD_OPPORTUNITY_MAP.csv with', rows.length, 'keywords.');
