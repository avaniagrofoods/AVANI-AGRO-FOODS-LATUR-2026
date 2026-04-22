# Google Search Console & Analytics: Field-by-Field Setup Guide
**Project:** Avani Agro Foods & Avani Finserv
**Date:** April 22, 2026

This guide provides the exact configuration paths for your SEO and Analytics tracking.

---

## 🔍 PART 1: Google Search Console (GSC)

### **Verification Field-by-Field**
1. **Property Type:** Select **"Domain"** (The left box).
2. **Domain Field:** Type `avaniagrofoods.com`.
3. **DNS Verification (Hostinger):** 
   - Go to Hostinger **DNS Zone Editor**.
   - **Type:** `TXT`
   - **Name:** `@`
   - **Value:** [Paste the Google Code here]
   - **TTL:** `3600`

### **Sitemap Submission**
Once verified, go to the **Sitemaps** menu on the left and enter the following URL:
👉 **`https://avaniagrofoods.com/sitemap.xml`**

---

## 📈 PART 2: Google Analytics (GA4)

### **Manual Code Installation (React/Vite)**
For your Avani Agro Foods project, the tracking code must be placed in the **Main Header**.

**File Path:** `C:\Users\ALPHA-1\OneDrive\Desktop\AVANI AGRO FOODS LATUR 2026\index.html`

**Field-by-Field Placement:**
1. Open `index.html`.
2. Find the `<head>` tag (Line 3).
3. Paste your Google Analytics script **immediately below** the `<head>` tag.
4. It should look like this:
```html
<head>
  <!-- Global site tag (gtag.js) - Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
  ...
</head>
```

---

## 🗑️ PART 3: Removing Unwanted Properties

### **In Search Console:**
- **Settings** (Bottom Left) -> **Remove Property** (Bottom Center).

### **In Google Analytics:**
- **Admin** (Gear Icon) -> **Property Details** -> **Move to Trash Can** (Top Right).

---

## 🔗 Project Links for Records
* **Local Path:** `documentation/Google_Services_Setup_Guide.md`
* **GitHub Link:** `https://github.com/avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026/blob/main/documentation/Google_Services_Setup_Guide.md`
