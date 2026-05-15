---
phase: 2
milestone: 3
goal: "Real metrics dashboard (revenue / orders / AOV / conversion / LTV / top products) sourced from Supabase, served from a token-driven admin shell, with the shared Table primitive ready for Phase 3 consumption — and admin routes actually gated by middleware."
tasks: 5
waves: 3
---

# Phase 3.2 — Dashboard & Tables Foundation

**Goal:** When this phase ships, an authenticated admin lands on `/admin` and sees revenue (30d vs prior 30d), order count, AOV, conversion rate, customer LTV bucketing, top products, and a recent-orders table — all sourced from Supabase, never placeholder. The page is rendered inside a single token-driven `AdminShell` with sidebar + top bar; that same shell wraps `/admin/products`, `/admin/orders`, `/admin/customers` — all of which consume a single `AdminTable` primitive that's ready to host sort / filter / bulk-action behavior in Phase 3.3. Admin routes are gated by `src/middleware.ts` (not `src/proxy.ts`), so unauthenticated requests redirect to `/admin/login` before any of the above is reachable.

**Why this phase:** The Phase 1 verification flagged that `src/proxy.ts` is named for Next 16 and is therefore not loaded by the current Next 14.2.35 runtime — the entire admin surface is currently unauthenticated. Shipping a real dashboard onto an unprotected route would publish revenue numbers to the world. Activating middleware is the prerequisite; the dashboard + table-foundation work is the value-add operator outcome this milestone exists to deliver (DASH-01..05, ADMIN-01..03).

**Carry-forward constraints (from M1 / M2):**
- Tokens only — no raw hex (`#000`, `#fff`, `#D4AF37`), no Playfair, no `bg-gold` / `text-gold` magic strings. Use `var(--accent)`, `var(--fg)`, `var(--bg)` from `src/styles/tokens.css`.
- Hairline-divider stacks preferred over `Card` section wrappers for primary chrome. Card is reserved for true containers (a metric tile, a discrete dashboard widget) — never as a generic section wrapper.
- Voice: operator-direct (not storefront editorial) — but no exclamation marks, no emoji, no "Awesome!" / "Oops!" tone (PRODUCT.md §Brand voice). Admin copy stays measured.
- Real Supabase data only. No placeholder metrics. If a metric cannot be sourced (e.g. Vercel Analytics session counts are unavailable), document the fallback (`site_visitors` table) and ship the fallback — never fabricate.

**Data shape note (read before Wave 2):**
- `orders` table: `id, total, currency, status, items (jsonb), customer_email, order_source, created_at` — there is NO separate `order_items` table; line items are embedded in `orders.items` as JSON. The "top products" widget must aggregate by parsing the JSON server-side. Confirmed at `src/lib/supabase/types.ts` `orders` Row.
- `customers` table: `total_spent, total_orders, first_order_at, last_order_at` — LTV bucketing aggregates against these denormalized columns, no join required for the headline metric.
- `site_visitors` table: `session_id, last_seen, page` — used as the conversion-rate denominator (distinct sessions in the window). This is the planned fallback per the phase brief; Vercel Analytics Data API integration is explicitly out of scope.

---

## Task 1 — Activate middleware (rename proxy.ts → middleware.ts, rename `proxy` export → `middleware`)
**Wave:** 1
**Persona:** security
**Files:**
- `src/middleware.ts` (NEW — replaces `src/proxy.ts`; identical logic, renamed export)
- `src/proxy.ts` (DELETED)
- `src/middleware.test.ts` (NEW — at least one assertion that the matcher is recognized; can be a tsc-level smoke)

**Depends on:** none

**Why:** Phase 1 verification Finding C confirmed `src/proxy.ts` is invisible to Next 14.2.35 (only `src/middleware.ts` is auto-loaded; `proxy.ts` is the Next 16 future name). Until renamed, `/admin/*` is wide open — no session check, no `admin_users` lookup, no redirect. Shipping the dashboard before this fix would publish revenue numbers to anyone who guesses `/admin`. This must be Wave 1 and must land before any other Phase 2 task is reachable.

**Acceptance Criteria:**
- `src/middleware.ts` exists, exports `async function middleware(request: NextRequest)` and `export const config = { matcher: ['/api/:path*', '/admin/:path*'] }`.
- `src/proxy.ts` no longer exists.
- Unauthenticated `GET /admin` (any non-`/admin/login` admin path) returns a 307 redirect to `/admin/login` — verified by `curl -sI http://localhost:3000/admin | grep -i "location"` returning `Location: /admin/login`.
- Unauthenticated user with valid Supabase session but NO row in `admin_users` is redirected to `/admin/login?error=unauthorized`.
- `npm run build` exits 0; no warning about an ignored or misnamed middleware file.

**Action:**
1. `git mv src/proxy.ts src/middleware.ts` to preserve history.
2. In `src/middleware.ts`, rename the exported `async function proxy` → `async function middleware`. Leave the body byte-identical otherwise (the auth logic is correct per Phase 1 review; only the filename + export name were wrong).
3. Keep `export const config = { matcher: ['/api/:path*', '/admin/:path*'] }`.
4. Update `CLAUDE.md` §Middleware section's reference from `src/middleware.ts` (it already says this — verify it's accurate now). If `docs/RUNBOOK.md` references `proxy.ts` anywhere, update to `middleware.ts`.
5. Add `src/middleware.test.ts` — a single Jest test that imports `middleware` and `config` from `@/middleware` and asserts `config.matcher` includes `/admin/:path*` and `/api/:path*`. This guards against the file ever being renamed back.
6. Run `npm run dev` locally and `curl -sI http://localhost:3000/admin` to confirm the redirect.

**Validation:**
- `test -f src/middleware.ts && ! test -f src/proxy.ts && echo OK` → `OK`
- `grep -c "export async function middleware" src/middleware.ts` → `1`
- `grep -c "matcher.*admin" src/middleware.ts` → `1`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @.planning/phase-1-verification.md (Finding C verification), @src/proxy.ts (current logic to preserve), @CLAUDE.md §Middleware.

---

## Task 2 — `src/lib/supabase/admin-service.ts` — deep module owning all admin dashboard queries
**Wave:** 1
**Persona:** backend
**Files:**
- `src/lib/supabase/admin-service.ts` (NEW — exports `getRevenueMetrics`, `getOrderMetrics`, `getCustomerMetrics`, `getConversionRate`, `getTopProducts`, `getRecentOrders`, `Period` type)
- `src/lib/supabase/__tests__/admin-service.test.ts` (NEW — at minimum: unit tests for `parseOrderItemsForTopProducts` JSON aggregation pure function with 3 fixture orders; assert revenue and units rollup matches expected)

