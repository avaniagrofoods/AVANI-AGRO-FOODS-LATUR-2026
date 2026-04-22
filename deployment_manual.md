# Avani Agro Foods: Deployment Reference Manual

This document contains key information for managing the hosting and automated updates for the Avani Agro Foods platform.

## 1. Hosting & Automation Details
- **Provider**: Vercel (Production)
- **Primary Domain**: [avaniagrofoods.com](https://avaniagrofoods.com)
- **Automation Method**: GitHub CI/CD (Linked to repository)
- **Vercel Project Name**: `avani-agro-foods-latur-2026`
- **GitHub Repository**: `avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026`

## 2. 'Auto Mode' (GitHub Sync)
The project is configured for **Auto Mode**. Every time you push changes to the GitHub repository:
1. Vercel automatically detects the update.
2. A new production build is generated.
3. The live site is updated within minutes.

### Manual Command Sync
If you need to push updates manually from your local machine, use:
```powershell
npx vercel --prod
```

## 3. DNS Configuration (Hostinger)
To keep the site running on your professional domain, ensure the following records are set in your **Hostinger DNS Panel**:

| Type | Name | Value | Priority |
| :--- | :--- | :--- | :--- |
| **A** | @ | `216.198.79.1` | - |
| **CNAME** | www | `cname.vercel-dns.com` | - |

> [!IMPORTANT]
> The **A Record (@)** must point to Vercel's IP for the professional domain to load correctly.

## 4. Contact Information (Rebranded)
- **Global Business Email**: `sales@avaniagrofoods.com`
- **Fallbacks**: Standardized across all legal pages (Privacy, Disclaimer, Affiliate).
