---
date: 2026-05-15 11:30
mode: ui + backend + alignment
critical: 3
high: 19
medium: 24
low: 16
status: critical_issues
---

# Optimization Report — Aquad'or v3.0-reset

Three parallel agents (frontend / backend / alignment) audited the codebase against PROJECT.md, DESIGN.md §10b, REQUIREMENTS.md, and the security rules. The shop-filter system was redesigned by a separate builder during this run (committed at `dc286ed`) so its files are excluded from the findings below.

**Top-line:** the v3.0 storefront foundations are solid (RLS on every table, service-role never on client, Stripe webhook contract intact, M2/M3 functionality shipped). The dominant pattern of findings is **legacy v2.0 surface still bleeding through** — ChatWidget, CookieConsent, ProductCard, ProductDetails, Navbar, error pages — alongside a handful of real security/data-integrity issues on the admin side.

---

## Critical (3)

| # | Dim | Finding | Location | Fix |
|---|-----|---------|----------|-----|
| 1 | Frontend | ChatWidget ships casino-luxury gold-gradient bubble on every page — direct anti-reference per §10b/§11. Also duplicates the editorial AiConciergeEntry. | `src/components/ai/ChatWidget.tsx:141-227`, `src/app/layout.tsx:142` | Remove `<ChatWidgetClient />` from root layout; the editorial `AiConciergeEntry` is canonical. |
| 2 | Frontend | CookieConsent banner uses `font-playfair`, hex/rgba, rounded card aesthetic, sales-floor voice on every first visit. | `src/components/ui/CookieConsent.tsx:55-110`, `src/app/layout.tsx:140` | Rewrite as a hairline-bottom strip with tokens + editorial micro copy. |
| 3 | Backend | Anon-write policies on `storage.objects` for the `products` bucket — anonymous visitors could INSERT/UPDATE files staged under aquadorcy.com. | `storage.objects` policies `Allow public uploads/updates to products bucket` | **APPLIED** — both policies dropped, admin-gated siblings cover the legitimate path. |

---

## High (19)

