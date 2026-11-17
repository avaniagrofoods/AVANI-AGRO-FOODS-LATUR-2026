# GIT AND DEPLOYMENT EVIDENCE REPORT
## INDEPENDENT REPOSITORY AUDIT, WORKING TREE INSPECTION, AND DEPLOYMENT PROVENANCE

**Audit Date:** 17 November 2026  
**Auditor:** DevOps & Release Management Auditor  
**Repositories Inspected:**
1. **Project A:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`
2. **Project B:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\AVANI_AGRO_INTELLIGENCE`

---

## 1. PROJECT A GIT BASELINE & WORKING-TREE AUDIT

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
	modified:   RFQ_FAILURE_TEST_RESULTS.json
	modified:   api/_lib/supabaseClient.js
	modified:   api/save-lead.js

Untracked files:
	AVANI_IMPLEMENTATION_PROGRAMME/
	migrations/
```

### Detailed Git Metadata:
- **Repository Remote:** `https://github.com/avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026.git`
- **Active Branch:** `main`
- **Current HEAD Commit:** `2f1a5481fd47488244277b3c756995bbcce75315`
- **Commit Message:** `docs(audits): add Package 3F.118A Upstash connection, credential rotation and GitHub reconciliation report`
- **Commit Timestamp:** `2026-11-16 21:52:34 +0530`
- **Working Tree State:** **DIRTY (MODIFICATIONS UNCOMMITTED)**
  1. `api/save-lead.js`: Phase 1 hardening (CSPRNG UUIDv4 generation, parameter override stripping).
  2. `api/_lib/supabaseClient.js`: PostgREST `prefer: return=representation` insert-only mode.
  3. `migrations/20261117_inquiry_idempotency_ledger.sql`: DDL for idempotency ledger (Untracked).
  4. `AVANI_IMPLEMENTATION_PROGRAMME/`: Canonical documentation structure (Untracked).
- **Release Tags:**
  * `checkpoint_quotation_rebuild_verified_20260929`
  * `p4.5-production-verified`
  * `rollback_point_pre_quotation_engine_20260929`

> [!CRITICAL]
> **Key Finding:** The Phase 1 source code improvements in `api/save-lead.js` and `api/_lib/supabaseClient.js` have NOT yet been committed to Git or pushed to GitHub `origin/main`. Consequently, the live Vercel production deployment is running commit `2f1a5481fd47488244277b3c756995bbcce75315` without these local changes!

---

## 2. PROJECT B GIT BASELINE & WORKING-TREE AUDIT

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

### Detailed Git Metadata:
- **Repository Remote:** `https://github.com/avaniagrofoods/AVANI-AGRO-INTELLIGENCE.git`
- **Active Branch:** `main`
- **Current HEAD Commit:** `6067997bdac57abb92e018b94847a2b0cfeba0de`
- **Commit Message:** `docs(audits): synchronize Package 3F.117 and 3F.118A production reports`
- **Commit Timestamp:** `2026-11-16 21:53:08 +0530`
- **Working Tree State:** **CLEAN (100% COMMITTED AND SYNCHRONIZED)**
- **Remote Push Status:** Local `main` is identical to `origin/main`.
- **Release Tags:** None.

---

## 3. COMPARATIVE REPOSITORY SUMMARY

| Dimension | Project A (Website Engine) | Project B (Agro Intelligence) |
| :--- | :--- | :--- |
| **Active Branch** | `main` | `main` |
| **Local HEAD** | `2f1a548` | `6067997` |
| **Remote HEAD** | `2f1a548` | `6067997` |
| **Uncommitted Changes** | **YES (save-lead.js, supabaseClient.js)** | **NO (Clean working tree)** |
| **Untracked Additions** | `migrations/`, `AVANI_IMPLEMENTATION_PROGRAMME/` | None |
| **Production Sync Status** | **PENDING STAGING, COMMIT & PUSH** | **FULLY SYNCHRONIZED** |

---
*Report Certified by DevOps & Release Management Auditor.*
