# MASTER OWNER DECISION REGISTER
## AVANI AGRO FOODS: TWO-PROJECT PROGRAMME

**Author:** Multi-Project Programme Lead & Governance Specialist  
**Owner:** Sachin Shinde  
**Date:** 2026-11-17  
**Reference:** Master Execution Prompt v2.1, Section 7 (Issue 4, Document 2)  
**Strict Governance Directive:** Recommendations must never be converted into owner approvals without explicit recorded authorization.

---

## 1. Classification Hierarchy

To eliminate ambiguity across all historical and current decisions, every entry is strictly classified into one of the following tiers:
- **`OWNER DECISION`:** Direct business directive explicitly mandated by the business owner (Sachin Shinde).
- **`OWNER APPROVAL`:** Formal, recorded authorization permitting specific technical execution (e.g. Package 3F.133 Phase 1 source edits).
- **`ASSISTANT RECOMMENDATION`:** Technical, architectural, or security proposal submitted by the AI assistant for consideration.
- **`ANTIGRAVITY RECOMMENDATION`:** IDE/Agent harness architectural recommendation.
- **`IMPLEMENTATION EVIDENCE`:** Verified physical proof in source code, Git commits, or database migrations demonstrating execution.
- **`PENDING AUTHORIZATION`:** Proposed action awaiting separate, unbundled owner signoff.

---

## 2. Master Decision Register

| Decision ID | Project | Date | Classification | Original Owner Instruction / Proposed Action | Selected Option | Approval Status | Implementation Status | Evidence / Reference | Current Status | Outstanding Dependencies |
| :--- | :---: | :---: | :---: | :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| **DEC-001** | All | 2026-10-09 | `OWNER DECISION` | Immediate, complete freeze on all automated outbound email outreach and sequences. | `GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0` | **APPROVED** | **IMPLEMENTED** | `src/sequence/engine.py:42-55` & environment variables | `ACTIVE` | Permanent until explicit pilot signoff |
| **DEC-002** | Proj A | 2026-11-16 | `OWNER APPROVAL` | Authorize Phase 1 source remediation strictly in two files (`api/save-lead.js` and `api/_lib/supabaseClient.js`). | Two-File Remediation Design (Package 3F.130/3F.131) | **APPROVED** | **IMPLEMENTED** | Git working tree diff (+69/-17 lines) in Project A | `VERIFIED` | Uncommitted in working tree |
| **DEC-003** | Proj A | 2026-11-16 | `OWNER APPROVAL` | Authorize controlled local test execution for Phase 1 remediation using isolated doubles. | Package 3F.135 isolated test runner script | **APPROVED** | **IMPLEMENTED** | `run_package_3f_135_tests.cjs` (15 passed, 0 failed, 2 blocked) | `VERIFIED` | Phase 2 idempotency identified |
| **DEC-004** | Proj A | 2026-11-17 | `ASSISTANT RECOMMENDATION` | Eliminate cross-instance serverless duplicate lead creation via PostgreSQL-backed idempotency ledger table in Supabase. | Option A (Supabase Ledger Table) | `PENDING REVIEW` | `NOT IMPLEMENTED` | `PACKAGE_3F_136_REMEDIATION_PLAN.md` | `OPEN` | Requires Owner Authorization A3 & DB Migration Auth |
| **DEC-005** | Proj B | 2026-10-09 | `OWNER DECISION` | Prevent entity deduplication from merging distinct agricultural traders in shared APMC market yards. | Rule DR-04 APMC anti-merge address boundary rule | **APPROVED** | **IMPLEMENTED** | `src/intelligence/dedup.py:112-145` | `ACTIVE` | Preserved in all suites |
| **DEC-006** | Proj B | 2026-11-16 | `OWNER APPROVAL` | Complete baseline commit, fix Python Svix signature bug, add lease fencing, and author Package 3F.115 production deliverables. | Commits `79b57b2` and `b4baf6d` on `main` | **APPROVED** | **IMPLEMENTED** | Git commit log `6067997`; 151/151 unit tests passed | `VERIFIED` | Production Turso deployment pending |
| **DEC-007** | Both | 2026-11-17 | `OWNER DECISION` | Strictly prohibit monorepo merging, database consolidation, and shared credentials between Project A and Project B. | Complete Project Decoupling Architecture | **APPROVED** | **IMPLEMENTED** | Physical directory and repository isolation | `ACTIVE` | Non-negotiable boundary |
| **DEC-008** | Both | 2026-11-17 | `OWNER DECISION` | Master Execution Prompt v2.0 and v2.1: Establish read-only baseline audit and reconciliation before any implementation. | Read-Only Audit & Evidence Reconciliation | **APPROVED** | **IN PROGRESS** | Master planning deliverables in artifact storage | `ACTIVE` | Final report submission pending |
| **DEC-009** | Both | 2026-11-17 | `ANTIGRAVITY RECOMMENDATION` | Authorize creation of external documentation folder `C:\Users\ALPHA-1\Downloads\AVANI_IMPLEMENTATION_PROGRAMME`. | Initialize target documentation directory | `PENDING AUTHORIZATION`| `BLOCKED` | `DOCUMENTATION_LOCATION_AUDIT.md` | `BLOCKED` | Owner explicit authorization required |
