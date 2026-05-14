# Requirements — Aquad'or v3.0

User-centric, atomic, testable. One REQ-ID per requirement. Grouped by milestone.

---

## Milestone 1 · Design Foundation

### Design system (DESIGN-)
- **DESIGN-01** — `.planning/DESIGN.md` commits to one aesthetic direction (single word from the design-laws list), one color strategy, one scene sentence, one differentiation sentence. No hedging.
- **DESIGN-02** — `src/styles/tokens.css` exposes the OKLCH palette as CSS variables. No raw `#000`, `#fff`, or named hex anywhere in tokens.css.
- **DESIGN-03** — Display + body type pair loaded via `next/font`. Neither is Inter, Playfair, Poppins, Arial, Helvetica, Roboto, or system-ui. Falls back gracefully.
- **DESIGN-04** — Motion tokens (durations, easing curves) defined; `@media (prefers-reduced-motion: reduce)` zeros animation duration globally.

### Stack upgrade (STACK-)
- **STACK-01** — `next@^16`, `react@^19`, `react-dom@^19`, `eslint-config-next@^16` installed; `npm run build` exits 0 and `npm run lint` exits 0.
- **STACK-02** — `eslint@^9`, `@react-three/fiber@^9`, `@react-three/drei@^10` aligned (or three.js removed entirely if unused after M1.3).
- **STACK-03** — All 24 currently-failing Jest tests pass. `npm test` exits 0.

### Type unification (TYPE-)
- **TYPE-01** — `LegacyProduct` type and its `Product` re-export deleted from `src/types/index.ts`. No file in `src/` imports `LegacyProduct`.
- **TYPE-02** — `ProductCard` (`src/components/ui/ProductCard.tsx`) accepts a single product shape; no branching on `snake_case` vs `camelCase`. The shape used is the Supabase `Product` from `src/lib/supabase/types.ts`.

### Primitives (PRIM-)
- **PRIM-01** — `Button`, `IconButton`, `Link` primitives in `src/components/ui/` use tokens only (no raw hex, no magic-string Tailwind colors). Support 7 states.
- **PRIM-02** — `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch` form primitives use tokens and support labels + helper text + error state + required indicator.
- **PRIM-03** — `Card`, `Badge`, `Tag`, `Avatar`, `Tooltip` display primitives use tokens.
- **PRIM-04** — `Drawer`, `Dialog`, `Tabs`, `Toast` overlay primitives use tokens. Drawer and Dialog respect focus trap + escape-to-close + scrim click.
- **PRIM-05** — `Table` primitive with column definitions, sort, header sticky. Used in at least one admin page to prove integration.

---

## Milestone 2 · Storefront That Sells

### Homepage (HOME-)
- **HOME-01** — Hero clearly states the value prop in ≤ 12 words and has a primary CTA in the first viewport.
- **HOME-02** — Editorial sections (notes story, brand story, journal teaser) replace the current generic feature blocks.
- **HOME-03** — Top picks / featured products grid uses the new ProductCard primitive.
- **HOME-04** — AI concierge entry point is present (button + drawer or sidebar) without being a chatbot blob.
- **HOME-05** — Email capture present with editorial copy; submits to Supabase or Resend audience.

### Product detail page (PDP-)
- **PDP-01** — Imagery is at least 800px wide on desktop; supports zoom or lightbox on click.
- **PDP-02** — Notes / composition / family / brand story rendered as editorial copy, not a feature list.
- **PDP-03** — Social proof present (review count, rating, or "X bought this month" if data supports).
- **PDP-04** — Add-to-Cart is sticky on mobile (≤ 768px).
- **PDP-05** — Related / cross-sell carousel uses `getRelatedProducts`.
- **PDP-06** — Sample / discovery CTA where the product allows; clear callout for the custom-perfume builder where relevant.

### Shop / category (SHOP-)
- **SHOP-01** — Filters: notes family, brand, gender, price band. Filter state in URL so it's shareable.
- **SHOP-02** — Sort: featured, price asc/desc, newest. Default sort matches business priority.
- **SHOP-03** — Skeleton loading state for the grid; ISR or RSC streaming so perceived TTFB is sub-second.
- **SHOP-04** — Hover or focus micro-interaction on each card (reveal secondary CTA, slight scale, etc.) using motion tokens.

### Cart drawer + checkout (CART-)
- **CART-01** — Cart drawer opens from any add-to-cart with item summary, qty controls, remove, subtotal.
- **CART-02** — Checkout uses Stripe Payment Element with Apple Pay / Google Pay enabled.
- **CART-03** — Sticky order summary on mobile checkout.
- **CART-04** — Trust signals (shipping, returns, secure-payment badge) visible on cart + checkout.
- **CART-05** — Server-side cart price re-validation (`src/lib/validation/cart.ts`) preserved; no regression.

### Custom perfume builder (CREATE-)
- **CREATE-01** — Builder rebuilt from one 979-LOC file into clearly-separated steps; max single-file size ≤ 300 LOC.
- **CREATE-02** — Three-layer composition UI uses the new primitives; preserves existing `fragranceDatabase` + composition validators.
- **CREATE-03** — Persistent summary panel shows current selection, volume choice, total price; updates without page jumps.
- **CREATE-04** — Stripe PaymentIntent flow preserved via `/api/create-perfume/payment` with no regression in metadata handling.

### AI concierge (AI-)
- **AI-01** — Concierge feels like a concierge: editorial voice, asks about scent preferences in natural language, ends responses with concrete product picks linked.
- **AI-02** — Uses the build-time AI catalogue (`src/lib/ai/catalogue-data.ts` — kept fresh via prebuild script) plus current cart context.
- **AI-03** — Available from a persistent entry point (drawer or floating action); accessible keyboard nav.

