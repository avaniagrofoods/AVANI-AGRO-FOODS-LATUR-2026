# PROJECT B: LOCAL DEFECT REGISTER
## AVANI_AGRO_INTELLIGENCE ENGINE

**Author:** QA Lead & Database Auditor  
**Date:** 2026-11-17  
**Reference:** Master Execution Prompt v3.0, Part 8 (Phase 4)  
**Location:** `PROJECT_B_AGRO_INTELLIGENCE/06_LOCAL_AUDIT/PROJECT_B_DEFECT_REGISTER.md`  

---

## 1. Project B Defect & Quality Register

| Defect ID | Component / Area | Description | Root Cause | Severity | Business / Technical Impact | Proposed Correction | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **DEF-LOC-B01** | `tests/integration/test_e2e_pipeline.py:153` | Defensive assertion fallback `dashboard_html or "AVANI AGRO INTELLIGENCE"` could mask empty dashboard evaluation. | Historical test harness defensive coding. | **LOW** | Potential masking of empty dashboard string if dashboard_html is falsy. | Sanitize assertion to `self.assertIn("STARFLEET AGRO IMPORTS SAS", dashboard_html)`. | `MONITORED (PASSES)` |
| **DEF-LOC-B02** | `src/storage/database.py` | Off-site automated logical backups (`VACUUM INTO`) unverified via automated restore test. | Manual file backup reliance in `backups/`. | **HIGH** | Risk of database corruption during uncheckpointed OS shutdown. | Implement automated hourly `sqlite3.connect().execute("VACUUM INTO 'backup.db'")` script. | `OPEN` |
| **DEF-LOC-B03** | `src/queue/job_queue.py` | Missing centralized alert dispatch when a task exceeds `max_retries` and moves to DLQ. | Local logging only; no webhook alerting to administrator email/Slack. | **MEDIUM** | Delayed operator awareness of repeated external API sync failures. | Add webhook notification callback in `JobQueue._move_to_dead_letter()`. | `OPEN` |
| **DEF-LOC-B04** | `src/storage/adapter.py` | Production remote Turso pipeline requires verified cloud token; offline dev uses SQLite. | Architectural environment bifurcation. | **LOW** | Developer must ensure `.env` has valid Turso token before enabling `VERCEL_ENV=production`. | Fail-closed guard verified in `test_storage_adapter.py`. | `CONTROL ACTIVE` |
