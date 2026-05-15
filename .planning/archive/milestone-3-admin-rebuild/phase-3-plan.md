---
phase: 3
milestone: 3
goal: "Rebuild product editor (sectioned, ≤350 LOC), order detail (unified view + manual creation), customer detail (purchase history + cohort tagging) — all consuming the shared Table primitive and a single admin-service deep module."
tasks: 3
waves: 2
requirements: [ADMIN-04, ADMIN-05, ADMIN-06]
---

# Phase 3: Product / Order / Customer Rebuilds

**Goal:** When this phase is done, an Aquad'or operator can:
1. Edit any product through a sectioned editor (Basics / Pricing / Variants / Images / Description / SEO) with Zod-validated inline errors — the single editor file ≤ 350 LOC, replacing the 568-LOC `ProductForm.tsx` monolith. Image management is URL-input-first (per M3 ROADMAP risk note; Phase 4 backfills Supabase Storage upload).
2. Open any order in a unified detail view showing payment status, customer panel, line items, and editable fulfillment notes — and create a manual (non-Stripe) order from `/admin/orders/new`.
3. Open any customer detail and see purchase history (Table primitive), summary metrics (orders, total spend, average order), and assign cohort tags (`vip`, `repeat`, `cold`, `lattafa-buyer`, custom).

**Why this phase:** Phase 2 shipped the dashboard + Table primitive + filterable list views. The list views currently click through to either monolithic forms (products) or 404s (orders detail does not exist as `/admin/orders/[id]`). Without these detail/editor surfaces, the operator cannot actually run the business from the admin — only browse it.

**Phase 2 deliverables consumed:** `src/components/ui/Table.tsx` (shared Table primitive — the only table abstraction allowed in admin), the admin shell + nav, the period selector + filter patterns proven on list pages.

**Voice:** admin-direct. Functional copy only — "Save changes", "Mark fulfilled", "Refund this line", "New customer", "Add line item". No editorial register; admin pages are tools, not journal spreads.

**Image management scope:** URL input only. Operators paste a hosted image URL into the Images section; the editor stores it on `products.images[]`. No file picker, no Supabase Storage upload in this phase. Phase 4 (Blog Editor + Settings) introduces the Storage upload pattern and that pattern will be backfilled into the product editor in M4 polish. This is the ONLY scope reduction in this plan and it is explicitly sanctioned by the M3 ROADMAP risk note.

---

## Wave Graph

| Task | Writes | Reads (deps) | Wave |
|---|---|---|---|
| T1 — Product editor (sectioned) + admin-service.ts foundation | `src/lib/supabase/admin-service.ts` (CREATE), `src/components/admin/ProductEditor.tsx` (CREATE), `src/components/admin/product-editor/*.tsx` (CREATE — 6 section files), `src/app/admin/products/page.tsx` (MODIFY), `src/app/admin/products/[id]/page.tsx` (MODIFY), `src/app/admin/products/new/page.tsx` (MODIFY) | Phase 2 Table primitive at `src/components/ui/Table.tsx`; PROJECT/DESIGN | 1 |
| T2 — Order detail (create route) + manual order create | `src/app/admin/orders/[id]/page.tsx` (CREATE — route does NOT exist yet), `src/app/admin/orders/new/page.tsx` (REWRITE), `src/components/admin/OrderDetail.tsx` (CREATE), `src/app/api/admin/orders/route.ts` (EXTEND — POST handles `source: 'manual'`) | T1's `src/lib/supabase/admin-service.ts` (read only — order namespace) | 2 |
| T3 — Customer detail + cohort tagging | `src/app/admin/customers/[id]/page.tsx` (REWRITE — currently broken: 'placeholder' email join), `src/components/admin/CustomerDetail.tsx` (CREATE), `src/app/api/admin/customers/[id]/cohorts/route.ts` (CREATE), `supabase/migrations/{timestamp}_customer_cohorts.sql` (CREATE — `customer_cohorts` table) | T1's `src/lib/supabase/admin-service.ts` (read only — customer namespace) | 2 |

**Serialization rationale:** All three tasks would extend `src/lib/supabase/admin-service.ts`. Two tasks writing the same file in the same wave = guaranteed merge conflict in parallel execution. Solution: Task 1 establishes `admin-service.ts` with ALL three namespaces (`products.*`, `orders.*`, `customers.*`) exported in one pass. Tasks 2 and 3 then only IMPORT from it — no further writes to that file. Tasks 2 and 3 touch entirely disjoint routes (`orders/` vs `customers/`) and disjoint components, so they parallelize cleanly in Wave 2.

---

## Task 1 — Sectioned Product Editor + admin-service.ts foundation (ADMIN-04)

