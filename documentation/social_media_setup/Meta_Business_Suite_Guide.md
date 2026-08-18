# AVANI AGRO FOODS — Meta Business Suite Setup Guide

This guide details the step-by-step setup path and configuration details for **Meta Business Suite**, **Facebook Page**, **Instagram Business Account**, **Meta Business Manager**, and **Meta Commerce Catalogs** for **AVANI AGRO FOODS**.

---

## 🛠️ PART 1: Facebook Business Page Setup

### 📍 Setup Path
1. Go to `https://www.facebook.com/pages/create`
2. Log in using your personal Facebook profile (Sachin Shinde).

### 📝 Field-by-Field Entry Details

| Field Name | Input Value | Notes |
| :--- | :--- | :--- |
| **Page Name** | AVANI AGRO FOODS | Brand Name |
| **Category 1** | Agricultural Cooperative | Or "Agriculture Service" |
| **Category 2** | Food & Beverage Exporter | Or "Exporter" / "Wholesaler" |
| **Category 3** | E-commerce Service | To support B2B catalog |
| **Bio** | Connecting Indian agro-manufacturers to global buyers. Moringa & Onion Powders. | Max 101 characters |
| **Profile Photo** | Upload `logo.jpeg` | Sourced from `public/logo.jpeg` |
| **Cover Photo** | Upload a banner showcasing Moringa leaves & red onions. | Resolution: `820 x 312 px` |

### 📞 Contact & Business Details Fields
Once the page is created, navigate to **Manage Page** -> **Edit Page Info**:
* **Website:** `https://www.avaniagrofoods.com`
* **Email:** `sales@avaniagrofoods.com`
* **Phone Number:** Country Code: `India (+91)`, Number: `7219053645`
* **WhatsApp Number:** Link the WhatsApp Business account using `+91 7219053645` *(Meta will send a OTP to verify)*.
* **Address:** Latur, Maharashtra, India, Pin: 413512.
* **Hours:** Select **"Always Open"** (suitable for international B2B inquiries).
* **Action Button:** Click **"Add Action Button"** -> Select **"Send WhatsApp Message"** or **"Learn More"** linking to `https://www.avaniagrofoods.com`.

---

## 📸 PART 2: Instagram Business Profile Setup

### 📍 Setup Path
1. Download the Instagram app on your mobile device.
2. Sign up for a new account using the email `sales@avaniagrofoods.com` or log into your existing account.
3. Go to **Profile** -> Tap **Settings and Activity** (three lines) -> Scroll down to **Account type and tools** -> Tap **Switch to Professional Account**.
4. Select **"Business"** (do NOT choose Creator).

### 📝 Field-by-Field Entry Details

| Field Name | Input Value | Notes |
| :--- | :--- | :--- |
| **Username** | `@avaniagrofoods` | Check availability; keep lowercase |
| **Name** | AVANI AGRO FOODS | Display Name |
| **Category** | Agricultural Service | Or "Food & Beverage Company" |
| **Bio** | 🌿 Exporting premium Moringa & Red Onion Powder from India to UAE, USA, & Europe.<br>📈 B2B Bulk Sourcing Partner.<br>📩 Contact: sales@avaniagrofoods.com | Use line breaks for readability |
| **Website / Link** | `https://www.avaniagrofoods.com` | Primary URL |
| **Public Business Email** | `sales@avaniagrofoods.com` | Show on profile |
| **Public Business Phone** | `+917219053645` | Set to Mobile/WhatsApp |
| **Action Button** | Select **"Send WhatsApp Message"** | Uses verified WhatsApp |

---

## 🔗 PART 3: Meta Business Manager Setup

Meta Business Manager holds your Facebook Page, Instagram Account, WhatsApp account, and Catalogs under one business umbrella.

### 📍 Setup Path
1. Go to `https://business.facebook.com/overview`
2. Click **Create Account**.

### 📝 Field-by-Field Entry Details
1. **Business Account Name:** `AVANI AGRO FOODS`
2. **Your Name:** `Sachin Shinde`
3. **Your Business Email:** `sales@avaniagrofoods.com`
4. Verify the account via the confirmation link sent to your email.

