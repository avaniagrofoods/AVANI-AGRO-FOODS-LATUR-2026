# AVANI AGRO FOODS — PHASE 3O CONTROLLED TEST SEND REPORT
**Controlled Test-Inbox Pilot Execution (Zero Real Buyer Contact Mode)**  
**Date:** 2026-10-08  
**Operator / Auditor:** Senior Production Safety Auditor & Full-Stack Engineer  
**Sender:** AVANI AGRO FOODS `<sales@avaniagrofoods.com>`  
**Reply-To:** `sales@avaniagrofoods.com`  
**Sequence:** SEQ-01 ONLY (No SEQ-02, SEQ-03, SEQ-04, or SEQ-05)  

---

## Executive Summary

| Parameter | Recorded Value | Evaluation |
| :--- | :--- | :---: |
| **Phase Evaluation** | **PHASE_3O_CONTROLLED_TEST** | **PASS** |
| **TEST-01 (`sachinnshinde1356@gmail.com`)** | HTTP 200 \| ID: `01a11c73-51c6-767e-81c5-3e25e53d63a0` | **PASS** |
| **TEST-02 (`starpowerzlatur2210@gmail.com`)** | HTTP 200 \| ID: `01a11c74-61eb-77af-add0-2a2f3e1384cd` | **PASS** |
| **TEST-03 (`avaniloanservicelatur@gmail.com`)** | HTTP 200 \| ID: `01a11c75-7261-7886-8644-28579d57893c` | **PASS** |
| **Pacing Enforced** | 65.0 seconds between sends (Governor min. 60s) | **PASS** |
| **Daily Governor Quota** | 3 of 20 slots consumed (17 remaining) | **PASS** |
| **Real Buyer Contact** | **0** | **LOCKED (0)** |
| **Real Buyer Emails** | **0** | **LOCKED (0)** |
| **Unauthorized Emails** | **0** | **LOCKED (0)** |
| **SMTP / MX Probes** | **0** | **LOCKED (0)** |
| **Global Outreach Stop** | **1 (ACTIVE)** | **LOCKED (1)** |
| **Outreach Authorized** | **0 (FALSE)** | **LOCKED (0)** |
| **Pilot Authorized** | **1 ONLY FOR THE THREE EXPLICIT TEST ADDRESSES** | **PASS** |

---

## 1. Pre-Flight Verification & Safety Audits

Before initiating transmission, all required safety conditions were deterministically verified:

