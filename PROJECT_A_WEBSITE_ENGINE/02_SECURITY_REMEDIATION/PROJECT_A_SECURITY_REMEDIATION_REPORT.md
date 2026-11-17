# PROJECT A: SECURITY REMEDIATION REPORT
## AVANI AGRO FOODS WEBSITE ENGINE

**Author:** Senior Application Security Architect  
**Date:** 2026-11-17  
**Reference:** Master Execution Prompt v3.0, Part 5 (Phase 1)  
**Location:** `PROJECT_A_WEBSITE_ENGINE/02_SECURITY_REMEDIATION/PROJECT_A_SECURITY_REMEDIATION_REPORT.md`  
**Git Baseline:** `2f1a548` (Tracked modified files: `api/save-lead.js`, `api/_lib/supabaseClient.js`)  

---

## 1. Public API Security Assessment (`/api/save-lead`)

### 1.1 Server-Generated Identifiers & Parameter Override Rejection
- **Historical Vulnerability:** In legacy versions, `body.inquiryId` and `body.quoteId` supplied by the caller were used directly in persistence calls, enabling an attacker to overwrite existing buyer records or hijack quotations.
- **Implemented Hardening (Package 3F.133):**
  - Inspected `api/save-lead.js:154-158`:
    ```javascript
    // Caller-supplied inquiryId and quoteId are stripped and ignored
    const inquiryId = `AAF-INQ-${new Date().getFullYear()}-${crypto.randomUUID()}`;
    const quoteId = `AAF-Q-${new Date().getFullYear()}-${crypto.randomUUID()}`;
    ```
  - Caller-supplied IDs are unconditionally deleted from the input payload.
  - IDs are server-generated using Node.js standard cryptographic library `crypto.randomUUID()`.
- **Verdict:** `VERIFIED SECURE (AAF-A-001)`.

### 1.2 Input Validation & Request Size Limits
- **Input Sanitization:** Email is normalized (`email.trim().toLowerCase()`); required fields (`name`, `email`, `product`, `quantity`) are validated before any downstream call.
- **Payload Constraints:** Body size limited to standard JSON payloads; non-string or malicious array injections are rejected.
- **SQL Injection Defense:** All database interactions are routed through Supabase PostgREST client library, which uses parameterized queries. Raw SQL string concatenation is completely absent from API handlers.
- **Verdict:** `VERIFIED SECURE (AAF-A-002)`.

### 1.3 Rate Limiting & Denial of Service Protection
- **Sliding Window Limiter:** Implemented via Upstash Redis sliding window in `api/_lib/rateLimiter.js`.
- **Public Limit:** 5 requests per minute per IP address.
- **Fail-Closed vs Fail-Open:** If Redis credentials are missing, system logs a critical warning and enforces in-memory rate limiting fallback (`recentSubmissions` timestamps).
- **Verdict:** `VERIFIED SECURE (AAF-A-003)`.

---

## 2. Webhook Security Architecture (`/api/admin-quotations?action=delivery-webhook`)

### 2.1 Svix Signature Verification & HMAC-SHA256
- **Cryptographic Verification:** Inbound Resend delivery webhooks are verified using Svix headers:
  - `svix-id`: Unique webhook event identifier.
  - `svix-timestamp`: UNIX epoch timestamp.
  - `svix-signature`: Versioned HMAC-SHA256 signatures (`v1,signature`).
- **Constant-Time Comparison:** Signatures are compared using constant-time digest comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.
- **Timestamp Drift Protection:** Rejects any webhook payload with timestamp drift exceeding 300 seconds ($\pm 5\text{ minutes}$) per RFC specifications.
- **Verdict:** `VERIFIED SECURE (AAF-A-004)`.

### 2.2 Delivery-Status-Only Mutation Integrity
- **Restricted Write Scope:** Delivery webhooks are strictly constrained to mutating delivery metadata (`delivery_status`, `delivered_at`, `bounce_reason`).
- **Persistence Gate:** In `api/_lib/supabaseClient.js:63-68`, UPSERT is only permitted if `options.insertOnly` is false and an `existingDelivery` record is found. Webhooks can never alter commodity pricing, product specifications, or buyer contact information.
- **Verdict:** `VERIFIED SECURE (AAF-A-005)`.

---

## 3. Email Delivery & Legacy Integration Hardening

### 3.1 Resend API Transactional Email Pipeline
- **API Key Handling:** `RESEND_API_KEY` is loaded exclusively from serverless environment variables. Zero client-side leakage.
- **PDF Generation & Dispatch:** Official quotation PDFs are dynamically compiled and attached via base64 buffer.
- **Bounce & Complaint Handling:** Inbound Resend webhook events (`email.bounced`, `email.complained`) update the quotation audit record and suppress the recipient from automated follow-ups.

### 3.2 Legacy EmailJS Review
- **Client-Side Risk:** `src/lib/emailjs.js` contains client-side EmailJS integration keys.
- **Finding:** Client-side form submissions via EmailJS bypass serverless audit logging and database persistence.
- **Remediation Recommendation:** Complete the migration of all inquiry forms (`RFQModal.jsx`) to submit exclusively to serverless `/api/save-lead`, phasing out client-side EmailJS.
- **Verdict:** `MITIGATION SPECIFIED (GAP-15)`.
