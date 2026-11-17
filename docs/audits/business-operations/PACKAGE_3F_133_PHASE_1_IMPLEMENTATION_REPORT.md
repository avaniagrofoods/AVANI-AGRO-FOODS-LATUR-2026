# PACKAGE 3F.133 — PHASE 1 SOURCE IMPLEMENTATION REPORT: ID GENERATION SECURITY, INSERT-ONLY ENFORCEMENT & QUOTATION RELATIONSHIP RESTORATION

**Project:** AVANI AGRO FOODS Website Engine (Project A Only)  
**Author:** Principal Application Security Architect, Senior Node.js Backend Engineer, PostgreSQL/Supabase Specialist  
**Authorization Reference:** Owner Authorization Package 3F.133 (`IMPLEMENTATION_AUTHORIZED=PHASE_1_TWO_FILES_ONLY`)  
**Canonical Git Baseline:** Commit `2f1a5481fd47488244277b3c756995bbcce75315` on branch `main`  
**Execution Timestamp:** 17 November 2026  
**Implementation Status:** COMPLETED (STRICTLY WITHIN AUTHORIZED TWO-FILE BOUNDARY)  
**Target Delivery Path:** `docs/audits/business-operations/PACKAGE_3F_133_PHASE_1_IMPLEMENTATION_REPORT.md`

---

## 1. Executive Summary & Change Scope

Pursuant to explicit Owner Authorization Package 3F.133, Phase 1 source implementation was executed strictly within the authorized two-file boundary:

1. `api/save-lead.js`
2. `api/_lib/supabaseClient.js`

### Primary Objectives Achieved:
1. **Elimination of Public ID Manipulation:** Public request body parameters `body.inquiryId` and `body.quoteId` are discarded. All IDs are server-generated using native CSPRNG UUIDv4 (`crypto.randomUUID()`) with dynamic UTC year partitioning.
2. **Elimination of Silent Lead Overwriting:** Public lead ingestion enforces strict **INSERT-ONLY** persistence (`Prefer: return=representation`). The PostgREST UPSERT directive (`resolution=merge-duplicates`) has been removed from all public ingestion paths, preventing attacker-driven hijacking or accidental collision overwrites.
3. **Restoration of Quotation-to-Lead Relational Linkage:** The erroneous prefix condition in `saveQuotationToSupabase` (`!rawInquiryId.startsWith('AAF-INQ-2026-')`) that actively nullified legitimate inquiry IDs was replaced with format validation regex `/^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/`. Newly generated quotations now preserve their foreign key reference to `public.leads(inquiry_id)`.
4. **Preservation of Resend Webhook Delivery Updates:** `saveQuotationToSupabase` now supports caller-differentiated options (`insertOnly: true` for public requests vs. authorized update semantics when `existingDelivery` is present), preventing regression of Svix-verified Resend delivery webhooks at `api/admin-quotations.js:288`.
5. **Bounded Collision Retry:** In the theoretical event of a `23505` unique constraint collision on `inquiry_id` ($p < 10^{-28}$), the server catches the error, generates a fresh UUIDv4, and retries once (maximum 2 attempts). Unrelated `23505` errors, foreign key violations (`23503`), and network timeouts fail closed without retry.

---

## 2. Exact Files and Functions Modified

| File Path | Function Modified | Line Reference | Modification Description |
| :--- | :--- | :--- | :--- |
| `api/save-lead.js` | Top-level imports | Line 12 | Added `import crypto from 'crypto';` |
| `api/save-lead.js` | Handler Step 3 (ID Generation) | Lines 158–166 | Removed `body.inquiryId` and `body.quoteId` fallback to low-entropy `Math.random()`. Enforced server-generated UUIDv4 with dynamic UTC year. |
| `api/save-lead.js` | Handler Step 8 (Supabase Persistence) | Lines 320–346 | Added bounded collision retry and explicit `{ insertOnly: true }` parameter to `saveLeadToSupabase`. |
| `api/save-lead.js` | Handler Step 8 (Quotation Persistence) | Lines 348–374 | Added bounded collision retry and explicit `{ insertOnly: true }` parameter to `saveQuotationToSupabase`. |
| `api/_lib/supabaseClient.js` | `saveLeadToSupabase()` | Lines 118, 168–172 | Added `options = {}` parameter; enforced insert-only (`prefer: 'return=representation'`) when `upsert !== true` or `insertOnly === true`. |
| `api/_lib/supabaseClient.js` | `saveLeadToSupabase()` | Lines 203–210 | Added structured conflict error parsing (`code: '23505'`) on unique constraint violations. |
| `api/_lib/supabaseClient.js` | `saveQuotationToSupabase()` | Lines 218, 242–244 | Added `options = {}` parameter; replaced broken prefix check with regex `/^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/` (length $\le 50$). |
| `api/_lib/supabaseClient.js` | `saveQuotationToSupabase()` | Lines 282–286 | Enforced `prefer: 'return=representation'` when `options.insertOnly === true`, while allowing authorized UPSERT for webhook delivery updates. |
| `api/_lib/supabaseClient.js` | `saveQuotationToSupabase()` | Lines 301–308 | Added structured error code extraction for unique conflicts (`23505`) and foreign key violations (`23503`). |

