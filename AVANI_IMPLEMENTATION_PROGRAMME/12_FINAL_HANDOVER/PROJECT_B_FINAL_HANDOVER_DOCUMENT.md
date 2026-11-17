# PROJECT B FINAL HANDOVER DOCUMENT
## AVANI AGRO INTELLIGENCE — PRODUCTION RUNBOOK & OPERATIONAL HANDOVER

**Application:** AVANI AGRO INTELLIGENCE (Project B)  
**Handover Recipient:** Sachin Shinde – Founder & CEO  
**Author:** Antigravity Principal Python Systems Architect  
**Handover Date:** 17 November 2026  
**Status:** FULL PRODUCTION OPERATIONAL HANDOVER  

---

## 1. SYSTEM IDENTITY & REPOSITORIES

- **Local Working Root:** `C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\AVANI_AGRO_INTELLIGENCE`
- **GitHub Repository:** `https://github.com/avaniagrofoods/AVANI-AGRO-INTELLIGENCE.git`
- **Active Git Commit:** `6067997` on branch `main`
- **Python Runtime:** Python 3.14.5 (Host executable: `C:\Python314\python.exe`)
- **Database Engine:** Embedded SQLite 3 (WAL mode) / Turso libSQL Cloud Pipeline
- **Outreach Service:** Sender.net / Resend API Client

---

## 2. PRODUCTION RUNBOOK & OPERATIONS

### 2.1 Running Automated Test Suite
```powershell
# Navigate to Project B root
cd "C:\Users\ALPHA-1\Downloads\21MAY2026\SACHIN SHINDE DOCUMENTS\DEVELOPEMENT TOOLS\AVANI_AGRO_INTELLIGENCE"

# Execute all 151 unit and integration tests
C:\Python314\python.exe -m unittest discover -s tests -p "test_*.py" -v
# Output should report 151 tests OK in ~12.8 seconds
```

### 2.2 Ingesting and Managing Verified B2B Buyer Leads
1. Source verified buyers from `AVANI_IMPLEMENTATION_PROGRAMME/09_B2B_BUYER_ACQUISITION/VERIFIED_BUYER_DATABASE.csv`.
2. Execute the company and contact ingestion script:
   ```powershell
   C:\Python314\python.exe -m src.cli.ingest_buyers --csv "..\2-AVANI AGRO FOODS LATUR 2026\AVANI_IMPLEMENTATION_PROGRAMME\09_B2B_BUYER_ACQUISITION\VERIFIED_BUYER_DATABASE.csv"
   ```
3. Leads are automatically normalized, deduplicated, and associated with company records in SQLite/libSQL.

### 2.3 Starting Background Task Queue Worker
```powershell
# Run the queue worker process
C:\Python314\python.exe -m src.queue.worker --poll-interval 10
# Worker claims pending jobs with fencing leases and executes multi-step email sequences.
```

### 2.4 Handling Unsubscribes & Compliance
- The worker automatically verifies every contact against `suppression_registry` prior to dispatching any outreach message.
- If a buyer clicks the unsubscribe link, the webhook endpoint adds the email hash to `suppression_registry` and immediately terminates all active sequence enrollments.

---

## 3. FAIL-CLOSED SECURITY INVARIANTS

1. **Production URL Security:** The storage adapter automatically rejects unencrypted `http://` URLs in production.
2. **Token Diversity:** Short or low-entropy bearer tokens are rejected on startup.
3. **Secret Redaction:** Transport errors, timeouts, and network exceptions scrub all credentials before emitting logs.
4. **Svix Webhook Verification:** All incoming webhooks must include valid HMAC-SHA256 signatures within a 5-minute replay window.

---

## 4. ARCHIVE & BACKUP RUNBOOK

```powershell
# Perform atomic hot backup of SQLite database in WAL mode
sqlite3 data\avani_intelligence.db ".backup 'backups\avani_intelligence_backup_$(Get-Date -Format yyyyMMdd).db'"
```

---
*Document Accepted & Transferred by Principal Python Systems Architect to Sachin Shinde, Founder & CEO.*
