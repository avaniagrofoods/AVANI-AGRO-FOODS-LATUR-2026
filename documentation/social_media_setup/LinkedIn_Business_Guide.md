# AVANI AGRO FOODS — LinkedIn Business Guide

This guide details the step-by-step setup path and configuration details for **LinkedIn Company Page**, **B2B Product Listings**, **Lead Gen Forms**, and **Outreach Campaigns** for **AVANI AGRO FOODS**.

---

## 🏢 PART 1: LinkedIn Company Page Setup

### 📍 Setup Path
1. Go to your LinkedIn feed page (`https://www.linkedin.com`).
2. Click the **"For Business"** icon (grid icon in the top right corner).
3. Scroll to the bottom of the menu and click **"Create a Company Page +"**.
4. Select **"Company"** (Small, medium, and large businesses).

### 📝 Field-by-Field Entry Details

| Field Name | Input Value | Notes |
| :--- | :--- | :--- |
| **Name** | AVANI AGRO FOODS | Brand Name |
| **LinkedIn Public URL** | `linkedin.com/company/avaniagrofoods` | Casing is automatically lowercase |
| **Website** | `https://www.avaniagrofoods.com` | Company website |
| **Industry** | Import and Export | Or "Farming" / "Food & Beverage Manufacturing" |
| **Organization Size** | 2-10 employees | Select startup bracket |
| **Organization Type** | Privately Held | Standard startup |
| **Logo** | Upload `logo.jpeg` from project | Sourced from `public/logo.jpeg` |
| **Tagline** | Connecting Indian agro-manufacturers to global buyers. Moringa & Onion Powders. | Max 120 characters |

