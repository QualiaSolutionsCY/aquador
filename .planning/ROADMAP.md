# Roadmap · Milestone 3 · Admin Rebuild

**Project:** Aquad'or
**Milestone:** 3 of 4 (CURRENT)
**Created:** 2026-05-15
**Phases:** 4
**Requirements covered:** SEC-01..04, DASH-01..05, ADMIN-01..08

See `JOURNEY.md` for the full project arc. This file is ONLY Milestone 3's phases.

## Exit Criteria

What "shipped" means for this milestone:

- `/api/admin/setup` CRITICAL security hole closed — no unauthenticated or env-flag-gated path to minting a `super_admin` exists on production
- Real dashboard renders live revenue / orders / AOV / customer LTV / top products from Supabase (no placeholder numbers)
- All admin tables (products, orders, customers) support column sort, multi-filter, and bulk actions via the `Table` primitive from M1
- Product / Order / Customer / Blog editors rebuilt — no monolithic form exceeds 350 LOC; blog autosave works; settings page persists real values

---

## Phases

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Admin Security & Reset | Close CRITICAL setup hole, move heartbeat to cron, fix sitemap adapter, audit live-chat RLS | SEC-01..04 | ready |
| 2 | Dashboard & Tables Framework | Real metrics dashboard (revenue / AOV / LTV / top products), Table primitive applied to all admin list views, bulk actions | DASH-01..05, ADMIN-01..03 | — |
| 3 | Product / Order / Customer Editors | Sectioned product editor ≤ 350 LOC, unified order detail, manual order creation, customer view | ADMIN-04..06 | — |
| 4 | Blog Editor + Settings | Tiptap autosave + image upload, settings page that persists real store values, admin nav cleanup | ADMIN-07..08 | — |

---

## Phase Details

### Phase 3.1: Admin Security & Reset

**Goal:** Close the CRITICAL `/api/admin/setup` auth bypass and eliminate the two HIGH security smells before any new admin-facing work begins. No new features ship until this phase is signed off.

**Depends on:** M1 (stack stable, RLS confirmed on 9 tables). M2 has no dependency on this phase — storefront is independent.

**Requirements covered:**
- SEC-01: `/api/admin/setup` removed (preferred) or gated by a per-request server-only secret with single-use semantics; env-flag-only model removed
- SEC-02: `/api/heartbeat` service-role POST eliminated; stale-row DELETE logic moves to `pg_cron` scheduled function or Supabase Edge Function cron; heartbeat ping becomes lightweight RLS-respecting anon `INSERT`
- SEC-03: `src/app/sitemap.ts` imports through `lib/supabase/public.ts`, not directly from `@supabase/supabase-js`
- SEC-04: Live-chat session routes (`/api/live-chat/*`) audited; RLS policies on `live_chat_sessions` confirmed or added

**Success criteria:**
1. `GET /api/admin/setup` and `POST /api/admin/setup` both return `404` or `405` on production; the route file is either deleted or the handler rejects all requests by default with no env-flag path to activation — confirmed by `curl -s -o /dev/null -w "%{http_code}" https://aquadorcy.com/api/admin/setup` returning 404 or 405.
2. `src/app/api/heartbeat/route.ts` no longer imports `createAdminClient`; the route's POST handler performs only an RLS-respecting anon `INSERT` into `site_visitors` (or is removed entirely); the DELETE-stale-rows logic exists as a `pg_cron` job or scheduled Edge Function confirmed via Supabase dashboard.
3. `src/app/sitemap.ts` line 2 imports from `@/lib/supabase/public` (or equivalent path alias), not from `@supabase/supabase-js` directly; `grep -r "from '@supabase/supabase-js'" src/app/sitemap.ts` returns 0 matches.
4. `/api/live-chat/*` routes are confirmed to use only the anon or user-scoped client (never `createAdminClient`); Supabase RLS policies on `live_chat_sessions` are documented and at minimum restrict reads to the owning session ID — verified by reading the migration files or via `supabase inspect`.
5. `npm run build` exits 0 and `npx tsc --noEmit` exits 0 after all changes — no regressions introduced by the security fixes.

