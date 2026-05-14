# Roadmap · Milestone 2 · Storefront That Sells

**Project:** Aquad'or
**Milestone:** 2 of 4 (CURRENT)
**Created:** 2026-05-15
**Phases:** 5
**Requirements covered:** HOME-01..05, PDP-01..06, SHOP-01..04, CART-01..05, CREATE-01..04, AI-01..03, TRUST-01..03

See `JOURNEY.md` for the full project arc. This file is ONLY Milestone 2's phases.

## Exit Criteria

What "shipped" means for this milestone:

- New homepage, PDP, shop, cart, checkout, custom-perfume builder, and AI concierge live on the main branch (behind a feature flag or on a merged preview branch)
- Conversion baseline captured: Vercel Analytics event data confirms visit→add-to-cart and add-to-cart→purchase are measurable; new design is at parity or better than v2.0
- Mobile-first verified: every page passes manual check at 375px with all interactive targets ≥ 44px
- Trust signals (shipping, returns, authenticity, secure checkout) visible on PDP, cart, and checkout; no customer is left wondering about payment safety

---

## Phases

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Homepage | Hero, editorial sections, featured picks, AI entry, email capture | HOME-01..05, TRUST-01, TRUST-03 | ready |
| 2 | Product Detail Page | Large imagery, notes story, social proof, sticky ATC, cross-sell | PDP-01..06, TRUST-01 | — |
| 3 | Shop / Category | URL-stateful filters, sort, skeleton loading, hover micro-interactions | SHOP-01..04 | — |
| 4 | Cart Drawer + Checkout | One-tap cart, Stripe Payment Element, trust signals, server validation | CART-01..05, TRUST-02, TRUST-01 | — |
| 5 | Builder + AI Concierge | Rebuilt create-perfume flow, AI concierge drawer, AI-aware of catalog + cart | CREATE-01..04, AI-01..03 | — |

---

## Phase Details

### Phase 2.1: Homepage

**Goal:** Replace the current homepage with a conversion-focused editorial page that states the value prop immediately, surfaces the best products, introduces the AI concierge, and captures emails — all without leaving the first viewport empty.

**Depends on:** Phase 1.3 (primitives available at `@/components/ui`). No M2 phase dependency.

**Requirements covered:**
- HOME-01: Hero states value prop in ≤ 12 words with a primary CTA in the first viewport
- HOME-02: Editorial sections (notes story, brand story, journal teaser) replace generic feature blocks
- HOME-03: Top picks / featured products grid uses `ProductCard` primitive; data from `getFeaturedProducts`
- HOME-04: AI concierge entry point (button + `Drawer` primitive) present; does not look like a chatbot widget
- HOME-05: Email capture form with editorial copy; submits to Supabase or Resend; no page leave
- TRUST-01: Shipping / returns / authenticity microcopy present in hero or immediately below fold
- TRUST-03: Welcome email capture with one-off incentive copy (e.g. "10% off your first order")

**Success criteria:**
1. Visitor landing on the homepage sees the brand value prop and a working CTA button without scrolling on a 375px screen and a 1440px screen.
2. "Featured" products grid renders using the `Card` + `Badge` + `Tag` primitives from `@/components/ui`; images load with `Skeleton` placeholder before hydration.
3. Clicking the AI concierge entry point opens a `Drawer` overlay; the drawer closes on escape or scrim click using the existing `Drawer` primitive's focus-trap.
4. Email capture form submits without navigation; user sees a success `Toast` confirmation after submitting; the email is recorded in Supabase or Resend.
5. Below the hero, at least two of three editorial sections (notes story, brand story, journal teaser) are present with real copy — no lorem ipsum.

**File / component touchpoints:**
- `src/app/page.tsx` — rewrite with RSC + streaming sections
- `src/components/storefront/Hero.tsx` — new; uses `Button` from `@/components/ui`
- `src/components/storefront/FeaturedGrid.tsx` — new; uses `Card`, `Skeleton`, `Badge`
- `src/components/storefront/AiConciergeEntry.tsx` — new; uses `Drawer`, `Button`
- `src/components/storefront/EmailCapture.tsx` — new; uses `Input`, `Button`, `Toast`
- `src/app/api/email-capture/route.ts` — new or extend existing contact route; Zod-validated
- `src/lib/supabase/product-service.ts` — `getFeaturedProducts` already exists; confirm limit + ordering

