# MASTER AUTHORIZATION MATRIX
## AVANI AGRO FOODS: TWO-PROJECT PROGRAMME GOVERNANCE

**Author:** Multi-Project Programme Lead & Application Security Auditor  
**Date:** 2026-11-17  
**Reference:** Master Execution Prompt v2.1, Section 7 (Issue 4, Document 3)  
**Core Principle:** Explicit, independent unbundled authorization per activity and project. Zero automatic inheritance.

---

## 1. Project A Authorization Controls (`AVANI AGRO FOODS WEBSITE ENGINE`)

| Engineering Activity | Current Authorization Status | Required Owner Approval Scope | Mandatory Preconditions | Required Evidentiary Deliverable | Automatic Revocation Conditions |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Read-Only Inspection** | **AUTHORIZED** | Global Read-Only Audit Scope | Working tree path access | Forensic audit report | Working directory mutation detected |
| **Documentation Authoring** | **AUTHORIZED** | External Artifact Directory Only | Output outside project roots | Markdown audit documents | Any file written to Project A root |
| **Source Code Modification** | `UNAUTHORIZED (0)` | Explicit Owner Gate (e.g. Gate A3) | Pre-implementation diff & threat model | Exact `git diff` inspection report | Modifying files outside approved scope |
| **Test Execution** | `UNAUTHORIZED (0)` | Isolated Test Authorization Gate | Mocks & doubles only; no live DB | Test execution log with exit codes | Network calls to external APIs |
| **Dependency Installation** | `UNAUTHORIZED (0)` | Specific Package Approval | Security audit of package integrity | Updated `package.json` & lockfile | Package vulnerability or lockfile drift |
| **Database Migration** | `UNAUTHORIZED (0)` | Explicit Supabase Migration Gate | Backward compatibility & rollback SQL | Migration script & dry-run log | Destructive SQL (DROP/TRUNCATE) |
| **Git Commit** | `UNAUTHORIZED (0)` | Commit Authorization Gate | Verified unit tests; clean diff | Signed Git commit SHA | Unverified or unsigned commit |
| **Git Push** | `UNAUTHORIZED (0)` | Remote Push Authorization Gate | Passing CI build; owner signoff | Remote synchronization verification | Pushing to unapproved branch |
| **Live Deployment** | `UNAUTHORIZED (0)` | Production Cutover Gate | Full regression pass & staging verify | Vercel production deployment ID | Smoke test failure or HTTP 5xx errors |
| **External Communication** | `UNAUTHORIZED (0)` | Explicit Third-Party Gate | Sandboxed doubles or verified accounts | API transaction log | Data leakage or unverified endpoints |
| **Outreach Automation** | `UNAUTHORIZED (0)` | Pilot Authorization Signoff | Compliance with RFC 7208 & CAN-SPAM | Delivery audit log | `GLOBAL_OUTREACH_STOP=1` active |
| **Phase 3 Evolution** | `UNAUTHORIZED (0)` | Owner Programme Authorization | Completion of Phases A1–A8 | Phase 3 Architecture Signoff | Any unresolved P0 security blocker |

---

## 2. Project B Authorization Controls (`AVANI_AGRO_INTELLIGENCE`)

| Engineering Activity | Current Authorization Status | Required Owner Approval Scope | Mandatory Preconditions | Required Evidentiary Deliverable | Automatic Revocation Conditions |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Read-Only Inspection** | **AUTHORIZED** | Global Read-Only Audit Scope | Working tree path access | Architecture audit report | Working directory mutation detected |
| **Documentation Authoring** | **AUTHORIZED** | External Artifact Directory Only | Output outside project roots | Reconciled markdown reports | Any file written to Project B root |
| **Source Code Modification** | `UNAUTHORIZED (0)` | Explicit Owner Gate (e.g. Gate B3) | Detailed change specification | Exact unified diff | Scope creep or unverified edits |
| **Test Execution** | `UNAUTHORIZED (0)` | Local Isolated Test Gate | Python 3.14 local runtime; offline | `unittest` console output log | External network calls during tests |
| **Dependency Installation** | `UNAUTHORIZED (0)` | Python Package Approval | Standard library preference | Virtualenv manifest & SHA hashes | Unvetted PyPI dependencies |
| **Database Migration** | `UNAUTHORIZED (0)` | SQLite / Turso Migration Gate | SQLite WAL backup verification | Schema migration script & proof | Data corruption or lock contention |
| **Git Commit** | `UNAUTHORIZED (0)` | Commit Authorization Gate | 151/151 unit tests passing | Signed Git commit SHA | Unstaged files or broken tests |
| **Git Push** | `UNAUTHORIZED (0)` | Remote Push Authorization Gate | Local commit verification | GitHub repository sync verification | Remote divergence or force push |
| **Live Deployment** | `UNAUTHORIZED (0)` | Worker Cutover Gate | Background worker resilience proof | Systemd / Worker status log | Worker crash loop or memory leak |
| **External Communication** | `UNAUTHORIZED (0)` | CRM Sync Authorization Gate | Sandbox credentials (HubSpot/Sender) | Sync audit ledger | Disclosing unverified buyer data |
| **Outreach Automation** | `UNAUTHORIZED (0)` | Outbound Pilot Signoff | Strict CAN-SPAM/GDPR audit | Zero simulated sends counted as real | `GLOBAL_OUTREACH_STOP=1` active |
| **Phase 3 Evolution** | `UNAUTHORIZED (0)` | Owner Programme Authorization | Completion of Phases B1–B10 | Phase 3 Milestone Signoff | Rule DR-04 APMC anti-merge violation |

---

## 3. Governance Lock Preservation Directives

Under no circumstances shall any agent, script, or automated tool alter the core safety flags:
- `GLOBAL_OUTREACH_STOP=1` (Hard lock: all sequence dispatch redirected to simulation sandbox).
- `OUTREACH_AUTHORIZED=0` (Hard lock: zero transactional marketing emails dispatched).
- `PILOT_AUTHORIZED=0` (Hard lock: commercial outreach pilot inactive).
- `IMPLEMENTATION_AUTHORIZED=0` (Hard lock: zero source code edits permitted).
