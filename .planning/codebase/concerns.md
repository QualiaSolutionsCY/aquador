# Code-Quality Concerns — Aquad'or

Document-only punch list for `/qualia-optimize`. No fixes applied here.
Scope: `src/` only. Tests excluded from severity counts.
Scan date: 2026-05-14.

## Severity counts
- CRITICAL: 1
- HIGH: 4
- MEDIUM: 9
- LOW: 6

## Critical
- `src/app/api/admin/setup/route.ts:39,111` — `"if (process.env.ADMIN_SETUP_COMPLETE === 'true')"` — Admin bootstrap endpoint is gated only by an env-var flag plus a shared `ADMIN_SETUP_SECRET`. If `ADMIN_SETUP_COMPLETE` is unset on the production env (default), anyone with the setup key (or anyone who can brute-force/leak it) can mint a `super_admin`. The `PUT` branch (line 109) lets a leaked setup key reset *any existing admin's* password until `ADMIN_SETUP_COMPLETE=true` is set. The flag should default to closed (e.g. require explicit `ADMIN_SETUP_OPEN=true`) or the route should be deleted post-bootstrap. CRITICAL: auth bypass / account takeover surface.

## High
- `src/app/api/heartbeat/route.ts:13` — `"export async function POST"` — Public, unauthenticated route writes to `site_visitors` using the **service-role** client (`createAdminClient`, line 25) and *deletes* rows older than 24h on every call (line 55). Rate-limited but any attacker can spam writes/triggers; the DELETE runs on every request, which is also a perf footgun. HIGH: feature works but service-role + public POST is the wrong tool. Belongs to a dedicated cron, not the request path.
- `src/app/api/admin/setup/route.ts:54-92` — `"supabaseAdmin = getSupabaseAdmin()"` — Service-role client created from a public endpoint; behaviour above amplifies impact. HIGH (folded into the CRITICAL above for severity tally; flagging here for architectural sin).
- `src/app/sitemap.ts:2` — `"import { createClient } from '@supabase/supabase-js'"` — Direct vendor SDK import bypasses the `lib/supabase/*` adapter layer (CLAUDE.md prescribes `public.ts` for cookie-free reads). HIGH: violates adapter-at-seams architecture rule; future Supabase upgrade requires touching multiple files.
- Two-product-type system friction — `src/types/index.ts:16` defines `LegacyProduct`; `src/types/index.ts:82` re-exports it as `Product` (`"export type Product = LegacyProduct"`); `src/lib/supabase/types.ts` exports a different `Product` (snake_case). `src/components/ui/ProductCard.tsx:23` accepts `LegacyProduct | Product` and normalises (line 34 comment: *"handle both LegacyProduct (camelCase) and Supabase Product (snake_case)"*). `src/app/shop/lattafa/page.tsx:31` literally transforms Supabase rows back into `LegacyProduct`. HIGH: shape coercion at every read site, ProductCard branches on both shapes, type-aliasing collides. Pick one canonical shape; map at the adapter, not at every consumer.

## Medium
- `src/app/create-perfume/page.tsx` — 979 lines / 44KB single page. Composition state, fragrance pyramid, checkout form, and animation all colocated. MEDIUM: too big to load lazily and hard to test. Candidate for extraction (`composition/`, `summary/`, `checkout/`).
- `src/app/reorder/page.tsx` — 614 lines / 25KB. MEDIUM: same smell, single client file owns the whole flow.
- `src/components/admin/ProductForm.tsx` — 568 lines / 21KB. MEDIUM: monolithic admin form; no obvious section boundaries.
- `src/components/3d/Scene.tsx:76, 95, 127` — `"const ctrl = controls as any"` (three places) — three.js OrbitControls escape-hatched. MEDIUM: works, but rewrites blow up silently when drei updates types.
- `src/components/3d/ProductViewer.tsx:21` — `"const controlsRef = useRef<any>(null)"` — same family. MEDIUM.
- `src/lib/performance/metrics.ts:52` — `"export function reportWebVitals(metric: any)"` — public API typed as `any`. MEDIUM: caller has no signature contract; should be `NextWebVitalsMetric`.
- `src/lib/performance/animation-budget.tsx:283-285` — `"(window as any).Sentry.captureMessage(...)"` — Sentry typed off the global. MEDIUM: import `@sentry/nextjs` (already a dep) instead.
- `src/hooks/useDeviceCapabilities.ts:42` — `"const connection = (navigator as any).connection"` (+ `@ts-expect-error` line 30 for `deviceMemory`) — MEDIUM: missing/empty states unclear; non-Chromium silently falls through.
- `src/components/ui/OptimizedImage.tsx:88` — `"console.warn('OptimizedImage: width and height are required when fill is false')"` — MEDIUM: runtime warning instead of compile-time prop type narrowing (discriminated union by `fill`).

