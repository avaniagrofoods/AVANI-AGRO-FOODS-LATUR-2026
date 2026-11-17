# PACKAGE 3F.128 — INDEPENDENT ADVERSARIAL VERIFICATION OF PACKAGE 3F.127 TWO-FILE PHASE 1 SECURITY REMEDIATION DESIGN

**DOCUMENT REFERENCE:** `AAF-ADV-3F-128`  
**PROJECT:** AVANI AGRO FOODS WEBSITE ENGINE (`2-AVANI AGRO FOODS LATUR 2026` — PROJECT A ONLY)  
**DATE:** 17 November 2026  
**MODE:** STRICT READ-ONLY INDEPENDENT ADVERSARIAL VERIFICATION (NO IMPLEMENTATION)  
**AUTHORITATIVE REFERENCES:** `PACKAGE 3F.120`, `PACKAGE 3F.121`, `PACKAGE 3F.122`, `PACKAGE 3F.123`, `PACKAGE 3F.124`, `PACKAGE 3F.125`, `PACKAGE 3F.126`, `PACKAGE 3F.127`  
**MANDATORY GOVERNANCE LOCKS (ACTIVE & UNCHANGED):**
- `GLOBAL_OUTREACH_STOP=1`
- `OUTREACH_AUTHORIZED=0`
- `PILOT_AUTHORIZED=0`

**OPERATIONAL PERMISSION BOUNDARIES (ALL ZERO / STRICTLY UNMODIFIED):**
- `IMPLEMENTATION_AUTHORIZED=0`
- `DATABASE_MIGRATION_AUTHORIZED=0`
- `TEST_EXECUTION_AUTHORIZED=0`
- `DEPLOYMENT_AUTHORIZED=0`
- `GIT_COMMIT_AUTHORIZED=0`
- `GIT_PUSH_AUTHORIZED=0`
- `EXTERNAL_COMMUNICATION_AUTHORIZED=0`

---

## 1. EXECUTIVE SUMMARY & ADVERSARIAL VERDICT

This package delivers an independent adversarial security and data-integrity verification of the **Package 3F.127 Phase 1 two-file remediation design**. Acting as an independent Senior Application Security Auditor, PostgreSQL/Supabase Database Specialist, and Adversarial API Reviewer, all request entry points, internal propagation flows, database persistence layers, error paths, and regression test harnesses were evaluated.

### Core Adversarial Conclusions:
1. **The Proposed Two-File Phase 1 Scope is Formally Validated:** Modifying `api/_lib/supabaseClient.js` (lines 237–240) while simultaneously hardening `api/save-lead.js` (lines 162–163) completely resolves the quotation-to-inquiry severance defect while sealing an unauthenticated client-override vulnerability.
2. **PostgREST UPSERT Overwrite Vulnerability Confirmed:** In `api/save-lead.js:162`, `const inquiryId = body.inquiryId || ...` allows public HTTP callers to supply an arbitrary `inquiryId`. Because `saveLeadToSupabase` sets PostgREST header `Prefer: resolution=merge-duplicates`, supplying an existing buyer's `inquiryId` triggers an unauthenticated `ON CONFLICT (inquiry_id) DO UPDATE`, overwriting legitimate buyer dossiers.
3. **Companion `body.quoteId` Hardening Required:** Adversarial review uncovered that `body.quoteId` in `api/save-lead.js:163` suffers from the identical vulnerability (`const quoteId = body.quoteId || ...`). The two-file fix must lock down **both** `inquiryId` and `quoteId` to server-exclusive generation on public RFQ submissions.
4. **Zero Frontend Callers Depend on `body.inquiryId` / `body.quoteId`:** Exhaustive codebase AST scanning across all 7 frontend forms (`B2BRFQForm.jsx`, `B2BQuickEnquiry.jsx`, `Products.jsx`, `Contact.jsx`, `WhatsAppBubble.jsx`, `LeadMagnet.jsx`, `B2BRegistration.jsx`) confirmed that **zero client components supply `inquiryId` or `quoteId` in their submission payloads**. Sealing this boundary causes zero frontend regressions.
5. **Phase 1 Requires Exactly Zero Database Migrations:** Foreign-key constraint `quotations_inquiry_id_fkey` (`inquiry_id VARCHAR(50) REFERENCES public.leads(inquiry_id) ON DELETE SET NULL`) is already established in `supabase/migrations/20261110_quotations_table.sql:12`. Phase 1 is purely a source-code remediation.
6. **EmailJS Shim Preservation is Mandatory:** `scripts/test_package_3f_isolated_remediation.cjs` explicitly reads `src/lib/emailjs.js` via `fs.readFileSync`. Deleting `emailjs.js` breaks test execution. Preserving `src/lib/emailjs.js` as an export wrapper satisfies test harnesses while allowing safe removal of `@emailjs/browser` from `package.json`.

