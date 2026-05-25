# Aquad'or Cyprus

Luxury perfume ecommerce and operations platform for Aquad'or Cyprus.

Production: https://www.aquadorcy.com

## Overview

Aquad'or is a Next.js storefront and admin system for selling perfumes, original brand products, essence oils, body lotions, and custom perfume blends in Cyprus. The public site includes catalogue browsing, product detail pages, cart and Stripe checkout, a custom perfume builder, editorial blog content, and an AI fragrance assistant. The admin area supports products, orders, customers, blog posts, settings, live chat, and perfume intelligence research for staff.

## Architecture

- Framework: Next.js 16 App Router, React 19, TypeScript
- Styling: Tailwind CSS with project design tokens, Geist and Cormorant type
- Database and auth: Supabase Postgres, Supabase Auth, RLS policies
- Storage: Supabase Storage buckets for product and blog media
- Payments: Stripe Checkout and custom perfume payment flows
- AI: OpenRouter-backed storefront assistant and admin perfume intelligence
- Email: Resend for contact and transactional surfaces
- Monitoring: Sentry, Vercel Analytics, Vercel Speed Insights, UptimeRobot
- Hosting: Vercel, manual production deploys

Key production services:

- Supabase project ref: `hznpuxplqgszbacxzbhv`
- Vercel project: `aquador`
- GitHub repo: `QualiaSolutionsCY/aquador`
- UptimeRobot: https://stats.uptimerobot.com/bKudHy1pLs

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Local development runs at `http://localhost:3000`.

Before a production build, make sure Supabase credentials are present. The build runs `npm run generate:catalogue` before `next build`; without Supabase credentials it reuses the existing generated catalogue file.

## Environment Variables

Copy `.env.example` to `.env.local` and provide values for the variables needed by the surface you are running.

Required for the full app:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `OPENROUTER_API_KEY`
- `RESEND_API_KEY`
- `CONTACT_EMAIL_TO`

Monitoring and optional infrastructure:

- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Never commit `.env`, `.env.local`, `.env.production.local`, service role keys, Stripe secrets, or OpenRouter keys.

## Commands

```bash
npm run dev                 # Development server
npm run build               # Production build
npm run start               # Serve a built app locally
npm run lint                # ESLint plus design-law checks
npm run type-check          # TypeScript check
npm run test                # Jest unit tests
npm run test:e2e            # Playwright E2E tests
npm run test:all            # Lint, types, Jest, Playwright
npm run lighthouse          # Lighthouse route checks
npm run generate:catalogue  # Generate AI catalogue data from Supabase
```

## API Notes

Main API route groups:

- `/api/checkout` and `/api/webhooks/stripe` handle Stripe checkout and order persistence.
- `/api/create-perfume/payment` handles custom perfume payments.
- `/api/ai-assistant` powers the storefront AI assistant.
- `/api/admin/*` contains admin-only operational endpoints.
- `/api/admin/perfume-intel` powers the staff perfume intelligence desk.
- `/api/health` is the production health check.

Database schema changes live in `supabase/migrations/`. Apply DDL through reviewed migration files and Supabase tooling, not ad hoc production edits.

## Deployment

Production deploys via:

```bash
vercel --prod
```

GitHub auto-deploy is disabled. Pushing or merging code does not ship by itself. After a deploy, verify:

```bash
curl -sS https://www.aquadorcy.com/api/health
curl -sSI https://www.aquadorcy.com/admin
```

Expected results:

- `/api/health` returns `{"status":"ok"}`.
- `/admin` redirects unauthenticated users to `/admin/login`.

## Operations

The operator runbook is at `docs/RUNBOOK.md`. It covers deployment, rollback, Stripe refunds, admin password resets, Supabase backup restore, Sentry triage, manual orders, and blog publishing.

Handoff artifacts are under `.planning/`, including:

- `.planning/HANDOFF.md`
- `.planning/archive/`
- `.planning/reports/optimize/OPTIMIZE.md`
- `.planning/decisions/`

## Support

Contact: Fawzi Goussous, fawzi@qualiasolutions.net

Standard support window: 30 days post-handoff.
