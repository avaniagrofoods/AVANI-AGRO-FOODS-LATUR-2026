# Website Maintenance Guide: Field-by-Field Instructions

Keep this record to know exactly which files to edit when you want to update or remove sections of your website.

---

## 1. Where to update Content (Code Files)

| Component Section | File Path | Important Field |
| :--- | :--- | :--- |
| **Home Page Text** | `src/pages/Home.jsx` | `hero-title`, `hero-subtitle` |
| **Blog Posts** | `src/data/blogs.js` | `title`, `excerpt`, `content` |
| **B2B Partners** | `src/data/b2bPartners.js` | `companyName`, `status: "Verified"` |
| **Affiliate Links** | `src/data/links.js` | `STRIPE_LINKS` |
| **Global Data** | `src/data/importersData.js` | `IMPORTERS` array |

---

## 2. Managing High-Level Business Features (Hostinger Icons)

Based on the **Hostinger Services menu**, here is how to manage your business operations field-by-field:

### ✉️ Business Email Setup (Start-to-End)
1. **Menu Icon**: `Business email`
2. **Action**: Click `Manage` -> `Create email account`.
3. **Field Configuration**: 
   - **Name**: Use `sales` or `export`.
   - **Password**: Create a strong, unique password.
4. **Result**: You now have `export@avaniagrofoods.com` for professional trust.

### 🌐 Domain Management (Start-to-End)
1. **Menu Icon**: `Domain name search`
2. **Action**: Register your main business address (e.g., `avaniagrofoods.com`).
3. **Field Path**: `Manage Domain` -> `DNS/Nameservers`.
4. **Important**: Your **Business Plan** automatically sets these as "Cloudflare Protected" for security.

### 🛡️ Daily Backups Management
1. **Field Path**: `Files` -> `Backups`.
2. **Step**: Choose `File backups`.
3. **Action**: Select a date and click **"Restore files"**.
4. **Result**: If you accidentally delete a line in a code file, this field resets your entire directory to its working state.

---

## 3. Deployment Check-List (start-to-end)

Whenever you make a change in a file like `src/data/blogs.js`, follow this loop:
1. **Build**: Terminal -> `npm run build`
2. **Upload**: File Manager -> `public_html` -> `Upload`
3. **Clear Cache**: Performance -> `Cache Manager` -> `Purge All` (Important for showing new updates).

---

> [!CAUTION]
> **Hostinger Website Builder**: Do NOT click this icon for your existing project. Using the Builder will overwrite your custom professional code with a basic template. Keep your professional files in the **"Web hosting"** field.
