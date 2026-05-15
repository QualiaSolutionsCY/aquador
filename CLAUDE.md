# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
npm run test         # Jest unit tests
npm run test:watch   # Jest watch mode
npm run test:coverage # Coverage report
npm run test:e2e     # Playwright E2E tests (starts dev server automatically)
npm run test:e2e:ui  # Playwright with UI mode
npm run test:all     # lint + type-check + jest + playwright
```

Run a single test file:
```bash
npm test -- src/lib/perfume/__tests__/pricing.test.ts
npx playwright test e2e/cart.spec.ts
```

## Operator Runbooks

- See [docs/stripe-wallets.md](docs/stripe-wallets.md) before testing wallet payments.

## Architecture

**Next.js 14 App Router** (14.2.35, React 18) luxury perfume e-commerce site for Aquad'or Cyprus.

### Core Features

1. **Product Catalog** (`src/lib/supabase/product-service.ts`) - Supabase-backed product data with ~100+ perfumes across categories (women, men, niche, lattafa-original, al-haramain-originals, victorias-secret-originals). Product types: Perfume, Essence Oil, Body Lotion. Static category definitions in `src/lib/categories.ts`.

2. **Custom Perfume Builder** (`src/app/create-perfume/`, `src/lib/perfume/`) - Interactive fragrance creation with three-layer composition (top, heart, base notes). Five fragrance categories: floral, fruity, woody, oriental, gourmand. Integrates with Stripe for payments.

3. **Shop by Category** (`src/app/shop/[category]/`) - Dynamic category pages using slug-based routing. Dedicated `/shop/lattafa` page for Lattafa brand products.

4. **Blog** (`src/app/blog/`, `src/lib/blog.ts`) - Supabase-backed blog with categories, featured posts, and SEO metadata. Admin CRUD at `/admin/blog/`.

5. **AI Fragrance Assistant** (`src/app/api/ai-assistant/route.ts`) - Chat-based product recommender using OpenRouter API (default model: Gemini 2.0 Flash). Uses complete catalogue data from `src/lib/ai/catalogue-data.ts` for product matching.

### Shopping Cart & Checkout

- **Cart State**: React Context with `useReducer` in `src/components/cart/CartProvider.tsx`
- **Persistence**: localStorage (`aquador_cart`)
- **Checkout API**: `src/app/api/checkout/route.ts` creates Stripe Checkout Session
- **Webhook**: `src/app/api/webhooks/stripe/route.ts` handles payment confirmations
- **Currency**: EUR (€) - see `src/lib/currency.ts` for formatting utilities

### Custom Perfume Builder Payment

- API route: `src/app/api/create-perfume/payment/route.ts`
- Creates Stripe PaymentIntent with perfume metadata
- Pricing: 50ml = €29.99, 100ml = €199.00
- Success page: `src/app/create-perfume/success/`

### Perfume Library (`src/lib/perfume/`)

```
types.ts      - FragranceNote, PerfumeComposition, CustomPerfume interfaces
notes.ts      - fragranceDatabase with all available notes by category
composition.ts - Composition validation helpers
pricing.ts    - Volume-based price calculation
validation.ts - Form validation with Zod
```

### Middleware (`src/middleware.ts`)

Runs on `/api/*` and `/admin/*` routes:
- Adds `x-request-id` header to all matched requests/responses
- Authenticates admin routes via Supabase — checks `admin_users` table membership
- Redirects unauthenticated users to `/admin/login`

### Admin Panel (`src/app/admin/`)

Supabase-backed admin dashboard:
- `/admin` - Dashboard overview
- `/admin/products` - Product CRUD (list, create, edit)
- `/admin/categories` - Category management
- `/admin/orders` - Order management
- `/admin/customers` - Customer list and individual customer detail (`/admin/customers/[id]`)
- `/admin/blog` - Blog post CRUD (list, create, edit)
- `/admin/settings` - Store settings
- `/admin/login` - Authentication via Supabase Auth

**Auth**: Middleware-level auth checks `admin_users` table. `src/app/api/admin/setup/route.ts` bootstraps the first admin user.

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/checkout` | Creates Stripe Checkout Session |
| `/api/webhooks/stripe` | Stripe payment webhook |
| `/api/create-perfume/payment` | Stripe PaymentIntent for custom perfumes |
| `/api/ai-assistant` | AI fragrance consultant (OpenRouter) |
| `/api/contact` | Contact form (Resend email) |
| `/api/blog`, `/api/blog/[slug]`, `/api/blog/categories`, `/api/blog/featured` | Blog CRUD |
| `/api/admin/setup` | Admin user bootstrap |
| `/api/health`, `/api/heartbeat` | Health checks |

### Design System

- **Colors**: Gold (#D4AF37, #FFD700), Dark backgrounds (#0a0a0a, #1a1a1a)
- **Typography**: Playfair Display (headings), Poppins (body)
- **CSS**: Tailwind with custom gold/dark color palette and animations (shimmer, float, pulse-gold)
- **UI Components**: `src/components/ui/Button.tsx`
- **Animations**: Framer Motion throughout

### Supabase Integration (`src/lib/supabase/`)

Primary data layer for products, blog, and admin:
- `client.ts` - Browser-side Supabase client
- `server.ts` - Server-side client with cookies (for mutations, auth-required ops)
- `public.ts` - Cookie-free read-only client for SSG/ISR pages (avoids forcing dynamic rendering)
- `admin.ts` - Service-role client for admin operations
- `product-service.ts` - All product query functions (`getAllProducts`, `getProductBySlug`, `getFeaturedProducts`, `searchProducts`, `getRelatedProducts`)
- `types.ts` - Generated TypeScript types from Supabase schema

**Database Tables**:
- `products` - Product catalog with enums for category, type, gender
- `admin_users` - Admin authentication with role-based access (admin, super_admin)
- `blog_posts` - Blog content with status, categories, featured flag

### Type System (`src/types/`)

Two product type systems coexist:
- **Legacy** (`LegacyProduct` in `index.ts`): Used by some shop page components
- **Variant-based** (`Product` in `product.ts`): Supports multiple variants per product (size, type), with helper functions `getDefaultVariant()` and `getVariantLabel()`
- **Supabase** (`src/lib/supabase/types.ts`): Database schema types — the `Product` type from here is used by `product-service.ts`
- **Cart** (`cart.ts`): Cart items use variant-based pricing

### Utilities (`src/lib/`)

- `api-utils.ts` - Structured logging with request IDs, error formatting, timeouts (10s default)
- `rate-limit.ts` - Upstash Redis rate limiting (gracefully disabled when not configured)
- `stripe.ts` - Stripe client initialization
- `constants.ts` - Product type labels
- `utils.ts` - General utilities

### Environment Variables

See `.env.example`:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` - Stripe payment keys
- `STRIPE_WEBHOOK_SECRET` - For production webhooks
- `NEXT_PUBLIC_APP_URL` - App base URL for redirects
- `RESEND_API_KEY` / `CONTACT_EMAIL_TO` - Email service for contact form
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase admin panel
- `SUPABASE_SERVICE_ROLE_KEY` - Admin setup only, keep secret
- `OPENROUTER_API_KEY` - AI assistant (falls back to `OPENAI_API_KEY`)
- `AI_API_ENDPOINT` / `AI_MODEL` - Optional AI config overrides
- `SENTRY_DSN` / `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` - Error tracking
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Optional rate limiting

## Deployment

- **Platform**: Vercel (auto-deploys from `main` branch)
- **Project**: `aquador-next`
- **Production URL**: https://aquadorcy.com (custom domain)
- **Preview URL**: https://aquador-next.vercel.app
- **Node**: v20 (see `.nvmrc`)
- Security headers configured in `next.config.mjs` (CSP, HSTS, X-Frame-Options)
- Sentry integration via `@sentry/nextjs` with source map uploads, tunnel route at `/monitoring`
- Sentry configs: `sentry.server.config.ts`, `sentry.edge.config.ts`

### Testing Structure

- **Unit tests**: `src/**/__tests__/*.test.ts(x)` - Jest with React Testing Library
- **E2E tests**: `e2e/*.spec.ts` - Playwright (chromium, firefox, webkit, mobile)
- **Path alias**: `@/` maps to `src/`

## Reference Materials

`old-website-pages/` contains archived Squarespace content including the original product CSV export and page content for reference.

`scripts/` contains one-off migration scripts used to move product data from the static catalog into Supabase. These are excluded from TypeScript compilation via `tsconfig.json`.

## Qualia substrate

Qualia framework artifacts live under `.planning/`:

- `.planning/codebase/` — brownfield map (`README.md` index, plus `architecture.md`, `stack.md`, `conventions.md`, `concerns.md`, `onboarding.md`). Scanned 2026-05-14.
- `.planning/agents/` — adapter config so Qualia honors repo conventions: `tracker.md` (GitHub), `labels.md` (canonical mapping), `domain.md`.
- `.planning/CONTEXT.md` — domain glossary (created lazily).
- `.planning/decisions/` — ADRs for hard-to-reverse architectural calls.
- `.planning/{PROJECT,MILESTONES,REQUIREMENTS,ROADMAP,STATE}.md`, `.planning/milestones/`, `.planning/phases/`, `.planning/quick/` — roadmap + phase artifacts.

Read `.planning/codebase/README.md` first when picking up work — it links the rest.
