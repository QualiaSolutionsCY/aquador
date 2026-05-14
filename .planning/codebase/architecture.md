# Aquad'or — Codebase Architecture Map

Brownfield map of the existing Next.js 14 App Router luxury perfume e-commerce site. Cite paths verbatim — every claim below is grounded in a real file.

## Entry points

### Pages/routes (most important)
- `src/app/page.tsx` — homepage (Hero, Featured Products, Categories, CTA sections)
- `src/app/shop/page.tsx` + `src/app/shop/ShopContent.tsx` — full catalog with filtering
- `src/app/shop/[category]/page.tsx` — category-filtered catalog (slug-based)
- `src/app/shop/lattafa/page.tsx` — dedicated Lattafa brand landing
- `src/app/products/[slug]/page.tsx` — product detail page
- `src/app/create-perfume/page.tsx` — custom perfume builder (three-layer composition UI)
- `src/app/create-perfume/success/page.tsx` — post-payment confirmation
- `src/app/checkout/` — Stripe Checkout return flow
- `src/app/blog/` + `src/app/blog/[slug]/page.tsx` — blog index and article
- `src/app/admin/page.tsx` + `src/app/admin/{products,categories,orders,customers,blog,settings,login}/` — admin dashboard

### API routes (grouped by domain)
- **Commerce**: `src/app/api/checkout/route.ts` (Stripe Checkout Session), `src/app/api/checkout/session-details/`, `src/app/api/webhooks/stripe/route.ts` (payment confirmations)
- **Custom perfume**: `src/app/api/create-perfume/payment/route.ts` (Stripe PaymentIntent)
- **AI**: `src/app/api/ai-assistant/route.ts` (OpenRouter chat, default `google/gemini-2.0-flash-001`)
- **Content**: `src/app/api/blog/route.ts`, `src/app/api/blog/[slug]/`, `src/app/api/blog/categories/`, `src/app/api/blog/featured/`
- **Contact**: `src/app/api/contact/route.ts` (Resend email)
- **Live chat**: `src/app/api/live-chat/notify/route.ts`
- **Admin**: `src/app/api/admin/orders/`, `src/app/api/admin/setup/route.ts` (first-admin bootstrap)
- **Ops**: `src/app/api/health/`, `src/app/api/heartbeat/`

## Folder structure

```
src/
├── app/            # Next.js 14 App Router — pages, layouts, API routes
├── components/     # React UI components (cart, layout, products, home, admin, ui, 3d, providers, ai, analytics, blog, search, shop)
├── hooks/          # Custom hooks (useScrollAnimation, useDeviceCapabilities, useVisitorHeartbeat, useSwipeGesture, etc.)
├── lib/            # Business logic, services, adapters (see Module boundaries)
├── types/          # Shared TypeScript types (product.ts, cart.ts, order.ts, index.ts legacy)
├── middleware.ts   # Request-ID injection + admin auth gate
└── instrumentation.ts  # Sentry init hook
```

Key `src/lib/` subdirs:
- `lib/supabase/` — DB clients + product-service (adapter layer)
- `lib/perfume/` — custom-perfume domain (types, notes DB, composition, pricing, validation)
- `lib/ai/catalogue-data.ts` — flattened product catalogue for AI prompts
- `lib/validation/cart.ts` — server-side cart price re-validation (anti-tampering)
- `lib/stripe.ts`, `lib/rate-limit.ts`, `lib/api-utils.ts`, `lib/currency.ts`, `lib/constants.ts`, `lib/categories.ts`, `lib/blog.ts`

## Module boundaries

| Layer | Maps to in this repo |
|-------|---------------------|
| **Routes (wiring)** | `src/app/**/page.tsx` and `src/app/api/**/route.ts` |
| **Features** | Page components + `src/components/{cart,products,home,blog,admin}/` |
| **Services** | `src/lib/supabase/product-service.ts`, `src/lib/blog.ts`, `src/lib/perfume/composition.ts`, `src/lib/perfume/pricing.ts`, `src/lib/validation/cart.ts` |
| **Adapters** | `src/lib/supabase/{client,server,public,admin}.ts`, `src/lib/stripe.ts`, `src/lib/rate-limit.ts` (Upstash), `src/app/api/ai-assistant/route.ts` (OpenRouter, inline) |
| **Domain types** | `src/types/{product,cart,order}.ts`, `src/lib/supabase/types.ts`, `src/lib/perfume/types.ts`, `src/lib/perfume/notes.ts` |

Four Supabase clients exist for distinct contexts (`src/lib/supabase/`): `client.ts` (browser), `server.ts` (cookies, mutations/auth), `public.ts` (cookie-free read-only for SSG/ISR — used by `product-service.ts`), `admin.ts` (service-role, server-only).

## Data flow

