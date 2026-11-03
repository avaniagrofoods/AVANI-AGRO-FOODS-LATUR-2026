# FORMAL OWNER DECISION RECORD — OWNER POLICIES O-01 THROUGH O-05 & ANTI-BURST PACING

**Project:** AVANI AGRO FOODS Website Engine (Project A Only)  
**Record Identifier:** `ODR-20261024-POLICIES-O01-O05`  
**Decision Date:** 2026-10-24  
**Source of Authority:** Direct Human Business Owner Authorization communicated in conversation context (Package 3F.42)  
**Governance Scope:** Architectural Safety Invariants & Outbound Sequence Governance  

---

## 1. EXECUTIVE CONTEXT & PURPOSE

This formal decision record documents the explicit business owner approval of Architectural Safety Policies O-01 through O-05 and the anti-burst pacing rate limit for the AVANI AGRO FOODS Website Engine. 

This record converts the previously codified technical proposals from Packages 3F.34–3F.41 into authoritative, ratifying policy decisions.

> [!IMPORTANT]
> **GOVERNANCE BOUNDARY NOTICE:**
> The approvals recorded herein establish core safety invariants only. **These decisions DO NOT grant:**
> - `GATE_2_TECHNICAL_DESIGN_ACCEPTANCE` (Remains `CONDITIONAL / NOT ACCEPTED`)
> - `GATE_4_EXECUTION_AUTHORIZATION` (Remains `NOT GRANTED`)
> - Live or staging Upstash/Redis test authorization
> - Live email outreach or pilot authorization (`PILOT_AUTHORIZED=0`, `GLOBAL_OUTREACH_STOP=1`, `OUTREACH_AUTHORIZED=0`)
> - Preview or production deployment (`PRODUCTION_STATUS=HOLD`)

---

## 2. RATIFIED OWNER POLICIES

### Policy O-01: Daily Pilot Outreach Ceiling Cap
- **Ratified Decision:** The default daily outreach limit is strictly capped at **20 emails per day** across all campaigns and workers during any authorized pilot.
- **Enforcement Rule:** If an environment variable or options parameter attempts to configure a limit higher than 20 without explicit written owner authorization, or if the configuration is negative, non-integer, or invalid, the throughput governor must strictly fail closed. Callers may configure stricter (lower) daily limits (e.g. 5 or 10), but cannot exceed the authorized cap.

### Policy O-02: Permanent Quota Consumption on Transmission Attempt
- **Ratified Decision:** Daily quota allocation is permanently consumed whenever an external transmission attempt is made to the wire.
- **Categorization of Outcomes:**
  1. **Pre-Transmission Cancellation (Local):** Allowed to release quota only if cancellation occurs before the reservation is latched into `DISPATCH_IN_FLIGHT` and before wire transmission.
  2. **Definitive Provider Rejection (Wire Failure):** Rejections by upstream providers (HTTP 4xx, authentication errors, SMTP syntax rejections) consume the daily quota slot permanently. Zero quota restoration is permitted.
  3. **Ambiguous Transmission Outcomes (Network Timeout / Disconnect):** Upstream timeouts (HTTP 504, `ETIMEDOUT`, `ECONNRESET`) preserve quota allocation as consumed; no quota refund is issued.

### Policy O-03: Quota Restoration Gated to Pre-Latch Phase Only
- **Ratified Decision:** Daily quota restoration is permitted **strictly and exclusively** during pre-flight execution before the reservation is latched into `DISPATCH_IN_FLIGHT`.
- **Fencing Requirement:** Quota slot releases must cryptographically verify that `status === 'RESERVED'`, `workerId` matches the reserving worker, and `nonce` matches the reservation token. Once latched into `DISPATCH_IN_FLIGHT`, all release calls are rejected.

### Policy O-04: Recipient Safety Frozen on Ambiguous Transmission Outcome
- **Ratified Decision:** Any ambiguous transmission outcome (such as provider timeout, socket drop, or gateway 504 where delivery status cannot be proven) must immediately transition the dispatch intent into `RECONCILIATION_HOLD` and the recipient into `UNCERTAIN_DISPATCH`.
- **Duplicate Prevention:** All automatic retries and subsequent scheduled sequence steps for this recipient must be completely blocked until an operator performs an evidentiary reconciliation.

### Policy O-05: Quota Reconciler is Strictly Report-Only
- **Ratified Decision:** The daily throughput quota reconciliation routine (`reconcileDailyQuotaDistributed`) is strictly report-only (`ZERO_WRITE_REPORT_ONLY`) and possesses **zero state-modifying write authority**.
- **Prohibited Operations:** The reconciler is strictly forbidden from executing `SET`, `DEL`, `INCR`, `DECR`, or state-modifying Lua scripts against distributed KV. Any detected ledger drift must be emitted as audit telemetry for human review.

---

## 3. RATIFIED ANTI-BURST PACING POLICY

### Anti-Burst Rate Limit
- **Approved Default Rate:** **1 email per minute** (`DEFAULT_MAX_SENDS_PER_MINUTE = 1`, enforcing a minimum 60-second interval between outbound dispatches across all concurrent workers).
- **Ceiling Approval Limitation:** Any pacing rate above 1 email per minute requires separate, explicit, written owner approval.
- **Runtime Enforcement:** Configuration of pacing rates higher than 1 email per minute without explicit authorization must be rejected or blocked fail-closed at the configuration validation boundary; the system must not silently accept unapproved higher rates.

---

## 4. AUTHENTICITY & GOVERNANCE AUDIT METADATA

- **Recording Date:** 2026-10-24
- **Channel of Instruction:** Business Owner instructions directly provided in conversation context for Package 3F.42.
- **Cryptographic / Signature Disclaimer:** In strict compliance with Package 3F.42 instructions, no handwritten signatures, cryptographic keys, or off-platform approval documents have been fabricated. This record represents the true and authentic capture of human business owner instructions issued for the website engine repository.
- **Governance Locks Active:**
  - `PRODUCTION_STATUS = HOLD`
  - `GLOBAL_OUTREACH_STOP = 1`
  - `OUTREACH_AUTHORIZED = 0`
  - `PILOT_AUTHORIZED = 0`
  - `GATE_2_TECHNICAL_DESIGN_ACCEPTANCE = CONDITIONAL / NOT ACCEPTED`
  - `GATE_4_EXECUTION_AUTHORIZATION = NOT GRANTED`
  - `UPSTASH_CONFIGURATION = NOT VERIFIED`
  - `BLK-06 = QUARANTINED / NOT VERIFIED`
