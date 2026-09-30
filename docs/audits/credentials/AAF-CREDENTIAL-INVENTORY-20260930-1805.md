# AVANI AGRO FOODS
# SAFE CREDENTIAL / SECRET INVENTORY

**Audit ID:** AAF-MONTHLY-20260930-1805  
**Timestamp:** 2026-09-30 18:05:00 IST  
**Auditor:** Master Forensic Automated Audit Suite (Full Auto Mode)  
**Scope:** AVANI AGRO FOODS ONLY (Repository: `avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026`)  
**Project Isolation:** AVANI AGRO FOODS ONLY — AVANI LOAN SERVICES NOT TOUCHED.  
**Security Policy:** ZERO SECRET EXPOSURE. Only safe identifiers, existence flags, and redactions are recorded.

---

## 1. Safe Credential & Integration Inventory

| Name | Type | Provider | Location | Purpose | Present | Server-Side | Client-Visible | Exposure | Rotation Required | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GITHUB_AUTH** | Git Credential / Token | GitHub | Local Git Credential Helper / GCM | CLI & repository synchronisation | YES | YES | NO | NONE DETECTED | NO | **PASS** | `gh repo view` confirms viewerPermission: ADMIN for `avaniagrofoods` account. |
| **VERCEL_TOKEN** | API Token / Auth Session | Vercel | Vercel CLI global auth (`~/.vercel`) | Production build & deployment management | YES | YES | NO | NONE DETECTED | NO | **PASS** | `npx vercel ls` successfully authenticated to team `avaniagrofoods1356-4705s-projects`. |
| **GOOGLE_APPS_SCRIPT** | Deployment ID | Google Apps Script | Vercel Serverless Env (`VITE_GOOGLE_SHEETS_WEBHOOK`) | CRM proxy for customer inquiries & quotation storage | YES | YES | NO | NONE DETECTED | NO | **PASS** | Production deployment `AKfycbyjSn9d9v6kKxf77jNyhynwi14lOfwpuZ6mc29RWrdCi_2WzsMpnoxiTIb828Nr9bQ3` active on Version 5. |
| **CRM_WEBHOOK_SECRET** | Shared Secret | Google Apps Script / Vercel | Vercel Serverless Env + Script Properties | Authenticates webhook payloads sent to Apps Script | YES | YES | NO | NONE DETECTED | NO | **PASS** | Constant-time token verification verified; missing & wrong tokens return 401 Unauthorized. |
| **MASTER_GATE_PASSWORD** | Auth Secret | Internal Serverless | Vercel Serverless Env (`MASTER_GATE_PASSWORD`) | Protects `/private` intelligence dashboards & locks XLSX files | YES | YES | NO | NONE DETECTED | NO | **PASS** | Active on Vercel Production. `/api/verify-gate` verifies password server-side; invalid password returns HTTP 401. |
| **AFFILIATE_PASSWORD** | Auth Secret | Internal Serverless | Vercel Serverless Env (`AFFILIATE_PASSWORD`) | Protects affiliate portal access | YES | YES | NO | NONE DETECTED | NO | **PASS** | Configured in Vercel Production env. `/api/affiliate-auth` rejects unauthorized access. |
| **SESSION_SECRET** | Cryptographic Key | Internal Serverless | Vercel Serverless Env (`SESSION_SECRET`) | Signs session cookies and auth tokens | YES | YES | NO | NONE DETECTED | NO | **PASS** | Active on Vercel Production & Preview environments. Tampered cookies rejected. |
| **HUBSPOT_ACCESS_TOKEN** | API Private App Token | HubSpot | Vercel Serverless Env (`HUBSPOT_ACCESS_TOKEN`) | B2B CRM contact creation and deal tracking | YES | YES | NO | NONE DETECTED | NO | **PASS** | Encrypted in Vercel environment. Code includes error boundary; zero customer communication sent during testing. |
| **ZAPIER_WEBHOOK_URL** | Webhook URL | Zapier | Vercel Serverless Env (`ZAPIER_WEBHOOK_URL`) | Automation triggers for multi-channel notification | YES | YES | NO | NONE DETECTED | NO | **PASS** | Encrypted in Vercel environment. Server-side dispatch isolated; zero client exposure. |
| **META_ACCESS_TOKEN** | Graph API Token | Meta / Facebook | Not Configured | Social lead sync | NO | N/A | NO | NONE DETECTED | NO | **BLOCKED** | Meta integration not active on serverless environment. No unauthorized credentials exist. |
| **META_APP_SECRET** | API Secret | Meta / Facebook | Not Configured | Meta webhook verification | NO | N/A | NO | NONE DETECTED | NO | **BLOCKED** | Meta App Secret not configured. |
| **WHATSAPP_TOKEN** | Cloud API Token | Meta / Picky Assist | Not Configured | Direct WhatsApp Business API messaging | NO | N/A | NO | NONE DETECTED | NO | **PASS** | Direct WhatsApp CTA uses client-side universal deep link `https://wa.me/917219053645`; server reports `NOT_CONFIGURED` without mock delivery. |
| **DATABASE_URL** | DB Connection String | PostgreSQL / MongoDB | Not Required (Serverless App Engine) | Primary persistent data storage | N/A | N/A | N/A | NONE DETECTED | NO | **N/A** | Architecture uses Google Sheets / Apps Script and local JSON for B2B data; no SQL/NoSQL external DB utilized. |
| **DATABASE_PASSWORD** | DB Password | Database Provider | Not Required | Database credentials | N/A | N/A | N/A | NONE DETECTED | NO | **N/A** | No external SQL database configured. |
| **EMAILJS_SERVICE_ID** | Public Service Identifier | EmailJS | Vercel Environment (`VITE_EMAILJS_SERVICE_ID`) | Client-side contact notification proxy | YES | NO | YES | NONE (Client Public ID) | NO | **PASS** | Public client-side token designed for browser form delivery. Rate limiting enforced. |
| **EMAILJS_PUBLIC_KEY** | Public Client Key | EmailJS | Vercel Environment (`VITE_EMAILJS_PUBLIC_KEY`) | Client-side contact notification authorization | YES | NO | YES | NONE (Client Public ID) | NO | **PASS** | Public client key designed for public browser use. |

