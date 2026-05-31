# Codebase Map

**Scanned:** 2026-05-14
**Repo:** QualiaSolutionsCY/aquador (Aquad'or Cyprus — luxury perfume e-commerce)
**LOC:** ~32,119 (TS/TSX in `src/`)

## At a Glance

- **Stack:** Next.js 14.2.35 App Router · React 18 · TS strict · Tailwind · Supabase · Stripe · Sentry on Node 20 / npm.
- **Architecture:** App Router routes → feature components → service helpers (`lib/supabase/product-service`, `lib/perfume/*`, `lib/validation/cart`) → adapter clients (4 Supabase clients, `stripe.ts`, `rate-limit.ts`). Admin auth runs in a single middleware gate over `admin_users`.
- **Conventions:** PascalCase components, kebab-case utilities, server-component default with opt-in `'use client'`, Tailwind + `cn()` (no `tailwind-merge`), conventional-commit prefixes (`feat:`/`fix:`/`style:`), colocated `__tests__/`, `@/` alias everywhere.
- **Concerns:** 1 CRITICAL, 4 HIGH, 9 MEDIUM, 6 LOW. Pre-existing Jest red (5 suites / 24 tests).

## Validated Capabilities (Inferred)

Based on existing code, this project already does:
- **Supabase product catalog with category/type/gender enums** (evidence: `src/lib/supabase/product-service.ts`, `src/lib/categories.ts`)
- **Server-side cart price re-validation against Supabase before Stripe** (evidence: `src/lib/validation/cart.ts`)
- **Stripe Checkout Sessions + Stripe PaymentIntents + signed webhook** (evidence: `src/app/api/checkout/route.ts`, `src/app/api/create-perfume/payment/route.ts`, `src/app/api/webhooks/stripe/route.ts`)
- **Custom 3-layer perfume builder with volume pricing (50ml=€29.99, 100ml=€49.99)** (evidence: `src/app/create-perfume/page.tsx`, `src/lib/perfume/{notes,composition,pricing}.ts`)
- **AI fragrance assistant via OpenRouter (Gemini 2.0 Flash default)** (evidence: `src/app/api/ai-assistant/route.ts`, `src/lib/ai/catalogue-data.ts`)
- **Supabase-backed blog with categories, featured posts, admin CRUD** (evidence: `src/app/api/blog/`, `src/lib/blog.ts`, `src/app/admin/blog/`)
- **Admin panel with middleware-gated `admin_users` membership check** (evidence: `src/middleware.ts`, `src/app/admin/`)
- **Cart state via React Context + useReducer with Zod-validated localStorage rehydration** (evidence: `src/components/cart/CartProvider.tsx`, key `aquador_cart`)
- **Upstash Redis rate limiting (gracefully no-op when unconfigured)** (evidence: `src/lib/rate-limit.ts`, applied to checkout/perfume/ai/contact)
- **Sentry error tracking with `/monitoring` tunnel, server + edge configs** (evidence: `src/instrumentation.ts`, `sentry.{server,edge}.config.ts`)
- **Contact form with Resend email** (evidence: `src/app/api/contact/route.ts`)
- **GitHub Actions CI (lint/type-check/unit/E2E/build) + deploy.yml (Vercel CLI on push to main) + preview.yml (PR previews)** (evidence: `.github/workflows/`)
- **3D product viewer (three.js + drei + fiber)** (evidence: `src/components/3d/`)
- **Rich-text blog editor (Tiptap)** (evidence: `src/components/admin/RichTextEditor` via `@tiptap/*`)

These become **Validated reqs** in PROJECT.md when `/qualia-new` runs.

## Dimension Details

- [Architecture](./architecture.md)
- [Stack](./stack.md)
- [Conventions](./conventions.md)
- [Concerns](./concerns.md)
- [Onboarding adapter](./onboarding.md)

## Onboarding adapter snapshot

- **Issue tracker:** GitHub — `https://github.com/QualiaSolutionsCY/aquador`. Default GH label set; canonicals `needs-triage` and `ready-for-agent` are MISSING and must be created by `/qualia-issues`.
- **Domain docs:** No `CONTEXT.md`/`GLOSSARY.md`/ADRs exist. `docs/AI_ASSISTANT.md`, `docs/audits/2026-01-21-production-audit.md`, `docs/audits/2026-01-21-fix-plan.md` present. Qualia creates `.planning/CONTEXT.md` + `.planning/decisions/`.
- **Existing agent files:** `CLAUDE.md` is project-tracked and well-maintained — APPEND-ONLY. Also `HANDOFF.md`, `IMPLEMENTATION_PLAN.md`, `DEPLOYMENT.md` at root. No `AGENTS.md`/`.cursor/`/`.aider`/`.continue/`.

## Notable risks for any future work

- **Three coexisting product type systems** (`LegacyProduct` in `src/types/index.ts`, variant-based `Product` in `src/types/product.ts`, Supabase `Product` in `src/lib/supabase/types.ts`) — `ProductCard` literally branches on both shapes (`src/components/ui/ProductCard.tsx:23-34`). Highest-leverage refactor target.
- **`/api/admin/setup` auth model is weak** — env-flag + shared key. Treat as a security-debt task before any new admin work.
- **`/api/heartbeat` runs service-role DELETE on every public POST.** Wrong surface. Move to cron.
- **`src/app/sitemap.ts` bypasses the Supabase adapter layer** — direct `@supabase/supabase-js` import.
- **Pre-existing Jest failures (24 tests / 5 suites)** — repair before any coverage push.
- **Stack is two majors behind** (Next 14 → 16, React 18 → 19). Deliberate migration, not a fix.