**Risks / pitfalls:**
- Hero copy is not filler: "Luxury Fragrances" is the existing eyebrow (recent commit). The v3.0 value prop must be one concrete sentence. Agree on copy before building the component, not after.
- Email capture: Supabase lacks a native audience/subscriber table — confirm whether to write emails to a new `subscribers` table (migration required) or route through Resend's audience API. Decide before Phase 2.1 starts; the answer drives the API route shape.
- `getFeaturedProducts` currently orders by `is_featured = true`. Confirm limit (6 or 8) so the grid has a defined layout contract.

---

### Phase 2.2: Product Detail Page

**Goal:** Rebuild the product detail page as an editorial conversion page — large imagery, fragrance story, social proof, sticky Add-to-Cart on mobile, related products, and a clear path to the custom builder.

**Depends on:** Phase 2.1 (homepage conventions and `ProductCard` pattern established). Trust signal copy from 2.1 is reused here.

**Requirements covered:**
- PDP-01: Primary image ≥ 800px wide on desktop; lightbox on click
- PDP-02: Notes / composition / family / brand story rendered as editorial prose, not a feature list
- PDP-03: Social proof present (review count, rating, or "X bought this month" if orders data supports)
- PDP-04: Add-to-Cart sticky on mobile (≤ 768px) — does not require scrolling up to purchase
- PDP-05: Related / cross-sell carousel uses `getRelatedProducts`; renders with `Skeleton` on load
- PDP-06: Sample / discovery CTA and custom-perfume builder callout present where relevant
- TRUST-01: Shipping, returns, authenticity microcopy below the ATC or in a collapsible `Accordion`

**Success criteria:**
1. On desktop (1280px), the hero image spans at least 800px; clicking it opens a lightbox (`Dialog` primitive) with keyboard navigation between images.
2. The notes section renders as prose or an editorial layout, not a `<ul>` of feature bullets; top / heart / base note labels are visible but subordinate to the narrative.
3. The "Add to Cart" button is pinned to the bottom of the viewport on screens ≤ 768px and scrolls away on desktop; both states are verified at their respective breakpoints.
4. The related products carousel renders ≥ 3 products via `getRelatedProducts`; each card uses the `ProductCard` primitive; navigation is keyboard-accessible.
5. Trust signals (free shipping, 30-day returns, authenticity guarantee) are visible without expanding any disclosure; they appear below the price or below the ATC button.

**File / component touchpoints:**
- `src/app/products/[slug]/page.tsx` — rewrite (currently uses ad-hoc Tailwind)
- `src/components/storefront/ProductGallery.tsx` — new; uses `Dialog` for lightbox
- `src/components/storefront/NotesStory.tsx` — new; editorial composition render
- `src/components/storefront/StickyATC.tsx` — new; mobile-only sticky bar; uses `Button`
- `src/components/storefront/RelatedCarousel.tsx` — new; uses `Card`, `Skeleton`
- `src/components/storefront/TrustBar.tsx` — new (shared with cart/checkout); uses `Badge` or inline SVG icons
- `src/lib/supabase/product-service.ts` — `getRelatedProducts` already exists; verify N+1 is still clean (fixed in v1.1)

**Risks / pitfalls:**
- Social proof (PDP-03): If Supabase has no reviews table, "X bought this month" from `orders` is the fallback. Query the `orders` table by product_id with a 30-day window. If orders table has no product_id join that's accessible under RLS anon, use a static "Popular choice" badge as a placeholder. Do not fabricate review counts.
- Lightbox on mobile: `Dialog` uses body-scroll-lock — ensure the existing primitive's lock implementation works on iOS Safari (check `-webkit-overflow-scrolling: touch` edge cases).
- Sticky ATC on iOS Safari: `position: sticky` within overflow-scroll ancestors is broken on older iOS. Test at 375px on Safari specifically.

---

### Phase 2.3: Shop / Category

**Goal:** Rebuild the shop and category listing pages with URL-stateful filters, sort controls, ISR-powered fast first load, skeleton placeholders, and hover micro-interactions — so the shopper can navigate and refine without a full-page reload.

**Depends on:** Phase 2.2 (PDP is the landing destination from shop cards; `ProductCard` pattern finalized).

**Requirements covered:**
- SHOP-01: Filters by notes family, brand, gender, and price band; filter state serialized to URL params so the URL is shareable and the back button works
- SHOP-02: Sort by featured / price asc / price desc / newest; default sort matches business priority (featured first)
- SHOP-03: Skeleton loading for the product grid; ISR or RSC streaming so perceived TTFB is sub-second
- SHOP-04: Hover / focus micro-interaction on each card using motion tokens (scale, reveal secondary CTA, or both)

