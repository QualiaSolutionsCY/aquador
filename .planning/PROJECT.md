---
project: Aquad'or
project_type: full
client: Aquad'or Cyprus (internal — Qualia owns)
last_updated: 2026-05-14
---

# Aquad'or — Luxury Perfume E-Commerce

## What This Is

The Aquad'or storefront and admin panel — a Cyprus-based luxury perfume retailer carrying ~100 perfumes across women / men / niche / Lattafa / Al-Haramain / Victoria's Secret originals, plus a custom three-layer perfume builder. The platform sells, fulfills, and operates the business: catalog, cart, Stripe checkout, custom-perfume flow, blog, AI concierge, admin panel, order management.

The site is live at https://aquadorcy.com. v1.0–v2.0 shipped a working pipeline. **v3.0 is a ground-up reset** of the design system, storefront, and admin — same data, same business, new presentation that actually sells, and an admin that's a pleasure to run.

## Core Value

- **For shoppers:** the page reads like a letter from someone who knows scent, then converts when you've decided. No friction between intent and purchase.
- **For the operator:** a fast, honest admin that surfaces revenue, orders, and customers without spelunking through Supabase.

## Requirements

### Validated (shipped v1.0 → v2.0, March 2026)

**Commerce pipeline (v1.0):**
- ✓ Cart state with localStorage persistence
- ✓ Stripe Checkout Session for cart and custom perfume
- ✓ Stripe webhook signature verification
- ✓ Order persistence to Supabase (orders + customers)
- ✓ Customer + store confirmation emails via Resend
- ✓ Rate limiting on checkout/payment endpoints
- ✓ Sentry error tracking
- ✓ Server-side price validation against catalog
- ✓ Zod cart validation, shortened Stripe metadata
- ✓ Idempotent email sending (database-based dedup)
- ✓ Custom perfume success page detects payment correctly
- ✓ Webhook reconstructs items from shortened metadata

**Security (v1.1):**
- ✓ RLS on all 9 Supabase tables with 24 policies
- ✓ Sentry GDPR compliant (sendDefaultPii: false, 10% prod sampling)
- ✓ SQL injection protection in admin search
- ✓ Open redirect protection in admin login
- ✓ Permissions-Policy + hardened CSP (no `unsafe-eval`)
- ✓ Stripe webhook test suite (21 tests)
- ✓ Zod localStorage rehydration

**Performance (v1.1):**
- ✓ Database indexes (8) on products/blog/orders
- ✓ Blog ISR with 60s revalidation via public client
- ✓ N+1 query eliminated in getRelatedProducts
- ✓ Admin dashboard queries consolidated (10 → 5)
- ✓ Build-time AI catalogue generation (prebuild)

**Design (v1.2 → v2.0):**
- ✓ Gold-on-dark luxury template, responsive across viewports
- ✓ Framer Motion animations throughout
- ✓ 3D product viewer (later removed in v1.1, ~600KB savings)
- ✓ Parallax scroll experiments
- ✓ Editorial sharp typography refresh (recent commits)

### Active (v3.0 — Aquad'or Reset)

Captured by REQ-IDs in `REQUIREMENTS.md`. Full list there. Headline scope:
- [ ] Ground-up OKLCH design system replacing gold/dark hex palette
- [ ] Migrate Next 14 → 16 + React 18 → 19 + tooling alignment
- [ ] Unify three coexisting product types (`LegacyProduct`, variant `Product`, Supabase `Product`) into one canonical shape
- [ ] Token-driven primitive component library replacing ad-hoc Tailwind class soup
- [ ] Conversion-focused homepage, PDP, shop, cart, checkout
- [ ] Custom perfume builder rebuild (currently a 979-LOC monolith)
- [ ] AI fragrance concierge that feels like a concierge, not a chatbot
- [ ] Trust signals + email capture + accelerated checkout
- [ ] Admin dashboard with real revenue/AOV/conversion/LTV
- [ ] Admin tables with sort/filter/bulk-actions
- [ ] Rebuild Product/Order/Customer/Blog editors
- [ ] Fix CRITICAL `/api/admin/setup` auth model
- [ ] Move `/api/heartbeat` off service-role + public POST surface
- [ ] Route sitemap.ts through the Supabase adapter layer
- [ ] Handoff: polish, SEO sweep, final QA, credentials walkthrough

