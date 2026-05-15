---
phase: 3
goal: "Shop and category listings rebuilt as URL-stateful, ISR-fast, editorial pages with filters, sort, skeleton placeholders, and hover micro-interactions, satisfying SHOP-01..04."
tasks: 3
waves: 3
---

# Phase 2.3: Shop / Category

**Goal:** A shopper opens `/shop`, `/shop/[category]`, or `/shop/lattafa` and gets an editorial product grid that loads ≥ 80% static (ISR, `revalidate = 60`), with a filter panel that serializes selection to the URL query string, a sort control that re-orders the grid in place, skeletons while RSC streams, and a hover micro-interaction on every product card. The page reads like a curated section of a catalogue, not a Shopify card grid: one editorial container variant per route (numbered editorial), no `<Card>` section wrappers, motion present on at least three patterns, zero emoji, zero em-dashes in copy.

**Why this phase:** SHOP-01..04 close the conversion path from homepage and AI concierge into product discovery. Without URL-stateful filters the shop is unshareable and unsegmentable for marketing; without ISR + skeletons the first paint is slow; without editorial restraint the design drifts back to "elegant Shopify store" and the price premium evaporates (per PRODUCT.md anti-references).

---

## Task 1 — Filter + sort foundation: constants, schema, and threshold doc
**Wave:** 1
**Persona:** backend
**Files:**
- `src/lib/constants.ts` — extend with `PRICE_BANDS` (id, label, min, max), `SORT_OPTIONS`, `GENDER_OPTIONS`, `BRAND_OPTIONS` (Lattafa, Al Haramain, Victoria's Secret, "Other"), `CATEGORY_OPTIONS` (sourced from `categories` in `src/lib/categories.ts`), and `NOTES_FAMILY_OPTIONS` (floral, fruity, woody, oriental, gourmand)
- `src/lib/shop/filter-schema.ts` — new file exporting `ShopFiltersSchema` (Zod), `ShopFilters` type, `parseShopFilters(searchParams: URLSearchParams): ShopFilters`, `stringifyShopFilters(filters: ShopFilters): URLSearchParams`, and `applyShopFilters(products: Product[], filters: ShopFilters): Product[]` plus `applyShopSort(products: Product[], sort: SortKey): Product[]`
- `.planning/CONTEXT.md` — append a `## Shop filtering threshold` note documenting the client-side filter strategy and the 500-SKU server-side threshold

**Depends on:** none

**Why:** SHOP-01 requires filter state in the URL with a stable shape that survives back/forward navigation, and SHOP-02 requires a deterministic sort. Without a Zod-validated parse/stringify layer the components scattershot the URL with inconsistent keys and the page bricks on a malformed share-link. Locking `PRICE_BANDS` in `constants.ts` also keeps the operator's price tiers in one place when they need adjusting. The 500-SKU threshold note in CONTEXT.md is the architectural cliff: client-side filtering against ~100 SKUs is correct now, but a future agent must know the line where it stops being correct.

**Acceptance Criteria:**
- `PRICE_BANDS` exported as `readonly` array of 4 bands: `0-30` ("Under 30"), `30-60` ("30 to 60"), `60-100` ("60 to 100"), `100+` ("100 and up"). Each band has `id`, `label`, `min` (number), `max` (number or `null` for the open-ended `100+` band).
- `SORT_OPTIONS` exported as 4 entries with keys `featured` (default), `price-asc`, `price-desc`, `newest`. Labels match locked copy exactly: "Featured", "Price low to high", "Price high to low", "Newest".
- `ShopFiltersSchema` (Zod) validates: `category?: enum from CATEGORY_OPTIONS`, `gender?: enum from GENDER_OPTIONS`, `brand?: array of strings (zero or more from BRAND_OPTIONS)`, `family?: array of strings (zero or more from NOTES_FAMILY_OPTIONS)`, `price?: array of band ids`, `sort?: enum from SORT_OPTIONS, defaults to "featured"`, `search?: string`. Unknown keys are stripped. Invalid values fall back silently to schema default rather than throwing (URL-share safety).
- `parseShopFilters` accepts a `URLSearchParams` (or `ReadonlyURLSearchParams` from `useSearchParams`) and returns a normalised `ShopFilters` object. Multi-value params (brand, family, price) use comma-separated values in the URL (e.g. `?brand=lattafa,al-haramain`).
- `stringifyShopFilters` is round-trip safe: `parseShopFilters(stringifyShopFilters(f))` deep-equals `f` for any valid `f`.
- `applyShopFilters` filters a `Product[]` against the parsed filter set. Price band match uses `displayPrice = product.sale_price ?? product.price`. Brand match is case-insensitive against `product.brand`. Family match treats `product.tags` as the source for the five fragrance families (floral, fruity, woody, oriental, gourmand).
- `applyShopSort` returns a new array sorted by the chosen sort key. `featured` sort: `is_featured = true` first (use `product.tags?.includes('featured')` as the featured signal since the Supabase row has no `is_featured` column), then `in_stock = true`, then `created_at` descending. `price-asc` / `price-desc` use `displayPrice`. `newest` is `created_at` descending.
- `.planning/CONTEXT.md` gains a `## Shop filtering threshold` heading documenting that filtering runs client-side against the full RSC-fetched dataset up to ~500 SKUs, after which `getFilteredProducts(filters, sort)` must be added to `product-service.ts` and called from the RSC page with `searchParams` driving the query.

**Action:**
1. Open `src/lib/constants.ts`. Append `PRICE_BANDS`, `SORT_OPTIONS` (keyed objects), `GENDER_OPTIONS` (`women`, `men`, `unisex`), `BRAND_OPTIONS` (Lattafa, Al Haramain, Victoria's Secret, Other — `id` is the lowercase kebab slug, `label` is the display name), `CATEGORY_OPTIONS` (re-export from `src/lib/categories.ts` mapped to `{id, label}`), `NOTES_FAMILY_OPTIONS` (5 families). Use `as const` for type narrowing.
2. Create `src/lib/shop/filter-schema.ts`. Define `SortKey = 'featured' | 'price-asc' | 'price-desc' | 'newest'`. Define `ShopFiltersSchema` using Zod (`z.object`, `.optional()`, `.array(z.string())` for multi-value, `.default('featured')` on sort). Export `type ShopFilters = z.infer<typeof ShopFiltersSchema>`.
3. Implement `parseShopFilters(params: URLSearchParams | ReadonlyURLSearchParams): ShopFilters`. For multi-value keys (`brand`, `family`, `price`) use `params.get(key)?.split(',').filter(Boolean) ?? []`. Run `ShopFiltersSchema.safeParse(raw)`; on failure return `ShopFiltersSchema.parse({})` (all defaults).
4. Implement `stringifyShopFilters(filters: ShopFilters): URLSearchParams`. Omit empty arrays, omit the default sort (`featured`), omit empty strings. Multi-value joined with `,`.
5. Implement `applyShopFilters(products: Product[], filters: ShopFilters): Product[]`. Chain `.filter()` calls. For price: `bandMatchesPrice(band, price)` helper computes whether the display price falls in the band's `[min, max)` half-open interval (or `>= min` if `max === null`).
6. Implement `applyShopSort(products, sort)`. Use `.slice().sort()` to avoid mutating input. Featured sort uses `tags.includes('featured')` (boolean → number for stable sort), then `in_stock`, then `created_at`.
7. Add `.planning/CONTEXT.md` entry: append the new section at the bottom of the `## Conventions` block or as a new `## Shop / catalog scale` section. One paragraph, three bullets: current strategy (client-side against `getAllProducts` payload), trigger threshold (catalog count > 500 active SKUs), migration path (add `getFilteredProducts(filters, sort)` to `product-service.ts`, switch page to dynamic rendering via `connection()` or accept `searchParams` prop).

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `node -e "const {parseShopFilters, stringifyShopFilters} = require('./src/lib/shop/filter-schema'); const u = new URLSearchParams('brand=lattafa&price=0-30,30-60&sort=price-asc'); const f = parseShopFilters(u); console.log(stringifyShopFilters(f).toString());"` → echoes the same params (order may differ; values must match)
- `grep -c "PRICE_BANDS\|SORT_OPTIONS\|GENDER_OPTIONS\|BRAND_OPTIONS\|NOTES_FAMILY_OPTIONS" src/lib/constants.ts` → `≥ 5`
- `grep -c "Shop filtering threshold\|500" .planning/CONTEXT.md` → `≥ 1`

**Context:** Read @.planning/PROJECT.md, @.planning/PRODUCT.md, @.planning/DESIGN.md, @.planning/ROADMAP.md (Phase 2.3 section), @.planning/CONTEXT.md, @src/lib/constants.ts, @src/lib/categories.ts, @src/lib/supabase/types.ts, @src/lib/supabase/product-service.ts.

---

## Task 2 — Storefront components: ProductGrid, FilterPanel, SortControl (editorial, motion-rich, no Card wrap)
**Wave:** 2
**Persona:** frontend
**Files:**
- `src/components/storefront/ProductGrid.tsx` — new; client component; props `{ products: Product[], categorySlug?: string }`; renders a numbered-editorial section header ("01 / Refine", "02 / Order by", "03 / Results · {count}") with hairline dividers, then a responsive grid of `<ProductCard>` (1 col mobile, 2 col sm, 3 col md, 4 col lg) with scroll-triggered fade-up on the first 8 cards via `IntersectionObserver`. Internally renders `<FilterPanel>` + `<SortControl>` and consumes `useSearchParams` to derive `ShopFilters`, then runs `applyShopFilters` + `applyShopSort`. Uses `useTransition` for non-blocking URL writes via `router.replace(pathname + '?' + params.toString(), { scroll: false })`. Renders `<Skeleton variant="card" />` cards (≥ 8) while `isPending` is true. Renders an editorial empty state (title "Nothing matches yet.", body "Loosen a filter, or try a different family.") when the filtered set is empty. NO `<Card>` wrapper at the section level. NO em-dashes in any copy. NO emoji.
- `src/components/storefront/FilterPanel.tsx` — new; client component; props `{ filters: ShopFilters, onChange: (next: ShopFilters) => void, hideCategoryFilter?: boolean }`. Uses inline-accordion-editorial container: section title "Refine" in `font-micro` UPPERCASE tracking-0.05em, then four collapsible disclosure rows (Family, Brand, Gender, Price) separated by `border-t border-border` hairlines, opening INLINE within the column (not a popout). Each row uses the v3 primitives: `Checkbox` (multi-select for family + brand + price), `RadioGroup` (single-select for gender). Active filter chips render below "Refine" using `<Tag>` with a close affordance; clicking a chip removes that value. "Clear filters" link on the right of the title row when any filter is active. NO `<Card>` wrapper. Open/close uses CSS `grid-template-rows: 0fr → 1fr` transition with `--duration-base --ease-out-quart` (no JS height measurement).
- `src/components/storefront/SortControl.tsx` — new; client component; props `{ value: SortKey, onChange: (next: SortKey) => void }`. Uses the `Tabs` primitive from `@/components/ui` to render an inline horizontal row of the four sort options. Label "Order by" sits to the left in `font-micro` UPPERCASE. Each tab trigger has an underline micro-shift on hover (`--duration-fast`): a 2px `bg-accent` line slides from `translate-x-[-100%]` to `translate-x-0` under the active option. NO `<Card>` wrapper.
- `src/components/storefront/__tests__/filter-schema.test.ts` — new Jest test covering `parseShopFilters`/`stringifyShopFilters` round-trip on three URL samples (empty, full, with unknown keys) and `applyShopFilters` returning the expected count on a 5-product fixture. Smoke test only, ≤ 80 LOC.

**Depends on:** Task 1

**Why:** SHOP-01..04 are visible-behavior requirements; this task owns every line of the editorial UX. The container choice is locked by DESIGN.md §10b: `<Card>` as a section wrapper is BANNED, so we commit to one editorial pattern (numbered editorial sections in `ProductGrid`, inline-accordion in `FilterPanel`, inline tab row in `SortControl`) for the whole shop route family. Motion is mandatory per §10b rule 9; this task wires three motion patterns (scroll-triggered fade-up on grid entry, image hover crossfade already on `ProductCard`, underline micro-shift on `SortControl` tabs) and a fourth (skeleton pulse from M1 `Skeleton`). The empty-state, "Refine", "Order by", and chip labels all use the locked voice samples in the phase brief; the brand voice (editorial · restrained · sensual) is non-negotiable per PRODUCT.md.

**Acceptance Criteria:**
- Applying any combination of filters in `FilterPanel` updates the URL query string via `router.replace(..., { scroll: false })`; the URL serializes to the locked shape (e.g. `?brand=lattafa,al-haramain&gender=women&price=0-30&sort=price-asc`); browser back button restores the previous filter state and the UI reflects it without a page-level loading flash.
- Changing the sort in `SortControl` updates `?sort=` immediately; the grid re-orders in place using the already-fetched dataset (no refetch); the active sort persists when other filters change (clear-filters does NOT reset sort).
- `ProductGrid` shows ≥ 4 `<Skeleton variant="card" />` placeholders during the initial RSC stream window and during `useTransition`-pending updates; visible on Chrome devtools "Slow 3G" before real cards replace them.
- Hovering or focusing any `ProductCard` in the grid triggers the existing M1 micro-interaction (opacity / translate via `--duration-fast` and `--ease-out-quart`); `prefers-reduced-motion: reduce` zeros the animation per `tokens.css`. Additionally, the first row of cards fades-up on scroll-into-view one-shot via `IntersectionObserver` (no re-trigger on scroll-back).
- The empty state renders the exact strings "Nothing matches yet." (title) and "Loosen a filter, or try a different family." (body) with a "Clear filters" link below, when the filtered set has zero results.
- `FilterPanel` renders ALL active filters as `<Tag>` chips with a close affordance; clicking a chip removes that value from the URL via `onChange` and the grid re-filters.
- Neither `ProductGrid` nor `FilterPanel` nor `SortControl` imports `Card` from `@/components/ui`. Each file uses ≥ 1 of `animate-`, `transition-`, `@keyframes`, or `IntersectionObserver` (collectively, ≥ 3 across the three files).
- Components render correctly at 375px (single-column grid, accordion sections stacked, sort tabs horizontally scrollable if width-constrained), 768px (2-col grid), 1024px (3-col grid), 1280px+ (4-col grid). All interactive targets ≥ 44px tall.
- Jest test in `filter-schema.test.ts` exits 0 via `npm test -- src/components/storefront/__tests__/filter-schema.test.ts`.

**Action:**
1. Create `src/components/storefront/ProductGrid.tsx` as a `'use client'` component. Import: `useSearchParams, usePathname, useRouter` from `next/navigation`; `useTransition, useMemo, useEffect, useRef` from `react`; `ProductCard` from `@/components/ui/ProductCard`; `Skeleton` from `@/components/ui`; `FilterPanel`, `SortControl` from `./`; `parseShopFilters, stringifyShopFilters, applyShopFilters, applyShopSort, type ShopFilters` from `@/lib/shop/filter-schema`. Derive `filters` from `useSearchParams()` via `parseShopFilters`. Memoise `visible = useMemo(() => applyShopSort(applyShopFilters(products, filters), filters.sort ?? 'featured'), [products, filters])`.
2. Write the URL update helper: `function setFilters(next: ShopFilters) { const params = stringifyShopFilters(next); startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false })); }`.
3. Render the section in a numbered editorial layout: outermost element is `<section className="border-t border-border">`; inside, three header rows each marked with a `<span className="font-micro tracking-[0.05em] uppercase text-fg-muted">01</span>` corner label. Row 1: "01 / Refine" → `<FilterPanel filters={filters} onChange={setFilters} hideCategoryFilter={!!categorySlug} />`. Row 2: "02 / Order by" → `<SortControl value={filters.sort ?? 'featured'} onChange={(s) => setFilters({...filters, sort: s})} />`. Row 3: "03 / Results · {visible.length}" → the grid.
4. Grid: `<ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">`. Inside: while `isPending` is true OR products length is 0 before hydration, render 8 `<li><Skeleton variant="card" className="aspect-[3/4]" /></li>`. Otherwise iterate `visible` and render `<li><ProductCard product={p} priority={i < 4} /></li>`.
5. Wire `IntersectionObserver` for fade-up on the first 8 grid items: ref the `<ul>`, on mount observe each `<li>` (up to 8); when `intersectionRatio > 0.1`, add an `data-visible="true"` attribute. CSS handles the actual fade-up: opacity 0 → 1 and `translate-y-4 → 0` over `--duration-base` with `--ease-out-quart`, gated by `[data-visible="true"]` selector. Disconnect observer after first trigger per element. Wrap the whole observer setup in a `prefers-reduced-motion` guard (skip observer; set everything visible immediately).
6. Empty state: when `visible.length === 0` and `!isPending`, render `<div className="border-t border-border py-16 text-center"><p className="font-display text-2xl text-fg">Nothing matches yet.</p><p className="mt-2 text-fg-muted">Loosen a filter, or try a different family.</p><button onClick={() => setFilters({sort: filters.sort})} className="mt-6 font-micro uppercase tracking-[0.05em] text-accent-deep underline-offset-4 hover:underline">Clear filters</button></div>`. Strings exact; no em-dashes; no emoji.
7. Create `src/components/storefront/FilterPanel.tsx`. Render the title row: `<div className="flex items-baseline justify-between border-b border-border pb-4"><h2 className="font-micro uppercase tracking-[0.05em]">Refine</h2>{anyActive && <button onClick={clearAll}>Clear filters</button>}</div>`. Below: active-filter chip strip using `<Tag>` for each active value with a close icon (Lucide `X`, stroke-1.5, 14px). Below: four accordion sections (Family, Brand, Gender, Price), each `<details>` element or controlled `useState(open)` pattern. Each section header is a `<button>` row showing the section label + a Lucide `Plus`/`Minus` icon. Section body uses CSS grid-rows transition: `<div className="grid transition-all duration-[var(--duration-base)] ease-[var(--ease-out-quart)]" style={{gridTemplateRows: open ? '1fr' : '0fr'}}><div className="overflow-hidden">{checkboxes}</div></div>`. Each option uses `<Checkbox>` (or `<RadioGroup>/<RadioItem>` for gender). Skip the Family/Brand/Gender section entirely if `hideCategoryFilter` is true AND the category page already constrains the row.
8. Create `src/components/storefront/SortControl.tsx`. Render: `<div className="flex items-center gap-4"><span className="font-micro uppercase tracking-[0.05em] text-fg-muted">Order by</span><Tabs value={value} onValueChange={onChange}><TabsList>{SORT_OPTIONS.map(o => <TabsTrigger key={o.id} value={o.id} className="relative font-micro uppercase tracking-[0.05em] data-[state=active]:text-fg group">{o.label}<span aria-hidden className="absolute inset-x-0 -bottom-1 h-px bg-accent transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] -translate-x-full group-hover:translate-x-0 data-[state=active]:translate-x-0" /></TabsTrigger>)}</TabsList></Tabs></div>`. The underline micro-shift IS the third motion pattern.
9. Create `src/components/storefront/__tests__/filter-schema.test.ts`. Three describe blocks: `parseShopFilters` (empty, full, unknown-keys), `stringifyShopFilters` (round-trip on the previous parses), `applyShopFilters + applyShopSort` (5-product fixture, expected count + first-item assertion).
10. Audit every customer-visible string. NO em-dashes (`—`, `–`). NO hyphens connecting clauses. NO emoji. Voice: "Refine", "Order by", "Featured", "Price low to high", "Price high to low", "Newest", "Clear filters", "Nothing matches yet.", "Loosen a filter, or try a different family.".

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -rEn ' — | – ' src/components/storefront/` → `0`
- `grep -cE '<Card[ >]' src/components/storefront/ProductGrid.tsx src/components/storefront/FilterPanel.tsx src/components/storefront/SortControl.tsx` → `0`
- `grep -cE 'animate-|transition-|@keyframes|IntersectionObserver' src/components/storefront/ProductGrid.tsx src/components/storefront/FilterPanel.tsx src/components/storefront/SortControl.tsx` aggregated total → `≥ 3`
- `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/storefront/` → empty (exit 1)
- `npm test -- src/components/storefront/__tests__/filter-schema.test.ts 2>&1 | tail -5` → "Tests: 3 passed" (or equivalent green)

**Context:** Read @.planning/PROJECT.md, @.planning/PRODUCT.md, @.planning/DESIGN.md (especially §7 motion, §10b storefront constraints), @src/components/ui/index.ts, @src/components/ui/ProductCard.tsx, @src/components/ui/Tabs.tsx, @src/components/ui/Checkbox.tsx, @src/components/ui/Radio.tsx, @src/components/ui/Tag.tsx, @src/components/ui/Skeleton.tsx, @src/lib/shop/filter-schema.ts, @src/lib/constants.ts.

**Design:**
- Register: product (with brand chrome on section labels)
- Tokens used: `var(--bg)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--accent-deep)`, `var(--border)`, `var(--space-4)`, `var(--space-6)`, `var(--space-12)`, `var(--font-micro)`, `var(--duration-fast)`, `var(--duration-base)`, `var(--ease-out-quart)`. No raw hex. No `text-gold-500` style magic strings.
- Scope: section (ProductGrid is a section wrapper for the shop route family; FilterPanel and SortControl are children of it)
- Container variant: numbered editorial (single variant for the whole shop route family). Hairline `border-t border-border` dividers between the three editorial rows. NO `<Card>` wrap on any section.
- Anti-pattern guard: builder runs `bin/slop-detect.mjs src/components/storefront/` pre-commit; commit blocked on any §10b violation (em-dash, banned font, `<Card>` section wrapper, missing motion, emoji).

---

## Task 3 — Page rewrites: /shop, /shop/[category], /shop/lattafa wired to RSC + Suspense + ISR
**Wave:** 3
**Persona:** frontend
**Files:**
- `src/app/shop/page.tsx` — rewrite: keep metadata + `getAllProducts` fetch on the RSC; set `export const revalidate = 60` (down from current 1800); render a thin `<main>` with page hero ("Shop", "The full collection. Refine by family, brand, or price.") then `<Suspense fallback={<ShopGridFallback />}><ProductGrid products={products} /></Suspense>`. Delete the old `ShopContent.tsx` consumer wiring (the new `ProductGrid` replaces it).
- `src/app/shop/ShopContent.tsx` — DELETE this file (or, if the verifier prefers keeping git history clean, gut it to a 1-line re-export of `ProductGrid` and stop importing it). Plan choice: DELETE.
- `src/app/shop/[category]/page.tsx` — rewrite: keep `generateStaticParams`, `generateMetadata`, breadcrumb JSON-LD, and `getProductsByCategory` fetch; set `export const revalidate = 60`; wrap `<Suspense fallback={<ShopGridFallback />}><ProductGrid products={products} categorySlug={categorySlug} /></Suspense>`. Drop `<CategoryContent>` consumer wiring.
- `src/app/shop/[category]/CategoryContent.tsx` — DELETE.
- `src/app/shop/lattafa/page.tsx` — rewrite: same shape as `/shop`, fetching `getProductsByCategory('lattafa-original')`; reuses the same `<ProductGrid>` and shared layout, eliminating the bespoke `LattafaContent` path; `export const revalidate = 60`; Suspense boundary present.
- `src/app/shop/lattafa/LattafaContent.tsx` — DELETE.
- `src/components/storefront/ShopGridFallback.tsx` — new; renders ≥ 8 `<Skeleton variant="card" />` cards in a `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` shell. Used as the `<Suspense fallback>` for all three pages.
- `src/app/shop/loading.tsx` — keep or rewrite to render the same `<ShopGridFallback />` so RSC stream → segment-loading boundary is visually continuous.

**Depends on:** Task 2

**Why:** Pages are the wiring layer; without this task the components from Task 2 are unreachable. The Suspense boundary is non-negotiable: `useSearchParams` inside `<ProductGrid>` will fail the production build with the "Missing Suspense boundary with useSearchParams" error unless wrapped. ISR `revalidate = 60` (down from the current 1800) matches the locked decision and gives the operator a 1-minute window between product edits and visible shop changes. Deleting `ShopContent.tsx` / `CategoryContent.tsx` / `LattafaContent.tsx` removes three orphan client components that competed with the new editorial direction; not deleting them leaves three Card-wrapped Shopify-coded layouts in the tree, which the M2 verifier will grep and reject.

**Acceptance Criteria:**
- `/shop` renders the page hero, then the numbered-editorial `<ProductGrid>` showing every active perfume from `getAllProducts` (excluding `category === 'lattafa-original'` and `product_type !== 'perfume'`, matching current behaviour); URL `?brand=lattafa&sort=price-asc` filters and sorts the grid on first paint without a client refetch.
- `/shop/women` (and any other category slug) renders the breadcrumb JSON-LD, the page hero with the category name + description, then `<ProductGrid>` filtered to that category's products; category filter is hidden inside `<FilterPanel>` since the URL path already implies the category.
- `/shop/lattafa` no longer imports `LattafaContent`; it renders the same `<ProductGrid>` as `/shop`, fed with `getProductsByCategory('lattafa-original')`, with a page hero whose body copy mentions the Lattafa range without em-dashes (e.g. "The Lattafa range. Authentic Arabian fragrances. Filter by family or price.").
- `<Suspense fallback={<ShopGridFallback />}>` wraps `<ProductGrid>` on each of the three page files; the fallback shows ≥ 8 skeleton cards visible during the RSC stream and during build-time prerender.
- `export const revalidate = 60` is present on all three page files (down from `1800`).
- `npm run build` exits 0; no "Missing Suspense boundary with useSearchParams" error in the build output.
- All three deleted files (`ShopContent.tsx`, `CategoryContent.tsx`, `LattafaContent.tsx`) are gone from disk; no remaining import resolves them; the `git status` shows them as deleted.
- A manual visit to `/shop?brand=lattafa,al-haramain&price=0-30,30-60&sort=price-asc` lands directly on the filtered + sorted grid (filters and sort state correctly hydrate from the URL); hitting back returns to the previous URL state.

**Action:**
1. Open `src/app/shop/page.tsx`. Keep the existing metadata block. Change `export const revalidate = 1800` → `export const revalidate = 60`. Inside the default export, after the products filter, replace the entire `<Suspense fallback={<div className="pt-32..." />}><ShopContent products={products} categories={categories} /></Suspense>` block with: a `<main className="pt-32 md:pt-40 lg:pt-44 pb-20 bg-bg min-h-screen">` shell containing a page hero (`<header className="border-b border-border pb-12 mb-12"><p className="font-micro uppercase tracking-[0.05em] text-fg-muted">Shop</p><h1 className="font-display text-display-2xl text-fg mt-2">The full collection</h1><p className="text-fg-muted mt-4 max-w-prose">Refine by family, brand, or price.</p></header>`), then `<Suspense fallback={<ShopGridFallback />}><ProductGrid products={products} /></Suspense>`. Import `ProductGrid`, `ShopGridFallback`, `Suspense`. Remove the `categories` import if no longer used.
2. Delete `src/app/shop/ShopContent.tsx` via `git rm` or `rm`.
3. Open `src/app/shop/[category]/page.tsx`. Keep `generateStaticParams`, `generateMetadata`, breadcrumb JSON-LD output. Change `export const revalidate = 1800` → `export const revalidate = 60`. After fetching `products`, replace the `<CategoryContent />` call with the same `<main>` + page hero + `<Suspense><ProductGrid products={products} categorySlug={categorySlug} /></Suspense>` shape. Page-hero copy: eyebrow "Shop / {category.name}", h1 = `category.name`, body = `category.description`. NO em-dashes.
4. Delete `src/app/shop/[category]/CategoryContent.tsx`.
5. Open `src/app/shop/lattafa/page.tsx`. Keep metadata. Change `revalidate` to 60. Replace the conditional `<LattafaContent />` render with the shared shell: `<main>` + page hero (eyebrow "Shop / Lattafa Originals", h1 "Lattafa Originals", body "Authentic Arabian fragrances. Filter by family or price.") + `<Suspense><ProductGrid products={products} /></Suspense>`. Preserve the empty-state branch (if `products.length === 0`) but rewrite its copy without em-dashes: title "The Lattafa collection is resting." body "Browse the full shop in the meantime." with a `<Link href="/shop">` styled as a `font-micro` uppercase underlined link. No `&larr;` glyph; use a Lucide `ArrowLeft` icon or just the link text.
6. Delete `src/app/shop/lattafa/LattafaContent.tsx`.
7. Create `src/components/storefront/ShopGridFallback.tsx`. Server-renderable component exporting a default function that returns a `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">{Array.from({length: 8}).map((_, i) => <Skeleton key={i} variant="card" className="aspect-[3/4]" />)}</div>`. No client-side JS needed.
8. Open `src/app/shop/loading.tsx`. Replace its current `LuxuryHero/Filter/ProductGridSkeleton` import-and-render block with a minimal `<main className="pt-32 md:pt-40 lg:pt-44 pb-20"><header className="border-b border-border pb-12 mb-12"><Skeleton className="h-4 w-16 mb-2" /><Skeleton className="h-12 w-2/3" /></header><ShopGridFallback /></main>` so the route-segment loading state and the Suspense fallback look identical. (Keep `LuxurySkeleton` available; do not delete it — other pages still consume it.)
9. Run `npm run build` to confirm zero "Missing Suspense" errors and that all three routes prerender. Run `npm run lint` and fix any unused-import warnings introduced by the deletions.
10. Manually open `/shop?brand=lattafa-original&sort=newest` (preview deployment or `npm run dev`) and verify the URL state hydrates into the FilterPanel + SortControl, the grid reflects the filter, and the back button restores the prior URL.

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -c "export const revalidate = 60" src/app/shop/page.tsx src/app/shop/\[category\]/page.tsx src/app/shop/lattafa/page.tsx` → `3` (one per file)
- `grep -c "Suspense" src/app/shop/page.tsx src/app/shop/\[category\]/page.tsx src/app/shop/lattafa/page.tsx` aggregated → `≥ 3`
- `grep -c "ProductGrid" src/app/shop/page.tsx src/app/shop/\[category\]/page.tsx src/app/shop/lattafa/page.tsx` aggregated → `≥ 3`
- `test ! -f src/app/shop/ShopContent.tsx && test ! -f src/app/shop/\[category\]/CategoryContent.tsx && test ! -f src/app/shop/lattafa/LattafaContent.tsx && echo DELETED` → `DELETED`
- `grep -rEn ' — | – ' src/app/shop/` → `0`
- `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/app/shop/` → empty (exit 1)
- `npm run build 2>&1 | grep -c "Missing Suspense boundary"` → `0`

**Context:** Read @.planning/PROJECT.md, @.planning/PRODUCT.md, @.planning/DESIGN.md (§10b storefront constraints, §4 spacing), @src/app/shop/page.tsx, @src/app/shop/[category]/page.tsx, @src/app/shop/lattafa/page.tsx, @src/app/shop/loading.tsx, @src/components/storefront/ProductGrid.tsx (Task 2 output), @src/components/storefront/FilterPanel.tsx (Task 2 output), @src/components/storefront/SortControl.tsx (Task 2 output), @src/lib/supabase/product-service.ts, @src/lib/categories.ts.

**Design:**
- Register: product (page-level shop chrome)
- Tokens used: `var(--bg)`, `var(--fg)`, `var(--fg-muted)`, `var(--border)`, `var(--space-12)`, `var(--font-display-2xl)`, `var(--font-micro)`, `--container-wide` (72rem max-width). Page padding via `--page-px` / `--page-py`.
- Scope: page (the three shop routes share the same chrome and ProductGrid container)
- Container variant: numbered editorial (matches Task 2). Hairline `border-b border-border` under the page hero; the ProductGrid then continues the numbered editorial rhythm.
- Anti-pattern guard: builder runs `bin/slop-detect.mjs src/app/shop/` pre-commit; commit blocked on any §10b violation.

---

## Success Criteria
- [ ] SHOP-01 — Applying any combination of family / brand / gender / price filters in `FilterPanel` serializes to the URL via `router.replace(..., { scroll: false })`; back button restores prior state; deep-linking to a filtered URL hydrates the UI on first paint.
- [ ] SHOP-02 — Sort control offers exactly four options ("Featured" default, "Price low to high", "Price high to low", "Newest"); changing sort re-orders the grid in place without refetch; sort persists across filter changes; "Clear filters" does NOT reset sort.
- [ ] SHOP-03 — Each of `/shop`, `/shop/[category]`, `/shop/lattafa` renders with `revalidate = 60` ISR; `<Suspense fallback={<ShopGridFallback />}>` wraps the client filter island; ≥ 8 skeleton cards visible during the RSC stream on Slow 3G; `npm run build` exits 0 with no Suspense boundary errors.
- [ ] SHOP-04 — Every `ProductCard` in the grid honours the M1 hover/focus micro-interaction (opacity + translate via `--duration-fast` / `--ease-out-quart`); `prefers-reduced-motion: reduce` zeros it; the first row of cards fades-up on scroll-into-view one-shot via `IntersectionObserver`; the `SortControl` tab underline micro-shifts on hover.
- [ ] DESIGN.md §10b compliance — Zero `<Card>` section wrappers in `ProductGrid.tsx` / `FilterPanel.tsx` / `SortControl.tsx`; zero em-dashes (`—` / `–`) in customer-visible strings under `src/app/shop/` and `src/components/storefront/`; zero emoji; ≥ 3 motion patterns wired across the three new components; one container variant (numbered editorial) used consistently across the three shop routes.
- [ ] `.planning/CONTEXT.md` documents the 500-SKU threshold where client-side filtering must migrate to server-side `getFilteredProducts(filters, sort)`.

---

## Verification Contract

### Contract for Task 1 — Filter schema and constants exist
**Check type:** file-exists
**Command:** `test -f src/lib/shop/filter-schema.ts && test -f src/lib/constants.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Either file missing.

### Contract for Task 1 — Constants exported
**Check type:** grep-match
**Command:** `grep -cE "PRICE_BANDS|SORT_OPTIONS|GENDER_OPTIONS|BRAND_OPTIONS|NOTES_FAMILY_OPTIONS" src/lib/constants.ts`
**Expected:** `≥ 5`
**Fail if:** Returns < 5 — one or more required constants missing from constants.ts.

### Contract for Task 1 — Filter schema exports the required surface
**Check type:** grep-match
**Command:** `grep -cE "ShopFiltersSchema|parseShopFilters|stringifyShopFilters|applyShopFilters|applyShopSort" src/lib/shop/filter-schema.ts`
**Expected:** `≥ 5`
**Fail if:** Returns < 5 — schema, parse, stringify, filter, or sort helper missing.

### Contract for Task 1 — Threshold note in CONTEXT.md
**Check type:** grep-match
**Command:** `grep -cE "500.*SKU|Shop filtering threshold|getFilteredProducts" .planning/CONTEXT.md`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — threshold not documented.

### Contract for Task 1 — TypeScript clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript error.

### Contract for Task 2 — Storefront components exist
**Check type:** file-exists
**Command:** `test -f src/components/storefront/ProductGrid.tsx && test -f src/components/storefront/FilterPanel.tsx && test -f src/components/storefront/SortControl.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Any of the three files missing.

### Contract for Task 2 — No Card wrapper in any of the three components
**Check type:** grep-match (inverted)
**Command:** `grep -cE "<Card[ >]" src/components/storefront/ProductGrid.tsx src/components/storefront/FilterPanel.tsx src/components/storefront/SortControl.tsx`
**Expected:** `0`
**Fail if:** Returns ≥ 1 — `<Card>` used as a section wrapper in violation of DESIGN.md §10b.

### Contract for Task 2 — Motion wired in ≥ 3 patterns across the three components
**Check type:** grep-match
**Command:** `grep -cE "animate-|transition-|@keyframes|IntersectionObserver" src/components/storefront/ProductGrid.tsx src/components/storefront/FilterPanel.tsx src/components/storefront/SortControl.tsx`
**Expected:** `≥ 3`
**Fail if:** Returns < 3 — motion patterns insufficient per DESIGN.md §10b rule 9.

### Contract for Task 2 — Filter schema imported and applied in ProductGrid
**Check type:** grep-match
**Command:** `grep -cE "parseShopFilters|applyShopFilters|applyShopSort" src/components/storefront/ProductGrid.tsx`
**Expected:** `≥ 3`
**Fail if:** Returns < 3 — ProductGrid is not wired to the Task 1 schema.

### Contract for Task 2 — useSearchParams + router.replace wired
**Check type:** grep-match
**Command:** `grep -cE "useSearchParams|router\.replace" src/components/storefront/ProductGrid.tsx`
**Expected:** `≥ 2`
**Fail if:** URL-state wiring missing.

### Contract for Task 2 — Tabs primitive consumed by SortControl
**Check type:** grep-match
**Command:** `grep -cE "from ['\"]@/components/ui['\"]|Tabs|TabsList|TabsTrigger" src/components/storefront/SortControl.tsx`
**Expected:** `≥ 2`
**Fail if:** SortControl does not consume the M1 Tabs primitive.

### Contract for Task 2 — No em-dashes in storefront components
**Check type:** grep-match (inverted)
**Command:** `grep -rEn ' — | – ' src/components/storefront/`
**Expected:** No matches (grep exits 1)
**Fail if:** Any match — copy contains em-dash punctuation in violation of DESIGN.md §10b.

### Contract for Task 2 — No emoji in storefront components
**Check type:** grep-match (inverted)
**Command:** `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/components/storefront/`
**Expected:** No matches (grep exits 1)
**Fail if:** Any emoji byte present.

### Contract for Task 2 — Filter-schema test passes
**Check type:** command-exit
**Command:** `npm test -- src/components/storefront/__tests__/filter-schema.test.ts 2>&1 | tail -3`
**Expected:** Output contains `passed` (zero failures)
**Fail if:** Jest reports any failed assertion.

### Contract for Task 3 — Suspense boundary on each shop route
**Check type:** grep-match
**Command:** `grep -c "Suspense" src/app/shop/page.tsx src/app/shop/\[category\]/page.tsx src/app/shop/lattafa/page.tsx`
**Expected:** Each file ≥ 1 (aggregate ≥ 3)
**Fail if:** Any file returns 0 — `useSearchParams` in `<ProductGrid>` will brick the production build.

### Contract for Task 3 — ISR revalidate = 60 on each shop route
**Check type:** grep-match
**Command:** `grep -c "export const revalidate = 60" src/app/shop/page.tsx src/app/shop/\[category\]/page.tsx src/app/shop/lattafa/page.tsx`
**Expected:** Each file = 1 (aggregate = 3)
**Fail if:** Any file is missing the locked `revalidate = 60`.

### Contract for Task 3 — ProductGrid imported in each shop route
**Check type:** grep-match
**Command:** `grep -c "ProductGrid" src/app/shop/page.tsx src/app/shop/\[category\]/page.tsx src/app/shop/lattafa/page.tsx`
**Expected:** Each file ≥ 1 (aggregate ≥ 3)
**Fail if:** Any file does not consume the new `ProductGrid` — wiring missing.

### Contract for Task 3 — Old consumer components deleted
**Check type:** file-exists (inverted)
**Command:** `test ! -f src/app/shop/ShopContent.tsx && test ! -f src/app/shop/\[category\]/CategoryContent.tsx && test ! -f src/app/shop/lattafa/LattafaContent.tsx && echo DELETED`
**Expected:** `DELETED`
**Fail if:** Any of the three files still exists — orphan Card-wrapped layouts left in the tree.

### Contract for Task 3 — ShopGridFallback exists and used as Suspense fallback
**Check type:** grep-match
**Command:** `test -f src/components/storefront/ShopGridFallback.tsx && grep -c "ShopGridFallback" src/app/shop/page.tsx src/app/shop/\[category\]/page.tsx src/app/shop/lattafa/page.tsx`
**Expected:** Aggregate ≥ 3
**Fail if:** Fallback file missing OR not referenced by every shop route.

### Contract for Task 3 — No em-dashes in shop routes
**Check type:** grep-match (inverted)
**Command:** `grep -rEn ' — | – ' src/app/shop/`
**Expected:** No matches (grep exits 1)
**Fail if:** Any match — page-level copy in violation of DESIGN.md §10b.

### Contract for Task 3 — No emoji in shop routes
**Check type:** grep-match (inverted)
**Command:** `grep -rP '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/app/shop/`
**Expected:** No matches (grep exits 1)
**Fail if:** Any emoji byte present.

### Contract for Task 3 — Production build succeeds with no Suspense boundary errors
**Check type:** command-exit
**Command:** `npm run build 2>&1 | grep -cE "Missing Suspense boundary|error TS"`
**Expected:** `0`
**Fail if:** Build reports a missing Suspense boundary or any TypeScript error.

### Contract — Behavioural: deep-linked filtered URL hydrates correctly
**Check type:** behavioral
**Command:** (manual verification) Run `npm run dev`, open `/shop?brand=lattafa-original&sort=price-asc`. Confirm: (a) the `FilterPanel` shows "Lattafa" as an active chip on first paint, (b) the `SortControl` shows "Price low to high" as the active tab, (c) the grid is ordered ascending by display price, (d) hitting back to a prior filter state restores the UI without a full page reload.
**Expected:** All four observations true.
**Fail if:** Any of (a)–(d) is false — URL state is not the source of truth.

---

*Plan written 2026-05-14 by qualia-planner. Honours DESIGN.md §10b storefront constraints, PRODUCT.md voice rules, and the locked decisions in `<phase_details>`.*