**Wave:** 1
**Persona:** frontend
**Files:**
- CREATE `src/lib/supabase/admin-service.ts` — deep module exporting three namespaces: `products` (`getProductById`, `updateProduct`, `createProduct`, `deleteProduct`, `listProducts`), `orders` (`getOrderById`, `listOrdersForCustomer`, `createManualOrder`, `updateFulfillmentNotes`, `listOrders`), `customers` (`getCustomerById`, `getCustomerOrders`, `getCustomerSummary`, `listCohortsForCustomer`, `assignCohort`, `removeCohort`, `listCustomers`). Uses `createServerClient` (session-scoped) for reads on RLS-protected tables; uses `createAdminClient` ONLY when an operation legitimately requires service-role (e.g., reading the full `orders` table across customers for the operator dashboard). Each function returns `{ data, error }` shape. No throwing.
- CREATE `src/components/admin/ProductEditor.tsx` — coordinating client component, ≤ 200 LOC. Owns: Zod schema (`productSchema`), `react-hook-form` form state (`useForm<z.infer<typeof productSchema>>`), Tabs primitive (from `src/components/ui/Tabs.tsx`) with six tabs, submit handler calling `admin-service.products.updateProduct` or `createProduct`. Exports `<ProductEditor product={product | null} mode="edit" | "create" />`.
- CREATE `src/components/admin/product-editor/ProductBasics.tsx` — ≤ 120 LOC. Fields: name, slug (auto-derived w/ override), category (Select), brand (Input), gender (Select: women/men/unisex), product_type (Select: perfume/oil/lotion), active (Switch).
- CREATE `src/components/admin/product-editor/ProductPricing.tsx` — ≤ 100 LOC. Fields: price (number, EUR), compare_at_price (number, optional), cost (number, optional, for margin calc), in_stock (Switch), stock_count (number, optional).
- CREATE `src/components/admin/product-editor/ProductVariants.tsx` — ≤ 150 LOC. Repeatable rows (`useFieldArray`): variant_size (e.g. "50ml", "100ml"), variant_price, variant_sku. "Add variant" button below the list. Empty state: "No variants. This product sells as a single SKU."
- CREATE `src/components/admin/product-editor/ProductImages.tsx` — ≤ 120 LOC. URL-input list (`useFieldArray` on `images[]`): each row = URL Input + small thumbnail preview (`<img src>` only, no `next/image` to avoid host whitelisting for arbitrary URLs) + remove button. "Add image URL" button. Reorder via up/down arrow buttons (no drag-and-drop in this phase — keyboard-accessible buttons satisfy a11y and avoid `react-dnd` dependency).
- CREATE `src/components/admin/product-editor/ProductDescription.tsx` — ≤ 80 LOC. Fields: short_description (Textarea, 200 char limit), description (Textarea, multi-line, no rich text — Tiptap arrives in Phase 4 for blog and is NOT applied to products in M3). notes_top / notes_heart / notes_base (Textarea, comma-separated note lists).
- CREATE `src/components/admin/product-editor/ProductSEO.tsx` — ≤ 80 LOC. Fields: meta_title (Input, char counter, ≤ 60), meta_description (Textarea, char counter, ≤ 160), canonical_url (Input, optional).
- MODIFY `src/app/admin/products/[id]/page.tsx` — strip the existing 60-LOC `useEffect` boilerplate; rewrite as Server Component that calls `admin-service.products.getProductById(id)` and renders `<ProductEditor product={product} mode="edit" />`. Pass `notFound()` from `next/navigation` if `product == null`.
- MODIFY `src/app/admin/products/new/page.tsx` — Server Component that renders `<ProductEditor product={null} mode="create" />`.
- MODIFY `src/app/admin/products/page.tsx` — confirm it imports `Table` from `@/components/ui/Table` (Phase 2 deliverable). If `ProductsTable.tsx` still wraps it, that wrapper is allowed PROVIDED it's the only consumer-side abstraction and it uses the ui Table internally (verified by grep). No ad-hoc `<table>` JSX permitted.
- DELETE (after parity confirmed) `src/components/admin/ProductForm.tsx` — the 568-LOC monolith. Builder MUST verify no remaining import via `grep -r "from '@/components/admin/ProductForm'" src/` before deleting; if any consumer is missed, replace its import with `ProductEditor` first.

**Depends on:** none (Wave 1)

**Why:** The current `ProductForm.tsx` is 568 LOC of unbroken JSX — fields are not grouped, error handling is `alert()`, and three different `useState` hooks track derivative state that `react-hook-form` would own for free. ADMIN-04 mandates ≤ 350 LOC for the single coordinating file and section grouping. Beyond LOC: a flat form is unworkable for ~30 product fields on mobile, and the operator's most-frequent edits (price, stock, active flag) are buried below the fold. Sectioning is the unblock.

**Acceptance Criteria:**
- `/admin/products/[id]` renders the editor in six Tabs (Basics, Pricing, Variants, Images, Description, SEO) — operator can switch tabs without losing in-progress edits in other tabs (form state persists across tab switches because Tabs only swap visible panels, not the underlying form context).
- Submitting with `name=""` shows an inline error adjacent to the Name input within 100ms (Zod via `react-hook-form`); page does NOT navigate; no `alert()` calls anywhere in the editor or its sections.
- Submitting with `price=-5` shows an inline error "Price must be ≥ 0" adjacent to the Price input; submit is blocked.
- Successful save shows a Toast "Product saved" and the URL stays on `/admin/products/[id]` (no redirect; the operator typically saves and continues editing).
- `wc -l src/components/admin/ProductEditor.tsx` returns ≤ 200; every file under `src/components/admin/product-editor/` returns ≤ 150 LOC; `src/app/admin/products/[id]/page.tsx` returns ≤ 80 LOC.
- The Images section accepts at least one URL row, previews the image (broken-image fallback if URL is invalid), and persists the URL into `products.images[]` on save.
- The legacy `src/components/admin/ProductForm.tsx` file is removed AND `grep -r "ProductForm" src/` returns no imports (only the deletion commit message may mention it).

