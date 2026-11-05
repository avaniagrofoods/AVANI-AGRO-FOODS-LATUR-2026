# AVANI AGRO FOODS — PRODUCTION OPERATIONS MANUAL & CHECKLIST

**Document Reference:** `AAF-OPS-2026-1105`  
**Target Organization:** AVANI AGRO FOODS, Latur, Maharashtra, India  
**Trade Coordinator:** Sachin Shinde  
**Contact Channels:** [sales@avaniagrofoods.com](mailto:sales@avaniagrofoods.com) | +91 7219053645  
**Production Platform:** [https://www.avaniagrofoods.com/](https://www.avaniagrofoods.com/)  
**Primary Database:** Supabase PostgreSQL (`zqemrmzijlaysvfxygst`)  
**Email Platform:** Zoho Mail India (`mail.zoho.in`)

---

## 1. Daily Operations Checklist (Trade Coordinator / Sales Desk)

Every morning and afternoon, the Trade Coordinator should follow this routine:

- [ ] **Check Zoho Webmail (`sales@avaniagrofoods.com`):**
  1. Open [Zoho Mail](https://mail.zoho.in) and review the Inbox for new incoming RFQs and buyer replies.
  2. Each live enquiry generates an automated alert with subject `[AVANI RFQ] New Lead: AAF-INQ-2026-XXXXXX`.
- [ ] **Review Primary Lead Database (Supabase / Admin Portal):**
  1. Access the [Supabase Table Editor](https://supabase.com/dashboard/project/zqemrmzijlaysvfxygst/editor) > `public.leads`.
  2. Filter by `status = 'NEW_ENQUIRY'`.
  3. Verify buyer requirement: Product, Quantity, Incoterm, Destination Port, and Application.
- [ ] **Review Auto-Calculated Quotation Drafts:**
  1. For each new enquiry, review the automatically generated quotation ID (`AAF-Q-2026-XXXX`).
  2. Verify line item pricing against current market raw material rates in Maharashtra.
- [ ] **Buyer Follow-Up via WhatsApp / Email:**
  1. Send formal commercial introduction and batch Certificate of Analysis (COA) to qualified buyers.
  2. If buyer provided a phone number, send WhatsApp greeting from `+91 7219053645`.

---

## 2. Standard B2B CRM Pipeline Management (11 Stages)

Follow this forward state progression for all active commercial opportunities:

```
[NEW_ENQUIRY]
      │
      ▼
 [QUALIFIED]
      │
      ▼
[SUPPLIER_CONFIRMATION_PENDING]
      │
      ▼
[SPECIFICATION_SHARED]
      │
      ▼
[QUOTATION_PREPARATION]
      │
      ▼
[QUOTATION_SENT]
      │
      ▼
[FOLLOWUP_PENDING]
      │
      ▼
[SAMPLE_REQUESTED]
      │
      ▼
  [NEGOTIATION]
      │
      ├────────────────────────┐
      ▼                        ▼
[ORDER_RECEIVED]      [LOST_NOT_QUALIFIED]
```

### Stage Action Rules:
1. **`NEW_ENQUIRY`:** Initial unverified lead from website RFQ form.
2. **`QUALIFIED`:** Minimum Order Quantity (MOQ) verified (e.g. >= 500 KG), buyer commercial identity verified.
3. **`SUPPLIER_CONFIRMATION_PENDING`:** Factory floor batch availability and processing capacity confirmed in Latur/Nashik belt.
4. **`SPECIFICATION_SHARED`:** Technical specification sheet (mesh, moisture, microbiological limits) sent to buyer.
5. **`QUOTATION_PREPARATION`:** Custom ocean freight (Nhava Sheva to destination port) and insurance calculated.
6. **`QUOTATION_SENT`:** Formal commercial quote with validity date dispatched to buyer.
7. **`FOLLOWUP_PENDING`:** Scheduled follow-up within 48–72 hours.
8. **`SAMPLE_REQUESTED`:** 50g–100g courier sample dispatched via DHL/FedEx with tracking number.
9. **`NEGOTIATION`:** Commercial terms, payment terms (50% advance / balance on BL), and delivery timeline finalized.
10. **`ORDER_RECEIVED`:** Formal Purchase Order (PO) or Irrevocable LC received from buyer.
11. **`LOST_NOT_QUALIFIED`:** Enquiry disqualified due to sub-MOQ, non-commercial use, or unresponsiveness.

---

## 3. Weekly Operational Checklist

- [ ] **RFC 4180 CSV Lead Export:**
  1. Access the Admin Quotations portal or export script.
  2. Click **Export CSV** to download the standardized 15-column lead export with UTF-8 BOM encoding.
  3. Archive the CSV in your secure commercial offline records.
- [ ] **Secondary Ledger Audit:**
  1. Inspect the linked Google Sheets CRM workbook (`Customer Inquiries` and `Quotations` sheets).
  2. Ensure all rows match the Supabase primary store.

---

## 4. Emergency Procedures & Incident Response

### Scenario A: Vercel Production Rollback
If an unexpected issue occurs with a future website update:
1. Open the [Vercel Deployments Dashboard](https://vercel.com/avaniagrofoods1356-4705s-projects/avani-agro-foods-latur-2026).
2. Locate the previous stable production deployment:
   - Deployment ID: `dpl_EU6J6usdzx7vPSmwmiCEMhLfhhHM` (Commit `60ec947`).
3. Click the three dots `...` next to the deployment > **Promote to Production**.
4. The site will instantly (<5s) revert with zero downtime.

### Scenario B: Database Key Rotation
If a Supabase service key needs rotation in the future:
1. Go to [Supabase API Settings](https://supabase.com/dashboard/project/zqemrmzijlaysvfxygst/settings/api).
2. Click **+ New secret key** to create a replacement key.
3. Go to [Vercel Environment Variables](https://vercel.com/avaniagrofoods1356-4705s-projects/avani-agro-foods-latur-2026/settings/environment-variables).
4. Update `SUPABASE_SERVICE_ROLE_KEY` with the new secret and save.
5. In Supabase, delete/revoke the retired key.

### Scenario C: Database Restoration / Lead Recovery
If database recovery is ever needed:
1. Historical backups are securely archived in `docs/backups/`.
2. Run non-destructive test:
   ```bash
   node scripts/migrate_historical_leads_to_supabase.cjs --dry-run
   ```
3. Run live restoration:
   ```bash
   node scripts/migrate_historical_leads_to_supabase.cjs
   ```
