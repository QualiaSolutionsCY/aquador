# Roadmap · Milestone 4 · Handoff

**Project:** Aquad'or
**Milestone:** 4 of 4 (CURRENT — FINAL)
**Created:** 2026-05-15
**Phases:** 4
**Requirements covered:** POLISH-01..04, SEO-01..04, QA-01..03, HAND-01..04 (+ POLISH-05..11 carry-forwards from OPTIMIZE.md)

See `JOURNEY.md` for the full project arc. This file is ONLY Milestone 4's phases.

## Exit Criteria

What "shipped" means for this milestone:

- Lighthouse >= 90 on performance + accessibility for home / PDP / shop / checkout on both mobile (375px) and desktop (1280px)
- All canonical SEO present: meta, OG, Twitter, JSON-LD product schema, sitemap.xml, robots.txt, canonical URLs — on every public route
- Full Playwright pass on chromium / firefox / webkit + mobile chrome/safari exits 0; Stripe test-mode end-to-end confirms on both payment surfaces (cart checkout + custom perfume)
- Operator (Qualia) holds verified credentials to all six services, `docs/RUNBOOK.md` covers the 6 canonical ops, and domain aquadorcy.com is confirmed green on Vercel + UptimeRobot

---

## Phases

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Polish | Close every OPTIMIZE.md deferred finding (token migration, admin write-path hardening, orphan cleanup) and tighten all 8 customer-facing routes to production quality | POLISH-01..11 | ready |
| 2 | Content + SEO | Replace placeholder content with production copy/photography, write journal seed posts, generate complete per-page meta + JSON-LD, audit sitemap and robots.txt | SEO-01..04 | — |
| 3 | Final QA | Full Playwright suite, axe-core + keyboard-nav accessibility audit, Stripe end-to-end dry runs, Lighthouse performance budget, Sentry baseline, security re-audit | QA-01..03 | — |
| 4 | Handoff | Write the 4-5 promised ADRs, compile credentials inventory, record operator walkthrough, update RUNBOOK.md with full operator playbook, confirm domain + DNS + monitors | HAND-01..04 | — |

---

## Phase Details

### Phase 4.1: Polish

**Goal:** Resolve every deferred CRITICAL/HIGH/MEDIUM finding from `.planning/archive/milestone-3-admin-rebuild/OPTIMIZE.md` and complete a visual QA pass across all 8 customer-facing routes so no legacy v2.0 surface, off-token component, or broken state survives into Content+SEO.

**Depends on:** M3 verified (all admin phases complete). This phase must close before Phase 4.2 begins — SEO meta is written against polished, final copy; writing it against placeholder strings wastes the effort.

