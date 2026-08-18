# AVANI AGRO FOODS — CrUX & Core Web Vitals Monitoring Plan (Phase 4.3)

**Date:** August 18, 2026  
**Production URL:** https://www.avaniagrofoods.com/  
**Monitoring System:** Chrome User Experience Report (CrUX) + Google Search Console Core Web Vitals  
**Engineering Baseline:** Phase 4.2 Code-Split Production Build (`Build: 2026-08-18-v2.0.0`)

---

## 1. Executive Telemetry Overview

This document establishes the real-user performance monitoring framework for **AVANI AGRO FOODS**. We strictly separate **Lab (Lighthouse / Simulated Synthetic Tests)** from **Field (Real-User CrUX Telemetry)**.

```
+-------------------------------------------------------------------------------+
|                       PERFORMANCE MEASUREMENT ARCHITECTURE                     |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [LAB ENVIRONMENT] (Vite + Rollup Optimization)                              |
|  * Bundle Size: 100.04 kB entry JS / 21.53 kB CSS (19 Lazy-Loaded Chunks)    |
|  * Static Pre-rendered Hero & Font Preconnect                                |
|  * Lab LCP: ~0.8s | Lab INP: <50ms | Lab CLS: 0.00 | Lab TTFB: ~85ms         |
|                                                                               |
|  [FIELD DATA (CrUX)]                                                          |
|  * Requires 28-day rolling window of Chrome real-user visits                  |
|  * Current Status: [FIELD DATA NOT AVAILABLE — PENDING 28-DAY TRAFFIC VOLUME] |
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

## 2. Lab vs. Field Metric Registry

| Core Metric | Threshold (Good) | Lab Measurement | Field CrUX Status | Engineering Optimization Implemented |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | $\le 2.5\text{ s}$ | **0.8 s (GOOD)** | `FIELD DATA NOT AVAILABLE` | Pre-rendered semantic HTML hero, high-priority image tags, critical CSS bundle |
| **INP** (Interaction to Next Paint)| $\le 200\text{ ms}$ | **< 50 ms (GOOD)** | `FIELD DATA NOT AVAILABLE` | React 18 event delegation, zero synchronous blocking compute |
| **CLS** (Cumulative Layout Shift)  | $\le 0.10$ | **0.00 (GOOD)** | `FIELD DATA NOT AVAILABLE` | Explicit aspect-ratio containers, fixed hero dimensions, SVG icons |
| **FCP** (First Contentful Paint)   | $\le 1.8\text{ s}$ | **0.6 s (GOOD)** | `FIELD DATA NOT AVAILABLE` | 21.53 kB critical CSS in `<head>`, DNS preconnect to Google Fonts |
| **TTFB** (Time to First Byte)      | $\le 800\text{ ms}$| **85 ms (GOOD)** | `FIELD DATA NOT AVAILABLE` | Vercel Edge routing with immutable asset headers (`max-age=31536000`) |

---

## 3. Real-User Performance Monitoring Protocol

1. **Google Search Console Core Web Vitals Integration:**
   - Property: `https://www.avaniagrofoods.com/`
   - Review Path: **Search Console → Experience → Core Web Vitals** (Mobile & Desktop).
   - Frequency: Monthly audit cycle.
2. **PageSpeed Insights Field Aggregation:**
   - Monitor URL: `https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.avaniagrofoods.com%2F`
   - Evaluation Trigger: Upon accumulating 1,000+ monthly unique Chrome visitor sessions.
3. **Regression Protection Rules:**
   - Any new route or component must remain lazy-loaded via `React.lazy()` if size exceeds 15 kB.
   - External third-party scripts (Picky Assist, Zoho, EmailJS, Stripe) must load asynchronously or on user interaction.

---

## 4. Review Schedule & Governance

- **Initial Baseline Established:** August 18, 2026
- **First CrUX Traffic Check:** September 15, 2026
- **Next Formal Review Date:** September 18, 2026
- **Responsible Lead:** Senior Performance Engineer / Sachin Shinde (Owner)
