# Aquad'or E-Commerce Platform

## What This Is

A luxury perfume e-commerce site (Next.js 14, Stripe, Supabase, Resend) with a fully secured order-to-payment-to-confirmation pipeline, comprehensive security hardening, and optimized performance. Two checkout flows (cart and custom perfume) converge at a single Stripe webhook for order persistence and email delivery.

## Core Value

A customer completes a purchase and knows it worked — they see their order details on screen, receive a confirmation email, and the store is notified. No silent failures, no misleading messages, no security holes.

## Requirements

### Validated

- ✓ Cart state management with localStorage persistence — existing
- ✓ Stripe Checkout Session creation for cart items — existing
- ✓ Stripe Checkout Session creation for custom perfumes — existing
- ✓ Stripe webhook signature verification — existing
- ✓ Order persistence to Supabase (orders + customers tables) — existing
- ✓ Customer confirmation email via Resend — existing
- ✓ Store notification email via Resend — existing
- ✓ Admin panel order management — existing
- ✓ Rate limiting on checkout/payment endpoints — existing
- ✓ Sentry error tracking on payment failures — existing
- ✓ Server-side price validation against product catalog — v1.0
- ✓ Zod schema validation on checkout cart items — v1.0
- ✓ Stripe metadata under 500-char limit (shortened keys) — v1.0
- ✓ Duplicate checkout session prevention (isProcessing + AbortController) — v1.0
- ✓ Custom perfume success page detects payment correctly — v1.0
- ✓ Both success pages display order details from Stripe session — v1.0
- ✓ Idempotent email sending (database-based dedup) — v1.0
- ✓ Webhook reconstructs full item data from shortened metadata — v1.0
- ✓ Admin search secured against SQL filter injection — v1.0
- ✓ Unconditional free shipping messaging — v1.0
- ✓ Consistent 3-7 business day delivery estimates — v1.0
- ✓ Centralized escapeHtml and SHIPPING_COUNTRIES utilities — v1.0
- ✓ RLS enabled on all 9 Supabase tables with 24 policies — v1.1
- ✓ Sentry GDPR compliant (sendDefaultPii: false, 10% prod sampling) — v1.1
- ✓ SQL injection protection in admin product search — v1.1
- ✓ Open redirect protection in admin login — v1.1
- ✓ Permissions-Policy header (camera/mic/geolocation/FLoC disabled) — v1.1
- ✓ CSP hardened (unsafe-eval removed, media-src restricted) — v1.1
- ✓ Stripe webhook test suite (21 tests) — v1.1
- ✓ API test coverage 6/14 routes (74 tests total) — v1.1
- ✓ CartIcon test fixed with semantic queries — v1.1
- ✓ Product type unified (LegacyProduct deprecated, Supabase Product used) — v1.1
- ✓ Build-time AI catalogue generation from Supabase — v1.1
- ✓ Real React error boundary with Sentry integration — v1.1
- ✓ Zod cart validation on localStorage hydration — v1.1
- ✓ Cart hydration race condition fixed (useReducer initializer) — v1.1
- ✓ Consistent API error handling across all routes — v1.1
- ✓ Database performance indexes (8 indexes for products/blog/orders) — v1.1
- ✓ Blog ISR with 60s revalidation using public client — v1.1
- ✓ N+1 query eliminated in getRelatedProducts — v1.1
- ✓ Admin dashboard queries consolidated (10 → 5) — v1.1
- ✓ Explicit column selection in all DB queries — v1.1
- ✓ Three.js removed (~600KB bundle reduction) — v1.1
- ✓ Preconnect hints for Supabase and Stripe — v1.1
- ✓ Form accessibility (htmlFor/id, aria-labels, fieldset/legend) — v1.1
- ✓ Magic numbers extracted to named constants — v1.1

- ✓ Complete luxury design overhaul with new template and layout structure — v1.2
- ✓ Perfect responsive design across all screen sizes (mobile, tablet, desktop) — v1.2
- ✓ Premium brand identity preserving gold accents with sophisticated color palette — v1.2
- ✓ Smooth animations and micro-interactions throughout user journey — v1.2
- ✓ High-end typography and spacing system for luxury feel — v1.2
- ✓ Optimized perfume e-commerce UX (product discovery, customization, checkout) — v1.2
- ✓ Homepage redesign with luxury brand storytelling — v1.2
- ✓ Product catalog with enhanced visual hierarchy and filtering — v1.2
- ✓ Custom perfume builder with premium interface design — v1.2
- ✓ Cart and checkout flow with luxury shopping experience — v1.2
- ✓ Customer account area with premium dashboard design — v1.2
- ✓ Admin panel design consistency (maintain functionality, elevate aesthetics) — v1.2

### Active

- [ ] Cinematic homepage with parallax scrolling and immersive brand storytelling
- [ ] 3D product showcases with interactive rotation and zoom capabilities
- [ ] Advanced product discovery with smooth filtering and immersive browsing
- [ ] Parallax scrolling effects throughout entire user journey
- [ ] Cinematic page transitions and micro-animations
- [ ] 3D enhanced custom perfume builder with interactive visualization
- [ ] Mobile-first responsive design optimized for touch interactions
- [ ] Performance-optimized animations and smooth 60fps experiences
- [ ] Middle East luxury retail inspired visual design language
- [ ] Customer engagement analytics and interaction tracking
- [ ] High-end loading states and progressive disclosure patterns
- [ ] Advanced scroll-triggered animations and reveals

