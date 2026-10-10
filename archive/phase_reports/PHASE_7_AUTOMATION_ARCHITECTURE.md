# AVANI AGRO FOODS — PHASE 7 AUTOMATION ARCHITECTURE

**Date:** August 19, 2026  
**System Name:** Cloud-Native Automated Export Quotation & Lead Pipeline  
**Production Domain:** https://www.avaniagrofoods.com/  

---

## 1. HIGH-LEVEL AUTOMATION TOPOLOGY

```
+-----------------------------------------------------------------------------------+
|                                  GLOBAL BUYERS                                    |
|              (Browsing from UAE, Europe, USA, Japan, Middle East, India)          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ [HTTPS / TLS 1.3]
+-----------------------------------------------------------------------------------+
|                          VERCEL GLOBAL EDGE NETWORK (CDN)                         |
|   - Serves React 18 Single Page Application (100.23 kB bundle)                    |
|   - Enforces Security Headers (HSTS, nosniff, SAMEORIGIN)                         |
|   - Edge Middleware guards /affiliate and admin routes (HTTP 307 Redirect)        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ [POST /api/save-lead]
+-----------------------------------------------------------------------------------+
|                        VERCEL SERVERLESS COMPUTE LAYER                            |
|                                                                                   |
|   1. api/save-lead.js:                                                            |
|      - Input sanitization & regex email validation                                |
|      - 60-second in-memory dedup window                                           |
|      - Generates LEAD-YYYYMMDD-XXXX                                               |
|                                                                                   |
|   2. api/lib/quotationEngine.js:                                                  |
|      - Extracts official pricing from Avani Costing Model                         |
|      - Computes FOB, Freight, Insurance (0.5%), Documentation, and CIF            |
|      - Assigns Quotation ID: AAF-YYYY-XXXX (Status: REVIEW_REQUIRED)              |
|                                                                                   |
|   3. api/quotation.js:                                                            |
|      - Dynamic On-Demand Stream Generation for Encrypted XLSX & Vector PDF        |
|      - Asserts strict equality: XLSX total === PDF total                          |
|                                                                                   |
|   4. api/admin-quotations.js:                                                     |
|      - HMAC-SHA256 authenticated admin CRUD and status lifecycle                  |
+-----------------------------------------------------------------------------------+
           │                                 │                            │
           ▼                                 ▼                            ▼
+---------------------+           +--------------------+       +--------------------+
| GOOGLE CLOUD        |           | PICKY ASSIST /     |       | HUBSPOT & ZAPIER   |
| APPS SCRIPT         |           | WHATSAPP           |       | REST CONNECTORS    |
| - Webhook append to |           | - Automated notice |       | - Contact & Deal   |
|   Master Lead Sheet |           |   & Share Link Gen |       |   sync (when token |
|                     |           |                    |       |   attached)        |
+---------------------+           +--------------------+       +--------------------+
```

---

## 2. PRODUCTION DATA FLOW & LIFECYCLE

```
[CUSTOMER SUBMITS RFQ] 
         │
         ▼
[api/save-lead] ─── Validates Input & Generates LEAD-YYYYMMDD-XXXX
         │
         ├──► [Quotation Engine] ─── Computes CIF Total & Generates AAF-YYYY-XXXX
         │                              (Initial Status: REVIEW_REQUIRED)
         │
         ├──► [Google Sheets Webhook] ─── Appends Structured Lead Row
         │
         ├──► [Picky Assist Webhook] ─── Sends WhatsApp Alert
         │
         ▼
[Admin Quotation Center] ─── Staff reviews held quotation at /admin/quotations
         │
         ├──► [1-Click Download PDF] ─── Streams vector PDF proforma
         ├──► [1-Click Download XLSX] ─── Streams encrypted Excel costing sheet
         ├──► [1-Click Email Quotation] ─── Dispatches to customer email
         ├──► [1-Click WhatsApp Share] ─── Opens pre-formatted WhatsApp chat
         │
         ▼
[Status Updated] ─── Transitions: REVIEW_REQUIRED -> APPROVED -> SENT -> ACCEPTED
```

---

## 3. ZERO-LAPTOP RESILIENCE GUARANTEE

Every production-critical component is deployed as cloud serverless code on Vercel and Google Cloud. The entire lead capture, quotation computation, document generation, and synchronization pipeline executes 24/7/365 without depending on the developer or owner's computer.