| # | Dim | Finding | Location | Fix |
|---|-----|---------|----------|-----|
| 1 | Frontend | ProductCard off-token + banned Playfair, gold magic strings, `bg-emerald-50/text-red-500` status pills | `src/components/ui/ProductCard.tsx:62,122-171` | Migrate to tokens (`bg-bg-alt`, `border-border`, `font-display`, `text-accent-deep`, `<Badge>` for sale/stock) |
| 2 | Frontend | ProductDetails PDP main panel — `font-playfair`, `text-gold`, emerald/red Tailwind status pills, inline `<svg>` icons | `src/components/products/ProductDetails.tsx:46-127` | Token migration + Badge variants + Lucide icons |
| 3 | Frontend | ProductInfo (likely dead overlap with ProductDetails) — same banned fonts/colors | `src/components/products/ProductInfo.tsx:22-86` | Verify consumer; delete if dead, migrate if live |
| 4 | Frontend | AddToCartButton uses gold-gradient surface + fake 200ms loading delay on the conversion path | `src/components/products/AddToCartButton.tsx:38-110` | Replace with `<Button>` primitive, remove synthetic delay |
| 5 | Frontend | Navbar — `rgba(...)` literals, `text-gold`/`bg-gold` magic strings, fixed-px logo heights, loaded on every page | `src/components/layout/Navbar.tsx:77-208` | Migrate to `bg-bg/96`, `shadow-1`, `text-fg`, `text-accent`; replace pixel heights with fluid clamp() |
| 6 | Frontend | admin/error.tsx dark-mode-only colors against light admin chrome | `src/app/admin/error.tsx:23-44` | `bg-bg`, `bg-bg-alt`, `text-critical`, Button primitive |
| 7 | Frontend | Root error.tsx — `font-playfair`, `text-gradient-gold`, casino aesthetic on recovery page | `src/app/error.tsx:21-49` | Token-driven, editorial restraint, brand-voice copy |
| 8 | Frontend | Customer-detail loading skeleton — `bg-gray-800 animate-pulse` blocks on light surface; off-token link | `src/app/admin/customers/[id]/page.tsx:64-78` | `<Skeleton>` primitive, token classes |
| 9 | Frontend | FeaturedGrid forces `'use client'` purely for IntersectionObserver — eliminates RSC streaming | `src/components/storefront/FeaturedGrid.tsx:1,73-106` | Compose `FadeUp` at the card level so the section can be RSC |
| 10 | Frontend | ChatWidget a11y — unlabeled inputs + close button, magic-pixel sizes, fixed bg-gold | `src/components/ai/ChatWidget.tsx:149-227` | Resolves with Critical-1 (delete) |
| 11 | Backend | `customer_cohorts` migration untracked + not in production — `/api/admin/customers/[id]/cohorts` POST/DELETE return 500 | `supabase/migrations/20260515082534_customer_cohorts.sql` | Apply migration to prod, commit file |
| 12 | Backend | `/api/admin/orders/[id]` PATCH notes path uses inline `createAdminClient()` bypassing RLS re-check | `src/app/api/admin/orders/[id]/route.ts:131` | Use cookie-bound `createClient()` so RLS gates the UPDATE |
| 13 | Backend | `/api/admin/products` mutates via service-role — RLS not consulted; audit trail loss | `src/app/api/admin/products/route.ts:120,149,170` → `admin-service.ts:457-503` | Cookie-bound writer variants, RLS enforces is_admin |
| 14 | Backend | `is_admin()` + `upsert_customer_on_order` SECURITY DEFINER granted EXECUTE to anon | pg_proc | **APPLIED** — REVOKE EXECUTE from anon (both) and authenticated (upsert) |
| 15 | Backend | `live_chat_messages` "Anyone can read messages" USING (true) — every customer-support exchange world-readable | pg_policies | **APPLIED** — policy dropped |
| 16 | Backend | `live_chat_sessions` anon SELECT/INSERT USING(true)/WITH CHECK(true) — abuse vector + visibility of other visitors' sessions | `supabase/migrations/20260515000001_live_chat_sessions_rls.sql:36,48` | Per-session token + rate-limit at the API layer (deferred — needs a session-id model) |
| 17 | Alignment | CART-02 documented as embedded Payment Element; code uses Stripe-hosted Checkout Session. No ADR documents the swap. | `REQUIREMENTS.md:58` vs `src/app/api/checkout/route.ts:72`, `src/components/cart/CheckoutButton.tsx:65` | Write `.planning/decisions/2026-05-15-stripe-hosted-checkout.md` |
| 18 | Alignment | STATE.md says Phase 1/setup/0% while M3 P1–P4 are all on disk; `/qualia` router will misroute | `.planning/STATE.md:7-8` | Run `/qualia-milestone` to close M3 + advance to M4 |
| 19 | Alignment | No ADRs exist (`.planning/decisions/` contains only `_template.md`) for the 8 hard-to-reverse v3.0 decisions | `PROJECT.md:117-124` | Write 3-5 short ADRs (Next 16 stack, OKLCH palette, hosted Checkout, single Product type, OK ADR placeholder) |

---

## Medium (24)