### ➕ Connecting Assets inside Business Manager
Go to **Business Settings** (`https://business.facebook.com/settings`):
1. **Add Facebook Page:** Go to **Pages** -> Click **Add** -> **Add a Page** -> Search `AVANI AGRO FOODS` -> Select and link it.
2. **Add Instagram Account:** Go to **Instagram Accounts** -> Click **Add** -> Enter username & password to link.
3. **Add WhatsApp Account:** Go to **WhatsApp Accounts** -> Click **Add WhatsApp Account** -> Select India (+91) -> Type `7219053645` -> Enter OTP.

---

## 📊 PART 4: Meta Commerce Catalog Setup (B2B Products)

A commerce catalog allows you to run product ads and showcase items on Facebook/Instagram shops.

### 📍 Setup Path
1. Go to Meta Commerce Manager (`https://business.facebook.com/commerce_manager`).
2. Click **Get Started** -> Select **Create a Catalog** -> Select **E-commerce** -> Click **Next**.
3. Choose **Upload Product Info** -> Set Catalog Owner as `AVANI AGRO FOODS` -> Name the catalog: `Avani Agro B2B Catalog` -> Click **Create**.

### 📝 Product List Fields (Manual Data Entry)
Go to **Catalog** -> **Items** -> **Add Items** -> **Add Manually**. Enter the following fields for your two main products:

#### Item 1: Premium Moringa Leaf Powder
* **Image:** Upload forest-green Moringa powder packaging image (1024x1024 px square).
* **Title:** `Premium Organic Moringa Oleifera Leaf Powder (Bulk/B2B)`
* **Description:** Sourced directly from certified Indian manufacturers. Sieve size 80-100 mesh, moisture < 6%. Ideal for nutraceuticals, health blends, and dietary supplements. Export packaging in 20kg/25kg bags.
* **Website Link:** `https://www.avaniagrofoods.com/products`
* **Price:** `250` (or leave empty/flexible depending on export quote)
* **Currency:** `INR` or `USD`
* **SKU / Content ID:** `AVN-MOR-BULK`
* **Condition:** `New`
* **Availability:** `In Stock`

#### Item 2: Dehydrated Red Onion Powder
* **Image:** Upload pinkish-red Onion powder packaging image (1024x1024 px square).
* **Title:** `Premium Dehydrated Red Onion Powder (Bulk/B2B)`
* **Description:** Pure dehydrated red onion powder with zero additives. Soluble grade, moisture < 5%, 80-100 mesh size. Long shelf life, ideal for food processing and seasonings. Sourced from high-quality farms.
* **Website Link:** `https://www.avaniagrofoods.com/products`
* **Price:** `180` (or flexible wholesale price)
* **Currency:** `INR`
* **SKU / Content ID:** `AVN-ONN-BULK`
* **Condition:** `New`
* **Availability:** `In Stock`

---

## 🔍 PART 5: Meta Pixel & Conversions API Setup

The Pixel tracks visitors on your website (`https://www.avaniagrofoods.com`) and matches them with Facebook accounts for advertising and analytics.

### 📍 Setup Path
1. In Business Settings, go to **Data Sources** -> **Datasets** (previously Pixels).
2. Click **Add** -> Name the Dataset: `Avani Agro Main Website Dataset` -> Click **Create**.
3. Copy the **Dataset ID** (e.g., `123456789012345`).

### 📝 Code Placement (React/Vite)
Open `index.html` (Path: `index.html` in workspace root). Paste the Meta Pixel script inside the `<head>` tag, just below the Google Analytics script:

```html
<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID_HERE'); // Replace with your Dataset ID
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none" 
       src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID_HERE&ev=PageView&noscript=1"/>
</noscript>
<!-- End Meta Pixel Code -->
```
*(Sachin: Replace `YOUR_PIXEL_ID_HERE` in both places with your active Meta Dataset ID.)*