**Requirements covered:**
- POLISH-01: Visual pass across mobile (375px) / tablet (768px) / desktop (1280px+) on the 8 key routes (home, PDP, shop, category, cart, checkout, create-perfume, blog)
- POLISH-02: Empty / loading / error / offline states verified on all data-fetching routes
- POLISH-03: Copy pass — every visible string reviewed; brand voice consistent; no lorem ipsum or stub strings remain
- POLISH-04: Edge cases — sold-out, out-of-stock, blocked country, abandoned cart all behave gracefully
- POLISH-05 (carry-forward C1): `<ChatWidgetClient />` removed from root layout; `AiConciergeEntry` is the sole AI entry point — `src/app/layout.tsx:142`, `src/components/ai/ChatWidget.tsx`
- POLISH-06 (carry-forward C2): CookieConsent rewritten as a hairline-bottom strip using tokens + editorial micro-copy; no `font-playfair`, no hex/rgba, no rounded card — `src/components/ui/CookieConsent.tsx:55-110`
- POLISH-07 (carry-forward H1/H2/H4/H5): ProductCard, ProductDetails/ProductInfo (audit-and-merge), AddToCartButton, Navbar migrated to OKLCH tokens; Playfair/gold magic strings eliminated; synthetic AddToCartButton delay removed — `src/components/ui/ProductCard.tsx`, `src/components/products/ProductDetails.tsx`, `src/components/products/AddToCartButton.tsx`, `src/components/layout/Navbar.tsx`
- POLISH-08 (carry-forward H9): FeaturedGrid `'use client'` boundary removed; `FadeUp` moved to the card level so the section is RSC-streamable — `src/components/storefront/FeaturedGrid.tsx:1,73-106`
- POLISH-09 (carry-forward H12/H13/M15): Admin write paths (`/api/admin/orders/[id]` PATCH, `/api/admin/products` mutations, `admin-service.ts` functions) migrated to cookie-bound `createServerClient()` so RLS gates every mutation and `auth.uid()` is preserved in the audit trail
- POLISH-10 (carry-forward H16): `orders.customer_id` FK populated in the Stripe webhook handler for new orders; `getCustomerOrderHistory` query switched from `customer_email` join to `customer_id` join; backfill migration for existing order rows
- POLISH-11 (carry-forward M3/M6/M8/M10/M13): Legacy ProductGallery duplicate resolved (consumer audit + delete loser); AdminTable `sortable` prop either implemented or removed; AdminTopBar skeleton added for userEmail loading; ImageUploader `<img>` swapped for `next/image` at 96x96; AdminShell inline `bg-[var(--bg)]` standardized to `bg-bg` utility

**Success criteria:**
1. `grep -r "ChatWidgetClient\|ChatWidget" src/app/layout.tsx` returns 0 matches; `src/components/ai/ChatWidget.tsx` is deleted or unreachable from any route; the AI concierge entry point on every page routes through `AiConciergeEntry` only — verified by loading the homepage and confirming the casino-gold bubble is absent in DOM inspection.
2. CookieConsent renders as a single-line hairline strip (`border-t` token border, `bg-bg` background, `text-fg-muted` body text in the project body font); `grep -r "font-playfair\|rgba\|#[0-9a-fA-F]" src/components/ui/CookieConsent.tsx` returns 0 matches.
3. `grep -r "font-playfair\|text-gold\|bg-gold\|bg-emerald\|text-red-500\|rgba(" src/components/ui/ProductCard.tsx src/components/products/ProductDetails.tsx src/components/products/AddToCartButton.tsx src/components/layout/Navbar.tsx` returns 0 matches; the AddToCartButton no longer introduces a synthetic `setTimeout` delay; all four components render correctly at 375px and 1280px.
4. `grep -rn "createAdminClient" src/app/api/admin/orders src/app/api/admin/products src/lib/supabase/admin-service.ts` returns 0 matches on the mutation paths; every POST/PATCH/DELETE in those routes uses `createServerClient()` (cookie-bound); a manual Supabase audit of `orders` updated in the last 5 minutes shows a non-null `auth.uid()` in the relevant log event.
5. All 8 key routes (home, PDP, shop, category, cart, checkout, create-perfume, blog) render a loading skeleton or spinner while data fetches; a sold-out product on PDP shows a disabled Add-to-Cart with "Out of stock" copy; navigating to the cart with 0 items shows a purposeful empty state (not a blank white block); `npm run build && npx tsc --noEmit` both exit 0 with no new TypeScript errors.

---

### Phase 4.2: Content + SEO

**Goal:** Replace every placeholder content surface (hero copy, journal posts, static page copy, parchment-placeholder images) with production-ready editorial content, and generate the complete per-page SEO layer (metadata, Open Graph, JSON-LD, sitemap, robots.txt, canonical URLs) so the site is indexable and shareable at handoff.

**Depends on:** Phase 4.1 (Polish). Meta titles and OG descriptions are written against the final copy and final component text — authoring them against placeholders means rewriting them when copy lands. Images must be in their final positions before alt-text audit in Phase 4.3.

