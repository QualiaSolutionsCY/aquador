---
phase: 1
goal: "Close every deferred OPTIMIZE.md finding (token migration, admin write-path hardening, customer_id FK adoption, orphan cleanup) and complete a visual QA pass across the 8 customer-facing routes so no legacy v2.0 surface, off-token component, or broken state survives into Content+SEO"
tasks: 3
waves: 2
---

# Phase 1: Polish

**Goal:** Resolve every deferred CRITICAL/HIGH/MEDIUM finding from `.planning/archive/milestone-3-admin-rebuild/OPTIMIZE.md` (POLISH-05..11) and verify polish across all 8 customer-facing routes (POLISH-01..04) so the codebase enters Phase 4.2 (Content + SEO) with no legacy chrome, no off-token surface, and no broken states.

**Why this phase:** SEO meta and JSON-LD in Phase 4.2 must be authored against final component surfaces and final copy. Writing them now against placeholder strings or pre-polish components means rewriting them later — wasted effort. Closing OPTIMIZE.md residue also drains the security debt (admin writes going around RLS, orders denormalized by email) before any further work loads on top.

---

## Task 1 — Admin write-paths cookie-bound refactor (POLISH-09)
**Wave:** 1
**Persona:** backend
**Files:**
- `src/lib/supabase/admin-service.ts` (modify — add optional `client?: SupabaseClient<Database>` parameter to the 13 write functions identified at lines 146, 190, 229, 285, 324, 358, 405, 434, 456, 479, 502, 530, 560, 583, 616, 647; default behaviour stays `createAdminClient()` only when no caller-supplied client is passed; reads stay on `createAdminClient()` unchanged for now)
- `src/app/api/admin/orders/[id]/route.ts` (modify — remove the inline `createAdminClient()` on line 131; replace the notes write with a call to a new `updateOrderNotes(orderId, notes, client)` exported from `admin-service.ts`; pass the cookie-bound `createClient()` instance through; remove the `createAdminClient` import on line 22)
- `src/app/api/admin/products/route.ts` (modify — POST/PATCH/DELETE handlers; replace any direct `createAdminClient()` write calls with a cookie-bound `createClient()` passed into the relevant `admin-service.ts` writer — `createProduct`, `updateProduct`, `deleteProduct`)
- `src/app/api/admin/products/[id]/route.ts` (modify if it exists with PATCH/DELETE — same pattern; if it doesn't exist, no-op)

**Depends on:** none

**Why:** Today every admin mutation runs through `createAdminClient()` (service-role). The earlier security hardening migration (`20260515110000_security_hardening_from_optimize.sql`) installed an `is_admin()` predicate on every write policy, but service-role bypasses RLS entirely — so the policy is dormant and `auth.uid()` is null in the audit trail for every admin mutation. Moving writes to a cookie-bound `createServerClient()` makes RLS the active gate and preserves the operator's UUID on every change — closing OPTIMIZE.md H12, H13, M15 in one stroke.

**Acceptance Criteria:**
- `grep -n "createAdminClient" src/app/api/admin/orders/[id]/route.ts src/app/api/admin/products/route.ts` returns 0 lines on the *mutation* paths (POST/PATCH/DELETE handlers); read-only GETs may still use service-role for now.
- Every write function in `admin-service.ts` (the 16 functions that today call `createAdminClient()` and execute an `.update()/.insert()/.delete()`) accepts an optional `client` parameter; when supplied, the function uses it instead of `createAdminClient()`.
- After making a PATCH to `/api/admin/orders/{id}` with `{ "notes": "test" }`, the Supabase audit log (or a `SELECT updated_by` if the column exists) shows the admin's `auth.uid()` is non-null — i.e. RLS is the gate, not service-role.
- `npm run build` exits 0 and `npx tsc --noEmit` exits 0 — no new TypeScript errors from the signature change.

**Action:**
1. Open `src/lib/supabase/admin-service.ts`. Add a type alias at the top: `type AdminWriteClient = SupabaseClient<Database>` (import `SupabaseClient` from `@supabase/supabase-js` if not already). Identify every exported function that performs an `.insert()`, `.update()`, or `.delete()` against any table. Today these are at lines 146, 190, 229, 285, 324, 358, 405, 434, 456, 479, 502, 530, 560, 583, 616, 647 — read the file and confirm the exact set before editing.
2. For each writer, change the signature from `export async function name(...args)` to `export async function name(...args, client?: AdminWriteClient)`. Inside the function body, replace `const supabase = createAdminClient()` with `const supabase = client ?? createAdminClient()`. Keep the fallback so callers that haven't been migrated yet keep working.
3. Add a new exported writer `updateOrderNotes(orderId: string, notes: string, client?: AdminWriteClient)` that performs the merge-into-`tags` write currently inlined in `/api/admin/orders/[id]/route.ts` (lines 122-145). It must read the existing `tags` (using the same client), merge `{ notes }` into it, and call `.update({ tags: nextTags }).eq('id', orderId)`.
4. Open `src/app/api/admin/orders/[id]/route.ts`. Delete the `createAdminClient` import (line 22). In the PATCH handler, after `requireAdmin()` succeeds, obtain a cookie-bound client: `const supabase = await createClient()`. Pass `supabase` as the trailing argument to both `updateOrderStatus(id, status, supabase)` and the new `updateOrderNotes(id, notes, supabase)` call. Delete the inline `createAdminClient()` block (lines 122-145) — it's now inside `admin-service.ts`.
5. Open `src/app/api/admin/products/route.ts`. For every mutation handler (POST/PATCH/DELETE), grab a cookie-bound client via `await createClient()` and pass it to the corresponding `admin-service.ts` writer. If the route currently calls `createAdminClient()` directly for a write, route that write through `admin-service.ts` instead — keep the security boundary in one file.
6. If `src/app/api/admin/products/[id]/route.ts` exists with PATCH/DELETE handlers, apply the same pattern.
7. Run `npm run build` and `npx tsc --noEmit`. Fix any type errors surfaced by the new optional parameter.

**Validation:** (builder self-check)
- `grep -nE "createAdminClient\(\)" src/app/api/admin/orders/\[id\]/route.ts src/app/api/admin/products/route.ts` → exit 1 (no matches) on mutation handlers
- `grep -nE "client \?\? createAdminClient\(\)" src/lib/supabase/admin-service.ts | wc -l` → ≥ 13 (every writer now opt-in cookie-bound)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `npm run build 2>&1 | tail -5` → no error lines

**Context:** Read @/home/qualia/Projects/aquador/.planning/PROJECT.md @/home/qualia/Projects/aquador/.planning/STATE.md @/home/qualia/Projects/aquador/CLAUDE.md @/home/qualia/Projects/aquador/src/lib/supabase/admin-service.ts @/home/qualia/Projects/aquador/src/lib/supabase/server.ts @/home/qualia/Projects/aquador/src/lib/supabase/admin.ts @/home/qualia/Projects/aquador/src/app/api/admin/orders/[id]/route.ts @/home/qualia/Projects/aquador/src/app/api/admin/products/route.ts @/home/qualia/Projects/aquador/supabase/migrations/20260515110000_security_hardening_from_optimize.sql @/home/qualia/.claude/rules/security.md

---

## Task 2 — `orders.customer_id` FK adoption + backfill (POLISH-10)
**Wave:** 2
**Persona:** backend
**Files:**
- `supabase/migrations/20260516000002_orders_customer_id_backfill.sql` (create — backfill SQL that links existing orders to customers by email match)
- `src/app/api/webhooks/stripe/route.ts` (modify — when inserting a new order in the `checkout.session.completed` handler, look up or upsert the customer by email first, then populate `orders.customer_id` with the customer UUID on insert)
- `src/lib/supabase/admin-service.ts` (modify — rewrite `getCustomerOrderHistory` at line 669 to query `orders` by `customer_id` directly instead of resolving `customers.email` first and joining on `orders.customer_email`)

**Depends on:** Task 1 (writes shared file `admin-service.ts` — must serialize after Task 1's signature changes land so we don't fight a merge)

**Why:** `orders.customer_id` exists in the schema but is unused; `getCustomerOrderHistory` joins on `customer_email` which is denormalized and unsafe (an email change on the `customers` row silently disconnects historical orders from the customer record). Adopting the FK closes OPTIMIZE.md H16, restores referential integrity, and makes customer LTV / repeat-buyer math correct for the admin dashboard.

**Acceptance Criteria:**
- A new migration file `supabase/migrations/20260516000002_orders_customer_id_backfill.sql` exists, is idempotent (safe to re-run), and after applying it `SELECT COUNT(*) FROM orders WHERE customer_id IS NULL AND customer_email IS NOT NULL AND customer_email IN (SELECT email FROM customers)` returns 0 — every order whose email matches a customer row has the FK populated.
- The Stripe webhook handler in `src/app/api/webhooks/stripe/route.ts`, on `checkout.session.completed`, looks up or upserts the `customers` row by email and writes the resulting customer UUID into `orders.customer_id` on the insert. Subsequent orders for the same email reuse the existing customer UUID.
- `getCustomerOrderHistory(customerId)` in `admin-service.ts` queries `.from('orders').select('*').eq('customer_id', customerId)` — no intermediate `customers.email` lookup; the test in `src/lib/supabase/__tests__/` (if one exists) is updated to mock the new query shape.
- `npm run test -- src/lib/supabase` exits 0; `npx tsc --noEmit` exits 0.

**Action:**
1. Read the current `customers` table shape (the schema already has the `customers` table; confirm columns via `npx supabase db remote dump --schema public` if needed, or read existing migration files). Confirm `orders.customer_id` exists as a nullable UUID FK to `customers.id` — the OPTIMIZE.md H16 finding states it does.
2. Author `supabase/migrations/20260516000002_orders_customer_id_backfill.sql`. It must:
   - Backfill: `UPDATE orders SET customer_id = c.id FROM customers c WHERE orders.customer_email = c.email AND orders.customer_id IS NULL`
   - Add an index if one doesn't already exist: `CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id)`
   - Wrap in a transaction and use `IF EXISTS` / `IF NOT EXISTS` guards so the migration is idempotent
3. Apply locally via `npx supabase db push` (against the linked project) or `npx supabase migration up` for local stack. Verify the backfill with the `SELECT COUNT(*)` query above.
4. Open `src/app/api/webhooks/stripe/route.ts`. In the `checkout.session.completed` branch (around the existing `customer_email: customerEmail` insert at line 48), add a customer upsert step BEFORE the orders insert:
   - `const { data: customer } = await supabase.from('customers').upsert({ email: customerEmail, ... other available fields ... }, { onConflict: 'email' }).select('id').single()`
   - Use the result's `id` as `customer_id` on the orders insert payload. Keep `customer_email` on the order row for now — don't drop it; H16 is about FK adoption, not column removal (defer that to a later migration).
   - Handle the upsert error path: if the upsert fails, log via `reportSafe` and continue with `customer_id: null` rather than aborting the order write (we never want to lose an order over a customers-table issue).
5. Open `src/lib/supabase/admin-service.ts` at line 669. Rewrite `getCustomerOrderHistory`:
   - Drop the email-lookup step (lines 677-689 — the `customers.email` resolve).
   - Query orders directly: `const { data, error } = await supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false })`.
   - Update the JSDoc above the function to reflect the new join key.
6. Update `src/lib/supabase/__tests__/admin-service.test.ts` (or equivalent test file — confirm the test path before editing) to mock the new query shape. If a test asserted the two-step email resolve, replace it with a single-step `customer_id` mock.
7. Run the test + build commands listed under Validation.

**Validation:** (builder self-check)
- `ls supabase/migrations/20260516000002_orders_customer_id_backfill.sql` → file exists
- `grep -nE "customer_id" src/app/api/webhooks/stripe/route.ts | head -5` → ≥ 1 match showing the FK populated on order insert
- `grep -nE "\.eq\('customer_id', customerId\)" src/lib/supabase/admin-service.ts` → ≥ 1 match
- `grep -cE "customer_email" src/lib/supabase/admin-service.ts` → 0 matches in `getCustomerOrderHistory` (run with `-A 30` around the function)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `npm run test -- src/lib/supabase 2>&1 | tail -3` → "Tests: ... passed"

**Context:** Read @/home/qualia/Projects/aquador/.planning/PROJECT.md @/home/qualia/Projects/aquador/CLAUDE.md @/home/qualia/Projects/aquador/src/app/api/webhooks/stripe/route.ts @/home/qualia/Projects/aquador/src/lib/supabase/admin-service.ts @/home/qualia/Projects/aquador/src/lib/supabase/types.ts @/home/qualia/Projects/aquador/supabase/migrations/20260515110000_security_hardening_from_optimize.sql @/home/qualia/.claude/rules/security.md @/home/qualia/.claude/rules/infrastructure.md

---

## Task 3 — Frontend polish, orphan cleanup, visual QA pass (POLISH-01..08, POLISH-11)
**Wave:** 1
**Persona:** frontend
**Files:**
- `src/components/storefront/FeaturedGrid.tsx` (modify — delete the `'use client'` directive on line 1; FadeUp wraps each card already at lines 87-100 so the card-level animation moves with the cards which become client components themselves; the section wrapper stays RSC-streamable)
- `src/components/storefront/FadeUp.tsx` (verify — confirm it is `'use client'` so when `FeaturedGrid` becomes RSC it can still import + render `<FadeUp>` as a client child)
- `src/components/admin/AdminTopBar.tsx` (modify — add a skeleton bar for `userEmail` while the auth state is loading; use `bg-bg-alt animate-pulse h-4 w-32` or equivalent token utilities; render the skeleton until `email` is non-null)
- `src/components/admin/AdminTable.tsx` (modify — either implement `sortable` (column-click toggles asc/desc, lifts state via a controlled `onSortChange` callback) OR delete the prop and any consumer references; pick "implement" if any consumer relies on it, otherwise drop)
- `src/components/admin/AdminShell.tsx` (modify — replace every `bg-[var(--bg)]` inline arbitrary value with the `bg-bg` utility class that already maps to `var(--bg)` in `tailwind.config.ts`; grep for both forms first to be sure)
- `src/components/admin/ImageUploader.tsx` (modify — swap the raw `<img>` preview for `next/image` with explicit `width={96} height={96}` and `unoptimized` flag if the preview source is a blob URL)
- `src/components/products/RelatedProducts.tsx` (audit — is it imported anywhere? `grep -rn "RelatedProducts" src/app src/components`; if zero consumers, delete. If consumers exist, verify they still render correctly with the v3.0 ProductCard.)
- `src/components/products/ProductVariantSelector.tsx` (audit — same procedure; delete if orphan)
- `src/components/cart/CartItems.tsx` and `src/app/cart/page.tsx` (verify — confirm the empty-cart state renders a purposeful editorial empty message, not a blank white block; if it does not, add one using the brand-voice copy "Nothing in here yet. Three things people are wearing this week →" from PRODUCT.md §Brand voice)
- `src/app/products/[slug]/page.tsx` and the PDP ATC component (verify — confirm a sold-out / `inventory_count = 0` product renders a disabled Add-to-Cart button with the copy "Out of stock"; if the disabled state is missing, wire it through)
- `src/app/layout.tsx` (verify only — confirm zero `ChatWidget` / `ChatWidgetClient` references; POLISH-05 already shipped in commit ebc917e but we want a grep-zero proof)
- `src/components/ui/CookieConsent.tsx` (verify only — confirm zero `font-playfair`, `rgba`, or raw hex; POLISH-06 already shipped in ebc917e)
- `src/components/ui/ProductCard.tsx`, `src/components/layout/Navbar.tsx` (verify only — confirm zero `font-playfair|text-gold|bg-gold|bg-emerald|text-red-500|rgba(`; POLISH-07 already shipped in d54e52a + ebc917e)
- `.planning/phase-1-visual-qa.md` (create — visual QA log; documents each of the 8 routes at 375 / 768 / 1280, calls out any state issue found, links screenshots if captured)

**Depends on:** none (file sets disjoint from Tasks 1 + 2; runs in parallel with Task 1 in Wave 1)

**Why:** Half the carry-forwards from M3's OPTIMIZE.md are already in the codebase (commits ebc917e, d54e52a) but were never verified end-to-end. The other half (POLISH-08 FeaturedGrid RSC, POLISH-11 orphan cleanup, POLISH-01..04 state coverage on the 8 routes) are open. Bundling verification + cleanup + visual QA into one task keeps the file blast radius small and lets one builder hold the full storefront polish picture in context. After this task the next phase (Content + SEO) writes against settled component shapes.

**Acceptance Criteria:**
- `grep -rE "ChatWidgetClient|ChatWidget" src/app/layout.tsx` returns 0 matches (POLISH-05 verified).
- `grep -rE "font-playfair|rgba|#[0-9a-fA-F]{3,6}" src/components/ui/CookieConsent.tsx` returns 0 matches (POLISH-06 verified).
- `grep -rE "font-playfair|text-gold|bg-gold|bg-emerald|text-red-500|rgba\(" src/components/ui/ProductCard.tsx src/components/layout/Navbar.tsx` returns 0 matches (POLISH-07 verified).
- `head -1 src/components/storefront/FeaturedGrid.tsx` does NOT equal `'use client';` — FeaturedGrid is RSC, FadeUp is the only client island per card (POLISH-08).
- `RelatedProducts.tsx` and `ProductVariantSelector.tsx` either have ≥ 1 importer (verified by grep) or are deleted (POLISH-11 orphan resolution).
- `AdminTopBar` renders a skeleton placeholder while `userEmail` is loading (visible by reading the component — `animate-pulse` class on a `<div>` placeholder while `email == null`).
- `AdminTable.sortable` prop either has a working implementation (column header click toggles asc/desc and calls `onSortChange`) or is removed from the prop type AND every consumer.
- `grep -nE "bg-\[var\(--bg\)\]" src/components/admin/AdminShell.tsx` returns 0 matches (replaced by `bg-bg` utility).
- `grep -nE "<img " src/components/admin/ImageUploader.tsx` returns 0 matches (replaced by `next/image`).
- Cart with 0 items renders an editorial empty state on `/cart` (no blank white block) using brand-voice copy.
- A sold-out PDP renders a disabled ATC button with "Out of stock" copy.
- `.planning/phase-1-visual-qa.md` exists with one section per route (8 sections) and one row per viewport (375 / 768 / 1280) noting Pass / Fail and any deviation — Fail rows list a follow-up.
- `npm run build` exits 0; `npx tsc --noEmit` exits 0; `npm run lint` exits 0.

**Action:**
1. **Verification grep sweep (cheap, do first).** Run every `grep` listed under Acceptance Criteria. Capture the output. If any "should return 0" check fails, fix the offender before continuing — these are POLISH-05/06/07 verifications that should already pass; if they don't, the carry-forward map in ROADMAP.md is wrong and you need to retoken the file.
2. **POLISH-08 — FeaturedGrid RSC boundary.** Open `src/components/storefront/FeaturedGrid.tsx`. Delete line 1 (`'use client';`). Confirm `src/components/storefront/FadeUp.tsx` starts with `'use client';` (it should — it uses motion). Because the cards already wrap in `<FadeUp>`, the section itself becomes a Server Component and the FadeUp islands ship the only client JS for this section. Run `npm run build` and confirm the route still builds; check the build output line for the home route — `static` or `dynamic` indicator should remain stable.
3. **POLISH-11a — Orphan audit (RelatedProducts, ProductVariantSelector).** For each file run `grep -rn "RelatedProducts\|ProductVariantSelector" src/app src/components`. If zero matches outside the file itself, `git rm` the file and update `src/components/products/index.ts` (currently re-exports it — confirm). If non-zero matches, read the consumers, verify they render against the v3.0 ProductCard token layer; if a consumer is itself orphaned, recursively follow the trail.
4. **POLISH-11b — AdminTopBar skeleton.** Open `src/components/admin/AdminTopBar.tsx`. Find where `userEmail` is rendered. Wrap the render in `{email ? <span className="text-fg-muted text-sm">{email}</span> : <div className="h-4 w-32 bg-bg-alt animate-pulse rounded-sm" aria-hidden="true" />}`. Tokens: `bg-bg-alt`, no raw hex.
5. **POLISH-11c — AdminTable.sortable resolution.** Open `src/components/admin/AdminTable.tsx`. Check the `sortable` prop on the column definition type. Grep consumers: `grep -rn "sortable: true\|sortable:true" src/components/admin src/app/admin`. If any consumer passes `sortable: true`, implement the behaviour: clicking the header cell of a sortable column toggles ascending/descending via a controlled `onSortChange?: (col: string, dir: 'asc' | 'desc') => void` prop. If no consumer uses `sortable: true`, delete the prop from the column type and every JSX site that references it.
6. **POLISH-11d — AdminShell `bg-[var(--bg)]` → `bg-bg`.** Open `src/components/admin/AdminShell.tsx`. Grep for `bg-\[var\(--bg\)\]`. Replace every occurrence with the `bg-bg` utility (it maps to `var(--bg)` already; the `tailwind.config.ts` semantic alias has been in place since M1.1).
7. **POLISH-11e — ImageUploader `<img>` → `next/image`.** Open `src/components/admin/ImageUploader.tsx`. Replace the preview `<img src={previewUrl} ... />` with `<Image src={previewUrl} width={96} height={96} unoptimized alt="Upload preview" className="..." />` (import `Image from 'next/image'`). Keep the existing className. `unoptimized` is required because the preview source is a blob URL — Next can't optimise blob URLs.
8. **POLISH-02 / POLISH-04 — Empty cart + sold-out PDP.** Open `src/app/cart/page.tsx` (or `src/components/cart/CartItems.tsx` — whichever owns the empty render). If the empty-cart branch returns null or a blank block, add an editorial empty state: an `<h2>` with the headline "Nothing in here yet" and a paragraph "Three things people are wearing this week" with a link to `/shop`. Token-only: `text-fg`, `text-fg-muted`, no hex. For sold-out PDP, open `src/app/products/[slug]/page.tsx` and the ATC component. If `product.inventory_count === 0` (or whatever the field is named — confirm via `src/lib/supabase/types.ts`), render the ATC button with `disabled` and the label "Out of stock". Test by setting a product's inventory to 0 in Supabase staging and reloading the PDP.
9. **POLISH-01..03 — Visual QA log.** Run `npm run dev`. Visit each of the 8 routes (`/`, `/products/[any-slug]`, `/shop`, `/shop/women`, `/cart`, `/checkout` (with at least one cart item), `/create-perfume`, `/blog`) at 375px / 768px / 1280px using DevTools device emulation. Write `.planning/phase-1-visual-qa.md` with one section per route. Each section: a screenshot path (or "captured manually" if not committed), Pass/Fail per viewport, and any deviation noted. The log itself is the deliverable — not a comprehensive bug-bash; just a structured record of what was checked and what failed.
10. **Final gate.** Run `npm run build && npx tsc --noEmit && npm run lint`. All three must exit 0. Commit.

**Validation:** (builder self-check)
- `head -1 src/components/storefront/FeaturedGrid.tsx | grep -c "use client"` → `0`
- `grep -rE "ChatWidgetClient|ChatWidget" src/app/layout.tsx | wc -l` → `0`
- `grep -rE "font-playfair|rgba|#[0-9a-fA-F]{3,6}" src/components/ui/CookieConsent.tsx | wc -l` → `0`
- `grep -rE "font-playfair|text-gold|bg-gold|bg-emerald|text-red-500|rgba\(" src/components/ui/ProductCard.tsx src/components/layout/Navbar.tsx | wc -l` → `0`
- `grep -nE "bg-\[var\(--bg\)\]" src/components/admin/AdminShell.tsx | wc -l` → `0`
- `grep -nE "<img " src/components/admin/ImageUploader.tsx | wc -l` → `0`
- `grep -nE "animate-pulse" src/components/admin/AdminTopBar.tsx | wc -l` → `≥ 1`
- `test -f .planning/phase-1-visual-qa.md && wc -l .planning/phase-1-visual-qa.md` → file exists, ≥ 30 lines
- `npm run build 2>&1 | tail -3` → no errors
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @/home/qualia/Projects/aquador/.planning/PROJECT.md @/home/qualia/Projects/aquador/.planning/PRODUCT.md @/home/qualia/Projects/aquador/.planning/DESIGN.md @/home/qualia/Projects/aquador/CLAUDE.md @/home/qualia/Projects/aquador/src/components/storefront/FeaturedGrid.tsx @/home/qualia/Projects/aquador/src/components/storefront/FadeUp.tsx @/home/qualia/Projects/aquador/src/components/admin/AdminShell.tsx @/home/qualia/Projects/aquador/src/components/admin/AdminTopBar.tsx @/home/qualia/Projects/aquador/src/components/admin/AdminTable.tsx @/home/qualia/Projects/aquador/src/components/admin/ImageUploader.tsx @/home/qualia/Projects/aquador/src/components/ui/CookieConsent.tsx @/home/qualia/Projects/aquador/src/components/ui/ProductCard.tsx @/home/qualia/Projects/aquador/src/components/layout/Navbar.tsx @/home/qualia/Projects/aquador/src/app/layout.tsx @/home/qualia/Projects/aquador/src/app/cart/page.tsx @/home/qualia/Projects/aquador/tailwind.config.ts @/home/qualia/.claude/rules/grounding.md

**Design:** (REQUIRED — task touches `.tsx`)
- Register: mixed (product chrome — admin shell + cart; brand chrome — empty cart copy, FeaturedGrid)
- Tokens used: `bg-bg`, `bg-bg-alt`, `text-fg`, `text-fg-muted`, `border-border`, `animate-pulse`, `--space-4`, `--space-6`, `--font-body`, `--font-micro` for any micro-UI label
- Scope: component-level (AdminTopBar, AdminShell, AdminTable, ImageUploader, FeaturedGrid) + section-level (empty cart state, sold-out PDP state)
- Brand-voice constraints from PRODUCT.md §Brand voice + DESIGN.md §10b: no em-dashes / hyphen-as-punct, no emoji, no exclamation marks. The empty-cart copy "Nothing in here yet. Three things people are wearing this week" follows the registered example verbatim.
- Layout constraint from DESIGN.md §10b: do not introduce `<Card>` as a section wrapper for the empty cart state — use the hairline-stack or type-led section pattern instead (a heading + paragraph + link, no box).
- Anti-pattern guard: per DESIGN.md §10, no raw `rgba(`, no `font-playfair`, no `#hex`, no `rounded-*` > 16px on any new element. Verified by the grep contracts in Validation.

---

## Success Criteria

- [ ] **POLISH-05 verified.** `grep -r "ChatWidgetClient\|ChatWidget" src/app/layout.tsx` returns 0; `AiConciergeEntry` is the only AI entry point on the homepage.
- [ ] **POLISH-06 verified.** `CookieConsent.tsx` has zero `font-playfair`, zero `rgba`, zero raw hex.
- [ ] **POLISH-07 verified.** `ProductCard`, `Navbar` have zero `font-playfair|text-gold|bg-gold|bg-emerald|text-red-500|rgba(` matches; AddToCartButton has no synthetic `setTimeout` delay.
- [ ] **POLISH-08 shipped.** `FeaturedGrid.tsx` line 1 is not `'use client';` — section is RSC-streamable, FadeUp ships as the per-card client island.
- [ ] **POLISH-09 shipped.** `grep -rn "createAdminClient" src/app/api/admin/orders src/app/api/admin/products` returns 0 on mutation handlers; admin-service.ts writers accept an optional cookie-bound client; live PATCH against an order records a non-null `auth.uid()` in the audit trail.
- [ ] **POLISH-10 shipped.** New migration `20260516000002_orders_customer_id_backfill.sql` applied; Stripe webhook populates `orders.customer_id` on new orders; `getCustomerOrderHistory` joins on `customer_id`.
- [ ] **POLISH-11 shipped.** `RelatedProducts` / `ProductVariantSelector` orphan resolved (imported or deleted); `AdminTopBar` userEmail skeleton present; `AdminTable.sortable` either implemented or removed; `AdminShell` uses `bg-bg` not arbitrary `bg-[var(--bg)]`; `ImageUploader` uses `next/image`.
- [ ] **POLISH-01..04 verified.** All 8 customer-facing routes pass the 375 / 768 / 1280 visual QA pass; empty cart shows the editorial empty state; sold-out PDP shows disabled ATC + "Out of stock"; `.planning/phase-1-visual-qa.md` documents each route × viewport.
- [ ] **Gates green.** `npm run build` exits 0, `npx tsc --noEmit` exits 0, `npm run lint` exits 0.

---

## Verification Contract

### Contract for Task 1 — admin write-paths cookie-bound (orders route)
**Check type:** grep-match
**Command:** `grep -nE "createAdminClient\(\)" /home/qualia/Projects/aquador/src/app/api/admin/orders/\[id\]/route.ts`
**Expected:** Exit code 1 (no matches)
**Fail if:** Any match remains — the mutation path still uses service-role

### Contract for Task 1 — admin write-paths cookie-bound (products route)
**Check type:** grep-match
**Command:** `grep -nE "createAdminClient\(\)" /home/qualia/Projects/aquador/src/app/api/admin/products/route.ts`
**Expected:** Exit code 1 (no matches)
**Fail if:** Any match remains in a POST/PATCH/DELETE handler

### Contract for Task 1 — writer signature update
**Check type:** grep-match
**Command:** `grep -cE "client \?\? createAdminClient\(\)" /home/qualia/Projects/aquador/src/lib/supabase/admin-service.ts`
**Expected:** ≥ 13
**Fail if:** Returns < 13 — writers haven't been migrated to accept the optional cookie-bound client

### Contract for Task 1 — new updateOrderNotes wiring
**Check type:** grep-match
**Command:** `grep -nE "updateOrderNotes" /home/qualia/Projects/aquador/src/app/api/admin/orders/\[id\]/route.ts /home/qualia/Projects/aquador/src/lib/supabase/admin-service.ts`
**Expected:** ≥ 2 matches (export site + call site)
**Fail if:** Returns 0 or 1 — function exists in lib but not called, or not extracted from the route handler

### Contract for Task 1 — typecheck
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TS error introduced

### Contract for Task 2 — backfill migration exists
**Check type:** file-exists
**Command:** `test -f /home/qualia/Projects/aquador/supabase/migrations/20260516000002_orders_customer_id_backfill.sql && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Migration file missing

### Contract for Task 2 — backfill migration content
**Check type:** grep-match
**Command:** `grep -cE "UPDATE orders SET customer_id|FROM customers" /home/qualia/Projects/aquador/supabase/migrations/20260516000002_orders_customer_id_backfill.sql`
**Expected:** ≥ 2
**Fail if:** Migration doesn't perform the email→customer_id backfill

### Contract for Task 2 — webhook populates customer_id
**Check type:** grep-match
**Command:** `grep -nE "customer_id" /home/qualia/Projects/aquador/src/app/api/webhooks/stripe/route.ts`
**Expected:** ≥ 1 match
**Fail if:** Returns 0 — webhook still inserts orders without the FK

### Contract for Task 2 — getCustomerOrderHistory uses FK
**Check type:** grep-match
**Command:** `grep -nE "\.eq\('customer_id', customerId\)" /home/qualia/Projects/aquador/src/lib/supabase/admin-service.ts`
**Expected:** ≥ 1
**Fail if:** Returns 0 — query still joins by email

### Contract for Task 2 — getCustomerOrderHistory no longer email-joins
**Check type:** behavioral
**Command:** Read `src/lib/supabase/admin-service.ts` lines 665-710 and confirm the function calls `.from('orders').eq('customer_id', customerId)` directly with no preliminary `customers.email` lookup.
**Expected:** Single-step query on `customer_id`
**Fail if:** The two-step email resolve is still present

### Contract for Task 3 — FeaturedGrid is RSC
**Check type:** grep-match
**Command:** `head -1 /home/qualia/Projects/aquador/src/components/storefront/FeaturedGrid.tsx | grep -c "use client"`
**Expected:** `0`
**Fail if:** Returns 1 — file still starts with `'use client';`

### Contract for Task 3 — ChatWidget removed from layout
**Check type:** grep-match
**Command:** `grep -cE "ChatWidgetClient|ChatWidget" /home/qualia/Projects/aquador/src/app/layout.tsx`
**Expected:** `0`
**Fail if:** Any match — POLISH-05 not closed

### Contract for Task 3 — CookieConsent token-clean
**Check type:** grep-match
**Command:** `grep -cE "font-playfair|rgba|#[0-9a-fA-F]{3,6}" /home/qualia/Projects/aquador/src/components/ui/CookieConsent.tsx`
**Expected:** `0`
**Fail if:** Any match — POLISH-06 not closed

### Contract for Task 3 — ProductCard / Navbar token-clean
**Check type:** grep-match
**Command:** `grep -cE "font-playfair|text-gold|bg-gold|bg-emerald|text-red-500|rgba\(" /home/qualia/Projects/aquador/src/components/ui/ProductCard.tsx /home/qualia/Projects/aquador/src/components/layout/Navbar.tsx`
**Expected:** `0`
**Fail if:** Any match — POLISH-07 not closed

### Contract for Task 3 — AdminShell bg utility migration
**Check type:** grep-match
**Command:** `grep -cE "bg-\[var\(--bg\)\]" /home/qualia/Projects/aquador/src/components/admin/AdminShell.tsx`
**Expected:** `0`
**Fail if:** Inline arbitrary value still present

### Contract for Task 3 — ImageUploader uses next/image
**Check type:** grep-match
**Command:** `grep -cE "^import Image from 'next/image'|<Image " /home/qualia/Projects/aquador/src/components/admin/ImageUploader.tsx`
**Expected:** ≥ 1
**Fail if:** Returns 0 — `<img>` still in use

### Contract for Task 3 — ImageUploader no raw img tag
**Check type:** grep-match
**Command:** `grep -cE "<img " /home/qualia/Projects/aquador/src/components/admin/ImageUploader.tsx`
**Expected:** `0`
**Fail if:** Returns ≥ 1 — raw `<img>` still present

### Contract for Task 3 — AdminTopBar skeleton present
**Check type:** grep-match
**Command:** `grep -cE "animate-pulse" /home/qualia/Projects/aquador/src/components/admin/AdminTopBar.tsx`
**Expected:** ≥ 1
**Fail if:** Returns 0 — no skeleton placeholder for userEmail

### Contract for Task 3 — orphan resolution (RelatedProducts)
**Check type:** behavioral
**Command:** Run `grep -rn "RelatedProducts" /home/qualia/Projects/aquador/src/app /home/qualia/Projects/aquador/src/components`. Either the file is deleted (zero hits including the file itself) OR there is at least one consumer outside the file's own definition.
**Expected:** No orphan — file is either imported or removed
**Fail if:** File exists with zero importers

### Contract for Task 3 — orphan resolution (ProductVariantSelector)
**Check type:** behavioral
**Command:** Run `grep -rn "ProductVariantSelector" /home/qualia/Projects/aquador/src/app /home/qualia/Projects/aquador/src/components`. Same rule as RelatedProducts.
**Expected:** No orphan
**Fail if:** File exists with zero importers

### Contract for Task 3 — visual QA log exists
**Check type:** file-exists
**Command:** `test -f /home/qualia/Projects/aquador/.planning/phase-1-visual-qa.md && wc -l /home/qualia/Projects/aquador/.planning/phase-1-visual-qa.md`
**Expected:** File exists; ≥ 30 lines
**Fail if:** File missing or under 30 lines (would imply the 8 routes × 3 viewports weren't documented)

### Contract for Task 3 — empty cart state
**Check type:** behavioral
**Command:** Visit `/cart` with `localStorage` cleared (or empty cart). Confirm the page renders an editorial empty state with the headline copy and a link to `/shop`, not a blank white block.
**Expected:** Editorial empty state visible
**Fail if:** Blank page or generic "Your cart is empty" Tailwind-template copy

### Contract for Task 3 — sold-out PDP state
**Check type:** behavioral
**Command:** Set one product's inventory to 0 in Supabase staging, then visit `/products/{that-slug}`. Confirm the ATC button is disabled and renders the copy "Out of stock".
**Expected:** Disabled ATC with "Out of stock" label
**Fail if:** ATC is still enabled or shows a different message

### Contract for Phase — full build & typecheck
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npm run build 2>&1 | tail -1`
**Expected:** Build succeeds (last line indicates success, no error count)
**Fail if:** Build fails or any task introduced a TS error