### Trust + capture (TRUST-)
- **TRUST-01** — Shipping policy / returns / authenticity microcopy on PDP, cart, checkout, footer.
- **TRUST-02** — Secure-payment indicator with Stripe badge on checkout.
- **TRUST-03** — Welcome email capture with one-off code/incentive editorial; submits without leaving the page.

---

## Milestone 3 · Admin Rebuild

### Admin security (SEC-)
- **SEC-01** — `/api/admin/setup` either removed (preferred — bootstrap admin via Supabase dashboard) or gated by a per-request server-only secret with single-use semantics. Env-flag-only model is unacceptable.
- **SEC-02** — `/api/heartbeat` moved off public service-role POST. The DELETE-stale logic moves to a Supabase cron (`pg_cron` or scheduled edge function); heartbeat ping becomes a lightweight `INSERT` via RLS-respecting anon client.
- **SEC-03** — `src/app/sitemap.ts` imports through `lib/supabase/public.ts`, not directly from `@supabase/supabase-js`.
- **SEC-04** — Live-chat session routes (`/api/live-chat/*`) audited for RLS coverage; policies confirmed or added.

### Admin dashboard (DASH-)
- **DASH-01** — Revenue (this period vs last) rendered from `orders` table.
- **DASH-02** — Order count, AOV, conversion rate (orders / sessions via Vercel Analytics) rendered.
- **DASH-03** — Customer count + LTV rendered from `customers` + `orders` joins.
- **DASH-04** — Top 5 products by revenue + by units sold (selectable period: 7d / 30d / 90d).
- **DASH-05** — Recent orders table with status, amount, customer; click-through to order detail.

### Admin tables + editors (ADMIN-)
- **ADMIN-01** — Products table supports column sort, multi-filter (category, brand, in-stock, active), bulk activate/deactivate.
- **ADMIN-02** — Orders table supports sort by date/amount, filter by status, customer search.
- **ADMIN-03** — Customers table supports sort by created/spend, filter by repeat vs first-time.
- **ADMIN-04** — Product editor sectioned (basics / pricing / variants / images / description / SEO); validates with Zod; single file ≤ 350 LOC (current ProductForm is 568).
- **ADMIN-05** — Order detail unifies payment + customer + line items + fulfillment notes in one view.
- **ADMIN-06** — Manual order creation flow present (operator inputs customer + items + amount → creates Stripe-less order record).
- **ADMIN-07** — Blog editor (Tiptap) has working save, autosave draft, image upload to Supabase storage.
- **ADMIN-08** — Settings page persists at least: store contact, shipping copy, free-shipping threshold (when introduced), payment-method visibility flags.

---

## Milestone 4 · Handoff

### Polish (POLISH-)
- **POLISH-01** — Visual pass across mobile (375px) / tablet (768px) / desktop (1280px+) on the 8 key routes (home, PDP, shop, category, cart, checkout, create-perfume, blog).
- **POLISH-02** — Empty / loading / error / offline states verified on all data-fetching routes.
- **POLISH-03** — Copy pass: every visible string reviewed; brand voice consistent; no lorem ipsum or stub strings remain.
- **POLISH-04** — Edge cases: sold-out, out-of-stock, blocked country, abandoned cart all behave gracefully.

### SEO (SEO-)
- **SEO-01** — Per-page `metadata` (title, description, OG, Twitter card) on every public route.
- **SEO-02** — JSON-LD product schema on PDP; article schema on blog posts; organization schema on root layout.
- **SEO-03** — Sitemap.xml regenerated from Supabase; robots.txt explicit; canonical URLs.
- **SEO-04** — Image alt audit; descriptive (not "image of perfume").

### QA (QA-)
- **QA-01** — Full Playwright pass on chromium / firefox / webkit + mobile chrome/safari exits 0.
- **QA-02** — Lighthouse ≥ 90 on perf + a11y for home / PDP / shop / checkout on mobile and desktop.
- **QA-03** — Stripe test-mode dry run: cart checkout + custom perfume both complete end-to-end with confirmation email arriving.

### Handoff (HAND-)
- **HAND-01** — Vercel / Supabase / Stripe / Sentry / Resend / OpenRouter / Upstash credentials verified accessible to Aquad'or operator.
- **HAND-02** — `docs/RUNBOOK.md` covers: deploying, rolling back, refunding an order, resetting admin password, restoring DB backup, common Sentry alerts.
- **HAND-03** — 30-minute admin walkthrough recorded or scheduled.
- **HAND-04** — Custom domain (aquadorcy.com) confirmed pointing at Vercel; SSL valid; no broken redirects.

---

## Out of Scope (Post-Handoff v3.1+)

- Multi-language (English-only at v3.0)
- Multi-currency (EUR-only)
- Loyalty / rewards program
- Subscription / sample club
- Native mobile apps
- ERP / inventory integrations
- Vendor swaps (Supabase / Stripe / Sentry / Resend stay)

## Traceability

| Milestone | Phases | REQ-IDs |
|---|---|---|
| M1 Design Foundation | 1.1, 1.2, 1.3 | DESIGN-01..04, STACK-01..03, TYPE-01..02, PRIM-01..05 |
| M2 Storefront That Sells | 2.1..2.5 | HOME-01..05, PDP-01..06, SHOP-01..04, CART-01..05, CREATE-01..04, AI-01..03, TRUST-01..03 |
| M3 Admin Rebuild | 3.1..3.4 | SEC-01..04, DASH-01..05, ADMIN-01..08 |
| M4 Handoff | 4.1..4.4 | POLISH-01..04, SEO-01..04, QA-01..03, HAND-01..04 |

All REQs start as Pending. Marked Complete by `/qualia-milestone` on milestone close.