**File / component touchpoints:**
- `src/app/api/admin/setup/route.ts` — delete or replace with a permanent 404 handler; document the Supabase Dashboard bootstrap path in `docs/RUNBOOK.md`
- `src/app/api/heartbeat/route.ts` — strip `createAdminClient`; replace DELETE logic with anon INSERT or remove route entirely if cron covers it
- `supabase/migrations/` — new migration for `pg_cron` stale-visitor cleanup (or schedule via Supabase Edge Function scheduler)
- `src/app/sitemap.ts` — swap direct SDK import for `lib/supabase/public.ts`
- `src/app/api/live-chat/` — read-only audit; add RLS migration if policies are missing

**Risks / pitfalls:**
- Deleting `/api/admin/setup` requires confirming that no admin user needs to be bootstrapped on the live instance. Check `admin_users` table row count before deleting. If an admin exists, delete the route. If not, bootstrap via Supabase Dashboard first, then delete.
- The `pg_cron` extension must be enabled on the Supabase project (`CREATE EXTENSION IF NOT EXISTS pg_cron`). Confirm it's available on the project's Supabase plan before writing the migration.
- The heartbeat endpoint may be called by UptimeRobot or an internal keep-alive. Confirm the caller before removing or changing the route — a broken heartbeat silently drops the UptimeRobot monitor.

---

### Phase 3.2: Dashboard & Tables Framework

**Goal:** Replace the placeholder admin dashboard with a real metrics view sourced from Supabase — revenue, order count, AOV, customer LTV, conversion rate, top products — and apply the `Table` primitive from M1 across all admin list views with sort, filter, and bulk actions.

**Depends on:** Phase 3.1 (security holes closed before new admin surface is built). M1 `Table` primitive must be available at `@/components/ui/Table`.

**Requirements covered:**
- DASH-01: Revenue (current period vs previous period) from `orders` table
- DASH-02: Order count, AOV, conversion rate (orders / sessions from Vercel Analytics API or proxy) rendered
- DASH-03: Customer count and LTV from `customers` + `orders` join
- DASH-04: Top 5 products by revenue and by units sold, with selectable period (7d / 30d / 90d)
- DASH-05: Recent orders table on dashboard with status, amount, customer name; click-through to order detail
- ADMIN-01: Products table — column sort, multi-filter (category, brand, in-stock, active), bulk activate/deactivate
- ADMIN-02: Orders table — sort by date / amount, filter by status, customer search
- ADMIN-03: Customers table — sort by created / total spend, filter by repeat vs first-time

**Success criteria:**
1. The admin dashboard (`/admin`) renders revenue total and order count for the current 30d period drawn from the `orders` table; the numbers change when new orders are added to Supabase — confirmed by inserting a test order row and refreshing the dashboard within 60 seconds.
2. The period selector (7d / 30d / 90d) on the top-products widget re-queries the database and updates the ranked list without a full page reload; the selected period is reflected in the URL or a client-side state variable that persists across tab switches within the admin session.
3. The products table at `/admin/products` supports column header click to sort by name, price, category, and active status; applying a category filter narrows the visible rows client-side or via a query param; selecting ≥ 2 rows enables a "Bulk activate" / "Bulk deactivate" action that persists to Supabase and refreshes the table on confirmation.
4. The orders table at `/admin/orders` supports filter by status (pending / paid / fulfilled / refunded) via a dropdown; typing ≥ 2 characters in the customer-search field narrows rows in real time (debounced ≥ 300ms); clicking any row navigates to `/admin/orders/[id]`.
5. The customers table at `/admin/customers` sorts by total spend descending by default; toggling "Repeat customers" filter shows only customers with ≥ 2 orders; all three tables use the shared `Table` primitive from `@/components/ui` — no ad-hoc `<table>` markup exists in the admin list pages after this phase.