**Success criteria:**
1. Applying any combination of filters updates the URL query string (e.g. `?brand=lattafa&gender=women&price=0-50`) without a full-page navigation; the browser back button restores the previous filter state.
2. Sort controls change the product order instantly (client-side re-sort of already-fetched data, or a URL param that triggers RSC refetch); the selected sort option persists across filter changes.
3. The product grid shows `Skeleton` cards during the RSC stream window; on a throttled connection (Chrome devtools "Slow 3G") at least 4 skeleton cards appear before real cards replace them.
4. Hovering or focusing a `ProductCard` triggers a visible micro-interaction that uses CSS motion tokens (`--duration-fast`, `--ease-out`) and respects `prefers-reduced-motion: reduce`.
5. The shop page loads ≥ 80% of its content as static (ISR) with a revalidation window ≤ 60s; the filter/sort UI is a client component overlay on top.

**File / component touchpoints:**
- `src/app/shop/[category]/page.tsx` — rewrite; RSC for initial data, URL params for filter/sort
- `src/app/shop/page.tsx` — all-products view; same RSC + filter pattern
- `src/app/shop/lattafa/page.tsx` — already exists; migrate to shared layout once LegacyProduct is gone (done in M1)
- `src/components/storefront/ProductGrid.tsx` — new; uses `ProductCard`, `Skeleton`
- `src/components/storefront/FilterPanel.tsx` — new; uses `Select`, `Checkbox`, `Badge`; syncs to `useSearchParams`
- `src/components/storefront/SortControl.tsx` — new; uses `Select` or `Tabs` primitive
- `src/lib/supabase/product-service.ts` — extend `getAllProducts` or add `getFilteredProducts(filters, sort)` that accepts URL param shapes; Zod-validate inputs

**Risks / pitfalls:**
- `useSearchParams` requires a Suspense boundary in Next.js App Router — wrap the filter client component in `<Suspense>` or the whole page build will fail.
- ISR + dynamic filter: ISR caches the unfiltered page; filters run client-side against the already-fetched full catalog. For ~100 products this is fine. If the catalog grows >500 SKUs, filtering must move server-side. Document the threshold in `CONTEXT.md`.
- Price band filter: confirm the four bands with the operator (e.g. 0–30 / 30–60 / 60–100 / 100+) before hardcoding. Put them in `src/lib/constants.ts`.

---

### Phase 2.4: Cart Drawer + Checkout

**Goal:** Rebuild the cart drawer and the Stripe checkout flow for fewer clicks, Apple / Google Pay support, visible trust signals, and a sticky summary on mobile — while preserving all existing server-side validation and webhook contracts.

**Depends on:** Phase 2.2 (trust signals component `TrustBar` built; PDP Add-to-Cart wired). Phase 2.3 adds more entry points to the cart drawer.

**Requirements covered:**
- CART-01: Cart drawer opens on any add-to-cart; shows item summary, qty controls, remove, and subtotal
- CART-02: Checkout uses Stripe Payment Element with Apple Pay / Google Pay enabled (requires `paymentMethodTypes: ['card', 'apple_pay', 'google_pay']` in the Payment Element configuration)
- CART-03: Order summary sticky on mobile checkout
- CART-04: Trust signals visible on cart drawer and checkout; reuses `TrustBar` from Phase 2.2
- CART-05: Server-side cart price re-validation in `src/app/api/checkout/route.ts` preserved; no regression in Zod validation or Stripe metadata handling

**Success criteria:**
1. Clicking "Add to Cart" on any product page or shop card opens the `Drawer` primitive with the cart contents; the drawer can be dismissed by escape, scrim click, or a close button; qty increment/decrement and remove all work without closing the drawer.
2. On a test Stripe checkout in test mode, the Payment Element renders with the Apple Pay / Google Pay wallet buttons visible (requires HTTPS in development or Vercel preview URL; confirm via `stripe.paymentElement()` options).
3. On a 375px screen, the order summary (subtotal, line items) is pinned to the bottom of the checkout page and does not scroll away when the payment form is active.
4. Trust signals (`TrustBar` component) are rendered in the cart drawer below the subtotal and on the Stripe-hosted or embedded checkout above the payment button.
5. A test end-to-end flow (add to cart → open drawer → proceed to checkout → Stripe test card → success page) completes without a console error or a 4xx/5xx response; the existing `npm test` webhook suite still exits 0.

