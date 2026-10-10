# AVANI AGRO FOODS — PHASE 3D ACCEPTANCE SOURCE RECONCILIATION
**Audit Date:** 2026-10-03  
**Auditor:** Antigravity 2.0 Autonomous Verification Engine  
**Execution Context:** Independent Source Verification & Conflict Reconciliation  

---

## 1. Material Historical Conflict Analysis & Grounded Evidence

### Conflict 1: Record ID 15 (All Good Agriculture Ltd) — Erroneous Registration Number
- **Historical Claim (Phase 3C):** Cited Companies House `#12711090` and named "Sam" without a surname.
- **Independent Audit Investigation:**
  - Companies House query for `#12711090` reveals company name **MCMGP LIMITED** (incorporated 2 July 2020; nature of business: 62020 - Information technology consultancy activities). This is an unrelated software entity.
  - Search on company name **ALL GOOD AGRICULTURE LTD** reveals active statutory registration **#16177606**, incorporated on **11 January 2025**.
  - Officers list shows sole active Director: **OYEWUSI, Samuel Adedoja** (appointed 11 January 2025).
  - Persons with significant control shows **Mr Samuel Adedoja Oyewusi** holding 75% or more of shares and voting rights.
  - Domain `allgoodmoringa.com` matches brand identity; Samuel Adedoja Oyewusi confirmed as Founder & Director.
- **Audit Decision:** **RESOLVED & ACCEPTED**. Erroneous number 12711090 expunged; authentic number 16177606 and full legal name established.

### Conflict 2: Record ID 17 (Dr Wakde Ltd) — Incorporation Date & Registered Postcode
- **Historical Claim (Phase 3C / Ingest):** Discrepancy between incorporation date 14 Jan 2011 vs 17 Jan 2011, and postcode WD23 4SB vs WD23 1AW.
- **Independent Audit Investigation:**
  - Companies House filing history for `#07493978` confirms certificate of incorporation issued on **17 January 2011**.
  - Authoritative registered office is **4 Woodpecker Close, Bushey, Hertfordshire, England, WD23 1AW**.
  - Officer register confirms **Dr. Nilesh Wakde** appointed Director on **17 January 2011**.
- **Audit Decision:** **RESOLVED & ACCEPTED**. 17 January 2011 and WD23 1AW established as authoritative statutory facts.

### Conflict 3: Record ID 1 (Schiff Foods Products Co.) — Legacy Address & Web Domain
- **Historical Claim:** Legacy database contained address `190 Shepherds Lane, Totowa, NJ` and domain `schifffoodproducts.com`.
- **Independent Audit Investigation:**
  - 190 Shepherds Lane was a former plant location. Authoritative corporate headquarters and milling facility is **994 Riverview Drive, Totowa, NJ 07512**.
  - Domain `schifffoodproducts.com` redirects or acts as legacy alias; current primary corporate domain is **`schifffood.com`**.
  - David Deutscher confirmed President via corporate alliance announcements.
- **Audit Decision:** **RESOLVED & ACCEPTED**. Current address and domain validated.

---

## 2. Contaminated Channel Purge Audit

| Record ID | Scraped / Historical Channel | Root Source of Contamination | Independent Audit Finding | Acceptance Disposition |
|:---:|:---|:---|:---|:---:|
| **29** | `team@latofonts.com` | Web font CSS attribution header (`@import url(fonts.googleapis.com)...`) for Lato font by Łukasz Dziedzic. | Completely unrelated to Allegiant Spice. Zero connection to spice sourcing. | **CONFIRMED CONTAMINATED — PURGED** |
| **27** | `adminwg@mail.mayfirst.org` | Mail server administrative listserv for May First / People Link (non-profit ISP hosting the co-op). | Server infrastructure committee, not food co-op purchasing desk. | **CONFIRMED CONTAMINATED — PURGED** |
| **21** | `ilovehotsauce@heatonist.com` | Retail consumer fan newsletter and customer submission inbox. | Automated fan marketing inbox. Replaced by authentic wholesale B2B channel `sales@heatonist.com`. | **CONFIRMED CONTAMINATED — PURGED** |
| **13** | `pr@arabicalondon.com` | Public relations and press enquiry desk. | Media / press intake. Replaced by authentic wholesale desk `shop@arabicalondon.com` / `hello@arabicalondon.com`. | **CONFIRMED CONTAMINATED — PURGED** |
| **4** | `italvitalherb@gmail.com` | Unauthenticated consumer webmail hosted on Gmail. | Violates commercial B2B anti-spam hygiene rules. No corporate domain email exists. | **CONFIRMED CONTAMINATED — PURGED** |

---

## 3. Contact Role Requalification Audit (Level 3 vs Level 0)

### Record ID 24: Jerry Tombokan (CM Spice Inc.)
- **Phase 3C Finding:** Assigned Level 3 based on ASTA (American Spice Trade Association) member directory listing.
- **Independent Audit Finding:**
  - Under rigorous audit rules, a secondary trade association directory cannot confer statutory executive status without primary statutory filings (e.g. Secretary of State annual reports) or official first-party corporate executive announcements.
  - Jerry Tombokan cannot be confirmed as a legal corporate officer with unilateral procurement authority.
- **Audit Decision:** **LEVEL 3 REJECTED -> DEMOTED TO LEVEL 0 (ROLE_NOT_VERIFIED)**.
- **Phase 3E Eligibility Re-evaluation:**
  - While named individual role is demoted, company identity is verified (Level 2) and official corporate domain channel `sales@cmspice.com` is verified first-party.
  - Under the dual-gate eligibility model, the record is **ELIGIBLE FOR PHASE 3E** via its generic corporate desk.

### Record ID 34: Behdad Yeganeh (Regency Foods Ltd)
- **Investigation:** Distinguish whether Behdad Yeganeh is merely a PSC/shareholder or active statutory Director.
- **Companies House Finding:** Behdad Yeganeh was appointed statutory **Director** on **17 August 1999** and has remained continuously active.
- **Audit Decision:** **LEVEL 3 CONFIRMED & ACCEPTED**.

### Record ID 27: 4th Street Food Co-op
- **Investigation:** Evaluate whether an executive role should be assigned.
- **Finding:** As a grassroots cooperative, governance is collective. The Dry Goods Committee manages bulk buying.
- **Audit Decision:** **LEVEL 0 ACCEPTED**. Phase 3E eligible via verified committee channel `drygoods@4thstreetfoodcoop.org`.
