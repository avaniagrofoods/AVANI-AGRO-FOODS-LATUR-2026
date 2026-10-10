# AVANI AGRO FOODS — PHASE 3O: CONTROLLED OPERATOR PILOT REVIEW & PRE-SEND ACCEPTANCE REPORT

**Audit Date:** 2026-10-08  
**Audit Mode:** STRICT READ-ONLY / NO-SEND / NO-OUTREACH MODE  
**Target Repository:** `2-AVANI AGRO FOODS LATUR 2026`  
**Production Host:** `https://www.avaniagrofoods.com`  
**Production Deployment:** `dpl_BoFT3s37m9i3MEVEWU93ubf12Mzt` (Vercel Production)  
**Accepted Production Commit:** `67e399b5f12d8cafe60ea9c5e77059811b4a303e` (`67e399b`)  
**Phase 3O Acceptance Status:** `READY_FOR_HUMAN_PILOT_AUTHORIZATION`

---

## 1. Executive Summary & Acceptance State

Phase 3O executes an exhaustive, independent pre-send verification of the Avani Agro Foods B2B outreach infrastructure following production promotion of the Phase 3N safety controls (commit `67e399b`).

All ten (10) safety mechanisms, fail-closed boundaries, governor parameters, webhook authentications, and dataset integrity hashes have been verified. Zero outbound communications were generated during this review. The system remains in a locked pre-send posture pending explicit human operator sign-off.

```
========================================================================================
CURRENT ACCEPTANCE STATE MATRIX
========================================================================================
PHASE_3O_STATUS                    = READY_FOR_HUMAN_PILOT_AUTHORIZATION
FINAL_DECISION                     = PRE_SEND_ACCEPTANCE_VERIFIED_PASS

GLOBAL_OUTREACH_STOP               = 1 (LOCKED)
OUTREACH_AUTHORIZED                = 0 (LOCKED)
PILOT_AUTHORIZED                   = 0 (LOCKED)

EMAILS_SENT                        = 0 (VERIFIED)
BUYER_CONTACT                      = 0 (VERIFIED)
BUYER_EMAILS                       = 0 (VERIFIED)
SMTP_PROBES                        = 0 (VERIFIED)
MX_PROBES                          = 0 (VERIFIED)

PRODUCTION_STATUS                  = READY (dpl_BoFT3s37m9i3MEVEWU93ubf12Mzt)
CANONICAL_DOMAIN                   = PASS (https://www.avaniagrofoods.com)
DATASET_FREEZE_HASHES              = 3/3 PASS (BIT-FOR-BIT IDENTICAL)
REGRESSION_SUITE                   = 89/89 PASS (100% SUITE PASS)
SECURITY_SCAN                      = PASS (0 CREDENTIALS IN TRACKED CODEBASE)
GIT_STATUS                         = CLEAN (main @ 67e399b)
========================================================================================
```

---

## 2. Safety Architecture & Boundary Verification

### Control 1: Global Outreach Stop Absolute Priority
- **Implementation:** `api/_lib/sequenceStateMachine.js` (lines 179–189).
- **Behavior:** `GLOBAL_OUTREACH_STOP` is evaluated before lead qualification, delay calculation, per-lead approval, quota reservation, or provider invocation.
- **Verification Result:** **PASS**. When `globalOutreachStop: 1`, dispatch synchronously returns `{ success: false, blocked: true, reason: 'GLOBAL_OUTREACH_STOP is active' }`, status sets to `STOPPED_GLOBAL_STOP`, step remains `0`, `lastSentAt` remains `null`, quota consumed is `0`, and network calls are `0`.

### Control 2: Mandatory Per-Recipient Human Approval Gate
- **Implementation:** `api/_lib/sequenceStateMachine.js` (lines 236–251) and `approveRecipientForOutreach()`.
- **Behavior:** Explicit operator approval (`recipient.approvedForOutreach === true`) is required before `SEQ-01` can be dispatched.
- **Verification Result:** **PASS**. Unapproved leads (even with high qualification scores, complete profiles, or valid emails) unconditionally return `{ success: false, blocked: true, approvalRequired: true, reason: 'BLOCKED_HUMAN_APPROVAL_REQUIRED' }`. Zero leads in the master dataset currently have `approvedForOutreach: true`.

### Control 3: DailyThroughputGovernor & Anti-Burst Pacing
- **Implementation:** `api/_lib/dailyThroughputGovernor.js`.
- **Parameters Verified:**
  - Default daily limit: `20 emails/day` (conservative pilot ceiling).
  - Anti-burst pacing: `1 email/minute` (60,000 ms minimum spacing between sends).
  - Maximum allowable configuration: `1,000 emails/day`.
  - Fail-closed configuration: Negative values, non-numeric strings, and missing configs fail closed.
  - Concurrency safety: Atomic reservation with unique tracking IDs (`RES-YYYY-MM-DD-N-XXXXXX`).
  - Persistent accounting: Durable reservation stored in `dailyThroughput` ledger.
