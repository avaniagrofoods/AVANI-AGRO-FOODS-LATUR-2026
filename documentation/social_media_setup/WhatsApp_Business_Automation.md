# AVANI AGRO FOODS — WhatsApp Business Automation Guide

This guide details how to set up, optimize, and automate **WhatsApp Business** for **AVANI AGRO FOODS**. It covers the standard **WhatsApp Business App** (for manual B2B communication) and the **WhatsApp Business Cloud API** (for automated CRM integrations and mass outreach).

---

## 🆚 PART 1: WhatsApp Business App vs. Cloud API

Before beginning, choose the version that fits your current operational phase:

| Feature | WhatsApp Business App | WhatsApp Business Cloud API |
| :--- | :--- | :--- |
| **Best For** | Beginner startups, manual chats, small B2B teams | Scaled automation, chatbots, CRM integrations |
| **Setup Cost** | Free (requires a physical SIM) | Pay-per-conversation rates (uses a virtual number) |
| **Automation** | Basic away, greeting, and quick replies | Advanced custom chatbot decision trees, bulk broadcast |
| **Device Limit** | 1 phone + 4 linked web devices | Unlimited agents via custom inbox software (HubSpot/Zoho) |
| **Catalog** | Native catalog builder in the mobile app | Shared via website link or custom product messages |

---

## 📱 PART 2: WhatsApp Business App - Profile Setup Path

Download **WhatsApp Business** from Google Play Store or Apple App Store. Register using `+91 7219053645`.

### 📝 Profile Field-by-Field Entry Details
Navigate to **Settings** -> **Business Tools** -> **Business Profile**:

* **Profile Picture:** Upload `logo.jpeg` from workspace.
* **Business Name:** `AVANI AGRO FOODS`
* **Category:** Select **"Agricultural Service"** or **"Food & Beverage Company"**.
* **Description:** Sourcing and exporting premium Moringa Powder and Red Onion Powder from Indian manufacturers to global importers in UAE, USA, and Europe.
* **Business Address:** Latur, Maharashtra, India, Pin: 413512.
* **Business Hours:** 
  * Sunday to Saturday: **Open 24 Hours** (Crucial for receiving queries from different time zones: UAE, USA, Europe).
* **Email:** `sales@avaniagrofoods.com`
* **Website:** `https://www.avaniagrofoods.com`
* **Tagline:** `Connecting Indian agro-manufacturers to global buyers.`

### 🛍️ Mobile Catalog Setup Path
Navigate to **Business Tools** -> **Catalog** -> **Add New Item**:

#### Item 1: Moringa Powder
* **Item Name:** Premium Moringa Leaf Powder (Bulk)
* **Price:** (Keep blank or set standard base rate, e.g., ₹250 / kg)
* **Description:** Sieve size 80-100 mesh, moisture < 6%. Nutrient-dense, natural green color. Packaged in 20kg/25kg bags for B2B export. Sourced from certified processors.
* **Link:** `https://www.avaniagrofoods.com/products`
* **Item Code:** `AVN-MOR-BULK`

#### Item 2: Red Onion Powder
* **Item Name:** Dehydrated Red Onion Powder (Bulk)
* **Price:** (Keep blank or set standard base rate, e.g., ₹180 / kg)
* **Description:** Pinkish-red fine onion powder with zero additives. Soluble grade, moisture < 5%. Highly suitable for food processing and seasonings. Sourced from high-yield crops.
* **Link:** `https://www.avaniagrofoods.com/products`
* **Item Code:** `AVN-ONN-BULK`

---

## 🤖 PART 3: Quick-Replies & Automation Fields (Business App)

Configure these automated responses under **Business Tools** to respond instantly to buyers.

### 1. Greeting Message (Auto-sends to first-time contacts)
* **Status:** Enabled
* **Recipient:** Everyone not in address book
* **Text:**
> "Hello! Thank you for contacting **AVANI AGRO FOODS**. My name is Sachin Shinde. 
> 
> We connect premier Indian manufacturers of **Moringa Powder** and **Red Onion Powder** with global buyers in the UAE, USA, and Europe. 
> 
> How can we assist you with your bulk sourcing requirements today? Please share:
> 1. Product of interest (Moringa / Red Onion)
> 2. Required quantity (MT / kg)
> 3. Destination Port
> 
> You can also browse our specifications at: www.avaniagrofoods.com"

