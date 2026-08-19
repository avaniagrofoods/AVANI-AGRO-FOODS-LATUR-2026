# AVANI Agro Foods Site Audit and Deployment Plan

## Goal Description

Perform a comprehensive audit of the project located at `C:\Users\ALPHA-1\Desktop\AVANI AGRO FOODS LATUR 2026` to ensure it meets Google Search Console (GSC) requirements, validate critical integrations for lead tracking and conversion, remove unnecessary files, run automated dummy‑traffic cycles to verify integrations, add appropriate `Disallow` rules to `robots.txt`, and finally execute the deployment commands.

## User Review Required

> [!IMPORTANT] **Open Questions / Decisions Needed**
> - **Technology Stack**: Is the site a static HTML site, a React/Vite app, a WordPress site, or something else? Knowing the build/deploy commands (e.g., `npm run build`, `jekyll build`, etc.) is essential.
> - **Lead Tracking Services**: Which specific services need to be confirmed (e.g., Google Analytics, Facebook Pixel, HubSpot, custom CRM webhook)? Provide any existing snippet IDs if available.
> - **Deploy Destination**: Where should the site be deployed (e.g., Netlify, Vercel, Azure, on‑prem server via SSH, Docker)? Need the exact deployment command or CI/CD pipeline details.
> - **Pages to Block**: The user mentioned “DIRECTORY, AFFILIATE, B2B Indian Manufacturers DB, Global Importers DB”. Confirm the exact URL paths or directories that must be disallowed in `robots.txt`.
> - **Dummy Traffic Tool**: Preferred method for generating dummy traffic (e.g., Puppeteer script, curl loops, Lighthouse ‘runOnly: script’). Provide any existing scripts.

Please provide the above details so the plan can be refined.

## Open Questions

- What build tool / framework is used?
- Which analytics / CRM integrations are present?
- Target deployment environment and command?
- Exact URL patterns for robots.txt disallow rules.
- Preferred method for dummy traffic simulation.

---

## Proposed Changes

### 1. Inventory and GSC Compliance Check
- **[NEW] audit_report.md** – Generated report summarising missing meta tags, schema markup, sitemap presence, and other GSC items.
- **[MODIFY] existing HTML/JS files** – Insert missing `<meta name="robots" content="noindex, nofollow">` where required, add JSON‑LD structured data if absent.

### 2. Integration Verification
- **[NEW] integration_check.js** – Node/Puppeteer script that loads key pages, captures network requests and console logs for Google Analytics, Meta Pixel, HubSpot, etc.
- **[MODIFY] existing tracking snippets** – Ensure snippet IDs are present and not duplicated.

### 3. Remove Unnecessary Files
- Identify and delete files/folders unrelated to the website (e.g., old design drafts, test data, unused assets).
- **[DELETE] path/to/unneeded_folder/** – Example placeholder; actual paths will be determined during audit.

### 4. Robots.txt Updates
- **[NEW] robots.txt** – Add `User-agent: *` and `Disallow:` rules for the specified sections.
```
User-agent: *
Disallow: /DIRECTORY/
Disallow: /AFFILIATE/
Disallow: /B2B-Indian-Manufacturers-DB/
Disallow: /Global-Importers-DB/
```

### 5. Dummy Traffic Cycles
- **[NEW] dummy_cycle.sh** – Bash/Powershell script that runs the `integration_check.js` twice with a short delay to simulate two dummy cycles.

### 6. Deployment Execution
- **[NEW] deploy.sh** – Wrapper script that runs the appropriate build command (to be supplied) and triggers deployment (e.g., `netlify deploy --prod`, `vercel --prod`, `az webapp up`).

## Verification Plan

### Automated Tests
- Run `node integration_check.js` and parse output for presence of expected network requests (GA, Pixel, etc.).
- Execute `npm run lint` (if applicable) on modified files.
- Use `curl -I https://example.com/robots.txt` to confirm robots.txt is served correctly.

### Manual Verification
- After deployment, open key pages in a browser, open DevTools → Network, confirm tracking pixels fire.
- Use Google Search Console URL Inspection tool to verify indexing status of allowed pages.
- Perform a quick SEO crawl (e.g., Screaming Frog) to ensure no unexpected blocked resources.

---

**Next Steps**
1. Await user clarification on the open questions above.
2. Once clarified, execute the inventory, create the scripts, update `robots.txt`, and run the dummy cycles.
3. Perform deployment and final verification.

*All scripts will be placed under the project root for easy execution.*
