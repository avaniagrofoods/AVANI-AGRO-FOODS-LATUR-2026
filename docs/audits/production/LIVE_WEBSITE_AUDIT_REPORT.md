# LIVE WEBSITE AUDIT REPORT — PACKAGE 3F.115

**Audited Target:** `https://www.avaniagrofoods.com/`  
**Audit Date:** 16 November 2026  
**Method:** Non-destructive live HTTP/TLS/Header/DNS/API telemetry inspection (no destructive scanning or DoS testing).

---

## 1. Live Route & Security Header Telemetry

| Endpoint | HTTP Status | Latency | Security Headers Observed | Body / Notes |
| :--- | :---: | :---: | :--- | :--- |
| `https://avaniagrofoods.com/` | `308` | — | Redirect `Location: https://www.avaniagrofoods.com/` | Canonical apex redirect active |
| `https://www.avaniagrofoods.com/` | `200` | `890ms` | `HSTS: max-age=63072000; includeSubDomains; preload`, `XFO: SAMEORIGIN` | Serves bundle `assets/index-B7I8sXz1.js` (pre-3F.106 deploy) |
| `/products` | `200` | `78ms` | Same as root | Renders SPA shell cleanly |
| `/moringa-leaf-powder` | `200` | `180ms` | Same as root | Accessible |
| `/red-onion-powder` | `200` | `125ms` | Same as root | Accessible |
| `/moringa-powder-bulk-supplier-india` | `200` | `255ms` | Same as root | Accessible |
| `/red-onion-powder-bulk-supplier-india` | `200` | `332ms` | Same as root | Accessible |
| `/about` | `200` | `307ms` | Same as root | Accessible |
| `/contact` | `200` | `464ms` | Same as root | Accessible |
| `/sitemap.xml` | `200` | `747ms` | Valid XML (`10746 bytes`) | Lists homepage, `/about`, `/products`, landing pages, articles |
| `/robots.txt` | `200` | `774ms` | `944 bytes` | Allows public product, blog & landing pages |
| `/api/verify-gate` (GET) | `405` | `1420ms` | `X-Frame-Options: DENY`, `HSTS: true` | `{"error":"Method not allowed"}` |
| `/api/leads` (GET) | `405` | `1435ms` | `XFO: SAMEORIGIN`, `HSTS: true` | `Method Not Allowed` |
| `/api/admin-quotations` (GET unauth) | `401` | `1278ms` | `XFO: SAMEORIGIN`, `HSTS: true` | `{"error":"Unauthorized admin access"}` (pre-3F.106 runtime) |
| `/api/importers` (GET unauth) | `401` | `855ms` | `XFO: DENY`, `HSTS: true` | Fails closed unauthenticated |
| `/api/email-reply-webhook` (GET) | `405` | `864ms` | `XFO: SAMEORIGIN`, `HSTS: true` | Rejects GET cleanly |

---

## 2. Prioritized Live Audit Findings

1. **[HIGH — Deployment Drift]:** Live site still executes pre-3F.106 serverless code (`assets/index-B7I8sXz1.js` / legacy 401 format) because Vercel blocked GitHub deployment `7822994829`. **Action:** Unblock deployment in Vercel Dashboard.
2. **[MEDIUM — DNS DMARC Policy]:** `_dmarc.avaniagrofoods.com` currently publishes `v=DMARC1; p=none`. Recommend upgrading to `p=quarantine; rua=mailto:sales@avaniagrofoods.com` after SPF/DKIM alignment monitoring.
3. **[PASS — TLS, HSTS, Robots, Sitemap, Schema.org]:** Organization, LocalBusiness, and WebSite JSON-LD structured data, HSTS preload, and canonical redirects are active and valid on live HTML.
4. **[PASS — Positioning]:** Meta tags and descriptions accurately describe export coordination & sourcing with qualified Indian processors without fabricated factory claims.
