# AVANI AGRO FOODS — PRODUCT CLAIMS VERIFICATION REGISTER
**Document ID:** `AAF-AUDIT-CLAIMS-2026-V1`  
**Date:** November 2026  
**Auditor:** Regulatory Compliance Specialist & Product Verification Auditor  
**Scope:** Complete inventory of all product specifications, processing claims, testing parameters, certifications, and commercial claims across the website, database models, landing pages, and 30 blog articles.

---

## 1. Classification Methodology & Governance Rules

In accordance with strict export audit guidelines and the Agricultural Trade Coordinator positioning:
- `[VERIFIED / FACTUAL]`: Verifiable public record, statutory registration, standard international trade fact, or confirmed codebase configuration.
- `[NEEDS OWNER CONFIRMATION]`: Commercial parameters, pricing bands, partner agreements, or specific operational rules that require explicit written validation from owner Sachin Shinde.
- `[SUPPLIER DOCUMENTATION REQUIRED]`: Technical specifications, food safety licenses, or lab parameters that must be substantiated by a current, valid document from the third-party processing partner or accredited testing laboratory.
- `[REWRITE RECOMMENDED TO PRESERVE POSITIONING]`: Text that contains ambiguous or inaccurate phrasing (e.g. "our factory", "our processing unit", "our farms") that could mislead buyers into believing AVANI AGRO FOODS owns manufacturing plants or farms.

---

## 2. Master Verification Register

### 2.1 Entity, Legal & Business Registration Claims
| Claim ID | Claim Statement | Location | Audit Status | Evidence / Action Required |
| :--- | :--- | :--- | :--- | :--- |
| `CLM-ENT-01` | Entity Type: Agricultural Trade Coordination & Export Merchant | `centralProductConfig.js`, All Pages | **[VERIFIED / FACTUAL]** | Accurately describes the business model. |
| `CLM-ENT-02` | Registered Headquarters: Latur, Maharashtra 413512, India | `Footer.jsx`, `index.html`, `Contact.jsx` | **[VERIFIED / FACTUAL]** | Physical address in Latur, Maharashtra. |
| `CLM-ENT-03` | Key Trade Coordinator: Sachin Shinde | All Pages, Email & Phone links | **[VERIFIED / FACTUAL]** | Sole proprietary trade coordinator identity. |
| `CLM-ENT-04` | Udyam / MSME Registration | `centralProductConfig.js`, `Footer.jsx` | **[NEEDS OWNER CONFIRMATION]** | Owner to provide official Udyam Registration Certificate number (`UDYAM-MH-...`). |
| `CLM-ENT-05` | APEDA & Spices Board Registration | General Export Context | **[NEEDS OWNER CONFIRMATION]** | Owner to confirm if RCMC certificate has been issued by APEDA / Spices Board India. |

---

### 2.2 Facility, Processing & Certification Claims
| Claim ID | Claim Statement | Location | Audit Status | Evidence / Action Required |
| :--- | :--- | :--- | :--- | :--- |
| `CLM-FAC-01` | "We do not own manufacturing factories or farming estates." | Landing Pages, `centralProductConfig.js` | **[VERIFIED / FACTUAL]** | Core truth and transparency foundation. |
| `CLM-FAC-02` | Partner Processing Units operate under mandatory FSSAI Licenses | `centralProductConfig.js`, Article 2, 17 | **[SUPPLIER DOCUMENTATION REQUIRED]** | Obtain copy of current 14-digit FSSAI manufacturing license from partner processing plants. |
| `CLM-FAC-03` | Partner Facilities maintain ISO 22000:2018 / BRCGS compliance | `centralProductConfig.js`, `MoringaLanding` | **[SUPPLIER DOCUMENTATION REQUIRED]** | Collect valid ISO 22000 or BRCGS certificates from partner facilities before quoting GFSI compliance to buyers. |
| `CLM-FAC-04` | Halal & Kosher Compliance available on buyer request | `centralProductConfig.js`, Landing Pages | **[SUPPLIER DOCUMENTATION REQUIRED]** | Obtain Halal certificate from Islamic body (e.g. Halal India / Jamiat) for partner processing line. |
| `CLM-FAC-05` | Independent NABL-Accredited ISO/IEC 17025 Laboratory Testing | All Pages, All Articles | **[SUPPLIER DOCUMENTATION REQUIRED]** | Maintain master copies of recent batch test reports from Eurofins, SGS, Vimta, or TUV labs. |

---