---

## 3. Before and After Behavior Analysis

### 3.1 Public Lead ID Generation
- **Before:**
  ```javascript
  const randSuffix = Math.floor(100000 + Math.random() * 900000);
  const randQuoteSuffix = Math.floor(1000 + Math.random() * 9000);
  const inquiryId = body.inquiryId || `AAF-INQ-2026-${randSuffix}`;
  const quoteId = body.quoteId || `AAF-Q-2026-${randQuoteSuffix}`;
  ```
  *Defect:* Unauthenticated callers could inject existing `inquiryId` to hijack leads; $S = 900,000$ produced a 42.6% collision rate at 1,000 inquiries; hardcoded year literal.
- **After:**
  ```javascript
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const timestamp = now.toISOString();
  const dateStr = timestamp.split('T')[0];
  let inquiryId = `AAF-INQ-${currentYear}-${crypto.randomUUID()}`;
  let quoteId = `AAF-Q-${currentYear}-${crypto.randomUUID()}`;
  ```
  *Improvement:* Caller overrides are ignored; 122 bits of cryptographic entropy ($S \approx 5.3 \times 10^{36}$) reduces collision risk to $< 10^{-28}\%$; year is dynamically evaluated.

### 3.2 Lead Persistence Mode
- **Before:**
  ```javascript
  const result = await supabaseFetch('leads', {
    method: 'POST',
    body: row,
    prefer: 'resolution=merge-duplicates,return=representation'
  });
  ```
  *Defect:* PostgREST translated to `ON CONFLICT (inquiry_id) DO UPDATE`, silently overwriting existing buyer leads on collision or injection.
- **After:**
  ```javascript
  const allowUpsert = options.upsert === true && options.insertOnly !== true;
  const result = await supabaseFetch('leads', {
    method: 'POST',
    body: row,
    prefer: allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
  });
  ```
  *Improvement:* Default is strictly **INSERT-ONLY**. When `/api/save-lead` calls with `{ insertOnly: true }`, any duplicate key triggers a rejection (HTTP 409 / PostgreSQL `23505`) and can never overwrite existing records.

### 3.3 Quotation-to-Lead Relational Linkage
- **Before:**
  ```javascript
  const rawInquiryId = quoteRecord.inquiryId || quoteRecord.leadId || null;
  const safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) ? rawInquiryId : (existingDelivery?.inquiry_id || null);
  ```
  *Defect:* Condition evaluated to `false` for every genuine new inquiry ID (which starts with `AAF-INQ-2026-`), forcing `safeInquiryId = null` and breaking 100% of quotation foreign keys.
- **After:**
  ```javascript
  const rawInquiryId = typeof quoteRecord.inquiryId === 'string' ? quoteRecord.inquiryId.trim() : (quoteRecord.leadId || null);
  const isValidInquiryId = Boolean(rawInquiryId && /^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/.test(rawInquiryId) && rawInquiryId.length <= 50);
  const safeInquiryId = isValidInquiryId ? rawInquiryId : (existingDelivery?.inquiry_id || null);
  ```
  *Improvement:* Accepts genuine `AAF-INQ-YYYY-<UUID>` IDs, legacy `AAF-INQ-2026-XXXXXX` IDs, and `AAF-L-YYYY-XXXX` IDs, while rejecting malformed inputs and safely linking quotations to leads.

---

## 4. Webhook Compatibility Preservation

In accordance with Section 3 of Package 3F.131 and Package 3F.132:
- The Resend delivery webhook handler at `api/admin-quotations.js:288` calls `saveQuotationToSupabase(updated)` on existing quotations.
- In `saveQuotationToSupabase`, line 282 implements:
  ```javascript
  const isInsertOnly = options.insertOnly === true;
  const allowUpsert = !isInsertOnly && (options.upsert === true || Boolean(existingDelivery));
  const preferHeader = allowUpsert
    ? 'resolution=merge-duplicates,return=representation'
    : 'return=representation';
  ```
