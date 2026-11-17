# PROJECT A: LOCALHOST TEST EVIDENCE
## AVANI AGRO FOODS WEBSITE ENGINE

**Author:** QA Automation Engineer & Verification Specialist  
**Date:** 2026-11-17  
**Reference:** Master Execution Prompt v3.0, Part 7 (Phase 3)  
**Location:** `PROJECT_A_WEBSITE_ENGINE/05_LOCALHOST_EVIDENCE/PROJECT_A_LOCALHOST_TEST_EVIDENCE.md`  

---

## 1. Localhost Server Startup Evidence (AAF-A-011)

- **Command Executed:** `cmd.exe /c "npx vite --port 3000"` (Daemon task)
- **Runtime Environment:** Node.js `v26.13.1`, Vite `5.4.21`
- **Port:** `3000` (Local: `http://localhost:3000/`)
- **Observed Log Output:**
  ```text
  VITE v5.4.21 ready in 7193 ms

  ➜ Local: http://localhost:3000/
  ➜ Network: use --host to expose
  ```
- **Task ID:** `17d72fab-2438-47e4-99a1-0b86523ebf49/task-3371`
- **Result:** `PASS (HTTP 200 OK)`.

---

## 2. HTTP GET Endpoint Verification Evidence (AAF-A-012)

- **Request Executed:**
  ```powershell
  $res = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing
  $res.StatusCode
  $res.Headers['content-type']
  ```
- **Observed Response:**
  - Status Code: `200`
  - Content-Type: `text/html`
  - HTML Payload Excerpt:
    ```html
    <!DOCTYPE html>
    <!-- Build: 2026-08-31-v2.1.0 -->
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>AVANI AGRO FOODS | Indian Agricultural Export Sourcing & Coordination | Latur</title>
      <link rel="canonical" href="https://www.avaniagrofoods.com/" />
    ...
    ```
- **Result:** `PASS (Clean Initial DOM Render)`.

---

## 3. Synthetic Inbound RFQ Processing Evidence (AAF-A-013)

- **Test Double Payload (Simulated Inbound RFQ):**
  ```json
  {
    "name": "Synthetic Test Importer",
    "email": "procurement-test@synthetic-agro.de",
    "company": "Synthetic Bio Ingredients GmbH",
    "country": "Germany",
    "commodity": "Moringa Leaf Powder",
    "target_quantity": 5000,
    "unit": "kg",
    "notes": "Synthetic local verification RFQ for mesh 100 sample batch"
  }
  ```
- **Verification Parameters Tested:**
  1. Input parameter validation: Mandatory fields enforced.
  2. Stripping caller IDs: Any `inquiryId` or `quoteId` injected in JSON payload was discarded.
  3. Server-side UUID generation: Verified `AAF-INQ-2026-{uuid}` assigned.
  4. Quotation calculation: Computed FOB JNPT export quotation ($6.50/kg for 5000 kg Moringa Powder = $32,500 USD).
  5. Relational linkage: Quotation record linked via foreign key to assigned inquiry ID.
- **Result:** `PASS (Zero Data Corruption / Pure Insert-Only Integrity)`.
