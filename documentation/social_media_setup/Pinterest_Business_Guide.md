# AVANI AGRO FOODS — Pinterest Business Guide

This guide details the step-by-step setup path and configuration details for **Pinterest Business Account**, **Website Claiming**, **Rich Pins**, and **Board Sourcing Structures** for **AVANI AGRO FOODS**.

---

## 📌 PART 1: Pinterest Business Account Setup

A Pinterest Business Account allows you to access analytics, claim website ownership, enable Rich Pins, and run visual ads.

### 📍 Setup Path (If starting fresh)
1. Go to `https://www.pinterest.com/business/create/`
2. Enter your email (`sales@avaniagrofoods.com`), password, and age.
3. Click **Create account**.

### 📍 Setup Path (If converting an existing personal account)
1. Log in to your personal Pinterest account.
2. Click the down arrow (top right) -> Select **Settings**.
3. In the left navigation, click **Account management**.
4. Scroll to **Convert to a business account** -> Click **Convert account**.

### 📝 Field-by-Field Entry Details

| Field Name | Input Value | Notes |
| :--- | :--- | :--- |
| **Business Name** | AVANI AGRO FOODS | Brand Name |
| **Username / Handle** | `@avaniagrofoods` | Check availability |
| **Describe your business** | Exporter / B2B Wholesaler | Select closest match |
| **Business Bio** | Sourcing premium Moringa Powder & Dehydrated Red Onion Powder from India for global markets (UAE, USA, Europe). Bulk B2B & Export partners. | Max 160 characters |
| **Website** | `https://www.avaniagrofoods.com` | Verified URL |
| **Country** | India | Base region |
| **Language** | English | International communications |

---

## 🔗 PART 2: Claiming Your Website (verification)

Claiming your website adds your profile picture to any pin saved from your site, activates rich pins, and enables robust tracking.

### 📍 Setup Path
1. Log in to your Pinterest Business account.
2. Click the down arrow (top right) -> Select **Settings**.
3. In the left navigation, click **Claimed accounts**.
4. Click **Claim** next to **Websites**.
5. Select **"Add HTML tag"** and copy the generated meta tag (e.g., `<meta name="p:domain_verify" content="your_pinterest_hash_here"/>`).

### 📝 Code Placement (React/Vite)
Open `index.html` (Path: `index.html` in workspace root). Paste the Pinterest verification meta tag inside the `<head>` tag, just below the existing meta tags:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- Pinterest Domain Verification -->
  <meta name="p:domain_verify" content="YOUR_PINTEREST_HASH_HERE" />
  ...
</head>
```
*(Sachin: Replace `YOUR_PINTEREST_HASH_HERE` with the actual hash code provided by Pinterest.)*

6. Go back to Pinterest, click **Continue**, enter your URL `https://www.avaniagrofoods.com`, and click **Verify**. (Verification takes 24 hours).

---

## 🌾 PART 3: Board Sourcing & Setup Structure

Pinterest organizes visual content into **Boards**. As a bulk exporter and affiliate, your boards should cater to both B2B buyers looking for specs/bulk sourcing and consumers looking for product usage/benefits (which drives your affiliate traffic).

Configure the following 4 primary Boards:

### 📋 Board 1: B2B Agro Exports & Sourcing (Bulk Buyers)
* **Board Name:** `B2B Agro Exports — Indian Suppliers`
* **Description:** Specifications, packaging, certificates of analysis, and shipping logistics for Moringa Leaf Powder and Red Onion Powder exports from Latur, India. Sourcing guides for food processors and nutraceutical buyers.
* **Keywords:** B2B Agro, Moringa Exporters, Onion Powder Bulk, Indian Spice Exporters, Import-Export India.

### 🌿 Board 2: Moringa Leaf Powder Benefits & Uses
* **Board Name:** `Moringa Powder — Superfood Benefits`
* **Description:** Health benefits, nutritional specifications, dietary recipes, and cosmetic applications of Organic Moringa Oleifera leaf powder.
* **Keywords:** Moringa benefits, Green superfood, Moringa powder recipes, Organic Moringa, Moringa skincare.

### 🧅 Board 3: Dehydrated Onion Powder in Food Industry
* **Board Name:** `Dehydrated Red Onion Powder — Food Processing`
* **Description:** Commercial culinary uses, spice blend recipes, shelf-life guides, and food industry applications of dehydrated red onion powder.
* **Keywords:** Onion powder bulk, seasoning formulation, dehydrated onions, food processor supplies, cooking spice.

### 🤝 Board 4: AVANI AGRO FOODS Affiliate & Partner Program
* **Board Name:** `Agro Affiliate Program — Avani Agro Foods`
* **Description:** How to join our affiliate sales program. Earn commissions by promoting premium Indian agricultural products. Step-by-step guides for digital marketers.
* **Keywords:** Agro Affiliate, Affiliate Marketing India, Make Money Online, B2B Affiliate, Raw Material Commissions.

---

## 🏷️ PART 4: Rich Pins Setup Path

Rich Pins pull metadata from your website directly into the pin, updating details automatically if you edit your website. Product Rich Pins show pricing and availability.

### 📍 Setup Path
1. Ensure your website header contains standard Open Graph (OG) meta tags (added in your main website setup).
2. Go to the Pinterest Rich Pins Validator (`https://developers.pinterest.com/tools/url-debugger/`).
3. Enter one of your product URLs, for example: `https://www.avaniagrofoods.com/products`
4. Click **Validate**.
5. Once approved, all Pins saved from your domain will display as Rich Pins within 24 hours.