## Low
- `src/lib/performance/metrics.ts:31` — `"console.log('[Performance] ' + component + ' loaded in ' + duration + 'ms')"` — production-path `console.log`. LOW.
- `src/lib/performance/metrics.ts:54` — `"console.log('[Web Vitals] ' + metric.name + ':', metric.value)"` — LOW.
- `src/lib/performance/animation-budget.tsx:167, 275` — `"console.log('[AnimationBudget] Average FPS...')"` — gated behind `NODE_ENV === 'development'`, OK, but worth muting under `process.env.DEBUG_PERF`. LOW.
- `src/app/api/admin/setup/route.ts:100, 155` and 9 other `/api/*/route.ts` files — `"console.error(...)"` in catch blocks. LOW: should funnel through `formatApiError` + Sentry (already done in some routes, inconsistent across the rest). 11 occurrences total.
- `src/components/3d/PerfumeBottle.tsx:15` — `"* TODO: Replace with optimized GLB model from Sketchfab"` — LOW: TODO with no ticket reference.
- `src/app/api/blog/route.ts:87` `src/app/api/blog/[slug]/route.ts:45, 105, 147` — `"console.error('Blog X error:', error)"` — non-Sentry error logging in blog routes; the checkout/stripe routes use Sentry. LOW: inconsistent telemetry.

## Dependency staleness

| Package              | Current      | Latest (Jan 2026) | Majors behind |
|----------------------|--------------|-------------------|---------------|
| next                 | 14.2.35      | 16.x              | 2             |
| react                | ^18          | 19.x              | 1             |
| react-dom            | ^18          | 19.x              | 1             |
| @types/react         | ^18          | 19.x              | 1             |
| @types/react-dom     | ^18          | 19.x              | 1             |
| eslint               | ^8           | 9.x               | 1             |
| eslint-config-next   | 14.2.35      | 16.x              | 2             |
| @react-three/fiber   | ^8.18.0      | 9.x               | 1             |
| @react-three/drei    | ^9.122.0     | 10.x              | 1             |
| stripe (server SDK)  | ^20.2.0      | 18+ current line  | n/a (track)   |
| @types/node          | ^20          | 22 LTS            | 1             |
| three                | ^0.168.0     | current ~0.170+   | minor lag     |

Project lives on Next 14 / React 18 — two major versions behind. CLAUDE.md still pins "Next 14 App Router". Migration to Next 16 + React 19 is a deliberate planning task, not a fix.

## Missing test coverage

Test folders present:
`src/app/api/blog`, `src/app/api/checkout`, `src/app/api/contact`, `src/app/api/health`, `src/app/api/heartbeat`, `src/app/api/webhooks/stripe`, `src/components/cart`, `src/components/ui`, `src/lib/perfume`, `src/lib/__tests__`.

Notable gaps — no `__tests__` folder:
- `src/app/api/admin/orders/` — manual-order API, mutates orders + customers, no tests.
- `src/app/api/admin/setup/` — bootstrap auth endpoint, untested (security-critical).
- `src/app/api/ai-assistant/` — OpenRouter route, no tests despite `messageSchema` validation.
- `src/app/api/create-perfume/payment/` — Stripe PaymentIntent route, no tests.
- `src/app/api/live-chat/notify/` — WhatsApp/Resend notification fan-out, no tests.
- `src/app/api/blog/categories/`, `src/app/api/blog/featured/` — small but untested.
- `src/lib/supabase/` — `product-service.ts` (the primary data layer) has no unit tests.
- `src/lib/ai/` — `catalogue-data.ts` (search/match helpers) untested.
- `src/lib/validation/` — `cart.ts` (server-side price validation, security-critical) untested.
- `src/lib/blog.ts`, `src/lib/currency.ts`, `src/lib/rate-limit.ts`, `src/lib/api-utils.ts` — untested utilities.
- `src/components/admin/`, `src/components/products/`, `src/components/shop/`, `src/components/blog/`, `src/components/ai/`, `src/components/3d/` — no component tests.
- `src/hooks/` — no hook tests.

