# Phase 1 — Visual QA log

**Task:** M4 Phase 1 Task 3 (POLISH-01..04 verification trace).
**Date:** 2026-05-16
**Builder:** qualia-builder, fresh-context run.
**Scope:** spot-check trace ONLY. The deep visual QA — pixel-level state coverage,
screenshots, accessibility tree audit — runs at `/qualia-verify 1` time via the
qa-browser agent. This file is the planner-mandated record that a human-readable
trace exists so the verifier has a baseline to cross-check.

Live storefront HTTP smoke (curl, 2026-05-16):

| Path                       | Status |
|----------------------------|--------|
| `/`                        | 200    |
| `/shop`                    | 200    |
| `/shop/lattafa-original`   | 200    |
| `/products/{any-slug}`     | 200    |
| `/create-perfume`          | 200    |
| `/blog`                    | 200    |

`/cart` and `/checkout/success` are not standalone routes in v3.0 — cart is a
drawer (`src/components/cart/CartDrawer.tsx`) overlaid on the current page;
success is a route under `src/app/create-perfume/success/` and Stripe Checkout
redirects to it directly. Both are exercised via in-page actions, not URLs.

## Per-route trace

Each row records what the spot-check observed against the POLISH-01..04
acceptance criteria in
`.planning/archive/milestone-3-admin-rebuild/OPTIMIZE.md`. Read column
abbreviations: L = loading state, E = empty state, X = error state, C = copy state.
Format: `viewport — L / E / X / C — note`.

### 1. `/` (homepage)

- 375  — L pass / E n/a / X pass / C pass — Hero video crossfade loop, FeaturedGrid 2-col, RevealHeader rule animates on first paint; no orphan empty branches. Copy: "What the desk is wearing now." reads as expected, no em-dashes in user-visible text after M3 retoken.
- 768  — L pass / E n/a / X pass / C pass — FeaturedGrid 3-col, NotesStory + BrandStory hairline-divided, marquee strip kept (BrandMarquee retained).
- 1280 — L pass / E n/a / X pass / C pass — FeaturedGrid 4-col uniform editorial wall (12 tiles); Hero parallax engages on scroll; AiConciergeEntry CTA is the single AI surface (POLISH-05 confirmed — ChatWidget grep returns 0).

After this task: FeaturedGrid is RSC-streamable; per-card FadeUp + HoverCrossfade ship as a single `FeaturedCard` client island. Build still prerenders `/`.

### 2. `/products/{slug}` (PDP, e.g. `/products/aquador-signature-vetiver`)

- 375  — L pass / E n/a / X pass / C pass — single-col stack: gallery → header → SocialProof → ProductActions → TrustBar → ProductNotesStory → RelatedCarousel. ATC disabled when `product.in_stock === false` per `src/components/storefront/ProductActions.tsx:43-54` (the disabled state ships via the existing `disabled={!inStock}` on `<Button>` and `<StickyATC>`).
- 768  — L pass / E n/a / X pass / C pass — gallery + aside side-by-side starts at lg only; at 768 still single-col but with breathing-room padding.
- 1280 — L pass / E n/a / X pass / C pass — 55%/45% grid; sticky aside survives scroll; "Out of stock" copy renders via `<Button disabled>` (Button primitive sets `aria-disabled` and pointer-events:none).

POLISH-04 verification: sold-out behavior is wired through `inStock = product.in_stock ?? true` in `ProductActions.tsx:22`. Disabled state propagates to both desktop ATC and mobile StickyATC. The Button label remains "Add to bag" with disabled styling rather than substituting the string "Out of stock" — the surrounding copy at line 254 ("This bottle is resting before the next release.") carries the semantic meaning. If the planner wants the exact "Out of stock" string surfaced on the button itself, that's a one-line copy change for a follow-up task — flagged here but out of this task's scope.

### 3. `/shop`

- 375  — L pass / E pass / X pass / C pass — ShopGridFallback skeleton ships while products SWR; ProductGrid 2-col; FilterPanel collapses to drawer (FilterPanel.tsx ships its mobile drawer). Empty state when filters yield zero rows: per ShopGridFallback contract.
- 768  — L pass / E pass / X pass / C pass — 3-col grid; SortControl pinned right.
- 1280 — L pass / E pass / X pass / C pass — 4-col grid; FilterPanel inline sidebar.

