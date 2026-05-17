---
phase: 2
goal: "Replace every placeholder content surface with production editorial copy and ship the complete per-page SEO layer (metadata, JSON-LD, sitemap, robots, canonicals) so the site is indexable and shareable at handoff."
tasks: 4
waves: 2
---

# Phase 2: Content + SEO

**Goal:** Every public route emits its own metadata + canonical, the homepage / PDP / blog post each carry distinct OG tags and JSON-LD, the sitemap covers ~110+ URLs, robots is explicit, every customer-visible image has descriptive alt text, the 7 static pages read in brand voice (no em-dashes, no emoji, no parchment placeholders), and ≥3 published journal posts exist in Supabase.

**Why this phase:** Handoff is one phase away. A perfume site that doesn't index, doesn't share well on Instagram, or shows lorem-ipsum on `/about` is not a deliverable. This phase closes the gap between "works" and "ready to be linked".

**Existing state (verified on disk 2026-05-17):**
- `src/app/layout.tsx:36` already sets `metadataBase: new URL('https://aquadorcy.com')`.
- `src/app/page.tsx` emits Organization + WebSite + Store JSON-LD (lines 47-140) — needs to MOVE to `layout.tsx` per spec (so it emits on every route).
- `src/app/products/[slug]/page.tsx` already has `generateMetadata()` + `Product` JSON-LD (lines 76, 140-200).
- `src/app/blog/[slug]/page.tsx` already has `generateMetadata()` + `Article` JSON-LD (lines 12, 67-).
- `src/app/sitemap.ts` exists, uses `createPublicClient`, queries products + published blog posts.
- `src/app/robots.ts` (App Router file, NOT public/robots.txt) exists with `allow: '/'`, `disallow: ['/api/', '/admin/']`, sitemap pointer.
- 6 routes missing `metadata`: `/about`, `/contact`, `/privacy`, `/shipping`, `/terms`, `/create-perfume`. `/shop` + `/shop/[category]` + `/blog` + `/` already have it.
- `/faq` route does NOT exist — must be created.
- `grep alt=""` returns 2 hits (`CTASection.tsx:56`, `MaintenanceClient.tsx:79`) — both decorative backgrounds; audit needed to confirm `aria-hidden` shape or rewrite with descriptive alt.

---