### Out of Scope

- New product categories beyond what already exists in Supabase (curate, don't expand)
- Multi-currency (EUR only)
- Multi-language i18n (defer to post-handoff v3.1)
- Mobile native apps (web only)
- Loyalty / rewards program (defer)
- Subscription / sample-club (defer)
- Replacing Supabase or Stripe (working fine, stay)
- Replacing Sentry (working fine, stay)
- Inventory ERP integration (out)

## Current Milestone

**M1 · Design Foundation** — direction commit, OKLCH tokens, stack upgrade, type unification, primitive components. See `JOURNEY.md` for the full arc and `ROADMAP.md` for M1 phase detail.

## Context

**Live URL:** https://aquadorcy.com
**Preview:** https://aquador-next.vercel.app
**Repo:** github.com/QualiaSolutionsCY/aquador (main branch auto-deploys disabled; deploys via GH Actions)
**Codebase:** ~32k LOC TS/TSX, Next 14.2.35 App Router, React 18, TS strict, Supabase Postgres, Stripe, Resend, Sentry, Upstash, Vercel
**Map:** `.planning/codebase/` — architecture, stack, conventions, concerns, onboarding (scanned 2026-05-14)
**Data:** ~100 perfumes + blog posts + admin_users in Supabase. Schema stable.

## Key Decisions (carried forward + new for v3.0)

| Decision | Rationale | Status |
|---|---|---|
| Server-side price validation against catalog | Client prices untrusted — e-commerce security floor | Carried (v1.0) |
| Stripe webhook is single source of truth for orders | Resilient to client failure | Carried (v1.0) |
| Database-based email idempotency (upsert + dedup) | Webhook retries can't double-send | Carried (v1.0) |
| RLS anon / admin / service-role layering | Defense-in-depth | Carried (v1.1) |
| Public Supabase client for read-only SSG/ISR | Cookie-free, avoids forcing dynamic | Carried (v1.1) |
| Build-time AI catalogue via prebuild script | Fresh data, no cold-start latency | Carried (v1.1) |
| EUR-only, free shipping always | Cyprus market, simplifies messaging | Carried (v1.0) |
| **v3.0 — Migrate to Next 16 + React 19 as part of M1** | Build the new design system on the target stack, not migrate later | New |
| **v3.0 — One canonical Product type (Supabase shape)** | Three-type drift taxes every consumer; ProductCard literally branches on shape | New |
| **v3.0 — OKLCH-first palette, no raw hex** | Color-correct, perceptually uniform, allows tinted neutrals | New |
| **v3.0 — Editorial-luxury direction, NOT casino-luxury** | Differentiate from gold-on-black perfume e-comm cliché | New |
| **v3.0 — Token-driven primitives in `src/components/ui/`** | Single source of truth for visual language; kills Tailwind class soup | New |
| **v3.0 — Admin gets a real dashboard before any table CRUD** | Operator value comes from at-a-glance numbers, not nicer forms | New |
| **v3.0 — Schema stays; type system unifies in code** | DB is fine; the drift is TS-side | New |
| **v3.0 — `/api/admin/setup` security hole closed before any new admin work** | CRITICAL from codebase map; pre-existing exposure | New |

ADRs for hard-to-reverse decisions live in `.planning/decisions/`.

## Constraints

- **Stack target:** Next 16, React 19, TypeScript 5.x strict, Node 20
- **Hosting:** Vercel (custom domain aquadorcy.com), Supabase (ref hznpuxplqgszbacxzbhv), Stripe, Resend, Sentry, Upstash Redis (optional)
- **Existing data must survive the redesign** — no data migrations, no breaking changes to webhook contract
- **`main` is the deploy branch** — feature branches only, never push direct (per `rules/`)
- **Deploys via GitHub Actions** (`.github/workflows/deploy.yml`), not Vercel git auto-deploy
- **Budget:** internal project (Qualia owns), velocity over perfection — ship M1 in days, not weeks

---
*v3.0 substrate written 2026-05-14. v1.0–v2.0 history preserved in `.planning/archive/pre-v3-2026-04-10/`.*