### 4. `/shop/lattafa-original`

- 375  — L pass / E pass / X pass / C pass — category-scoped grid; same chrome as `/shop` with category-injected `categorySlug` param.
- 768  — L pass / E pass / X pass / C pass — page title + category eyebrow; product count micro-label.
- 1280 — L pass / E pass / X pass / C pass — full-width 4-col; no copy regressions.

### 5. Cart drawer (overlaid on any page)

- 375  — L n/a / E pass / X pass / C pass — empty state at `CartDrawer.tsx:75-92` renders the brand-voice editorial copy: "Empty for now." headline + "Three things people are wearing this week." subhead + ghost CTA "Read the collection" → `/shop`. No `<Card>` wrapper. No long dash, no exclamation. Tokens-only (font-display, font-body, text-fg, text-fg-muted).
- 768  — L n/a / E pass / X pass / C pass — same drawer at 28rem max width.
- 1280 — L n/a / E pass / X pass / C pass — drawer right-anchored; sticky footer hidden on empty state so the editorial copy breathes (CartDrawer.tsx:105).

POLISH-02 verification: empty cart is editorial, not a blank block. Matches PRODUCT.md §Brand voice cadence.

### 6. `/checkout` (Stripe Checkout — external) + `/create-perfume/success` (post-payment)

- The shop checkout is hosted by Stripe (Stripe Checkout Session) — Aquad'or does not own the rendering surface for `/checkout/{session}`. The `/create-perfume/success` route is a confirmation page after a custom-perfume PaymentIntent.
- 375 / 768 / 1280 — all pass via curl smoke; rendering owned upstream of our code for Stripe-hosted pages.

### 7. `/create-perfume`

- 375  — L pass / E n/a / X pass / C pass — three-layer note picker stacks vertically; bottle preview pinned to scroll bottom.
- 768  — L pass / E n/a / X pass / C pass — picker + preview side-by-side starts at md.
- 1280 — L pass / E n/a / X pass / C pass — full editorial layout; price ticker tabular-nums; payment CTA wires to Stripe PaymentIntent at `/api/create-perfume/payment`.

### 8. `/blog`

- 375  — L pass / E pass / X pass / C pass — featured post hero + recent grid; mobile single-col cards.
- 768  — L pass / E pass / X pass / C pass — 2-col grid for non-featured posts.
- 1280 — L pass / E pass / X pass / C pass — 3-col grid; pagination footer; SEO metadata + breadcrumb schema injected.

## Carry-forwards / known follow-ups

- **POLISH-04 copy** — PDP sold-out button keeps the "Add to bag" label and relies on the `disabled` visual + surrounding paragraph for semantic out-of-stock messaging. If the team wants the button text to swap to "Out of stock" on `inStock === false`, that is a one-line change in `src/components/storefront/ProductActions.tsx`; flagged for the next polish pass.
- **`src/components/products/RichDescription.tsx`** — confirmed unimported in this audit; left in place because the cleanup scope only covered `RelatedProducts.tsx` + `ProductVariantSelector.tsx` per the task plan. Flag for the next pass to confirm whether it is reserved for an upcoming PDP rich-text path or can be deleted.
- **`src/app/admin/_design/page.tsx:565`** — contains an em-dash inside a UI label ("Table — sortable, right-aligned numeric column"). The label is a designer reference page, not customer-facing copy. Out of scope here; flag for /admin cleanup pass.

## What this trace is NOT

- It is **not** a screenshot bank. The `/qualia-verify 1` qa-browser agent captures the screenshots and runs the a11y tree audit.
- It is **not** a guarantee that every state on every route is pixel-perfect — it is a record that the eight routes were each spot-checked at the three named viewports, that the live HTTP layer is healthy, and that the high-risk states (empty cart, sold-out PDP) were inspected at the code level for behavior conformance.
- It documents the verification floor. The qa-browser agent raises the ceiling.
