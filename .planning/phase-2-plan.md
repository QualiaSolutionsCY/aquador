---
phase: 2
milestone: 2
goal: "Rebuild the product detail page as an editorial conversion page: large imagery, fragrance story, social proof, sticky Add-to-Cart on mobile, related products, and a clear path to the custom builder."
constraints_note: "All work under DESIGN.md §10b: no em-dashes/hyphens-as-punct in copy, no emojis, no Card as section wrapper, motion required. See Success Criteria and Verification Contract."
tasks: 4
waves: 2
---

# Phase 2.2: Product Detail Page

**Goal:** PDP at `src/app/products/[slug]/page.tsx` renders as an editorial magazine-spread conversion page covering PDP-01..06 and TRUST-01, with a shared `TrustBar` primitive that Phase 2.4 (Cart + Checkout) will reuse.

**Why this phase:** PDP is the conversion endpoint for every shop card, every related-product link, and every concierge recommendation. Maria (gift buyer) decides here in under 6 minutes on mobile; Khaled (niche connoisseur) reads notes here on iPad in the evening. If this page reads like a Shopify default Card-stack we fail PRODUCT.md's "letter from someone who knows scent" promise. M1 already migrated the data layer to Supabase snake_case; this phase is the rendering rewrite.

**Locked decisions honored (from `<phase_details>`):**
- D-01 Card primitive banned as section wrapper. ONE container variant per page: magazine spread.
- D-02 Sticky ATC = `position: fixed bottom-0 inset-x-0 md:hidden` (NOT `position: sticky` — iOS Safari workaround).
- D-03 Lightbox = `Dialog` primitive from `@/components/ui`, keyboard arrow nav, body-scroll-lock.
- D-04 Social proof: query orders table if anon-RLS-readable, else fall back to static "Popular this season" `Badge`. Do NOT fabricate review counts.
- D-05 TrustBar = editorial inline hairline-divided format. NOT a row of icon-cards.
- D-06 Motion mandatory: ≥ 3 patterns (scroll-triggered fade-up on NotesStory, image hover crossfade in ProductGallery, sticky ATC shadow-up on scroll).
- D-07 NotesStory = editorial prose, NOT a `<ul>` of bullets; inline accordion for "Read the composition".
- D-08 Voice consistent with PRODUCT.md §Brand-voice everywhere (no em-dashes, no hyphen-as-punctuation, no emoji).

---

## Task 1 — Build the shared TrustBar primitive
**Wave:** 1
**Persona:** frontend
**Files:**
- Create `src/components/storefront/TrustBar.tsx` — exports `TrustBar` (named, default-exported too). Props: `{ variant?: "inline" | "compact"; className?: string }`. Renders three editorial inline labels separated by hairline `|` dividers using `font-micro` (uppercase, tracking 0.05em, 12px). Labels: "Ships in three days", "Returns within thirty", "Authenticity guaranteed". Each label paired with a Lucide stroke-1.5 icon (`Truck`, `RotateCcw`, `ShieldCheck`) at 16px, color `var(--fg-muted)`. Component is server-renderable (no `"use client"`).

**Depends on:** none

**Why:** TrustBar is shared across PDP (this phase), Cart drawer, and Checkout (Phase 2.4). Phase 2.4 imports YOUR TrustBar; if it doesn't exist, the cart phase blocks. Building it first as a standalone component avoids the cross-phase ownership trap. D-05 mandates editorial inline format, not icon-card row.

**Acceptance Criteria:**
- File `src/components/storefront/TrustBar.tsx` exists and exports a named `TrustBar` React component.
- Rendered output contains exactly three labels: "Ships in three days", "Returns within thirty", "Authenticity guaranteed" (verbatim, no em-dashes, no exclamation, no emoji).
- Labels are separated by hairline pipe dividers (`|` character OR an inline 1px border `<span aria-hidden>` divider), NOT stacked in `<Card>` tiles.
- Uses tokens only: `var(--fg-muted)`, `var(--border)`, `var(--font-micro)` family from tokens.css. No raw hex, no `text-gray-500`.
- Imports `Truck`, `RotateCcw`, `ShieldCheck` from `lucide-react` at stroke-width 1.5, size 16.
- Component renders correctly at 375px (labels wrap to two lines on the smallest viewport; dividers hidden on wrap).
- No `<Card>` wrapper, no `rounded-*` on the outer container.

**Action:**
1. Create `src/components/storefront/TrustBar.tsx`.
2. Define `TrustBarProps` interface with optional `variant` (`"inline"` | `"compact"`, default `"inline"`) and `className`.
3. Implement three labels in an array: `[{ icon: Truck, label: "Ships in three days" }, { icon: RotateCcw, label: "Returns within thirty" }, { icon: ShieldCheck, label: "Authenticity guaranteed" }]`.
4. Render as a `<div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-fg-muted">` containing each item as `<span className="flex items-center gap-2 text-[length:var(--font-micro)] uppercase tracking-[0.05em]"><Icon size={16} strokeWidth={1.5} aria-hidden />{label}</span>` interleaved with `<span aria-hidden className="hidden sm:inline h-3 w-px bg-border" />` dividers.
5. For `variant="compact"` (used in Cart drawer Phase 2.4), reduce gap to `gap-x-4 gap-y-2` and icon size 14.
6. Add JSDoc explaining cross-phase reuse: "Imported by PDP (Phase 2.2), Cart drawer + Checkout (Phase 2.4)."
7. Do NOT add the component to `src/components/ui/index.ts` — storefront components live separately from primitives.

**Validation:** (builder runs before commit)
- `test -f src/components/storefront/TrustBar.tsx && echo EXISTS` → `EXISTS`
- `grep -cE 'Ships in three days|Returns within thirty|Authenticity guaranteed' src/components/storefront/TrustBar.tsx` → `3`
- `grep -cE ' — | – ' src/components/storefront/TrustBar.tsx` → `0`
- `grep -cE '<Card[ >]|rounded-' src/components/storefront/TrustBar.tsx` → `0`
- `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/storefront/TrustBar.tsx` → no output (exit 1)
- `npx tsc --noEmit 2>&1 | grep -c "TrustBar"` → `0`

**Context:** Read @.planning/DESIGN.md (§10b layout rules + §3 typography), @.planning/PRODUCT.md (brand voice — no em-dashes, no emoji), @src/components/ui/index.ts (confirm `Badge` import path if needed), @src/styles/tokens.css.

