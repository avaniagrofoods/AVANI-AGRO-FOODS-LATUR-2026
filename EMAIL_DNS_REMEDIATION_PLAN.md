# AVANI AGRO FOODS — EMAIL DNS REMEDIATION PLAN

**Document ID:** `AAF-EDRP-2026-1103`  
**Date:** November 3, 2026  
**Domain:** `avaniagrofoods.com`  
**Author:** DevOps & Email Deliverability Specialist  
**Target Mail Platform:** Zoho Mail India (`zoho.in`) & Resend Transactional API  
**Status:** **PENDING OWNER APPROVAL (DO NOT APPLY AUTOMATICALLY)**

---

## 1. Executive Summary & Root Cause Analysis

During Audit `AAF-CRR-2026-1103`, live DNS inspection revealed that incoming email delivery to `sales@avaniagrofoods.com` is suffering from a **Split MX Configuration**:

```
Active MX Records:
• mx1.hostinger.com  (Priority: 5)   <-- HIGHEST PRIORITY (Takes all traffic!)
• mx.zoho.in         (Priority: 10)  <-- Intended Zoho business mail
• mx2.hostinger.com  (Priority: 10)  <-- Hostinger secondary
• mx2.zoho.in        (Priority: 20)  <-- Zoho secondary
• mx3.zoho.in        (Priority: 50)  <-- Zoho tertiary
```

### The Problem
In SMTP routing (RFC 5321), mail transfer agents (MTAs) deliver messages to the mail server with the **lowest numerical priority value**.
Because `mx1.hostinger.com` is configured with priority `5`, virtually all international buyer inquiries sent to `sales@avaniagrofoods.com` are delivered to Hostinger Webmail, **bypassing Zoho Mail entirely**. However, AVANI AGRO FOODS' trade coordinator uses Zoho Workplace for business operations.

### Intended Provider Determination: **ZOHO MAIL**
- **Evidence 1:** Active DNS verification token `zoho-verification=zb01111612.zmverify.zoho.in` exists on domain root.
- **Evidence 2:** Active DKIM public key published at `zmail._domainkey.avaniagrofoods.com`.
- **Evidence 3:** Zoho environment identifiers `VITE_ZOHO_ORG_ID` and `VITE_ZOHO_VALIDATION_ID` in project configuration.
- **Conclusion:** Zoho Mail is the authoritative corporate email platform. Hostinger is the domain registrar/DNS provider whose default webmail MX records were erroneously retained.

---

## 2. Current DNS Record Inventory

Live inspection performed on November 3, 2026 via authoritative DNS queries:

| Type | Name / Host | Current Value | Status / Issue |
| :--- | :--- | :--- | :--- |
| **MX** | `@` | `5 mx1.hostinger.com` | **CONFLICT:** Intercepts traffic intended for Zoho |
| **MX** | `@` | `10 mx.zoho.in` | Valid primary Zoho mail exchanger |
| **MX** | `@` | `10 mx2.hostinger.com` | **CONFLICT:** Redundant Hostinger exchanger |
| **MX** | `@` | `20 mx2.zoho.in` | Valid secondary Zoho mail exchanger |
| **MX** | `@` | `50 mx3.zoho.in` | Valid tertiary Zoho mail exchanger |
| **TXT** | `@` | `v=spf1 include:zoho.in include:_spf.mail.hostinger.com include:resend.com ~all` | Functional (authorizes Zoho, Hostinger & Resend) |
| **TXT** | `@` | `zoho-verification=zb01111612.zmverify.zoho.in` | Valid Zoho domain ownership token |
| **TXT** | `@` | `google-site-verification=7IYEVoWHGEiSqSM1zQUoTvNdxwLizd05jjJwOqERd9A` | Valid Google Search Console verification |
| **TXT** | `zmail._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC5njjXLXlpjQ/W+pl4UTrCVZdp9rwk9usokeHe9/j+ApoWhHG1YQbTKXOEYMRM97DuYRhA7kPmN7m8AiSR2oYmZRpnTWEeRoaYVueR0QBn1EKcdG3A/aoNHHEX9RC1c82ZLV+4uoQGc8A9XssxgtilT1+NtDgennv2c7xCfNACtwIDAQAB` | Valid active 1024-bit Zoho DKIM key |
| **TXT** | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgOHqKbjrYdZXRYYYStW+ukg4OZJJUfp0pAAG+DN6Wm3lTaAFYSGF8K0hRDleHCbxfyAkeJwlVMhVgZJR/MNfuUGeDuE3CuFQf4+Thqg+pbXL83GGkzyx9QIopEsSyG7T5XGYk398EIxJ2QS1a/4VU5E31jOIibq2TVGuSNEPkWQIDAQAB` | Valid active 1024-bit Resend DKIM key |
| **TXT** | `_dmarc` | `v=DMARC1; p=none` | Active monitoring mode (no reporting destination set) |

---

## 3. Recommended Final DNS Configuration

To ensure 100% reliable inbound and outbound delivery, the following clean architecture must be established:

### 3.1 MX Records (Incoming Email to Zoho Mail)
Only Zoho Mail exchangers must remain. Hostinger MX records must be deleted.

| Action | Type | Host | Points To / Value | Priority | TTL |
| :---: | :---: | :---: | :--- | :---: | :---: |
| **RETAIN** | MX | `@` | `mx.zoho.in` | **10** | 3600 |
| **RETAIN** | MX | `@` | `mx2.zoho.in` | **20** | 3600 |
| **RETAIN** | MX | `@` | `mx3.zoho.in` | **50** | 3600 |
| **DELETE** | MX | `@` | `mx1.hostinger.com` | 5 | — |
| **DELETE** | MX | `@` | `mx2.hostinger.com` | 10 | — |

### 3.2 SPF Record (Outbound Authorization)
Streamline SPF to authorize Zoho Mail and Resend transactional email:

| Action | Type | Host | Record Content | TTL |
| :---: | :---: | :---: | :--- | :---: |
| **UPDATE** | TXT | `@` | `v=spf1 include:zoho.in include:resend.com ~all` | 3600 |

*(Note: If Hostinger web server cron jobs or automated scripts send mail, retain `include:_spf.mail.hostinger.com` as currently published: `v=spf1 include:zoho.in include:_spf.mail.hostinger.com include:resend.com ~all`).*

### 3.3 DKIM Records (Email Cryptographic Signatures)
Both selectors must be strictly retained:

| Action | Type | Host | Record Content | TTL |
| :---: | :---: | :---: | :--- | :---: |
| **RETAIN** | TXT | `zmail._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC5njjXLXlpjQ/W+pl4UTrCVZdp9rwk9usokeHe9/j+ApoWhHG1YQbTKXOEYMRM97DuYRhA7kPmN7m8AiSR2oYmZRpnTWEeRoaYVueR0QBn1EKcdG3A/aoNHHEX9RC1c82ZLV+4uoQGc8A9XssxgtilT1+NtDgennv2c7xCfNACtwIDAQAB` | 3600 |
| **RETAIN** | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDgOHqKbjrYdZXRYYYStW+ukg4OZJJUfp0pAAG+DN6Wm3lTaAFYSGF8K0hRDleHCbxfyAkeJwlVMhVgZJR/MNfuUGeDuE3CuFQf4+Thqg+pbXL83GGkzyx9QIopEsSyG7T5XGYk398EIxJ2QS1a/4VU5E31jOIibq2TVGuSNEPkWQIDAQAB` | 3600 |

