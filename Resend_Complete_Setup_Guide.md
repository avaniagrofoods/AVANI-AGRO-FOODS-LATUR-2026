# Resend.com Complete Setup Guide & Documentation

**Last Updated:** October 2026  
**Official Docs:** https://resend.com/docs

---

## 1. What is Resend? Purpose & Use Cases

**Resend** is a modern, developer-first email API platform designed for sending **transactional** and **marketing** emails with excellent deliverability, simple APIs, and full observability.

### Core Purpose
Resend replaces traditional email services (like SendGrid, Mailgun, Postmark, or SMTP servers) with a clean REST API + SDKs that make email a first-class citizen in modern web applications.

### What You Can Use Resend For

#### For Websites & Web Applications
| Use Case | Example | Type |
|----------|---------|------|
| **User Authentication** | Welcome emails, password reset, magic links, email verification | Transactional |
| **E-commerce** | Order confirmations, shipping updates, invoices, abandoned cart | Transactional |
| **Notifications** | Account alerts, security notices, system status updates | Transactional |
| **Contact Forms** | Form submissions forwarded to your team | Transactional / Receiving |
| **Newsletters** | Weekly digests, product updates, blog roundups | Marketing (Broadcasts) |
| **Onboarding Sequences** | Multi-step welcome series | Automations |
| **Support** | Ticket confirmations, reply handling | Sending + Receiving |

#### Other Common Uses
- SaaS product transactional emails
- Mobile app push alternatives / email fallbacks
- AI agents that need to send/receive email
- Internal tools & admin notifications
- Marketing campaigns & audience segmentation
- Inbound email processing (webhooks)
- SMTP relay for legacy systems (WordPress, Laravel, etc.)

### Key Advantages
- **No production approval needed** — Free accounts can send real emails immediately
- **Excellent deliverability** (SPF, DKIM, DMARC, dedicated IPs on higher plans)
- **React Email** support (write emails as React components)
- **Webhooks** for real-time events (delivered, opened, clicked, bounced…)
- **Receiving emails** (inbound) via webhooks
- **Broadcasts** (marketing) + **Automations** + **Templates**
- Official SDKs for almost every language/framework
- CLI + MCP Server for AI agents

**Free Tier (as of 2026):** ~3,000 emails/month (100/day limit), 1 domain.

---

## 2. Get Started – Full Step-by-Step Setup

