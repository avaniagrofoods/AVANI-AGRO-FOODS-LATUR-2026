# PRODUCTION DEPLOYMENT REPORT — PACKAGE 3F.115

**Project:** `AVANI AGRO FOODS WEBSITE ENGINE` (`avani-agro-foods-latur-2026`)  
**Vercel Project ID:** `prj_3DBOT7AbclhcQ6318u4bETdbnhrQ` (Team: `team_vUTeKhQxcSPYtztYtoLMWinO`)  
**Production Target:** `https://www.avaniagrofoods.com/`  

---

## 1. Deployment Execution & Status

- **Pushed Commit:** `0e60321` (`main` branch on `avaniagrofoods/AVANI-AGRO-FOODS-LATUR-2026`)
- **Triggered Vercel Deployment ID:** `7822994829` (`created_at: 2026-11-16T11:42:07Z`, `environment: Production`)
- **Vercel Commit Status:** `failure` — **`"Deployment was blocked"`**  
  URL: `https://vercel.com/avaniagrofoods1356-4705s-projects/avani-agro-foods-latur-2026/BpS7DY8iJ9mTww1BS3KuNK3TM3ZW`
- **Historical Context Confirmed via GitHub API:** Commits from `8fe06d2` (Nov 3) through `24a1007` (Nov 6) and `0e60321` (Nov 16) have all received `"Deployment was blocked"` from `vercel[bot]`, and earlier Oct deployments were canceled/inactive. Local CLI (`vercel` binary / `%APPDATA%\com.vercel.cli\auth.json`) is not authenticated locally.
- **Live Bundle Proof:** `https://www.avaniagrofoods.com/` currently serves `assets/index-B7I8sXz1.js` and `/api/admin-quotations` returns the pre-3F.106 401 body (`{"error":"Unauthorized admin access"}`), whereas the freshly built local bundle produces `assets/index-D9l62DFI.js` and `/api/admin-quotations` (`0e60321`) returns `{"error":"Unauthorized: Valid Admin Session Required.", "code":"SESSION_MISSING", "authenticated":false}`.

---

## 2. Cloud Provider Readiness Summary

| Provider | Verified Live State | External Operation Pending |
| :--- | :--- | :--- |
| **Vercel** | Project `.vercel/project.json` linked; auto-deploy `7822994829` blocked | Unblock Git deployment in Vercel Dashboard (`BpS7DY8iJ9mTww1BS3KuNK3TM3ZW`), verify env vars, promote `main` |
| **Supabase** | Host `zqemrmzijlaysvfxygst.supabase.co`; `.env.local` has revoked key (`401`); rotated key `sb_secret_oUwlG...` referenced in commit `7bb3412` | Execute `20261110_quotations_table.sql` in Supabase SQL Editor after DB backup; verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel |
| **Upstash Redis KV** | Redis Lua CAS code verified (`ATOMIC_WEBHOOK_COMPLETE_LUA`) | Confirm `KV_REST_API_URL`/`TOKEN` (or `UPSTASH_REDIS_REST_*`) and `REQUIRE_DISTRIBUTED_KV=1` are set in Vercel Production |
| **Resend** | Domain `avaniagrofoods.com` `verified`; **BOTH** webhooks (`87adea51...` `/api/email-reply-webhook` and `9cbe2dbd...` `/api/admin-quotations?action=delivery-webhook`) confirmed `enabled` (`HTTP 200`) | Verify `RESEND_WEBHOOK_SECRET` in Vercel matches active webhook signing secret |
| **DNS (SPF/DKIM/DMARC)** | SPF (`include:zoho.in include:_spf.mail.hostinger.com include:resend.com ~all`), DKIM (`resend._domainkey`), DMARC (`p=none`) live via DNS | Optional: include `include:senderspf.net` if enabling Sender.net sequences |

---

## 3. Rollback Readiness

- Git history is strictly additive (`24a1007 -> b265ad3 -> caffeed -> 0e60321`). No history was force-pushed or rewritten.
- Reverting to pre-3F.115 code can be executed cleanly via `git revert` without losing audit logs or DB rows; Supabase schema migration `20261110_quotations_table.sql` uses non-destructive `ADD COLUMN IF NOT EXISTS` and `ON DELETE SET NULL`.