- **Verification Result:** **PASS**. Immediate consecutive dispatches are blocked by pacing (`Wait XX.Xs`). Quota exhaustion stops subsequent attempts immediately.

### Control 4: Sequence Bounds & Stopping Rules
- **Implementation:** `api/_lib/emailSequences.js` and `api/_lib/sequenceStateMachine.js`.
- **Sequence Steps:** Strictly bounded to `SEQ-01` through `SEQ-05`.
  - `SEQ-01`: Initial Sourcing Introduction (0h)
  - `SEQ-02`: Specification Follow-Up (+72h)
  - `SEQ-03`: Sourcing / Sample Follow-Up (+72h)
  - `SEQ-04`: Value / Clarification Follow-Up (+72h)
  - `SEQ-05`: Polite Close & Thank-You (+72h) -> Terminal `COMPLETED`
  - `SEQ-06`: **DOES NOT EXIST**. Attempts to dispatch beyond Step 5 return `{ blocked: true, reason: 'No sequence step beyond SEQ-05 exists' }`.
- **Stopping Invariants Verified:**
  - `handleIncomingReply()` -> Sets `STOPPED_REPLY_RECEIVED`, queues human review task, cancels all follow-ups. Subsequent dispatch blocked.
  - `handleOptOut()` -> Sets `STOPPED_OPT_OUT` / `UNSUBSCRIBED`, permanent suppression.
  - `handleBounce()` -> Sets `STOPPED_BOUNCE`, permanent suppression.
  - `handleComplaint()` -> Sets `STOPPED_COMPLAINT`, permanent suppression.
- **Verification Result:** **PASS**.

### Control 5: Webhook Endpoint Security & Cryptographic Verification
- **Implementation:** `api/email-reply-webhook.js`.
- **Production URL:** `https://www.avaniagrofoods.com/api/email-reply-webhook`.
- **Probes Executed:**
  - `GET /api/email-reply-webhook` -> **HTTP 405 Method Not Allowed** (`Inbound email webhook requires POST requests.`)
  - `POST /api/email-reply-webhook` (Unsigned) -> **HTTP 401 Unauthorized** (`Invalid or missing webhook signature/secret.`)
  - `POST /api/email-reply-webhook` (Invalid signature) -> **HTTP 401 Unauthorized** (`Invalid or missing webhook signature/secret.`)
- **Verification Result:** **PASS**. Webhook rejects all unauthenticated or spoofed traffic.

### Control 6: Transactional Email Isolation
- **Quotation Model:** `src/data/quotationModel.js` and `api/admin-quotations.js`.
  - Transactional quotation emails are triggered only via authenticated admin sessions (`verifyAdminAuth`) for explicit inbound inquiries.
  - Requires status `READY_FOR_BUYER`, explicit `adminReviewed: true`, and buyer-ready gate clearance.
  - Completely isolated from cold outreach sequence automation.
  - Direct endpoint `/api/quotation?action=send-email` is deprecated and returns **HTTP 403 Forbidden**.
- **Verification Result:** **PASS**.

---

## 3. Read-Only Pilot Cohort Recommendation (Ceiling: 5 Leads)

A read-only scan of the frozen dataset (`api/_data/importersData.js`, 642 records) was conducted to evaluate candidate leads suitable for the initial pilot.

> **CRITICAL:** None of these records have been approved or modified in storage. Approval requires explicit operator action in the admin console.

### Candidate Lead Profiles Recommended for Operator Review

| # | Lead ID | Company Name | Destination | Contact Person | Verified Email | Target Category | Verification Status |
|---|---------|--------------|-------------|----------------|----------------|-----------------|---------------------|
| 1 | `AVANI-LEAD-0063` | Schiff Foods Products Co. | USA | Procurement Desk | `sales@schifffood.com` | Red Onion Powder | VERIFIED / HIGH |
| 2 | `AVANI-LEAD-0141` | Life of a Tree (Farmer Fem) | UK | Procurement Desk | `faseru@live.co.uk` | Moringa Powder | VERIFIED / HIGH |
| 3 | `AVANI-LEAD-0173` | Aduna Superfoods | UK | Procurement Desk | `info@aduna.com` | Moringa Powder | VERIFIED / HIGH |
| 4 | `AVANI-LEAD-0144` | Ital Vital Herbs | UK | Procurement Desk | `italvitalherb@gmail.com` | Both (Moringa & Onion) | VERIFIED / HIGH |
| 5 | `AVANI-LEAD-0165` | Rigel Herbal (GNP Limited) | UK | Procurement Desk | `info@rigeluk.co.uk` | Moringa Powder | VERIFIED / HIGH |