### Prerequisites
1. A Resend account → Sign up at [https://resend.com](https://resend.com)
2. A domain you own (buy one from Cloudflare, Namecheap, GoDaddy, etc. if needed)
3. Access to your domain’s DNS settings

> **Important:** You **must** verify a domain before you can send emails to real recipients (except test addresses).

---

### Step 1: Create an API Key

**Path in Dashboard:**  
`Dashboard → API Keys → Create API Key`

#### Detailed Fields & Options

| Field | Required | Description | Best Practice |
|-------|----------|-------------|---------------|
| **Name** | Yes | Human-readable name (max 50 characters) | e.g. `Production`, `Staging`, `Next.js App`, `AI Agent` |
| **Permission** | Yes | `Sending access` or `Full access` | Use **Sending access** for most apps. Use **Full access** only if you need to manage domains, contacts, webhooks, etc. via API. |
| **Domain restriction** (optional) | No | Restrict the key to a specific verified domain | Recommended for security – limits damage if key is leaked |

#### How to Create (Dashboard)
1. Go to **API Keys** page in the left sidebar.
2. Click **Create API Key**.
3. Enter a **Name**.
4. Select permission:
   - **Sending access** → Can only send emails
   - **Full access** → Full CRUD on all resources
5. (Optional) Restrict to one domain.
6. Click **Add** / **Create**.
7. **Copy the key immediately** — it is shown only once (format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).

#### Store the Key Securely
```bash
# .env or .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Add `.env` to `.gitignore`.

#### Alternative Creation Methods
- **API:** `POST /api-keys`
- **CLI:** `resend api-keys create --name "Production" full_access`
- **MCP Server** (for AI agents)

---

### Step 2: Add & Verify a Domain

**Path in Dashboard:**  
`Dashboard → Domains → Add Domain`

#### Detailed Fields & Options

| Field | Required | Description | Recommendation |
|-------|----------|-------------|----------------|
| **Domain name** | Yes | Full domain or subdomain | **Strongly recommend a subdomain** e.g. `mail.example.com`, `notifications.example.com`, `updates.example.com` |
| **Region** | Yes | Where emails are sent from | Choose closest to majority of recipients:<br>• `us-east-1` (default)<br>• `eu-west-1`<br>• `sa-east-1`<br>• `ap-northeast-1` |
| **Return-Path subdomain** (optional) | No | Custom Return-Path | Default is `send.<your-domain>`. Leave blank unless you have special needs. |
| **Capabilities** | — | Sending / Receiving | Enable both if you need inbound email |

#### Full Verification Steps
1. Navigate to **Domains** → **Add Domain**.
2. Enter domain (preferably subdomain).
3. Select **Region**.
4. (Optional) Set custom Return-Path.
5. Click **Add**.
6. Resend shows DNS records you must add:

   Typical records:
   - **DKIM** → CNAME or TXT (`resend._domainkey`)
   - **SPF** → TXT (`v=spf1 include:amazonses.com ~all` or similar)
   - **MX** (for receiving / Return-Path)
   - Sometimes additional CNAMEs for tracking

7. Go to your DNS provider (Cloudflare, Namecheap, etc.) and **exactly** copy-paste the records.
   - **Important:** Do **not** enable proxy (orange cloud) on Cloudflare for these records.
8. Wait for verification (usually < 15 minutes, max 72 hours).
9. Click **Verify DNS Records** or wait for auto-verification.
10. (Recommended) Add a **DMARC** record after verification for better deliverability and spoofing protection.

#### After Verification Options
- Enable **Open Tracking**
- Enable **Click Tracking**
- Set **TLS** mode: `opportunistic` (default) or `enforced`
- Enable **Receiving** (inbound emails)

---

### Step 3: Email Types Overview

Resend supports two main categories:

#### Transactional Emails
- 1-to-1, event-triggered
- Examples: password resets, order confirmations, welcome emails
- Sent via API, SDK, CLI, or SMTP
- High priority, high deliverability

#### Marketing / Broadcasts
- 1-to-many campaigns
- Newsletters, product updates, promotions
- Use **Broadcasts** feature + Contacts/Segments/Topics
- Separate reputation isolation recommended (different subdomain)

---

### Step 4: AI Onboarding
Resend has excellent AI tooling:
- MCP Server for AI agents
- AI-assisted template generation
- Natural language scheduling (“send in 1 hour”)

---

## 3. Sending Emails – Quick Examples

### Node.js / Next.js (Most Common for Websites)

```bash
npm install resend
```

```ts
// app/api/send/route.ts (Next.js App Router)
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  const { data, error } = await resend.emails.send({
    from: 'Acme <onboarding@yourdomain.com>',  // Must be on verified domain
    to: ['user@example.com'],
    subject: 'Welcome!',
    html: '<p>Hello <strong>world</strong>!</p>',
    // Optional:
    // react: EmailTemplate({ firstName: 'John' }),
    // attachments: [...],
    // scheduledAt: 'in 1 hour',
    // tags: [{ name: 'category', value: 'welcome' }],
  });

  if (error) {
    return Response.json({ error }, { status: 500 });
  }
  return Response.json(data);
}
```

### Other Popular Stacks
- **Express, Hono, Bun, Astro, Remix, Nuxt, SvelteKit, RedwoodJS**
- **Serverless:** Vercel Functions, Cloudflare Workers, Supabase Edge, AWS Lambda, Deno Deploy
- **Python:** Flask, FastAPI, Django
- **PHP:** Laravel, Symfony
- **Ruby:** Rails, Sinatra
- **Go, Rust (Axum), Elixir (Phoenix), Java, .NET**
- **SMTP:** Any app that supports SMTP (WordPress, Nodemailer, PHPMailer, Auth0, Customer.io, etc.)

**SMTP Settings:**
- Host: `smtp.resend.com`
- Port: `465` (SSL) or `587` (STARTTLS)
- Username: `resend`
- Password: Your API Key

---

## 4. Dashboard Sections Explained

### Emails
View all sent & scheduled emails, previews, status, logs, shareable links.

### Broadcasts
Create & send marketing campaigns to segments. Visual editor + performance tracking.

### Automations
Build multi-step email flows triggered by events (custom events, conditions, delays, wait-for-event, send email, update contact, etc.).

### Templates
Reusable email templates with variables. Create in visual editor or via API. Version history supported.

### Audience / Contacts
- Global contact list
- Custom properties
- Segments (internal grouping)
- Topics (user preference management)
- Unsubscribe handling

### Metrics
Deliverability & engagement analytics (opens, clicks, bounces, complaints…).

### Domains
Manage verified domains, DNS records, tracking, TLS, receiving, regions.

### Logs
Full API request/response logs for debugging.

### API Keys
Create, view, edit, revoke keys. Permission & domain scoping.

### Webhooks
Real-time event notifications:
- `email.sent`, `email.delivered`, `email.opened`, `email.clicked`
- `email.bounced`, `email.complained`, `email.failed`
- Domain, contact, suppression, inbox events, etc.

---

## 5. Advanced Features Summary

| Feature | Purpose |
|---------|---------|
| **Batch Sending** | Send up to 100 personalized emails in one request |
| **Attachments & Embed Images** | Files + CID inline images |
| **Schedule Email** | Natural language or exact timestamp |
| **Idempotency Keys** | Prevent duplicate sends |
| **Custom Headers** | List-Unsubscribe, X-Entity-Ref-ID, etc. |
| **Tags** | Categorize emails for analytics |
| **Suppressions** | Automatic bounce/complaint handling |
| **Deliverability Insights** | AI-powered suggestions per email |
| **Receiving + Webhooks** | Process inbound emails |
| **DMARC / BIMI / Tracking** | Advanced authentication & branding |

---

## 6. Best Practices for Websites

1. **Always use a subdomain** for sending (`mail.`, `notify.`, `updates.`).
2. **Separate transactional and marketing** on different subdomains if volume is high.
3. Store API key in environment variables — never commit it.
4. Use **idempotency keys** for critical emails (password resets, payments).
5. Implement **webhooks** to track delivery and handle bounces/complaints.
6. Add a proper **unsubscribe link** for marketing emails.
7. Warm up new domains gradually if sending high volume.
8. Monitor **Logs** and **Metrics** regularly.
9. Use **React Email** or Templates for consistent, maintainable designs.
10. Enable **DMARC** after domain verification.

---

## 7. Resources & Next Steps

- Official Docs: https://resend.com/docs
- SDKs: https://resend.com/docs/sdks
- CLI: https://resend.com/docs/cli
- MCP Server (AI): https://resend.com/docs/mcp-server
- Examples: https://resend.com/docs/examples
- DNS Provider Guides: Available in knowledge base
- Pricing: https://resend.com/pricing

---

**This guide covers the complete Get Started path and major features.**  
For framework-specific code, visit the official quickstarts under **Sending examples** in the Resend docs.

Happy sending! 🚀
