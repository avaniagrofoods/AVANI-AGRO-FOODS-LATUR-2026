# Zoho CRM "Auto Mode" Integration Guide

The website is already sending leads to Zoho CRM automatically. To make your B2B Email and WhatsApp Conversion Sequences run on "Auto Mode", you need to set up workflows inside your Zoho CRM dashboard. 

Since I (the AI) do not have your Zoho login credentials or Meta/WhatsApp account access, I cannot click these buttons for you. However, follow this exact step-by-step guide to set it up in just 10-15 minutes.

---

## 📧 Part 1: Automate the 5-Email Sequence in Zoho

We will create a **Workflow Rule** that triggers the moment a new lead arrives from your website.

### Step 1: Create Email Templates
1. Go to **Zoho CRM Settings** (the gear icon ⚙️ in the top right).
2. Under Customization, click **Templates** -> **Email**.
3. Click **+ New Template** and select the **Leads** module.
4. Copy and paste **Email 1** (from the sequence I provided earlier). Save it as "B2B Email 1 - Welcome".
5. Repeat this process for Emails 2, 3, 4, and 5.

### Step 2: Create the Auto-Mode Workflow
1. Go back to **Zoho CRM Settings** ⚙️.
2. Under Automation, click **Workflow Rules**.
3. Click **+ Create Rule**.
   - **Module:** Leads
   - **Rule Name:** "B2B Auto Email Sequence"
4. **WHEN:** Choose **On a Record Action** -> **Create**. (This means the automation starts when a lead comes from the website).
5. **CONDITION:** Choose **All Leads**.
6. **INSTANT ACTION:** Click **+ Action** -> **Email Notification**.
   - Select the template "B2B Email 1 - Welcome".
7. **SCHEDULED ACTIONS:** (This is how we automate the delays)
   - Click **+ Scheduled Action** -> **2 Days After Rule Trigger Time**.
   - Add Action -> Email Notification -> Select "B2B Email 2".
   - Click **+ Scheduled Action** -> **5 Days After Rule Trigger Time**.
   - Add Action -> Email Notification -> Select "B2B Email 3".
   - Repeat for Day 8 and Day 12 using Emails 4 and 5.
8. Click **Save**. Your 5-email sequence is now running in Auto Mode!

---

## 📱 Part 2: Automate WhatsApp Business Integration

To have WhatsApp messages send automatically, you must connect your Meta WhatsApp Business API to Zoho.

### Step 1: Link WhatsApp to Zoho CRM
1. Go to **Zoho CRM Settings** ⚙️.
2. Under Channels, click **Business Messaging** -> **WhatsApp**.
3. Click **Integrate** and log in with your Facebook/Meta account that owns the number `+91 7219053645`.
4. Follow the on-screen steps to verify the number and complete the connection.

### Step 2: Create WhatsApp Templates
*Note: Meta requires WhatsApp templates to be approved before you can automate them.*
1. In the Zoho WhatsApp settings, go to **Templates** -> **Create New Template**.
2. Copy and paste the WhatsApp Greeting Message from the sequence document.
3. Submit it for Meta approval (usually takes 5 minutes to 2 hours).

### Step 3: Set Up WhatsApp Auto-Replies
1. Go to **Zoho CRM Settings** ⚙️ -> **Workflow Rules**.
2. Click **+ Create Rule**.
   - **Module:** Leads
   - **Rule Name:** "WhatsApp Welcome Auto-Reply"
3. **WHEN:** On a Record Action -> Create.
4. **INSTANT ACTION:** Click **+ Action** -> **Notify via WhatsApp**.
   - Select your approved Greeting Template.
5. Click **Save**. 

Now, every time a buyer fills out the website form, they will automatically get a WhatsApp message on their phone from your number!

---

## ✅ Summary of the Auto-Mode Flow
1. Buyer submits the Contact/Quotation form on `avaniagrofoods.com`.
2. The website (already coded) sends the lead instantly to Zoho CRM.
3. Zoho CRM **automatically** sends Email #1.
4. Zoho CRM **automatically** sends the WhatsApp Welcome Message.
5. Over the next 12 days, Zoho CRM **automatically** sends Emails #2, #3, #4, and #5.

If you have any issues finding these menus in Zoho, let me know and I can guide you further!