---

## 2. Safe Identifier Catalog

The following identifiers represent non-confidential system parameters verified during the audit:

- **GitHub Organization:** `avaniagrofoods`
- **GitHub Repository:** `avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026`
- **GitHub Default Branch:** `main`
- **Vercel Team / Project Owner:** `avaniagrofoods1356-4705s-projects`
- **Vercel Project Name:** `avani-agro-foods-latur-2026`
- **Vercel Production Deployment ID:** `dpl_9auC8JYqvy5rjNrEb3D1vBSc2onH`
- **Google Apps Script Project ID:** `12NE5DXoBJd8cLWAV8XezqYHZegdMYCfcuEtoynt0_rHSkMT8v71Cmull`
- **Google Apps Script Deployment ID:** `AKfycbyjSn9d9v6kKxf77jNyhynwi14lOfwpuZ6mc29RWrdCi_2WzsMpnoxiTIb828Nr9bQ3`
- **Google Apps Script Version:** `Version 5`
- **Authoritative Business Contact:** Sachin Shinde, Trade Coordinator (`sales@avaniagrofoods.com`, `+91 7219053645`)
- **Authoritative Domain:** `https://www.avaniagrofoods.com/`

---

## 3. Secret Leak Scanning Verification

1. **Repository Tracked Files Scan:**
   - 217 tracked source files scanned across JS, JSX, JSON, CSS, MD, and HTML.
   - Zero high-entropy secret tokens, private keys, PATs, or webhook passwords committed.
   - Result: **PASS**

2. **Git Commit History Scan:**
   - Full Git commit history inspected for token patterns (`ghp_`, `github_pat_`, `sk_live_`, `sk_test_`, `whsec_`, `AKIA`, `AIza`, `Bearer`).
   - All historical mentions in markdown files verified as redacted audit headers or test labels.
   - `.env.local` is present in `.gitignore` and has never been committed.
   - Result: **PASS**

3. **Frontend Production Bundle Scan:**
   - Compiled production bundle assets in `dist/assets/` inspected.
   - Zero references to server-side secrets (`CRM_WEBHOOK_SECRET`, `MASTER_GATE_PASSWORD`, `AFFILIATE_PASSWORD`, `SESSION_SECRET`).
   - Result: **PASS**