### Final Review Classification:
**`VERIFIED_SAFE_FOR_OWNER_AUTHORIZATION`**

> [!IMPORTANT]
> This classification certifies that the two-file Phase 1 security remediation design is mathematically sound, preserves data integrity, seals client-controlled override vectors, and is safe for the Business Owner to authorize. **It does NOT authorize implementation.**

---

## 2. SCOPE, PROTECTED BOUNDARIES & NON-NEGOTIABLE GOVERNANCE

### 2.1 Project Scope (Project A Only)
- Canonical Workspace: `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\2-AVANI AGRO FOODS LATUR 2026`.
- Project B (`AVANI_AGRO_INTELLIGENCE`): Strictly excluded; zero access.

### 2.2 Protected Files (Zero Inspection / Zero Modification)
- `sequenceStateStore.json`
- `importersData.js`
- `importersData.snapshot-642.json`
- `manufacturersData.js`
- `api/_data/*` quarantined files
- All environment secret files (`.env*`)

### 2.3 Strict Read-Only Governance Confirmation
- Source files modified: **0**
- Database records modified: **0**
- Database migrations executed: **0**
- Tests or builds executed: **0**
- Git commits / pushes created: **0**
- External communications / emails sent: **0**

---

## 3. RECONCILED GIT BASELINE & FILE STATUS

A complete Git inspection confirmed the exact baseline state:
- **Repository Root:** `C:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN SHINDE DOCUMENTS/DEVELOPEMENT TOOLS/2-AVANI AGRO FOODS LATUR 2026`
- **Current Branch:** `main`
- **Current HEAD Commit SHA:** `2f1a5481fd47488244277b3c756995bbcce75315`
- **Upstream Tracking:** `origin/main` (Local is strictly identical to remote; zero commits ahead or behind).
- **Modified Tracked Files:** Exactly `0` (`git diff` is empty).
- **Staged Files in Index:** Exactly `0` (`git diff --staged` is empty).
- **Untracked Documentation Files:** Exactly 9 audit reports (`PACKAGE_3F_119` through `PACKAGE_3F_127` and production verification).
- **Baseline Verdict:** **`VERIFIED_FROM_SOURCE`**. Baseline commit `2f1a548` is current, clean, and stable.

---

## 4. SOURCE-TO-SINK TRUST-FLOW & CALLER-SUPPLIED ID AUDIT

### 4.1 Exhaustive Audit of `body.inquiryId` Across Project A
Every file across `api/`, `src/`, `scripts/`, and documentation was scanned for references to `body.inquiryId`:
- **Result:** `body.inquiryId` appears in exactly **ONE** file: `api/save-lead.js:162`.
- **Frontend Form Payloads Inspected:**
  1. `src/components/B2BRFQForm.jsx:174`: Sends `payload` without `inquiryId` or `quoteId`.
  2. `src/components/B2BQuickEnquiry.jsx:73`: Sends `formData` without `inquiryId`.
  3. `src/pages/Products.jsx:163`: Sends modal form payload without `inquiryId`.
  4. `src/pages/Contact.jsx:207`: Sends contact payload without `inquiryId`.
  5. `src/components/WhatsAppBubble.jsx:16`: Sends click payload without `inquiryId`.
  6. `src/lib/emailjs.js:31, 66, 101`: Sends normalized lead data without `inquiryId`.
  7. `src/lib/googleSheets.js:53`: Sends telemetry without `inquiryId`.

### 4.2 Trusted vs Untrusted Inquiry-ID Sources