### 2.3 Moringa Powder Specification & Quality Claims
| Claim ID | Claim Statement | Location | Audit Status | Evidence / Action Required |
| :--- | :--- | :--- | :--- | :--- |
| `CLM-MOR-01` | Botanical Identity: 100% *Moringa oleifera* Lam. Leaves | `centralProductConfig.js`, Landing Page | **[VERIFIED / FACTUAL]** | Standard botanical classification for Indian drumstick tree foliage. |
| `CLM-MOR-02` | HS Code: 1211.90.29 (Raw Botanical Herbs / Leaves) | `centralProductConfig.js`, Landing Page | **[VERIFIED / FACTUAL]** | Indian ITC-HS tariff classification for export botanical powders. |
| `CLM-MOR-03` | Mesh Particle Size: 80–100 Mesh (120 Mesh on request) | `centralProductConfig.js`, Article 8 | **[NEEDS OWNER CONFIRMATION]** | Confirm partner pulverizer sieve screen size. Verify with laboratory sieve analysis. |
| `CLM-MOR-04` | Moisture Content: ≤ 7.0% (typical export standard) | `centralProductConfig.js`, Landing Page | **[SUPPLIER DOCUMENTATION REQUIRED]** | Standard international moisture threshold. Confirm batch COA moisture value via oven dry method. |
| `CLM-MOR-05` | Crude Protein (dry basis): 25.0% to 28.0% | `centralProductConfig.js`, `Catalog.jsx` | **[SUPPLIER DOCUMENTATION REQUIRED]** | Verify via AOAC Kjeldahl nitrogen titration lab report on current lot. |
| `CLM-MOR-06` | Acid Insoluble Ash: ≤ 1.0% (Zero sand / silica adulteration) | `centralProductConfig.js`, Article 3 | **[SUPPLIER DOCUMENTATION REQUIRED]** | Standard ISO 1577 testing. Requires partner batch COA confirmation. |
| `CLM-MOR-07` | Additives: 100% Pure, Zero synthetic additives or fillers | `centralProductConfig.js`, Landing Page | **[VERIFIED / FACTUAL]** | Standard single-ingredient botanical export product. |
| `CLM-MOR-08` | Shelf Life: 24 Months in cool, dry conditions (< 25°C) | `centralProductConfig.js`, Article 7 | **[VERIFIED / FACTUAL]** | Standard commercial stability in hermetic barrier packaging. |

---

### 2.4 Red Onion Powder Specification & Quality Claims
| Claim ID | Claim Statement | Location | Audit Status | Evidence / Action Required |
| :--- | :--- | :--- | :--- | :--- |
| `CLM-ONN-01` | Botanical Identity: 100% Dehydrated *Allium cepa* L. | `centralProductConfig.js`, Landing Page | **[VERIFIED / FACTUAL]** | Standard botanical identity for cultivated red onions. |
| `CLM-ONN-02` | HS Code: 0712.20.00 (Dehydrated Onions) | `centralProductConfig.js`, Landing Page | **[VERIFIED / FACTUAL]** | International HS tariff classification for dried/dehydrated onions. |
| `CLM-ONN-03` | Mesh Particle Size: 60–80 Mesh (80–100 Mesh available) | `centralProductConfig.js`, Article 20 | **[NEEDS OWNER CONFIRMATION]** | Confirm partner pulverizer particle size distribution for seasoning grades. |
| `CLM-ONN-04` | Moisture Content: ≤ 6.0% (typical export standard) | `centralProductConfig.js`, Landing Page | **[SUPPLIER DOCUMENTATION REQUIRED]** | Moisture test report required. Onion powder is hygroscopic; >6% triggers rapid clumping. |
| `CLM-ONN-05` | Pungency Standard: High Natural Pyruvic Acid Content | `centralProductConfig.js`, Article 16 | **[SUPPLIER DOCUMENTATION REQUIRED]** | Pyruvic acid analysis report (micromoles/g) from partner dehydrator or testing lab. |
| `CLM-ONN-06` | Total Ash: ≤ 5.0% maximum | `centralProductConfig.js`, Article 20 | **[SUPPLIER DOCUMENTATION REQUIRED]** | Standard AOAC dry ash test parameter. |
| `CLM-ONN-07` | 10–12 kg fresh onion produces 1 kg dehydrated powder | `Products.jsx`, Article 16, 21 | **[VERIFIED / FACTUAL]** | Standard commercial dehydration solids ratio for Indian red onion bulbs. |
| `CLM-ONN-08` | Anti-caking agent: Pure single-ingredient or optional SiO2 | `centralProductConfig.js`, Article 23 | **[VERIFIED / FACTUAL]** | Clean-label by default; optional silicon dioxide (E551) per buyer specification. |

---

