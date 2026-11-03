# AVANI AGRO FOODS — PRODUCTION DEPLOYMENT & GO-LIVE CHECKLIST

**Document Reference:** `AAF-PDC-2026-1103`  
**Date:** November 3, 2026  
**Author:** DevOps & Lead Systems Architect  
**Entity:** AVANI AGRO FOODS (Latur, Maharashtra, India)  
**Trade Coordinator:** Sachin Shinde  
**Implementation Branch:** `feat/commercial-readiness-green`  
**Current Production Commit:** `425c503`  
**Rollback Baseline:** `b89ca6f`  
**Deployment Target:** Vercel Production Environment ([https://www.avaniagrofoods.com/](https://www.avaniagrofoods.com/))  

---

## 1. Overall System Status & Go-Live Evaluation

### Status: **AMBER $\rightarrow$ GREEN READY (PENDING OWNER ACTIONS)**
- **Technical Codebase Status:** **GREEN**  
  All 13 commercial regression tests pass; all 12 lead-generation tests pass; production build succeeds with 0 errors; CSV export is fully implemented; 11-stage CRM pipeline is active; and database persistence logic is deployed with graceful fallback handling.
- **Production Deployment Gate:** **PENDING OWNER ACTIONS**  
  Per Non-Negotiable Rule 9 & 10, production DNS changes and live Vercel deployments are withheld until explicit review and approval by Sachin Shinde.

---

## 2. Pre-Deployment Verification Gate (Completed)

| Check Item | Requirement | Verification Method | Status | Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **All 30 Articles Preserved** | 0 deleted, 0 broken slugs | Node.js verification against inventory | `PASS` | 30/30 baseline articles matched |
| **Both Landing Pages Active** | HTTP 200 on landing URLs | Live HTTP inspection + Vite build check | `PASS` | Moringa & Red Onion landing pages compile |
| **Sitemap & Robots.txt** | 50 canonical URLs declared | XML structure and `<loc>` counting | `PASS` | Exactly 50 URLs declared |
| **Production Build** | Clean Vite build, exit code 0 | `npm run build` | `PASS` | 2,145 modules built in 54.70s |
| **Automated Tests** | 25/25 automated tests pass | Regression & E2E test suites | `PASS` | 25 passed, 0 failed |
| **Zero Secret Exposure** | No private API keys in client | Static analysis of JavaScript bundles | `PASS` | Keys restricted to serverless runtime |
| **Rollback Point Preserved** | Fast recovery to `b89ca6f` | Git commit baseline recorded | `PASS` | Baseline commit verified |

---

## 3. Prioritized Owner Action Checklist (Sachin Shinde)

Please execute the following 3 steps to complete the transition to full **GREEN** commercial operation:

### Step 1: DNS MX Record Consolidation (Hostinger DNS Panel)
*(Time required: 5 minutes. Prevents split-inbox delivery).*
1. Log in to [Hostinger Control Panel](https://hpanel.hostinger.com/).
2. Go to **Domains** $\rightarrow$ `avaniagrofoods.com` $\rightarrow$ **DNS / Nameservers**.
3. Under **MX Records**:
   - [ ] **DELETE:** `mx1.hostinger.com` (Priority: 5)
   - [ ] **DELETE:** `mx2.hostinger.com` (Priority: 10)
   - [ ] **CONFIRM RETAINED:**
     - `mx.zoho.in` (Priority: 10)
     - `mx2.zoho.in` (Priority: 20)
     - `mx3.zoho.in` (Priority: 50)
4. Under **TXT Records**:
   - [ ] Update `_dmarc` to:  
     `v=DMARC1; p=none; rua=mailto:sales@avaniagrofoods.com; adkim=r; aspf=r`

### Step 2: Set Up Supabase PostgreSQL Database (Free Tier)
*(Time required: 10 minutes. Enables ACID-durable lead storage).*
1. Go to [https://supabase.com/](https://supabase.com/) and create a free project named `avani-agro-foods` in Region **Central India (Mumbai)** or **Singapore**.
2. Open **SQL Editor** $\rightarrow$ Click **New Query** $\rightarrow$ Paste the contents of [`supabase/schema.sql`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/supabase/schema.sql) $\rightarrow$ Click **Run**.
3. Open **Project Settings** $\rightarrow$ **API**:
   - Copy **Project URL**
   - Copy **`service_role` key** (secret key).
4. Go to [Vercel Project Settings](https://vercel.com/) $\rightarrow$ **Environment Variables**:
   - [ ] Add `SUPABASE_URL` = `<your-project-url>`
   - [ ] Add `SUPABASE_SERVICE_ROLE_KEY` = `<your-service-role-secret-key>`
   - Apply to **Production**, **Preview**, and **Development**.

### Step 3: Approve & Execute Production Deployment
*(Time required: 2 minutes).*
Once Step 1 and Step 2 are complete:
1. Merge branch `feat/commercial-readiness-green` into `main`:
   ```bash
   git checkout main
   git merge feat/commercial-readiness-green
   git push origin main
   ```
2. Trigger the production deployment in Vercel, or run:
   ```bash
   npm run deploy
   ```

---

## 4. Rollback Procedure (Emergency Recovery)

If any unexpected commercial issue arises post-deployment:

### Method 1: Instant Vercel Dashboard Rollback (Zero Downtime)
1. Open the [Vercel Deployments Dashboard](https://vercel.com/avani-agro-foods-latur/deployments).
2. Locate the previous stable production deployment (`dpl_3YdZBkUK5QnaL73z3CkWuHtx4n3K`, commit `425c503` or rollback baseline `b89ca6f`).
3. Click the three dots ($\dots$) $\rightarrow$ Select **Instant Rollback**.
4. The live site will revert to the previous build within 15 seconds.

### Method 2: Git Rollback via Terminal
```bash
# Revert to the stable rollback baseline commit
git checkout main
git reset --hard b89ca6f
git push origin main --force
```

### Method 3: DNS Rollback (if MX changes cause issue)
In Hostinger DNS Panel, add back:
- Type: `MX`, Host: `@`, Points to: `mx1.hostinger.com`, Priority: `5`, TTL: `3600`
- Type: `MX`, Host: `@`, Points to: `mx2.hostinger.com`, Priority: `10`, TTL: `3600`
