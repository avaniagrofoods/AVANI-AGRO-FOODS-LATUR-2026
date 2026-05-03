# Avani Agro Foods - Maintenance & Audit Checklist

To ensure the site remains stable and production-ready in "Auto Mode," please verify the following external settings:

## 1. DNS Verification (Hostinger)
Ensure your DNS records exactly match Vercel's requirements to prevent "Site Unreachable" errors:
- **Type A**: `@` pointing to `76.76.21.21`
- **Type CNAME**: `www` pointing to `cname.vercel-dns.com`
- **Redirects**: Ensure no conflicting "Domain Forwarding" is active in Hostinger; Vercel handles the redirection via `vercel.json`.

## 2. Vercel Production Settings
- **Environment Variables**: Verify that `VITE_ZOHO_ORG_ID` and `VITE_SHEETS_WEBHOOK` are added in the Vercel Dashboard (Settings > Environment Variables).
- **Domain Health**: Check the "Domains" tab in Vercel to ensure both `avaniagrofoods.com` and `www.avaniagrofoods.com` have a green "Valid Configuration" badge.

## 3. SEO Verification
- **Google Search Console**: Re-submit `https://www.avaniagrofoods.com/sitemap.xml` now that the canonical URLs have been updated.
- **JSON-LD**: Use the [Google Rich Results Test](https://search.google.com/test/rich-results) to verify the new structured data in `index.html`.

## 4. Troubleshooting Runtime Issues
- If you see a red "Something went wrong" screen, it is the new **ErrorBoundary** catching a crash. Check the browser console (F12) for the specific error message to share with developers.