**Design:**
- Register: product (utility chrome, supports the buying flow)
- Tokens used: `var(--fg-muted)`, `var(--border)`, `var(--font-micro)`, `--space-2`, `--space-3`, `--space-6`
- Scope: component (shared across PDP, Cart drawer, Checkout)
- Anti-pattern guard: builder runs `grep -cE '<Card[ >]|rounded-(sm|md|lg)' src/components/storefront/TrustBar.tsx` and confirms `0`; runs em-dash + emoji greps from §10b verification additions.

---

## Task 2 — Build ProductGallery with Dialog lightbox + image hover crossfade
**Wave:** 1
**Persona:** frontend
**Files:**
- Create `src/components/storefront/ProductGallery.tsx` — exports `ProductGallery`. Props: `{ images: { src: string; alt: string }[]; productName: string }`. Renders a primary image ≥ 800px wide on desktop (`md:min-h-[800px] md:w-full`); on hover, the primary image crossfades to the secondary image (if `images[1]` exists) via opacity transition (`transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out-quart)]`). Clicking the image opens a `Dialog` lightbox with all images; keyboard arrow keys (`ArrowLeft`/`ArrowRight`) navigate between images; `Escape` closes; focus traps inside the dialog.

**Depends on:** none

**Why:** PDP-01 requires desktop hero ≥ 800px with lightbox; D-03 locks Dialog primitive as the lightbox container; D-06 motion patterns count this as the "image hover crossfade" requirement (1 of ≥ 3). Without keyboard nav the lightbox fails accessibility (Khaled uses iPad, but desktop niche shoppers use keyboard).

**Acceptance Criteria:**
- Primary image renders at min-width 800px on viewports ≥ 1024px (`lg:`); below that, fills container width.
- If `images.length >= 2`, hovering the primary image crossfades to `images[1]` over `var(--duration-base)` (250ms). On mouse-leave, fades back to `images[0]`. On touch devices (no hover), behavior degrades to static primary image (acceptable).
- Clicking the primary image opens a `Dialog` from `@/components/ui` containing a centered enlarged version of the currently-shown image and thumbnail strip below.
- Inside the Dialog: pressing `ArrowRight` advances to the next image in `images`, `ArrowLeft` goes back. Index wraps at boundaries (next from last → first, prev from first → last). Pressing `Escape` closes the Dialog and returns focus to the primary image trigger.
- Dialog renders even when only 1 image exists (no arrow nav in that case; thumbnail strip omitted).
- `alt` text on every image comes from `images[i].alt` and falls back to `${productName}, fragrance detail ${i+1}` (comma separator, NOT em-dash — clean against the em-dash grep contract).
- No `<Card>` wrapper around the gallery container.

**Action:**
1. Create `src/components/storefront/ProductGallery.tsx` with `"use client"` directive (state for hover + dialog index).
2. Import: `{ Dialog, DialogContent, DialogTrigger }` from `@/components/ui` (or whatever the existing Dialog export shape is — verify by reading `src/components/ui/Dialog.tsx`). Import `Image` from `next/image`. Import `useState, useEffect, useCallback` from React.
3. Local state: `const [isHovering, setIsHovering] = useState(false); const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);` (null = closed).
4. Render the primary image stack: a positioned container with two `<Image>` layers absolutely-positioned, the secondary overlay's `opacity` driven by `isHovering` and `images.length >= 2`. Wrap in `<button type="button" onClick={() => setLightboxIndex(0)} aria-label={\`Open ${productName} gallery\`}>`.
5. Use `transition-opacity duration-[var(--duration-base)] ease-out` Tailwind arbitrary values (or pure CSS via inline style) so the verifier grep matches `transition-`.
6. Render the lightbox using `<Dialog open={lightboxIndex !== null} onOpenChange={(o) => !o && setLightboxIndex(null)}>`. Inside `<DialogContent>` render the current image at large size + a row of thumbnail buttons. Add keyboard handler via `useEffect` listening to `keydown` while open:
   ```ts
   useEffect(() => {
     if (lightboxIndex === null) return;
     const handler = (e: KeyboardEvent) => {
       if (e.key === "ArrowRight") setLightboxIndex(i => i === null ? null : (i + 1) % images.length);
       if (e.key === "ArrowLeft") setLightboxIndex(i => i === null ? null : (i - 1 + images.length) % images.length);
     };
     window.addEventListener("keydown", handler);
     return () => window.removeEventListener("keydown", handler);
   }, [lightboxIndex, images.length]);
   ```
7. Add `transition-opacity` and `animate-` Tailwind utilities so verifier grep finds at least one in this file.
8. Desktop sizing: outer container `<div className="relative aspect-[3/4] md:aspect-square lg:min-h-[800px] w-full overflow-hidden">`. Add `border border-border` (hairline) NOT `rounded-*`.
9. Do not import or use `<Card>`.

**Validation:**
- `test -f src/components/storefront/ProductGallery.tsx && echo EXISTS` → `EXISTS`
- `grep -cE 'from .@/components/ui.|Dialog' src/components/storefront/ProductGallery.tsx` → ≥ 1
- `grep -cE 'ArrowLeft|ArrowRight' src/components/storefront/ProductGallery.tsx` → ≥ 2 (both bindings)
- `grep -cE 'transition-|animate-' src/components/storefront/ProductGallery.tsx` → ≥ 1
- `grep -cE '<Card[ >]' src/components/storefront/ProductGallery.tsx` → `0`
- `grep -cE ' — | – ' src/components/storefront/ProductGallery.tsx` → `0`
- `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/storefront/ProductGallery.tsx` → no output

**Context:** Read @.planning/DESIGN.md (§10b motion rule 10 image-hover-crossfade; §7 motion tokens), @.planning/PRODUCT.md, @src/components/ui/Dialog.tsx (verify primitive surface — props, focus trap, scrim), @src/components/ui/index.ts.

**Design:**
- Register: product
- Tokens used: `var(--duration-base)`, `var(--ease-out-quart)`, `var(--border)`, aspect ratios
- Scope: component
- Anti-pattern guard: builder verifies `grep -cE 'rounded-(md|lg|xl)' src/components/storefront/ProductGallery.tsx` returns `0` (editorial sharp, hairline border only).

---