| # | Dim | Finding | Location | Fix |
|---|-----|---------|----------|-----|
| 1 | Frontend | Hero text-shadow uses raw rgba — §10 anti-pattern | `src/components/storefront/Hero.tsx:233` | Replace with oklch-tinted shadow |
| 2 | Frontend | CartIcon `hover:text-gold` + `bg-gold` legacy | `src/components/cart/CartIcon.tsx:14,43` | `hover:text-accent-deep`, `bg-accent text-bg` |
| 3 | Frontend | Legacy ProductGallery duplicate (3D loader, dark hex tokens) | `src/components/products/ProductGallery.tsx:17-300` | Verify consumer, delete the loser |
| 4 | Frontend | OrderDetail / CustomerDetail lack inline error region for PATCH 500s | `src/components/admin/OrderDetail.tsx`, `CustomerDetail.tsx` | Surface inline error state when mutation fails |
| 5 | Frontend | globals.css ships `.display-text`, `.eyebrow`, `.pull-quote`, `.ruled-gold` referencing banned Playfair/Poppins | `src/app/globals.css:731,744,749` | Switch utility vars to `var(--font-display)` / `var(--font-micro-family)` |
| 6 | Frontend | AdminShell uses inline `bg-[var(--bg)]` instead of `bg-bg` utility (inconsistent) | `src/components/admin/AdminShell.tsx:70-97` | Use Tailwind utility for consistency |
| 7 | Frontend | CartDrawer empty state copy promises specifics; CTA is generic | `src/components/cart/CartDrawer.tsx:76-92` | Render 3 thumbs of featured items below CTA OR adjust copy |
| 8 | Frontend | AdminTopBar lacks loading/skeleton for user-email | `src/components/admin/AdminShell.tsx:45-61` | `<Skeleton>` while userEmail null |
| 9 | Frontend | Orders list `columns` not memoized | `src/app/admin/orders/page.tsx:119-184` | useMemo + useCallback |
| 10 | Frontend | AdminTable accepts `sortable: true` but ignores it (silent no-op) | `src/components/admin/AdminTable.tsx:127-140` | Either omit the prop until implemented or log a dev warning |
| 11 | Frontend | AiConciergeDrawer role-label contrast at 11px on 375px viewport not verified | `src/components/ai/AiConciergeDrawer.tsx:44-52` | Audit AA contrast; bump weight if needed |
| 12 | Frontend | AdminTableToolbar status filter uses bespoke `bg-accent/12` arbitrary value | `src/app/admin/orders/page.tsx:206` | Introduce `--surface-accent-tint` token |
| 13 | Frontend | ImageUploader preview uses `<img>` (no next/image optimization) | `src/components/admin/ImageUploader.tsx:187-198` | next/image fill at 96×96 |
| 14 | Backend | `/api/email-capture` has no rate limit; combined with anon-insert policy = mailing-list spam vector | `src/app/api/email-capture/route.ts:15-88` | Add `checkRateLimit(request, 'email-capture')` + honeypot |
| 15 | Backend | Admin write paths via service-role lose `auth.uid()` audit trail | `src/lib/supabase/admin-service.ts:457,479,503,585` | Optional Supabase client param, cookie-bound from route |
| 16 | Backend | `getCustomerOrderHistory` joins by `customer_email` not `customer_id` (FK + index unused) | `src/lib/supabase/admin-service.ts:677` | Populate `orders.customer_id` in webhook + switch query |
| 17 | Backend | Heartbeat IP salt fallback `'aquador'` if env unset | `src/app/api/heartbeat/route.ts:33` | Throw in prod if `HEARTBEAT_SALT` missing |
| 18 | Backend | `store_settings_set_updated_at` mutable `search_path` | pg_proc | **APPLIED** — `SET search_path TO 'public','pg_temp'` |
| 19 | Backend | `.single()` vs `.maybeSingle()` inconsistency on admin gates — 500 vs 403 | products, orders, blog, blog/[slug], orders/[id] route handlers | Mass-replace with `.maybeSingle()` |
| 20 | Backend | AI route returns 500 instead of 503 when `OPENROUTER_API_KEY` missing | `src/app/api/ai-assistant/route.ts:192-194` | Short-circuit with 503 |
| 21 | Alignment | Latent emoji on `fragranceDatabase` notes (not yet rendered, regression risk) | `src/lib/perfume/notes.ts:25-50+` | Drop `icon` field |
| 22 | Alignment | `customer_cohorts` shipped without an ADMIN-* REQ-ID | REQUIREMENTS.md | Add ADMIN-09 |
| 23 | Alignment | Admin chrome (AdminShell/Sidebar/TopBar/ImageUploader) not documented in any REQ | REQUIREMENTS.md | One-liner under ADMIN-08 |
| 24 | Frontend | Hero noise SVG base64 inline; not cacheable | `src/components/storefront/Hero.tsx:225-228` | Move to globals.css class |

