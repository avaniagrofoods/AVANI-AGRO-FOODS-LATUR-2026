# AVANI AGRO FOODS - Zoho Business Operating System (BOS) Plan

## 1. Zoho CRM Complete Setup (Field by Field)

### Modules to Enable:
- **Leads**: Initial inquiries (Website, WhatsApp, TradeIndia)
- **Contacts**: Qualified buyers with whom you are communicating
- **Accounts**: Companies (Importers, Distributors)
- **Deals**: Active negotiations/quotations sent
- **Tasks**: Follow-ups and operations

### Custom Fields Needed (Leads Module)

| Field Name | Field Type | Purpose / Values |
| :--- | :--- | :--- |
| **Buyer Type** | Picklist | Importer, Distributor, Wholesaler, Manufacturer |
| **Country** | Picklist/Text | To track export destination |
| **Product Interest** | Picklist | Onion Powder, Moringa Powder, Jaggery, etc. |
| **MOQ Requirement** | Text/Number | Minimum Order Quantity requested by buyer |
| **Price Range** | Currency | Target price range expected by buyer |
| **Inquiry Source** | Picklist | Website, WhatsApp, Email, TradeIndia, Alibaba, Direct |

---

## 2. Website Integration with CRM

1. **Zoho Webforms**: Go to CRM Setup > Developer Space > Webforms. Generate a form for "Inquiry" mapping to the Leads module.
2. **Website Placement**: Embed the HTML/iframe of the Zoho form on `avaniagrofoods.com` (Contact Us & Request Quote sections).
3. **Auto Assignment Rule**: Go to CRM Setup > Automation > Assignment Rules. Create a rule: *If Inquiry Source = Website, Assign to User: Sachin Shinde*.

---

## 3. Manual vs Automation Modes

### Manual Mode
- **Adding Leads**: Click "+" in the Leads module. Fill in Buyer details manually.
- **Tracking Deals**: Drag and drop Deal cards across stages on the Kanban board.
- **Follow-up**: Manually create "Task: Call Buyer" and log call outcomes.

### Automation Mode (To Build)
- **Auto-Lead Capture**: Leads flow directly from Website/WhatsApp into CRM.
- **Auto-Email Trigger**: When a new Lead is created, Zoho sends an automatic "Thank you for your inquiry, here is our catalog" email.
- **Deal Stage Automation**: Moving a deal to "Quotation Sent" automatically creates a task to "Follow up in 3 days."

---

## 4. Email System Setup (Professional)

1. **Zoho Mail Config**: Add `avaniagrofoods.com` to Zoho Mail admin panel.
2. **DNS Records (Mandatory)**: 
   - Add **MX Records** to Hostinger/Vercel DNS (Zoho servers).
   - Add **SPF** (`v=spf1 include:zoho.in ~all`).
   - Add **DKIM** (Generate in Zoho, add TXT to DNS).
   - Add **DMARC** policy.
3. **CRM Integration**: Enable IMAP in Zoho CRM so all emails sent/received from `sales@avaniagrofoods.com` appear under the respective Lead/Contact record.
4. **Templates**: Create templates in CRM for: (a) Intro/Catalog, (b) Standard Quotation, (c) Follow-up 1, 2.

---

## 5. WhatsApp Business Integration

1. **Provider**: Use Zoho's native WhatsApp Business API integration or a partner like WATI/Interakt.
2. **Setup**: Connect your business number (+91 7219053645) to the Meta Business Manager and link to Zoho.
3. **Automations**:
   - Welcome message auto-reply.
   - Any incoming WhatsApp message from an unknown number creates a Lead in Zoho.
   - Use Zoho Workflow to send a WhatsApp notification when an order is shipped.

---

## 6. Lead Pipeline & Sales Funnel

Set this up in **Deals > Pipelines**.

| Stage Name | Action to Take | Automation Triggered |
| :--- | :--- | :--- |
| **New Lead** | Review requirement, verify MOQ. | Send Auto-Intro Email/WhatsApp. |
| **Contacted** | Call buyer, understand timeline. | Create follow-up task for 2 days. |
| **Qualified** | Confirm pricing and terms. | Notify Operations team of potential order. |
| **Negotiation** | Send Proforma Invoice / Quotation. | Email Template: "Quotation Attached". |
| **Closed Won** | Advance payment received. | Move to Operations/Export tracking. |
| **Closed Lost**| Buyer rejected price/ghosted. | Add to "Nurture Email Campaign". |

---

## 7. Export Business Automation System

- **Quotation System**: Use Zoho Inventory / Zoho Books (included in Zoho One) to generate professional Proforma Invoices automatically linked to the Deal.
- **Document Workflow**: Use Zoho WorkDrive to create folders per Account for Invoice, Packing List, Phyto-sanitary certs, and BL.
- **Order Tracking**: Create a custom module in CRM called "Export Orders" to track Container status, Port of Loading, and ETA.

---

## 8. Team Workflow System

- **Sales Role**: Access to Leads, Contacts, Deals. Can send quotes.
- **Operations Role**: Access to Export Orders, Documents. Cannot see Lead source or modify pricing.
- **Accounts Role**: Access to Zoho Books, Invoices, Payment tracking.
- **Daily Dashboard**: Setup a custom Home Screen showing "My Open Tasks", "Leads Today", "Pending Quotations".

---

## 9. Dashboards & Reports

Go to CRM > Analytics to build these components:
1. **Daily Leads Tracker**: Bar chart of Leads grouped by `Inquiry Source`.
2. **Conversion Rate**: Funnel chart from Lead -> Contact -> Closed Won.
3. **Revenue Dashboard**: Gauge chart of Revenue (Closed Won Deals) vs. ₹1CR Monthly Goal.
4. **Country-wise Sales**: Map chart showing Deals grouped by `Country`.

---

## 10. Step-by-Step Implementation Roadmap (Day 1 - 7)

- **Day 1: Basic Structure.** Create Custom Fields in Leads, Contacts, Deals. Setup Pipeline Stages.
- **Day 2: Email & Domain.** Authenticate `avaniagrofoods.com` in Zoho Mail (MX, SPF, DKIM). Connect email to CRM.
- **Day 3: Website Forms.** Generate Zoho Forms and embed them on the website. Test data flow.
- **Day 4: WhatsApp API.** Link Meta WhatsApp Business API to CRM. Create standard message templates.
- **Day 5: Quotation & Finance.** Setup Zoho Books. Create the Proforma Invoice template with Avani branding and bank details.
- **Day 6: Automations.** Create workflow rules (Auto-emails, auto-task assignment).
- **Day 7: Dashboards & Training.** Build Analytics dashboards. Run a mock test from Website Lead -> WhatsApp Chat -> Quotation -> Closed Won.