### 🛠️ Header & Page Details Customization
Once the page is created, click the **"Edit Page"** pencil icon:
* **Description:** Copy-paste the **Short Description (500 Chars)** or **Full Profile (2,000 Chars)** from your [Master Business Profile](file:///c:/Users/ALPHA-1/Downloads/21MAY2026/SACHIN%20SHINDE%20DOCUMENTS/DEVELOPEMENT%20TOOLS/AVANI%20AGRO%20FOODS%20LATUR%202026/documentation/social_media_setup/Master_Business_Profile.md).
* **Phone:** `+91 7219053645`
* **Year Founded:** `2026`
* **Specialties:** Add the following keywords: `Moringa Powder Export`, `Red Onion Powder Export`, `B2B Agro Supply`, `Agro-Affiliate Marketing`, `Dehydrated Vegetables`, `Indian Food Exports`.
* **Custom Button:** Enable button -> Select **"Visit website"** -> Enter URL: `https://www.avaniagrofoods.com`.

---

## 🛍️ PART 2: LinkedIn Product Tab Setup

LinkedIn allows company pages to list specific products to collect reviews, showcase features, and generate leads.

### 📍 Setup Path
1. Go to your LinkedIn Page Admin View.
2. Click **Products** in the left menu (if not visible, go to **Resources** -> **Add Product**).
3. Click **"Add Product"**.

### 📝 Field-by-Field Product Entry Details

#### Product 1: Premium Moringa Leaf Powder
* **Product Name:** Premium Organic Moringa Oleifera Leaf Powder
* **Product Category:** Nutritional Supplements / Raw Materials
* **Product Tagline:** pure natural green leaf powder for export and bulk formulation.
* **Product Description:** High-grade Moringa powder sourced from selected manufacturers in India. High purity, 80-100 mesh size, moisture content < 6%. Formulated for health supplement brands, cosmetics, and food blenders. Certified and verified supply chain.
* **Website / Product Page:** `https://www.avaniagrofoods.com/products`
* **Call to Action (CTA):** Select **"Get Started"** or **"Learn More"** and link to `https://www.avaniagrofoods.com/contact`.

#### Product 2: Dehydrated Red Onion Powder
* **Product Name:** Premium Dehydrated Red Onion Powder
* **Product Category:** Food & Beverage / Raw Food Materials
* **Product Tagline:** Dehydrated moisture-controlled red onion powder for industrial food processing.
* **Product Description:** High-solubility dehydrated red onion powder with zero additives. Moisture strictly maintained below 5% to prevent clumping. Long shelf life (12-18 months). Excellent for seasoning formulations, sauces, and ready-to-eat meals.
* **Website / Product Page:** `https://www.avaniagrofoods.com/products`
* **Call to Action (CTA):** Select **"Get Started"** and link to `https://www.avaniagrofoods.com/contact`.

---

## 🎯 PART 3: LinkedIn B2B Outreach Campaign Templates

Use LinkedIn Sales Navigator or search to find buyers with titles like: *Agro Purchase Manager, Food Procurement Officer, Spice Sourcing Specialist, Nutraceutical Buyer, Importer*.

### 📨 Template 1: Connection Request Note (Max 300 characters)
> "Hi [First Name], noticed you work in B2B agro/herb procurement. AVANI AGRO FOODS exports premium Indian Moringa Powder (HS: 0712.90.90) and Red Onion Powder (HS: 0712.20.00) directly to buyers in [their country/region]. I'd love to connect and share our specification sheets. Thanks, Sachin Shinde"

### 📨 Template 2: Follow-up Message (After Connection Accepted)
> "Hi [First Name],
> 
> Thanks for connecting! 
> 
> I am Sachin Shinde, founder of **AVANI AGRO FOODS** based in Latur, Maharashtra. We partner with Indian agricultural manufacturers to supply certified, export-grade:
> 
> 1. **Premium Moringa Leaf Powder** (Fine green, moisture < 6%)
> 2. **Dehydrated Red Onion Powder** (High solubility, moisture < 5%, zero caking additives)
> 
> We manage direct exports, B2B orders, and custom shipping options for buyers in the UAE, USA, and Europe.
> 
> If your company has active requirements, I can send over our lab analysis certificates and wholesale price lists. Alternatively, you can browse our product specifications online at: www.avaniagrofoods.com
> 
> Are you open to receiving a trial sample? Let me know your shipping address.
> 
> Best regards,
> Sachin Shinde
> sales@avaniagrofoods.com | +91 7219053645"

---

## 🔍 PART 4: LinkedIn Insight Tag Setup

The Insight Tag is LinkedIn's tracking snippet to measure ad conversions and capture professional demographic data (job title, industry, company size) of website visitors.

### 📍 Setup Path
1. Go to LinkedIn Campaign Manager (`https://www.linkedin.com/campaignmanager/accounts`).
2. Select or create your Ads Account linked to `AVANI AGRO FOODS`.
3. In the left navigation, click **Analyze** -> **Insight Tag**.
4. Click **Create Insight Tag** -> Select **I will install the tag myself**.
5. Copy the tracking code (specifically looking for the Partner ID, e.g., `partnerId: "1234567"`).

### 📝 Code Placement (React/Vite)
Open `index.html` (Path: `index.html` in workspace root). Paste the Insight Tag script inside the `<head>` tag, just before the closing `</head>` tag:

```html
<!-- LinkedIn Insight Tag -->
<script type="text/javascript">
  _linkedin_partner_id = "YOUR_PARTNER_ID_HERE"; // Replace with your partner ID
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script>
<script type="text/javascript">
  (function(l) {
  if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
  window.lintrk.q=[]}
  var s = document.getElementsByTagName("script")[0];
  var b = document.createElement("script");
  b.type = "text/javascript";b.async = true;
  b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
  s.parentNode.insertBefore(b, s);})(window.lintrk);
</script>
<noscript>
  <img height="1" width="1" style="display:none;" alt="" 
       src="https://px.ads.linkedin.com/collect/?pid=YOUR_PARTNER_ID_HERE&fmt=gif" />
</noscript>
<!-- End LinkedIn Insight Tag -->
```
*(Sachin: Replace `YOUR_PARTNER_ID_HERE` with your active LinkedIn Insight Partner ID.)*