**Action:**
1. Build `admin-service.ts` first with the full three-namespace surface — even the customer and order functions Tasks 2 and 3 will call. Each function is ≤ 30 LOC: scope a Supabase client (`createServerClient()` from `@/lib/supabase/server`), run a single query, return `{ data, error }`. For mutating operations on `products`, use `.update().eq('id', id).select().single()` so the caller gets the updated row back. Reference SEC-01..04 fixes from Phase 1 — `createAdminClient` is used ONLY for cross-tenant reads where the operator legitimately needs to see all data; never in a path that accepts user input that determines what gets read.
2. Define the Zod schema in `ProductEditor.tsx`:
   ```ts
   const productSchema = z.object({
     name: z.string().min(1, 'Name is required').max(200),
     slug: z.string().regex(/^[a-z0-9-]+$/, 'Lowercase, numbers, hyphens only'),
     category: z.enum(['women','men','niche','lattafa-original','al-haramain-originals','victorias-secret-originals']),
     brand: z.string().min(1),
     gender: z.enum(['women','men','unisex']),
     product_type: z.enum(['perfume','essence-oil','body-lotion']),
     active: z.boolean(),
     price: z.number().min(0, 'Price must be ≥ 0'),
     compare_at_price: z.number().min(0).optional().nullable(),
     in_stock: z.boolean(),
     stock_count: z.number().int().min(0).optional().nullable(),
     variants: z.array(z.object({ size: z.string(), price: z.number().min(0), sku: z.string().optional() })),
     images: z.array(z.string().url('Must be a valid URL')),
     short_description: z.string().max(200),
     description: z.string(),
     notes_top: z.string(),
     notes_heart: z.string(),
     notes_base: z.string(),
     meta_title: z.string().max(60).optional().nullable(),
     meta_description: z.string().max(160).optional().nullable(),
     canonical_url: z.string().url().optional().nullable().or(z.literal('')),
   });
   ```
   Verify these field names match `src/lib/supabase/types.ts` exactly before coding. If the schema diverges from the DB column names, either update the schema or write a serializer in `admin-service.products.updateProduct`.
3. Compose with `react-hook-form` + `@hookform/resolvers/zod`: `const form = useForm({ resolver: zodResolver(productSchema), defaultValues: product ?? defaultProduct })`.
4. Each section component receives `form` via prop and uses `form.register('field')` + `form.formState.errors.field` to display errors. The shared `Input` primitive from M1 already accepts an `error` prop — pass it directly.
5. The Tabs primitive from `src/components/ui/Tabs.tsx` wraps the six section components. The form HTML element wraps the Tabs (so submit triggers across all tabs). Submit button lives outside Tabs in a sticky footer that always renders.
6. On submit success, call `toast.success('Product saved')` via the M1 Toast primitive. On error, `toast.error(error.message)`.
7. After confirming the editor saves a real product end-to-end, run `grep -r "from '@/components/admin/ProductForm'" src/` — replace each remaining import with `ProductEditor`. Then delete `ProductForm.tsx`.

**Validation:** (builder runs before commit)
- `wc -l src/components/admin/ProductEditor.tsx src/components/admin/product-editor/*.tsx src/app/admin/products/\[id\]/page.tsx` — confirm all under cap
- `grep -r "ProductForm" src/` — must return zero matches after deletion
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` — must be `0`
- `grep -c "from '@/components/ui/Table'" src/app/admin/products/page.tsx src/components/admin/ProductsTable.tsx` — must be `≥ 1` (Table primitive is wired into the products list view)
- `grep -c "createAdminClient" src/lib/supabase/admin-service.ts` — note count and confirm each usage has a justifying comment line above it (e.g. `// service-role: dashboard cross-tenant read`)
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/products/{any-real-id}` — must be `200` (after logging in as admin)

**Context:** Read @/home/qualia/Projects/aquador/.planning/PROJECT.md, @/home/qualia/Projects/aquador/.planning/DESIGN.md, @/home/qualia/Projects/aquador/.planning/ROADMAP.md (Phase 3.3 section), @/home/qualia/Projects/aquador/src/lib/supabase/types.ts, @/home/qualia/Projects/aquador/src/components/admin/ProductForm.tsx (the file you are replacing — read it to understand every field the current schema needs), @/home/qualia/Projects/aquador/src/components/ui/Tabs.tsx, @/home/qualia/Projects/aquador/src/components/ui/Input.tsx, @/home/qualia/Projects/aquador/src/components/ui/Table.tsx, @/home/qualia/Projects/aquador/src/lib/supabase/server.ts, @/home/qualia/.claude/rules/security.md

**Design:**
- Register: product (admin tool — functional density wins over editorial breathing room)
- Tokens used: `var(--color-bone)` page surface, `var(--color-ink)` headings, `var(--color-neutral-700)` body text, `var(--color-gold)` save button, `var(--color-oxblood)` destructive (delete image row), `--space-4` field gaps, `--space-6` between sections
- Scope: page + component cluster
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/components/admin/ProductEditor.tsx src/components/admin/product-editor/` pre-commit; commit blocked on critical findings. Particular watches: hardcoded hex, raw Tailwind colors (`text-yellow-500` etc.), inline `style={{ ... }}` attributes outside of the image preview's `<img>` sizing.

---

## Task 2 — Unified Order Detail Route + Manual Order Creation (ADMIN-05, ADMIN-06)

