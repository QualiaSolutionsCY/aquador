---
phase: 3
goal: "Verify the production build is genuinely production-grade: full Playwright cross-browser suite + axe-core scans + manual keyboard-nav audit pass, Lighthouse scores ≥ 90 on the 4 core routes × 2 viewports, Stripe test-mode end-to-end on both payment surfaces lands an order in Supabase, and the Sentry error baseline + security re-audit are recorded so Handoff measures deltas against a known-good starting point."
tasks: 4
waves: 2
---

# Phase 3: Final QA

**Goal:** When this phase is done, `npm run test:e2e` exits 0 across chromium/firefox/webkit/mobile-chrome/mobile-safari with axe-core scans wired into every behavioral spec; 8 Lighthouse runs (4 routes × 2 viewports) all score ≥ 90 on Performance + Accessibility with LCP-mobile ≤ 2.5s / CLS ≤ 0.1 / TBT-desktop ≤ 200ms; Stripe test-card flows on BOTH the cart-checkout and custom-perfume surfaces complete end-to-end with a verified Supabase `orders` row; the Sentry error baseline is captured (top-5 unresolved + counts by severity) and a security re-audit (`npm audit`, no service_role in client code, RLS coverage via Supabase advisors, no hardcoded keys) is recorded; manual keyboard-nav audit is documented for the 4 core routes (focus visible, Tab reach, Escape closes drawer, focus trap on cart).

**Why this phase:** M4 P1 + P2 hardened the surface and shipped final content. P3 is the receipts. Without Playwright passing across 5 browsers, an axe-core baseline, a manual keyboard-nav walkthrough, Lighthouse numbers in `lighthouse-scores.md`, a green Stripe dry run on both payment surfaces, a Sentry baseline snapshot, and a fresh security re-audit, "ready for handoff" is a claim, not a fact. P3 produces the artifacts that let P4 (Handoff) be signed off without a deferred-defect list and lets HAND-04 measure unresolved-error delta against a real starting count.

---

## Task 1 — Playwright behavioral coverage + axe-core wiring across 8 QA-01 flows

