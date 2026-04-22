# Avani Agro Foods — System Synchronization & Maintenance Checklist

This document provides a comprehensive, field-by-field manual checklist to verify that all systems (Vercel, GitHub, Hostinger, Zoho CRM, EmailJS, Google Sheets, and WhatsApp) are perfectly synchronized. 

Keep this document for future records. Run through this checklist whenever you make major changes to the website or if any system stops responding.

---

## 1. Hosting & Deployment Synchronization (GitHub & Vercel)
**Frequency of Checking:** After every code push or major site update.
**Working Website:** `https://avaniagrofoods.com`
**Vercel Dashboard:** `https://vercel.com/dashboard`

| Checkpoint | Path / Field to Check | Status / Expected Value |
| :--- | :--- | :--- |
| **GitHub Sync** | Local Code -> `git status` -> `git push origin main` | Terminal should say "up to date with origin/main". |
| **Vercel Build** | Vercel Dashboard -> Project -> Deployments | Status should be **Ready**. Check logs for 0 errors. |
| **Vercel Domains** | Vercel Dashboard -> Settings -> Domains | `avaniagrofoods.com` & `www.avaniagrofoods.com` must show **Valid Configuration**. |
| **Environment Variables** | Vercel -> Settings -> Environment Variables | All variables from local `.env.local` must be exactly mirrored here (e.g., `VITE_EMAILJS_SERVICE_ID`, `VITE_ZOHO_ORG_ID`). |
| **Routing (vercel.json)** | Project Root -> `vercel.json` | Must contain `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` for React routing to work on refresh. |

---

## 2. DNS & Domain Synchronization (Hostinger)
**Frequency of Checking:** Only if the website goes down, emails fail to receive, or SSL breaks.
**Hostinger Dashboard:** `hpanel.hostinger.com`

| Checkpoint | Path / Field to Check | Status / Expected Value |
| :--- | :--- | :--- |
| **A Record (Root)** | DNS Zone Editor -> `A` Record for `@` | Points to Vercel IP: `76.76.21.21` |
| **CNAME (www)** | DNS Zone Editor -> `CNAME` for `www` | Points to `cname.vercel-dns.com` |
| **MX Records (Email)** | DNS Zone Editor -> `MX` Records | Must point to Hostinger Titan Email servers (e.g., `mx1.titan.email`). Do NOT delete these or `sales@` emails will stop working. |
| **SSL Certificate** | Vercel Domains tab & Browser URL bar | Must show the padlock icon `🔒` (HTTPS). |

---

## 3. CRM Lead Synchronization (Zoho CRM)
**Frequency of Checking:** Monthly, or if leads stop appearing in Zoho.
**Zoho Dashboard:** `crm.zoho.in`

| Checkpoint | Path / Field to Check | Status / Expected Value |
| :--- | :--- | :--- |
| **Web-to-Lead API** | `Contact.jsx` / `B2BRegistration.jsx` | Endpoint must be `https://crm.zoho.in/crm/WebToLeadForm` (ensure `.in` is used for India accounts). |
| **Org ID** | `.env.local` -> `VITE_ZOHO_ORG_ID` | Must perfectly match the value from Zoho's Web-to-Lead form builder (`xnQsjsdp`). |
| **Validation ID** | `.env.local` -> `VITE_ZOHO_VALIDATION_ID` | Must match Zoho's generated ID (`xmIwtLD`). |
| **Field Mapping** | `Contact.jsx` API payload | Fields must perfectly match Zoho's standard fields (e.g., `First Name`, `Last Name`, `Email`, `Description`). |

---

## 4. Email Notification Synchronization (EmailJS)
**Frequency of Checking:** Weekly, by submitting a test form on the Contact page.
**EmailJS Dashboard:** `dashboard.emailjs.com`

| Checkpoint | Path / Field to Check | Status / Expected Value |
| :--- | :--- | :--- |
| **Public Key** | `.env.local` -> `VITE_EMAILJS_PUBLIC_KEY` | Must match EmailJS Account -> API Keys (`keeklL2S-cJ4zYcyV`). |
| **Service ID** | `.env.local` -> `VITE_EMAILJS_SERVICE_ID` | Must match EmailJS Email Services (`service_ez4cafu`). |
| **Templates** | `src/lib/emailjs.js` | Templates must exist in EmailJS (e.g., `template_or9d6zk`, `template_g9rnfik`). |
| **Destination Email**| EmailJS Dashboard -> Templates -> To Email | Must be hardcoded to `sales@avaniagrofoods.com` or dynamically pull `{{to_email}}`. |

---

## 5. Google Sheets Webhook Synchronization
**Frequency of Checking:** Weekly, by checking the linked Google Sheet.

| Checkpoint | Path / Field to Check | Status / Expected Value |
| :--- | :--- | :--- |
| **Webhook URL** | `.env.local` -> `VITE_GOOGLE_SHEETS_WEBHOOK` | Must be a valid `script.google.com/macros/s/.../exec` link. |
| **Apps Script Deployment**| Google Sheet -> Extensions -> Apps Script | Must be deployed as a "Web App" accessible to "Anyone". |
| **Header Names** | Google Sheet Row 1 | Column names must match the JSON keys sent from React (`timestamp`, `firstName`, `email`, `inquiryType`, etc.). |

---

## 6. WhatsApp Business Synchronization
**Frequency of Checking:** Periodically check if clicking WhatsApp links opens the correct chat.

| Checkpoint | Path / Field to Check | Status / Expected Value |
| :--- | :--- | :--- |
| **Phone Number** | `.env.local` -> `VITE_OWNER_PHONE` | Format must be country code + number with NO spaces or `+` sign (e.g., `917219053645`). |
| **WhatsApp Links** | `src/data/links.js` | Must compile to `https://wa.me/917219053645`. |
| **Bubble Widget** | Mobile & Desktop Site | Clicking the floating green bubble should immediately prompt WhatsApp Web or the App. |

---

### Final Auto-Mode Verification Summary
On your local machine, the code is structurally sound:
1. `npm run build` executes without errors (verified: `Exit code 0`).
2. CSS print styling for `QuotationBuilder.jsx` is corrected and aligned.
3. Mobile view overflow on `About.jsx` is successfully contained.
4. Redirection logic in `Contact.jsx` is functioning with Admin access enabled.

**Next Steps for the Owner:**
Commit these changes to GitHub (`git add .`, `git commit -m "UI Updates"`, `git push`). Vercel will automatically synchronize and deploy the updates live to `avaniagrofoods.com`.
