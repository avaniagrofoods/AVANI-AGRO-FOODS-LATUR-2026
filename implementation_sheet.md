# Avani Agro Foods Latur — Implementation Sheet

This document contains all critical technical data, credentials, and workflow logic for the Avani Agro Foods platform as of **April 18, 2026**.

## 1. Key Platform URLs
- **Production URL**: [avani-agro-foods-latur-2026.vercel.app](https://avani-agro-foods-latur-2026.vercel.app/)
- **B2B Store**: [affiliate#register](https://avani-agro-foods-latur-2026.vercel.app/affiliate#register)
- **Quotation Sheet**: [quotation-sheet](https://avani-agro-foods-latur-2026.vercel.app/quotation-sheet) (Password Protected)
- **About / Sachin Shinde**: [about](https://avani-agro-foods-latur-2026.vercel.app/about)

## 2. Core Credentials
> [!IMPORTANT]
> Keep these credentials secure. Do not share the Quotation Password publicly.

| Item | Value |
| :--- | :--- |
| **Quotation Sheet Password** | `Samarth@1356` |
| **Zoho CRM ID** | `avaniagrofoods1356@gmail.com` |
| **Zoho CRM User ID** | `60068319098` |
| **CRM Password** | `Samarth@1356` |
| **Admin Email** | `avaniagrofoods1356@gmail.com` |
| **Support WhatsApp** | `+91 72190 53645` |

## 3. Automated Workflows ("Auto Mode")

### A. B2B Registration Flow
1. **Details**: User enters company registration and business type.
2. **Subscription**: User selects a plan (Starter/Growth/Lifetime).
3. **Payment**: User is directed to **Stripe** secure payment links.
4. **Email Sync**: Detailed registration data (Company, Mobile, Plan) is sent to `avaniagrofoods1356@gmail.com`.
5. **CRM Capture**: Emails received at the admin address are automatically parsed into **Zoho CRM Leads**.

### B. Bulk Quotation Flow
1. **Inquiry Form**: Replaces direct links on the Products page.
2. **Email Trigger**: Form submission triggers **EmailJS** (Service: `service_ez4cafu`).
3. **Verification**: 5-second countdown displays a success state.
4. **Protected Access**: Redirects to the **Password Gate** to view the live quotation sheet.

## 4. Third-Party Integrations

### EmailJS (Lead Distribution)
- **Service ID**: `service_ez4cafu`
- **Template ID**: `template_quote`
- **Public Key**: `_Wv_5hP6P1_aI3-Z0` (Client-side)

### Amazon Affiliate Links
- **Global Markets**: [Central Associate Link](https://www.amazon.com/b?node=53629917011)
- **India Markets**: [Organic India Moringa](https://tinyurl.com/ywenv6wz) | [Himalayan Organics](https://tinyurl.com/efttfn8x)

## 5. Maintenance Guide
- **Updating Prices**: Modify `src/pages/QuotationSheet.jsx`.
- **Replacing सचिन शिंदे Photo**: Place a new `sachin.jpg` in the `public` folder.
- **Adding Products**: Add entry to the `PRODUCTS` array in `src/pages/Products.jsx`.

---
*Document prepared by Antigravity AI for Avani Agro Foods Latur.*