**Depends on:** none

**Why:** Pulling all dashboard aggregations behind a single deep module (`rules/architecture.md` §1) keeps the dashboard page a thin presentation layer and gives Phase 3.3 a stable surface to call. Inlining six different Supabase queries in `page.tsx` would lock the metric logic to the UI and force every metric tweak to retouch a client component. The `items`-JSON-aggregation pure function is the only non-trivial logic and must be unit-tested before the UI consumes it.

**Acceptance Criteria:**
- All six functions exported with strict TypeScript signatures and JSDoc one-liners stating what they return.
- `Period = '7d' | '30d' | '90d'` exported as a discriminated string-literal type; every function that takes a period accepts only this type.
- `getRevenueMetrics(period)` returns `{ current: number; previous: number; deltaPct: number; currency: 'EUR' }` — current period sum of `orders.total` WHERE `status IN ('paid','fulfilled')`, previous-period comparable, EUR-only per PROJECT.md.
- `getConversionRate(period)` returns `{ orders: number; sessions: number; rate: number; source: 'site_visitors' }` — distinct `session_id` from `site_visitors` in the period as denominator. The `source` field documents the data origin for the UI to display as a small caption ("via site visits").
- `getTopProducts(period, limit = 5)` returns `Array<{ productId: string; name: string; units: number; revenue: number }>` — aggregated by parsing `orders.items` JSON server-side via a pure helper `parseOrderItemsForTopProducts(orders)` exported from the same module and unit-tested.
- `getRecentOrders(limit = 10)` returns the latest `orders` joined with customer name where available, ordered by `created_at` desc.
- `getCustomerMetrics()` returns `{ total: number; repeatCount: number; avgLtv: number; ltvBuckets: { lt50: number; lt200: number; lt500: number; gte500: number } }` — sourced from `customers.total_spent` + `customers.total_orders`.
- Module uses the existing `lib/supabase/admin.ts` service-role client (server-only; never imported by a client component — enforced by an `import 'server-only'` directive at the top).
- All queries respect `npx supabase` types (`Database['public']['Tables'][...]['Row']`) — no `as any`.