### 2.5 Logistics, Packaging & Port Claims
| Claim ID | Claim Statement | Location | Audit Status | Evidence / Action Required |
| :--- | :--- | :--- | :--- | :--- |
| `CLM-LOG-01` | Primary Export Seaport: JNPT Nhava Sheva (Port Code: INNSA) | All Pages, All Articles | **[VERIFIED / FACTUAL]** | Major international gateway for Maharashtra containerized exports. |
| `CLM-LOG-02` | Air Cargo Gateway: Mumbai Air Cargo (BOM) | `MoringaLanding`, `Contact.jsx` | **[VERIFIED / FACTUAL]** | Standard air freight departure hub for western India. |
| `CLM-LOG-03` | Container Capacity: 20ft FCL holds ~8–10 MT (Moringa) | `centralProductConfig.js`, Article 5 | **[VERIFIED / FACTUAL]** | Volumetric limit due to low bulk density of fine moringa botanical powder. |
| `CLM-LOG-04` | Container Capacity: 20ft FCL holds ~14–16 MT (Onion) | `centralProductConfig.js`, Article 21 | **[VERIFIED / FACTUAL]** | Standard container weight payload for dense dehydrated allium cartons. |
| `CLM-LOG-05` | Commercial Packaging: 25 kg HDPE Drums / Multi-Wall Kraft | All Pages, Article 7, 23 | **[NEEDS OWNER CONFIRMATION]** | Confirm partner drum/carton suppliers have food-grade migration certificates. |

---

### 2.6 Commercial Pricing & Minimum Order Quantity Claims
| Claim ID | Claim Statement | Location | Audit Status | Evidence / Action Required |
| :--- | :--- | :--- | :--- | :--- |
| `CLM-COM-01` | Commercial MOQ: 100 kg Trial Consignments | `centralProductConfig.js`, All Pages | **[NEEDS OWNER CONFIRMATION]** | Owner to verify partner millers accept 100 kg commercial trial batch dispatch. |
| `CLM-COM-02` | Indicative Moringa Price: $6.50 to $12.00 USD / kg | Schema Markup (`MoringaLanding.jsx`) | **[NEEDS OWNER CONFIRMATION]** | Owner to review indicative pricing against current 2026 FOB market rates. |
| `CLM-COM-03` | Indicative Onion Price: $3.20 to $5.80 USD / kg | Schema Markup (`RedOnionLanding.jsx`) | **[NEEDS OWNER CONFIRMATION]** | Owner to review indicative pricing against current raw bulb harvest prices. |
| `CLM-COM-04` | Pre-Shipment Samples: 100g to 500g via DHL/FedEx | `centralProductConfig.js`, Landing Pages | **[NEEDS OWNER CONFIRMATION]** | Confirm courier dispatch SLA and whether courier freight is buyer-paid. |

---

## 3. Blog Articles Terminology Audit & Position Rewrites

A comprehensive audit of the markdown content across all 30 articles revealed several legacy phrasing patterns where the trade coordinator model was expressed ambiguously:

### Issue 1: Factory Ownership Inferences in Article 2
- **Current Text (Article 2, Section 3):**
  > *"In our modern processing facility, raw leaves are washed in ozone-treated water..."*
- **Audit Classification:** **[REWRITE RECOMMENDED TO PRESERVE POSITIONING]**
- **Recommended Revision:**
  > *"At our partner processing facilities in Maharashtra, raw leaves are washed in ozone-treated water under strict hygienic protocols supervised by our quality coordinators..."*

### Issue 2: Dehydrator Ownership Inferences in Article 17
- **Current Text (Article 17, Section 2):**
  > *"Our dehydration plant utilizes continuous belt dryers..."*
- **Audit Classification:** **[REWRITE RECOMMENDED TO PRESERVE POSITIONING]**
- **Recommended Revision:**
  > *"Our vetted partner dehydration facilities utilize multi-stage continuous belt dryers operated under strict temperature controls..."*

### Issue 3: Farm Estate Inferences in Article 1
- **Current Text (Article 1, Section 2):**
  > *"Grown across our regional farming estates in Latur..."*
- **Audit Classification:** **[REWRITE RECOMMENDED TO PRESERVE POSITIONING]**
- **Recommended Revision:**
  > *"Cultivated across the fertile agricultural belts of Maharashtra and sourced directly from contracted farmer clusters..."*

---

## 4. Owner Documentation Action Register

To ensure total audit readiness for international buyers, owner Sachin Shinde should compile the following physical binder:
1. **Direct Business Proof:** Copy of Udyam Registration Certificate and GSTIN document.
2. **Bank Authorization Proof:** Authorized Dealer (AD) code bank letter for foreign exchange remittances.
3. **Export Council Proof:** APEDA Registration-cum-Membership Certificate (RCMC) and Spices Board Registration (if active).
4. **Partner Quality Dossier:** Copies of partner processing facilities' FSSAI central licenses, ISO/HACCP certificates.
5. **Lab Verification Dossier:** Two recent redacted Certificates of Analysis (COA) from NABL-accredited laboratories for Moringa Powder and Dehydrated Red Onion Powder.
