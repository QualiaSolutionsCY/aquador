# Aquad'or Cyprus - Handover

## What Was Built

- Rebuilt the customer storefront on Next.js 16 and React 19 with a token-driven luxury design system, responsive product grids, PDPs, cart, checkout, custom perfume builder, blog, and AI concierge.
- Rebuilt the admin panel for products, orders, customers, blog, settings, live chat, and staff perfume intelligence.
- Hardened production security around RLS policies, public health output, checkout session detail exposure, live chat access, storage policies, and exposed SECURITY DEFINER functions.
- Added production operations support: dashboard metrics, customer/order management, manual orders, Supabase migrations, runbook, SEO artifacts, monitoring baseline, and handoff archive.
- Completed a final optimization pass and shipped fixes for storefront query load, admin runtime isolation, product admin filtering and bulk actions, and dashboard metric aggregation.

## Access

- URL: https://www.aquadorcy.com
- Admin login: credentials are delivered out of band; do not store them in git. Use `.planning/credentials.md` locally if a secure local inventory is needed.
- Supabase: project ref `hznpuxplqgszbacxzbhv`
- GitHub: https://github.com/QualiaSolutionsCY/aquador
- Vercel: https://vercel.com/qualiasolutionscy/aquador
- Latest production deployment: `dpl_5Z1euZgCboo1c4gtqKqazGnSCR2D`
- Walkthrough: deliver as an out-of-band video link or live admin walkthrough; no recording is stored in this repository.

## How to Use

- Customers browse the catalogue from `/shop`, filter by category/brand/stock/price, open product pages, add items to the cart, and complete payment through Stripe checkout.
- Customers can use `/create-perfume` to build a three-layer custom perfume and pay through the custom perfume payment flow.
- Staff log in at `/admin/login`, then use `/admin` for metrics, `/admin/products` for catalogue maintenance, `/admin/orders` for fulfillment, `/admin/customers` for customer history, `/admin/blog` for editorial content, and `/admin/perfume-intel` for perfume research.
- Staff should use `docs/RUNBOOK.md` for deploys, rollbacks, refunds, admin password resets, Supabase backup restore, Sentry triage, manual orders, and blog publishing.

## Known Limitations

- English-only. Multi-language i18n is out of scope for v3.
- EUR-only. Multi-currency is out of scope for v3.
- Loyalty, rewards, subscriptions, sample-of-the-month, native mobile apps, and ERP integrations are deferred.
- GitHub auto-deploy is disabled. Production deploys are manual with `vercel --prod`.
- No tracked optimization findings remain open in the final full-site pass.

## Maintenance

- Hosting: Vercel, manual deploys via `vercel --prod`
- Database: Supabase, region `eu-west-1`, project ref `hznpuxplqgszbacxzbhv`
- Payments: Stripe
- Email: Resend
- AI: OpenRouter
- Monitoring: Sentry, Vercel Analytics, Vercel Speed Insights, UptimeRobot status page https://stats.uptimerobot.com/bKudHy1pLs
- Domain: `aquadorcy.com` and `www.aquadorcy.com` are aliased to the Vercel production deployment.

## Production Verification

- `https://www.aquadorcy.com/` returned HTTP 200 on 2026-05-25.
- Warm homepage response: 0.341s.
- Warm `/shop` response: 0.740s.
- Warm `/admin/login` response: 0.493s.
- `/admin` redirects unauthenticated users to `/admin/login`.
- `/api/health` returns `{"status":"ok"}`.
- Latest Vercel production deployment is READY and aliased to `www.aquadorcy.com`.
- Supabase Security Advisor returned zero security lints after the final security migration.

## Milestones Shipped

- Milestone 1, Design Foundation: 3 of 3 phases completed, closed 2026-05-14.
- Milestone 2, Storefront That Sells: 5 of 5 phases completed, closed 2026-05-15.
- Milestone 3, Admin Rebuild: 4 of 4 phases completed, closed 2026-05-15.
- Milestone 4, Handoff: archive artifacts present under `.planning/archive/milestone-4-handoff/`.

## Archive

The client archive is present under `.planning/archive/` and includes:

- Milestone 1 plans and verification reports.
- Milestone 2 plans and verification reports.
- Milestone 3 plans, optimization report, and verification reports.
- Milestone 4 production health check, Lighthouse scores, keyboard navigation audit, security re-audit, Sentry baseline, and production audit artifacts.

Credentials are intentionally not archived in git. Deliver credentials through a secure vault or encrypted channel.

## Support

Contact: Fawzi Goussous - fawzi@qualiasolutions.net

Standard support window: 30 days post-handoff.