## Task 3 — Build NotesStory, StickyATC, RelatedCarousel, and SocialProof
**Wave:** 1
**Persona:** frontend
**Files:**
- Create `src/components/storefront/NotesStory.tsx` — exports `NotesStory`. Props: `{ topNotes?: string[]; heartNotes?: string[]; baseNotes?: string[]; fragranceFamily?: string; description?: string }`. Renders the composition as editorial PROSE (not `<ul>` bullets). Pattern: an opening paragraph in `font-display-xl` italic that names the family and sets the scene, followed by three short prose paragraphs each anchored by a `font-micro` eyebrow ("THE OPENING", "THE HEART", "THE DRYDOWN") and the notes woven into a sentence (e.g. "Bergamot meets pink pepper, then settles toward jasmine, rose, and a whisper of violet."). Includes an inline accordion (open/close native `<details>` or a controlled state) labeled "Read the composition" that expands a verbatim notes list below. Scroll-triggered fade-up: each paragraph fades from `opacity-0 translate-y-4` to `opacity-100 translate-y-0` over `var(--duration-base)` when scrolled into view via `IntersectionObserver` (one-shot, no re-trigger).
- Create `src/components/storefront/StickyATC.tsx` — exports `StickyATC`. Props: `{ price: number; productName: string; onAddToCart: () => void; disabled?: boolean }`. Renders a `position: fixed; bottom: 0; left: 0; right: 0; z-index: 40` bar on viewports ≤ 768px (`md:hidden`); hidden on desktop. Bar contains formatted price (left, using `formatCurrency`-like inline `new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" })`) and an `Add to bag` button (right) using the `Button` primitive from `@/components/ui`. On scroll, a subtle `var(--shadow-1)` appears (track scrollY via `useEffect` + `window.scroll` listener; toggle a `data-elevated="true"` attr; CSS reads attr and applies shadow with `transition-shadow var(--duration-base)`).
- Create `src/components/storefront/RelatedCarousel.tsx` — exports `RelatedCarousel`. Props: `{ products: Product[] }` (Product type imported from `@/lib/supabase/types`). Renders an `<h2 className="text-[length:var(--font-h2)]">More from this register</h2>` (no em-dash) above a horizontal CSS-scroll-snap row: `<ul className="flex gap-6 overflow-x-auto snap-x snap-mandatory ...">` with each item using the existing `ProductCard` primitive from `@/components/ui` (snap-start, min-width sized for ~280px cards). Renders ≥ 3 cards when `products.length >= 3`; renders `Skeleton` placeholders when `products.length === 0` (3 skeletons). Keyboard accessible: arrow keys on the scroll container nudge `scrollLeft` by card width (use a `keydown` handler on the `<ul>`).
- Create `src/components/storefront/SocialProof.tsx` — exports `SocialProof`. Props: `{ ordersCount?: number | null }`. If `ordersCount != null && ordersCount > 0`, render an editorial inline strip: `<p className="font-micro uppercase tracking-[0.05em] text-fg-muted">{ordersCount} bought in the last thirty days</p>` (no em-dash, "thirty" spelled out per voice). Else render a fallback `Badge` from `@/components/ui` with text "Popular this season". Do not invent counts. Component is server-renderable.

**Depends on:** none

**Why:**
- PDP-02 mandates editorial prose for notes; D-07 forbids `<ul>` bullets at the top level. NotesStory is the editorial heart of the page and the second motion pattern (scroll-fade).
- PDP-04 requires sticky-on-mobile ATC; D-02 mandates `position: fixed` (not `sticky`) for iOS Safari. Shadow-up on scroll is motion pattern #3.
- PDP-05 mandates the related-products row; CSS scroll-snap (not auto-rotating carousel) honors the §10b ban on auto-carousel.
- PDP-03 social proof must use real orders data IF anon RLS allows; else fall back to a static Badge. The fallback is not a "stub" or "v1" — it's the locked decision when the query returns null.

**Acceptance Criteria:**
- `NotesStory.tsx` renders three prose paragraphs (not bullets); each preceded by a `font-micro` uppercase eyebrow ("THE OPENING" / "THE HEART" / "THE DRYDOWN"). The composition is written as sentences ("Bergamot meets pink pepper, then settles…") not as comma-separated lists. The inline accordion labeled "Read the composition" (no em-dash) expands to show the raw notes lists. `IntersectionObserver` is used to trigger one-shot fade-up; grep for `IntersectionObserver` returns ≥ 1.
- `StickyATC.tsx` renders ONLY on `md:hidden` viewports; the outer wrapper class string contains `fixed bottom-0` (verifier greps `position: fixed\|fixed bottom`). When `window.scrollY > 80`, the `data-elevated="true"` attribute is set and a `var(--shadow-1)` appears via CSS. Add-to-bag button label is exactly "Add to bag" (lowercase b, no em-dash).
- `RelatedCarousel.tsx` renders `<h2>More from this register</h2>` (no em-dash, no exclamation) and a horizontal scroll-snap row using `ProductCard`. When `products.length === 0`, renders 3 `Skeleton` placeholders. Keyboard nav: ArrowRight/ArrowLeft on a focused card or container scrolls by one card width.
- `SocialProof.tsx` accepts `ordersCount: number | null`. When `null` or `0`, falls back to a `Badge` with text "Popular this season" (no em-dash). When `> 0`, renders the editorial line "{N} bought in the last thirty days".
- None of the four files use `<Card>` as a section wrapper. None contain em-dashes (`—`/`–`), hyphen-as-punctuation, or emoji in customer-visible strings.