**Requirements covered:**
- SEO-01: Per-page `metadata` export (title, description, OG image, Twitter card) on every public route: `/`, `/shop`, `/shop/[category]`, `/products/[slug]`, `/blog`, `/blog/[slug]`, `/create-perfume`, `/about`, `/contact`, `/privacy`, `/shipping`, `/terms`, `/faq`
- SEO-02: JSON-LD `Product` schema on every PDP; `Article` schema on every blog post; `Organization` + `WebSite` schema in root layout
- SEO-03: `src/app/sitemap.ts` regenerated and confirmed to include all public products + blog posts from Supabase; `public/robots.txt` explicit with `Allow: /` and `Disallow: /admin`; every public page has a self-referencing canonical `<link>` tag
- SEO-04: Image alt text on every `<Image>` and `<img>` is descriptive (not "product image", not empty); verified by `grep -r "alt=\"\"" src/` returning 0 matches on customer-facing components

**Success criteria:**
1. `curl -s https://aquadorcy.com | grep -c "og:title"` returns >= 1; a manual Open Graph debugger check (og.cards or similar) on the homepage, one PDP, and one blog post shows the correct title, description, and image without fallback to the root layout default — confirming per-page metadata is populated, not inherited.
2. `curl -s https://aquadorcy.com/products/[any-slug] | python3 -m json.tool` (targeting the embedded `<script type="application/ld+json">` block) parses without error and contains `"@type": "Product"` with `name`, `image`, `offers.price`, and `offers.priceCurrency` populated from Supabase data — not hardcoded.
3. `curl -s https://aquadorcy.com/sitemap.xml | grep -c "<loc>"` returns >= 110 (100 products + 10+ blog posts + static pages); `curl -s https://aquadorcy.com/robots.txt` contains `Disallow: /admin` and `Sitemap: https://aquadorcy.com/sitemap.xml`.
4. The 7 static pages (`/about`, `/contact`, `/privacy`, `/shipping`, `/terms`, `/faq`, `/create-perfume`) contain no lorem ipsum, no placeholder copy marked "TBD" or "[insert]", no parchment placeholder images; every page has editorial body copy consistent with the brand voice (no em-dashes, no emojis, no casino-luxury language per the memory constraint from the approved motion/copy pattern list).
5. At least 3 journal/blog posts are published in Supabase with final copy, a featured image, and correct `blog_posts.status = 'published'`; each post's URL resolves to a 200 with its own `<title>` and OG tags distinct from the blog index page.

---

### Phase 4.3: Final QA

**Goal:** Run the complete automated test suite (Playwright cross-browser, axe-core, Lighthouse), execute Stripe test-mode dry runs on both payment surfaces, establish the Sentry error baseline, and confirm the security posture is clean before handoff — so what is handed off is verifiably production-grade, not aspirationally so.

**Depends on:** Phase 4.2 (Content + SEO). Lighthouse scores are measured against final content (images in place, meta loaded); accessibility audit runs against final copy (labels, alt text, heading hierarchy locked); Playwright runs against the real routes with real data.

**Requirements covered:**
- QA-01: Full Playwright suite on chromium / firefox / webkit + mobile chrome / mobile safari exits 0; covers at minimum: homepage load, shop filter + sort, PDP add-to-cart, cart drawer open/modify/close, checkout redirect to Stripe, create-perfume step flow, blog index + post read, admin login + dashboard view
- QA-02: Lighthouse >= 90 on performance + accessibility for home / PDP / shop / checkout on mobile (375px emulated) and desktop (1280px) — 8 Lighthouse runs total; score recorded in `.planning/archive/milestone-4-handoff/lighthouse-scores.md`
- QA-03: Stripe test-mode end-to-end: cart checkout completes with test card `4242 4242 4242 4242`; custom-perfume PaymentIntent flow completes with the same card; both flows trigger the Stripe webhook locally (or against preview URL with `stripe listen --forward-to`) and produce an order record in Supabase + a confirmation email via Resend