**Wave:** 2
**Persona:** frontend
**Files:**
- CREATE `src/app/admin/orders/[id]/page.tsx` — Server Component, ≤ 80 LOC. Calls `admin-service.orders.getOrderById(id)` + `admin-service.customers.getCustomerById(order.customer_email)` in parallel. Renders `<OrderDetail order={order} customer={customer} />`. Calls `notFound()` if order is null.
- REWRITE `src/app/admin/orders/new/page.tsx` — Server Component shell + client island for the form. Confirm whether the existing `/admin/orders/new/page.tsx` already does manual creation; if it's a real implementation, extend rather than replace. If it's a placeholder, rewrite.
- CREATE `src/components/admin/OrderDetail.tsx` — client component, ≤ 280 LOC. Three-column layout on desktop (collapses to stacked on `<768px`):
  - **Left (payment panel):** Stripe payment_intent_id, payment status (Badge: pending / paid / refunded / failed), amount paid (EUR), payment method (e.g. "Visa •••• 4242"), created_at timestamp, "Refund this order" button (calls `/api/admin/orders/[id]/refund` — but if that endpoint isn't built yet, render the button disabled with tooltip "Refunds: contact Stripe dashboard" — do NOT skip the button entirely).
  - **Center (line items):** Table primitive showing product name, variant size, quantity, unit price, line total. Each row has a "Refund this line" button (disabled if `source === 'manual'` — manual orders have no Stripe payment to refund against).
  - **Right (customer + notes):** Customer card (name, email, phone if present, link to `/admin/customers/[id]`), shipping address block, fulfillment_status Select (pending / processing / fulfilled / cancelled), fulfillment_notes Textarea with autosave-on-blur via `admin-service.orders.updateFulfillmentNotes(orderId, notes)`. Shows "Saved" indicator next to the textarea when the save completes.
- CREATE `src/components/admin/ManualOrderForm.tsx` — client component, ≤ 220 LOC. Form sections:
  - **Customer:** "Existing customer" Select (search by email, populated from `admin-service.customers.listCustomers({ limit: 50, search })` — debounced 300ms) OR "New customer" toggle that reveals name/email/phone Inputs.
  - **Line items:** Repeatable rows (`useFieldArray`) — product Select (search products by name, populated from `admin-service.products.listProducts({ limit: 50, search })`), quantity Input, unit price Input (defaults to product price but editable for one-off discounts), line total auto-calculated.
  - **Total + notes:** auto-summed total displayed, override Input (optional), fulfillment_notes Textarea.
  - Submit POSTs to `/api/admin/orders` with `{ source: 'manual', customer: {...}, line_items: [...], total, notes }`. On success: redirect to `/admin/orders/[new-order-id]`.
- EXTEND `src/app/api/admin/orders/route.ts` — add POST handler for `source: 'manual'` orders. Zod-validate body. Confirm middleware auth covers this route (already does per Phase 1 SEC fixes). Insert into `orders` table with `source: 'manual'`, `payment_status: 'manual'`, no Stripe payment_intent_id. Return `{ id, redirect: '/admin/orders/[id]' }`. DO NOT call Stripe. DO NOT trigger webhook handlers. DO NOT send confirmation emails (operators handle that manually for off-platform orders). Verify the existing Stripe webhook handler at `src/app/api/webhooks/stripe/route.ts` filters by event type `payment_intent.succeeded` (it should — re-confirm by grep) so it cannot pick up a manually inserted `orders` row.

**Depends on:** Task 1 (consumes `admin-service.orders.*` and `admin-service.customers.*` and `admin-service.products.listProducts`)

**Why:** ADMIN-05 mandates a unified view because the current `/admin/orders` is list-only — the operator has no way to see line items, payment status, OR customer context for a single order without spelunking Supabase. ADMIN-06 mandates manual order creation because Aquad'or sells in-person at popup events in Limassol; those sales need a record in `orders` for revenue accounting but never go through Stripe. The `/admin/orders/[id]` route does not currently exist on disk (`ls src/app/admin/orders/[id]/` → ENOENT) — the orders list links to nowhere. This task creates the route.

**Acceptance Criteria:**
- `/admin/orders/[id]` renders for any real order ID: payment panel, line items table, customer panel all populated from real Supabase data (verified by reading a known order row from `orders` table and confirming the rendered values match).
- Updating the fulfillment_status Select dispatches `admin-service.orders.updateOrder(id, { fulfillment_status })` and persists — confirmed by changing the dropdown, refreshing the page, and seeing the new value retained.
- Typing in the fulfillment_notes Textarea and blurring saves the note to Supabase and shows a "Saved" indicator within 1 second; reloading the page shows the saved note.
- `/admin/orders/new` renders the manual order form. Submitting with a new customer and one line item creates a row in `orders` with `source = 'manual'` (verified by querying `orders WHERE source = 'manual' ORDER BY created_at DESC LIMIT 1` after submit) and redirects to the new order's detail page.
- The Stripe webhook handler (`src/app/api/webhooks/stripe/route.ts`) is confirmed to filter on `event.type === 'payment_intent.succeeded'` and will NEVER act on a manually inserted order — verified by grep + the manual-order test (insert one, confirm no email triggers fire).
- Manual orders do not appear to have triggered any Stripe charge — confirmed by checking the Stripe test-mode dashboard after submit (no new PaymentIntent shows up).
- The Table primitive from `@/components/ui/Table` is the ONLY table abstraction used in `OrderDetail.tsx` for the line items table — confirmed by `grep -c "from '@/components/ui/Table'" src/components/admin/OrderDetail.tsx` ≥ 1 AND `grep -c "<table" src/components/admin/OrderDetail.tsx` = 0.

**Action:**
1. Implement the missing `admin-service.orders.*` and `admin-service.customers.*` functions if Task 1 left any gaps — Task 1's contract was to lay down the full surface, but verify by `grep -c "export.*orders" src/lib/supabase/admin-service.ts` returns the expected function count before consuming.
2. Build `OrderDetail.tsx`:
   - The fulfillment notes autosave uses `onBlur` (not a debounce timer — operators expect "leave the field = save" semantics in admin tools). `useTransition` wraps the save call so the input doesn't lock during the network round-trip.
   - The "Refund this line" button stays in the UI even if the refund API isn't built yet — render it `disabled` with a tooltip explaining "Refunds: Stripe dashboard (line-level refunds arrive in M4)". This is NOT scope reduction — it's an honest, observable affordance that tells the operator what the system can and cannot do. Hiding the button would teach the wrong mental model.
3. Build `ManualOrderForm.tsx`:
   - The customer search is debounced 300ms (use a small inline debounce hook or `useDeferredValue` — React 19 ships this).
   - The product search reuses the same pattern.
   - Submit handler: `await fetch('/api/admin/orders', { method: 'POST', body: JSON.stringify({...}) })`, then `router.push(\`/admin/orders/\${id}\`)` on success.
   - On error: Toast + keep form state (do not clear inputs).
4. Extend `/api/admin/orders/route.ts` POST handler:
   - Zod schema for `manualOrderSchema` requires `source: 'manual'`, validates customer (existing email OR new customer with email + name), validates line_items array (≥ 1), validates total ≥ 0.
   - If a new customer, insert into `customers` first, capture the id, then insert into `orders`.
   - Wrap the multi-table insert in a Supabase RPC if available, otherwise do it sequentially and roll back on failure (delete the customer row if the order insert fails).
   - Return `{ id: order.id }` (the client redirects).
5. Confirm webhook contract:
   - `grep -A 5 "event.type" src/app/api/webhooks/stripe/route.ts` — should show `payment_intent.succeeded` (or similar Stripe event filter). Document the finding in the task commit message.

**Validation:**
- `test -f src/app/admin/orders/\[id\]/page.tsx && echo EXISTS` — must echo `EXISTS`
- `grep -c "from '@/components/ui/Table'" src/components/admin/OrderDetail.tsx` — must be `≥ 1`
- `grep -c "<table" src/components/admin/OrderDetail.tsx` — must be `0` (no raw `<table>` markup)
- `grep -c "source.*manual" src/app/api/admin/orders/route.ts` — must be `≥ 1`
- `grep -c "payment_intent.succeeded\|payment_intent\\.succeeded" src/app/api/webhooks/stripe/route.ts` — must be `≥ 1` (webhook filter exists, so manual orders are safe)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` — must be `0`
- `wc -l src/components/admin/OrderDetail.tsx src/components/admin/ManualOrderForm.tsx src/app/admin/orders/\[id\]/page.tsx` — confirm OrderDetail ≤ 280, ManualOrderForm ≤ 220, page ≤ 80

**Context:** Read @/home/qualia/Projects/aquador/.planning/PROJECT.md, @/home/qualia/Projects/aquador/.planning/DESIGN.md, @/home/qualia/Projects/aquador/.planning/ROADMAP.md (Phase 3.3 section, especially the manual order risk note), @/home/qualia/Projects/aquador/src/lib/supabase/types.ts (for `orders`, `customers` shapes), @/home/qualia/Projects/aquador/src/app/api/admin/orders/route.ts (current state), @/home/qualia/Projects/aquador/src/app/api/webhooks/stripe/route.ts (confirm event filter), @/home/qualia/Projects/aquador/src/components/ui/Table.tsx, @/home/qualia/Projects/aquador/src/components/admin/OrdersTable.tsx (Phase 2's list view — your detail page is what its rows click into), @/home/qualia/Projects/aquador/src/lib/supabase/admin-service.ts (after Task 1 lands), @/home/qualia/.claude/rules/security.md

**Design:**
- Register: product (admin tool)
- Tokens used: `var(--color-bone)` page surface, `var(--color-neutral-100)` panel surfaces, `var(--color-gold)` primary actions, `var(--color-oxblood)` refund/destructive actions, Badge tokens (`--badge-paid`, `--badge-pending`, `--badge-refunded` — map to existing semantic tokens), `--space-6` between panels, `--space-3` within panels
- Scope: page + component cluster
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/components/admin/OrderDetail.tsx src/components/admin/ManualOrderForm.tsx src/app/admin/orders/` pre-commit

---

## Task 3 — Customer Detail Page + Cohort Tagging (ADMIN-06 extension)

**Wave:** 2
**Persona:** frontend
**Files:**
- CREATE `supabase/migrations/{timestamp}_customer_cohorts.sql` — creates `customer_cohorts` table:
  ```sql
  create table public.customer_cohorts (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references public.customers(id) on delete cascade,
    cohort text not null,
    assigned_at timestamptz not null default now(),
    assigned_by uuid references public.admin_users(id),
    unique (customer_id, cohort)
  );
  alter table public.customer_cohorts enable row level security;
  create policy "admin read cohorts" on public.customer_cohorts
    for select using (
      exists (select 1 from public.admin_users where admin_users.id = auth.uid())
    );
  create policy "admin write cohorts" on public.customer_cohorts
    for all using (
      exists (select 1 from public.admin_users where admin_users.id = auth.uid())
    ) with check (
      exists (select 1 from public.admin_users where admin_users.id = auth.uid())
    );
  create index customer_cohorts_customer_id_idx on public.customer_cohorts (customer_id);
  create index customer_cohorts_cohort_idx on public.customer_cohorts (cohort);
  ```
- REWRITE `src/app/admin/customers/[id]/page.tsx` — Server Component, ≤ 80 LOC. Replaces the current broken implementation (current code has a known bug — line ~31 hardcodes `eq('customer_email', '')` as a placeholder that never resolves to real orders). Calls `admin-service.customers.getCustomerById(id)`, `admin-service.customers.getCustomerOrders(id)`, `admin-service.customers.getCustomerSummary(id)`, `admin-service.customers.listCohortsForCustomer(id)` in parallel via `Promise.all`. Renders `<CustomerDetail customer={customer} orders={orders} summary={summary} cohorts={cohorts} />`. `notFound()` if customer null.
- CREATE `src/components/admin/CustomerDetail.tsx` — client component, ≤ 280 LOC. Layout:
  - **Top:** Customer header — name, email, phone, created_at, "New customer" Badge if `orders.length === 0`, otherwise nothing.
  - **Summary band:** Three MetricCards (reuse Phase 2's MetricCard) — Total Orders, Total Spend (EUR), Average Order Value. Pulls from `summary`.
  - **Cohort row:** Pills for each assigned cohort with × to remove. "Assign cohort" Select with predefined options (`vip`, `repeat`, `cold`, `lattafa-buyer`, `niche-buyer`, `gift-buyer`) plus a free-text "Custom..." option. Calls `POST /api/admin/customers/[id]/cohorts` to add; `DELETE` to remove. Optimistic UI: cohort pill appears immediately, rolls back on error.
  - **Order history:** Table primitive — columns: date, order #, total (EUR), payment status (Badge), fulfillment status (Badge), source (Badge: stripe / manual). Each row links to `/admin/orders/[id]`. Reverse-chronological default sort. Empty state if `orders.length === 0`: "No orders yet."
- CREATE `src/app/api/admin/customers/[id]/cohorts/route.ts` — auth-gated via middleware (already covers `/admin/*` and `/api/admin/*`). Three handlers:
  - `GET` — returns `admin-service.customers.listCohortsForCustomer(id)`.
  - `POST` — Zod-validates `{ cohort: string }` (max 32 chars, lowercase-hyphen pattern), calls `admin-service.customers.assignCohort(id, cohort, currentAdminUserId)`.
  - `DELETE` — Zod-validates `{ cohort: string }` from query string or body, calls `admin-service.customers.removeCohort(id, cohort)`.

**Depends on:** Task 1 (consumes `admin-service.customers.*` namespace)

**Why:** ADMIN-06's roadmap line names the customer detail page explicitly: "customer purchase history clearly". The current implementation is broken (placeholder `customer_email: ''` filter — confirmed by reading the file head). Beyond fixing that bug, cohort tagging is the smallest viable foundation for segment-driven marketing (e.g., "email the `vip` cohort about the new Lattafa drop"). Cohorts live in their own table so they don't pollute the `customers` schema and so multi-cohort assignment is natural. The scope is sanctioned by the phase goal ("customer list + detail with cohort tagging") in the orchestrator task prompt.

**Acceptance Criteria:**
- `/admin/customers/[id]` renders for any real customer ID: header, three MetricCards, cohort row, order history Table — all populated from real Supabase data (verified by manual page load and visual inspection against a known customer's row).
- The Total Spend MetricCard shows the EUR-formatted sum of `orders.total_amount` for that customer (cross-check against a direct SQL aggregate).
- The order history Table uses `@/components/ui/Table` exclusively — `grep -c "<table" src/components/admin/CustomerDetail.tsx` returns `0`.
- Assigning a cohort via the Select adds the cohort pill within 200ms (optimistic), persists to `customer_cohorts` (verified by SQL `SELECT * FROM customer_cohorts WHERE customer_id = '...'`), and re-renders correctly on a page refresh.
- Removing a cohort via the × button removes the pill and deletes the corresponding row in `customer_cohorts`.
- Assigning the same cohort twice does not create a duplicate row (unique constraint `(customer_id, cohort)` enforces this); a duplicate-attempt error surfaces as a Toast "Already tagged with vip" without throwing.
- The migration applies cleanly: `npx supabase migration up` exits 0 against local stack.
- RLS on `customer_cohorts` blocks anon access — confirmed by attempting to `select` as anon role: `supabase.from('customer_cohorts').select('*')` with anon client returns empty array or RLS error.

**Action:**
1. Write the migration first. Apply locally with `npx supabase migration up`. Verify the table exists and policies are in place with `npx supabase db diff` or by querying `pg_policies`.
2. Implement (or finalize) `admin-service.customers.listCohortsForCustomer`, `assignCohort`, `removeCohort` if Task 1 stubbed them — verify by grep before consuming. `assignCohort` uses `.upsert({ ... }, { onConflict: 'customer_id,cohort', ignoreDuplicates: true })` so the duplicate case becomes a no-op rather than an error.
3. Build the customer detail Server Component — parallel fetches via `Promise.all`. Pass typed props to the client component.
4. Build `CustomerDetail.tsx`:
   - Cohort assignment uses `useTransition` so the optimistic update + rollback feels instant.
   - Cohort Select renders the predefined cohorts as `<option>`s; the "Custom..." option toggles to a free-text Input.
   - MetricCard reused from Phase 2 — confirm it accepts `label`, `value`, `format?: 'currency' | 'number'` props; if the API differs, adapt.
5. Build the cohorts API route at `src/app/api/admin/customers/[id]/cohorts/route.ts`:
   - Extract `currentAdminUserId` from the Supabase server session — DO NOT trust a client-supplied admin id (SEC rule from `~/.claude/rules/security.md`: "Always check auth server-side").
   - On `POST`, Zod-validate the body, call `admin-service.customers.assignCohort(customerId, cohort, currentAdminUserId)`.
   - Return `{ ok: true, cohort }` on success.

**Validation:**
- `test -f supabase/migrations/*_customer_cohorts.sql && echo EXISTS` — `EXISTS`
- `grep -c "customer_cohorts" supabase/migrations/*_customer_cohorts.sql` — `≥ 3` (table create + 2 policies)
- `grep -c "from '@/components/ui/Table'" src/components/admin/CustomerDetail.tsx` — `≥ 1`
- `grep -c "<table" src/components/admin/CustomerDetail.tsx` — `0`
- `grep -c "customer_email.*''" src/app/admin/customers/\[id\]/page.tsx` — `0` (the placeholder bug is gone)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` — `0`
- `wc -l src/components/admin/CustomerDetail.tsx src/app/admin/customers/\[id\]/page.tsx` — CustomerDetail ≤ 280, page ≤ 80
- `npx supabase migration up` exits `0` (or migration already applied)

**Context:** Read @/home/qualia/Projects/aquador/.planning/PROJECT.md, @/home/qualia/Projects/aquador/.planning/DESIGN.md, @/home/qualia/Projects/aquador/.planning/ROADMAP.md (Phase 3.3), @/home/qualia/Projects/aquador/src/lib/supabase/types.ts (`customers`, `orders`), @/home/qualia/Projects/aquador/src/app/admin/customers/[id]/page.tsx (the current broken file — read to understand what's there), @/home/qualia/Projects/aquador/src/components/ui/Table.tsx, @/home/qualia/Projects/aquador/src/components/ui/Badge.tsx, @/home/qualia/Projects/aquador/src/components/ui/Select.tsx, @/home/qualia/Projects/aquador/src/lib/supabase/admin-service.ts (Task 1's output), @/home/qualia/.claude/rules/security.md, @/home/qualia/.claude/rules/infrastructure.md (RLS expectations)

**Design:**
- Register: product (admin tool)
- Tokens used: `var(--color-bone)` page, `var(--color-neutral-100)` cohort pill bg, `var(--color-gold-soft)` `vip` cohort pill bg (subtle differentiation), `var(--color-oxblood)` × remove icon hover, `--space-6` between panels, `--space-2` between cohort pills
- Scope: page + component cluster
- Anti-pattern guard: builder runs `node bin/slop-detect.mjs src/components/admin/CustomerDetail.tsx src/app/admin/customers/` pre-commit

---

## Success Criteria

- [ ] **ADMIN-04 satisfied** — `src/components/admin/ProductEditor.tsx` ≤ 200 LOC; each section file in `src/components/admin/product-editor/` ≤ 150 LOC; legacy `ProductForm.tsx` deleted; Zod inline errors visible without page navigation; URL-input-only Images section persists URLs to `products.images[]`.
- [ ] **ADMIN-05 satisfied** — `/admin/orders/[id]` renders unified detail (payment + customer + line items + notes); fulfillment notes autosave on blur; Table primitive is the only table abstraction in `OrderDetail.tsx`.
- [ ] **ADMIN-06 satisfied** — `/admin/orders/new` creates a `source: 'manual'` order without invoking Stripe; `/admin/customers/[id]` renders purchase history (Table primitive) + summary metrics + cohort tagging that persists to `customer_cohorts`.
- [ ] **Shared substrate intact** — `src/lib/supabase/admin-service.ts` is the single source of all admin queries for products/orders/customers; no admin route bypasses it with direct Supabase calls (verified by `grep -rn "createClient\|createServerClient\|createAdminClient" src/app/admin/ src/components/admin/` — direct client uses must be inside `admin-service.ts` only, excepting the existing list-page client components which still use the browser client; document any allowed exceptions in the commit message).
- [ ] **Table primitive enforced** — `grep -rn "<table" src/app/admin/ src/components/admin/` returns either zero matches or only matches inside `src/components/ui/Table.tsx` (the primitive itself).
- [ ] **No regressions** — `npm run build` exits 0; `npx tsc --noEmit` exits 0; existing Stripe checkout E2E test still passes (or is documented as pre-existing failure unrelated to this phase).
- [ ] **Security maintained** — `createAdminClient` usage in `admin-service.ts` carries a justifying comment per call; cohorts API authenticates via Supabase session (not a client-supplied admin id); RLS on `customer_cohorts` confirmed.

## Verification Contract

### Contract for Task 1 — admin-service.ts foundation
**Check type:** file-exists
**Command:** `test -f src/lib/supabase/admin-service.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File missing — Tasks 2 and 3 cannot import their query namespaces.

### Contract for Task 1 — admin-service three namespaces
**Check type:** grep-match
**Command:** `grep -cE "^export (const|async function) (products|orders|customers)" src/lib/supabase/admin-service.ts`
**Expected:** Non-zero (matches the namespace export pattern; alternative pattern `export const products = { ... }` also acceptable — see fallback below)
**Fail if:** Returns 0 AND `grep -c "export const products" src/lib/supabase/admin-service.ts` also returns 0 AND `grep -c "export const customers" src/lib/supabase/admin-service.ts` also returns 0. Verifier should accept any of these export idioms as long as Tasks 2 and 3 can import the relevant functions.

### Contract for Task 1 — ProductEditor LOC budget
**Check type:** command-exit
**Command:** `awk 'END{exit !($1<=200)}' <(wc -l src/components/admin/ProductEditor.tsx)`
**Expected:** exit code `0`
**Fail if:** ProductEditor.tsx exceeds 200 LOC — ADMIN-04 mandates ≤ 350 for the coordinating file; this plan tightens to 200 because the six sections own their own JSX.

### Contract for Task 1 — section files LOC budget
**Check type:** command-exit
**Command:** `bash -c 'for f in src/components/admin/product-editor/*.tsx; do n=$(wc -l < "$f"); if [ "$n" -gt 150 ]; then echo "OVERSIZE: $f $n"; exit 1; fi; done; echo OK'`
**Expected:** `OK`
**Fail if:** Any section file > 150 LOC.

### Contract for Task 1 — legacy ProductForm deleted
**Check type:** grep-match
**Command:** `test ! -f src/components/admin/ProductForm.tsx && echo DELETED`
**Expected:** `DELETED`
**Fail if:** File still exists. Phase 3 explicitly replaces it.

### Contract for Task 1 — no orphan ProductForm imports
**Check type:** grep-match
**Command:** `grep -rn "from '@/components/admin/ProductForm'" src/ | wc -l`
**Expected:** `0`
**Fail if:** Any import remains — would be an unresolvable module error.

### Contract for Task 1 — Zod schema wired
**Check type:** grep-match
**Command:** `grep -c "zodResolver\|z\\.object" src/components/admin/ProductEditor.tsx`
**Expected:** `≥ 2`
**Fail if:** Less than 2 matches — Zod schema isn't actually validating the form.

### Contract for Task 1 — TypeScript clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any compilation error.

### Contract for Task 2 — order detail route exists
**Check type:** file-exists
**Command:** `test -f "src/app/admin/orders/[id]/page.tsx" && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File missing — `/admin/orders/[id]` is currently a 404.

### Contract for Task 2 — OrderDetail consumes admin-service
**Check type:** grep-match
**Command:** `grep -c "admin-service\|admin_service" src/components/admin/OrderDetail.tsx src/app/admin/orders/\[id\]/page.tsx`
**Expected:** `≥ 1`
**Fail if:** Detail page or component bypasses admin-service with direct supabase calls.

### Contract for Task 2 — manual order source flag
**Check type:** grep-match
**Command:** `grep -c "source.*['\"]manual['\"]" src/app/api/admin/orders/route.ts`
**Expected:** `≥ 1`
**Fail if:** POST handler does not tag manual orders with `source: 'manual'` — webhook isolation breaks.

### Contract for Task 2 — no Stripe call in manual order path
**Check type:** grep-match
**Command:** `grep -c "stripe\\.paymentIntents\\.create\|stripe\\.checkout" src/app/api/admin/orders/route.ts`
**Expected:** `0`
**Fail if:** Manual order route invokes Stripe — violates ADMIN-06 ("creates Stripe-less order record").

### Contract for Task 2 — Table primitive in OrderDetail
**Check type:** grep-match
**Command:** `grep -c "from '@/components/ui/Table'" src/components/admin/OrderDetail.tsx`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — OrderDetail rolled its own table instead of using the shared primitive.

### Contract for Task 2 — no raw table markup
**Check type:** grep-match
**Command:** `grep -c "<table" src/components/admin/OrderDetail.tsx`
**Expected:** `0`
**Fail if:** Returns ≥ 1.

### Contract for Task 2 — webhook still filters on payment_intent.succeeded
**Check type:** grep-match
**Command:** `grep -cE "payment_intent\\.succeeded|payment_intent\\\\.succeeded" src/app/api/webhooks/stripe/route.ts`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — webhook contract regressed; manual orders could trigger duplicate side effects.

### Contract for Task 3 — cohorts migration exists
**Check type:** file-exists
**Command:** `bash -c 'ls supabase/migrations/*_customer_cohorts.sql 2>/dev/null && echo EXISTS'`
**Expected:** `EXISTS`
**Fail if:** Migration missing — `customer_cohorts` table doesn't exist.

### Contract for Task 3 — cohort RLS policies
**Check type:** grep-match
**Command:** `grep -cE "enable row level security|create policy" supabase/migrations/*_customer_cohorts.sql`
**Expected:** `≥ 3`
**Fail if:** Table created without RLS or without admin-only policies — security regression.

### Contract for Task 3 — customer detail placeholder bug removed
**Check type:** grep-match
**Command:** `grep -c "customer_email.*['\"][\"\\']" src/app/admin/customers/\[id\]/page.tsx`
**Expected:** `0`
**Fail if:** Returns ≥ 1 — the empty-string placeholder filter is still there; orders never resolve.

### Contract for Task 3 — CustomerDetail consumes admin-service
**Check type:** grep-match
**Command:** `grep -c "admin-service\|admin_service" src/app/admin/customers/\[id\]/page.tsx`
**Expected:** `≥ 1`
**Fail if:** Page bypasses admin-service.

### Contract for Task 3 — Table primitive in CustomerDetail
**Check type:** grep-match
**Command:** `grep -c "from '@/components/ui/Table'" src/components/admin/CustomerDetail.tsx`
**Expected:** `≥ 1`
**Fail if:** Returns 0.

### Contract for Task 3 — no raw table markup
**Check type:** grep-match
**Command:** `grep -c "<table" src/components/admin/CustomerDetail.tsx`
**Expected:** `0`
**Fail if:** Returns ≥ 1.

### Contract for Task 3 — cohorts API authenticates server-side
**Check type:** grep-match
**Command:** `grep -cE "createServerClient|getUser|getSession" src/app/api/admin/customers/\[id\]/cohorts/route.ts`
**Expected:** `≥ 1`
**Fail if:** Route does not derive the admin user from server session — would accept client-supplied admin id (security violation).

### Contract for Phase — Table primitive is sole abstraction
**Check type:** grep-match
**Command:** `bash -c 'count=$(grep -rln "<table" src/app/admin/ src/components/admin/ 2>/dev/null | wc -l); echo $count'`
**Expected:** `0`
**Fail if:** Returns ≥ 1 — some admin surface still ships raw `<table>` markup, violating the Phase 3.3 success criterion "all three tables use the shared Table primitive from `@/components/ui`".

### Contract for Phase — TypeScript clean across phase
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any compilation error introduced by Phase 3 changes.

### Contract for Phase — build green
**Check type:** command-exit
**Command:** `npm run build 2>&1 | tail -5`
**Expected:** Build output includes "Compiled successfully" or equivalent and exit code 0
**Fail if:** Build fails — phase cannot ship.

### Contract for Phase — each detail page reads real Supabase data
**Check type:** behavioral
**Command:** (verifier opens `/admin/products/{real-id}`, `/admin/orders/{real-id}`, `/admin/customers/{real-id}` in a logged-in admin session)
**Expected:** Each page renders real data matching the corresponding Supabase row (product name + price; order line items + total; customer email + order count).
**Fail if:** Any page shows empty values, "undefined", or stale/placeholder data.

### Contract for Phase — manual order end-to-end
**Check type:** behavioral
**Command:** (verifier submits `/admin/orders/new` with a new customer + 1 line item)
**Expected:** New row appears in `orders` table with `source = 'manual'`; Stripe test dashboard shows no new PaymentIntent; redirect lands on `/admin/orders/[new-id]` and renders the unified detail view.
**Fail if:** Stripe is called, or order is missing from the table, or redirect 404s.