### 2. Away Message (Auto-sends outside active work hours)
* **Status:** Enabled (Send outside scheduled hours, or keep off if on 24/7)
* **Text:**
> "Hi there! Thanks for reaching out to **AVANI AGRO FOODS**. We have received your inquiry. 
> 
> Our B2B sales team is currently offline, but we will review your requirements and respond with specifications and FOB/CIF price estimates as soon as we return. 
> 
> For immediate catalog access, visit: www.avaniagrofoods.com"

### 3. Quick Replies (Type shortcut keyword to trigger pre-written text)

#### Shortcut 1: `/moringa`
* **Text:**
> "🌿 **AVANI AGRO FOODS - Premium Moringa Powder Specifications**
> * **HS Code:** 0712.90.90
> * **Mesh Size:** 80-100 mesh (Fine Powder)
> * **Moisture:** < 6%
> * **Pesticides/Heavy Metals:** Nil (Tested to EU/US norms)
> * **Packaging:** 20kg/25kg paper/HDPE bags with double food-grade inner liners.
> * **MOQ:** 500 kg
> 
> Let us know your destination port (e.g., Jebel Ali, Port of NY, Rotterdam) to provide a CIF quotation."

#### Shortcut 2: `/onion`
* **Text:**
> "🧅 **AVANI AGRO FOODS - Dehydrated Red Onion Powder Specifications**
> * **HS Code:** 0712.20.00
> * **Mesh Size:** 80-100 mesh (Highly Soluble)
> * **Moisture:** < 5% (Strictly controlled to prevent caking)
> * **Additives:** None (100% Pure Red Onion)
> * **Packaging:** 20kg moisture-barrier aluminum foil bags in corrugated cartons.
> * **MOQ:** 1 Metric Ton (MT)
> 
> Let us know your port of delivery for a FOB or CIF price quote."

#### Shortcut 3: `/quote`
* **Text:**
> "Thank you for your bulk inquiry. To generate a formal quotation, could you please provide:
> 1. Company Name & Country:
> 2. Primary Product & Spec Grade:
> 3. Target Packaging Size:
> 4. Expected Monthly/One-off Volume:
> 5. Shipping Incoterm (FOB / CIF / CFR):
> 
> Our team will draft the quote and email it to you within 24 hours. You can also generate an instant draft quote using our online builder here: https://www.avaniagrofoods.com/contact"

---

## 🌐 PART 4: WhatsApp Business Cloud API Setup Path

Use this path if integrating WhatsApp with your CRM (Zoho CRM or HubSpot) or running automated custom campaigns.

### 📍 Step-by-Step Setup Path
1. Go to the Meta for Developers portal (`https://developers.facebook.com`).
2. Log in with your Facebook credentials.
3. Click **My Apps** -> **Create App**.
4. Select **Other** -> Click **Next** -> Select **Business** -> Click **Next**.
5. Fill out the app details:
   * **App Display Name:** `Avani Agro WhatsApp API`
   * **App Contact Email:** `sales@avaniagrofoods.com`
   * **Business Account:** Select your `AVANI AGRO FOODS` Meta Business Manager account.
   * Click **Create App**.
6. On the App Dashboard, scroll down and find **WhatsApp** -> Click **Set Up**.
7. Under WhatsApp navigation on the left, click **API Setup**:
   * Click **Add Phone Number**.
   * Fill out Business Profile Info:
     * **Display Name:** `AVANI AGRO FOODS`
     * **Category:** `Food & Beverage` / `Agriculture`
     * **Website:** `https://www.avaniagrofoods.com`
   * Input the phone number `917219053645` -> Select verification method (SMS or Phone Call) -> Click **Verify**.
8. Copy your **Temporary Access Token**, **Phone Number ID**, and **WABA (WhatsApp Business Account) ID** and save them in your secure environment file (`.env.local` inside project).
9. Integrate these IDs into your HubSpot or Zoho WhatsApp Integration settings to manage WhatsApp directly from your CRM.