### Pilot Scope Constraints
1. **Pilot Ceiling:** Maximum **5 recipients** total for initial run.
2. **Step Ceiling:** **SEQ-01 ONLY**. No automatic progression to `SEQ-02`.
3. **Pacing Ceiling:** Minimum **60 seconds** between consecutive sends.
4. **Positioning Lock:** All rendered copy strictly uses the verified positioning:
   - *"Export Trade Co-Ordinator"*
   - *"Indian sourcing and export coordination partner"*
   - *"Coordinates sourcing from qualified Indian manufacturing and processing partners"*
   - Zero manufacturer/factory/farmer claims.

---

## 4. Hard Stop Criteria & Incident Protocol

The automated pilot must be aborted immediately upon encountering any of the following triggers:

| Trigger Event | Threshold | Automated Action | Operator Action Required |
|---------------|-----------|------------------|--------------------------|
| Hard Bounce | $\ge 1$ bounce | Address permanently suppressed; sequence stopped for recipient | Pause pilot batch; verify DNS/SPF/DKIM alignment and recipient MX health |
| Spam Complaint | $\ge 1$ complaint | Recipient permanently suppressed | **IMMEDIATE ABORT OF PILOT**; full audit of messaging and list quality |
| Provider API Error | $\ge 1$ error (4xx/5xx) | Governor backoff; slot reservation released | Inspect Resend dashboard logs; verify rate limits or balance |
| Webhook Failure | Signature mismatch or 500 | Inbound event rejected | Verify `RESEND_WEBHOOK_SECRET` matches production environment |
| Pacing Violation | $> 1$ send/minute | Governor halts dispatch (`Wait XXs`) | System self-regulates; operator notification |
| Buyer Reply | Any reply | Automated follow-up halted; assigned to Human Review | Sachin Shinde handles personal trade coordination response |

---

## 5. Operator Sign-Off & Authorization Package

This checklist must be reviewed and executed by the human operator before any outreach can occur.

```markdown
OPERATOR PRE-PILOT AUTHORIZATION CHECKLIST:

[ ] 1. RESEND CONFIGURATION
    - Resend API Key confirmed active and bound to domain: avaniagrofoods.com
    - Sending address: sales@avaniagrofoods.com
    - Inbound Webhook configured to: https://www.avaniagrofoods.com/api/email-reply-webhook
    - RESEND_WEBHOOK_SECRET synchronized in Vercel Production Environment

[ ] 2. RECIPIENT APPROVAL
    - Select and verify candidate recipients in Admin Portal
    - Confirm approvedForOutreach = true ONLY for selected pilot leads (Max 5)
    - Confirm lead company names and product affinities

[ ] 3. PILOT EXECUTION PARAMETERS
    - Target: Maximum 5 leads
    - Sequence Step: SEQ-01 ONLY
    - Daily Throughput Cap: 20 emails/day
    - Send Rate: 1 email/minute

[ ] 4. OPERATOR AUTHORIZATION SIGN-OFF
    Authorized By: Sachin Shinde (Export Trade Co-Ordinator)
    Date: ________________________
    Signature: ___________________

    [ ] Set PILOT_AUTHORIZED = 1
    [ ] Set OUTREACH_AUTHORIZED = 1
    [ ] Temporarily toggle GLOBAL_OUTREACH_STOP = 0 for authorized batch
```

---

## 6. Frozen Dataset & Integrity Proofs

```
========================================================================================
DATASET INTEGRITY AUDIT (SHA-256)
========================================================================================
File: api/_data/importersData.js
Expected: 02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595
Computed: 02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595
Status:   PASS (BIT-FOR-BIT IDENTICAL)

File: api/_data/importersData.snapshot-642.json
Expected: 86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E
Computed: 86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E
Status:   PASS (BIT-FOR-BIT IDENTICAL)

File: api/_data/manufacturersData.js
Expected: 6F760D437E3C3C213E0571167B33B66B1DF87503E13DE12514BE552F4AED691C
Computed: 6F760D437E3C3C213E0571167B33B66B1DF87503E13DE12514BE552F4AED691C
Status:   PASS (BIT-FOR-BIT IDENTICAL)
========================================================================================
```

---

## 7. Zero-Outreach & Non-Interference Verification

- **Real Buyer Contacts:** `0`
- **Real Emails Dispatched:** `0`
- **Simulated / Unit Test Dispatch Only:** Verified using local mock runners (`isTestMode: true`) without network sockets.
- **SMTP Probes:** `0`
- **MX Probes:** `0`
- **Git Working Tree:** `CLEAN` (zero uncommitted files).
- **Production Status:** `Ready` (`dpl_BoFT3s37m9i3MEVEWU93ubf12Mzt`).

---

## 8. Conclusion & Handoff

Phase 3O is **COMPLETE** and verified in full. All code, runtime gates, pacing governors, approval mechanisms, and cryptographic validations are operating as designed.

The system is in a state of **READY_FOR_HUMAN_PILOT_AUTHORIZATION**. No further automated changes or sends will occur without human operator review and explicit sign-off.