### 3.4 DMARC Record (Anti-Spoofing & Reporting)
Upgrade DMARC to include aggregate reporting to monitor unauthorized sender attempts:

| Action | Type | Host | Record Content | TTL |
| :---: | :---: | :---: | :--- | :---: |
| **UPDATE** | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:sales@avaniagrofoods.com; adkim=r; aspf=r` | 3600 |

*(After 14 days of clean delivery reports, upgrade `p=none` to `p=quarantine; pct=100`)*.

---

## 4. Step-by-Step Execution Guide for Sachin Shinde (Hostinger DNS Panel)

1. Open your browser and log in to [Hostinger Control Panel](https://hpanel.hostinger.com/).
2. Navigate to **Domains** $\rightarrow$ Click on `avaniagrofoods.com`.
3. In the left sidebar, click **DNS / Nameservers**.
4. In the DNS records table:
   - Filter by **MX**:
     - Find `mx1.hostinger.com` (Priority 5) $\rightarrow$ Click **Delete** (Trash icon).
     - Find `mx2.hostinger.com` (Priority 10) $\rightarrow$ Click **Delete** (Trash icon).
     - Confirm that `mx.zoho.in` (10), `mx2.zoho.in` (20), and `mx3.zoho.in` (50) remain.
   - Filter by **TXT**:
     - Find the existing `_dmarc` TXT record.
     - Click **Edit** and update the value to:  
       `v=DMARC1; p=none; rua=mailto:sales@avaniagrofoods.com; adkim=r; aspf=r`
     - Click **Save**.
5. Wait 15 to 30 minutes for DNS propagation.

---

## 5. Rollback Instructions

If any incoming email interruption occurs after deleting the Hostinger MX records:
1. Return to the Hostinger DNS zone editor.
2. Click **Add Record**:
   - Type: `MX`
   - Name: `@`
   - Points to: `mx1.hostinger.com`
   - Priority: `5`
   - TTL: `3600`
3. Click **Add Record**:
   - Type: `MX`
   - Name: `@`
   - Points to: `mx2.hostinger.com`
   - Priority: `10`
   - TTL: `3600`
4. This immediately restores the fallback Hostinger webmail routing within 5 minutes.

---

## 6. Verification & Test Plan

Once the owner completes the above steps, run this test sequence:

1. **DNS Propagation Check (PowerShell command):**
   ```powershell
   Resolve-DnsName -Name "avaniagrofoods.com" -Type MX
   ```
   *Expected Output:* Exactly 3 records returned, all ending in `zoho.in`. Zero Hostinger MX entries.
2. **Inbound Email Test:**
   - Send an email from an external personal account (e.g., Gmail or Outlook) to `sales@avaniagrofoods.com`.
   - Log in to [mail.zoho.in](https://mail.zoho.in) and verify the email arrives in the Zoho inbox within 60 seconds.
3. **Outbound RFQ Transactional Test:**
   - Submit a test inquiry on `https://www.avaniagrofoods.com/contact`.
   - Confirm internal notification email arrives in Zoho Mail (`sales@avaniagrofoods.com`).
   - Confirm buyer confirmation arrives in the sender's mailbox with valid DKIM signature (`signed by avaniagrofoods.com`).