### Out of Scope

- Full order tracking page for customers — future enhancement
- Conditional shipping pricing — decided to keep all shipping free
- Checkout UX redesign — current flow works
- Mobile app checkout — web only
- CSRF token on checkout — low risk, rate limit sufficient
- Full CSP nonce-based approach — requires Next.js middleware changes
- Framer Motion replacement — 53 files, too broad for current scope
- Admin dashboard redesign — functional, not UX overhaul

## Current Milestone: v2.0 Immersive Luxury Experience

**Goal:** Transform Aquador into an exceptional luxury perfume destination with cutting-edge visual effects, 3D showcases, and immersive interactions that create customer amazement and engagement.

**Target features:**
- Complete site transformation with smooth parallax scrolling throughout
- 3D product showcases with interactive capabilities
- Cinematic animations and page transitions
- Immersive product discovery and browsing experience
- Middle East luxury retail inspired design language
- Customer engagement focused interactions and micro-animations

## Context

**Codebase:** Next.js 14 App Router, React 18, TypeScript, Supabase (ref: hznpuxplqgszbacxzbhv), Stripe, Resend, Sentry. Vercel deployment.

**Current state (post-v1.1):** 22,007 LOC TypeScript across 77 modified files in v1.1. All security vulnerabilities (RLS, GDPR, SQL injection, open redirect) addressed in code. Two Supabase migrations pending deployment due to migration history mismatch.

**Deployment blocker:** Supabase has 21 remote migrations not present in local history. Must repair migration history before pushing RLS policies and performance indexes.

**Two checkout flows:**
1. **Cart checkout** — `/api/checkout` → Stripe Checkout Session → `/checkout/success`
2. **Custom perfume checkout** — `/api/create-perfume/payment` → Stripe Checkout Session → `/create-perfume/success`

Both converge at `/api/webhooks/stripe` which persists orders and sends emails.

**Test coverage:** 74 API tests across 6/14 routes. Stripe webhook (21), checkout (9), blog (9), heartbeat (11), health (6), contact (10). AI assistant route untested (Jest fetch mocking limitation).

**Known tech debt:**
- Framer Motion in 53 files (~330KB) — needs tree-shaking or lazy loading
- Long files: reorder 610, ProductForm 568, categories 549, webhook 512
- LegacyProduct still used in FeaturedProducts, RelatedProducts, LattafaContent
- AI assistant route untested
- unsafe-inline in CSP (Next.js/Tailwind requirement)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Server-side price validation against product catalog | Client-sent prices cannot be trusted — core e-commerce security | ✓ Good |
| Standardize shipping as always free | Simplifies messaging, matches current behavior | ✓ Good |
| Enhance success pages with Stripe session data | Customers deserve to see what they ordered | ✓ Good |
| Use order record to gate email sending | Prevents duplicate emails on webhook retries | ✓ Good |
| Shortened metadata keys (pid/vid/qty) | Stay under Stripe 500-char limit on large carts | ✓ Good |
| Session-based order confirmation | Stripe session is single source of truth for success pages | ✓ Good |
| Order number = last 8 chars of session ID | Simple, unique, no extra DB column needed | ✓ Good |
| Database-based email idempotency | upsert ignoreDuplicates returns isNewOrder flag | ✓ Good |
| Centralize shared utilities | Eliminate code duplication across webhook and routes | ✓ Good |
| Webhook metadata reconstruction | Parse shortened format and rebuild from product catalog | ✓ Good |
| RLS with anon/admin/service_role layers | Defense-in-depth for database access control | ✓ Good |
| sendDefaultPii: false for GDPR | Prevent PII transmission to third-party (Sentry) | ✓ Good |
| PostgREST escaping for admin search | Prevent SQL injection via ilike special characters | ✓ Good |
| Permissions-Policy for browser API lockdown | Reduce attack surface for malicious scripts | ✓ Good |
| Build-time AI catalogue via prebuild | Fresh product data without cold start latency | ✓ Good |
| LegacyProduct deprecated, not removed | Gradual migration avoids breaking other components | ✓ Good |
| Zod cart validation on hydration | Prevents corrupt localStorage from crashing app | ✓ Good |
| useReducer initializer for cart state | Hydration-safe — reads localStorage once during init | ✓ Good |
| Public Supabase client for blog | Enables static/ISR rendering without cookie dependency | ✓ Good |
| Admin dashboard in-memory aggregation | 50% query reduction (10 → 5) with acceptable data size | ✓ Good |
| CSS-only backgrounds replacing Three.js | 600KB savings for minimal visual difference | ✓ Good |
| Explicit column selection constants | Reduces data transfer, documents expected schema | ✓ Good |
| getRelatedProducts with category param | Eliminates N+1 — caller already has category | ✓ Good |
| Consistent try/catch error handling | All 12 API routes return structured { error: string } | ✓ Good |

## Constraints

- **Tech stack**: Next.js 14, Stripe, Supabase, Resend — no new dependencies (tsx added for build scripts)
- **Backward compatible**: Existing Stripe webhook secret and checkout flow must keep working
- **No downtime**: Changes must be deployable without breaking live orders
- **Supabase schema**: Orders and customers tables already exist
- **CSP limitation**: unsafe-inline required by Next.js/Tailwind

---
*Last updated: 2026-03-09 after v2.0 milestone start*