**Success criteria:**
1. `npm run test:e2e` exits 0 across all configured browsers (chromium, firefox, webkit, mobile chrome, mobile safari); no test is marked `.skip` without an accompanying GitHub issue reference; the suite covers at minimum the 8 flows listed in QA-01 above — confirmed by reading the Playwright summary report showing 0 failed / 0 skipped.
2. All 8 Lighthouse runs (4 routes × 2 viewports) score >= 90 on Performance and Accessibility; LCP on mobile homepage <= 2.5s; CLS <= 0.1; TBT <= 200ms on desktop — scores recorded in `.planning/archive/milestone-4-handoff/lighthouse-scores.md` with a timestamp and the exact `lighthouse` CLI command used.
3. axe-core accessibility audit (run via `@axe-core/playwright` in the Playwright suite OR as a standalone `axe` CLI scan) returns 0 critical violations on home, PDP, shop, and checkout; manual keyboard navigation on each route confirms: focus is visible at all times, modals trap focus, drawers close on Escape, no interactive element is unreachable by Tab alone.
4. Stripe test card `4242 4242 4242 4242` completes checkout through the hosted Stripe session and returns to the Aquad'or success URL; a corresponding `payment_intent.succeeded` webhook fires and writes an order to Supabase `orders` table (confirmed via Supabase table editor); Resend delivers a confirmation email to the test address within 60 seconds of checkout completion.
5. Stripe test card `4242 4242 4242 4242` completes the custom-perfume PaymentIntent flow and arrives at `/create-perfume/success` with the perfume composition metadata visible; the Supabase `orders` table receives a record with `source: 'custom_perfume'` (or equivalent metadata field) — confirming the second payment surface is end-to-end green.

---

### Phase 4.4: Handoff

**Goal:** Produce the three permanent handoff artifacts (ADR set, credentials inventory, RUNBOOK.md operator playbook), record or schedule the 30-minute admin walkthrough, and confirm the production domain, SSL, DNS, and monitors are green — leaving the operator with everything needed to run Aquad'or independently.

**Depends on:** Phase 4.3 (Final QA). ADRs are written after the codebase is stable — writing them against a moving implementation produces ADRs that mis-describe the actual decisions. Credentials are audited against the verified production deployment, not against a pre-QA state. The operator walkthrough is recorded against the final, polished admin — not a mid-polish interim state.

**Requirements covered:**
- HAND-01: Vercel / Supabase / Stripe / Sentry / Resend / OpenRouter / Upstash credentials verified accessible to Aquad'or operator; all secrets inventoried in a password manager entry or secure handoff doc (NOT committed to the repo)
- HAND-02: `docs/RUNBOOK.md` covers the 6 canonical operator operations: (1) deploying a code change, (2) rolling back a failed deploy, (3) refunding a Stripe order, (4) resetting the admin password, (5) restoring a Supabase DB backup, (6) reading and triaging a Sentry alert; plus the v3.0 additions: (7) creating a manual order, (8) publishing a blog post, (9) updating store settings, (10) managing product cohorts
- HAND-03: 30-minute admin walkthrough recorded (Loom or equivalent) or live session scheduled; covers: dashboard metrics, product CRUD, order detail + refund flow, manual order creation, blog editor + publish, settings page
- HAND-04: `aquadorcy.com` resolves to Vercel with SSL valid (TLS 1.3, no mixed-content warnings); UptimeRobot monitor at https://stats.uptimerobot.com/bKudHy1pLs shows UP; Sentry project `aquador` shows < 5 unresolved errors with severity >= high at handoff time

