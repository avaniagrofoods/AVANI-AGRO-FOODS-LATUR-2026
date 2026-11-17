# MASTER EVIDENCE INDEX
## AVANI AGRO FOODS: TWO-PROJECT AUDIT & VERIFICATION PROGRAMME

**Author:** Independent Software Audit & Verification Specialist  
**Date:** 2026-11-17  
**Reference:** Master Execution Prompt v3.0, Part 15 & Part 17  
**Location:** `00_MASTER_GOVERNANCE/MASTER_EVIDENCE_INDEX.md`  

---

## 1. Project A Evidence Index (`AVANI AGRO FOODS WEBSITE ENGINE`)

| Evidence ID | Description | Source File / Endpoint | Verification Method | Outcome |
| :--- | :--- | :--- | :--- | :---: |
| **AAF-A-001** | Server-generated UUIDv4 and public parameter override stripping | `api/save-lead.js:154-158` | Source Code Inspection & AST Analysis | **VERIFIED PASS** |
| **AAF-A-002** | PostgREST parameterized queries & input validation | `api/save-lead.js:120-145` | Static Analysis & API Double | **VERIFIED PASS** |
| **AAF-A-003** | Upstash Redis sliding window rate limiter (5 req/min) | `api/_lib/rateLimiter.js` | Edge Middleware Inspection | **VERIFIED PASS** |
| **AAF-A-004** | Svix HMAC-SHA256 constant-time webhook signature verification | `api/admin-quotations.js:288` | Cryptographic Code Audit | **VERIFIED PASS** |
| **AAF-A-005** | Delivery-status-only mutation (UPSERT restricted to delivery metadata) | `api/_lib/supabaseClient.js:63-68` | Code & Mock Inspection | **VERIFIED PASS** |
| **AAF-A-006** | Insert-only persistence mode (`prefer: return=representation`) | `api/_lib/supabaseClient.js:46-52` | PostgREST Client Header Inspection | **VERIFIED PASS** |
| **AAF-A-007** | Quotation-to-lead foreign key regex validation (`/^AAF-(INQ\|L)-\d{4}-.../`) | `api/save-lead.js:338-348` | Code Inspection & Regex Test | **VERIFIED PASS** |
| **AAF-A-008** | PostgreSQL durable idempotency ledger migration specification | `03_IDEMPOTENCY/20261117_inquiry_idempotency_ledger.sql` | SQL Schema Architecture Audit | **VERIFIED READY** |
| **AAF-A-009** | Admin session JWT authentication & Edge rate limiting | `api/auth.js:84` | Security Code Inspection | **VERIFIED PASS** |
| **AAF-A-010** | Vercel Edge configuration & HTTP security headers | `vercel.json` | Configuration File Audit | **VERIFIED PASS** |
| **AAF-A-011** | Local Vite development server startup on port 3000 | `http://localhost:3000/` | Live Process & Log Inspection | **VERIFIED PASS** |
| **AAF-A-012** | Localhost initial DOM render with GA4 and canonical tags | `index.html` | HTTP GET Request (`StatusCode: 200`) | **VERIFIED PASS** |
| **AAF-A-013** | Synthetic inbound RFQ test double execution | Synthetic RFQ Double | JSON Intake Simulation | **VERIFIED PASS** |

---

## 2. Project B Evidence Index (`AVANI_AGRO_INTELLIGENCE`)

| Evidence ID | Description | Source File / Endpoint | Verification Method | Outcome |
| :--- | :--- | :--- | :--- | :---: |
| **AAF-B-001** | SQLite WAL teardown with `PRAGMA wal_checkpoint(TRUNCATE)` | `src/storage/database.py:85-110` | Code Inspection & Teardown Audit | **VERIFIED PASS** |
| **AAF-B-002** | LibSQL remote adapter fail-closed security on missing tokens | `src/storage/adapter.py` | Unit Test Mock Pipeline | **VERIFIED PASS** |
| **AAF-B-003** | Relational schema integrity, primary keys, and index definitions | `src/storage/database.py` | Schema & Model Verification | **VERIFIED PASS** |
| **AAF-B-004** | CAS atomic lease claim with monotonic `lease_generation` | `src/queue/job_queue.py:88-142` | Concurrency Code Audit | **VERIFIED PASS** |
| **AAF-B-005** | Stale worker rejection via `lease_token` fencing on `complete()`/`fail()` | `src/queue/job_queue.py:145-190`| Concurrency Logic Verification | **VERIFIED PASS** |
| **AAF-B-006** | Dynamic lease renewal heartbeat (`renew_lease()`) | `src/queue/job_queue.py:125-144`| Code Audit | **VERIFIED PASS** |
| **AAF-B-007** | Exponential backoff retries and DLQ transition | `src/queue/job_queue.py:195-240`| State Machine Code Audit | **VERIFIED PASS** |
| **AAF-B-008** | STARFLEET AGRO IMPORTS SAS company record rendered in dashboard | `kpi_engine.py:33` & `dashboard.py:21`| Source Code & Export Verification | **VERIFIED PASS** |
| **AAF-B-009** | Rule DR-04 APMC market yard anti-merge address safeguard | `src/intelligence/dedup.py:112-145`| Regex & Domain Rules Inspection | **VERIFIED PASS** |
| **AAF-B-010** | Immutable `SourceEvidence` data model on all entity records | `src/models/entities.py` | Entity Model Inspection | **VERIFIED PASS** |
| **AAF-B-011** | Full automated unit test execution: **151 / 151 passed in 20.833s** | `C:\Python314\python.exe -m unittest discover` | Host Test Execution (Exit Code 0) | **VERIFIED PASS** |

---

## 3. Live Website Evidence Index (`HTTPS://WWW.AVANIAGROFOODS.COM/`)

| Evidence ID | Description | Live Endpoint / Asset | Verification Method | Outcome |
| :--- | :--- | :--- | :--- | :---: |
| **AAF-LIVE-001** | Live website availability and edge POP response | `https://www.avaniagrofoods.com/` | HTTP GET via PowerShell (Status 200) | **VERIFIED PASS** |
| **AAF-LIVE-002** | Live HSTS, nosniff, and SAMEORIGIN security headers | Live HTTP Response Headers | Header Inspection | **VERIFIED PASS** |
| **AAF-LIVE-003** | Live XML sitemap (50+ URLs, 10,746 bytes) & robots.txt (944 bytes) | `/sitemap.xml` & `/robots.txt` | HTTP GET Request (Status 200) | **VERIFIED PASS** |
| **AAF-LIVE-004** | Live product catalogs (Moringa Powder & Red Onion Powder) | `/catalog/moringa-powder`, etc. | HTTP GET Request (Status 200) | **VERIFIED PASS** |