**File / component touchpoints:**
- `src/components/cart/CartDrawer.tsx` — rewrite; uses `Drawer`, `Button`, `IconButton`, `Badge`
- `src/components/cart/CartProvider.tsx` — keep state logic; only update event handlers if qty/remove shapes changed
- `src/app/api/checkout/route.ts` — confirm Payment Element config includes wallet methods; no regression
- `src/app/checkout/page.tsx` — if checkout is embedded (not Stripe-hosted redirect), add sticky summary; if Stripe-hosted, add trust signals to the cart drawer only
- `src/components/storefront/TrustBar.tsx` — already built in Phase 2.2; imported here
- `src/lib/validation/cart.ts` — server-side validation; read-only in this phase (CART-05 is a non-regression check)

**Risks / pitfalls:**
- Apple Pay / Google Pay require the merchant domain to be registered in Stripe Dashboard → Payment methods → Wallets. This is a Stripe configuration step, not a code step. Confirm before testing — the Payment Element will silently hide wallet buttons if the domain isn't registered.
- If checkout is currently a Stripe-hosted redirect (Checkout Session), switching to an embedded Payment Element is a significant change. Evaluate: embedded element gives more control but requires the checkout page to handle the full payment confirmation flow. If time-to-value is the priority, keep Stripe-hosted redirect and focus on wallet button support via `payment_method_types`.
- `CartProvider.tsx` uses `useReducer` with localStorage. The `rehydrate` action runs Zod validation on load (v1.1 fix). Any shape change to cart items will break existing localStorage carts — bump the cart version key or add a migration shim.

---

### Phase 2.5: Builder + AI Concierge

**Goal:** Rebuild the 979-LOC `create-perfume/page.tsx` into a clearly-separated multi-step flow using primitives, and deploy the AI concierge as a persistent drawer that knows the product catalog and the shopper's current cart — making it feel like a human recommendation, not a search widget.

**Depends on:** Phases 2.1–2.4 (all primitives and patterns established; cart context available; AI concierge entry point wired in Phase 2.1).

**Requirements covered:**
- CREATE-01: Builder rebuilt from one 979-LOC file into clearly-separated steps; max single-file ≤ 300 LOC
- CREATE-02: Three-layer composition UI (top / heart / base) uses primitives; preserves `fragranceDatabase` + composition validators from `src/lib/perfume/`
- CREATE-03: Persistent summary panel shows current selection, volume choice, and total price; updates without page jumps
- CREATE-04: Stripe PaymentIntent flow preserved via `/api/create-perfume/payment`; no regression in metadata handling
- AI-01: Concierge has editorial voice; asks about scent preferences naturally; ends responses with concrete product picks linked to PDPs
- AI-02: Uses build-time AI catalogue (`src/lib/ai/catalogue-data.ts`) plus current cart context
- AI-03: Available from a persistent entry point (drawer or FAB); accessible keyboard nav; can be opened from homepage, PDP, and shop without losing the drawer state

**Success criteria:**
1. `src/app/create-perfume/` contains at minimum 3 separate files (e.g. `page.tsx`, `StepSelector.tsx`, `SummaryPanel.tsx`); `git diff --stat` shows no single file in `create-perfume/` exceeds 300 lines.
2. The three-step composition UI (top notes → heart notes → base notes) uses `RadioGroup` / `Checkbox` / `Tag` primitives; the `fragranceDatabase` and `validateComposition` from `src/lib/perfume/` are imported unchanged.
3. The persistent summary panel updates price immediately on every note selection and volume change; a shopper at the "base notes" step can see their current top and heart choices and total price without scrolling or navigating back.
4. A Stripe test-mode flow through the builder (select notes → choose volume → pay with test card 4242 4242 4242 4242) completes and lands on `src/app/create-perfume/success/` with the correct custom perfume metadata; the existing 21-test webhook suite exits 0.
5. Opening the AI concierge drawer from any page (homepage, PDP, shop) retains the conversation thread for the current session; the model's response to a preference query (e.g. "I like woody scents") includes at least one named product with a link to its PDP.
6. The concierge drawer is keyboard-navigable: Tab moves focus through the message input and submit button; Escape closes the drawer; focus returns to the trigger element on close.