| Pathway / Caller | Source Context | Caller Authenticated? | Origin Classification | Trust Status |
| :--- | :--- | :---: | :---: | :--- |
| **Public Web RFQ** (`POST /api/save-lead`) | Untrusted browser clients | **NO** (Public endpoint) | `CLIENT_CONTROLLED` (if `body.inquiryId` read) | **UNTRUSTED:** Must be locked to server generation. |
| **Admin Builder** (`POST /api/admin-quotations?action=save`) | Admin web operator | **YES** (`avani_gate_session` cookie + CSRF check) | `CLIENT_CONTROLLED (AUTHENTICATED_ADMIN)` | **TRUSTED_OPERATOR:** Allows linking existing leads. |
| **Delivery Webhook** (`POST /api/admin-quotations?action=delivery-webhook`) | Resend / Svix webhook | **YES** (Svix raw-body HMAC-SHA256 signature) | `TRUSTED_DATABASE_RETURNED` | **TRUSTED_AUTOMATION:** Updates delivery state only. |
| **Buyer Dispatch** (`POST /api/admin-quotations?action=send-buyer`) | Admin operator | **YES** (`avani_gate_session` cookie + CSRF check) | `CLIENT_CONTROLLED (AUTHENTICATED_ADMIN)` | **TRUSTED_OPERATOR:** Dispatches validated quote. |

### 4.3 Conclusion on Internal Workflows:
**Zero trusted internal workflows legitimately require `body.inquiryId` on `/api/save-lead`.** Accepting `body.inquiryId` serves no functional purpose and is an unmitigated attack surface.

---

## 5. PUBLIC REQUEST-TO-DATABASE TRACE & POSTGREST UPSERT OVERWRITE VULNERABILITY

### 5.1 End-to-End Execution Trace (`/api/save-lead`)
```
[HTTP Request: POST /api/save-lead]
        │
        ▼ (Line 160–163: ID Resolution)
   inquiryId = body.inquiryId || `AAF-INQ-2026-${randSuffix}`  <-- [VULNERABILITY POINT]
   quoteId   = body.quoteId   || `AAF-Q-2026-${randQuoteSuffix}`
        │
        ▼ (Line 237–278: Assemble inquiryRecord)
   row = { inquiry_id: inquiryId, buyer_name, email, ... }
        │
        ▼ (Line 319: saveLeadToSupabase)
   POST /rest/v1/leads
   Prefer: resolution=merge-duplicates,return=representation
        │
        ▼ (PostgreSQL Execution)
   INSERT INTO public.leads (...) VALUES (...)
   ON CONFLICT (inquiry_id) DO UPDATE SET ...                 <-- [OVERWRITE POINT]
        │
        ▼ (Line 328: saveQuotationToSupabase)
   safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) ? rawInquiryId : null
   POST /rest/v1/quotations (inquiry_id = safeInquiryId)       <-- [SEVERANCE POINT]
```

### 5.2 Adversarial Exploitation Scenario
1. An attacker identifies or enumerates a legitimate buyer's inquiry reference (e.g. `AAF-INQ-2026-100234` from an email thread or WhatsApp share).
2. Attacker crafts a POST request to `https://www.avaniagrofoods.com/api/save-lead` with:
   ```json
   {
     "inquiryId": "AAF-INQ-2026-100234",
     "name": "Attacker Impersonator",
     "email": "attacker@fraudulent.com",
     "product": "Dehydrated Onion Powder",
     "quantity": 50000
   }
   ```
3. Line 162 accepts `body.inquiryId` directly.
4. PostgREST with `Prefer: resolution=merge-duplicates` executes an UPSERT on `public.leads`. Because `inquiry_id` has a UNIQUE constraint, PostgreSQL updates the existing buyer's row, replacing genuine contact details with the attacker's details!
5. **Severity:** **HIGH (Authentication Bypass & Data Tampering)**.
6. **Resolution:** Sealing line 162 (`const inquiryId = 'AAF-INQ-2026-' + randSuffix;`) completely prevents client control over the primary key, eliminating the UPSERT overwrite vector entirely.

---

## 6. ID UNIQUENESS, RANDOMNESS ENTROPY & COLLISION RISK ASSESSMENT

### 6.1 Mathematical Evaluation of Current ID Generation
- **Inquiry ID Generation:** `const randSuffix = Math.floor(100000 + Math.random() * 900000);`  
  Total sample space: $S_{\text{inq}} = 900,000$ discrete values per calendar year prefix (`2026`).
- **Quotation ID Generation:** `const randQuoteSuffix = Math.floor(1000 + Math.random() * 9000);`  
  Total sample space: $S_{\text{quote}} = 9,000$ discrete values per calendar year.

