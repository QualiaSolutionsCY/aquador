# Journey — Aquad'or v3.0 Reset

Full arc from kickoff to handoff. v1.0–v2.0 already shipped (see `archive/pre-v3-2026-04-10/`). v3.0 is the ground-up reset: new design system, conversion-focused storefront, rebuilt admin.

**4 milestones · 16 phases · ends in Handoff**

---

## Milestone 1 · Design Foundation  [CURRENT]

**Why now:** Every storefront and admin page in M2/M3 is built on the design tokens, primitive components, and unified type system from M1. Building them before consolidating these would mean rebuilding twice. The Next 16 / React 19 upgrade also belongs here — the new components should target the new stack natively.

**Exit criteria:**
- `DESIGN.md` commits to one aesthetic direction, OKLCH palette, type pair, motion tokens. Cross-checked against the design-laws absolute bans.
- App builds and runs on Next 16 + React 19 with all existing routes working.
- One canonical `Product` type. `LegacyProduct` deleted. `ProductCard` no longer branches on shape.
- Primitive component library (`Button`, `Input`, `Card`, `Table`, `Drawer`, `Dialog`, `Tabs`, `Tooltip`, `Badge`) live under `src/components/ui/` and consumed by at least one existing page to prove they integrate.

**Phases (3):**

### Phase 1.1 — Direction & Tokens
**Goal:** Lock the aesthetic direction, write `DESIGN.md` with OKLCH palette + distinctive type pair + spacing/motion tokens, ship `src/styles/tokens.css`.
**Success criteria:**
- DESIGN.md §1 commits to one direction (editorial-luxury, Levant-coded), not a hedge
- All colors in OKLCH; no raw `#000`/`#fff` anywhere in tokens.css
- Display + body type pair chosen + loaded; not Playfair/Poppins/Inter
- Spacing scale on 8px grid with fluid `clamp()` page padding
- Motion tokens defined (ease-out-quart, durations); `prefers-reduced-motion` respected

### Phase 1.2 — Stack & Type Unification
**Goal:** Migrate to Next 16 + React 19, consolidate three product types to one canonical Supabase-shape `Product`, fix the 24 pre-existing failing Jest tests.
**Success criteria:**
- `next@^16`, `react@^19`, `eslint@^9`, drei/fiber majors aligned. `npm run build` exits 0.
- `LegacyProduct` deleted from `src/types/index.ts`; all consumers ported.
- `ProductCard` accepts one shape only; no branching on `snake_case` vs `camelCase`.
- All Jest suites pass (target: 0 failing tests, currently 24 failing across 5 suites).
- E2E Playwright run passes on chromium.

### Phase 1.3 — Primitive Components
**Goal:** Build the token-driven primitive component library; integrate into at least one existing page (smoke test the system).
**Success criteria:**
- `Button`, `Input`, `Textarea`, `Select`, `Card`, `Table` (with sort/header), `Drawer`, `Dialog`, `Tabs`, `Tooltip`, `Badge`, `Toast` exist under `src/components/ui/`
- Each primitive uses tokens only (no raw hex, no `text-gold-500` magic strings)
- Each primitive supports the 7 states: default, hover, focus, active, disabled, loading, error
- Existing homepage or product page renders at least one primitive in place of its current ad-hoc Tailwind block, as a sanity check
- Storybook NOT required (out of scope); a `src/app/admin/_design/page.tsx` showcase route is OK

**Requirements covered:** DESIGN-01..04, STACK-01..03, TYPE-01..02, PRIM-01..05

---

## Milestone 2 · Storefront That Sells  [SKETCHED]

**Why now:** With tokens + primitives + unified types from M1 in hand, the customer-facing rebuild is mechanical assembly, not invention. Doing M2 before M1 would mean ad-hoc Tailwind everywhere again.

**Exit criteria:**
- New homepage, PDP, shop, cart, checkout, custom-perfume builder, AI concierge live behind a feature flag or on a preview branch
- Conversion baseline captured (Vercel Analytics + Sentry sessions); new design at parity or better on visit→add-to-cart and add-to-cart→purchase
- Mobile-first: every page works at 375px with 44px touch targets
- Trust signals (shipping, returns, authenticity, secure checkout) present on PDP + cart + checkout

**Phases (sketched — full detail in `/qualia-milestone` when M2 opens):**