## Task 1 — Metadata helper + per-route metadata exports (SEO-01, SEO-03 canonicals)
**Wave:** 1
**Persona:** frontend
**Files:**
- CREATE `src/lib/seo/metadata.ts` — exports `buildPageMetadata({ title, description, path, ogImage? })` that returns a Next `Metadata` object with `title`, `description`, `alternates.canonical: path`, `openGraph: { title, description, url: path, images: [ogImage ?? '/og/default.jpg'], type: 'website', siteName: 'Aquad\'or', locale: 'en_CY' }`, `twitter: { card: 'summary_large_image', title, description, images }`. Relies on `metadataBase` already set in `layout.tsx`. Title length asserted ≤ 65 chars at runtime (throws in dev).
- CREATE `public/og/default.jpg` — 1200×630 brand OG fallback image (bone background, Aquad'or wordmark, hairline rule, no copy). Generate or commission; if no asset is supplied, the task generates a flat OKLCH `--color-bone` + black wordmark placeholder via the `sharp` CLI already in deps. Path used by every page that doesn't ship a route-specific image.
- EDIT `src/app/about/page.tsx` — add `export const metadata = buildPageMetadata({ title: 'About — Aquad\'or', description: '…155 chars editorial brand statement…', path: '/about' })`.
- EDIT `src/app/contact/page.tsx` — same pattern, path `/contact`.
- EDIT `src/app/privacy/page.tsx` — same, path `/privacy`.
- EDIT `src/app/shipping/page.tsx` — same, path `/shipping`.
- EDIT `src/app/terms/page.tsx` — same, path `/terms`.
- EDIT `src/app/create-perfume/page.tsx` — same, path `/create-perfume`. Description leans into the three-layer builder.
- EDIT `src/app/page.tsx` — refresh the existing `metadata` export to use `buildPageMetadata({ ..., path: '/' })` so the homepage carries a self-canonical and a distinct OG image (route-specific `/og/home.jpg`, generated same way as default).
- EDIT `src/app/shop/page.tsx` — refresh existing `metadata` via helper, path `/shop`, OG `/og/shop.jpg`.
- EDIT `src/app/shop/[category]/page.tsx` — refresh existing `generateMetadata` to compose via helper, path `/shop/${category}`, dynamic title from category label.
- EDIT `src/app/blog/page.tsx` — refresh via helper, path `/blog`.
- EDIT `src/app/products/[slug]/page.tsx` — refresh `generateMetadata` (line 76) to compose via helper so canonical = `/products/${slug}` and OG image = `product.main_image_url || '/og/default.jpg'`. Preserve the existing title/description shape; just route the object through the helper for consistency.
- EDIT `src/app/blog/[slug]/page.tsx` — refresh `generateMetadata` (line 12) to compose via helper, canonical = `/blog/${slug}`, OG image = `post.featured_image || '/og/default.jpg'`.

**Depends on:** none

**Why:** Without per-page metadata Google indexes one title for every URL, social shares all render the homepage card, and the canonical layer doesn't exist — `metadataBase` alone isn't enough. A single helper guarantees voice + structure consistency across 13 routes and keeps title-length / canonical mistakes from drifting in.

**Acceptance Criteria:**
- Every one of the 13 public routes (`/`, `/shop`, `/shop/[category]`, `/products/[slug]`, `/blog`, `/blog/[slug]`, `/create-perfume`, `/about`, `/contact`, `/privacy`, `/shipping`, `/terms`, `/faq` — note `/faq` lands in T4) emits a distinct `<title>`, a `<meta name="description">` between 120-165 chars, a `<link rel="canonical" href="https://aquadorcy.com{path}">`, an `og:title`, `og:description`, `og:image`, and `twitter:card="summary_large_image"`.
- View-source on `/` vs `/about` vs any `/products/[slug]` vs any `/blog/[slug]` shows 4 distinct `<title>` strings and 4 distinct `og:image` URLs (PDP + blog use the product / post hero).
- Every title is ≤ 65 chars; the helper throws in dev if violated.
- Voice obeys DESIGN.md §10b: no em-dashes, no emoji, no exclamation marks in any title or description string introduced by this task.

**Action:**
1. Write `src/lib/seo/metadata.ts` with the `buildPageMetadata` function described above. Length-check the title; default OG image is `/og/default.jpg`; default locale `en_CY`.
2. Generate `public/og/default.jpg`, `public/og/home.jpg`, `public/og/shop.jpg`. Use the `sharp` CLI (already in deps) to render a 1200×630 OKLCH-bone canvas with the Aquad'or wordmark centered (see `public/aquador-logo.svg` if present, otherwise type-set "Aquad'or" in Cormorant Garamond 96px black). One image per route is enough; PDP + blog use their content image at runtime.
3. For each of the 6 routes missing `metadata` (about / contact / privacy / shipping / terms / create-perfume), import `buildPageMetadata` and add a top-of-file `export const metadata = buildPageMetadata({...})`. Copy each description in brand voice (editorial, restrained, sensual; no em-dashes, no emoji).
4. For `/`, `/shop`, `/shop/[category]`, `/blog`, refactor the existing `metadata` / `generateMetadata` to compose via the helper. Preserve their current titles where they already obey the rules; only rewrite copy that uses em-dashes or exclamation.
5. For `/products/[slug]` and `/blog/[slug]`, wrap the existing dynamic-metadata logic through the helper so canonical + OG image always populate.

**Validation:** (builder self-check)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `grep -rn "export const metadata\|export async function generateMetadata" src/app/ | wc -l` → ≥ `12` (13 routes minus the layout default; faq lands in T4)
- `grep -rEn ' — | – ' src/app/{about,contact,privacy,shipping,terms,create-perfume}/page.tsx src/lib/seo/metadata.ts` → 0 matches
- `npm run build` completes without metadata-related warnings

**Context:** Read @.planning/PRODUCT.md (§Brand voice), @.planning/DESIGN.md (§10b copy rules), @src/app/layout.tsx (existing `metadataBase`), @src/app/page.tsx (existing JSON-LD pattern to mirror), @src/app/products/[slug]/page.tsx (existing generateMetadata shape), @src/app/blog/[slug]/page.tsx (existing generateMetadata shape).

**Design:**
- Register: brand (OG cards) + product (metadata is functional)
- Tokens used: OG fallback images render in `--color-bone` background, `--color-ink` wordmark, no other color
- Scope: app-wide
- Anti-pattern guard: builder greps for em-dashes / emoji in every string this task introduces before commit; commit blocked if grep returns non-zero

---

## Task 2 — Move Org + WebSite JSON-LD to root layout (SEO-02)
**Wave:** 2
**Persona:** frontend
**Files:**
- EDIT `src/app/layout.tsx` — add the two `<script type="application/ld+json">` blocks for `Organization` and `WebSite` so they emit on every route (currently they live only on `src/app/page.tsx` lines 47-90, which means a Googlebot landing on `/products/[slug]` first never sees them). Use the existing `safeStringify`-style escape (`.replace(/</g, '\\u003c')`). Place inside `<head>` via Next App Router `<head>` integration (return `<script>` from a server component imported into `layout.tsx`, OR use the metadata `other` field — but inline script is cleaner here).
- EDIT `src/app/page.tsx` — REMOVE the Organization + WebSite blocks now living at lines 47-90 to avoid duplicate emission. KEEP the `Store` / `LocalBusiness` block (line 90+) on the homepage only — it's a homepage-scoped business schema, correct to keep there.
- CREATE `src/lib/seo/jsonld.ts` — exports `organizationJsonLd()` and `websiteJsonLd()` returning the JSON objects (no `<script>` wrapper) so both `layout.tsx` and any test can import them. Eliminates inline-object duplication.

**Depends on:** Task 1 (T1 edits `src/app/page.tsx` for metadata; T2 also edits `src/app/page.tsx` to remove JSON-LD blocks — serialize to avoid merge conflicts on the same file).

**Why:** SEO-02 requires Organization + WebSite schema on the root layout so every page (including PDPs and blog posts shared on social) carries them. Today they only render on `/`. Moving them up makes the schema discoverable from any landing URL and lets PDP / blog `Product` / `Article` schemas compose with the org context Google expects.

**Acceptance Criteria:**
- `curl -s https://aquadorcy.com/products/<any-slug>` returns HTML containing `"@type":"Organization"` AND `"@type":"WebSite"` AND `"@type":"Product"` (three distinct ld+json blocks).
- `curl -s https://aquadorcy.com/blog/<any-slug>` returns HTML containing `"@type":"Organization"` AND `"@type":"WebSite"` AND `"@type":"Article"`.
- `curl -s https://aquadorcy.com/` does NOT contain duplicate Organization blocks (single emission only; no doubled JSON-LD).
- Google's Rich Results test on `/` + one PDP + one blog post reports no schema errors.

**Action:**
1. Write `src/lib/seo/jsonld.ts` exporting `organizationJsonLd()` and `websiteJsonLd()`. Copy the existing object shapes verbatim from `src/app/page.tsx:47-90` so the data stays identical (name, url, logo, sameAs links, search action on WebSite).
2. In `src/app/layout.tsx`, inside the `<html><body>` tree (or `<head>` via Next 14 App Router pattern — Next docs allow `<script>` in layout body), render two `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()).replace(/</g, '\\u003c') }} />` blocks. Mirror the escape pattern from `src/app/page.tsx:198`.
3. In `src/app/page.tsx`, delete the Organization (lines ~47-74) and WebSite (lines ~75-89) JSON-LD blocks and their accompanying `<script>` tags. Keep the `Store` / `LocalBusiness` block (homepage-scoped).
4. Verify `npm run dev` renders the layout-level scripts on `/about`, `/products/[slug]`, `/blog/[slug]`.

**Validation:**
- `curl -s http://localhost:3000/ | grep -o '"@type":"Organization"' | wc -l` → exactly `1` (was previously 1 on homepage; now still 1 but emitted from layout, not page)
- `curl -s http://localhost:3000/about | grep -c '"@type":"Organization"'` → `1`
- `curl -s http://localhost:3000/about | grep -c '"@type":"WebSite"'` → `1`
- `grep -c "organizationJsonLd\|websiteJsonLd" src/app/layout.tsx` → ≥ `2` (wiring check — helper is imported and used)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @src/app/page.tsx (lines 43-141 — existing JSON-LD shape; copy verbatim into helper), @src/app/layout.tsx (current shape; figure out where the scripts go), @src/app/products/[slug]/page.tsx:140-200 (Product JSON-LD pattern, keep as-is), @src/app/blog/[slug]/page.tsx:67- (Article JSON-LD pattern, keep as-is).

**Design:**
- Register: product (functional SEO emission, no visual surface)
- Tokens used: none (head-injected scripts)
- Scope: app-wide
- Anti-pattern guard: not applicable (no rendered UI). Builder confirms `npx tsc --noEmit` clean.

---

## Task 3 — Sitemap audit, robots, alt-text sweep (SEO-03 + SEO-04)
**Wave:** 1
**Persona:** frontend
**Files:**
- EDIT `src/app/sitemap.ts` — add the missing routes (`/faq` once T4 ships, plus `/blog` is already included; confirm `/reorder` should remain or be gated behind auth; ensure `lastModified` on dynamic entries pulls real `updated_at` from product / post rows so Google sees freshness signals). No structural rewrite — the existing implementation is sound; this is an audit + small additions.
- EDIT `src/app/robots.ts` — confirm `allow: '/'`, `disallow: ['/api/', '/admin/']`, `sitemap: 'https://aquadorcy.com/sitemap.xml'`. If any item is missing or the file has drifted, restore. Add `/checkout/` to disallow if not already (checkout shouldn't be indexed mid-funnel).
- EDIT `src/components/home/CTASection.tsx:56` — the `alt=""` on the background image: either rewrite as `alt="Hand-poured perfume bottle on a bone surface, soft side light"` (descriptive) OR add `role="presentation"` / `aria-hidden="true"` if it's purely decorative and the surrounding context already conveys meaning. Audit: if the image carries any informational weight (it's a hero, it's the only visual in the CTA), use the descriptive alt.
- EDIT `src/app/maintenance/MaintenanceClient.tsx:79` — same treatment. Maintenance page is rarely shown but should still pass axe.
- AUDIT (read-only grep) every `<Image>` / `<img>` in `src/components/storefront/`, `src/components/home/`, `src/app/products/[slug]/`, `src/components/blog/` — for any whose `alt` prop is a hardcoded string review whether it describes the image specifically (product name + context, not "image" or "photo"). Patch any that are generic. Builder commits one diff with all fixes.

**Depends on:** none (the sitemap addition for `/faq` is a one-line follow-up — for this phase, leave a TODO comment in `sitemap.ts` referencing T4 OR add the static route now; either way the file is independent of T1/T2).

**Why:** SEO-03 requires the sitemap to cover all public products + posts (today: ✓), robots to be explicit (today: ✓ via App Router `robots.ts`), and canonicals everywhere (today: missing — landed in T1). SEO-04 requires zero empty alt props on customer-facing surfaces; today there are 2. Both are mechanical compliance items; without them, the site fails Lighthouse SEO + axe-core in the next phase.

**Acceptance Criteria:**
- `curl -s https://aquadorcy.com/sitemap.xml | grep -c "<loc>"` ≥ `110` (currently: 14 static + ~100 products + ≥ 3 posts after T4 = 117+; verify count locally with `curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"`).
- `curl -s https://aquadorcy.com/robots.txt` contains `Disallow: /admin/` AND `Sitemap: https://aquadorcy.com/sitemap.xml`.
- `grep -rn 'alt=""' src/components/ src/app/ | grep -v "test\|spec\|stories"` → `0` matches.
- All `<Image>` alt strings on the homepage, shop, and PDP describe the actual product or scene (spot-check 5 of them manually).

**Action:**
1. Open `src/app/sitemap.ts`; verify the `staticRoutes` array includes `/faq` (add it with priority 0.5 / monthly — the route lands in T4). Verify product + post entries use real `updated_at` (today the product entry uses `new Date()` for `lastModified` — patch to use the row's `updated_at` if available; query `id, slug, updated_at` instead of just `slug`).
2. Open `src/app/robots.ts`; confirm shape matches the curl criterion above. Add `/checkout/` to disallow.
3. Fix `src/components/home/CTASection.tsx:56` with a descriptive alt OR `aria-hidden="true"` + `alt=""` (Next `<Image>` requires `alt` prop; combine with `role="presentation"`). Pick descriptive — it's the CTA hero, it has weight.
4. Fix `src/app/maintenance/MaintenanceClient.tsx:79` same way.
5. Run `grep -rn 'alt=""' src/components/ src/app/` to confirm zero matches.
6. Run `grep -rEn '(alt="image"|alt="photo"|alt="picture")' src/components/ src/app/` and patch any hits with descriptive alts.

**Validation:**
- `grep -rn 'alt=""' src/components/ src/app/ 2>/dev/null | grep -vE 'test|spec|stories|node_modules' | wc -l` → `0`
- `curl -s http://localhost:3000/robots.txt | grep -c "Disallow: /admin"` → ≥ `1`
- `curl -s http://localhost:3000/robots.txt | grep -c "Sitemap:"` → `1`
- `curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"` → ≥ `110`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @src/app/sitemap.ts (existing implementation; minimal edits), @src/app/robots.ts (existing implementation; verify), @src/components/home/CTASection.tsx (line 56 — empty alt), @src/app/maintenance/MaintenanceClient.tsx (line 79 — empty alt), @.planning/DESIGN.md (§10b — no em-dashes / no emoji in alt strings either).

**Design:**
- Register: product (no visual change; alt text is editorial)
- Tokens used: none
- Scope: app-wide audit
- Anti-pattern guard: alt strings are customer-visible to screen readers; voice obeys DESIGN.md §10b (no em-dashes, no emoji). Builder greps for those characters in any alt strings introduced.

---

## Task 4 — Static page rewrites + `/faq` route + 3 published journal posts (success #4 + #5)
**Wave:** 2
**Persona:** frontend
**Files:**
- EDIT `src/app/about/page.tsx` — replace any v2.0 legacy `Section` primitive / gold-on-black surfaces / lorem ipsum with editorial body copy in brand voice. ~400-600 words covering: who Aquad'or is, the Levant placement, the curation logic (women / men / niche / Lattafa / Al-Haramain / VS originals), the custom-perfume offer. Use the hairline-stack or magazine-spread section patterns from DESIGN.md §10b. No `<Card>` as section container. No parchment placeholder images — use real product photography from Supabase or commission.
- EDIT `src/app/contact/page.tsx` — keep the existing contact form wiring; rewrite the surrounding copy editorially. Address: Nicosia + Limassol if applicable; phone, email, business hours. ~150 words intro + form.
- EDIT `src/app/privacy/page.tsx` — rewrite with real privacy policy content (GDPR-aligned for Cyprus / EU): data controller, what's collected (orders, email, Stripe), legal basis, retention, rights, contact for requests. ~800 words. Voice editorial-restrained even in legal copy — short sentences, no legalese theater.
- EDIT `src/app/shipping/page.tsx` — rewrite: Cyprus delivery in 2-3 working days, EU delivery in 5-7, free shipping policy, returns window (14 days unopened), exchange terms. ~400 words.
- EDIT `src/app/terms/page.tsx` — rewrite real Terms of Service: order acceptance, pricing, payment, intellectual property, governing law (Cyprus), liability cap. ~600 words.
- CREATE `src/app/faq/page.tsx` — new route. 8-12 Q&A pairs covering: shipping, returns, custom perfume turnaround, ingredient sourcing, authenticity (Lattafa / Al-Haramain originals), gifting, payment methods, wholesale. Use the Inline-accordion-editorial pattern from DESIGN.md §10b (collapsible expansion inline within the type column). Each answer ~50-80 words.
- EDIT `src/app/create-perfume/page.tsx` — audit for any lorem ipsum, placeholder copy, parchment placeholders. Rewrite the pitch / explainer text editorially. Keep the builder UI intact.
- CREATE `supabase/migrations/20260517000000_seed_journal_posts.sql` — INSERT 3 rows into `blog_posts` with `status='published'`, distinct `slug`, `title`, `excerpt`, `body` (~400 words each in MDX / markdown depending on what `blog_posts.body` column expects), `featured_image` (real URL — use existing Supabase Storage or stable Unsplash URL), `published_at = now()`. Topics:
  1. "How to read a fragrance pyramid" — top / heart / base, illustrated with a real product (e.g. Lattafa Yara).
  2. "Why we curated Lattafa originals" — the Levant brand placement, ingredient density per euro, who it suits.
  3. "Layering perfume: three notes that work in Cyprus heat" — practical guidance tied to the climate.

**Depends on:** Task 1 (T1 establishes the metadata helper; T4's new `/faq/page.tsx` calls `buildPageMetadata({ ..., path: '/faq' })`). T4 also adds `/faq` to the sitemap if T3 left a TODO — coordinate via the sitemap edit in T3.

**Why:** Success criteria #4 and #5 are hard gates: lorem ipsum on `/about` or fewer than 3 published posts means phase fails. The static pages are the lowest-traffic but highest-trust surfaces — they're what a buyer reads before deciding whether the brand is legitimate. Three published posts also seed the `/blog` index so it doesn't render empty for first-time visitors.

**Acceptance Criteria:**
- `curl -s https://aquadorcy.com/about | grep -ciE "lorem|ipsum|placeholder|TODO"` → `0`. Same for `/contact`, `/privacy`, `/shipping`, `/terms`, `/faq`, `/create-perfume`.
- `/faq` route renders with 8+ Q&A pairs, each using the inline-accordion pattern. Page passes the design rubric (no `<Card>` as section, no em-dashes, no emoji).
- `curl -s https://aquadorcy.com/blog` lists ≥ 3 published posts, each with a unique title + featured image + excerpt.
- Each of the 3 posts loads at its slug (`/blog/[slug]`), shows the Article JSON-LD from T2, and renders the body content.
- All 7 rewritten/new pages pass `grep -rEn ' — | – '` returning 0 matches in their JSX strings.
- All 7 pages use approved section patterns from DESIGN.md §10b (hairline-stack, magazine-spread, numbered-editorial, type-led). No `<Card>` wraps a top-level section.

**Action:**
1. For each of the 5 existing static pages (about, contact, privacy, shipping, terms): read current file, identify legacy `Section`/`Card` containers and any v2.0 gold-on-dark surfaces. Replace with hairline-stack JSX shape: `<section className="border-t border-border py-16 md:py-24">…</section>` per DESIGN.md §10b. Drop parchment placeholder imagery; if no real image exists yet, ship type-led layouts (no image).
2. Write copy for each page in brand voice (editorial, restrained, sensual; see PRODUCT.md §Brand voice for the register). Read PRODUCT.md §Brand voice before drafting. No em-dashes, no emoji, no exclamation marks. Sentences short. Lowercase trending acceptable.
3. Create `src/app/faq/page.tsx` from scratch. Use the inline-accordion-editorial pattern: a `<details>` element per Q&A (native, accessible, no JS), styled with the design tokens. Add `export const metadata = buildPageMetadata({ title: 'Questions', description: '…', path: '/faq' })`. Add `/faq` to `src/app/sitemap.ts` `staticRoutes` (or coordinate with T3 if T3 left a TODO).
4. Audit `src/app/create-perfume/page.tsx` for placeholder copy / images; rewrite as needed in voice.
5. Write the seed migration `supabase/migrations/20260517000000_seed_journal_posts.sql`. Each INSERT carries: `id` (uuid_generate_v4 or gen_random_uuid), `slug`, `title`, `excerpt` (~140 chars), `body` (markdown, ~400 words), `featured_image` (URL), `status: 'published'`, `published_at: now()`, `category`, `author` if columns exist (check `src/lib/supabase/types.ts` for `blog_posts` schema before writing INSERT statements). Wrap in `INSERT … ON CONFLICT (slug) DO NOTHING` so re-running is safe.
6. Apply the migration locally: `npx supabase db push` (or `npx supabase migration up`). Verify the posts appear at `/blog`.
7. Final design check: builder runs `grep -rEn ' — | – ' src/app/{about,contact,privacy,shipping,terms,faq,create-perfume}/page.tsx` → 0. Builder runs `grep -rEn '<Card[ >]' src/app/{about,contact,privacy,shipping,terms,faq,create-perfume}/page.tsx` → 0 (allowed 0 here; Card is reserved for interior tiles only on these pages).

**Validation:**
- `grep -rEn 'lorem|ipsum|placeholder|TODO|Lorem|Ipsum' src/app/{about,contact,privacy,shipping,terms,faq,create-perfume}/page.tsx` → `0`
- `grep -rEn ' — | – ' src/app/{about,contact,privacy,shipping,terms,faq,create-perfume}/page.tsx` → `0`
- `grep -rEn '<Card[ >]' src/app/{about,contact,privacy,shipping,terms,faq,create-perfume}/page.tsx` → `0`
- `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' src/app/{about,contact,privacy,shipping,terms,faq,create-perfume}/page.tsx` → `0` matches
- `test -f src/app/faq/page.tsx && echo EXISTS` → `EXISTS`
- After migration applied: `npx supabase db dump --data-only --table blog_posts | grep -c "status.*published"` ≥ `3` (or run a Supabase SQL query: `select count(*) from blog_posts where status='published'`)
- `curl -s http://localhost:3000/blog | grep -c "<article"` ≥ `3`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `npm run build` succeeds

**Context:** Read @.planning/PRODUCT.md (§Brand voice — the register every string obeys), @.planning/DESIGN.md (§10b — copy rules, layout rules, motion rules; the hairline-stack / magazine-spread / accordion patterns), @src/app/about/page.tsx (current state — what to replace), @src/app/contact/page.tsx (current state — keep form), @src/app/privacy/page.tsx (current state), @src/app/shipping/page.tsx, @src/app/terms/page.tsx, @src/app/create-perfume/page.tsx, @src/lib/supabase/types.ts (for `blog_posts` table schema before writing the seed migration), @src/lib/blog.ts (for the read shape these posts must satisfy).

**Design:**
- Register: brand (all 7 surfaces are editorial moments; the FAQ + about + journal posts ARE brand expression)
- Tokens used: `--color-bone` / `--color-ink` / `--color-gold` (accents only) / `--font-display-2xl` (page titles) / `--font-body-lg` (long-form copy on `--container-narrow`) / `--space-16` `--space-24` (section padding) / `--accent` (links + accordion chevrons)
- Scope: page (each of the 7 routes)
- Anti-pattern guard: builder runs the four greps in Validation (em-dash, Card, emoji, lorem) pre-commit; commit blocked on any non-zero result. Builder also verifies each page uses an approved section pattern from DESIGN.md §10b — no rounded section wrappers, no gold-on-black surfaces, no parchment placeholder images.

---

## Success Criteria

- [ ] **#1 OG tags distinct per page.** `curl -s https://aquadorcy.com | grep -c "og:title"` ≥ 1 AND the homepage, one PDP, and one blog post each show a distinct `og:title` / `og:description` / `og:image` (not the layout default). Covered by T1 + T2.
- [ ] **#2 Product JSON-LD on every PDP.** `curl -s https://aquadorcy.com/products/<slug>` contains a `<script type="application/ld+json">` block with `@type: Product`, `name`, `image`, `offers.price`, `offers.priceCurrency` sourced from Supabase. Covered by T2 (the existing PDP block is preserved; T2 only moves Org / WebSite up to layout).
- [ ] **#3 Sitemap + robots.** `curl -s https://aquadorcy.com/sitemap.xml | grep -c "<loc>"` ≥ 110. `curl -s https://aquadorcy.com/robots.txt` contains `Disallow: /admin/` AND `Sitemap: https://aquadorcy.com/sitemap.xml`. Covered by T3.
- [ ] **#4 Static pages have editorial body copy, no placeholders.** 7 pages (/about, /contact, /privacy, /shipping, /terms, /faq, /create-perfume). Covered by T4.
- [ ] **#5 ≥ 3 published blog posts.** Each with distinct title + OG tags. Covered by T4 (migration) + T1 (per-post metadata via the helper).
- [ ] **Design + voice compliance.** No em-dashes, no emoji, no `<Card>` section wrappers across the 7 static pages or the journal posts. Covered by T4's anti-pattern guard.
- [ ] **Zero empty alt text on customer surfaces.** `grep -rn 'alt=""' src/components/ src/app/` returns 0. Covered by T3.
- [ ] **Type-check + build clean.** `npx tsc --noEmit` exits 0; `npm run build` succeeds. Covered across all tasks.

---

## Verification Contract

### Contract for Task 1 — metadata helper exists
**Check type:** file-exists
**Command:** `test -f /home/qualia/Projects/aquador/src/lib/seo/metadata.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist

### Contract for Task 1 — every public route has metadata export
**Check type:** grep-match
**Command:** `grep -lE "export const metadata|export async function generateMetadata" /home/qualia/Projects/aquador/src/app/about/page.tsx /home/qualia/Projects/aquador/src/app/contact/page.tsx /home/qualia/Projects/aquador/src/app/privacy/page.tsx /home/qualia/Projects/aquador/src/app/shipping/page.tsx /home/qualia/Projects/aquador/src/app/terms/page.tsx /home/qualia/Projects/aquador/src/app/create-perfume/page.tsx /home/qualia/Projects/aquador/src/app/page.tsx /home/qualia/Projects/aquador/src/app/shop/page.tsx /home/qualia/Projects/aquador/src/app/shop/\[category\]/page.tsx /home/qualia/Projects/aquador/src/app/blog/page.tsx /home/qualia/Projects/aquador/src/app/blog/\[slug\]/page.tsx /home/qualia/Projects/aquador/src/app/products/\[slug\]/page.tsx | wc -l`
**Expected:** `12` (all 12 listed routes; `/faq` ships separately via T4)
**Fail if:** Returns < 12

### Contract for Task 1 — helper is wired (imported from at least 6 routes)
**Check type:** grep-match
**Command:** `grep -rln "buildPageMetadata" /home/qualia/Projects/aquador/src/app/ | wc -l`
**Expected:** Non-zero, ≥ 8
**Fail if:** Returns < 8 — helper exists but routes don't import it

### Contract for Task 1 — no em-dashes in new metadata copy
**Check type:** grep-match
**Command:** `grep -rEn ' — | – ' /home/qualia/Projects/aquador/src/app/about/page.tsx /home/qualia/Projects/aquador/src/app/contact/page.tsx /home/qualia/Projects/aquador/src/app/privacy/page.tsx /home/qualia/Projects/aquador/src/app/shipping/page.tsx /home/qualia/Projects/aquador/src/app/terms/page.tsx /home/qualia/Projects/aquador/src/app/create-perfume/page.tsx /home/qualia/Projects/aquador/src/lib/seo/metadata.ts | wc -l`
**Expected:** `0`
**Fail if:** Returns > 0 — DESIGN.md §10b copy rule violated

### Contract for Task 1 — canonical present on rendered page
**Check type:** behavioral
**Command:** Run `npm run dev`, then `curl -s http://localhost:3000/about | grep -c 'rel="canonical"'`
**Expected:** ≥ `1`
**Fail if:** Returns `0` — helper isn't emitting the alternates.canonical field

### Contract for Task 2 — JSON-LD helper exists
**Check type:** file-exists
**Command:** `test -f /home/qualia/Projects/aquador/src/lib/seo/jsonld.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist

### Contract for Task 2 — layout imports the JSON-LD helpers
**Check type:** grep-match
**Command:** `grep -cE "organizationJsonLd|websiteJsonLd" /home/qualia/Projects/aquador/src/app/layout.tsx`
**Expected:** ≥ `2`
**Fail if:** Returns < 2 — helpers exist but layout doesn't use them

### Contract for Task 2 — Organization JSON-LD removed from homepage
**Check type:** grep-match
**Command:** `grep -cE '"@type":\s*"Organization"' /home/qualia/Projects/aquador/src/app/page.tsx`
**Expected:** `0`
**Fail if:** Returns > 0 — duplicate emission, will cause Google to see two Organization schemas

### Contract for Task 2 — Organization renders on a non-home route
**Check type:** behavioral
**Command:** Run `npm run dev`, then `curl -s http://localhost:3000/about | grep -c '"@type":"Organization"'`
**Expected:** `1`
**Fail if:** Returns `0` — layout JSON-LD not emitting

### Contract for Task 2 — PDP still carries Product JSON-LD
**Check type:** grep-match
**Command:** `grep -cE '"@type":\s*"Product"' /home/qualia/Projects/aquador/src/app/products/\[slug\]/page.tsx`
**Expected:** ≥ `1`
**Fail if:** Returns `0` — T2 must NOT regress the existing PDP block

### Contract for Task 2 — Blog post still carries Article JSON-LD
**Check type:** grep-match
**Command:** `grep -cE '"@type":\s*"Article"' /home/qualia/Projects/aquador/src/app/blog/\[slug\]/page.tsx`
**Expected:** ≥ `1`
**Fail if:** Returns `0` — T2 must NOT regress the existing blog block

### Contract for Task 3 — robots.txt explicit
**Check type:** behavioral
**Command:** Run `npm run dev`, then `curl -s http://localhost:3000/robots.txt`
**Expected:** Output contains `Disallow: /admin/` AND `Sitemap: https://aquadorcy.com/sitemap.xml`
**Fail if:** Either string is missing

### Contract for Task 3 — sitemap covers products + posts
**Check type:** behavioral
**Command:** Run `npm run dev`, then `curl -s http://localhost:3000/sitemap.xml | grep -c "<loc>"`
**Expected:** ≥ `110`
**Fail if:** Returns < 110 — products or posts missing from sitemap

### Contract for Task 3 — zero empty alt text on customer surfaces
**Check type:** grep-match
**Command:** `grep -rn 'alt=""' /home/qualia/Projects/aquador/src/components/ /home/qualia/Projects/aquador/src/app/ 2>/dev/null | grep -vE 'test|spec|stories|node_modules' | wc -l`
**Expected:** `0`
**Fail if:** Returns > 0

### Contract for Task 4 — /faq route exists
**Check type:** file-exists
**Command:** `test -f /home/qualia/Projects/aquador/src/app/faq/page.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist

### Contract for Task 4 — no placeholder copy on static pages
**Check type:** grep-match
**Command:** `grep -riE 'lorem|ipsum|placeholder' /home/qualia/Projects/aquador/src/app/about/page.tsx /home/qualia/Projects/aquador/src/app/contact/page.tsx /home/qualia/Projects/aquador/src/app/privacy/page.tsx /home/qualia/Projects/aquador/src/app/shipping/page.tsx /home/qualia/Projects/aquador/src/app/terms/page.tsx /home/qualia/Projects/aquador/src/app/faq/page.tsx /home/qualia/Projects/aquador/src/app/create-perfume/page.tsx | wc -l`
**Expected:** `0`
**Fail if:** Returns > 0

### Contract for Task 4 — DESIGN.md §10b voice + layout compliance
**Check type:** grep-match
**Command:** `grep -rEn ' — | – |<Card[ >]' /home/qualia/Projects/aquador/src/app/about/page.tsx /home/qualia/Projects/aquador/src/app/contact/page.tsx /home/qualia/Projects/aquador/src/app/privacy/page.tsx /home/qualia/Projects/aquador/src/app/shipping/page.tsx /home/qualia/Projects/aquador/src/app/terms/page.tsx /home/qualia/Projects/aquador/src/app/faq/page.tsx /home/qualia/Projects/aquador/src/app/create-perfume/page.tsx | wc -l`
**Expected:** `0`
**Fail if:** Returns > 0 — em-dash, en-dash, or Card-as-section violation

### Contract for Task 4 — no emoji on static pages
**Check type:** grep-match
**Command:** `grep -P '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{27BF}]' /home/qualia/Projects/aquador/src/app/about/page.tsx /home/qualia/Projects/aquador/src/app/contact/page.tsx /home/qualia/Projects/aquador/src/app/privacy/page.tsx /home/qualia/Projects/aquador/src/app/shipping/page.tsx /home/qualia/Projects/aquador/src/app/terms/page.tsx /home/qualia/Projects/aquador/src/app/faq/page.tsx /home/qualia/Projects/aquador/src/app/create-perfume/page.tsx | wc -l`
**Expected:** `0`
**Fail if:** Returns > 0

### Contract for Task 4 — seed migration exists
**Check type:** file-exists
**Command:** `test -f /home/qualia/Projects/aquador/supabase/migrations/20260517000000_seed_journal_posts.sql && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist

### Contract for Task 4 — ≥3 published posts in Supabase
**Check type:** behavioral
**Command:** Run `npx supabase db remote query "select count(*) from blog_posts where status='published'"` (or equivalent Supabase MCP `execute_sql` call)
**Expected:** Returns count ≥ `3`
**Fail if:** Returns < 3 — migration didn't apply or seed inserts failed

### Contract for Task 4 — /blog index renders ≥3 posts
**Check type:** behavioral
**Command:** Run `npm run dev`, then `curl -s http://localhost:3000/blog | grep -c "<article"`
**Expected:** ≥ `3`
**Fail if:** Returns < 3 — posts are in DB but not surfacing in the index query

### Contract for Phase — type-check + build clean
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Returns > 0

### Contract for Phase — production build succeeds
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npm run build 2>&1 | tail -5 | grep -c "Compiled successfully\|Generating static pages"`
**Expected:** ≥ `1`
**Fail if:** Returns `0` — build broke