### Add-to-cart → Checkout → Stripe
1. User clicks AddToCart (`src/components/products/AddToCartButton.tsx`)
2. `CartProvider` reducer updates state, persists to `localStorage` key `aquador_cart` (`src/components/cart/CartProvider.tsx:10`, debounced via `CART_DEBOUNCE_MS`)
3. CheckoutButton (`src/components/cart/CheckoutButton.tsx`) POSTs cart to `/api/checkout`
4. `src/app/api/checkout/route.ts` rate-limits, Zod-validates, **re-validates prices against Supabase** via `validateCartPrices` (`src/lib/validation/cart.ts`), creates Stripe Session
5. User completes payment → Stripe webhook hits `src/app/api/webhooks/stripe/route.ts`

### Product data: Supabase → page
`createPublicClient()` (`src/lib/supabase/public.ts`) → `product-service.ts` functions (`getAllProducts`, `getProductBySlug`, `getFeaturedProducts`, `searchProducts`, `getRelatedProducts`) → consumed by `app/shop/`, `app/products/[slug]/`, `app/page.tsx`. `getAllProducts` filters `is_active=true`, orders by `in_stock` then `created_at` (`src/lib/supabase/product-service.ts:19-26`). Wrapped in React `cache()` for request-level memoization.

### Custom perfume builder
1. User picks notes in `src/app/create-perfume/page.tsx` from `fragranceDatabase` (`src/lib/perfume/notes.ts`)
2. `src/lib/perfume/composition.ts` validates 3-layer composition; `pricing.ts` computes price by volume (50ml=€29.99, 100ml=€199.00)
3. Submit → POST `/api/create-perfume/payment` (`src/app/api/create-perfume/payment/route.ts`) — Zod validates, creates Stripe PaymentIntent with perfume metadata
4. Redirect to `src/app/create-perfume/success/page.tsx`

### Admin request flow
Every `/admin/*` request → `src/middleware.ts` (matcher: `['/api/:path*', '/admin/:path*']`) → creates Supabase SSR client, checks `auth.getUser()`, then queries `admin_users` table for membership → redirects to `/admin/login` on fail.

## Key integrations

- **Stripe** — `src/lib/stripe.ts` (lazy `getStripe()`); checkout sessions in `api/checkout`, PaymentIntents in `api/create-perfume/payment`, webhook handler in `api/webhooks/stripe`. Currency: EUR (`src/lib/currency.ts`).
- **Supabase** — products, blog, admin users. Four clients in `src/lib/supabase/`. Auth via SSR cookies in middleware.
- **OpenRouter** — AI fragrance assistant (`src/app/api/ai-assistant/route.ts:11-13`). Env: `OPENROUTER_API_KEY`, `AI_API_ENDPOINT`, `AI_MODEL`. Falls back to `OPENAI_API_KEY`.
- **Resend** — contact form email in `src/app/api/contact/route.ts` (env: `RESEND_API_KEY`, `CONTACT_EMAIL_TO`).
- **Sentry** — `@sentry/nextjs` initialized via `src/instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`. Tunnel route `/monitoring`. Breadcrumbs added throughout services.
- **Upstash Redis** — optional rate limiting in `src/lib/rate-limit.ts`. Gracefully no-ops when env vars absent. Applied to `/api/checkout`, `/api/create-perfume/payment`, `/api/ai-assistant`.

## Notable patterns

- **Three coexisting product type systems (DRIFT WARNING)**:
  - Legacy `LegacyProduct` in `src/types/index.ts` — used by some shop page components
  - Variant-based `Product` in `src/types/product.ts` — multi-variant (size, type) with `getDefaultVariant()`, `getVariantLabel()`. Used by cart (`src/types/cart.ts`).
  - Supabase `Product` in `src/lib/supabase/types.ts` — schema-generated, used by `product-service.ts`
  Reconciliation happens ad-hoc at consumer sites; there's no single canonical type.
- **Cart state**: React Context + `useReducer` (`src/components/cart/CartProvider.tsx`). Zod schemas (`CartItemSchema`, `CartSchema`) validate localStorage rehydration. Server **re-validates every price** against Supabase before Stripe session creation (`src/lib/validation/cart.ts` — security pattern; client prices never trusted).
- **Middleware-based admin auth**: single gate in `src/middleware.ts` queries `admin_users` table on every admin request. No per-route auth duplication.
- **Public vs server Supabase clients**: `public.ts` is intentionally cookie-free so product pages can be SSG/ISR without forcing dynamic rendering. Mutations and auth-required reads use `server.ts`.
- **Static categories + dynamic products**: category definitions are hard-coded in `src/lib/categories.ts` (re-exported from `product-service`), products live in Supabase.
- **Request-ID propagation**: middleware injects `x-request-id` on every matched request/response — used by `lib/api-utils.ts` structured logging.
- **AI catalogue caching**: `src/lib/ai/catalogue-data.ts` is a static flattened product list shipped to the AI prompt. Not generated from Supabase at runtime — must be regenerated when the catalog changes meaningfully.
- **Migration scripts excluded from build**: `scripts/` contains one-off Supabase migration scripts, excluded via `tsconfig.json`.
- **Reference archive**: `old-website-pages/` holds Squarespace CSV exports and legacy page content (not wired into app).