- Because the webhook handler does NOT pass `{ insertOnly: true }` and `existingDelivery` is resolved from Supabase (the quotation already exists), `allowUpsert` evaluates to `true`.
- **Result:** Delivery status webhooks continue to update delivery metadata without regressing or encountering `23505` conflict errors.

---

## 5. Error-Handling and Bounded Retry Architecture

1. **Inquiry ID Unique Collision (`23505` on `inquiry_id`):**
   - The loop checks `sLead.code === '23505'` and error details containing `inquiry_id` or `leads_inquiry_id_key`.
   - The server regenerates a fresh UUIDv4, updates `inquiryRecord.inquiryId` and `quotationRecord.inquiryId`, and retries the insert. Bounded to a maximum of 2 attempts.
2. **Quotation ID Unique Collision (`23505` on `quotation_id`):**
   - The loop checks `sQuote.code === '23505'` and error details containing `quotation_id`.
   - Regenerates fresh UUIDv4 for quote and retries. Bounded to a maximum of 2 attempts.
3. **Unrelated `23505` or Foreign Key `23503` Violations:**
   - Fails immediately without retry.
4. **Network Timeout / Persistence Failure:**
   - Clears in-memory deduplication cache slot (`recentSubmissions.delete(dedupKey)`).
   - Returns HTTP 500 fail-closed error with explicit coordinator contact information.

---

## 6. Deviations from Package 3F.132

**Zero Deviations.** All modifications adhere 100% to the exact technical specification approved in Package 3F.132.

---

## 7. Complete Git Diff Summary