**File / component touchpoints:**
- `src/app/admin/page.tsx` — rewrite dashboard with real metric cards; period selector
- `src/app/admin/_components/MetricCard.tsx` — new; uses `Card`, `Badge` primitives
- `src/app/admin/_components/TopProductsWidget.tsx` — new; period-selectable; uses `Tabs` or `Select`
- `src/app/admin/_components/RecentOrdersTable.tsx` — new; uses `Table` primitive
- `src/app/admin/products/page.tsx` — apply `Table` primitive; add filter + bulk-action toolbar
- `src/app/admin/orders/page.tsx` — apply `Table` primitive; status filter + customer search
- `src/app/admin/customers/page.tsx` — apply `Table` primitive; spend sort + repeat filter
- `src/app/api/admin/metrics/route.ts` — new server action or route; queries `orders` + `customers` aggregates; auth-gated via middleware; Zod-validated period param
- `src/lib/supabase/admin-service.ts` — new deep module; owns all dashboard query functions: `getRevenueMetrics(period)`, `getTopProducts(period, limit)`, `getCustomerMetrics()`, `getRecentOrders(limit)`

**Risks / pitfalls:**
- Conversion rate (DASH-02): Vercel Analytics does not expose a public REST API for session counts by default — the `@vercel/analytics` package is client-side only. Options: (a) proxy session counts through Vercel's Data API (requires `VERCEL_API_TOKEN` server-side), (b) derive a proxy metric from `site_visitors` if that table tracks visits, (c) display orders/day and label it "order rate" rather than "conversion rate". Decide before writing the metric card — do not fabricate session data.
- Aggregation queries on `orders` can be slow without indexes. Confirm `orders.created_at`, `orders.status`, `orders.product_id` are indexed (8 indexes were added in v1.1 — verify coverage before adding duplicate indexes).
- Bulk actions require optimistic UI + rollback on error. Use a `useTransition` pattern (React 19) so the UI updates immediately and rolls back if the Supabase mutation fails.

---

### Phase 3.3: Product / Order / Customer Editors

**Goal:** Replace the monolithic `ProductForm.tsx` (568 LOC) with a sectioned, validating editor; build a unified order detail view that shows payment + customer + line items + fulfillment notes; add a manual order creation flow; and ensure the customer detail page surfaces purchase history clearly.

**Depends on:** Phase 3.2 (Table primitive applied, list views done; order detail is reached by clicking through the orders table from 3.2).

**Requirements covered:**
- ADMIN-04: Product editor sectioned (basics / pricing / variants / images / description / SEO); validates with Zod; single file ≤ 350 LOC (current `ProductForm.tsx` is 568 LOC)
- ADMIN-05: Order detail view unifies payment status + customer info + line items + fulfillment notes in one page
- ADMIN-06: Manual order creation flow — operator inputs customer + items + amount; creates an order record without going through Stripe checkout

**Success criteria:**
1. `src/components/admin/ProductForm.tsx` (or its replacement) is deleted or reduced to ≤ 350 LOC; the product edit page at `/admin/products/[id]` renders the form in clearly labeled sections (Basics, Pricing, Variants, Images, Description, SEO) using a `Tabs` or accordion layout; no section is a scrolling wall of fields.
2. Submitting the product editor with an invalid field (e.g. blank name, negative price) renders inline field-level error messages without a page navigation; the Zod schema's error messages appear adjacent to the relevant field using the `Input` primitive's error state from M1.
3. The order detail page at `/admin/orders/[id]` shows on one screen: Stripe payment status, payment method, amount paid; customer name + email + link to customer detail; line items with product name, quantity, unit price; and a fulfillment notes text area that saves to Supabase on blur or explicit save.
4. The manual order creation form at `/admin/orders/new` (or modal) allows the operator to search for an existing customer by email or enter a new one, add at least one line item by product name + quantity, set a total amount, and submit — creating a record in the `orders` table with `source: 'manual'` and without calling Stripe.
5. The customer detail page at `/admin/customers/[id]` lists all orders for that customer (order date, amount, status) in reverse-chronological order using the `Table` primitive; a "total spend" and "order count" summary renders at the top of the page.

