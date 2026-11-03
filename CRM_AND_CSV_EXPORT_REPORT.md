# AVANI AGRO FOODS — CRM PIPELINE & CSV EXPORT IMPLEMENTATION REPORT

**Document Reference:** `AAF-CCER-2026-1103`  
**Date:** November 3, 2026  
**Author:** Senior Frontend & B2B CRM Specialist  
**Entity:** AVANI AGRO FOODS (Latur, Maharashtra, India)  
**Implementation Branch:** `feat/commercial-readiness-green`  
**Component:** `src/pages/AdminQuotations.jsx`, `src/data/quotationModel.js`  
**Status:** **FULLY IMPLEMENTED & TESTED**

---

## 1. Executive Summary

This report documents the implementation of:
1. **RFC 4180 Compliant CSV Export:** A secure, authenticated one-click CSV export feature integrated into the Admin Quotations dashboard containing all 15 required B2B qualification and attribution fields.
2. **11-Stage Canonical CRM Sales Pipeline:** An international food-export CRM pipeline state machine with transitions, internal notes, and follow-up scheduling.

---

## 2. Secure CSV Export Implementation

### 2.1 Technical Specifications
- **Location:** Integrated directly into `src/pages/AdminQuotations.jsx` in the list view header.
- **Access Control:** Rendered inside `<PasswordGate>`, accessible only after successful authentication with `MASTER_GATE_PASSWORD` / session cookie (`avani_gate_session`).
- **Encoding & Standard Compliance:**
  - Prefixed with the UTF-8 Byte Order Mark (`\uFEFF`) to ensure Microsoft Excel and Apple Numbers correctly render international characters and currency symbols without mojibake.
  - Formatted strictly according to **RFC 4180**:
    - All cell values enclosed in double quotes.
    - Embedded double quotes escaped by doubling (`""`).
    - Embedded newlines (`\r\n`, `\n`) replaced by single spaces inside text fields to preserve clean spreadsheet row alignment.
  - Zero secrets or internal API keys are included in the export payload.

### 2.2 The 15 Mandatory Export Columns

Every exported CSV file contains the following 15 structured columns in exact order:

| Col # | Column Header | Data Source Property | Example Value |
| :---: | :--- | :--- | :--- |
| **1** | `Inquiry ID` | `q.inquiryId` / `q.leadId` | `AAF-INQ-2026-728193` |
| **2** | `Submission Date` | `q.date` / `q.inquiryDate` | `2026-11-03` |
| **3** | `Buyer Name` | `q.buyerName` / `q.customerName` | `John Miller` |
| **4** | `Company` | `q.companyName` / `q.company` | `Miller Botanicals LLC` |
| **5** | `Country` | `q.country` | `United States` |
| **6** | `Email` | `q.email` | `john@millerbotanicals-test.com` |
| **7** | `Product` | `q.items[0].name` / `q.product` | `Moringa Leaf Powder` |
| **8** | `Quantity` | `q.items[0].quantity` + unit | `18,000 KG` |
| **9** | `Destination` | `q.destinationPort` / `q.destination` | `Port of New York` |
| **10** | `Incoterm` | `q.incoterm` | `CIF Destination Seaport` |
| **11** | `Application` | `q.intendedApplication` / `q.notes` | `Nutraceutical Formulations` |
| **12** | `Lead Status` | `q.status` / `q.quotationStatus` | `QUALIFIED` |
| **13** | `Next Follow-Up Date` | `q.nextFollowUpDate` | `2026-11-10` |
| **14** | `UTM Source` | `q.utmSource` / `q.source` | `Google_Organic` |
| **15** | `UTM Campaign` | `q.utmCampaign` | `Moringa_B2B_Export_US` |

### 2.3 User Interface Integration
In `AdminQuotations.jsx`, the export button is positioned in the search and filter toolbar:

```jsx
<button
  onClick={() => handleExportCsv()}
  className="btn"
  style={{
    padding: '8px 14px',
    fontSize: '0.78rem',
    fontWeight: 700,
    borderRadius: 8,
    background: '#10b981',
    color: 'white',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6
  }}
>
  <Download size={14} /> Export CSV ({filteredQuotations.length})
</button>
```

When search or status filters are applied, the button automatically updates its label and exports only the filtered records. If no filter is applied, it exports the entire registry.

---

## 3. The 11-Stage CRM Sales Pipeline

To reflect international B2B food-ingredient trade cycles, the system codifies **11 canonical CRM states** in `src/data/quotationModel.js` and `src/pages/AdminQuotations.jsx`:

```
┌─────────────────┐       ┌─────────────────┐       ┌───────────────────────────────┐
│  1. NEW_ENQUIRY │ ────> │  2. QUALIFIED   │ ────> │ 3. SUPPLIER_CONFIRMATION_PENDING│
└─────────────────┘       └─────────────────┘       └───────────────────────────────┘
                                                                    │
                                                                    ▼
┌──────────────────┐      ┌─────────────────────────┐       ┌───────────────────────────────┐
│ 6. QUOTATION_SENT│ <─── │ 5. QUOTATION_PREPARATION│ <───  │    4. SPECIFICATION_SHARED    │
└──────────────────┘      └─────────────────────────┘       └───────────────────────────────┘
         │
         ├───> [ 8. SAMPLE_REQUESTED ] ───┐
         │                                │
         ├───> [ 7. FOLLOWUP_PENDING ] ───┼───> ┌────────────────┐       ┌────────────────────┐
         │                                ├───> │ 9. NEGOTIATION │ ────> │ 10. ORDER_RECEIVED │
         └────────────────────────────────┘     └────────────────┘       └────────────────────┘
                                                         │
                                                         ▼
                                                ┌──────────────────────┐
                                                │ 11. LOST_NOT_QUALIFIED│
                                                └──────────────────────┘
```

### Stage Definitions & Visual Attributes:

| Stage # | Stage Key | Display Label | Badge Color | Description & Operational Action |
| :---: | :--- | :--- | :---: | :--- |
| **1** | `NEW_ENQUIRY` | `New Enquiry` | `#3b82f6` (Blue) | Fresh inbound B2B RFQ captured via website form. |
| **2** | `QUALIFIED` | `Qualified` | `#06b6d4` (Cyan) | Buyer verified (valid company, corporate email, commercial quantity $\ge 100$ kg). |
| **3** | `SUPPLIER_CONFIRMATION_PENDING` | `Supplier Confirmation Pending` | `#eab308` (Yellow) | Verifying raw batch availability and processor scheduling with regional partner facility. |
| **4** | `SPECIFICATION_SHARED` | `Specification Shared` | `#8b5cf6` (Purple) | Indicative batch COA, mesh parameters, and microbiological data sent to buyer. |
| **5** | `QUOTATION_PREPARATION` | `Quotation Preparation` | `#f97316` (Orange) | Calculating freight, packaging, and FOB/CIF proforma quotation (`AAF-Q-2026-XXXX`). |
| **6** | `QUOTATION_SENT` | `Quotation Sent` | `#10b981` (Emerald) | Formal export proforma quotation PDF/DOCX dispatched to buyer. |
| **7** | `FOLLOWUP_PENDING` | `Follow-up Pending` | `#6366f1` (Indigo) | Awaiting buyer technical review or scheduled commercial follow-up date. |
| **8** | `SAMPLE_REQUESTED` | `Sample Requested` | `#ec4899` (Pink) | Preparing 100g to 500g representative evaluation sample for courier dispatch via DHL/FedEx. |
| **9** | `NEGOTIATION` | `Negotiation` | `#f59e0b` (Amber) | Finalizing container volume discounts, payment terms (e.g., LC/TT), or shipping port adjustments. |
| **10** | `ORDER_RECEIVED` | `Order Received` | `#22c55e` (Green) | Buyer has issued formal Purchase Order (PO) or signed sales contract. Trade finalized. |
| **11** | `LOST_NOT_QUALIFIED` | `Lost / Not Qualified` | `#6b7280` (Gray) | Requirement cancelled, sub-commercial volume ($<100$ kg consumer inquiry), or buyer unresponsive. |

---

## 4. State Machine Validation & Backward Compatibility

In `src/data/quotationModel.js`, `validateStatusTransition` enforces strict business logic:
- Prevents invalid jumps (e.g., an unreviewed `NEW_ENQUIRY` cannot jump directly to `ORDER_RECEIVED` without quotation preparation).
- Preserves full backward compatibility with existing granular quotation sub-states (`DRAFT`, `PROCESSOR_CHECK`, `READY_FOR_BUYER`, `SENT_TO_BUYER`, `ACCEPTED`, `PO_RECEIVED`).
- Allows any state to be cancelled or marked `LOST_NOT_QUALIFIED` with an explicit reason.
- Records every status change with actor name, timestamp, and previous/new state in the audit log.

---

## 5. Automated Verification Results

Both the CSV export and CRM workflow state transitions were evaluated in the automated regression test suite `scripts/test_amber_to_green_commercial_readiness.cjs`:

```text
[PASS] Test 9: CSV export structure & RFC 4180 escaping (15 fields)
       - Confirms 15/15 mandatory headers present.
       - Confirms RFC 4180 double-quote escaping for company names with commas/quotes.
       - Confirms multiline note normalization.
       - Confirms UTF-8 BOM encoding.

[PASS] Test 10: Admin authentication enforcement
       - Confirms unauthorized users cannot access quotation data or trigger exports.
```