```diff
diff --git a/api/_lib/supabaseClient.js b/api/_lib/supabaseClient.js
index 96bfac0..a4066ad 100644
--- a/api/_lib/supabaseClient.js
+++ b/api/_lib/supabaseClient.js
@@ -115,7 +115,7 @@ async function supabaseFetch(endpoint, options = {}, retries = 2) {
 /**
  * Save a canonical Lead record into the primary Supabase database
  */
-export async function saveLeadToSupabase(leadRecord) {
+export async function saveLeadToSupabase(leadRecord, options = {}) {
   if (!isSupabaseConfigured()) {
     return {
       persisted: false,
@@ -165,10 +165,11 @@ export async function saveLeadToSupabase(leadRecord) {
     raw_payload: leadRecord
   };
 
+  const allowUpsert = options.upsert === true && options.insertOnly !== true;
   const result = await supabaseFetch('leads', {
     method: 'POST',
     body: row,
-    prefer: 'resolution=merge-duplicates,return=representation'
+    prefer: allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
   });
 
   if (result.success) {
@@ -200,9 +201,12 @@ export async function saveLeadToSupabase(leadRecord) {
   }
 
   console.error('[Supabase Client] Failed to persist lead:', result.error);
+  const isConflict = String(result.error || '').includes('23505');
+  const code = isConflict ? '23505' : (result.status || 'ERROR');
   return {
     persisted: false,
-    status: 'PERSISTENCE_FAILED',
+    status: isConflict ? 'CONFLICT' : 'PERSISTENCE_FAILED',
+    code,
     error: result.error,
     inquiryId: leadRecord.inquiryId
   };
@@ -211,7 +215,7 @@ export async function saveLeadToSupabase(leadRecord) {
 /**
  * Save an export quotation record to Supabase
  */
-export async function saveQuotationToSupabase(quoteRecord) {
+export async function saveQuotationToSupabase(quoteRecord, options = {}) {
   if (!isSupabaseConfigured()) {
     return {
       persisted: false,
@@ -235,8 +239,9 @@ export async function saveQuotationToSupabase(quoteRecord) {
   }
 
   // Pure quotations without genuine pre-existing lead set inquiry_id to NULL (Owner Decision 1)
-  const rawInquiryId = quoteRecord.inquiryId || quoteRecord.leadId || null;
-  const safeInquiryId = (rawInquiryId && !rawInquiryId.startsWith('AAF-INQ-2026-')) ? rawInquiryId : (existingDelivery?.inquiry_id || null);
+  const rawInquiryId = typeof quoteRecord.inquiryId === 'string' ? quoteRecord.inquiryId.trim() : (quoteRecord.leadId || null);
+  const isValidInquiryId = Boolean(rawInquiryId && /^AAF-(INQ|L)-\d{4}-[A-Za-z0-9-]+$/.test(rawInquiryId) && rawInquiryId.length <= 50);
+  const safeInquiryId = isValidInquiryId ? rawInquiryId : (existingDelivery?.inquiry_id || null);
 
   const row = {
     quotation_id: qId,
@@ -274,10 +279,12 @@ export async function saveQuotationToSupabase(quoteRecord) {
     updated_by: quoteRecord.updatedBy || 'authenticated_operator'
   };
 
+  const isInsertOnly = options.insertOnly === true;
+  const allowUpsert = !isInsertOnly && (options.upsert === true || Boolean(existingDelivery));
   const result = await supabaseFetch('quotations', {
     method: 'POST',
     body: row,
-    prefer: 'resolution=merge-duplicates,return=representation'
+    prefer: allowUpsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
   });
 
   if (result.success) {
@@ -291,9 +298,14 @@ export async function saveQuotationToSupabase(quoteRecord) {
     }).catch(() => {});
   }
 
+  const isConflict = String(result.error || '').includes('23505');
+  const isFkViolation = String(result.error || '').includes('23503');
+  const code = isConflict ? '23505' : (isFkViolation ? '23503' : (result.status || 'ERROR'));
+
   return {
     persisted: result.success,
-    status: result.success ? 'SUCCESS' : 'FAILED',
+    status: result.success ? 'SUCCESS' : (isConflict ? 'CONFLICT' : (isFkViolation ? 'FK_VIOLATION' : 'FAILED')),
+    code,
     error: result.error || null,
     quoteId: row.quotation_id,
     record: result.data?.[0] || row
diff --git a/api/save-lead.js b/api/save-lead.js
index ce7615b..e8e6221 100644
--- a/api/save-lead.js
+++ b/api/save-lead.js
@@ -9,6 +9,7 @@
 // 6. External integrations (Zapier, HubSpot, WhatsApp Picky Assist)
 // ============================================================
 
+import crypto from 'crypto';
 import { calculateQuotation, parseQuantityKg, COMPANY_INFO } from './_lib/quotationEngine.js';
 import { matchProductMaster } from './_lib/productMaster.js';
 import { getClientIp, checkRateLimit, isAllowedOrigin } from './_lib/auth.js';
@@ -154,13 +155,15 @@ export default async function handler(req, res) {
       });
     }
 
-    // 3. ID Generation
+    // 3. ID Generation (CSPRNG UUIDv4, Dynamic UTC Year, Strictly Server-Enforced)
     const timestamp = new Date().toISOString();
     const dateStr = timestamp.split('T')[0];
-    const randSuffix = Math.floor(100000 + Math.random() * 900000);
-    const randQuoteSuffix = Math.floor(1000 + Math.random() * 9000);
-    const inquiryId = body.inquiryId || `AAF-INQ-2026-${randSuffix}`;
-    const quoteId = body.quoteId || `AAF-Q-2026-${randQuoteSuffix}`;
+
+
+    const now = new Date();
+    const currentYear = now.getUTCFullYear();
+    let inquiryId = `AAF-INQ-${currentYear}-${crypto.randomUUID()}`;
+    let quoteId = `AAF-Q-${currentYear}-${crypto.randomUUID()}`;
 
     // 4. Normalized Quantity & Product Matching
     const normalizedQuantity = parseQuantityKg(rawQuantity, rawRequirement);
@@ -316,8 +319,26 @@ export default async function handler(req, res) {
 
     if (isSupabaseConfigured()) {
       try {
-        const sLead = await saveLeadToSupabase(inquiryRecord);
-        supabaseLeadPersistence = sLead.persisted ? 'SUCCESS' : 'FAILED';
+        let attempts = 0;
+        let sLead = null;
+        while (attempts < 2) {
+          attempts++;
+          sLead = await saveLeadToSupabase(inquiryRecord, { insertOnly: true });
+          if (sLead.persisted) {
+            break;
+          }
+          const errDetail = String(sLead.error || '');
+          if (sLead.code === '23505' && (errDetail.includes('inquiry_id') || errDetail.includes('leads_inquiry_id_key'))) {
+            console.warn(`[SaveLead] Inquiry ID collision detected (${inquiryId}). Regenerating fresh UUIDv4...`);
+            inquiryId = `AAF-INQ-${currentYear}-${crypto.randomUUID()}`;
+            inquiryRecord.inquiryId = inquiryId;
+            quotationRecord.inquiryId = inquiryId;
+            quote.inquiryId = inquiryId;
+            continue;
+          }
+          break;
+        }
+        supabaseLeadPersistence = sLead?.persisted ? 'SUCCESS' : 'FAILED';
         supabaseLeadDetails = sLead;
       } catch (sErr) {
         console.error('[Supabase Primary Persistence Error - Lead]:', sErr.message);
@@ -325,8 +346,27 @@ export default async function handler(req, res) {
       }
 
       try {
-        const sQuote = await saveQuotationToSupabase(quotationRecord);
-        supabaseQuotePersistence = sQuote.persisted ? 'SUCCESS' : 'FAILED';
+        let qAttempts = 0;
+        let sQuote = null;
+        while (qAttempts < 2) {
+          qAttempts++;
+          sQuote = await saveQuotationToSupabase(quotationRecord, { insertOnly: true });
+          if (sQuote.persisted) {
+            break;
+          }
+          const qErrDetail = String(sQuote.error || '');
+          if (sQuote.code === '23505' && (qErrDetail.includes('quotation_id') || qErrDetail.includes('quotations_quotation_id_key'))) {
+            console.warn(`[SaveLead] Quotation ID collision detected (${quoteId}). Regenerating fresh UUIDv4...`);
+            quoteId = `AAF-Q-${currentYear}-${crypto.randomUUID()}`;
+            quotationRecord.quoteId = quoteId;
+            quote.quoteId = quoteId;
+            quotationRecord.pdfLink = `/api/quotation?action=download-pdf&id=${quoteId}`;
+            quotationRecord.docxLink = `/api/quotation?action=download-docx&id=${quoteId}`;
+            continue;
+          }
+          break;
+        }
+        supabaseQuotePersistence = sQuote?.persisted ? 'SUCCESS' : 'FAILED';
       } catch (sqErr) {
         console.error('[Supabase Primary Persistence Error - Quote]:', sqErr.message);
         supabaseQuotePersistence = 'FAILED';
```

