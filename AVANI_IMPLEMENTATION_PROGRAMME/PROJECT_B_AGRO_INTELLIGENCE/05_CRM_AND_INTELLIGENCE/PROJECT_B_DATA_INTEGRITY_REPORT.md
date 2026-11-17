# PROJECT B: DATA INTEGRITY, RULE DR-04 & INTELLIGENCE REPORT
## AVANI_AGRO_INTELLIGENCE ENGINE

**Author:** Principal B2B Data Architect & Verification Specialist  
**Date:** 2026-11-17  
**Reference:** Master Execution Prompt v3.0, Part 6 (Phase 2)  
**Location:** `PROJECT_B_AGRO_INTELLIGENCE/05_CRM_AND_INTELLIGENCE/PROJECT_B_DATA_INTEGRITY_REPORT.md`  

---

## 1. Resolution of the STARFLEET Dashboard Discrepancy

### 1.1 Root Cause & Remediated Source Logic
- **Historical Symptom:** Line 147 of `tests/integration/test_e2e_pipeline.py` failed with `AssertionError: 'STARFLEET AGRO IMPORTS SAS' not found in dashboard_html`.
- **Verified Source Implementation:**
  - In `src/analytics/kpi_engine.py:33-38`:
    ```python
    recent_companies = [
        dict(row) for row in self.db.execute(
            "SELECT company_id, legal_name, country_code, primary_category, verification_status "
            "FROM companies ORDER BY created_at DESC LIMIT 10"
        ).fetchall()
    ]
    ```
  - In `src/analytics/dashboard.py:21-30`:
    ```python
    recent_companies = rec.get("recent_companies", [])
    if recent_companies:
        for c in recent_companies:
            # Table row rendered with html.escape(c.get("legal_name", ""))
    ```
- **Empty Database Resilience:** If `companies` table is empty, `recent_companies` evaluates to `[]`, safely rendering an empty table state without raising `KeyError` or `IndexError`.
- **Verdict:** `VERIFIED RESOLVED (AAF-B-008)`.

---

## 2. Rule DR-04: Agricultural Market Yard Anti-Merge Safeguards

### 2.1 The Commodity Trading Cluster Problem
In Indian agricultural supply chains, dozens of legally distinct proprietary firms, partnership trading houses, and brokers operate within shared Agricultural Produce Market Committee (APMC) yards (e.g. Latur APMC Yard, Vashi APMC Navi Mumbai). Standard deduplication algorithms that evaluate address similarity falsely merge these distinct trading businesses into a single entity record.

### 2.2 Implemented Anti-Merge Enforcement (`src/intelligence/dedup.py`)
- **Keywords Monitored:** `apmc`, `market yard`, `mandi`, `krishi upaj`, `grain market`, `commercial trade complex`, `agricultural produce market`, `vashi apmc`, `latur market yard`.
- **Rule DR-04 Enforcement Logic:**
  ```python
  if address and is_apmc_or_cluster_address(address):
      return {
          "is_match": False,
          "matched_company": None,
          "match_type": "APMC_SHARED_CLUSTER_SAFEGUARD",
          "action": "PROCEED_AS_NEW_ENTITY",
          "reason": "Entity operates in APMC/trade cluster; distinct legal identity preserved under Rule DR-04."
      }
  ```
- **Tax ID Exception:** Two entities are only merged if their statutory tax IDs (`pan_number`, `gstin`, or `iec`) are identical. Shared market yard addresses can **never** trigger an automated entity merge.
- **Verdict:** `VERIFIED HARDENED (AAF-B-009)`.

---

## 3. Data Provenance & B2B Commodity Intelligence

### 3.1 Immutable Source Provenance (`SourceEvidence`)
- Every persisted entity and trade lead enforces an immutable `SourceEvidence` data structure:
  - `source_url`: Verifiable provenance URL (e.g. APEDA registry, DGFT portal, inbound RFQ form).
  - `captured_at`: ISO 8601 UTC timestamp.
  - `confidence_score`: Float between $0.0$ and $1.0$.
  - `verification_status`: `VERIFIED`, `UNVERIFIED`, `FLAGGED`, or `REJECTED`.
- Records lacking valid provenance are rejected at ingestion boundary.

### 3.2 Manufacturer & Buyer Database Governance
- **Zero Invention Directive:** No fictitious buyer profiles, false customer reviews, or unverified laboratory certifications are permitted in either database.
- **Commodity Focus:**
  - **Moringa Leaf Powder:** Specifications indexed (Mesh size 80–100, organic certification, microbial limits, moisture $<7\%$).
  - **Dehydrated Red Onion Powder/Flakes:** Moisture $<5\%$, microbiological standards, Latur/Nashik region origins.
- **Verdict:** `VERIFIED COMPLIANT (AAF-B-010)`.