1. **Production Deployment (A):**
   * Confirmed Vercel Deployment ID: [`dpl_FCuc65DfVpY46WsScQgQz4Scz4Vp`](https://avani-agro-foods-latur-2026-7ieim19hp.vercel.app)
   * Production State: `● Ready`
   * Associated Git Commit: `af5c1ec` (`fix(importers): restore status filter runtime guard`)
2. **Private Importers Route Health (B):**
   * Verified `PRIVATE_IMPORTERS_PRODUCTION = HEALTHY`.
   * Production Master Gate authenticated (`POST /api/verify-gate` -> `200 OK`).
   * Production Importer API returned **642 importer records** (`GET /api/importers` -> `200 OK`).
   * Status filter loop executed with 0 ReferenceErrors across all 642 records.
3. **Regression Test Suite (C):**
   * **144 / 144 assertions PASS** across all 5 test suites:
     - `test_phase_3n_remediation.cjs`: 16 / 16 PASS
     - `test_phase_3i_sequences.cjs`: 9 / 9 PASS
     - `test_phase_3k_webhook.cjs`: 18 / 18 PASS
     - `test_p4_5_email_dispatch.cjs`: 46 / 46 PASS
     - `test_phase_3o_controlled_inbox.cjs`: 55 / 55 PASS
4. **Dataset Integrity Checksums (D):**
   * `api/_data/importersData.js`: `02AFC4E0F621B4326A1CBD67BFC31266A14DFA77F1B0F9767315BB971860F595` (**MATCH**)
   * `api/_data/importersData.snapshot-642.json`: `86100BDA94BE63A51EDDC6EE2B2458133F607D50CD5F7D66C25193F3C9137F9E` (**MATCH**)
   * `api/_data/manufacturersData.js`: `6F760D437E3C3C213E0571167B33B66B1DF87503E13DE12514BE552F4AED691C` (**MATCH**)
5. **Exact Recipient Allowlist (E):**
   * Allowlist restricted strictly to the 3 designated inboxes.
6. **Real Buyer Allowlist Exclusion (F & J):**
   * Scanned all 642 records in `IMPORTERS` against the allowlist: **0 matches**.
7. **Resend Sender Identity (G):**
   * Sender: `AVANI AGRO FOODS <sales@avaniagrofoods.com>` (verified against `avaniagrofoods.com` domain).
8. **Reply-To Identity (H):**
   * Reply-To: `sales@avaniagrofoods.com`.
9. **SEQ-01 Rendering (I):**
   * Successfully rendered B2B positioning template enforcing *"Export Trade Co-Ordinator"* without producer claims.
10. **Global Outreach Stop Invariant (K):**
    * Confirmed `GLOBAL_OUTREACH_STOP=1` remains active for all non-test paths.

---

## 2. Explicit Operator Authorization

* **Authorization Recorded:** *"Send one SEQ-01 test email to each of the three allowlisted test inboxes."*
* **Authorization Scope:** Controlled test pilot only; restricted strictly to the 3 test inboxes.
* **Date & Context:** 2026-10-08T22:18:46+05:30.

---

## 3. Controlled Send Telemetry & Execution Log

All three transmissions were dispatched via Resend REST API (`POST https://api.resend.com/emails`) adhering strictly to the 60-second governor pacing interval.

### Detailed Telemetry per Test Recipient

#### TEST-01: `sachinnshinde1356@gmail.com`
* **Recipient ID:** `TEST-01`
* **Company:** Avani Agro Foods Internal Pilot Inbox 1
* **Contact Person:** Sachin Shinde
* **Product Focus:** Moringa & Dehydrated Red Onion Powder
* **Sequence Step:** `SEQ-01`
* **Subject:** `Indian Origin Sourcing Coordination: Moringa & Dehydrated Red Onion Powder Specifications for Avani Agro Foods Internal Pilot Inbox 1`
* **Timestamp:** `2026-10-08T16:58:00.152Z`
* **Resend HTTP Status:** `200 OK`
* **Provider Message ID:** `01a11c73-51c6-767e-81c5-3e25e53d63a0`
* **SES Message ID:** `<010601a11c73545c-32847db5-3307-44f7-b88c-f41ca06ffce0-000000@ap-northeast-1.amazonses.com>`
* **Delivery Status:** `delivered`
* **Governor Reservation:** `RES-2026-10-08-1-lo5lh1` (Quota: 1 / 20)
* **Sequence State:** `EMAIL_1_SENT`
* **Lead State:** `OUTREACH_ACTIVE`
* **Result:** **PASS**

---
*[PACING WINDOW: 65 SECONDS ENFORCED]*
---

#### TEST-02: `starpowerzlatur2210@gmail.com`
* **Recipient ID:** `TEST-02`
* **Company:** Avani Agro Foods Internal Pilot Inbox 2
* **Contact Person:** Star Power Sourcing Desk
* **Product Focus:** Dehydrated Red Onion Powder
* **Sequence Step:** `SEQ-01`
* **Subject:** `Indian Origin Sourcing Coordination: Dehydrated Red Onion Powder Specifications for Avani Agro Foods Internal Pilot Inbox 2`
* **Timestamp:** `2026-10-08T16:59:11.087Z`
* **Resend HTTP Status:** `200 OK`
* **Provider Message ID:** `01a11c74-61eb-77af-add0-2a2f3e1384cd`
* **SES Message ID:** `<010601a11c74648f-f648665c-b779-4397-ad30-2d7980e858c6-000000@ap-northeast-1.amazonses.com>`
* **Delivery Status:** `delivered`
* **Governor Reservation:** `RES-2026-10-08-2-w14x22` (Quota: 2 / 20)
* **Sequence State:** `EMAIL_1_SENT`
* **Lead State:** `OUTREACH_ACTIVE`
* **Result:** **PASS**

---
*[PACING WINDOW: 65 SECONDS ENFORCED]*
---

#### TEST-03: `avaniloanservicelatur@gmail.com`
* **Recipient ID:** `TEST-03`
* **Company:** Avani Agro Foods Internal Pilot Inbox 3
* **Contact Person:** Avani Loan Service Procurement
* **Product Focus:** Moringa Oleifera Leaf Powder
* **Sequence Step:** `SEQ-01`
* **Subject:** `Indian Origin Sourcing Coordination: Moringa Oleifera Leaf Powder Specifications for Avani Agro Foods Internal Pilot Inbox 3`
* **Timestamp:** `2026-10-08T17:00:20.778Z`
* **Resend HTTP Status:** `200 OK`
* **Provider Message ID:** `01a11c75-7261-7886-8644-28579d57893c`
* **SES Message ID:** `<010601a11c759381-a6e93f80-4a26-476a-a9f1-3df04af14402-000000@ap-northeast-1.amazonses.com>`
* **Delivery Status:** `delivered`
* **Governor Reservation:** `RES-2026-10-08-3-lr7wj8` (Quota: 3 / 20)
* **Sequence State:** `EMAIL_1_SENT`
* **Lead State:** `OUTREACH_ACTIVE`
* **Result:** **PASS**

---

## 4. Post-Send Verification Matrix

| Verification Check | Requirement | Result | Evidence / Notes |
| :--- | :--- | :---: | :--- |
| **1. Accepted by Provider** | HTTP 2xx from Resend | **PASS** | All 3 returned HTTP 200 OK |
| **2. Provider Message IDs** | Valid UUID generated | **PASS** | `01a11c73...`, `01a11c74...`, `01a11c75...` |
| **3. Canonical Sender** | `sales@avaniagrofoods.com` | **PASS** | Match |
| **4. Canonical Reply-To** | `sales@avaniagrofoods.com` | **PASS** | Match |
| **5. Exact Allowlist Match** | Only 3 test inboxes | **PASS** | Exact match |
| **6. Real Buyer Exclusion** | 0 real buyers contacted | **PASS** | Real buyer contact count = 0 |
| **7. Single Step Restriction** | Only SEQ-01 dispatched | **PASS** | State currentStep = 1 |
| **8. Follow-Up Prevention** | 72h delay enforced | **PASS** | No automated follow-up scheduled |
| **9. Global Outreach Stop** | Fail-closed for real buyers | **PASS** | `GLOBAL_OUTREACH_STOP=1` active |
| **10. Inbox Delivery** | Confirmed by telemetry | **PASS** | All 3 marked `delivered` in Resend/SES |

---

## 5. Daily Governor Accounting

The persistent ledger in [`api/_data/sequenceStateStore.json`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/_data/sequenceStateStore.json) recorded:
* **Date:** `2026-10-08`
* **Daily Limit:** `20`
* **Slots Consumed:** `3`
* **Slots Remaining:** `17`
* **Pacing Interval Observed:** 65 seconds between transmissions (exceeds 60s minimum requirement).

---

## 6. Inbound Reply Stop Architecture

Per strict operating rules:
* No automated follow-up responses may be sent automatically.
* When an inbound reply is received by [`api/email-reply-webhook.js`](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/2-AVANI%20AGRO%20FOODS%20LATUR%202026/api/email-reply-webhook.js), the state machine immediately transitions the recipient to `REPLIED` / `STOPPED_REPLY_RECEIVED`, halts all scheduled follow-ups, and creates an operator review task for the Export Trade Co-Ordinator.

---

## Final Safety State & Decision

```text
TEST-01 = PASS
TEST-02 = PASS
TEST-03 = PASS

REAL_BUYER_CONTACT = 0
REAL_BUYER_EMAILS = 0
UNAUTHORIZED_EMAILS = 0
SMTP_PROBES = 0
MX_PROBES = 0

GLOBAL_OUTREACH_STOP = 1
OUTREACH_AUTHORIZED = 0
PILOT_AUTHORIZED = 1 ONLY FOR THE THREE EXPLICIT TEST ADDRESSES
```