---

## 8. Confirmations & Operational Freeze

1. **Strict File Boundary Compliance:**
   - Modified tracked files: Exactly 2 (`api/save-lead.js` and `api/_lib/supabaseClient.js`).
   - `src/lib/emailjs.js` was inspected and remains **100% untouched**.
   - Zero modifications were made outside the authorized two files.
2. **Database Integrity Compliance:**
   - Zero schema migrations executed.
   - Zero SQL statements executed against Supabase.
3. **Execution Freeze Compliance:**
   - Zero test suites or test scripts executed (`TEST_EXECUTION_AUTHORIZED=0`).
   - Zero build commands executed.
   - Zero deployments triggered (`DEPLOYMENT_AUTHORIZED=0`).
   - Zero Git commits created (`GIT_COMMIT_AUTHORIZED=0`).
   - Zero Git pushes executed (`GIT_PUSH_AUTHORIZED=0`).
   - Zero external outreach, emails, WhatsApp messages, or HTTP calls initiated (`GLOBAL_OUTREACH_STOP=1`).

---

## 9. Strict Zero-Activity Governance Verification Table

| Governance Control Item | Operational Status | Recorded Count | Verification Detail |
| :--- | :--- | :--- | :--- |
| **GLOBAL_OUTREACH_STOP** | **ENFORCED** | Active (1) | Global outreach transmission hard-stop is permanently locked. |
| **OUTREACH_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero external outreach authorized. |
| **PILOT_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero buyer pilot communications authorized. |
| **IMPLEMENTATION_AUTHORIZED** | **PHASE_1_TWO_FILES_ONLY** | 2 Files | `api/save-lead.js` and `api/_lib/supabaseClient.js` patched strictly. |
| **DATABASE_MIGRATION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero SQL DDL/DML executed against Supabase. |
| **TEST_EXECUTION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero live tests, integration tests, or scripts run. |
| **DEPLOYMENT_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero deployments triggered to Vercel or cloud hosts. |
| **GIT_COMMIT_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero git commits created in repository. |
| **GIT_PUSH_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero git pushes executed to origin or remote branches. |
| **EXTERNAL_COMMUNICATION_AUTHORIZED** | **NOT AUTHORIZED** | 0 | Zero HTTP calls outside localhost/read-only tools. |
| **TRACKED_FILES_MODIFIED** | **EXACTLY TWO (AUTHORIZED)** | 2 | `api/save-lead.js`, `api/_lib/supabaseClient.js`. |