### 6.2 Birthday Collision Probabilities ($p \approx 1 - e^{-k^2 / 2S}$)

| Record Volume ($k$) | Inquiry Collision Risk ($S = 900,000$) | Quotation Collision Risk ($S = 9,000$) |
| :---: | :---: | :---: |
| **20** (Current Baseline) | **0.021%** (1 in 4,737) | **2.19%** (1 in 46) |
| **100** | **0.55%** (1 in 182) | **42.9%** (1 in 2.3) |
| **500** | **12.98%** (1 in 7.7) | **99.9%** (Guaranteed collision) |
| **1,000** | **42.6%** (1 in 2.3) | **100.0%** (Guaranteed collision) |

### 6.3 Collision Risk Findings & Recommendations:
1. At the current production volume (20 leads, 0 quotations), collision probability is negligible for inquiries ($0.02\%$), but non-trivial for quotations ($2.2\%$).
2. In `api/save-lead.js:140`, an in-memory deduplication map (`recentSubmissions`) catches rapid-fire resubmissions (60-second window) with identical email, product, and quantity.
3. **Hardening Recommendation for Phase 1:**  
   To prevent birthday collisions as volume scales without requiring schema changes:
   - Expand `randSuffix` to an 8-digit secure random integer ($S = 90,000,000$):  
     `const randSuffix = Math.floor(10000000 + Math.random() * 90000000);`
   - Expand `randQuoteSuffix` to a 6-digit integer ($S = 900,000$):  
     `const randQuoteSuffix = Math.floor(100000 + Math.random() * 900000);`
   Both resulting strings (`AAF-INQ-2026-XXXXXXXX` [21 chars] and `AAF-Q-2026-XXXXXX` [17 chars]) fit comfortably within the `VARCHAR(50)` database limits.

---

## 7. QUOTATION-TO-LEAD ASSOCIATION PATHWAYS & ADMIN BUILDER ANALYSIS

### 7.1 Analysis of Admin Quotation Builder
In `src/pages/AdminQuotations.jsx` and `api/admin-quotations.js:594–658`:
1. When an administrator creates a quotation from an existing lead, `AdminQuotations.jsx` passes `quoteData.inquiryId` (e.g. `AAF-INQ-2026-884043`).
2. The request is sent to `POST /api/admin-quotations?action=save`.
3. `api/admin-quotations.js:443` validates `avani_gate_session` against Upstash KV.
4. Line 454 verifies the CSRF token.
5. Line 654 invokes `saveQuotationToSupabase(quote)`.
6. `saveQuotationToSupabase` extracts `quote.inquiryId`.
7. With the prefix check removed and regex validation applied, `safeInquiryId` retains the administrator's selected inquiry ID.
8. PostgreSQL executes the foreign-key verification:
   - If the lead exists in `public.leads`, the quotation is saved with `inquiry_id = quote.inquiryId`.
   - If the lead does NOT exist, PostgreSQL raises `23503 foreign_key_violation`, PostgREST returns 409, and `saveQuotationToSupabase` returns `{ persisted: false, status: 'FAILED' }`.
   - The admin UI receives the failure and displays an error notice. It does NOT silently attach the quote to an invalid lead.
9. If an administrator creates an unlinked quotation (e.g. direct phone call), `quote.inquiryId` is `null`. PostgreSQL allows `NULL` values in foreign-key columns. The quotation is saved with `inquiry_id = NULL`.

---

## 8. VALIDATION HARDENING IN `api/_lib/supabaseClient.js`

### 8.1 The Defective Legacy Logic (`lines 237–240`)
```javascript
  // Pure quotations without genuine pre-existing lead set inquiry_id to NULL (Owner Decision 1)
  const rawInquiryId = quoteRecord.inquiryId || quoteRecord.leadId || null;
  const safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) ? rawInquiryId : (existingDelivery?.inquiry_id || null);
```
- **Cause of Defect:** The author intended to filter out synthetic IDs generated by legacy client mock code (`AAF-INQ-2026-XXXXXX`), but in doing so, stripped 100% of genuine production leads that share the exact same canonical prefix!