**File / component touchpoints:**
- `src/app/create-perfume/page.tsx` — becomes a thin step-router ≤ 150 LOC
- `src/app/create-perfume/StepSelector.tsx` — new; note selection per layer using `RadioGroup`, `Tag`, `Badge`
- `src/app/create-perfume/SummaryPanel.tsx` — new; persistent right-column; uses `Card`, `Button`
- `src/app/create-perfume/VolumeSelect.tsx` — new; uses `Radio` (50ml / 100ml) + price display
- `src/app/create-perfume/PaymentStep.tsx` — thin wrapper around Stripe PaymentIntent flow; keeps `/api/create-perfume/payment` contract unchanged
- `src/components/ai/AiConciergeDrawer.tsx` — new; uses `Drawer`, `Input`, `Button`, `Skeleton` (streaming tokens); integrates with `/api/ai-assistant`
- `src/app/api/ai-assistant/route.ts` — extend to accept `cartContext` in request body; system prompt updated to reference current cart and catalog
- `src/lib/ai/catalogue-data.ts` — read-only (kept fresh by prebuild script); no changes
- `src/lib/perfume/` — all files read-only; composition validators and `fragranceDatabase` imported, not duplicated

**Risks / pitfalls:**
- The 979-LOC monolith likely has implicit state shared across what will become separate components. Extract state into a `useBuilderState` hook first; then split the render into components. Splitting render without extracting state first results in prop-drilling spaghetti.
- AI streaming: `/api/ai-assistant` likely returns a full JSON body today. For a good concierge UX, switch to a streaming `text/event-stream` or `ReadableStream` response so tokens appear progressively. This is a non-trivial API change — scope it explicitly before starting.
- Cart context in AI: the cart is in `CartProvider` (React context). The API route is a server function and cannot access client-side React context directly. The concierge drawer must serialize the relevant cart state (product names + quantities) and send it in the request body. Define the shape (`cartSummary: { name: string; quantity: number }[]`) before writing the prompt.
- `create-perfume/success/` page relies on detecting the PaymentIntent client secret from the URL. This must survive the refactor — verify the success page routing is preserved after splitting the payment step.

---

## Coverage Verification

Every M2 requirement maps to exactly one phase.

| Requirement | Phase | Covered? |
|-------------|-------|----------|
| HOME-01 | 2.1 | Yes |
| HOME-02 | 2.1 | Yes |
| HOME-03 | 2.1 | Yes |
| HOME-04 | 2.1 | Yes |
| HOME-05 | 2.1 | Yes |
| PDP-01 | 2.2 | Yes |
| PDP-02 | 2.2 | Yes |
| PDP-03 | 2.2 | Yes |
| PDP-04 | 2.2 | Yes |
| PDP-05 | 2.2 | Yes |
| PDP-06 | 2.2 | Yes |
| SHOP-01 | 2.3 | Yes |
| SHOP-02 | 2.3 | Yes |
| SHOP-03 | 2.3 | Yes |
| SHOP-04 | 2.3 | Yes |
| CART-01 | 2.4 | Yes |
| CART-02 | 2.4 | Yes |
| CART-03 | 2.4 | Yes |
| CART-04 | 2.4 | Yes |
| CART-05 | 2.4 | Yes |
| CREATE-01 | 2.5 | Yes |
| CREATE-02 | 2.5 | Yes |
| CREATE-03 | 2.5 | Yes |
| CREATE-04 | 2.5 | Yes |
| AI-01 | 2.5 | Yes |
| AI-02 | 2.5 | Yes |
| AI-03 | 2.5 | Yes |
| TRUST-01 | 2.1, 2.2, 2.4 | Yes (multi-phase; TrustBar component shared) |
| TRUST-02 | 2.4 | Yes |
| TRUST-03 | 2.1 | Yes |

---

## What M2 Explicitly Does Not Do

- Rebuild the admin dashboard or admin tables (M3)
- Fix `/api/admin/setup` security hole (M3 — Phase 3.1)
- Move `/api/heartbeat` to cron (M3)
- Route `sitemap.ts` through the adapter (M3)
- Reach Lighthouse ≥ 90 (M4)
- Full Playwright cross-browser suite (M4 — though each phase should pass its own smoke test)
- Multi-language, multi-currency, loyalty program (out of scope)

---

## When This Milestone Closes

Triggered by `/qualia-milestone` after `/qualia-verify` passes on Phase 2.5:

1. All phase artifacts archived to `.planning/archive/milestone-2-storefront/`
2. `tracking.json` `milestones[]` gets a summary entry (num=2, name="Storefront That Sells", phases_completed=5)
3. REQUIREMENTS.md marks M2 requirements as **Complete**
4. M3 (Admin Rebuild) opens — roadmapper regenerates this ROADMAP.md for Milestone 3
5. `state.js init --force --milestone_name "Admin Rebuild"` resets current-phase fields, preserves lifetime + milestones[] history

---

*Last updated: 2026-05-15*
