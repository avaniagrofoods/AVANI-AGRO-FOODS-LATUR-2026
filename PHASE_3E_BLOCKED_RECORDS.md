# AVANI AGRO FOODS — PHASE 3E BLOCKED RECORDS AUDIT
**Audit Date:** 2026-10-03  
**Auditor:** Antigravity 2.0 Autonomous Verification Engine  
**Total Blocked Records:** 3 Records (Strictly Excluded from Pre-Flight Cohort)  

---

## 1. Blocked Records Registry

| Record ID | Company Name | Country | Primary Blocking Reason | Channel Status | Remediation Required Before Any Future Consideration |
|:---:|:---|:---:|:---|:---:|:---|
| **4** | Ital Vital Herbs | UK | **Consumer Webmail Rejection:** Storefront publishes only unauthenticated `italvitalherb@gmail.com`. Zero corporate domain emails exist. Violates B2B email hygiene. | `CHANNEL_REJECTED` | Must acquire and publish an authenticated domain email (e.g. `@italvitalherbs.co.uk`). |
| **7** | MAJID SPICE MILL LLC Branch | UAE | **Electronic Channel Missing:** Ingest record has `email: "Not Available"`. Site has no email. Pure physical retail/branch storefront. | `CHANNEL_MISSING` | Requires future voice verification desk to obtain authenticated procurement email. |
| **29** | Allegiant Spice | USA | **No Published Email / Webform Only:** Scraped address `team@latofonts.com` purged as CSS font template artifact. Website uses unaddressed webform. | `CHANNEL_MISSING` | Direct corporate procurement email must be discovered and validated. |

---

## 2. Hard Exclusion Rule
These 3 records are permanently blocked from any automated or direct outreach sequencing until the required remediation criteria are met.
