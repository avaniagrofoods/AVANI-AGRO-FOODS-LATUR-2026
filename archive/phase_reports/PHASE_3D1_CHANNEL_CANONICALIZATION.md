# AVANI AGRO FOODS — PHASE 3D.1 CHANNEL CANONICALIZATION AUDIT
**Audit Date:** 2026-10-03  
**Auditor:** Antigravity 2.0 Autonomous Verification Engine  
**Execution Context:** Final Read-Only Channel Canonicalization & Contamination Audit  

---

## 1. Executive Channel Summary

Across the 19 cohort records:
- **Canonical Deliverable Inboxes Established:** 16 records
- **Alternative Domain Channels Documented:** 3 records (IDs 13, 17, 27)
- **Contaminated Channels Expunged & Rejected:** 5 records (IDs 4, 13, 21, 27, 29)
- **Zero Digital Channel / Channel Missing:** 2 records (IDs 7, 29)
- **Consumer Webmail Only (Blocked):** 1 record (ID 4)

---

## 2. Per-Record Channel Canonicalization Table

| ID | Company Name | Frozen Ingest Email | Phase 3D Primary | Final Canonical Email | Alternative Inboxes | Rejected Channels | Channel Classification & Disposition |
|:--:|:---|:---|:---|:---|:---|:---|:---|
| **1** | Schiff Foods Products Co. | sales@schifffood.com | sales@schifffood.com | **sales@schifffood.com** | *None* | *None* | **CANONICAL** (First-party commercial sales desk) |
| **3** | Aduna Superfoods | info@aduna.com | info@aduna.com | **info@aduna.com** | *None* | *None* | **CANONICAL** (First-party general commercial intake) |
| **4** | Ital Vital Herbs | italvitalherb@gmail.com | italvitalherb@gmail.com | **NONE** | *None* | italvitalherb@gmail.com | **REJECTED** (Unauthenticated consumer webmail; Phase 3E blocked) |
| **6** | Sunrise Edible Food Stuff LLC | info@sunriseedible.com | info@sunriseedible.com | **info@sunriseedible.com** | *None* | *None* | **CANONICAL** (First-party corporate trading desk) |
| **7** | MAJID SPICE MILL LLC Branch | Not Available | null | **NONE** | *None* | *None* | **CHANNEL_MISSING** (No electronic channel exists; Phase 3E blocked) |
| **13** | Arabica Food Limited | pr@arabicalondon.com | hello@arabicalondon.com | **hello@arabicalondon.com** | shop@arabicalondon.com | pr@arabicalondon.com | **CANONICAL** (`hello@`); **ALTERNATIVE** (`shop@`); **REJECTED** (`pr@` media desk) |
| **15** | All Good Agriculture | hello@allgoodmoringa.com | hello@allgoodmoringa.com | **hello@allgoodmoringa.com** | *None* | *None* | **CANONICAL** (First-party brand domain commercial intake) |
| **17** | DR WAKDE'S Ayurvedic Clinic | Not Available | info@drwakde.com | **info@drwakde.com** | clinic@drwakde.com | *None* | **CANONICAL** (`info@`); **ALTERNATIVE** (`clinic@`) |
| **19** | Roland Foods LLC | hello@rolandfoods.com | hello@rolandfoods.com | **hello@rolandfoods.com** | *None* | *None* | **CANONICAL** (First-party corporate customer intake desk) |
| **21** | HEATONIST | ilovehotsauce@heatonist.com | sales@heatonist.com | **sales@heatonist.com** | *None* | ilovehotsauce@heatonist.com | **CANONICAL** (`sales@` wholesale desk); **REJECTED** (`ilovehotsauce@` fan newsletter) |
| **24** | CM Spice | sales@cmspice.com | sales@cmspice.com | **sales@cmspice.com** | *None* | *None* | **CANONICAL** (First-party commercial sales desk) |
| **26** | Shakti Group USA | info@shaktigroupusa.com | info@shaktigroupusa.com | **info@shaktigroupusa.com** | *None* | *None* | **CANONICAL** (First-party corporate inquiries desk) |
| **27** | 4th Street Food Co-op | adminwg@mail.mayfirst.org | drygoods@4thstreetfoodcoop.org | **drygoods@4thstreetfoodcoop.org** | produce@4thstreetfoodcoop.org | adminwg@mail.mayfirst.org | **CANONICAL** (`drygoods@` buying committee); **ALTERNATIVE** (`produce@`); **REJECTED** (`adminwg@` ISP listserv) |
| **28** | HOS Global Foods | orders@hosindia.com | orders@hosindia.com | **orders@hosindia.com** | *None* | *None* | **CANONICAL** (First-party commercial order processing desk) |
| **29** | Allegiant Spice | team@latofonts.com | null | **NONE** | *None* | team@latofonts.com | **CHANNEL_MISSING**; **REJECTED** (`team@latofonts.com` font CSS artifact; Phase 3E blocked) |
| **30** | Mincing Spice | spice@mincing.com | spice@mincing.com | **spice@mincing.com** | *None* | *None* | **CANONICAL** (First-party industrial spice order desk) |
| **32** | Walker Foods Inc | info@walkerfoods.net | info@walkerfoods.net | **info@walkerfoods.net** | *None* | *None* | **CANONICAL** (First-party corporate intake desk) |
| **34** | Regency Foods Ltd | office@regencyfoods.com | office@regencyfoods.com | **office@regencyfoods.com** | *None* | *None* | **CANONICAL** (First-party corporate office desk) |
| **35** | Spiceway Wholesale | sales@spicewaywholesale.com | sales@spicewaywholesale.com | **sales@spicewaywholesale.com** | *None* | *None* | **CANONICAL** (First-party commercial sales desk) |

---

## 3. Specific In-Depth Channel Evaluations

### ID 13: Arabica Food Limited
- `hello@arabicalondon.com`: **CANONICAL**. Official general corporate and commercial intake on authentic primary domain.
- `shop@arabicalondon.com`: **ALTERNATIVE**. Verified B2B wholesale ordering portal intake.
- `pr@arabicalondon.com`: **REJECTED**. Public relations and press enquiry desk. Unsuitable for commercial spice procurement outreach.

### ID 15: All Good Agriculture
- `hello@allgoodmoringa.com`: **CANONICAL**. Direct commercial brand inbox for All Good Agriculture Ltd. Clean, first-party verified.

### ID 21: HEATONIST
- `sales@heatonist.com`: **CANONICAL**. Official dedicated wholesale and bulk buying channel for accounts ordering 200+ cases.
- `ilovehotsauce@heatonist.com`: **REJECTED**. Consumer-facing fan newsletter and retail marketing submission address.

### ID 27: 4th Street Food Co-op
- `drygoods@4thstreetfoodcoop.org`: **CANONICAL**. Designated operational channel for the bulk dry goods purchasing committee.
- `produce@4thstreetfoodcoop.org`: **ALTERNATIVE**. Verified fresh goods purchasing desk.
- `adminwg@mail.mayfirst.org`: **REJECTED**. External hosting server infrastructure listserv (May First Movement Technology).

### ID 29: Allegiant Spice
- `team@latofonts.com`: **REJECTED**. Critical web-scraping contamination originating from Google Fonts stylesheet attribution header (`@import`) for Lato font author Łukasz Dziedzic.
- Direct Email: **NONE**. Only unaddressed webform exists.