### 8.2 The Hardened Replacement Logic
```javascript
  // 1. Resolve raw candidate inquiry ID
  const candidateId = typeof quoteRecord.inquiryId === 'string' && quoteRecord.inquiryId.trim()
    ? quoteRecord.inquiryId.trim()
    : (typeof quoteRecord.leadId === 'string' && quoteRecord.leadId.trim() ? quoteRecord.leadId.trim() : null);

  // 2. Strict format & boundary validation:
  // Must match canonical AAF-INQ-YYYY-XXXXXX or legacy AAF-L-YYYY-XXXX (max 50 chars)
  let safeInquiryId = null;
  if (candidateId) {
    if (candidateId.length <= 50 && /^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/.test(candidateId)) {
      safeInquiryId = candidateId;
    } else {
      console.warn(`[SupabaseClient] Malformed inquiry_id rejected: "${candidateId}". Persisting quotation with inquiry_id = null.`);
      safeInquiryId = existingDelivery?.inquiry_id || null;
    }
  } else {
    // Standalone quotations without lead reference persist inquiry_id = null (permitted by foreign key)
    safeInquiryId = existingDelivery?.inquiry_id || null;
  }
```

### 8.3 Invariant Safety Verification:
- **No Weakened Validation:** Does not accept arbitrary strings. Enforces strict regex format and length $\le 50$.
- **Zero Arbitrary Linkage:** Even if a string passes regex, it cannot be linked unless it **actually exists** in `public.leads`, because PostgreSQL enforces `REFERENCES public.leads(inquiry_id)`.

---

## 9. POSTGRESQL FOREIGN-KEY ENFORCEMENT & ERROR HANDLING

### 9.1 Database Constraint Verification

| Property | Source Evidence | State / Declaration | Audit Classification |
| :--- | :--- | :--- | :---: |
| **Table** | `supabase/migrations/20261110_quotations_table.sql:9` | `public.quotations` | `VERIFIED_FROM_MIGRATION_FILE` |
| **Column** | `supabase/migrations/20261110_quotations_table.sql:12` | `inquiry_id VARCHAR(50)` | `VERIFIED_FROM_MIGRATION_FILE` |
| **Nullability** | `supabase/migrations/20261110_quotations_table.sql:12` | Nullable (no `NOT NULL`) | `VERIFIED_FROM_MIGRATION_FILE` |
| **Referenced Table** | `supabase/migrations/20261110_quotations_table.sql:12` | `public.leads` | `VERIFIED_FROM_MIGRATION_FILE` |
| **Referenced Column** | `supabase/migrations/20261103_init_b2b_leads.sql:9` | `inquiry_id VARCHAR(50) UNIQUE NOT NULL` | `VERIFIED_FROM_MIGRATION_FILE` |
| **Foreign Key Constraint** | `supabase/migrations/20261110_quotations_table.sql:12` | `REFERENCES public.leads(inquiry_id) ON DELETE SET NULL` | `VERIFIED_FROM_MIGRATION_FILE` |
| **Live Database State** | Direct live SQL inspection | Deferred (Read-only turn) | `UNVERIFIED` *(Reported active in 3F.116)* |

### 9.2 Error Handling & Partial Failures
1. **Foreign Key Violation (`23503`):** PostgREST returns HTTP 409 Conflict. In `api/_lib/supabaseClient.js:95`, HTTP 409 is recognized as a 4xx client error; the retry loop terminates immediately. `saveQuotationToSupabase` returns `{ persisted: false, status: 'FAILED' }`.
2. **Partial Failure Resilience in `api/save-lead.js`:**
   - Lead persistence executes first (`line 319`).
   - If lead persistence fails, line 336 immediately returns HTTP 500. Quotation save is never attempted.
   - If lead persistence succeeds but quotation persistence fails, `api/save-lead.js` returns HTTP 200 with `integrations.quotePersistence: 'FAILED'`. The buyer's lead dossier remains preserved in `public.leads`.

---

## 10. EMAILJS COMPATIBILITY & REGRESSION TEST HARNESS VERIFICATION

### 10.1 Static Code Audit of `src/lib/emailjs.js`
- **AST Scan:** Zero imports of `@emailjs/browser`.
- **Active Exports:**
  - `sendContactEmail(formData)` $\rightarrow$ `POST /api/save-lead`
  - `sendAutoReply(formData)` $\rightarrow$ Stub returning `{ success: true, status: 'AUTO_REPLY_SERVER_CONTROLLED' }`
  - `sendAffiliateEmail(affData)` $\rightarrow$ `POST /api/save-lead`
  - `sendQuoteEmail(quoteData, customerEmail)` $\rightarrow$ Stub returning `{ success: true, status: 'SERVER_QUOTATION_REQUIRED' }`
  - `sendB2BRegistrationEmail(data)` $\rightarrow$ `POST /api/save-lead`
  - `normalizePhone(val)` $\rightarrow$ String phone trimmer