1. **Homepage** — hero with clearer value prop, first-fold CTA, editorial sections (notes story, brand story, journal), top picks, AI concierge entry, email capture.
2. **Product Detail Page** — large imagery, notes/composition story, social proof, sticky Add-to-Cart on mobile, sample CTA, related/cross-sell.
3. **Shop / Category** — filters (notes family, brand, gender, price), sort, perceived-fast load with skeleton + ISR, hover micro-interactions.
4. **Cart Drawer + Checkout** — fewer clicks, Stripe Payment Element with Apple/Google Pay, trust signals, sticky summary on mobile.
5. **Custom Perfume Builder + AI Concierge** — rebuild the 979-LOC `create-perfume/page.tsx` as a real conversion flow; AI concierge as a sidebar that knows the catalog and current cart.

**Requirements covered:** HOME-01..05, PDP-01..06, SHOP-01..04, CART-01..05, CREATE-01..04, AI-01..03, TRUST-01..03

---

## Milestone 3 · Admin Rebuild  [SKETCHED]

**Why now:** The admin's value comes from the data the storefront generates. Until M2 ships, M3's dashboard has nothing real to show. Sequencing M3 after M2 also frees the rebuild from compensating for the old storefront's quirks.

**Exit criteria:**
- Real dashboard renders revenue / orders / AOV / conversion rate / customer LTV / top products from Supabase (not placeholders)
- All admin tables support sort, multi-column filter, bulk-select with bulk actions
- Product / Order / Customer / Blog editors rebuilt; no monolithic 568-LOC forms
- `/api/admin/setup` security hole closed; `/api/heartbeat` moved off public service-role POST; `src/app/sitemap.ts` routed through the adapter
- Admin internal `_design` showcase moves to `/admin/_design` (gated by admin-users) for ongoing pattern reference

**Phases (sketched):**

1. **Admin Security & Reset** — fix CRITICAL `/api/admin/setup` (env-flag + shared key is not auth), move `/api/heartbeat` to cron, route `sitemap.ts` through `lib/supabase/public`, audit live-chat RLS.
2. **Dashboard & Tables Framework** — real metrics dashboard, generic Table primitive applied across products/orders/customers, bulk actions framework.
3. **Product / Order / Customer Editors** — sectioned, validating, image management; replace ProductForm.tsx 568 LOC; order detail unified view; manual order creation.
4. **Blog Editor + Settings** — Tiptap quirks fixed, settings page that actually saves, admin navigation cleaned up.

**Requirements covered:** SEC-01..04, DASH-01..05, ADMIN-01..08

---

## Milestone 4 · Handoff  [FINAL]

**Why now:** Standard Qualia handoff template — the last milestone of every full project. Locks the work in production-grade shape and walks the operator through running it.

**Exit criteria:**
- Lighthouse ≥ 90 on the four key routes (home, PDP, shop, checkout) for performance + a11y
- All canonical SEO present: meta, OG, Twitter, JSON-LD product schema, sitemap, robots
- Smoke + E2E tests green; deploy pipeline green; UptimeRobot up
- Operator (Qualia) has the credentials + 30-minute walkthrough of admin + a runbook for common ops

**Phases (standard 4):**

1. **Polish** — visual QA across viewports, motion tuning, copy pass, edge cases (empty cart, sold-out, network errors, slow connection).
2. **Content + SEO** — meta + OG + Twitter cards + JSON-LD per page, sitemap regen, robots.txt, blog SEO sweep, image alt text audit.
3. **Final QA** — full Playwright pass on chromium/firefox/webkit + mobile chrome/safari, lighthouse, manual checkout dry-run with Stripe test mode, accessibility (axe + keyboard nav).
4. **Handoff** — credentials walkthrough (Vercel, Supabase, Stripe, Sentry, Resend, OpenRouter, Upstash), admin training, runbook (`docs/RUNBOOK.md`), domain confirmed.

**Requirements covered:** POLISH-01..04, SEO-01..04, QA-01..03, HAND-01..04

---

## Out of Scope (post-handoff v3.1+)

- Multi-language i18n (English-only at v3.0)
- Multi-currency (EUR-only)
- Loyalty / rewards program
- Subscription / sample-of-the-month
- Native mobile apps
- Inventory / ERP integrations
- Replacing Supabase / Stripe / Sentry / Resend

## Progressive detail

M1 has full phase detail. M2..M4 are sketched (names + one-line goals). Full detail for each later milestone is written by `/qualia-milestone` when that milestone opens — this matches how real projects unfold; M1's discoveries reshape M3's plan.
