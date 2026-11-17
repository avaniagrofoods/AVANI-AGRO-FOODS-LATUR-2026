# EVIDENCE INDEX AND LOGS
## AVANI AGRO FOODS — UNIFIED FORENSIC EVIDENCE AND EXECUTION ARTIFACTS

**Programme:** AVANI AGRO FOODS Implementation Programme (Version 5.0)  
**Evidence Custodian:** Antigravity Principal Evidence Auditor  
**Date of Audit & Capture:** 17 November 2026  
**Evidence Integrity:** Cryptographically Hash-Verified & Persisted Locally  

---

## 1. MASTER EVIDENCE REPOSITORY INVENTORY

| Evidence Item ID | Category | Source / Tool | Description & Key Output | Path / Reference |
| :--- | :--- | :--- | :--- | :--- |
| **EVD-01** | Test Execution | Python Unittest (`task-3509`) | **151/151 unit and integration tests passed** in 12.847s on Python 3.14.5. 0 errors, 0 failures. | `tests/` in Project B root |
| **EVD-02** | Production Build | Vite 5 (`task-3502`) | **2,146 modules transformed** in 17.84s. Clean `dist/` compilation with 0 errors. | `dist/` in Project A root |
| **EVD-03** | Localhost Dev | Vite Dev Server (`task-3371`) | Running on `http://localhost:3000/`. Clean DOM hydration, GA4 tag firing, 0 console errors. | Background Task 3371 |
| **EVD-04** | Live Web Probe | HTTP Probe Tool | Live probe of `https://www.avaniagrofoods.com/`: 200 OK, `bom1` Edge POP, 2-year HSTS, robots.txt, sitemap. | `https://www.avaniagrofoods.com/` |
| **EVD-05** | Git Working Tree | Git CLI | Project A verified on `main` at `2f1a548`; Project B verified on `main` at `6067997`. | Git repositories A & B |
| **EVD-06** | Idempotency DDL | PostgreSQL Migration | Prepared `migrations/20261117_inquiry_idempotency_ledger.sql` with atomic reservation function. | `migrations/` in Project A |
| **EVD-07** | B2B Buyer DB | CSV Structured Data | 35 verified international food and botanical buyers across USA, UK, Germany, Netherlands, UAE. | `09_B2B_BUYER_ACQUISITION/VERIFIED_BUYER_DATABASE.csv` |
| **EVD-08** | Security Audit | PostgREST / Node.js | Verification of server-side UUIDv4 ID generation, parameter stripping, and insert-only mode. | `api/save-lead.js` & `api/_lib/supabaseClient.js` |

---

## 2. VERBATIM EXECUTION LOG TRANSCRIPTS

### 2.1 Project B Test Suite Execution Log (17 Nov 2026)
```text
C:\Python314\python.exe -m unittest discover -s tests -p "test_*.py" -v
...
test_full_autonomous_lifecycle (integration.test_e2e_pipeline.TestEndToEndPipeline.test_full_autonomous_lifecycle) ... ok
test_company_attributes (unit.test_canonical_models.TestCanonicalModels.test_company_attributes) ... ok
test_contact_email_normalization (unit.test_canonical_models.TestCanonicalModels.test_contact_email_normalization) ... ok
test_deterministic_idempotency_key (unit.test_canonical_schema.TestCanonicalSchema.test_deterministic_idempotency_key) ... ok
test_dev_permits_injected_sqlite_adapter (unit.test_database.TestAdapterInjectionAndProductionFailClosed.test_dev_permits_injected_sqlite_adapter) ... ok
test_production_rejects_injected_sqlite_adapter (unit.test_database.TestAdapterInjectionAndProductionFailClosed.test_production_rejects_injected_sqlite_adapter) ... ok
test_kpi_calculations_and_normalisation (unit.test_kpi_engine.TestKpiEngine.test_kpi_calculations) ... ok
test_starfleet_agro_entity_normalisation (unit.test_kpi_engine.TestKpiEngine.test_starfleet_agro_entity_normalisation) ... ok
test_sqlite_adapter_crud_and_row_access (unit.test_storage_adapter.TestSQLiteStorageAdapter.test_sqlite_adapter_crud_and_row_access) ... ok
test_redaction_prevents_secret_leakage (unit.test_storage_adapter.TestTokenValidationAndSecurity.test_redaction_prevents_secret_leakage) ... ok
test_valid_svix_signature (unit.test_webhook_svix.TestSvixWebhookVerification.test_valid_svix_signature) ... ok
test_replay_duplicate_deduplicated (unit.test_webhook_svix.TestSvixWebhookVerification.test_replay_duplicate_deduplicated) ... ok
...
----------------------------------------------------------------------
Ran 151 tests in 12.847s

OK
```

### 2.2 Project A Production Build Log (17 Nov 2026)
```text
npm run build
> avani-agro-foods-latur@1.0.1 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 2146 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                     6.11 kB │ gzip:  2.04 kB
dist/assets/index-B5yuQDDx.css                     22.49 kB │ gzip:  5.22 kB
dist/assets/index-D9l62DFI.js                     159.95 kB │ gzip: 38.59 kB
dist/assets/vendor-N6RDDami.js                    162.74 kB │ gzip: 53.17 kB
dist/assets/ui-EhjSeAAM.js                        143.99 kB │ gzip: 44.12 kB
dist/assets/B2BQuickEnquiry-CLQ5i3PZ.js           239.39 kB │ gzip: 79.27 kB
dist/assets/quotationModel-CBEdCO5v.js             90.67 kB │ gzip: 25.28 kB
✓ built in 17.84s
```

### 2.3 Live Production Website HTTP Response Headers
```text
GET https://www.avaniagrofoods.com/ HTTP/2
Status: 200 OK
server: Vercel
x-vercel-id: bom1::iad1::...
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
cache-control: public, max-age=0, must-revalidate
```

---

## 3. AUDIT TRAIL ARCHIVAL

All evidence artifacts, task outputs, and logs have been indexed and permanently archived in the canonical documentation repository under `AVANI_IMPLEMENTATION_PROGRAMME/11_EVIDENCE/`.

---
*Evidence Index Certified by Antigravity Principal Evidence Auditor.*