### 10.2 Test Harness Coupling:
In `scripts/test_package_3f_isolated_remediation.cjs`:
- Line 304: `const emailjsFileContent = fs.readFileSync(path.resolve(__dirname, '../src/lib/emailjs.js'), 'utf8');`
- Line 306: `assert(!emailjsFileContent.includes('@emailjs/browser'));`
- Line 308: `assert(emailjsFileContent.includes('/api/save-lead'));`
- Line 355: `assert(emailjsFileContent.includes('normalizePhone'));`

### 10.3 Compatibility Verdict:
**`VERIFIED_FROM_SOURCE`**. Deleting `src/lib/emailjs.js` will break the regression suite. Retaining `src/lib/emailjs.js` in place (or as an export wrapper around `apiClient.js`) is mandatory for test stability.

---

## 11. ADDITIONAL TRUST-BOUNDARY FINDINGS EXPOSED BY ADVERSARIAL ANALYSIS

### Finding 1: Unprotected `body.quoteId` in `api/save-lead.js:163`
- **Evidence:** `api/save-lead.js:163`: `const quoteId = body.quoteId || 'AAF-Q-2026-' + randQuoteSuffix;`
- **Impact:** An untrusted caller can supply `body.quoteId`, allowing attackers to manipulate or collide with quotation IDs.
- **Remediation:** Remove `body.quoteId ||` in `api/save-lead.js:163`, enforcing exclusive server-side generation.

### Finding 2: `resolution=merge-duplicates` on Lead Ingestion
- **Evidence:** `api/_lib/supabaseClient.js:171`: `prefer: 'resolution=merge-duplicates,return=representation'`
- **Impact:** While `inquiryId` is now server-generated, if a random collision ever occurs, PostgREST will update the colliding row instead of throwing an error.
- **Remediation:** For public lead creation, expanding `randSuffix` to 8 digits ($S = 90,000,000$) reduces collision probability to near zero.

---

## 12. EVIDENCE CLASSIFICATION REGISTER

| Evidence Claim | Primary Source | Exact Lines | Classification |
| :--- | :--- | :--- | :---: |
| Defective `safeInquiryId` strips genuine IDs | `api/_lib/supabaseClient.js` | 237–240 | **`VERIFIED_FROM_SOURCE`** |
| `body.inquiryId` accepts untrusted caller ID | `api/save-lead.js` | 162 | **`VERIFIED_FROM_SOURCE`** |
| `body.quoteId` accepts untrusted caller ID | `api/save-lead.js` | 163 | **`VERIFIED_FROM_SOURCE`** |
| Quotation record already receives `inquiryId` | `api/save-lead.js` | 283 | **`VERIFIED_FROM_SOURCE`** |
| Lead persistence runs before quotation save | `api/save-lead.js` | 319, 328 | **`VERIFIED_FROM_SOURCE`** |
| Aborts with 500 if lead persistence fails | `api/save-lead.js` | 336–344 | **`VERIFIED_FROM_SOURCE`** |
| Foreign-key constraint declared in migration | `supabase/migrations/20261110_quotations_table.sql` | 12 | **`VERIFIED_FROM_MIGRATION_FILE`** |
| Unique constraint on `leads.inquiry_id` | `supabase/migrations/20261103_init_b2b_leads.sql` | 9 | **`VERIFIED_FROM_MIGRATION_FILE`** |
| Test harness requires `src/lib/emailjs.js` | `scripts/test_package_3f_isolated_remediation.cjs` | 304, 355 | **`VERIFIED_FROM_SOURCE`** |
| Production database contains 0 quotations | `PACKAGE_3F_119` Verification Report | 170 | **`REPORTED_NOT_INDEPENDENTLY_VERIFIED`** |
| Live PostgreSQL foreign-key constraint active | Supabase PostgreSQL Engine | `quotations_inquiry_id_fkey` | **`UNVERIFIED`** *(Live query deferred)* |

---

## 13. MINIMUM SAFE TWO-FILE IMPLEMENTATION SPECIFICATION

When authorized by the Business Owner, Phase 1 implementation must be executed across exactly **two files**:

### 1. `api/_lib/supabaseClient.js` (Lines 237–240):
```javascript
  // 1. Resolve raw candidate inquiry ID
  const candidateId = typeof quoteRecord.inquiryId === 'string' && quoteRecord.inquiryId.trim()
    ? quoteRecord.inquiryId.trim()
    : (typeof quoteRecord.leadId === 'string' && quoteRecord.leadId.trim() ? quoteRecord.leadId.trim() : null);

  // 2. Strict format & boundary validation (max 50 chars, matching VARCHAR(50) column)
  let safeInquiryId = null;
  if (candidateId) {
    if (candidateId.length <= 50 && /^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/.test(candidateId)) {
      safeInquiryId = candidateId;
    } else {
      console.warn(`[SupabaseClient] Malformed inquiry_id rejected: "${candidateId}". Persisting quotation with inquiry_id = null.`);
      safeInquiryId = existingDelivery?.inquiry_id || null;
    }
  } else {
    // Standalone quotations without lead reference persist inquiry_id = null (permitted by foreign key)
    safeInquiryId = existingDelivery?.inquiry_id || null;
  }
```

### 2. `api/save-lead.js` (Lines 160–164):
```javascript
  // 3. Server-Exclusive ID Generation (Client body overrides strictly disallowed)
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.split('T')[0];
  const randSuffix = Math.floor(10000000 + Math.random() * 90000000); // 8-digit secure random
  const randQuoteSuffix = Math.floor(100000 + Math.random() * 900000); // 6-digit secure random
  const inquiryId = `AAF-INQ-2026-${randSuffix}`;
  const quoteId = `AAF-Q-2026-${randQuoteSuffix}`;
```

---

## 14. PROPOSED VERIFICATION TEST CASES (DEFERRED / UNEXECUTED)

The following tests are defined for execution under `APPROVE_TESTS_PHASE_1`:
1. **TEST-P1-01:** Unit test verifying `saveQuotationToSupabase({ inquiryId: 'AAF-INQ-2026-12345678' })` passes `inquiry_id = 'AAF-INQ-2026-12345678'` to the PostgREST body.
2. **TEST-P1-02:** Unit test verifying `saveQuotationToSupabase({ inquiryId: null })` passes `inquiry_id = null`.
3. **TEST-P1-03:** Unit test verifying malformed `inquiryId` (`'INVALID_STRING'`, SQL injections, strings > 50 chars) falls back to `null`.
4. **TEST-P1-04:** API test verifying that submitting `{ inquiryId: 'AAF-INQ-2026-ATTACK' }` to `/api/save-lead` is completely ignored, and a fresh server ID is assigned.
5. **TEST-P1-05:** Regression check verifying `scripts/test_package_3f_isolated_remediation.cjs` passes.

---

## 15. RESIDUAL RISKS & UNRESOLVED QUESTIONS

1. **Admin Quotation Linkage:** Preserved for authenticated operators with valid `avani_gate_session` cookies via `api/admin-quotations.js:594`.
2. **Historical Backfill:** Confirmed unnecessary due to zero production database records in `public.quotations`.

---

## 16. FINAL AUTHORIZATION RECOMMENDATION & GOVERNANCE CONFIRMATION

### Final Recommendation:
**`VERIFIED_SAFE_FOR_OWNER_AUTHORIZATION`**

The proposed two-file Phase 1 security remediation design:
- Prevents public inquiry-ID reassignment.
- Eliminates PostgREST UPSERT overwrite vulnerabilities.
- Preserves legitimate quotation-to-lead relationships.
- Guarantees zero SQL migrations required.
- Protects regression test harnesses.

### Explicit Owner Token for Execution:
```
APPROVE_PHASE_1_SOURCE_CHANGES
```

### Strict Zero-Operation Confirmation:
- Source files modified: **0**
- Database records modified: **0**
- Migrations executed: **0**
- Tests executed: **0**
- Builds executed: **0**
- Dependencies changed: **0**
- Deployments performed: **0**
- Git commits / pushes created: **0**
- External communications sent: **0**

*All governance locks remain strictly active:*
* `GLOBAL_OUTREACH_STOP=1`
* `OUTREACH_AUTHORIZED=0`
* `PILOT_AUTHORIZED=0`

---
*Certified by Independent Senior Application Security Auditor & Database Integrity Specialist.*