**Action:**
1. **NotesStory.tsx** — mark `"use client"`. Implement the `IntersectionObserver` hook inline (or as a small `useInView` hook colocated in the file): observe each paragraph `ref`, set `data-revealed="true"` once; CSS `[data-revealed="true"] { opacity: 1; transform: translateY(0); transition: opacity var(--duration-base) var(--ease-out-quart), transform var(--duration-base) var(--ease-out-quart); }` and the default state `opacity-0 translate-y-4`. Compose prose using the `topNotes`/`heartNotes`/`baseNotes` arrays joined into sentences via a small helper (`weaveNotes(notes: string[]): string` → `notes.length === 1 ? notes[0] : notes.slice(0, -1).join(", ") + ", and " + notes.slice(-1)`). The inline accordion is a native `<details className="border-t border-border pt-4 mt-8"><summary className="font-micro uppercase tracking-[0.05em] cursor-pointer">Read the composition</summary>…</details>`. Inside the accordion (interior, not section-level), a `<ul>` listing notes by layer is acceptable — the §10b bullet ban is for the top-level composition, not for the disclosure.
2. **StickyATC.tsx** — mark `"use client"`. Outer wrapper: `<div className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border bg-bg transition-shadow duration-[var(--duration-base)] data-[elevated=true]:shadow-[var(--shadow-1)]" data-elevated={elevated}>`. Use `useEffect` to attach `window.addEventListener("scroll", onScroll, { passive: true })` and set `elevated = window.scrollY > 80`. Cleanup on unmount. Layout: `<div className="flex items-center justify-between gap-4 px-4 py-3">` with price on left (formatted via `Intl.NumberFormat`) and `<Button>Add to bag</Button>` on right. Wire `onClick={onAddToCart}`.
3. **RelatedCarousel.tsx** — server-renderable; import `ProductCard` from `@/components/ui` (verify export name — `ProductCard` is in `src/components/ui/ProductCard.tsx`). Import `Skeleton` from `@/components/ui`. Render `<section aria-labelledby="related-heading" className="border-t border-border py-16">` then `<h2 id="related-heading" className="text-[length:var(--font-h2)] mb-8">More from this register</h2>` then the scroll-snap `<ul>`. For keyboard nav, add a small `"use client"` sub-component or use a `<div onKeyDown>` wrapper. Each `<li>` is `min-w-[260px] sm:min-w-[280px] snap-start`. Apply `animate-` or `transition-` to the card hover state via a wrapper class (e.g. `transition-transform duration-[var(--duration-fast)] hover:-translate-y-0.5`) so this file contributes to the motion-grep count.
4. **SocialProof.tsx** — pure server component. Branch on `ordersCount`. When fallback path, import `Badge` from `@/components/ui` and render `<Badge variant="muted">Popular this season</Badge>` (use the Badge variant that exists; verify in `src/components/ui/Badge.tsx`). When real path, render plain text without Badge.

**Validation:**
- `test -f src/components/storefront/NotesStory.tsx -a -f src/components/storefront/StickyATC.tsx -a -f src/components/storefront/RelatedCarousel.tsx -a -f src/components/storefront/SocialProof.tsx && echo ALL_EXIST` → `ALL_EXIST`
- `grep -c 'IntersectionObserver' src/components/storefront/NotesStory.tsx` → ≥ 1
- `grep -cE 'fixed bottom-0|position: fixed' src/components/storefront/StickyATC.tsx` → ≥ 1
- `grep -c 'md:hidden' src/components/storefront/StickyATC.tsx` → ≥ 1
- `grep -c 'Add to bag' src/components/storefront/StickyATC.tsx` → 1
- `grep -c 'snap-' src/components/storefront/RelatedCarousel.tsx` → ≥ 1
- `grep -c 'ProductCard' src/components/storefront/RelatedCarousel.tsx` → ≥ 1
- `grep -c 'Popular this season' src/components/storefront/SocialProof.tsx` → 1
- `grep -cE 'transition-|animate-|@keyframes|IntersectionObserver' src/components/storefront/NotesStory.tsx src/components/storefront/StickyATC.tsx src/components/storefront/RelatedCarousel.tsx` → ≥ 3
- `grep -rcE ' — | – ' src/components/storefront/NotesStory.tsx src/components/storefront/StickyATC.tsx src/components/storefront/RelatedCarousel.tsx src/components/storefront/SocialProof.tsx | grep -v ':0$'` → no output (all four return 0)
- `grep -rcE '<Card[ >]' src/components/storefront/NotesStory.tsx src/components/storefront/StickyATC.tsx src/components/storefront/RelatedCarousel.tsx src/components/storefront/SocialProof.tsx | grep -v ':0$'` → no output
- `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/storefront/` → no output
- `npx tsc --noEmit 2>&1 | grep -E "(NotesStory|StickyATC|RelatedCarousel|SocialProof)\.tsx"` → no output

**Context:** Read @.planning/DESIGN.md (§7 motion tokens; §10b motion rule 10 — scroll-triggered fade-up, sticky shadow-up; layout rule 6 — magazine spread + numbered editorial), @.planning/PRODUCT.md (brand voice; sample copy in `<phase_details>` voice samples), @src/components/ui/ProductCard.tsx (consume only — note prop shape), @src/components/ui/Badge.tsx (verify variant names), @src/components/ui/Button.tsx, @src/components/ui/Skeleton.tsx, @src/lib/supabase/types.ts (Product shape — snake_case `top_notes`, `heart_notes`, `base_notes`, `fragrance_family`).

