# Hostinger: Start-to-End Upload & Feature Mapping

This guide maps the **Hostinger Services menu** (from your screenshot) to the exact steps needed to launch the Avani Agro Foods platform.

---

## 🏗️ PART 1: The Start-to-End Upload Procedure

Follow these **"Field-by-Field"** paths in order:

### 1. Build Phase (Local Computer)
- **Field**: Terminal
- **Action**: Run `npm run build`. 
- **Result**: Creates the `dist` folder. This is the **content** that will live in the Hostinger "Web Hosting" field.

### 2. Connection Phase (Hostinger Dashboard)
- **Menu Icon**: `Web hosting` (Secure, speedy service)
- **Field Path**: `Files` -> `File Manager` -> `public_html`.
- **Action**: Upload all fields from your local `dist` folder into this path.

### 3. Identity Phase (Domain Search)
- **Menu Icon**: `Domain name search`
- **Field Path**: Register `avaniagrofoods.com`.
- **Action**: Once purchased, go to `Websites` -> `Manage` -> `Domains` and click **"Connect"**.

### 4. Logic Phase (Node.js)
- **Menu Icon**: `Node.js web apps hosting`
- **Field Path**: `Advanced` -> `Node.js`.
- **Action**: Setup an app if you decide to add a server for custom PDFs or Database queries.
- *Note: Leave this as "Pending" for now; your site works perfectly in the Web Hosting field.*

---

## 📂 PART 2: Feature Glossary (From Your Screenshot)

| Menu Section | Icon / Feature | Use for Avani Agro Foods |
| :--- | :--- | :--- |
| **HOSTING** | `Web hosting` | **MAIN FIELD**: This is where your website files live. |
| **HOSTING** | `Node.js web apps` | **FUTURE**: Use this for high-end automation & servers. |
| **DOMAINS** | `Domain search` | **IDENTITY**: Where you buy and hold your website address. |
| **EMAIL** | `Business email` | **PROFESSIONAL**: setup `sales@avaniagrofoods.com` here. |
| **EMAIL** | `Email marketing` | **GROWTH**: Send bulk newsletters to your B2B importers. |
| **WEBSITES** | `Website Builder` | **IGNORE**: You have a custom-coded professional site (higher quality). |

---

## 🛡️ PART 3: Post-Upload Quality Check

After uploading, you must verify these 3 fields:

1. **SSL Certificate**: Go to `Security` -> `SSL`. Ensure it is **"Active"**. This gives you the Green Lock icon.
2. **Global Speed**: Go to `Performance` -> `CDN`. Ensure it is **"Enabled"**.
3. **Daily Backup**: Go to `Files` -> `Backups`. Confirm the first record is created.

---

> [!TIP]
> **Priority Number 1**: ALWAYS upload to `public_html`. If you upload to any other field, your website will be invisible.