**Wave:** 1
**Persona:** frontend
**Files:**
- `package.json` — add `@axe-core/playwright`, `lighthouse` (≥ 11.x), `chrome-launcher` to `devDependencies` in a SINGLE `npm install -D` invocation. Also add the `"lighthouse": "node scripts/lighthouse-runs.mjs"` entry to the `scripts` block. T1 is the SOLE writer of `package.json` in this phase (T2 reads it; race condition avoided per plan-checker Issue 3).
- `e2e/_helpers/axe.ts` — NEW. Exports `runAxe(page, label)` that injects axe-core via `@axe-core/playwright`'s `AxeBuilder`, runs with the default ruleset, asserts `violations.filter(v => v.impact === 'critical').length === 0`, and on non-zero writes the violations to test annotations + fails with a clear message naming the rule IDs.
- `e2e/homepage.spec.ts` — NEW. Test 1: navigates `/`, asserts hero heading visible (locked H1 copy from M4 P2), asserts no critical console errors, runs `runAxe(page, 'home')`.
- `e2e/shop-filter-sort.spec.ts` — NEW. Test 1: navigates `/shop`, applies a category filter (clicks one of the editorial category chips), asserts URL contains `?category=...`, asserts product grid count changes vs unfiltered, switches sort to "Price low→high", asserts the first 3 prices are non-decreasing. Test 2: `runAxe(page, 'shop')` after filters applied.
- `e2e/pdp-add-to-cart.spec.ts` — NEW. Test 1: navigates to a known PDP slug (read from `e2e/fixtures/test-data.ts` — pick the first in-stock product), clicks "Add to cart", asserts cart drawer opens with 1 item + correct product name + correct price, closes drawer with Escape, asserts drawer hidden. Test 2: `runAxe(page, 'pdp')`.
- `e2e/checkout-redirect.spec.ts` — NEW. Test 1: adds a product to cart via the same fixture, opens cart drawer, clicks "Checkout", waits for the response from `/api/checkout` (assert 2xx + body has `url`), asserts navigation lands on `checkout.stripe.com` host (does NOT fill the hosted page — that's T3). Test 2: `runAxe(page, 'checkout-precheckout')` BEFORE the redirect (axe runs against `/cart` or the drawer-open state, not Stripe's domain).
- `e2e/create-perfume-steps.spec.ts` — NEW. Test 1: navigates `/create-perfume`, walks all 5 steps (top → heart → base → volume → review) using the same note selections as the existing `e2e/builder-and-concierge.spec.ts` (Bergamot+Lemon → Rose+Jasmine+Ylang-Ylang → Oud+Sandalwood → 100ml), asserts each step heading visible after Continue, stops at the "Continue to payment" button WITHOUT clicking it (payment is T3). Test 2: `runAxe(page, 'create-perfume-review')` on the final review step.
- `e2e/blog-flow.spec.ts` — NEW. Test 1: navigates `/blog`, asserts post grid renders ≥ 3 cards (M4 P2 SC#5 promised 3 published posts), clicks the first card, asserts `/blog/[slug]` loads with a 200 + an H1. Test 2: `runAxe(page, 'blog-index')` AND `runAxe(page, 'blog-post')`.
- `e2e/admin-login-redirect.spec.ts` — NEW. Test 1: navigates `/admin` UN-authenticated, asserts the response either redirects to `/admin/login` (302) or the resulting page URL ends in `/admin/login`. (Does NOT log in — the seeded-admin auth-required flows live behind the existing `testIgnore: '**/admin/**'` gate in `playwright.config.ts` and stay there.)
- `playwright.config.ts` — VERIFY only; no edit unless the existing `testIgnore: '**/admin/**'` gate would also skip `e2e/admin-login-redirect.spec.ts`. If it does, narrow the ignore to `'**/admin/**/*.spec.ts'` so the top-level `e2e/admin-login-redirect.spec.ts` (not under `e2e/admin/`) still runs. Confirm via `npx playwright test --list | grep admin-login-redirect`.
- `e2e/builder-and-concierge.spec.ts` — EDIT the existing concierge test only: where it currently `test.skip(!HAS_AI, ...)`, change the skip message to reference a GitHub issue (`'concierge requires OPENROUTER_API_KEY (or OPENAI_API_KEY fallback) in env — see GH issue #QA-AI-KEY-CI'`). Leave the Stripe-builder test alone (T3 fully owns it).

**Depends on:** none

**Why:** QA-01 demands a real cross-browser behavioral baseline + an axe-core accessibility baseline, both produced by `npm run test:e2e` in one run. The current `e2e/` directory has cart/contact/navigation/products specs but no spec that exercises the 8 QA-01 flows together with axe-core. Without these specs, "the suite passes" is a tautology — the suite doesn't test the things QA-01 names. Wiring axe into each behavioral spec (rather than as a separate run) means the accessibility budget travels with the behavioral budget: one regression, one red test.

**Acceptance Criteria:**
- `npm run test:e2e` exits 0 across all 5 configured projects (chromium, firefox, webkit, Mobile Chrome, Mobile Safari); the HTML reporter summary shows 0 failed and 0 skipped EXCEPT skips that reference a GitHub issue in their `test.skip(condition, 'message')` second arg.
- The 8 QA-01 flows are observably covered: `find e2e -name '*.spec.ts' | xargs grep -l "page.goto"` shows specs targeting `/`, `/shop`, `/products/`, `/cart` (drawer), `/api/checkout`, `/create-perfume`, `/blog`, `/admin`.
- Every behavioral spec invokes `runAxe(page, ...)` at least once; `grep -rc "runAxe(" e2e/` returns ≥ 7 (one per new spec file).
- No axe-critical violations on the 4 core routes (home / PDP / shop / checkout-precheckout) — verified by the specs themselves failing if any critical violation surfaces.

**Action:**
1. `npm install -D @axe-core/playwright lighthouse chrome-launcher` (single invocation — confirms all three land in `package.json` `devDependencies` in one write). Then add `"lighthouse": "node scripts/lighthouse-runs.mjs"` to `package.json` `scripts` block via Edit. This is the only `package.json` write in this phase — T2 reads but does NOT touch this file.
2. Write `e2e/_helpers/axe.ts` with the `runAxe` helper. Use `new AxeBuilder({ page }).analyze()`, filter `result.violations` to `impact === 'critical'`, and on non-empty fail with `throw new Error(\`axe critical violations on ${label}: ${ids.join(', ')}\`)`. Attach the full violations JSON to the test as an annotation so the HTML report shows it.
3. Author the 7 new spec files listed under **Files** above. For each spec, follow the existing `e2e/builder-and-concierge.spec.ts` style: typed imports from `@playwright/test`, `test.describe(...)` grouping, console-error capture filtered against the same dev-server noise allowlist (`'hot-update'`, `'Failed to load resource'`, `'Download the React DevTools'`).
4. For `e2e/pdp-add-to-cart.spec.ts` and `e2e/checkout-redirect.spec.ts`, read the in-stock product slug from `e2e/fixtures/test-data.ts`. If the fixture file does not yet expose a slug helper, add `export const ANY_IN_STOCK_SLUG = '...'` to it sourced from a Supabase query in dev (use `npx supabase` CLI to pick a real published slug — do NOT hardcode `'parchment-placeholder'`).
5. Edit `e2e/builder-and-concierge.spec.ts` ONLY at the concierge test's `test.skip` second arg to add the GH issue ref. Touch nothing else in that file (T3 owns the Stripe-builder test).
6. Verify `playwright.config.ts`'s `testIgnore` gate. If `'**/admin/**'` also matches the top-level `e2e/admin-login-redirect.spec.ts` (it should NOT — that file is at `e2e/`, not `e2e/admin/`), leave config untouched. If it does, narrow to `'**/admin/**/*.spec.ts'`.
7. Run `npm run test:e2e --project=chromium` first as a smoke check, then full `npm run test:e2e` and assert exit 0. Iterate on selectors until stable — prefer `getByRole`/`getByText` over CSS selectors per Playwright docs.
8. Confirm Jest baseline is not regressed: `npm test` exits 0 with the 184/184 baseline preserved (this task only touches `e2e/` + `package.json` devDeps + one helper file; no Jest spec is touched).

**Validation:** (builder self-check)
- `test -f e2e/_helpers/axe.ts && grep -q "AxeBuilder" e2e/_helpers/axe.ts && echo OK` → `OK`
- `ls e2e/*.spec.ts | wc -l` → ≥ 13 (existing 6 + 7 new; current count is 6: admin-api-security, builder-and-concierge, cart, contact, navigation, products).
- `grep -rc "runAxe(" e2e/` → ≥ 7.
- `npm run test:e2e --project=chromium 2>&1 | tail -20` → contains "passed" and no "failed" or unexplained "skipped".
- `npm run test:e2e 2>&1 | tail -5` → exit 0 across all 5 projects.
- `grep "@axe-core/playwright" package.json` → present in devDependencies.
- `grep -E '"lighthouse"|"chrome-launcher"' package.json` → both present (T1 installs them for T2 to consume).
- `grep -c '"lighthouse": "node scripts/lighthouse-runs.mjs"' package.json` → 1.
- `npm test 2>&1 | tail -5` → 184/184 Jest baseline preserved.

**Context:**
- Read @.planning/ROADMAP.md (§"Phase 4.3: Final QA" — REQ QA-01, success criterion #1 + #3)
- Read @playwright.config.ts
- Read @e2e/builder-and-concierge.spec.ts (style + console-error allowlist pattern to mirror in new specs)
- Read @e2e/fixtures/test-data.ts (to source the in-stock product slug; extend if needed)
- Read @e2e/cart.spec.ts (existing cart-drawer selectors — reuse, don't reinvent)
- Read @CLAUDE.md (Testing Structure section + the Playwright project list)

---

## Task 2 — Lighthouse runs on 4 routes × 2 viewports + scores doc

**Wave:** 1
**Persona:** performance
**Files:**
- `scripts/lighthouse-runs.mjs` — NEW. ESM script that:
  (Note: `lighthouse` + `chrome-launcher` devDeps and the `"lighthouse"` npm script entry are installed/wired by T1 to keep `package.json` single-writer in Wave 1 per plan-checker Issue 3. T2 only reads `package.json`, never writes it.)
  1. Boots `npm run dev` as a child process and waits for `http://localhost:3000` to return 200 (uses `node:http` + polling, max 120s timeout — same pattern as Playwright's webServer wait).
  2. For each of the 4 routes (`/`, `/products/<slug-from-fixtures>`, `/shop`, `/cart` — note: `/cart` is the drawer host since there is no standalone `/checkout` route; the checkout flow is the Stripe redirect, so the route Lighthouse-audits as "checkout" is `/cart` per QA-02's intent of "the page from which checkout is initiated") × 2 viewports (mobile 375×667, desktop 1280×800), runs Lighthouse programmatically via `import lighthouse from 'lighthouse'` with the appropriate emulation preset (`mobile` or `desktop`), `onlyCategories: ['performance', 'accessibility']`, and the `chrome-launcher` `--headless=new` flag.
  3. Parses each LHR result and asserts: `categories.performance.score >= 0.9`, `categories.accessibility.score >= 0.9`, `audits['largest-contentful-paint'].numericValue <= 2500` on mobile, `audits['cumulative-layout-shift'].numericValue <= 0.1`, `audits['total-blocking-time'].numericValue <= 200` on desktop.
  4. Collects all 8 results into a Markdown table and writes to `.planning/archive/milestone-4-handoff/lighthouse-scores.md` with: ISO timestamp, the exact `lighthouse` programmatic invocation pseudo-CLI shown (`lighthouse <url> --preset=<mobile|desktop> --only-categories=performance,accessibility`), one row per (route × viewport), columns `Route | Viewport | Performance | Accessibility | LCP (ms) | CLS | TBT (ms) | Pass`.
  5. Exits 0 only if all 8 runs pass all thresholds; otherwise exits 1 with a summary of which (route, viewport, metric) failed.
  6. Always tears down the dev server child process in a `finally` block (kill PID).
- `.planning/archive/milestone-4-handoff/lighthouse-scores.md` — NEW, OWNED by this script. Generated, not hand-edited. The `mkdir -p` for the parent dir is the script's responsibility.

**Depends on:** none

**Why:** QA-02 demands 8 Lighthouse runs hit ≥ 90 / ≥ 90 with three additional Web Vitals thresholds (LCP, CLS, TBT) on specified viewports, and that the scores be recorded with timestamp + command in `.planning/archive/milestone-4-handoff/lighthouse-scores.md`. Running Lighthouse interactively from devtools every time the score moves is a budget no one will hold. A one-shot script that's `npm run lighthouse` is the only way the handoff (and any future regression) is verifiable in seconds, not minutes. Runs in Wave 1 parallel with T1; the only shared file (`package.json`) is single-written by T1 to avoid the npm-install race.

**Acceptance Criteria:**
- `npm run lighthouse` exits 0 on a clean repo (`git stash && npm run lighthouse && git stash pop`-safe).
- `.planning/archive/milestone-4-handoff/lighthouse-scores.md` exists, contains an ISO timestamp, the Lighthouse invocation, and exactly 8 result rows; every row has `Pass: yes`.
- Performance ≥ 90 and Accessibility ≥ 90 on all 8 runs; LCP ≤ 2500ms on the 4 mobile rows; CLS ≤ 0.1 on all 8 rows; TBT ≤ 200ms on the 4 desktop rows.
- The script gracefully kills the dev server on success AND on failure (verify by `pgrep -af "next dev"` returning empty after the script exits).

**Action:**
1. PRECONDITION: Verify `lighthouse` + `chrome-launcher` are already in `package.json` `devDependencies` and `"lighthouse": "node scripts/lighthouse-runs.mjs"` is in `scripts` (T1 wrote these in Wave 1 — both tasks in Wave 1 install their devDeps via T1's single `npm install -D` invocation). If absent because T1 has not yet completed in the parallel wave, `npm install -D lighthouse chrome-launcher` locally for development BUT do NOT edit `package.json` — T1 is the single writer. Use Context7 to confirm the current Lighthouse ≥ 11 programmatic API shape before authoring — the `lighthouse(url, opts, config)` signature changed in v10.
2. Author `scripts/lighthouse-runs.mjs`:
   - `import lighthouse from 'lighthouse'`, `import * as chromeLauncher from 'chrome-launcher'`.
   - Define `ROUTES = [{path: '/', label: 'home'}, {path: '/products/<slug>', label: 'pdp'}, {path: '/shop', label: 'shop'}, {path: '/cart', label: 'checkout-entry'}]`. Source the PDP slug from `e2e/fixtures/test-data.ts` `ANY_IN_STOCK_SLUG` (T1 establishes this; if T2 lands first, hardcode a known slug temporarily — see Depends on note below).
   - Define `VIEWPORTS = [{name: 'mobile', preset: 'mobile'}, {name: 'desktop', preset: 'desktop'}]`.
   - For each (route, viewport) combo: launch Chrome via `chromeLauncher.launch({ chromeFlags: ['--headless=new'] })`, run `lighthouse(url, { port: chrome.port, output: 'json', onlyCategories: ['performance', 'accessibility'], formFactor: viewport.name === 'mobile' ? 'mobile' : 'desktop', screenEmulation: viewport.name === 'mobile' ? { mobile: true, width: 375, height: 667, deviceScaleFactor: 2 } : { mobile: false, width: 1280, height: 800, deviceScaleFactor: 1 } })`, kill the Chrome instance.
   - Collect `{ route, viewport, performance, accessibility, lcp, cls, tbt, pass }` rows; compute pass/fail per the thresholds above.
   - Write the Markdown table to `.planning/archive/milestone-4-handoff/lighthouse-scores.md` using `node:fs.writeFileSync`. The file header should include `Generated: <ISO>` and `Command: node scripts/lighthouse-runs.mjs`.
   - On any failed row, `console.error` a one-line summary per failure and `process.exit(1)` AFTER writing the markdown (so the file shows the failing numbers — debuggable).
3. (npm script entry handled by T1 — do not touch `package.json`.)
4. Run once locally via `npm run lighthouse`; iterate on whatever metric falls short. If Performance is < 90 on a route, that's a real P3 failure — do NOT relax the threshold; surface to operator. (Most likely culprits: unoptimized hero image, blocking script. Use Lighthouse's own audit output to triage.)
5. Cross-check: open the generated `.planning/archive/milestone-4-handoff/lighthouse-scores.md` and confirm the 8 rows + thresholds are correct.

**Note on T1 dependency for the PDP slug:** This task is Wave 1 (parallel with T1). T1 owns `package.json`'s devDeps + `lighthouse` npm script entry; T2 only reads `package.json`. For the PDP slug: if `e2e/fixtures/test-data.ts` does NOT yet export `ANY_IN_STOCK_SLUG` when T2 runs, the script SHOULD read the slug directly from Supabase via `@supabase/supabase-js` and `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (query `products` table, `eq('is_active', true).limit(1)`). Either source is fine; do NOT block on T1.

**Validation:** (builder self-check)
- `test -f scripts/lighthouse-runs.mjs && echo OK` → `OK`.
- (`package.json` checks owned by T1's validation block — do not duplicate.)
- `npm run lighthouse 2>&1 | tail -3` → exit 0; final line indicates "8/8 passed".
- `test -f .planning/archive/milestone-4-handoff/lighthouse-scores.md && grep -c "^| " .planning/archive/milestone-4-handoff/lighthouse-scores.md` → ≥ 10 (1 header + 1 separator + 8 data rows).
- `grep -c "Pass: yes\| yes " .planning/archive/milestone-4-handoff/lighthouse-scores.md` → 8.
- `pgrep -af "next dev"` after script exit → empty.

**Context:**
- Read @.planning/ROADMAP.md (§"Phase 4.3: Final QA" — REQ QA-02, success criterion #2)
- Read @package.json (existing scripts block + devDependencies; do not duplicate)
- Read @playwright.config.ts (the `webServer` block — mirror its dev-server boot/wait pattern)
- Fetch current Lighthouse programmatic API docs via Context7 (`mcp__context7__resolve-library-id` for `lighthouse`, then `query-docs` for "programmatic API node usage") — the API shape changed across v10/v11; do not guess.

---

## Task 3 — Stripe test-mode end-to-end on both payment surfaces with Supabase order verification

**Wave:** 2
**Persona:** frontend
**Files:**
- `e2e/cart-checkout.spec.ts` — NEW. Test 1 (gated on `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; otherwise `test.skip(true, 'requires STRIPE_SECRET_KEY + Supabase service-role for order verification — see GH issue #QA-STRIPE-E2E-CI')`):
  1. Generate a unique test email (`aquador-e2e+${Date.now()}@example.com`) to identify the order row downstream.
  2. Visit a known PDP slug (from `e2e/fixtures/test-data.ts`), click Add-to-Cart, open the cart drawer, click Checkout.
  3. Wait for navigation to `checkout.stripe.com`. Fill the hosted Checkout form with: card `4242 4242 4242 4242`, expiry `12/34`, CVC `123`, name `Aquador E2E`, email = generated email above, billing postal `1010` (or whatever the Stripe Cyprus locale expects).
  4. Submit and wait for redirect back to the Aquad'or success URL — likely `/checkout/success` or `/checkout?session_id=cs_test_...`. Assert URL pattern + an order-confirmation H1 visible.
  5. Within 60s (poll every 3s), query Supabase via `@supabase/supabase-js` with the service-role key for an `orders` row matching the test email; assert it exists and `status` is `paid` or `complete` (whichever the existing webhook handler writes — read `src/app/api/webhooks/stripe/route.ts` to determine the exact contract before authoring the assertion).
  6. (Best-effort) Assert the Resend confirmation was queued: either by mocking/spying via Resend's test mode, OR by asserting the webhook handler logged a Resend API call (`api-utils.ts` structured log → query via Supabase log table if mirrored, OR accept that Resend delivery is out-of-band and assert only that the webhook's Resend invocation did not throw — visible via the order row not being marked `email_failed`).
- `e2e/builder-and-concierge.spec.ts` — EDIT the existing Stripe-builder test (do NOT touch the concierge test — T1 already touched its skip message):
  1. After the existing assertion that the Checkout Session URL contains `checkout.stripe.com`, REMOVE the early termination and INSTEAD: fill the hosted Stripe form with `4242 4242 4242 4242` / `12/34` / `123` / unique test email / `1010`, submit, wait for redirect to `/create-perfume/success?session_id=cs_test_...`.
  2. Assert the success page renders the perfume composition (note labels visible: Bergamot, Lemon, Rose, Jasmine, Ylang-Ylang, Oud, Sandalwood per the existing test's selection).
  3. Within 60s, query Supabase for an `orders` row with `source: 'custom_perfume'` (or whichever metadata field the create-perfume webhook handler writes — verify by reading `src/app/api/webhooks/stripe/route.ts` and `src/app/api/create-perfume/payment/route.ts`); assert presence.
- `e2e/_helpers/supabase-orders.ts` — NEW. Exports `findOrderByEmail(email: string, opts?: { timeoutMs?: number, pollMs?: number, source?: string }): Promise<OrderRow | null>`. Uses `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` (NEVER the anon key) to query the `orders` table, polls until found or timeout. Centralizes the polling so both Stripe specs share one implementation.
- `e2e/_helpers/stripe-checkout.ts` — NEW. Exports `fillStripeHostedCheckout(page, { card, expiry, cvc, email, name, postal })`. Encapsulates the Stripe-hosted form selectors (which change occasionally) so both specs share one source of truth. Stripe's hosted page uses stable `data-testid` and `[name=...]` selectors documented at stripe.com/docs/testing — use those, not class-based.

**Depends on:** Task 1 (T1 establishes `e2e/_helpers/` convention + the `e2e/fixtures/test-data.ts` `ANY_IN_STOCK_SLUG` export + the spec-style conventions; T3 builds on the same scaffolding. T3 ALSO edits `e2e/builder-and-concierge.spec.ts` which T1 also touches — serializing into Wave 2 prevents write-conflict on that file.)

**Why:** QA-03 demands BOTH payment surfaces are verified end-to-end: cart checkout AND custom-perfume PaymentIntent, both with the test card, both producing a Supabase `orders` row + Resend confirmation within 60s. The existing `e2e/builder-and-concierge.spec.ts` scaffold stops at the Stripe-host redirect because completing the flow was deferred to Final QA — that's now. No cart-checkout e2e exists at all; the closest is `e2e/cart.spec.ts` which only tests the drawer client-state. Without these two specs, "both payment surfaces are green" is unverifiable, which means M4 cannot ship — the operator inherits an untested money path.

**Acceptance Criteria:**
- `e2e/cart-checkout.spec.ts` exists; when run with `STRIPE_SECRET_KEY` + service-role key in env, it completes the full cart→Stripe-hosted→success→Supabase-order chain and exits 0.
- `e2e/builder-and-concierge.spec.ts` Stripe-builder test no longer stops at the Stripe redirect; it completes the hosted form, lands on `/create-perfume/success`, and verifies the Supabase order row exists with the create-perfume source marker.
- Both specs use the shared helpers (`e2e/_helpers/supabase-orders.ts`, `e2e/_helpers/stripe-checkout.ts`) — no inline duplication of Stripe-form selectors or Supabase polling.
- When env vars are absent, both specs `test.skip(true, '...')` with a GH issue reference in the skip message (per QA-01's "no .skip without GitHub issue reference" rule).
- The Supabase orders helper uses `SUPABASE_SERVICE_ROLE_KEY` only via `process.env`, never via an imported client module; never logs the key.

**Action:**
1. Read `src/app/api/webhooks/stripe/route.ts` end-to-end to determine: (a) the exact `orders` columns the webhook writes, (b) the field used to mark cart-checkout vs custom-perfume orders (likely `metadata.source` or a top-level `source` column), (c) the order `status` value on success, (d) whether the Resend invocation logs anything queryable.
2. Read `src/app/api/create-perfume/payment/route.ts` to confirm the PaymentIntent → Checkout Session swap (the existing scaffold comment in `e2e/builder-and-concierge.spec.ts` confirms M2 P2.5 W1 T1 standardized on Checkout Session for both surfaces) and the metadata it stamps on the session.
3. Author `e2e/_helpers/supabase-orders.ts`:
   - `import { createClient } from '@supabase/supabase-js'`.
   - Construct a service-role client lazily inside the helper (do NOT instantiate at module-load, so importing the helper in a skipped test doesn't crash on missing env).
   - `findOrderByEmail(email, { timeoutMs = 60_000, pollMs = 3_000, source } = {})`: poll the `orders` table with `.select('*').eq('customer_email', email).maybeSingle()`, return the row when found OR null on timeout. If `source` provided, also `.eq('source', source)` (or whichever column the webhook uses — verified in step 1).
4. Author `e2e/_helpers/stripe-checkout.ts`:
   - Stable selectors per stripe.com/docs/testing — use `page.locator('input[name="cardNumber"]')`, `input[name="cardExpiry"]`, `input[name="cardCvc"]`, `input[name="billingName"]`, `input[name="email"]`, `input[name="billingPostalCode"]`. (Verify current selectors via Context7 or Stripe docs before authoring — Stripe rotates these occasionally.)
   - Fill with `page.fill(selector, value)`, then click `button[type="submit"]` (the "Pay" button is the only primary submit on the hosted page).
   - Wait for navigation off `checkout.stripe.com` with a 30s timeout (Stripe processing latency can spike).
5. Author `e2e/cart-checkout.spec.ts` using the helpers. Use the same console-error capture + allowlist pattern as `e2e/builder-and-concierge.spec.ts`. The skip guard goes at the top of the `test()` body:
   ```ts
   test.skip(
     !process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY,
     'cart-checkout e2e requires STRIPE_SECRET_KEY + SUPABASE_SERVICE_ROLE_KEY for order verification — see GH issue #QA-STRIPE-E2E-CI'
   );
   ```
6. Edit `e2e/builder-and-concierge.spec.ts` Stripe-builder test:
   - Locate the comment block ending with "stripe test card (for manual verification once on hosted page): 4242 4242 4242 4242" — replace its intent: completion is now in-spec, not manual.
   - After the existing `expect(page.url()).toMatch(/checkout\.stripe\.com/)`, insert:
     ```ts
     const testEmail = `aquador-e2e+builder-${Date.now()}@example.com`;
     await fillStripeHostedCheckout(page, { card: '4242 4242 4242 4242', expiry: '12/34', cvc: '123', email: testEmail, name: 'Aquador E2E', postal: '1010' });
     await page.waitForURL(/\/create-perfume\/success/, { timeout: 30_000 });
     await expect(page.getByText(/Bergamot/i)).toBeVisible();
     const order = await findOrderByEmail(testEmail, { source: 'custom_perfume', timeoutMs: 60_000 });
     expect(order, 'expected a Supabase orders row for the test email').not.toBeNull();
     ```
   - Tighten the existing `test.skip` to also require `SUPABASE_SERVICE_ROLE_KEY`; update the skip message to reference the same GH issue.
7. Document in the PR description (committing later) how to run with Stripe webhook forwarding: `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe` in a side terminal before `npm run test:e2e`. (Per locked decision in `<locked_decisions>` — operator confirms test keys exist in `.env.local`.)
8. Run locally with env vars set: `STRIPE_SECRET_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run test:e2e -- e2e/cart-checkout.spec.ts e2e/builder-and-concierge.spec.ts --project=chromium`. Iterate until both pass deterministically. (Cross-browser runs follow — Stripe-hosted form behaves identically on all engines, but allow 60s timeouts to absorb webkit latency.)

**Validation:** (builder self-check)
- `test -f e2e/cart-checkout.spec.ts && test -f e2e/_helpers/supabase-orders.ts && test -f e2e/_helpers/stripe-checkout.ts && echo OK` → `OK`.
- `grep -c "4242 4242 4242 4242" e2e/cart-checkout.spec.ts e2e/_helpers/stripe-checkout.ts e2e/builder-and-concierge.spec.ts` → ≥ 1 (centralized in helper; specs may pass the constant in).
- `grep -q "findOrderByEmail" e2e/cart-checkout.spec.ts && grep -q "findOrderByEmail" e2e/builder-and-concierge.spec.ts && echo OK` → `OK`.
- `grep -q "fillStripeHostedCheckout" e2e/cart-checkout.spec.ts && grep -q "fillStripeHostedCheckout" e2e/builder-and-concierge.spec.ts && echo OK` → `OK`.
- `grep -c "test.skip" e2e/cart-checkout.spec.ts e2e/builder-and-concierge.spec.ts` ≥ 2 AND each `test.skip` second arg contains a GH issue token (`grep -E "GH issue|#QA-" e2e/cart-checkout.spec.ts e2e/builder-and-concierge.spec.ts` returns ≥ 2 matches).
- `grep -L "SUPABASE_SERVICE_ROLE_KEY" e2e/_helpers/supabase-orders.ts` returns empty (the var IS referenced).
- With env vars set: `STRIPE_SECRET_KEY=... SUPABASE_SERVICE_ROLE_KEY=... npm run test:e2e --project=chromium -- e2e/cart-checkout.spec.ts e2e/builder-and-concierge.spec.ts 2>&1 | tail -5` → exit 0; "2 passed" in summary.
- Without env vars: `unset STRIPE_SECRET_KEY SUPABASE_SERVICE_ROLE_KEY; npm run test:e2e --project=chromium -- e2e/cart-checkout.spec.ts e2e/builder-and-concierge.spec.ts 2>&1 | tail -5` → exit 0; tests show as skipped (not failed) with a printed skip message containing the GH issue ref.

**Context:**
- Read @.planning/ROADMAP.md (§"Phase 4.3: Final QA" — REQ QA-03, success criteria #4 + #5)
- Read @e2e/builder-and-concierge.spec.ts (existing scaffold + the prose contract note at the top)
- Read @src/app/api/webhooks/stripe/route.ts (the order row contract — what columns + what source marker)
- Read @src/app/api/create-perfume/payment/route.ts (custom-perfume session metadata)
- Read @src/app/api/checkout/route.ts (cart checkout session metadata)
- Read @CLAUDE.md (Stripe + Supabase + Resend integration sections)
- Read @rules/security.md (service-role key handling — never client-side, env-only)
- Fetch current Stripe hosted Checkout form selectors via Context7 (`mcp__context7__resolve-library-id` `stripe-js`, then docs for "testing checkout session test card") before finalizing `e2e/_helpers/stripe-checkout.ts` selectors.

---

## Task 4 — Sentry baseline + security re-audit + manual keyboard-nav audit

**Wave:** 1
**Persona:** ops
**Files:**
- `.planning/archive/milestone-4-handoff/sentry-baseline.md` — NEW. Snapshot of current Sentry state: ISO timestamp, project slug, environment, count of unresolved issues by severity (`fatal`, `error`, `warning`), top-5 unresolved issues by event count (with permalink to each), 7-day event volume. Captured via `sentry-cli` (`sentry-cli issues list --project aquador --status unresolved --json`) OR Sentry's Issues API with `SENTRY_AUTH_TOKEN` from env; if neither is available, record the manual dashboard observation with screenshot path. This is the starting line — HAND-04's "< 5 unresolved errors with severity >= high" is measured as a DELTA against this file.
- `.planning/archive/milestone-4-handoff/security-reaudit.md` — NEW. Six-section snapshot:
  1. `npm audit --production --json` output summary (count by severity; full JSON archived at `.planning/archive/milestone-4-handoff/npm-audit-prod.json`).
  2. Client-side service-role grep: `grep -rn "SUPABASE_SERVICE_ROLE_KEY" src/components/ src/app/ --include="*.tsx" --include="*.ts" | grep -v "src/app/api"` → must be empty (only API routes may reference the key).
  3. Hardcoded-key grep: `grep -rnE "(sk_live_|sk_test_|rk_live_|whsec_|eyJ[A-Za-z0-9_-]{20,})" src/ --include="*.ts" --include="*.tsx"` → must be empty.
  4. `dangerouslySetInnerHTML` audit: `grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx" --include="*.ts"` → list every usage; each one must be a JSON-LD `<script>` block in a route file (allowlisted) — anything else is a finding.
  5. Supabase advisors (RLS coverage): query `mcp__supabase__get_advisors` (lint type) and assert every table in the public schema has RLS enabled; record any advisor finding with severity ≥ warn as a P3 gap to close before sign-off OR formal-defer via GH issue.
  6. Security-header smoke check: `curl -sI https://aquadorcy.com | grep -iE "strict-transport-security|content-security-policy|x-frame-options"` → assert all three present; record header values verbatim.
- `.planning/archive/milestone-4-handoff/keyboard-nav-audit.md` — NEW. Manual walkthrough for the 4 core routes (`/`, one PDP, `/shop`, `/cart` with item added). Per route, a 4-row table: (a) "Focus visible on every interactive element" pass/fail + the lowest-contrast example observed; (b) "Tab reaches every interactive element in DOM order" pass/fail + any element skipped; (c) "Escape closes drawer/modal" pass/fail (only on `/cart` with drawer open and any modal on the route); (d) "Focus trap on cart drawer" pass/fail (Tab cycles inside the drawer, Shift+Tab cycles back, focus does not escape into the page behind). Any FAIL row triggers an inline fix-or-defer decision: a fix lands in the same commit; a defer creates a GH issue and notes the issue number in the table.
- `.planning/archive/milestone-4-handoff/npm-audit-prod.json` — NEW. Raw output of `npm audit --production --json` for archival.

**Depends on:** none (Wave 1; writes only to `.planning/archive/milestone-4-handoff/` and reads `src/`, `package.json`, network — no overlap with T1/T2 files).

**Why:** ROADMAP §4.3 phase goal explicitly names "establish the Sentry error baseline, and confirm the security posture is clean" and SC#3 names "manual keyboard navigation on each route confirms: focus is visible at all times, modals trap focus, drawers close on Escape, no interactive element is unreachable by Tab alone" — none of which T1/T2/T3 covers. Without this task, the phase goal is unmet and the verifier downgrades to FAIL on the unchecked criteria (plan-checker Issue 1 + Issue 2). The Sentry baseline is the measurement HAND-04 references for "delta unresolved errors at handoff." The security re-audit re-runs the OPTIMIZE.md security gates from M3 against the post-P1+P2 codebase (P1 touched admin write paths, P2 added Resend wiring — both worth re-checking). Keyboard-nav cannot be automated meaningfully by axe-core alone (axe catches contrast + ARIA, not Tab order / focus traps).

**Acceptance Criteria:**
- All three audit files exist and are non-trivial (≥ 30 non-blank lines combined; not stubs).
- `sentry-baseline.md` contains: ISO timestamp, an unresolved-by-severity count, a top-5 issues block (or an explicit "0 unresolved issues" sentence with the query timestamp), and a 7-day event volume figure.
- `security-reaudit.md` contains all 6 sections; sections 2, 3, 4 each have a literal "PASS" or list of findings; section 5 reports the Supabase advisor query result with timestamp; section 6 quotes the three security headers verbatim.
- `keyboard-nav-audit.md` contains 4 route blocks × 4 audit rows = 16 rows minimum; every FAIL row has either a "fixed in commit <hash>" annotation OR a "deferred to GH issue #..." annotation. Zero rows left as "TODO".
- No new CRITICAL/HIGH `npm audit --production` finding goes unaddressed (each must be: upgraded in this phase, OR formally deferred with a GH issue ref recorded in `security-reaudit.md` §1).

**Action:**
1. Sentry baseline:
   - If `SENTRY_AUTH_TOKEN` is in `.env.local`: run `npx sentry-cli issues list --project aquador --status unresolved --json > /tmp/sentry-unresolved.json` (or use the Sentry HTTP API with `curl -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" "https://sentry.io/api/0/projects/<org>/aquador/issues/?query=is:unresolved&statsPeriod=7d"`).
   - Parse the result: count by `.level`, take the top 5 by `.count`, capture `.permalink` for each.
   - Write `sentry-baseline.md` with the captured fields. Even if the count is 0, record "0 unresolved as of <ISO timestamp>" with the query string.
2. Security re-audit:
   - `npm audit --production --json > .planning/archive/milestone-4-handoff/npm-audit-prod.json && npm audit --production 2>&1 | tail -30` — capture the summary.
   - Run each grep in §§2-4 of the file. PASTE the exact command + output into the markdown file (PASS or finding list).
   - For §5: invoke the Supabase advisors MCP (`mcp__supabase__get_advisors` with type=`security`). For each finding ≥ `WARN`, decide fix-now vs defer-with-issue. Record the decision in the doc.
   - For §6: `curl -sI https://aquadorcy.com | grep -iE "strict-transport-security|content-security-policy|x-frame-options"` and paste verbatim.
3. Keyboard-nav audit:
   - Boot `npm run dev` in a side process. For each of the 4 routes, open in chromium with `playwright codegen` OR a real browser, then walk through the 4 audit rows.
   - For drawer focus-trap test on `/cart`: Tab through the drawer's controls (close button, quantity buttons, checkout link), confirm focus loops back to the first focusable element after the last; Shift+Tab loops backward; clicking outside the drawer does NOT shift focus until drawer closes.
   - Any FAIL row that's a quick fix (missing `aria-label`, missing focus style, `outline-none` without `focus-visible:ring`): fix in `src/` immediately, commit, reference the commit hash in the audit row.
   - Any FAIL row that's structural (missing focus trap on drawer): file a GH issue (`gh issue create --title "..." --body "..."`), reference the issue number, defer.
4. Commit all four artifact files in a single `chore(p3): sentry baseline + security re-audit + keyboard-nav audit` commit.

**Validation:** (builder self-check)
- `test -f .planning/archive/milestone-4-handoff/sentry-baseline.md && test -f .planning/archive/milestone-4-handoff/security-reaudit.md && test -f .planning/archive/milestone-4-handoff/keyboard-nav-audit.md && test -f .planning/archive/milestone-4-handoff/npm-audit-prod.json && echo OK` → `OK`.
- `wc -l .planning/archive/milestone-4-handoff/sentry-baseline.md .planning/archive/milestone-4-handoff/security-reaudit.md .planning/archive/milestone-4-handoff/keyboard-nav-audit.md | tail -1` → ≥ 30 total non-blank lines (`grep -cv "^$" | awk` if needed).
- `grep -cE "^#" .planning/archive/milestone-4-handoff/security-reaudit.md` → ≥ 6 (one heading per section).
- `grep -rn "SUPABASE_SERVICE_ROLE_KEY" src/components/ src/app/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "src/app/api"` → empty.
- `grep -rnE "(sk_live_|sk_test_[A-Za-z0-9_]{16,}|whsec_[A-Za-z0-9_]{16,})" src/ --include="*.ts" --include="*.tsx"` → empty.
- `grep -cE "PASS|FAIL|deferred|fixed in commit" .planning/archive/milestone-4-handoff/keyboard-nav-audit.md` → ≥ 16 (one verdict per audit row).
- `grep -cE "Generated:|Timestamp:|as of " .planning/archive/milestone-4-handoff/sentry-baseline.md` → ≥ 1.

**Context:**
- Read @.planning/ROADMAP.md (§"Phase 4.3: Final QA" goal + SC#3 — manual keyboard-nav requirement; §"Phase 4.4: Handoff" HAND-04 — Sentry delta target)
- Read @rules/security.md (the audit checklist this task re-runs against the post-P1+P2 code)
- Read @.planning/archive/milestone-3-admin-rebuild/OPTIMIZE.md (the prior security findings — confirm none have regressed)
- Read @sentry.server.config.ts and @sentry.edge.config.ts (to confirm project slug + DSN used when scoping the API query)
- Read @CLAUDE.md (Sentry integration section — project name `aquador`, env vars `SENTRY_DSN` / `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT`)

---

## Success Criteria
- [ ] `npm run test:e2e` exits 0 across chromium/firefox/webkit/Mobile Chrome/Mobile Safari; 0 failed; only skips that reference a GH issue in the skip message — confirmed via Playwright HTML report.
- [ ] axe-core scans run inside each behavioral spec via the shared `runAxe` helper; 0 critical violations on home, PDP, shop, checkout-precheckout.
- [ ] Manual keyboard navigation walkthrough on the 4 core routes (home, PDP, shop, cart-with-item) is documented in `.planning/archive/milestone-4-handoff/keyboard-nav-audit.md`: focus visible on every interactive element, Tab reaches every element in DOM order, Escape closes drawer/modal, focus trap on cart drawer holds — every FAIL row is either fixed in-phase (commit hash recorded) or formally deferred (GH issue # recorded). [ROADMAP §4.3 SC#3 manual keyboard-nav]
- [ ] `.planning/archive/milestone-4-handoff/lighthouse-scores.md` exists with 8 rows; all 8 rows `Pass: yes`; Performance + Accessibility ≥ 90 across the board; LCP ≤ 2.5s on mobile rows; CLS ≤ 0.1 across the board; TBT ≤ 200ms on desktop rows; timestamp + invocation command present in the file header.
- [ ] `e2e/cart-checkout.spec.ts` exists and (with env vars set) completes cart→Stripe-hosted→success→Supabase-order chain end-to-end with test card 4242 4242 4242 4242.
- [ ] `e2e/builder-and-concierge.spec.ts` Stripe-builder test (with env vars set) completes custom-perfume→Stripe-hosted→/create-perfume/success→Supabase-order chain with `source: 'custom_perfume'` (or equivalent verified marker).
- [ ] Sentry error baseline captured in `.planning/archive/milestone-4-handoff/sentry-baseline.md`: ISO timestamp, unresolved-by-severity counts, top-5 unresolved issues (or "0 unresolved" with query timestamp), 7-day event volume. HAND-04 measures its "< 5 unresolved high+" threshold as a delta against this file. [ROADMAP §4.3 goal — Sentry baseline]
- [ ] Security re-audit captured in `.planning/archive/milestone-4-handoff/security-reaudit.md`: `npm audit --production` summary; service-role grep PASS; hardcoded-key grep PASS; `dangerouslySetInnerHTML` audit PASS (only JSON-LD blocks); Supabase RLS advisor report; security headers present (HSTS, CSP, X-Frame-Options) on the production domain — any CRITICAL/HIGH finding either fixed in-phase or formally deferred with a GH issue ref. [ROADMAP §4.3 goal — security re-audit]
- [ ] Jest baseline preserved: `npm test` exits 0 with the 184/184 baseline from M4 P1 untouched.
- [ ] No regression to existing `src/app/api/webhooks/stripe/__tests__/route.test.ts` (21+ tests still pass; CART-05 non-regression honored).

---

## Verification Contract

### Contract for Task 1 — axe helper exists AND uses AxeBuilder
**Check type:** grep-match
**Command:** `test -f /home/qualia/Projects/aquador/e2e/_helpers/axe.ts && grep -cE "AxeBuilder|@axe-core/playwright" /home/qualia/Projects/aquador/e2e/_helpers/axe.ts`
**Expected:** ≥ 2 (one import-line match for `@axe-core/playwright`, one usage-line match for `AxeBuilder`).
**Fail if:** File missing OR the file does not actually wire AxeBuilder (a stub `export function runAxe() {}` would pass file-exists but fail this contract — the per Issue 4 plan-checker requirement).

### Contract for Task 1 — 7 new behavioral specs exist
**Check type:** command-exit
**Command:** `ls /home/qualia/Projects/aquador/e2e/homepage.spec.ts /home/qualia/Projects/aquador/e2e/shop-filter-sort.spec.ts /home/qualia/Projects/aquador/e2e/pdp-add-to-cart.spec.ts /home/qualia/Projects/aquador/e2e/checkout-redirect.spec.ts /home/qualia/Projects/aquador/e2e/create-perfume-steps.spec.ts /home/qualia/Projects/aquador/e2e/blog-flow.spec.ts /home/qualia/Projects/aquador/e2e/admin-login-redirect.spec.ts 2>&1 | wc -l`
**Expected:** `7`
**Fail if:** Any of the 7 spec files is missing.

### Contract for Task 1 — axe wired into every new behavioral spec
**Check type:** grep-match
**Command:** `grep -rc "runAxe(" /home/qualia/Projects/aquador/e2e/ | awk -F: '{s+=$2} END {print s}'`
**Expected:** `≥ 7` (one runAxe call per new spec, sum across files)
**Fail if:** Sum < 7 — at least one spec is missing its axe scan, violating the "axe travels with behavioral coverage" contract.

### Contract for Task 1 — @axe-core/playwright installed
**Check type:** grep-match
**Command:** `grep -c "@axe-core/playwright" /home/qualia/Projects/aquador/package.json`
**Expected:** Non-zero (≥ 1)
**Fail if:** Returns 0 — package not installed; the helper would crash on import.

### Contract for Task 1 — chromium suite passes
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npm run test:e2e -- --project=chromium 2>&1 | tail -3`
**Expected:** Output contains "passed" with no "failed" or unexplained "skipped"; exit code 0
**Fail if:** Any test failed, or skipped without a GH issue ref in its skip message.

### Contract for Task 1 — full cross-browser suite passes
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npm run test:e2e 2>&1; echo "EXIT=$?"`
**Expected:** Final line `EXIT=0`
**Fail if:** Exit code non-zero on any of the 5 configured projects.

### Contract for Task 1 — Jest baseline not regressed
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npm test 2>&1 | tail -10`
**Expected:** Summary shows ≥ 184 tests passed, 0 failed
**Fail if:** Any Jest test fails or the pass count drops below 184.

### Contract for Task 2 — lighthouse script exists
**Check type:** file-exists
**Command:** `test -f /home/qualia/Projects/aquador/scripts/lighthouse-runs.mjs && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Script never authored.

### Contract for Task 2 — lighthouse + chrome-launcher installed
**Check type:** grep-match
**Command:** `grep -cE '"lighthouse"|"chrome-launcher"' /home/qualia/Projects/aquador/package.json`
**Expected:** `2`
**Fail if:** Either dep missing from `package.json`.

### Contract for Task 2 — npm script wired
**Check type:** grep-match
**Command:** `grep -c '"lighthouse": "node scripts/lighthouse-runs.mjs"' /home/qualia/Projects/aquador/package.json`
**Expected:** `1`
**Fail if:** Script not registered; operator can't run `npm run lighthouse`.

### Contract for Task 2 — script runs green and produces scores doc
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npm run lighthouse 2>&1; echo "EXIT=$?"`
**Expected:** Final line `EXIT=0`
**Fail if:** Exit non-zero — at least one Lighthouse threshold violated; the scores doc still gets written so the failure is debuggable, but the verifier rejects until all 8 pass.

### Contract for Task 2 — scores doc has 8 passing rows
**Check type:** command-exit
**Command:** `test -f /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/lighthouse-scores.md && grep -c "yes" /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/lighthouse-scores.md`
**Expected:** `≥ 8`
**Fail if:** File missing OR fewer than 8 `yes` (Pass) markers — not all 8 (route × viewport) combinations hit thresholds.

### Contract for Task 2 — scores doc has timestamp + invocation
**Check type:** grep-match
**Command:** `grep -cE "Generated:|Command:" /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/lighthouse-scores.md`
**Expected:** `2`
**Fail if:** Either marker missing — the doc fails the audit-trail requirement in ROADMAP §4.3 SC#2 ("recorded with timestamp and the exact lighthouse CLI command used").

### Contract for Task 2 — dev server cleaned up
**Check type:** command-exit
**Command:** `pgrep -af "next dev" | wc -l`
**Expected:** `0`
**Fail if:** Non-zero AFTER `npm run lighthouse` exits — the script's `finally` block didn't kill the dev-server child process.

### Contract for Task 3 — cart-checkout spec + helpers exist
**Check type:** file-exists
**Command:** `test -f /home/qualia/Projects/aquador/e2e/cart-checkout.spec.ts && test -f /home/qualia/Projects/aquador/e2e/_helpers/supabase-orders.ts && test -f /home/qualia/Projects/aquador/e2e/_helpers/stripe-checkout.ts && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Any of the 3 files missing.

### Contract for Task 3 — both Stripe specs use the shared helpers
**Check type:** grep-match
**Command:** `grep -lc "fillStripeHostedCheckout" /home/qualia/Projects/aquador/e2e/cart-checkout.spec.ts /home/qualia/Projects/aquador/e2e/builder-and-concierge.spec.ts | wc -l`
**Expected:** `2`
**Fail if:** Either spec doesn't import/use the shared helper — duplication of Stripe selectors will rot the next time Stripe ships a hosted-page redesign.

### Contract for Task 3 — both specs verify Supabase order
**Check type:** grep-match
**Command:** `grep -l "findOrderByEmail" /home/qualia/Projects/aquador/e2e/cart-checkout.spec.ts /home/qualia/Projects/aquador/e2e/builder-and-concierge.spec.ts | wc -l`
**Expected:** `2`
**Fail if:** Either spec doesn't verify the Supabase order row — QA-03 SC#4 and SC#5 are unfulfilled.

### Contract for Task 3 — skips reference a GH issue
**Check type:** grep-match
**Command:** `grep -cE "GH issue|#QA-STRIPE-E2E-CI|#QA-AI-KEY-CI" /home/qualia/Projects/aquador/e2e/cart-checkout.spec.ts /home/qualia/Projects/aquador/e2e/builder-and-concierge.spec.ts | awk -F: '{s+=$2} END {print s}'`
**Expected:** `≥ 2`
**Fail if:** Sum < 2 — at least one `test.skip` lacks the GH issue reference required by QA-01 SC#1.

### Contract for Task 3 — service-role key handled safely
**Check type:** grep-match
**Command:** `grep -c "process.env.SUPABASE_SERVICE_ROLE_KEY" /home/qualia/Projects/aquador/e2e/_helpers/supabase-orders.ts`
**Expected:** `≥ 1`
**Fail if:** Returns 0 — the helper is reading the key from somewhere other than `process.env`, OR the helper isn't using the service-role key at all (anon key can't read all orders).

### Contract for Task 3 — Stripe webhook unit tests still pass (CART-05 non-regression)
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npm test -- src/app/api/webhooks/stripe/__tests__/route.test.ts 2>&1 | tail -10`
**Expected:** Summary shows ≥ 21 tests passed, 0 failed
**Fail if:** Any webhook unit test fails OR pass count drops below 21 — CART-05 non-regression breached.

### Contract for Task 3 — full Stripe surfaces pass behaviorally (with env)
**Check type:** behavioral
**Command:** (verifier sets `STRIPE_SECRET_KEY` + `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`, runs `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe` in a side terminal, then runs `npm run test:e2e --project=chromium -- e2e/cart-checkout.spec.ts e2e/builder-and-concierge.spec.ts`)
**Expected:** Both specs pass; Supabase shows a new `orders` row per spec (one with cart-checkout marker, one with `source: 'custom_perfume'`); Resend dashboard shows a delivery attempt within 60s (or the webhook log confirms the Resend API call did not throw).
**Fail if:** Either spec fails, OR Supabase shows no new order row, OR the success page does not render the expected composition / confirmation H1.

### Contract for Task 4 — all three audit artifacts exist
**Check type:** file-exists
**Command:** `test -f /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/sentry-baseline.md && test -f /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/security-reaudit.md && test -f /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/keyboard-nav-audit.md && test -f /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/npm-audit-prod.json && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Any of the 4 audit artifacts is missing — ROADMAP §4.3 phase goal items (Sentry baseline, security re-audit) or SC#3 (manual keyboard-nav) is unfulfilled.

### Contract for Task 4 — Sentry baseline has timestamp + counts
**Check type:** grep-match
**Command:** `grep -cE "(Timestamp|Generated|as of |unresolved)" /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/sentry-baseline.md`
**Expected:** `≥ 2`
**Fail if:** Sum < 2 — the baseline lacks either a timestamp anchor or a count-of-unresolved figure; HAND-04 cannot measure delta against an unanchored baseline.

### Contract for Task 4 — security re-audit covers all 6 sections
**Check type:** grep-match
**Command:** `grep -cE "^##? " /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/security-reaudit.md`
**Expected:** `≥ 6`
**Fail if:** Fewer than 6 section headings — the audit is incomplete; phase goal "confirm the security posture is clean" is unfulfilled.

### Contract for Task 4 — security re-audit confirms no client-side service-role
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && grep -rn "SUPABASE_SERVICE_ROLE_KEY" src/components/ src/app/ --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "src/app/api" | wc -l`
**Expected:** `0`
**Fail if:** Non-zero — a client-side or non-API server file references the service-role key, violating rules/security.md (CRITICAL severity per Severity Rubric).

### Contract for Task 4 — security re-audit confirms no hardcoded Stripe / webhook keys
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && grep -rnE "(sk_live_|sk_test_[A-Za-z0-9_]{16,}|whsec_[A-Za-z0-9_]{16,})" src/ --include="*.ts" --include="*.tsx" | wc -l`
**Expected:** `0`
**Fail if:** Non-zero — a Stripe live/test secret or webhook signing secret is committed to `src/`. CRITICAL.

### Contract for Task 4 — keyboard-nav audit has 16 rows, all resolved
**Check type:** grep-match
**Command:** `grep -cE "PASS|FAIL|deferred|fixed in commit" /home/qualia/Projects/aquador/.planning/archive/milestone-4-handoff/keyboard-nav-audit.md`
**Expected:** `≥ 16`
**Fail if:** Sum < 16 — fewer than 4 routes × 4 audit rows have a verdict, OR a row was left as "TODO" without a fix-or-defer decision.

### Contract for Task 4 — keyboard-nav FAILs are accounted for
**Check type:** grep-match
**Command:** `cd /home/qualia/Projects/aquador && awk '/FAIL/{f=1;next} /(fixed in commit|deferred to GH issue|#[0-9]+)/{if(f){f=0}} END{exit f}' .planning/archive/milestone-4-handoff/keyboard-nav-audit.md; echo $?`
**Expected:** `0`
**Fail if:** Non-zero — at least one FAIL row has no "fixed in commit <hash>" or "deferred to GH issue #..." annotation in the lines after it.

### Contract for Task 4 — npm audit production findings are actioned
**Check type:** command-exit
**Command:** `cd /home/qualia/Projects/aquador && npm audit --production --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); v=d.get('metadata',{}).get('vulnerabilities',{}); high=v.get('high',0)+v.get('critical',0); print(high)"`
**Expected:** `0` (preferred), OR each non-zero CRITICAL/HIGH finding referenced in `security-reaudit.md` §1 with a "deferred to GH issue #..." annotation
**Fail if:** Non-zero high+critical count AND `grep -cE "deferred to GH issue|GH issue #" .planning/archive/milestone-4-handoff/security-reaudit.md` returns 0 — unactioned high-severity supply-chain vulnerability.