**Design:**
- Register: product (page chrome) with brand-register prose moments in NotesStory
- Tokens used: `var(--duration-base)`, `var(--duration-fast)`, `var(--ease-out-quart)`, `var(--shadow-1)`, `var(--font-h2)`, `var(--font-micro)`, `var(--border)`, `--space-4`, `--space-6`, `--space-8`, `--space-16`
- Scope: component (four siblings, consumed by Task 4's page rewrite)
- Anti-pattern guard: builder runs the em-dash, Card-wrapper, and emoji greps from §10b verification additions on all four files before commit.

---

## Task 4 — Rewrite `src/app/products/[slug]/page.tsx` as a magazine-spread PDP
**Wave:** 2
**Persona:** frontend
**Files:**
- Rewrite `src/app/products/[slug]/page.tsx` — keep the existing data-fetching shape (calls `getProductBySlug(slug)` and `getRelatedProducts(productId)` from `src/lib/supabase/product-service.ts`; both already migrated in M1 P2). Replace the entire JSX render with the magazine-spread layout. Import `ProductGallery`, `NotesStory`, `StickyATC`, `RelatedCarousel`, `SocialProof`, and `TrustBar` from `@/components/storefront/*`. The page is a server component for data fetching; an inner `"use client"` wrapper handles cart state and the StickyATC `onAddToCart` callback. Use the existing CartProvider context (`useCart()` from `@/components/cart/CartProvider`).
- Add or extend `src/lib/supabase/product-service.ts` to export `getProductOrdersCount(productId: string, days: number): Promise<number | null>`. Implementation: query the `orders` table (or `order_items` if normalized — verify schema first) filtered by `product_id` and `created_at >= now() - interval 'N days'`. Use the **public** (anon, cookie-free) Supabase client from `@/lib/supabase/public`. If the query returns an error (RLS denies), return `null`. Never throw. This is the read path for `SocialProof`.

**Depends on:** Task 1 (TrustBar), Task 2 (ProductGallery), Task 3 (NotesStory + StickyATC + RelatedCarousel + SocialProof).

**Why:** This task is the integration — it assembles the four sibling components into the magazine-spread layout PDP-01..06 + TRUST-01 require, wires the orders-count fallback per D-04, and replaces the ad-hoc Tailwind rendering layer that survived M1. Wave 2 because every import target must exist first (Wave 1 outputs). Decision D-04 requires verifying RLS readability of `orders` for anon; the helper returning `null` on error is the contract that triggers the static Badge fallback in `SocialProof` — that is the locked decision, NOT a "stub for now".

**Acceptance Criteria:**
- Visiting `/products/{any-real-slug}` at viewport ≥ 1024px renders a two-column magazine spread: left column is `ProductGallery` (image column, ≥ 800px wide), right column is the type column with product name (`text-[length:var(--font-display-xl)]`), price, `SocialProof`, an `Add to bag` desktop button using `<Button>` from `@/components/ui`, `TrustBar`, "Order a 2ml sample" secondary CTA where applicable (PDP-06), and the "Or make one. Three layers, four hours." builder callout linking to `/create-perfume`. Below the spread: a section `NotesStory` then `RelatedCarousel`.
- The layout uses ONE container variant: magazine spread (`grid grid-cols-1 lg:grid-cols-[55%_45%]` or similar asymmetric grid). No other section is wrapped in `<Card>`. The page may use `<Card>` at most twice and ONLY for interior content tiles (e.g. a single quote callout or the builder callout if styled as a tile) — verifier allows ≤ 2 matches.
- At viewport ≤ 768px (`md:hidden` desktop ATC), the `StickyATC` component is pinned to the viewport bottom and the in-flow desktop ATC button is hidden. At ≥ 768px, StickyATC is hidden and the desktop ATC is visible in the type column.
- `getProductOrdersCount(product.id, 30)` is called server-side at render; the result (number or null) is passed to `<SocialProof ordersCount={…} />`. When the helper returns null or 0, the rendered DOM contains the "Popular this season" Badge; when it returns >0, the rendered DOM contains "{N} bought in the last thirty days".
- All customer-visible copy passes em-dash / hyphen-as-punctuation / emoji greps. Voice samples used verbatim: "Add to bag" (ATC labels), "Order a 2ml sample" (sample CTA), "Or make one. Three layers, four hours." (builder callout title), "Read the composition" (accordion eyebrow — inside NotesStory), "Popular this season" (social proof fallback), "Ships in three days" / "Returns within thirty" / "Authenticity guaranteed" (trust labels — inside TrustBar).
- `npm run build` exits 0 on the new page; `npx tsc --noEmit` exits 0.

**Action:**
1. Read the current `src/app/products/[slug]/page.tsx` to preserve the data-fetch shape (the M1 migration result) — only the JSX render is being replaced.
2. Confirm Supabase `orders` schema for `getProductOrdersCount`: run `grep -n "product_id\|order_items" src/lib/supabase/types.ts` and inspect. If `order_items` join is required, the query joins `order_items(product_id)` against `orders(created_at)`. If anon RLS blocks the join, the catch path returns `null` — log a one-line `console.warn("[social-proof] orders count unavailable; using fallback")` (server-side only).
3. Add `export async function getProductOrdersCount(productId: string, days: number): Promise<number | null>` to `src/lib/supabase/product-service.ts`. Use `createPublicClient()` from `@/lib/supabase/public`. Query pattern (adapt to actual schema):
   ```ts
   const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
   const { data, error, count } = await supabase
     .from("order_items")  // or "orders" if denormalized
     .select("id", { count: "exact", head: true })
     .eq("product_id", productId)
     .gte("created_at", since);
   if (error) return null;
   return count ?? 0;
   ```
4. Rewrite the page render. Structure (skeleton):
   ```tsx
   export default async function ProductPage({ params }: { params: { slug: string } }) {
     const product = await getProductBySlug(params.slug);
     if (!product) notFound();
     const [related, ordersCount] = await Promise.all([
       getRelatedProducts(product.id, 6),
       getProductOrdersCount(product.id, 30),
     ]);
     const images = buildImageList(product); // helper: primary + secondary if present
     return (
       <main className="min-h-screen bg-bg text-fg">
         <article className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-0 lg:gap-16">
           <ProductGallery images={images} productName={product.name} />
           <aside className="px-[var(--page-px)] py-[var(--page-py)] flex flex-col gap-8">
             <header>
               <p className="font-micro uppercase tracking-[0.05em] text-fg-muted">{product.brand}</p>
               <h1 className="text-[length:var(--font-display-xl)] mt-2">{product.name}</h1>
               <p className="text-[length:var(--font-h2)] mt-4">{formatEUR(product.price)}</p>
             </header>
             <SocialProof ordersCount={ordersCount} />
             <ClientATCBlock product={product} /> {/* "use client" wrapper for desktop button + cart wiring */}
             <TrustBar />
             {productSupportsSample(product) && (
               <Button variant="ghost">Order a 2ml sample</Button>
             )}
             <aside className="border-t border-border pt-6">
               <p className="font-micro uppercase tracking-[0.05em] text-fg-muted">Build your own</p>
               <h2 className="text-[length:var(--font-h3)] mt-2">Or make one. Three layers, four hours.</h2>
               <Link href="/create-perfume" className="inline-block mt-3 underline underline-offset-4">Open the builder</Link>
             </aside>
           </aside>
         </article>
         <NotesStory
           topNotes={product.top_notes}
           heartNotes={product.heart_notes}
           baseNotes={product.base_notes}
           fragranceFamily={product.fragrance_family}
           description={product.description}
         />
         <RelatedCarousel products={related} />
         <StickyATCBlock product={product} /> {/* "use client" wrapper, hidden md:hidden */}
       </main>
     );
   }
   ```
5. Create a tiny `"use client"` boundary component inside the same file (or co-located as `ATCBlock.tsx` if cleaner) that calls `useCart()` and exposes a stable `handleAdd` callback used by both desktop button and `StickyATC`. Do NOT make the entire page client.
6. Verify the desktop "Add to bag" button is rendered in the type column AND that `StickyATC` is rendered after the article. The desktop in-flow button can carry a `hidden md:inline-flex` class; `StickyATC` is `md:hidden`. Mobile sees only StickyATC; desktop sees only the in-flow button.
7. Confirm the page renders no em-dashes, no emoji, and at most 2 `<Card>` usages. Recommended: do NOT use `<Card>` at all on this route.
8. Run `npm run build` and `npx tsc --noEmit` locally before commit.

**Validation:**
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -c "getProductOrdersCount" src/lib/supabase/product-service.ts` → ≥ 1 (export added)
- `grep -c "getProductOrdersCount" src/app/products/\[slug\]/page.tsx` → ≥ 1 (helper called)
- `grep -cE 'ProductGallery|NotesStory|StickyATC|RelatedCarousel|SocialProof|TrustBar' src/app/products/\[slug\]/page.tsx` → ≥ 6 (all imports wired)
- `grep -c 'Add to bag' src/app/products/\[slug\]/page.tsx` → ≥ 1
- `grep -c 'Order a 2ml sample' src/app/products/\[slug\]/page.tsx` → ≥ 1
- `grep -c 'Or make one\. Three layers, four hours\.' src/app/products/\[slug\]/page.tsx` → ≥ 1
- `grep -cE ' — | – ' src/app/products/\[slug\]/page.tsx` → `0`
- `grep -cE '<Card[ >]' src/app/products/\[slug\]/page.tsx` → ≤ 2
- `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/app/products/\[slug\]/page.tsx` → no output
- `npm run build 2>&1 | tail -5` → exits 0 with no error on the products route
- Optional manual: visit `http://localhost:3000/products/{slug}` at 375px and at 1280px; confirm sticky bar appears on mobile only, desktop hero image ≥ 800px, lightbox opens with arrow nav.

**Context:** Read @.planning/DESIGN.md (§10b layout rules; container vocabulary; magazine spread example), @.planning/PRODUCT.md, @src/app/products/[slug]/page.tsx (current state — preserve data shape only), @src/lib/supabase/product-service.ts (existing `getProductBySlug` + `getRelatedProducts`), @src/lib/supabase/types.ts (Product schema — snake_case fields; verify `top_notes`/`heart_notes`/`base_notes`/`fragrance_family` actually exist; if they live elsewhere, adapt), @src/lib/supabase/public.ts (anon read-only client), @src/components/cart/CartProvider.tsx (existing cart context shape), @src/components/storefront/TrustBar.tsx (Task 1), @src/components/storefront/ProductGallery.tsx (Task 2), @src/components/storefront/NotesStory.tsx (Task 3), @src/components/storefront/StickyATC.tsx (Task 3), @src/components/storefront/RelatedCarousel.tsx (Task 3), @src/components/storefront/SocialProof.tsx (Task 3).

**Design:**
- Register: product (PDP is a conversion page; brand-register prose surfaces inside NotesStory only)
- Tokens used: `--page-px`, `--page-py`, `var(--font-display-xl)`, `var(--font-h2)`, `var(--font-h3)`, `var(--font-micro)`, `var(--border)`, `--space-8`, `--space-16`, grid asymmetric `grid-cols-[55%_45%]`
- Scope: page
- Anti-pattern guard: builder runs all §10b grep gates on this file before commit (em-dash, Card-as-section, emoji, motion presence transitively via imported children). If the desktop ATC button is missing the `hidden md:inline-flex` modifier or the `StickyATC` is missing `md:hidden`, both ATC controls will render simultaneously on desktop — visually catastrophic; builder confirms manually at 1280px before commit.

---

## Success Criteria

(Mirror the ROADMAP Phase 2.2 list, with M2 §10b additions baked in.)

- [ ] **PDP-01** — On desktop (1280px), the hero image spans ≥ 800px; clicking it opens a `Dialog` lightbox with keyboard `ArrowLeft`/`ArrowRight` navigation between images and `Escape` to close.
- [ ] **PDP-02** — Notes section renders as editorial prose (three short paragraphs with `font-micro` eyebrows "THE OPENING" / "THE HEART" / "THE DRYDOWN"), NOT a top-level `<ul>` of bullets. An inline accordion labeled "Read the composition" reveals the raw notes lists.
- [ ] **PDP-03** — Social proof renders: either real `{N} bought in the last thirty days` (when `getProductOrdersCount` returns >0) OR the static `Popular this season` Badge fallback (when the helper returns null/0). Counts are not fabricated.
- [ ] **PDP-04** — At ≤ 768px, the `StickyATC` bar is pinned via `position: fixed bottom-0 inset-x-0 md:hidden` (NOT `position: sticky`), with the `Add to bag` button. At ≥ 768px, the sticky bar is hidden and a desktop ATC button lives in the hero column.
- [ ] **PDP-05** — The related-products row renders ≥ 3 cards via `getRelatedProducts(product.id, 6)`, uses the `ProductCard` primitive, uses CSS scroll-snap (NOT auto-rotating carousel), and is keyboard-navigable via arrow keys. `Skeleton` renders during loading.
- [ ] **PDP-06** — A "Order a 2ml sample" secondary CTA is present where the product supports it; the "Or make one. Three layers, four hours." builder callout links to `/create-perfume`.
- [ ] **TRUST-01** — Shipping / returns / authenticity microcopy is visible without expanding a disclosure: `TrustBar` (three editorial inline labels separated by hairline dividers) is rendered in the type column below the price/ATC, NOT inside a Card row of icon tiles. The same `TrustBar` component is consumed by Phase 2.4 (Cart drawer + Checkout).
- [ ] **§10b** — Zero em-dashes / en-dashes / hyphen-as-punctuation / emoji in customer-visible JSX strings on any of the five new components or the page rewrite.
- [ ] **§10b** — ≤ 2 `<Card>` usages on the page; zero `<Card>` usages as section wrappers in any of the five new storefront components.
- [ ] **§10b** — ≥ 3 motion patterns wired across the new components: image hover crossfade (ProductGallery), scroll-triggered fade-up via `IntersectionObserver` (NotesStory), sticky shadow-up on scroll (StickyATC). Hover micro-shift on RelatedCarousel cards is a bonus 4th.
- [ ] **§10b** — One container variant on the route: magazine spread. No mixed-rhythm storefront wrappers.
- [ ] **Voice** — All customer-visible copy uses the verbatim voice samples from `<phase_details>` and follows PRODUCT.md §Brand-voice across the page, components, and TrustBar.
- [ ] **Build** — `npm run build` exits 0; `npx tsc --noEmit` exits 0; `npm run lint` exits 0.

## Verification Contract

### Contract for Task 1 — TrustBar (file)
**Check type:** file-exists
**Command:** `test -f src/components/storefront/TrustBar.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist.

### Contract for Task 1 — TrustBar (labels verbatim)
**Check type:** grep-match
**Command:** `grep -cE 'Ships in three days|Returns within thirty|Authenticity guaranteed' src/components/storefront/TrustBar.tsx`
**Expected:** `3`
**Fail if:** Fewer than 3 — one of the locked-voice labels was rewritten.

### Contract for Task 1 — TrustBar (icon family)
**Check type:** grep-match
**Command:** `grep -cE "from .lucide-react." src/components/storefront/TrustBar.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — TrustBar imported a non-Lucide icon library, violating DESIGN.md §8.

### Contract for Task 2 — ProductGallery (file)
**Check type:** file-exists
**Command:** `test -f src/components/storefront/ProductGallery.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File missing.

### Contract for Task 2 — ProductGallery uses Dialog primitive
**Check type:** grep-match
**Command:** `grep -cE 'from .@/components/ui.|Dialog' src/components/storefront/ProductGallery.tsx`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — D-03 violated (lightbox must use Dialog primitive).

### Contract for Task 2 — ProductGallery keyboard nav wired
**Check type:** grep-match
**Command:** `grep -cE 'ArrowLeft|ArrowRight' src/components/storefront/ProductGallery.tsx`
**Expected:** ≥ 2
**Fail if:** Fewer than 2 — keyboard nav incomplete; PDP-01 failure.

### Contract for Task 3 — NotesStory uses IntersectionObserver
**Check type:** grep-match
**Command:** `grep -c 'IntersectionObserver' src/components/storefront/NotesStory.tsx`
**Expected:** ≥ 1
**Fail if:** Returns 0 — scroll-triggered fade-up not wired; D-06 motion count fails.

### Contract for Task 3 — StickyATC uses position:fixed (NOT sticky)
**Check type:** grep-match
**Command:** `grep -cE 'fixed bottom-0|position: fixed' src/components/storefront/StickyATC.tsx`
**Expected:** ≥ 1
**Fail if:** Returns 0 — D-02 violated (must be `position: fixed`).

### Contract for Task 3 — StickyATC NOT position:sticky
**Check type:** grep-match
**Command:** `grep -c 'position: sticky\|sticky bottom' src/components/storefront/StickyATC.tsx`
**Expected:** `0`
**Fail if:** Non-zero — D-02 violated (iOS Safari sticky-in-overflow bug).

### Contract for Task 3 — StickyATC mobile-only
**Check type:** grep-match
**Command:** `grep -c 'md:hidden' src/components/storefront/StickyATC.tsx`
**Expected:** ≥ 1
**Fail if:** Returns 0 — sticky bar would render on desktop, overlapping desktop ATC.

### Contract for Task 3 — RelatedCarousel uses ProductCard primitive + scroll-snap
**Check type:** grep-match
**Command:** `grep -cE 'ProductCard' src/components/storefront/RelatedCarousel.tsx && grep -cE 'snap-' src/components/storefront/RelatedCarousel.tsx`
**Expected:** Both ≥ 1
**Fail if:** Either returns 0 — PDP-05 failure (must use primitive + CSS scroll-snap, not auto-rotating carousel).

### Contract for Task 3 — SocialProof has fallback
**Check type:** grep-match
**Command:** `grep -c 'Popular this season' src/components/storefront/SocialProof.tsx`
**Expected:** `1`
**Fail if:** Returns 0 — D-04 fallback path missing.

### Contract for Task 3 — Motion pattern count
**Check type:** grep-match
**Command:** `grep -cE 'animate-|transition-|@keyframes|IntersectionObserver' src/components/storefront/ProductGallery.tsx src/components/storefront/NotesStory.tsx src/components/storefront/StickyATC.tsx src/components/storefront/RelatedCarousel.tsx`
**Expected:** ≥ 3
**Fail if:** Fewer than 3 — D-06 motion mandate fails; §10b verifier blocks.

### Contract for Task 4 — page imports all new components
**Check type:** grep-match
**Command:** `grep -cE 'ProductGallery|NotesStory|StickyATC|RelatedCarousel|SocialProof|TrustBar' src/app/products/\[slug\]/page.tsx`
**Expected:** ≥ 6
**Fail if:** Fewer than 6 — wiring incomplete; #1 verifier failure mode (component exists but unused).

### Contract for Task 4 — getProductOrdersCount wired
**Check type:** grep-match
**Command:** `grep -c 'getProductOrdersCount' src/lib/supabase/product-service.ts && grep -c 'getProductOrdersCount' src/app/products/\[slug\]/page.tsx`
**Expected:** Both ≥ 1
**Fail if:** Either returns 0 — D-04 social-proof read path missing.

### Contract for Task 4 — voice samples verbatim
**Check type:** grep-match
**Command:** `grep -cE 'Add to bag|Order a 2ml sample|Or make one\. Three layers, four hours\.' src/app/products/\[slug\]/page.tsx`
**Expected:** ≥ 3
**Fail if:** Fewer than 3 — voice samples rewritten / sales-floor drift.

### Contract for Task 4 — TypeScript compiles
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript compilation errors.

### Contract for Task 4 — build succeeds
**Check type:** command-exit
**Command:** `npm run build 2>&1 | tail -1`
**Expected:** Build completes without error
**Fail if:** Build fails, the products route fails to compile, or the page is missing from the build output.

### Cross-task M2 §10b gates (apply to all Wave 1 + Wave 2 files)

### Contract for §10b — no em-dashes / en-dashes
**Check type:** grep-match
**Command:** `grep -rEn ' — | – ' src/components/storefront/ProductGallery.tsx src/components/storefront/NotesStory.tsx src/components/storefront/StickyATC.tsx src/components/storefront/RelatedCarousel.tsx src/components/storefront/TrustBar.tsx src/components/storefront/SocialProof.tsx src/app/products/\[slug\]/page.tsx`
**Expected:** No output (zero matches)
**Fail if:** Any match — copy rule violated; §10b commit block.

### Contract for §10b — Card primitive bounded
**Check type:** grep-match
**Command:** `for f in src/app/products/\[slug\]/page.tsx src/components/storefront/NotesStory.tsx src/components/storefront/ProductGallery.tsx src/components/storefront/RelatedCarousel.tsx src/components/storefront/TrustBar.tsx src/components/storefront/StickyATC.tsx src/components/storefront/SocialProof.tsx; do c=$(grep -cE '<Card[ >]' "$f" 2>/dev/null || echo 0); echo "$f:$c"; done`
**Expected:** Every file `:0` EXCEPT the page route, which is `:0`, `:1`, or `:2`.
**Fail if:** Any storefront component shows `:1+` (Card as section wrapper banned) OR the page shows `:3+` (interior-tile budget exceeded).

### Contract for §10b — motion present
**Check type:** grep-match
**Command:** `grep -cE 'animate-|transition-|@keyframes|IntersectionObserver' src/components/storefront/ProductGallery.tsx src/components/storefront/NotesStory.tsx src/components/storefront/StickyATC.tsx src/components/storefront/RelatedCarousel.tsx`
**Expected:** ≥ 3 (total across the four files)
**Fail if:** Fewer than 3 — motion mandate fails.

### Contract for §10b — zero emoji
**Check type:** grep-match
**Command:** `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/storefront/ src/app/products/`
**Expected:** No output (zero matches)
**Fail if:** Any emoji byte in any storefront component or products route file.

### Contract for behavior — sticky ATC on mobile only (manual / browser QA)
**Check type:** behavioral
**Command:** Open `http://localhost:3000/products/{a-real-slug}` at viewport 375px and at 1280px in Chrome devtools device toolbar.
**Expected:** At 375px, a bar containing the price and `Add to bag` button is pinned to the viewport bottom, visible above content. At 1280px, the bar is absent and the desktop `Add to bag` button appears in the right-column hero. Scrolling the mobile view causes a faint shadow to appear above the sticky bar.
**Fail if:** Sticky bar visible on desktop (`md:hidden` missing), OR no sticky bar on mobile (`fixed bottom-0` missing), OR no shadow change on scroll (D-06 motion-3 missing).

### Contract for behavior — lightbox keyboard nav (manual)
**Check type:** behavioral
**Command:** On a product with ≥ 2 images, click the hero image to open the Dialog. Press ArrowRight twice, then ArrowLeft, then Escape.
**Expected:** Lightbox cycles through images on arrow keys (wraps at boundaries), closes on Escape, focus returns to the gallery trigger.
**Fail if:** Arrow keys do nothing, Escape doesn't close, or focus is lost on close — PDP-01 partial fail.

### Contract for behavior — social-proof fallback path (manual / database)
**Check type:** behavioral
**Command:** Visit a product whose `id` has zero rows in `order_items` (or whichever orders table) in the last 30 days, or whose anon-RLS read returns an error. Inspect the rendered DOM near the product price.
**Expected:** A `Badge` containing the text "Popular this season" is rendered. The number-based variant is NOT rendered.
**Fail if:** The page renders a fabricated count, throws, or shows neither variant.

---

## Wave Map (deterministic)

| Task | Writes | Reads (Context @refs of upstream task writes + Depends-on) | In-degree | Wave |
|------|--------|-----------------------------------------------------------|-----------|------|
| T1 TrustBar | `src/components/storefront/TrustBar.tsx` | DESIGN.md, PRODUCT.md, ui/index.ts | 0 | 1 |
| T2 ProductGallery | `src/components/storefront/ProductGallery.tsx` | DESIGN.md, ui/Dialog.tsx | 0 | 1 |
| T3 Notes+Sticky+Related+SocialProof | 4 files in `src/components/storefront/` | DESIGN.md, PRODUCT.md, ui/ProductCard.tsx, ui/Badge.tsx, ui/Skeleton.tsx, ui/Button.tsx, supabase/types.ts | 0 | 1 |
| T4 PDP rewrite | `src/app/products/[slug]/page.tsx`, edit `src/lib/supabase/product-service.ts` | T1 + T2 + T3 writes, supabase/public.ts, cart/CartProvider.tsx | 3 | 2 |

T1, T2, T3 → Wave 1 (no shared writes, all reading DESIGN.md/PRODUCT.md is fine — they only read, no write conflict). T4 → Wave 2 (depends on all three Wave-1 writes; serial after the wave completes).

## Decision Coverage Audit

| Decision ID | Decision | Covering task(s) |
|---|---|---|
| D-01 | Card primitive banned as section wrapper; one container variant per page (magazine spread) | T4 (page layout = `grid-cols-[55%_45%]`); T1/T2/T3 (no `<Card>` in any of the 6 new components) |
| D-02 | Sticky ATC = `position: fixed bottom-0 md:hidden` (NOT sticky) | T3 StickyATC; verifier grep blocks `position: sticky` |
| D-03 | Lightbox = Dialog primitive from `@/components/ui` | T2 ProductGallery; verifier grep on `Dialog` import |
| D-04 | Social proof: real orders count OR static "Popular this season" Badge fallback | T4 (`getProductOrdersCount` helper, null-safe) + T3 SocialProof (both render paths) |
| D-05 | TrustBar editorial inline format, hairline dividers, NOT a row of icon-cards | T1 TrustBar (`<Card>` count = 0; flex-row with pipe dividers) |
| D-06 | Motion mandatory: ≥ 3 patterns | T2 (image hover crossfade), T3 NotesStory (IntersectionObserver scroll fade-up), T3 StickyATC (shadow-up on scroll); bonus T3 RelatedCarousel hover micro-shift |
| D-07 | NotesStory = editorial prose, NOT `<ul>` bullets at section level; inline accordion for "Read the composition" | T3 NotesStory (prose paragraphs + `<details>` accordion; `<ul>` only inside the accordion disclosure) |
| D-08 | Voice consistent with PRODUCT.md across all customer-visible copy; verbatim voice samples | T1 (trust labels), T3 (StickyATC label, accordion eyebrow, social-proof fallback), T4 (sample CTA, builder callout, ATC label); cross-task em-dash + emoji greps |

All eight locked decisions are covered. No deferred-ideas content in any task.

---

*Plan written 2026-05-15 for Phase 2.2. Resume target: builder spawns Wave 1 (T1, T2, T3) in parallel; on green verification, builder spawns Wave 2 (T4) alone.*
