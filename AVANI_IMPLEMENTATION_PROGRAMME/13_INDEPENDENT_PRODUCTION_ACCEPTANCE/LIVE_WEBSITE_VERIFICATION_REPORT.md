# LIVE WEBSITE VERIFICATION REPORT
## INDEPENDENT VERIFICATION OF PRODUCTION DEPLOYMENT, HEADERS, AND RUNTIME BEHAVIOUR

**Target Production URL:** `https://www.avaniagrofoods.com/`  
**Hosting Infrastructure:** Vercel Global Edge Network  
**Probe Timestamp:** 17 November 2026 21:07:05 UTC+05:30  
**Auditor:** Principal Website Performance & Infrastructure Auditor  
**Audit Status:** **GREEN (INFRASTRUCTURE & SERVING) / AMBER (DEPLOYMENT PARITY)**  

---

## 1. PRODUCTION DEPLOYMENT IDENTIFIERS

| Dimension | Audited Value | Evidence / Source |
| :--- | :--- | :--- |
| **Hosting Provider** | Vercel Serverless Edge Platform | HTTP Header `server: Vercel` |
| **Edge POP Serving Traffic** | Mumbai, India (`bom1`) | Header `x-vercel-id: bom1::kf7mx-1794929828453-0aca9f2e2437` |
| **Commit Deployed** | `2f1a5481fd47488244277b3c756995bbcce75315` | Latest commit present on `origin/main` |
| **SSL / TLS Version** | TLS 1.3 / Let's Encrypt Wildcard SSL | Verified via HTTPS handshake |
| **HSTS Enforcement** | `max-age=63072000; includeSubDomains; preload` | 2-Year Strict Transport Security active |
| **X-Content-Type-Options** | `nosniff` | Present on all responses |
| **X-Frame-Options** | `SAMEORIGIN` | Present on HTML responses |
| **Cache-Control** | `public, max-age=0, must-revalidate` | Edge cache configured |

---

## 2. PRODUCTION ENDPOINT PROBE RESULTS

All probes executed via live network fetch requests:

| Target Endpoint | Method | Status | Latency | Payload Size | Audited Behaviour |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `https://www.avaniagrofoods.com/` | `GET` | **200 OK** | 1,730ms | 6,113 bytes | Clean React 18 SPA HTML shell; GA4 tag `G-Y825G54Z0L` present; preconnect links active. |
| `https://www.avaniagrofoods.com/robots.txt` | `GET` | **200 OK** | 89ms | 944 bytes | Crawlers permitted; private paths blocked; references `sitemap.xml`. |
| `https://www.avaniagrofoods.com/sitemap.xml` | `GET` | **200 OK** | 77ms | 10,746 bytes | 50+ deep canonical URLs indexed covering export products and industry portals. |
| `https://www.avaniagrofoods.com/moringa-powder` | `GET` | **200 OK** | 71ms | 6,113 bytes | Moringa Leaf Powder product landing page returns 200 OK. |
| `https://www.avaniagrofoods.com/red-onion-powder` | `GET` | **200 OK** | 71ms | 6,113 bytes | Dehydrated Red Onion Powder landing page returns 200 OK. |
| `https://www.avaniagrofoods.com/api/save-lead` | `GET` | **405 Method Not Allowed** | 1,264ms | 30 bytes | Rejects non-POST methods with `Allow: POST` and `{"error":"Method Not Allowed"}`. |
| `https://www.avaniagrofoods.com/api/save-lead` | `OPTIONS` | **405 Method Not Allowed** | 349ms | 30 bytes | Enforces POST-only ingress. |

---

## 3. PRODUCTION DEPLOYMENT PARITY GAP

While the infrastructure serving `https://www.avaniagrofoods.com/` is healthy, high-performing, and properly configured with security headers:

> [!WARNING]
> **Deployment Parity Notice:** The live Vercel deployment is serving commit `2f1a548`. The local source code modifications in `api/save-lead.js` and `api/_lib/supabaseClient.js` (UUIDv4 server ID generation, caller ID stripping, and insert-only mode) have not yet been pushed to GitHub `origin/main` and therefore are **NOT YET ACTIVE IN THE LIVE VERCEL ENVIRONMENT**.

---

## 4. AUDIT CONCLUSION

The live website engine infrastructure is fully functional and stable. Once the local working-tree changes are staged, committed, and pushed, Vercel will trigger a new deployment and establish 100% parity between local hardened code and live production serving.

---
*Report Certified by Principal Website Performance & Infrastructure Auditor.*