---

## Low (16)

| # | Dim | Finding | Location | Fix |
|---|-----|---------|----------|-----|
| 1–7 | Backend | 7 unused indexes (blog_posts × 3, product_categories, orders × 2, products × 4) | advisor report | Drop after M3 close once `idx_orders_customer_id` is used |
| 8 | Backend | `live_chat_sessions.admin_id` no covering index | advisor | **APPLIED** — index added |
| 9 | Backend | `console.error` instead of `Sentry.captureException` across heartbeat, settings, blog, health, cohorts routes | various | Replace with `Sentry.captureException` |
| 10 | Backend | `admin_users_delete`/`update` policies on `{public}` not `{authenticated}` | pg_policies | **APPLIED** — ALTER POLICY TO authenticated |
| 11 | Backend | `escapeIlike` trailing backslash edge case | `admin-service.ts:393-395` | Trim trailing `\` |
| 12 | Frontend | BrandMarquee uses U+2019 apostrophe in one entry vs `&apos;` elsewhere | `src/components/storefront/BrandMarquee.tsx:15` | Pick one canonical form |
| 13 | Frontend | `Section.tsx` primitive references banned ambient gold + Playfair; still consumed by /about, /contact, /privacy, /shipping, /terms | `src/components/ui/Section.tsx:18-23,113,206` | Migrate static pages off Section, delete primitive |
| 14 | Frontend | ChatWidget uses `Sentry.addBreadcrumb` instead of `Sentry.captureException` for failed AI requests | `ChatWidget.tsx:108` | Resolves with Critical-1 (delete) |
| 15 | Frontend | Storefront ProductGallery thumbnails lack `role="tablist"`/`role="tab"` semantics | `ProductGallery.tsx:114-153` | Add ARIA roles |
| 16 | Alignment | Em-dashes in /about page customer copy | `src/app/about/page.tsx:42,68` | Replace `—` with `. ` or `: ` |

---

## Plan

**Already applied during this run (live DB):**
- C3 (storage anon-writes dropped)
- H14 (REVOKE EXECUTE)
- H15 (live_chat_messages "Anyone can read" dropped)
- M18 (store_settings_set_updated_at search_path)
- L8 (live_chat_sessions admin_id index)
- L10 (admin_users policies → authenticated)

Migration captured at `supabase/migrations/20260515110000_security_hardening_from_optimize.sql`.

**Quick inline wins (this session, 1 commit):**
- C1: remove ChatWidget from layout
- H11: apply + commit customer_cohorts migration
- M1 (Hero rgba → oklch shadow)
- M2 (CartIcon legacy gold → tokens)
- M14 (email-capture rate limit + honeypot)
- M17 (heartbeat salt throw)
- M19 (.single → .maybeSingle across admin gates)
- M20 (AI 503)
- M21 (drop emoji icon field)
- L9 (console.error → Sentry.captureException)
- L16 (about page em-dashes)

**Builder spawns (background, ~30 min each):**
- BUILDER A — "Casino-eliminate": rewrite CookieConsent, Navbar, root error.tsx, admin/error.tsx, customer-detail skeleton (~5 files, all token-migration shape).
- BUILDER B — "PDP retoken": ProductCard, ProductDetails / ProductInfo audit-and-merge, AddToCartButton (~3-4 files).

**Deferred (next milestone):**
- H12/H13/M15 (admin write paths cookie-bound refactor) — needs admin-service signature change, atomic enough for a small phase
- H16 (live_chat_sessions tightening) — needs visitor-token design
- H17/H18/H19 (ADRs + milestone close) — handled by `/qualia-milestone` flow once code stabilizes
- M3 (legacy ProductGallery duplicate cleanup) — needs consumer audit
- M16 (orders.customer_id FK adoption + backfill)
