# AVANI AGRO FOODS — PHASE 3E CANONICAL CHANNEL AUDIT
**Audit Date:** 2026-10-03  
**Auditor:** Antigravity 2.0 Autonomous Verification Engine  
**Execution Context:** Pre-Flight Email Safety & Sourcing Channel Integrity  
**Eligible Cohort:** 16 Records  

---

## 1. Safety Classification Taxonomy
- **CANONICAL_B2B:** Dedicated commercial, executive, wholesale, or order processing inbox on verified corporate domain.
- **GENERIC_CORPORATE:** Domain-level corporate intake desk (e.g. `info@`) requiring generic department routing.
- **COMMITTEE_BUYING:** Cooperative/collective intake desk managed by a purchasing committee.
- **REJECTED:** Any address violating anti-spam hygiene, media desks, personal webmails, or web-scraping artifacts.

---

## 2. Record-by-Record Channel Audit

| ID | Company Name | Canonical Email | Classification | Domain Verified | Contamination Check | Suitability For Sourcing Inquiries |
|:--:|:---|:---|:---:|:---:|:---:|:---|
| **1** | Schiff Foods Products Co. | `sales@schifffood.com` | CANONICAL_B2B | YES (`schifffood.com`) | CLEAN | High — primary industrial sales & supplier intake desk |
| **3** | Aduna Superfoods | `info@aduna.com` | CANONICAL_B2B | YES (`aduna.com`) | CLEAN | High — official corporate supplier inquiry intake |
| **6** | Sunrise Edible Food Stuff LLC | `info@sunriseedible.com` | GENERIC_CORPORATE | YES (`sunriseedible.com`) | CLEAN | High — central trading desk for bulk commodity imports |
| **13** | Arabica Food Limited | `hello@arabicalondon.com` | CANONICAL_B2B | YES (`arabicalondon.com`) | CLEAN (PR purged) | High — commercial operations intake (`shop@` alternative) |
| **15** | All Good Agriculture | `hello@allgoodmoringa.com` | CANONICAL_B2B | YES (`allgoodmoringa.com`) | CLEAN | Exceptional — direct commercial brand desk for bulk moringa |
| **17** | DR WAKDE'S Ayurvedic Clinic | `info@drwakde.com` | CANONICAL_B2B | YES (`drwakde.com`) | CLEAN | High — customer & trade supplier intake desk |
| **19** | Roland Foods LLC | `hello@rolandfoods.com` | CANONICAL_B2B | YES (`rolandfoods.com`) | CLEAN | High — corporate partner & vendor intake desk |
| **21** | HEATONIST | `sales@heatonist.com` | CANONICAL_B2B | YES (`heatonist.com`) | CLEAN (Newsletter purged) | High — dedicated B2B wholesale desk (orders 200+ cases) |
| **24** | CM Spice | `sales@cmspice.com` | CANONICAL_B2B | YES (`cmspice.com`) | CLEAN | High — direct commercial spice procurement desk |
| **26** | Shakti Group USA | `info@shaktigroupusa.com` | CANONICAL_B2B | YES (`shaktigroupusa.com`) | CLEAN | High — corporate import & supplier desk |
| **27** | 4th Street Food Co-op | `drygoods@4thstreetfoodcoop.org` | COMMITTEE_BUYING | YES (`4thstreetfoodcoop.org`) | CLEAN (ISP purged) | High — dedicated bulk dry goods purchasing committee |
| **28** | HOS Global Foods | `orders@hosindia.com` | CANONICAL_B2B | YES (`hosindia.com`) | CLEAN | High — commercial order desk & trade vendor intake |
| **30** | Mincing Spice | `spice@mincing.com` | CANONICAL_B2B | YES (`mincing.com`) | CLEAN | High — industrial spice milling & procurement intake |
| **32** | Walker Foods Inc | `info@walkerfoods.net` | CANONICAL_B2B | YES (`walkerfoods.net`) | CLEAN | High — central corporate supplier inquiry desk |
| **34** | Regency Foods Ltd | `office@regencyfoods.com` | CANONICAL_B2B | YES (`regencyfoods.com`) | CLEAN | High — central commercial purchasing & office desk |
| **35** | Spiceway Wholesale | `sales@spicewaywholesale.com` | CANONICAL_B2B | YES (`spicewaywholesale.com`) | CLEAN | High — commercial wholesale trading desk |

---

## 3. Channel Safety Conclusions
All 16 channels have verified source provenance on authenticated corporate domains. Zero SMTP probes or email dispatches were executed.