**File / component touchpoints:**
- `src/components/admin/ProductForm.tsx` — break into section components: `ProductBasics.tsx`, `ProductPricing.tsx`, `ProductImages.tsx`, `ProductDescription.tsx`, `ProductSEO.tsx`; each ≤ 150 LOC; coordinating `page.tsx` ≤ 80 LOC
- `src/app/admin/products/[id]/page.tsx` — thin coordinator; imports section components; owns Zod schema + form state via `useForm` or `useReducer`
- `src/app/admin/orders/[id]/page.tsx` — rewrite; unified payment + customer + items + notes view
- `src/app/admin/orders/new/page.tsx` — new manual order form; uses `Input`, `Select`, `Button` primitives; submits to `/api/admin/orders` POST
- `src/app/api/admin/orders/route.ts` — existing route; extend to handle `source: 'manual'` POST with Zod validation; confirm existing auth middleware covers the new method
- `src/app/admin/customers/[id]/page.tsx` — extend to show order history table; uses `Table` primitive + `MetricCard` for summary

**Risks / pitfalls:**
- Image management in the product editor (ADMIN-04 includes "images" section): the current form likely uses a URL field, not an upload. If Supabase Storage is not yet set up for product images, the image section becomes a URL input for now — do not block the rest of the editor on a storage implementation. Scope this explicitly at the start of the phase.
- Manual order creation (ADMIN-06) must not create a Stripe payment intent or charge anyone. Use `source: 'manual'` on the order record and skip all Stripe steps. The webhook handler must be confirmed to NOT pick up manually-inserted orders (it only processes `payment_intent.succeeded` events from Stripe — safe, but verify by reading the webhook route's event filter).
- The product editor's image section may involve `next/image` with Supabase Storage URLs. Confirm the Supabase Storage bucket is public-readable or that signed URLs are generated server-side — do not commit a pattern that leaks the service-role key to the client.

---

### Phase 3.4: Blog Editor + Settings

**Goal:** Fix the Tiptap blog editor (working save, autosave draft, image upload to Supabase Storage), rebuild the settings page so it actually persists real store values, and clean up the admin navigation so the sidebar reflects the rebuilt structure.

**Depends on:** Phase 3.3 (product/order/customer editors done; Supabase Storage pattern established in 3.3 is reused for blog image upload here).

**Requirements covered:**
- ADMIN-07: Blog editor (Tiptap) has working save, autosave draft, image upload to Supabase Storage
- ADMIN-08: Settings page persists at least: store contact info, shipping copy, free-shipping threshold, payment-method visibility flags

**Success criteria:**
1. Editing an existing blog post at `/admin/blog/[id]` and clicking "Save" persists the Tiptap HTML to Supabase `blog_posts.content` without a page reload; a success `Toast` appears; navigating away and returning shows the saved content — verified by saving, refreshing the page, and confirming the content matches what was saved.
2. Autosave fires ≥ 15 seconds after the last keystroke (debounced), updates the post with `status: 'draft'`, and shows a "Saved draft" indicator in the editor toolbar — without requiring a manual save action from the operator.
3. Uploading an image within the Tiptap editor inserts it into Supabase Storage under a `blog-images/` prefix and embeds the resulting public URL into the editor content; the upload shows a progress indicator and the image appears in the editor body within 5 seconds on a typical connection.
4. The settings page at `/admin/settings` renders form fields for: store contact email, shipping policy copy (textarea), free-shipping threshold (number input, EUR), and payment method toggles (card / Apple Pay / Google Pay). Saving the form persists all four values to a `store_settings` Supabase table (or equivalent key-value store); a second visit loads the persisted values — not empty fields.
5. The admin sidebar navigation lists only the sections that exist after this milestone (Dashboard, Products, Orders, Customers, Blog, Settings); no dead links or sections pointing to unbuilt pages; the active section is visually highlighted using the design token color system.

**File / component touchpoints:**
- `src/app/admin/blog/[id]/page.tsx` — extend with Tiptap autosave; add image upload handler
- `src/app/admin/blog/[id]/_components/BlogEditor.tsx` — new or refactor; Tiptap instance + save/autosave logic; image upload via `Input[type=file]` + Supabase Storage client
- `src/app/api/admin/blog-upload/route.ts` — new; auth-gated image upload to Supabase Storage; returns public URL; Zod-validates file type (image/*) and size (≤ 5MB)
- `src/app/admin/settings/page.tsx` — rewrite; real form with `Input`, `Textarea`, `Switch` primitives; submits to `/api/admin/settings`
- `src/app/api/admin/settings/route.ts` — new; GET returns current settings; PUT persists to `store_settings` table; auth-gated via middleware
- `supabase/migrations/` — new migration for `store_settings` table (id, key, value, updated_at) or a single-row settings record
- `src/app/admin/_components/AdminNav.tsx` — audit and clean up sidebar links; remove dead links; apply token-based active state

**Risks / pitfalls:**
- Supabase Storage RLS: the `blog-images/` bucket must allow authenticated admin users to upload but restrict public DELETE. Set bucket to public read, and write an RLS policy that allows INSERT only for `admin_users` members. Do not use `createAdminClient` in the upload route if the auth context can be established via the session cookie — use `createServerClient` with the user's session instead.
- Tiptap autosave and the manual "Save" button can race if the user edits and hits Save within the debounce window. Use a `ref`-based "last saved content" marker and skip the autosave mutation if the content matches the last manual save. Alternatively, cancel the debounce timer on manual save.
- `store_settings` schema: a key-value table is flexible but requires application-level schema enforcement. Define the canonical key names as constants in `src/lib/constants.ts` (`STORE_CONTACT_EMAIL`, `STORE_SHIPPING_COPY`, etc.) so typos in key lookups fail fast.

---

## Coverage Verification

Every M3 requirement maps to exactly one phase.

| Requirement | Phase | Covered? |
|-------------|-------|----------|
| SEC-01 | 3.1 | Yes |
| SEC-02 | 3.1 | Yes |
| SEC-03 | 3.1 | Yes |
| SEC-04 | 3.1 | Yes |
| DASH-01 | 3.2 | Yes |
| DASH-02 | 3.2 | Yes |
| DASH-03 | 3.2 | Yes |
| DASH-04 | 3.2 | Yes |
| DASH-05 | 3.2 | Yes |
| ADMIN-01 | 3.2 | Yes |
| ADMIN-02 | 3.2 | Yes |
| ADMIN-03 | 3.2 | Yes |
| ADMIN-04 | 3.3 | Yes |
| ADMIN-05 | 3.3 | Yes |
| ADMIN-06 | 3.3 | Yes |
| ADMIN-07 | 3.4 | Yes |
| ADMIN-08 | 3.4 | Yes |

---

## What M3 Explicitly Does Not Do

- Rebuild the storefront (M2 — done)
- Reach Lighthouse ≥ 90 on public routes (M4)
- Full Playwright cross-browser suite (M4)
- Per-page SEO metadata sweep (M4)
- Multi-language, multi-currency, loyalty, subscription (out of scope)
- Inventory ERP integrations (out of scope)

---

## Dependency Map

```
3.1 (Security) → 3.2 (Dashboard + Tables) → 3.3 (Editors) → 3.4 (Blog + Settings)
```

Each phase depends strictly on the previous. Phase 3.1 is a prerequisite for all admin work — its output (closed attack surface) is the precondition for safely building authenticated admin features in 3.2–3.4.

---

## When This Milestone Closes

Triggered by `/qualia-milestone` after `/qualia-verify` passes on Phase 3.4:

1. All phase artifacts archived to `.planning/archive/milestone-3-admin/`
2. `tracking.json` `milestones[]` gets a summary entry (num=3, name="Admin Rebuild", phases_completed=4)
3. REQUIREMENTS.md marks M3 requirements as **Complete**
4. M4 (Handoff) opens — roadmapper regenerates this ROADMAP.md for Milestone 4
5. `state.js init --force --milestone_name "Handoff"` resets current-phase fields, preserves lifetime + milestones[] history

---

*Last updated: 2026-05-15*