**Action:**
1. Add `import 'server-only';` as the first line — guarantees this module never reaches the browser bundle.
2. Define `type Period = '7d' | '30d' | '90d'`. Define `periodToInterval(p: Period): { start: Date; end: Date; previousStart: Date; previousEnd: Date }` private helper.
3. Implement `getRevenueMetrics(period: Period)` — two `.from('orders').select('total').gte('created_at', start).lt('created_at', end).in('status', ['paid','fulfilled'])` queries; sum totals; compute `deltaPct = (current - previous) / previous` guarded against zero.
4. Implement `getOrderMetrics(period: Period): { count: number; aov: number }` — count + AOV against same filter.
5. Implement `getConversionRate(period: Period)` — `select('session_id', { count: 'exact', head: false })` from `site_visitors` with `gte('last_seen', start)` then distinct in code (or use `.select('session_id').then(rows => new Set(...).size)` since PostgREST doesn't expose DISTINCT directly). Orders count uses `getOrderMetrics`. Rate = orders / sessions.
6. Implement `parseOrderItemsForTopProducts(orders: { items: Json; total: number }[]): Array<{ productId; name; units; revenue }>` — pure function, no DB access, exported separately for testing. The function assumes `items` is `Array<{ id: string; name: string; quantity: number; unitPrice: number }>` matching the existing cart→order serialization. If `items` is null or shape is wrong, the function returns an empty array AND emits a `Sentry.captureMessage('admin-service: order.items shape unexpected', { extra: { orderId } })` — never throw, never block the dashboard.
7. Implement `getTopProducts(period, limit)` — fetch all orders in window, pass through `parseOrderItemsForTopProducts`, sort by revenue desc, take `limit`.
8. Implement `getRecentOrders(limit = 10)` — `.select('id, total, status, customer_email, customer_name, created_at, order_source').order('created_at', { ascending: false }).limit(limit)`.
9. Implement `getCustomerMetrics()` — single query against `customers`, then JS-side bucketing on `total_spent`.
10. Write `admin-service.test.ts` with three Jest cases for `parseOrderItemsForTopProducts`: (a) two orders sharing one product → units summed; (b) malformed `items` returns empty + does not throw; (c) revenue equals `quantity * unitPrice`, not `total / count`.

**Validation:**
- `test -f src/lib/supabase/admin-service.ts && echo EXISTS` → `EXISTS`
- `grep -c "^import 'server-only'" src/lib/supabase/admin-service.ts` → `1`
- `grep -cE "export (async )?function (getRevenueMetrics|getOrderMetrics|getCustomerMetrics|getConversionRate|getTopProducts|getRecentOrders|parseOrderItemsForTopProducts)" src/lib/supabase/admin-service.ts` → `7`
- `grep -c "as any" src/lib/supabase/admin-service.ts` → `0`
- `npm test -- src/lib/supabase/__tests__/admin-service.test.ts 2>&1 | grep -E "Tests:.*passed"` → matches pattern with ≥ 3 passing
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @src/lib/supabase/admin.ts (service-role client adapter), @src/lib/supabase/types.ts (`orders`, `customers`, `site_visitors` Row types), @.planning/PROJECT.md (EUR-only, server-side validation), @rules/architecture.md §1 (deep modules), @rules/security.md (server-only import).

---

## Task 3 — Rebuild `AdminShell` (sidebar + top bar) on token-driven primitives
**Wave:** 2
**Persona:** frontend
**Files:**
- `src/components/admin/AdminShell.tsx` (REWRITE — coordinator; ≤ 120 LOC)
- `src/components/admin/AdminSidebar.tsx` (REWRITE — token-only colors; active state via `usePathname`; ≤ 130 LOC)
- `src/components/admin/AdminTopBar.tsx` (NEW — replaces `AdminNavBar.tsx` + `AdminHeader.tsx`; ≤ 110 LOC)
- `src/components/admin/AdminNavBar.tsx` (DELETED)
- `src/components/admin/AdminHeader.tsx` (DELETED)
- `src/app/admin/layout.tsx` (MODIFIED — imports the rebuilt shell; no behavior change)

**Depends on:** Task 1 (middleware must be active before the shell is exercised; otherwise an unauthenticated viewer would render the chrome at all)

**Why:** The existing shell uses three components (AdminShell + AdminNavBar + AdminHeader + AdminSidebar = 481 LOC across the chrome) and pre-M1 ad-hoc Tailwind classes — confirmed at `src/components/admin/AdminShell.tsx`. Phase 2's success criterion requires the shell to be the single token-driven chrome consumed by every admin page; collapsing top bar + nav bar into one `AdminTopBar` removes a layer of incidental complexity and a third component the operator's eyes have to parse. Hairline-divider stacks replace bordered Cards for the chrome itself per the M2 constraint carried forward.

**Acceptance Criteria:**
- `AdminShell` renders a left sidebar (collapsible on mobile via `Drawer` primitive) + top bar + main content slot. No Card primitive used as a chrome wrapper — hairline `border-b` / `border-r` via `var(--border)`.
- Sidebar lists: Dashboard, Products, Orders, Customers, Blog, Settings — no dead links. The active item is highlighted via `var(--accent)` text + `var(--bg-alt)` background row (NOT via `bg-gold` magic class).
- Top bar shows: current section name (derived from `usePathname`), and a sign-out button (right-aligned) — no logo gold-shimmer animation.
- Typography respects DESIGN.md §3 — sidebar labels in `Geist` micro-UI font, section title in display font. No Playfair.
- Mobile (≤ 768px): sidebar collapses into a Drawer triggered by a hamburger `IconButton` in the top bar.
- All interactive elements have visible focus rings (`outline: 2px solid var(--accent)`); sign-out button uses `Button` primitive variant `ghost`.
- `grep -rE "bg-gold|text-gold|#D4AF37|#FFD700|Playfair" src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminTopBar.tsx` returns 0.

**Action:**
1. Read existing `AdminShell.tsx`, `AdminSidebar.tsx`, `AdminNavBar.tsx`, `AdminHeader.tsx` to capture every link target and any side effects (live-chat unread count, sign-out flow). Preserve those behaviors in the rewrite.
2. Write `AdminTopBar.tsx` — props: `{ onMobileMenuOpen: () => void }`. Renders hamburger `IconButton` (mobile only via Tailwind `md:hidden`), derives section title via `usePathname()` + a constant `SECTION_TITLES: Record<string, string>`, renders sign-out `Button` (calls `createClient().auth.signOut()` then `router.push('/admin/login')`).
3. Write `AdminSidebar.tsx` — props: `{ isOpen: boolean; onClose: () => void; liveChatCount?: number }`. Renders nav items from a `NAV_ITEMS` array (label + href + icon from `lucide-react`); active item computed via `pathname.startsWith(item.href)`. Uses `var(--border)` for the hairline right edge.
4. Rewrite `AdminShell.tsx` as a coordinator: `useState` for mobile drawer, `<aside>` for desktop sidebar (always visible at md+), `<Drawer>` for mobile, `<header>` containing `AdminTopBar`, `<main>` containing `children`. Wraps everything in a `<div data-admin-shell>` for E2E targeting.
5. Delete `AdminNavBar.tsx` and `AdminHeader.tsx` after confirming no other importers via `grep -rn "AdminNavBar\|AdminHeader" src/`.
6. Confirm `src/app/admin/layout.tsx` still imports `AdminShell` and nothing else — no changes needed unless the import path moved.

**Validation:**
- `! test -f src/components/admin/AdminNavBar.tsx && ! test -f src/components/admin/AdminHeader.tsx && echo OK` → `OK`
- `wc -l src/components/admin/AdminShell.tsx | awk '{print ($1 <= 120) ? "OK" : "TOO_LONG"}'` → `OK`
- `grep -rcE "bg-gold|text-gold|#D4AF37|#FFD700|Playfair" src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminTopBar.tsx | awk -F: '{s+=$2} END {print s}'` → `0`
- `grep -cE "var\(--accent\)|var\(--border\)|var\(--fg\)|var\(--bg" src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminTopBar.tsx | awk -F: '{s+=$2} END {print (s>=3)?"OK":"NO_TOKENS"}'` → `OK`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @.planning/DESIGN.md §2 (color tokens), §3 (typography), @src/components/ui/Drawer.tsx (primitive being consumed), @src/components/ui/Button.tsx, @src/components/ui/IconButton.tsx, @src/components/admin/AdminShell.tsx (current behavior to preserve).

**Design:**
- Register: product (admin chrome — operator-direct, not editorial — but DESIGN.md tokens still apply)
- Tokens used: `var(--bg)`, `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--border)`, `var(--border-strong)`
- Scope: app (chrome around every admin page)
- Anti-pattern guard: builder runs `grep -rE "bg-gold|text-gold|#[0-9A-Fa-f]{6}|Playfair" src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminTopBar.tsx` pre-commit; commit blocked on any match.

---

## Task 4 — `AdminTable` primitive wrapper + apply to `/admin/products`, `/admin/orders`, `/admin/customers`
**Wave:** 2
**Persona:** frontend
**Files:**
- `src/components/admin/AdminTable.tsx` (NEW — typed wrapper over `@/components/ui/Table`; ≤ 220 LOC. Exports `<AdminTable<T> columns rows onRowClick toolbar emptyState />`)
- `src/components/admin/AdminTableToolbar.tsx` (NEW — search input + filter slots + bulk-action slot; ≤ 140 LOC)
- `src/app/admin/products/page.tsx` (REWRITE — consumes `AdminTable`; no ad-hoc `<table>` markup; uses existing `getAllProducts` from `src/lib/supabase/product-service.ts`)
- `src/app/admin/orders/page.tsx` (REWRITE — consumes `AdminTable`; uses new `getRecentOrders` from Task 2 with `limit` raised to all)
- `src/app/admin/customers/page.tsx` (REWRITE — consumes `AdminTable`; uses new `getCustomerMetrics` plus a listing query; default sort `total_spent` desc)
- `src/components/admin/ProductsTable.tsx` (DELETED — replaced by inline column defs in products/page.tsx)
- `src/components/admin/OrdersTable.tsx` (DELETED — same)
- `src/components/admin/CustomersTable.tsx` (DELETED — same)

**Depends on:** Task 2 (orders/customers pages call admin-service), Task 3 (pages render inside the new shell)

**Why:** REQ ADMIN-01..03 mandate column sort, multi-filter, and bulk actions across all three admin list views, consumed from the M1 `Table` primitive. Three handwritten table components currently coexist (ProductsTable, OrdersTable, CustomersTable) — confirmed at `src/components/admin/`. Collapsing them onto one `AdminTable` wrapper means Phase 3.3's editor work inherits sort + filter for free and the "click row → open editor" wiring is centralized. The toolbar gets its own component because filter shape varies per resource (products filter by category/brand/stock/active; orders by status; customers by repeat-vs-first) — keeping the toolbar pluggable lets each page declare its own filter chips without forking the wrapper.

**Acceptance Criteria:**
- `AdminTable<T>` accepts `columns: Array<{ key: string; header: string; accessor: (row: T) => ReactNode; sortable?: boolean; sortFn?: (a: T, b: T) => number }>`, `rows: T[]`, `onRowClick?: (row: T) => void`, `toolbar?: ReactNode`, `emptyState?: ReactNode`, `selectable?: boolean` (renders checkbox column), `onSelectionChange?: (selectedRowIds: Set<string>) => void`.
- Column header click toggles `asc → desc → none` and reorders rows client-side via the `sortFn`. Visual indicator (caret) shown on the active sort column.
- `selectable` adds a checkbox column at index 0; selecting ≥ 1 row emits via `onSelectionChange` — the consumer page renders bulk-action buttons in the toolbar slot when the selection set is non-empty.
- Products page: shows name, category, brand, price (EUR formatted), stock, active status; sortable on name / price / category / active; selectable; toolbar shows category multi-select, brand multi-select, "In stock only" Switch, "Active only" Switch, and (when selection non-empty) "Bulk activate" / "Bulk deactivate" buttons that call the existing `updateProduct` mutation and refresh the list. Filter state syncs to URL params (`?category=...&brand=...&inStock=1&active=1`) so the view is shareable.
- Orders page: shows id (last 8 chars), customer (name fallback to email), total (EUR), status (Badge), created_at (relative time); sortable by created_at desc default + by total; filter dropdown for status (pending / paid / fulfilled / refunded); customer-search `Input` filters by email or name with ≥ 300ms debounce; clicking a row navigates to `/admin/orders/[id]`.
- Customers page: shows name (fallback email), email, total_orders, total_spent (EUR, default sort desc), first_order_at relative; sortable by total_spent / total_orders / first_order_at; toolbar Switch "Repeat customers only" filters where `total_orders >= 2`; clicking a row navigates to `/admin/customers/[id]`.
- All three pages use the rebuilt `AdminShell` from Task 3 (verified visually by the section title appearing in the top bar).
- Empty state: when `rows.length === 0` after filtering, `emptyState` renders centered; default is the string "No matches" in `var(--fg-muted)` — never blank.
- Loading state: while data is fetching, an `AdminTable` Skeleton renders 5 placeholder rows using the M1 `Skeleton` primitive.
- `grep -rE "<table[^>]*>" src/app/admin/products/page.tsx src/app/admin/orders/page.tsx src/app/admin/customers/page.tsx` returns 0 — no raw table markup in the page files.

**Action:**
1. Write `AdminTable.tsx` as a thin wrapper over `@/components/ui/Table` (which already provides sticky header, base styles, column-definition shape per PRIM-05). Add sort state via `useState<{ key: string; dir: 'asc' | 'desc' | null }>`. Sorted rows derived via `useMemo`. Selection state via `useState<Set<string>>`.
2. Write `AdminTableToolbar.tsx` — flex row with a left slot (search + filters) and a right slot (bulk actions). Renders the search `Input` (debounced via a `useDebouncedValue` hook — implement inline or extract to `src/hooks/`). Hides bulk-action slot until selection non-empty.
3. Rewrite `src/app/admin/products/page.tsx` as a server component shell + client island for filter state. Use `useSearchParams` + `useRouter` for URL-sync. Bulk activate/deactivate uses `useTransition` to keep the UI responsive and rollback on error. Reuse the existing `getAllProducts` (don't re-implement product fetching).
4. Rewrite `src/app/admin/orders/page.tsx` — fetch via `getRecentOrders(500)` from `admin-service.ts` (Task 2); render the full list. Status badges colored via tokens: paid → `var(--accent)`, fulfilled → `var(--accent-deep)`, refunded → `var(--critical)`, pending → `var(--fg-muted)`. NO red/green raw hex.
5. Rewrite `src/app/admin/customers/page.tsx` — add a new query function to `admin-service.ts` if needed (`listCustomers(opts: { sortBy?: 'total_spent' | 'total_orders' | 'first_order_at'; sortDir?: 'asc' | 'desc' }): Promise<Customer[]>`); if so, extend Task 2's exports list and adjust the validation grep count accordingly (this is a planner-sanctioned addition since it is the natural extension of `getCustomerMetrics`, not new scope).
6. Delete `ProductsTable.tsx`, `OrdersTable.tsx`, `CustomersTable.tsx` after confirming no other importers via `grep -rn "ProductsTable\|OrdersTable\|CustomersTable" src/`.

**Validation:**
- `test -f src/components/admin/AdminTable.tsx && test -f src/components/admin/AdminTableToolbar.tsx && echo OK` → `OK`
- `! test -f src/components/admin/ProductsTable.tsx && ! test -f src/components/admin/OrdersTable.tsx && ! test -f src/components/admin/CustomersTable.tsx && echo OK` → `OK`
- `grep -rcE "<table[^>]*>" src/app/admin/products/page.tsx src/app/admin/orders/page.tsx src/app/admin/customers/page.tsx | awk -F: '{s+=$2} END {print s}'` → `0`
- `grep -rcE "AdminTable" src/app/admin/products/page.tsx src/app/admin/orders/page.tsx src/app/admin/customers/page.tsx | awk -F: '{s+=$2} END {print (s>=3)?"OK":"MISSING_WIRING"}'` → `OK`
- `grep -c "useDebouncedValue\|setTimeout.*300" src/components/admin/AdminTableToolbar.tsx` → `≥ 1`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @src/components/ui/Table.tsx (M1 primitive being wrapped), @src/components/ui/Skeleton.tsx (loading state), @src/components/ui/Switch.tsx, @src/components/ui/Select.tsx, @src/lib/supabase/product-service.ts (`getAllProducts` to reuse), @src/lib/currency.ts (EUR formatting), @.planning/REQUIREMENTS.md (ADMIN-01..03 acceptance language).

**Design:**
- Register: product (operator UI; clarity over flourish)
- Tokens used: `var(--bg)`, `var(--fg)`, `var(--fg-muted)`, `var(--border)`, `var(--accent)`, `var(--accent-deep)`, `var(--critical)`
- Scope: app (table primitive consumed by 3 list pages)
- Anti-pattern guard: builder runs `grep -rE "bg-(red|green|blue|yellow|purple)-[0-9]|text-(red|green|blue|yellow|purple)-[0-9]" src/components/admin/AdminTable.tsx src/app/admin/products/page.tsx src/app/admin/orders/page.tsx src/app/admin/customers/page.tsx` pre-commit; any match blocks commit (raw Tailwind color soup is the v2.0 anti-pattern that M1/M2 retired).

---

## Task 5 — `/admin` dashboard page consuming admin-service + rendering MetricCard / TopProducts / RecentOrders
**Wave:** 3
**Persona:** frontend
**Files:**
- `src/app/admin/page.tsx` (REWRITE — server component coordinator; ≤ 180 LOC)
- `src/app/admin/_components/MetricCard.tsx` (NEW — displays one metric with optional delta arrow + caption; ≤ 90 LOC)
- `src/app/admin/_components/TopProductsWidget.tsx` (NEW — client island with `Tabs` for 7d/30d/90d; fetches via a server action exposed from admin-service; ≤ 160 LOC)
- `src/app/admin/_components/RecentOrdersWidget.tsx` (NEW — wraps `AdminTable` from Task 4 with the recent-10 dataset; row click → `/admin/orders/[id]`; ≤ 100 LOC)
- `src/app/admin/_components/LtvBuckets.tsx` (NEW — renders the four customer-LTV buckets as a horizontal hairline stack; ≤ 80 LOC)

**Depends on:** Task 2 (admin-service), Task 3 (shell), Task 4 (AdminTable for the Recent Orders widget)

**Why:** This is the headline deliverable of the phase — the operator's dashboard. It must render real numbers on first paint with no flash of placeholders. Server-component composition (`page.tsx` is `async`, calls `admin-service` directly, no client-side fetch waterfall) keeps TTFB low and avoids spinner-on-first-load. The period selector lives in `TopProductsWidget` only (a client island) because the top-products list is the only widget whose period the operator actually toggles per session — revenue / orders / AOV use a fixed 30d-vs-prior-30d window per DASH-01 phrasing and don't need a selector.

**Acceptance Criteria:**
- `/admin` renders six metric tiles in a responsive grid: Revenue (30d, with delta vs prior 30d), Order count (30d), AOV (30d), Conversion rate (30d, with caption "via site visits"), Customers (total), LTV avg.
- Each metric tile uses `MetricCard` — label (`Geist` micro-UI), value (display font, large), delta arrow + percentage when applicable (green-equivalent = `var(--accent)`, red-equivalent = `var(--critical)`).
- "Top products" widget: tabs for 7d / 30d / 90d; selecting a tab re-fetches and re-ranks via the server action without a full page reload; shows columns Product / Units / Revenue; top 5 by revenue with a secondary toggle to switch to "by units sold".
- "Recent orders" widget: renders the latest 10 orders via `AdminTable`; columns id / customer / total / status / created; row click navigates to `/admin/orders/[id]`.
- "Customer LTV" widget: shows the four buckets (`< €50`, `< €200`, `< €500`, `≥ €500`) with the count in each — rendered as a horizontal hairline stack (NOT a Card grid), values pulled from `getCustomerMetrics().ltvBuckets`.
- Real data only — verified by inserting a test row into `orders` and confirming the revenue tile delta moves on next refresh.
- No placeholder text. No "Coming soon" labels. If a query returns 0 (legitimately empty 7d window in a new store), the tile shows `0` / `€0.00` — not a skeleton, not a dash, not "no data".
- All copy in operator-direct voice: "Revenue" not "Revenue This Month!"; "AOV" not "Average Order Value (AOV)"; "Top products" not "🔥 Top Products". No exclamation marks, no emoji.
- Conversion rate tile renders the caption "via site visits" in `var(--fg-muted)` micro-UI font directly under the percentage — making the data source transparent to the operator (per PRODUCT.md voice "we address, we don't announce").

**Action:**
1. Make `src/app/admin/page.tsx` an `async` server component. Top of file: `import 'server-only'` (defensive — the imports below should also be server-only). Call `getRevenueMetrics('30d')`, `getOrderMetrics('30d')`, `getConversionRate('30d')`, `getCustomerMetrics()`, `getRecentOrders(10)` in `Promise.all`. Render layout.
2. `TopProductsWidget` is a client component — receives initial `30d` data as a prop; uses a server action `actions/getTopProductsAction(period)` defined in the same file (Next 14 server actions). On tab change, calls the action and updates state. Wrap action call in `useTransition`.
3. `MetricCard` is a pure presentation component — accepts `{ label, value, delta?, deltaDir?, caption? }`. Internal layout: label (top), value (middle, large), delta + caption (bottom row). Uses hairline `border-b` between tiles when stacked vertically on mobile; on desktop renders as a Card-as-tile (this is a legitimate Card use — a discrete metric container).
4. `RecentOrdersWidget` — `'use client'`; takes `orders: RecentOrder[]` prop, renders `<AdminTable rows={orders} columns={...} onRowClick={(o) => router.push('/admin/orders/' + o.id)} />`.
5. `LtvBuckets` — pure server component; takes `buckets: { lt50; lt200; lt500; gte500 }` and renders a horizontal flex row with 4 segments, each `value count` over `bucket label`, hairline dividers between (`border-r: 1px solid var(--border)`).
6. Connect everything in `page.tsx` — top-section: 6 MetricCards in a CSS grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6`). Middle: TopProductsWidget + LtvBuckets side by side on desktop. Bottom: RecentOrdersWidget full-width.
7. After implementation, manually verify with a Supabase test insert: `supabase` CLI → `INSERT INTO orders (total, status, currency, customer_email, items) VALUES (99.00, 'paid', 'EUR', 'qa@example.com', '[]'::jsonb)` — refresh `/admin`, confirm revenue tile increased by 99.00.

**Validation:**
- `test -f src/app/admin/_components/MetricCard.tsx && test -f src/app/admin/_components/TopProductsWidget.tsx && test -f src/app/admin/_components/RecentOrdersWidget.tsx && test -f src/app/admin/_components/LtvBuckets.tsx && echo OK` → `OK`
- `grep -cE "getRevenueMetrics|getOrderMetrics|getConversionRate|getCustomerMetrics|getRecentOrders" src/app/admin/page.tsx` → `≥ 5`
- `grep -cE "placeholder|Coming soon|TODO|lorem|TBD" src/app/admin/page.tsx src/app/admin/_components/*.tsx` → `0`
- `grep -cE "AdminTable" src/app/admin/_components/RecentOrdersWidget.tsx` → `1`
- `grep -cE "Tabs" src/app/admin/_components/TopProductsWidget.tsx` → `≥ 1`
- `grep -rcE "bg-gold|text-gold|#D4AF37|#FFD700|Playfair|🔥|⭐|💰" src/app/admin/page.tsx src/app/admin/_components/ | awk -F: '{s+=$2} END {print s}'` → `0`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`

**Context:** Read @.planning/REQUIREMENTS.md (DASH-01..05), @.planning/PRODUCT.md §Brand voice + §Three real users (Eleni — admin operator persona), @.planning/DESIGN.md §2 + §3 (tokens, typography), @src/lib/supabase/admin-service.ts (the queries — built in Task 2), @src/components/ui/Tabs.tsx, @src/components/ui/Card.tsx (used here legitimately for tile containers), @src/components/admin/AdminTable.tsx (Task 4 output).

**Design:**
- Register: product (operator dashboard — clarity, density, no flourish)
- Tokens used: `var(--bg)`, `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--accent-deep)`, `var(--critical)`, `var(--border)`; typography per DESIGN.md §3 (display for metric values, Geist for labels, Newsreader for captions)
- Scope: page (`/admin`)
- Anti-pattern guard: builder runs `grep -rE "🔥|⭐|💰|bg-(red|green|blue|yellow|purple)-[0-9]|#[0-9A-Fa-f]{6}|Playfair" src/app/admin/page.tsx src/app/admin/_components/` pre-commit; any match blocks commit.

---

## Success Criteria

Phase 2 ships when ALL of these are true:

- [ ] **Middleware active** — `src/middleware.ts` exists, `src/proxy.ts` deleted; `curl -sI http://localhost:3000/admin` returns 307 with `Location: /admin/login`. (T1)
- [ ] **DASH-01 — Revenue current vs previous** — `/admin` renders a Revenue tile showing 30d sum from `orders` and the delta vs prior 30d. Inserting a test order moves the number within 60s. (T2, T5)
- [ ] **DASH-02 — Order count + AOV + Conversion rate** — three separate tiles render real values; conversion rate sources from `site_visitors` table and displays the "via site visits" caption. (T2, T5)
- [ ] **DASH-03 — Customer count + LTV** — Customers tile renders total count; LTV-buckets widget renders four counts; both sourced from `customers` table. (T2, T5)
- [ ] **DASH-04 — Top 5 products** — TopProductsWidget renders the top 5 by revenue with a 7d/30d/90d period selector and a by-revenue/by-units toggle; selection re-queries the server without a full page reload. (T2, T5)
- [ ] **DASH-05 — Recent orders table** — RecentOrdersWidget shows the latest 10 orders with status badge and customer; row click navigates to `/admin/orders/[id]`. (T2, T4, T5)
- [ ] **ADMIN-01 — Products table** — `/admin/products` consumes `AdminTable`, supports column sort (name / price / category / active), multi-filter (category, brand, in-stock, active), and bulk activate/deactivate on selected rows. Filter state in URL. (T4)
- [ ] **ADMIN-02 — Orders table** — `/admin/orders` consumes `AdminTable`, sorts by date and amount, filters by status, customer search input filters by name or email with ≥ 300ms debounce. (T4)
- [ ] **ADMIN-03 — Customers table** — `/admin/customers` consumes `AdminTable`, default sort `total_spent` desc, "Repeat customers only" filter toggles `total_orders >= 2`. (T4)
- [ ] **Shell rebuilt on tokens** — `AdminShell` + `AdminSidebar` + `AdminTopBar` use only design tokens (no raw hex, no `bg-gold`, no Playfair); legacy `AdminNavBar` / `AdminHeader` / `ProductsTable` / `OrdersTable` / `CustomersTable` deleted. (T3, T4)
- [ ] **TypeScript clean** — `npx tsc --noEmit` exits 0. (T1-T5)
- [ ] **Build clean** — `npm run build` exits 0 with `✓ Compiled successfully`. (T1-T5)
- [ ] **Tests pass** — `npm test` exits 0 including new `admin-service.test.ts` cases. (T2)
- [ ] **No placeholder metrics** — `grep -rE "placeholder|Coming soon|TODO|lorem|stub" src/app/admin/page.tsx src/app/admin/_components/` returns 0. (T5)

---

## Verification Contract

### Contract for Task 1 — Middleware activation (file rename)
**Check type:** file-exists
**Command:** `test -f src/middleware.ts && ! test -f src/proxy.ts && echo OK`
**Expected:** `OK`
**Fail if:** Output is not exactly `OK` — either `src/middleware.ts` is missing or `src/proxy.ts` still exists (Next 14 ignores `proxy.ts`, so its presence indicates the rename was botched).

### Contract for Task 1 — Middleware export and matcher
**Check type:** grep-match
**Command:** `grep -c "export async function middleware" src/middleware.ts && grep -c "matcher.*admin" src/middleware.ts`
**Expected:** Two lines, each `1`
**Fail if:** Either grep returns 0 — the export name wasn't renamed from `proxy` or the matcher dropped `/admin/:path*`.

### Contract for Task 1 — Middleware redirects unauth admin requests (behavioral)
**Check type:** behavioral
**Command:** Start `npm run dev` then `curl -sI http://localhost:3000/admin | grep -i "^location:"`
**Expected:** `Location: /admin/login` (or `Location: http://localhost:3000/admin/login`)
**Fail if:** No `Location` header OR location does not contain `/admin/login` — middleware is loaded but auth check is not wired.

### Contract for Task 2 — admin-service.ts exists with server-only directive
**Check type:** grep-match
**Command:** `grep -c "^import 'server-only'" src/lib/supabase/admin-service.ts`
**Expected:** `1`
**Fail if:** Returns 0 — the module is missing the `server-only` import and could leak to the client bundle, exposing service-role-backed query patterns.

### Contract for Task 2 — All six metric functions + helper exported
**Check type:** grep-match
**Command:** `grep -cE "export (async )?function (getRevenueMetrics|getOrderMetrics|getCustomerMetrics|getConversionRate|getTopProducts|getRecentOrders|parseOrderItemsForTopProducts)" src/lib/supabase/admin-service.ts`
**Expected:** `7`
**Fail if:** Returns less than 7 — one or more required exports is missing; downstream tiles will break.

### Contract for Task 2 — admin-service unit tests pass
**Check type:** command-exit
**Command:** `npm test -- src/lib/supabase/__tests__/admin-service.test.ts 2>&1 | tail -20`
**Expected:** Output contains `Tests:` line with `passed` count ≥ 3 and `failed` count 0
**Fail if:** Any test fails OR test file does not exist — the JSON-aggregation pure function is the only non-trivial logic and must be proven before UI consumes it.

### Contract for Task 2 — No `as any` casts
**Check type:** grep-match
**Command:** `grep -c "as any" src/lib/supabase/admin-service.ts`
**Expected:** `0`
**Fail if:** Returns non-zero — type safety is mandatory for the data layer; `as any` indicates an unresolved Supabase Row type mismatch.

### Contract for Task 3 — Shell rebuild, legacy chrome deleted
**Check type:** file-exists
**Command:** `test -f src/components/admin/AdminShell.tsx && test -f src/components/admin/AdminTopBar.tsx && ! test -f src/components/admin/AdminNavBar.tsx && ! test -f src/components/admin/AdminHeader.tsx && echo OK`
**Expected:** `OK`
**Fail if:** Output is not `OK` — either the new top bar is missing or the legacy nav/header components weren't deleted.

### Contract for Task 3 — No raw colors or banned fonts in shell
**Check type:** grep-match
**Command:** `grep -rcE "bg-gold|text-gold|#D4AF37|#FFD700|Playfair|Poppins" src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminTopBar.tsx | awk -F: '{s+=$2} END {print s}'`
**Expected:** `0`
**Fail if:** Returns non-zero — the rebuild reintroduced the v2.0 magic-string color palette or banned typography.

### Contract for Task 3 — Tokens consumed in shell
**Check type:** grep-match
**Command:** `grep -rcE "var\(--(accent|border|fg|bg)" src/components/admin/AdminShell.tsx src/components/admin/AdminSidebar.tsx src/components/admin/AdminTopBar.tsx | awk -F: '{s+=$2} END {print (s>=3) ? "OK" : "MISSING_TOKENS"}'`
**Expected:** `OK`
**Fail if:** Returns `MISSING_TOKENS` — the rebuild did not consume design tokens; commit is blocked.

### Contract for Task 3 — AdminShell stays small
**Check type:** command-exit
**Command:** `wc -l src/components/admin/AdminShell.tsx | awk '{print ($1 <= 120) ? "OK" : "TOO_LONG_"$1}'`
**Expected:** `OK`
**Fail if:** Output is `TOO_LONG_<n>` — the shell coordinator drifted past 120 LOC; logic that belongs in sidebar/top bar leaked in.

### Contract for Task 4 — AdminTable wrapper + toolbar exist
**Check type:** file-exists
**Command:** `test -f src/components/admin/AdminTable.tsx && test -f src/components/admin/AdminTableToolbar.tsx && echo OK`
**Expected:** `OK`
**Fail if:** Output is not `OK` — primitive consumers in Phase 3 will have nothing to call.

### Contract for Task 4 — Legacy table components deleted
**Check type:** file-exists
**Command:** `! test -f src/components/admin/ProductsTable.tsx && ! test -f src/components/admin/OrdersTable.tsx && ! test -f src/components/admin/CustomersTable.tsx && echo OK`
**Expected:** `OK`
**Fail if:** Output is not `OK` — duplicate table implementations still in the tree; the next reader will pick the wrong one.

### Contract for Task 4 — No raw `<table>` markup in admin list pages
**Check type:** grep-match
**Command:** `grep -rcE "<table[^>]*>" src/app/admin/products/page.tsx src/app/admin/orders/page.tsx src/app/admin/customers/page.tsx | awk -F: '{s+=$2} END {print s}'`
**Expected:** `0`
**Fail if:** Returns non-zero — at least one page still hand-rolls a table; ADMIN-01..03 unsatisfied.

### Contract for Task 4 — AdminTable wired into all three list pages
**Check type:** grep-match
**Command:** `grep -lE "AdminTable" src/app/admin/products/page.tsx src/app/admin/orders/page.tsx src/app/admin/customers/page.tsx | wc -l`
**Expected:** `3`
**Fail if:** Returns less than 3 — one of the pages forgot to consume the primitive; the bulk-action / sort behavior is missing on that page.

### Contract for Task 4 — Debounced customer search wired
**Check type:** grep-match
**Command:** `grep -cE "useDebouncedValue|setTimeout.*[0-9]{3}|debounce" src/components/admin/AdminTableToolbar.tsx src/app/admin/orders/page.tsx | awk -F: '{s+=$2} END {print (s>=1)?"OK":"NO_DEBOUNCE"}'`
**Expected:** `OK`
**Fail if:** Returns `NO_DEBOUNCE` — customer search hits Supabase on every keystroke; ADMIN-02 acceptance language requires ≥ 300ms debounce.

### Contract for Task 4 — No raw Tailwind color soup in tables
**Check type:** grep-match
**Command:** `grep -rcE "bg-(red|green|blue|yellow|purple)-[0-9]|text-(red|green|blue|yellow|purple)-[0-9]" src/components/admin/AdminTable.tsx src/app/admin/products/page.tsx src/app/admin/orders/page.tsx src/app/admin/customers/page.tsx | awk -F: '{s+=$2} END {print s}'`
**Expected:** `0`
**Fail if:** Returns non-zero — the v2.0 status-color soup pattern leaked back in; use semantic tokens (`var(--accent)`, `var(--critical)`).

### Contract for Task 5 — Dashboard widget files exist
**Check type:** file-exists
**Command:** `test -f src/app/admin/page.tsx && test -f src/app/admin/_components/MetricCard.tsx && test -f src/app/admin/_components/TopProductsWidget.tsx && test -f src/app/admin/_components/RecentOrdersWidget.tsx && test -f src/app/admin/_components/LtvBuckets.tsx && echo OK`
**Expected:** `OK`
**Fail if:** Output is not `OK` — one or more dashboard widgets is missing.

### Contract for Task 5 — Dashboard wired to admin-service
**Check type:** grep-match
**Command:** `grep -cE "getRevenueMetrics|getOrderMetrics|getConversionRate|getCustomerMetrics|getRecentOrders" src/app/admin/page.tsx`
**Expected:** Non-zero, ≥ 5
**Fail if:** Returns less than 5 — the dashboard isn't calling the data layer; tiles render placeholder values.

### Contract for Task 5 — TopProductsWidget has period tabs
**Check type:** grep-match
**Command:** `grep -cE "Tabs|7d|30d|90d" src/app/admin/_components/TopProductsWidget.tsx`
**Expected:** `≥ 3`
**Fail if:** Returns less than 3 — the period selector is missing; DASH-04 unsatisfied.

### Contract for Task 5 — RecentOrdersWidget consumes AdminTable
**Check type:** grep-match
**Command:** `grep -c "AdminTable" src/app/admin/_components/RecentOrdersWidget.tsx`
**Expected:** `1`
**Fail if:** Returns 0 — the recent-orders display reverts to hand-rolled table markup, bypassing the primitive.

### Contract for Task 5 — No placeholder text on dashboard
**Check type:** grep-match
**Command:** `grep -rcE "placeholder|Coming soon|TODO|lorem|TBD|stub" src/app/admin/page.tsx src/app/admin/_components/ | awk -F: '{s+=$2} END {print s}'`
**Expected:** `0`
**Fail if:** Returns non-zero — a metric tile shipped without real data wiring.

### Contract for Task 5 — No emoji / no banned brand markers on dashboard
**Check type:** grep-match
**Command:** `grep -rEc "🔥|⭐|💰|✨|🎉|bg-gold|text-gold|#D4AF37|#FFD700|Playfair" src/app/admin/page.tsx src/app/admin/_components/ | awk -F: '{s+=$2} END {print s}'`
**Expected:** `0`
**Fail if:** Returns non-zero — voice / token violation; PRODUCT.md §Brand voice + DESIGN.md tokens unsatisfied.

### Contract (phase) — TypeScript and build clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS" && npm run build 2>&1 | grep -cE "(compiled successfully|✓ Compiled)"`
**Expected:** First line `0`, second line `≥ 1`
**Fail if:** TypeScript reports errors OR build does not log a compiled-successfully marker.

### Contract (phase) — Dashboard renders real revenue (behavioral, end-to-end)
**Check type:** behavioral
**Command:** (verifier action) Authenticate as an admin user; visit `/admin`; note the Revenue tile value. Insert a test order via `npx supabase` SQL: `INSERT INTO orders (total, status, currency, customer_email, items) VALUES (99.00, 'paid', 'EUR', 'qa+phase2@example.com', '[]'::jsonb);` Wait 60s; refresh `/admin`.
**Expected:** Revenue tile increases by exactly €99.00; recent-orders widget shows the new order at the top.
**Fail if:** Revenue tile is unchanged after refresh OR the new order does not appear in the recent-orders widget — dashboard is reading stale/mock data.

---

## Risks / pitfalls (carry forward into Wave 2)

- **Service-role exposure on dashboard:** Task 2's `admin-service.ts` MUST start with `import 'server-only'`. If the dashboard accidentally imports it from a `'use client'` component, Next 14 will fail the build with a "server-only" error — that's the intended guardrail. If the builder works around the error by removing the directive, the verifier must catch it via the Task-2-server-only contract.
- **Conversion-rate denominator skew:** `site_visitors` is heartbeat-driven; the rebuilt heartbeat (Phase 1) writes a row per session. Sessions vs unique visitors may diverge from Vercel Analytics in absolute numbers — that's expected and acceptable. The "via site visits" caption on the tile is the operator's honesty cue.
- **`orders.items` JSON shape:** The pure helper `parseOrderItemsForTopProducts` assumes the shape `Array<{ id; name; quantity; unitPrice }>` matching the cart-to-order serialization. The Stripe webhook reconstructs items from shortened metadata; confirm the shape via `select items from orders limit 5` against the live database BEFORE writing the unit tests. If the shape diverges, adjust the parser before Wave 2 starts. (The function emits a Sentry breadcrumb on malformed shape rather than crash, so the dashboard stays up — but the top-products list goes empty until corrected.)
- **Bulk activate/deactivate rollback:** Use React 19's `useTransition` so the UI updates immediately and rolls back on Supabase mutation error. Don't optimistically remove rows from the list — change the active column's badge state in place; if the mutation rejects, surface a Toast (`useToast` from M1 primitives) and revert.
- **Filter state in URL vs client state:** Products page filters in URL (shareable per ADMIN-01). Orders and Customers filters can stay client-side — Phase 3.3 may revisit if the operator asks for sharable filtered views.

---

## Dependency graph (machine-checkable)

| Task | Writes (intersection-critical) | Reads | Edges | Wave |
|------|-------------------------------|-------|-------|------|
| T1 — Middleware rename | `src/middleware.ts`, `src/proxy.ts` (delete), `src/middleware.test.ts` | `src/proxy.ts` content, `.planning/phase-1-verification.md` | none | 1 |
| T2 — admin-service | `src/lib/supabase/admin-service.ts`, `src/lib/supabase/__tests__/admin-service.test.ts` | `src/lib/supabase/admin.ts`, `src/lib/supabase/types.ts` | none | 1 |
| T3 — Shell rebuild | `src/components/admin/AdminShell.tsx`, `src/components/admin/AdminSidebar.tsx`, `src/components/admin/AdminTopBar.tsx`, delete AdminNavBar+AdminHeader, modify `src/app/admin/layout.tsx` | M1 primitives (Drawer, Button, IconButton), DESIGN.md, existing shell files | T1 (auth must gate the chrome before it renders) | 2 |
| T4 — AdminTable + 3 list pages | `src/components/admin/AdminTable.tsx`, `src/components/admin/AdminTableToolbar.tsx`, rewrite 3 admin list pages, delete 3 legacy table components | T2's `admin-service.ts`, M1 Table primitive, `src/lib/supabase/product-service.ts` | T2 (orders/customers pages call admin-service), T3 (pages render inside new shell) | 2 |
| T5 — Dashboard page | `src/app/admin/page.tsx`, `src/app/admin/_components/MetricCard.tsx`, `TopProductsWidget.tsx`, `RecentOrdersWidget.tsx`, `LtvBuckets.tsx` | T2's admin-service, T3's shell, T4's AdminTable | T2, T3, T4 | 3 |

T1 and T2 share zero writes → Wave 1 parallel-safe. T3 and T4 share zero writes (T3 touches `src/components/admin/Admin*Shell|Sidebar|TopBar.tsx` + delete navbar/header + layout.tsx; T4 touches `AdminTable.tsx` + `AdminTableToolbar.tsx` + 3 admin list `page.tsx` files + delete 3 table components — disjoint sets) → Wave 2 parallel-safe. T5 depends on all three predecessors and is alone in Wave 3.

---

*Plan written 2026-05-15 for Phase 3.2 (Dashboard & Tables Foundation). 5 tasks, 3 waves. Covers DASH-01..05, ADMIN-01..03, plus the carried-over middleware activation prerequisite from Phase 1 Finding C.*
