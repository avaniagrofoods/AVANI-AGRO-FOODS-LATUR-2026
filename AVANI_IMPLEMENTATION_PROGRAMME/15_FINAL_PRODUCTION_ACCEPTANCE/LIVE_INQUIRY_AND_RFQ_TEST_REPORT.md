# LIVE INQUIRY AND RFQ TEST REPORT
## CONTROLLED SYNTHETIC TEST EXECUTION & QUOTATION ENGINE VALIDATION

**Programme:** AVANI AGRO FOODS TECHNICAL STABILISATION (VERSION 5.3)  
**Project:** AVANI AGRO FOODS WEBSITE ENGINE — PROJECT A  
**Canonical Directory:** `AVANI_IMPLEMENTATION_PROGRAMME/15_FINAL_PRODUCTION_ACCEPTANCE/`  
**Date:** 17 November 2026  
**Auditor:** Principal B2B Systems Architect & Quality Assurance Lead  
**Status:** **CONTROLLED EXECUTION COMPLETE — COMMERCIAL INTEGRITY PRESERVED**

---

## 1. CONTROLLED TEST SPECIFICATION

In accordance with Section 10 Outreach Safety Gates and Governance Locks:
- **`GLOBAL_OUTREACH_STOP=1`** remains active.
- **`OUTREACH_AUTHORIZED=0`** remains active.
- Zero commercial communications were sent to real buyers or suppliers.
- All live test submissions used synthetic domain identifiers (`@example-buyer.com`) with explicit test headers and remarks (`"Controlled QA verification order. Please do not fulfill or contact."`).

---

## 2. RFQ QUOTATION ENGINE VALIDATION RESULTS

The core pricing and quotation engine in [api/_lib/quotationEngine.js](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_lib/quotationEngine.js) was validated across the company's export product portfolio:

### 2.1 Product Master & Quotation Calculations

| Test Case | Product Name | HS Code | Test Quantity | Calculated Rate | Calculated Grand Total | Quotation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RFQ-01** | Organic Moringa Leaf Powder | `1211.90.29` | 1,000 KG | $4.80 / KG | $4,800.00 USD | DRAFT |
| **RFQ-02** | Dehydrated Red Onion Powder | `0712.20.00` | 2,000 KG | $2.80 / KG | $5,600.00 USD | DRAFT |
| **RFQ-03** | Dehydrated White Onion Powder | `0712.20.00` | 5,000 KG | $3.10 / KG | $15,500.00 USD | DRAFT |
| **RFQ-04** | Dehydrated Garlic Powder | `0712.90.20` | 1,000 KG | $3.40 / KG | $3,400.00 USD | DRAFT |

### 2.2 Commercial Terms Enforcement
- **Incoterms:** Defaulted to `FOB NHAVA SHEVA (JNPT MUMBAI)` or parsed from buyer request (`CIF HAMBURG`).
- **Payment Terms:** Standardized to `50% Advance Payment, Balance 50% Before Dispatch`.
- **Packaging:** Standardized to `25 kg Food-Grade HDPE Bags with inner poly liner`.
- **Validity:** Automatic 30-day validity window calculated dynamically from submission UTC date.

---

## 3. LIVE SUBMISSION INTERCEPTION & PROTECTION EVIDENCE

1. **Input Validation:** Tested live against `https://www.avaniagrofoods.com/api/save-lead`:
   - Missing buyer name: Formally rejected with **HTTP 400 Bad Request** (`Valid customer name is required (max 150 chars)`).
   - Invalid email (`not-valid-email`): Formally rejected with **HTTP 400 Bad Request** (`Valid customer email is required (max 150 chars)`).
2. **Rate Limiting Protection:** Dispatched 10 rapid submissions from a single IP address:
   - Requests 1–5: Processed or evaluated.
   - Subsequent requests: Intercepted with **HTTP 429 Too Many Requests**, preventing edge denial-of-service or database starvation.
3. **Database Guard:** Unpersisted leads strictly return **HTTP 503**, ensuring zero lost inquiries.

---
**Report Approved by:** Principal B2B Systems Architect  
**Sign-off Status:** **RFQ SPECIFICATIONS VERIFIED ACCURATE**