**ADRs to write (`.planning/decisions/`):**
- `2026-05-15-nextjs16-react19-stack.md` — Why Next 16 + React 19 at v3.0 reset rather than staying on 14/18; risks accepted (RSC mental model shift, fewer Framer Motion RSC integrations); reverting criteria [PROJECT.md §Key Decisions row "Migrate to Next 16 + React 19"]
- `2026-05-15-oklch-palette.md` — Why OKLCH over HSL / raw hex; perceptual uniformity, tinted neutrals, future wide-gamut displays; reverting criteria [PROJECT.md §Key Decisions row "OKLCH-first palette"]
- `2026-05-15-stripe-hosted-checkout.md` — Why Stripe-hosted Checkout Session over embedded Payment Element; documented swap from CART-02 spec; tradeoffs (less UI control, Apple/Google Pay included for free, PCI scope reduction); addresses OPTIMIZE.md H17 [OPTIMIZE.md High-17]
- `2026-05-15-single-product-type.md` — Why one canonical Supabase `Product` shape; the three-type drift problem (LegacyProduct / variant Product / Supabase Product); the cost of branching in ProductCard; reverting criteria [PROJECT.md §Key Decisions row "One canonical Product type"]
- `2026-05-15-editorial-luxury-direction.md` — Why editorial-luxury over casino-luxury; the §10b/§11 banned surface list; what the direction permits and forbids; how to evaluate a new component against it [DESIGN.md §Direction, OPTIMIZE.md C1/C2]

**Success criteria:**
1. All 5 ADRs exist in `.planning/decisions/` with the filenames above, each containing: date, status (Accepted), context, decision, consequences, and reverting criteria — confirming the OPTIMIZE.md H17 and H19 items are formally closed and the PROJECT.md §Key Decisions promises are honored.
2. `docs/RUNBOOK.md` exists, contains all 10 operator operation sections listed in HAND-02, and each section has at minimum: the trigger (when to use this), the step-by-step procedure, and the verification check (how to confirm it worked) — confirmed by reading the file end-to-end before sign-off.
3. The credentials inventory (stored outside the repo in a secure location confirmed by the operator) includes: Vercel team + project slug + deploy hook URL; Supabase project ref + service-role key + anon key; Stripe publishable key + secret key + webhook signing secret + dashboard URL; Sentry DSN + org + project; Resend API key + sending domain; OpenRouter API key; Upstash Redis REST URL + token (if configured); UptimeRobot login — each entry verified live by the operator confirming it resolves/authenticates correctly.
4. `curl -s -o /dev/null -w "%{http_code}" https://aquadorcy.com` returns 200; `curl -s -o /dev/null -w "%{http_code}" https://aquadorcy.com/admin` returns 302 (redirect to login); `curl -vI https://aquadorcy.com 2>&1 | grep "SSL certificate verify ok"` exits without error and shows TLS 1.3; UptimeRobot at https://stats.uptimerobot.com/bKudHy1pLs shows UP with >= 99.5% uptime in the last 7 days.
5. The admin walkthrough (Loom link or calendar invite) exists and is shared with the operator contact; the walkthrough covers all 7 sections listed in HAND-03 — confirmed by a timestamp on the recording or a calendar confirmation from the operator.

---

## Coverage Verification

Every M4 requirement maps to exactly one phase.

| Requirement | Phase | Covered? |
|-------------|-------|----------|
| POLISH-01 | 4.1 | Yes |
| POLISH-02 | 4.1 | Yes |
| POLISH-03 | 4.1 | Yes |
| POLISH-04 | 4.1 | Yes |
| POLISH-05 (ChatWidget removal) | 4.1 | Yes |
| POLISH-06 (CookieConsent rewrite) | 4.1 | Yes |
| POLISH-07 (ProductCard / ProductDetails / AddToCartButton / Navbar token migration) | 4.1 | Yes |
| POLISH-08 (FeaturedGrid RSC boundary fix) | 4.1 | Yes |
| POLISH-09 (admin write paths cookie-bound) | 4.1 | Yes |
| POLISH-10 (orders.customer_id FK adoption) | 4.1 | Yes |
| POLISH-11 (orphan cleanup — ProductGallery, AdminTable, AdminTopBar, ImageUploader, AdminShell) | 4.1 | Yes |
| SEO-01 | 4.2 | Yes |
| SEO-02 | 4.2 | Yes |
| SEO-03 | 4.2 | Yes |
| SEO-04 | 4.2 | Yes |
| QA-01 | 4.3 | Yes |
| QA-02 | 4.3 | Yes |
| QA-03 | 4.3 | Yes |
| HAND-01 | 4.4 | Yes |
| HAND-02 | 4.4 | Yes |
| HAND-03 | 4.4 | Yes |
| HAND-04 | 4.4 | Yes |

