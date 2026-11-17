# PROJECT A FINAL HANDOVER DOCUMENT
## AVANI AGRO FOODS WEBSITE ENGINE — PRODUCTION RUNBOOK & OPERATIONAL HANDOVER

**Application:** AVANI AGRO FOODS Website Engine (Project A)  
**Handover Recipient:** Sachin Shinde – Founder & CEO  
**Author:** Antigravity Principal Software Architect & DevOps Lead  
**Handover Date:** 17 November 2026  
**Status:** FULL PRODUCTION OPERATIONAL HANDOVER  

---

## 1. SYSTEM IDENTITY & REPOSITORIES

- **Local Working Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
- **GitHub Repository:** `https://github.com/avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026.git`
- **Production URL:** `https://www.avaniagrofoods.com/`
- **Hosting Platform:** Vercel Global Edge Network
- **Database Backend:** Supabase Managed PostgreSQL 15 (`https://app.supabase.com`)
- **Email Dispatch:** Resend API (`https://resend.com`)

---

## 2. PRODUCTION RUNBOOK & DAILY OPERATIONS

### 2.1 Starting Local Development
```powershell
# Navigate to Project A root
cd "C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026"

# Run local Vite dev server
npm run dev
# Server starts at http://localhost:3000/
```

### 2.2 Verifying and Compiling Production Build
```powershell
# Execute complete production build
npm run build
# Verified output generated in dist/ (2,146 modules, ~18s)
```

### 2.3 Reviewing B2B Inquiries & Leads
1. **Primary Database:** Inquiries are stored in `public.leads` in Supabase with complete 30-column B2B specifications.
2. **Email Alerts:** Whenever a buyer submits an RFQ, an automated notification is dispatched to `sales@avaniagrofoods.com` via Resend.
3. **Google Sheets CRM Mirror:** Submissions are automatically reflected in the configured Google Sheets spreadsheet tabs (`Customer Inquiries` and `Quotations`).

### 2.4 Generating Custom B2B Export Quotations
1. Open the internal Quotation Generator at `https://www.avaniagrofoods.com/admin/quotations` (or local `http://localhost:3000/admin/quotations`).
2. Enter buyer details, Incoterm (FOB Nhava Sheva / CIF destination), quantity in KG, and rate.
3. Click **Generate Quotation** to produce a professional PDF and DOCX proforma invoice.

---

## 3. SECURITY & COMPLIANCE CONTROLS IN FORCE

1. **UUIDv4 Server Identifiers:** Client callers cannot spoof or supply inquiry/quote IDs. All IDs are server-minted CSPRNG UUIDv4.
2. **Insert-Only Lead Capture:** Duplicate form submissions cannot overwrite existing inquiries.
3. **Idempotency Protection:** Bounded 60-second in-memory dedup cache active; prepared PostgreSQL ledger migration in `migrations/20261117_inquiry_idempotency_ledger.sql`.
4. **Zero Client Secrets:** All API keys are isolated within Vercel serverless functions.

---

## 4. TROUBLESHOOTING & EMERGENCY CONTACTS

| Symptom / Event | Root Cause Analysis | Action / Recovery |
| :--- | :--- | :--- |
| **RFQ Form displays "Database persistence failed"** | Supabase database is unreachable or credentials altered. | Check Supabase dashboard status; verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel. In-memory cache is auto-cleared. |
| **Vercel Build Failure** | Syntax error or missing npm dependency. | Run `npm run build` locally to inspect error trace; roll back deployment via Vercel Dashboard. |
| **Email alerts not arriving** | Resend API key expired or domain verification issue. | Check Resend dashboard; verify DKIM and SPF TXT records on `avaniagrofoods.com`. |

---
*Document Accepted & Transferred by Principal Software Architect to Sachin Shinde, Founder & CEO.*