Pre-existing test failures observed: `5 failed test suites / 24 failed tests` (Jest exit on `pre-deploy-gate.js` hook). Including `src/components/ui/__tests__/Button.test.tsx` looking for `"Loading..."`. Tests are currently red — must be repaired before any meaningful coverage push.

## API auth surface

All `/api/*` routes confirmed:
- Auth-gated (Supabase admin check): `/api/admin/orders`, `/api/blog` POST, `/api/blog/[slug]` PUT/DELETE.
- Setup-key-gated: `/api/admin/setup` (see CRITICAL above — gating is weak).
- Stripe-signature-verified: `/api/webhooks/stripe`.
- Rate-limited public: `/api/checkout`, `/api/checkout/session-details`, `/api/contact`, `/api/heartbeat`, `/api/live-chat/notify`, `/api/create-perfume/payment`, `/api/ai-assistant`.
- Unauthenticated public reads (intended): `/api/health`, `/api/blog` GET, `/api/blog/[slug]` GET, `/api/blog/categories`, `/api/blog/featured`.
- Live-chat session GET/POST routes under `/api/live-chat/*` — verify these are RLS-policy gated; they read/write `live_chat_sessions` with the *public* client (`createPublicClient`). Worth a follow-up RLS audit.

## Bundle / build smells

- `framer-motion` is imported in **74 files**. Heavy library; consider centralising motion primitives in `src/lib/animations/` and re-exporting trimmed variants, or pruning to `framer-motion/m` (LazyMotion) where feasible. MEDIUM perf concern but not severity-counted (no measured user impact yet).
- Three large `.tsx` files (see Medium section). All client components — they ship to the user.
- `JSON.stringify(...).replace(/</g, '\\u003c')` pattern at 4 sites (`src/app/products/[slug]/page.tsx:172,176`, `src/app/blog/[slug]/page.tsx:173`, `src/app/shop/[category]/page.tsx:100`) is fine but duplicated. `src/app/page.tsx:124` defines `safeStringify` — DRY candidate.

## Security smells (verified clean)

- `grep -rE "sk_(live|test)_|pk_(live|test)_" src/` → only test fixtures (`sk_test_123` inside `__tests__/`). No real keys committed.
- `SUPABASE_SERVICE_ROLE_KEY` is referenced only from `src/lib/supabase/admin.ts` and `src/app/api/admin/setup/route.ts`, both server-only. No `.tsx` (client) leakage.
- `createAdminClient` is imported by 3 server routes (`api/admin/orders`, `api/webhooks/stripe`, `api/heartbeat`). Heartbeat is the concerning one — see HIGH above.
- No `eval(` usage. `dangerouslySetInnerHTML` used at 6 sites: 4 for JSON-LD (sanitised via `replace(/</g,'\\u003c')`), 2 for sanitised HTML (`BlogContent.tsx`, `RichDescription.tsx` — both consume DOMPurify-sanitised input). Reviewed clean.

## Notes

- The codebase is well-organised at the layer-boundary level (`lib/supabase/{client,server,public,admin}.ts`, `lib/api-utils.ts`, `lib/rate-limit.ts`). The architectural sin is the **two-product-type coexistence** — it taxes every consumer with shape normalisation and is the single highest-leverage refactor available.
- Stripe / checkout flow has good test coverage and uses Sentry consistently. Blog routes do not — telemetry hygiene is inconsistent across the API surface.
- `next.config.mjs` exists; Sentry tunnel route at `/monitoring` configured per CLAUDE.md. Not audited here.
- Pre-existing Jest failures (24 tests, 5 suites) need triage independent of this scan. Worth running `npm test -- --verbose` to confirm whether failures pre-date recent style commits (last 5 commits are CSS-only).
- The architecture note in `.planning/codebase/architecture.md` already exists — this file complements it with a punch-list view rather than a structural view.