---

## What M4 Explicitly Does Not Do

- Rebuild any feature already shipped in M1-M3 (design system, storefront, admin — done)
- Multi-language, multi-currency, loyalty, subscription, ERP integrations (out of scope — JOURNEY.md §Out of Scope)
- Replace any vendor (Supabase, Stripe, Sentry, Resend — all stay)
- Launch a new product category or expand the catalog (curate, not expand — PROJECT.md §Out of Scope)

---

## Dependency Map

```
4.1 (Polish) → 4.2 (Content + SEO) → 4.3 (Final QA) → 4.4 (Handoff)
```

Strict linear sequence. Polish closes the deferred OPTIMIZE.md findings so SEO is authored against the final component surface. SEO populates all meta and alt text before Lighthouse and accessibility audits run. QA verifies the complete, content-populated system before the handoff artifacts are written against the verified deployment.

---

## Carry-Forward Reference (OPTIMIZE.md Deferred Items → Phase 4.1)

All deferred items from `.planning/archive/milestone-3-admin-rebuild/OPTIMIZE.md §Plan "Deferred (next milestone)"` are scoped to Phase 4.1 (Polish):

| OPTIMIZE Item | Severity | Phase 4.1 REQ-ID | Status at M4 open |
|---|---|---|---|
| H12: `/api/admin/orders/[id]` PATCH uses `createAdminClient()` | HIGH | POLISH-09 | Open |
| H13: `/api/admin/products` mutations via service-role | HIGH | POLISH-09 | Open |
| M15: admin-service.ts write functions lose `auth.uid()` | MEDIUM | POLISH-09 | Open |
| H16: `orders.customer_id` FK unused; query joins on email | HIGH | POLISH-10 | Open |
| H17: No ADR for Stripe hosted Checkout vs Payment Element swap | HIGH | HAND-04 (ADR) | Open |
| H18: STATE.md phase mismatch | HIGH | Closed by this state.js init | Closing now |
| H19: No ADRs exist in `.planning/decisions/` | HIGH | HAND-04 (ADR set) | Open |
| M3: Legacy ProductGallery duplicate | MEDIUM | POLISH-11 | Open |
| M6: AdminShell inline bg-[var(--bg)] | MEDIUM | POLISH-11 | Open |
| M8: AdminTopBar lacks skeleton for userEmail | MEDIUM | POLISH-11 | Open |
| M10: AdminTable `sortable` prop is silent no-op | MEDIUM | POLISH-11 | Open |
| M13: ImageUploader uses `<img>` not `next/image` | MEDIUM | POLISH-11 | Open |

Items C1 (ChatWidget removal), C2 (CookieConsent rewrite), H1/H2/H4/H5 (token migration wave) were partially addressed by the OPTIMIZE.md builder spawns but their completion criteria are verified here in Phase 4.1. Items already applied to the live DB (C3, H14, H15, M18, L8, L10) are closed and do not appear.

---

## When This Milestone Closes

Triggered by `/qualia-milestone` after `/qualia-verify` passes on Phase 4.4:

1. All phase artifacts archived to `.planning/archive/milestone-4-handoff/`
2. `tracking.json` `milestones[]` gets a final summary entry (num=4, name="Handoff", phases_completed=4)
3. REQUIREMENTS.md marks M4 requirements as **Complete**
4. Project status set to **Delivered** — no further milestones
5. Operator receives the final summary with the Loom link, RUNBOOK.md path, and UptimeRobot dashboard URL

---

*Last updated: 2026-05-15*
