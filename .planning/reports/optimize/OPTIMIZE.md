---
date: 2026-05-25 13:51 +03
mode: full
critical: 0
high: 9
medium: 13
low: 3
status: needs_attention
---

# Optimization Report

**Project:** Aquad'or | **Mode:** full | **Date:** 2026-05-25

## Summary

Ran a Qualia full-site pass with parallel frontend/UX, backend/security, and performance agents, plus local deterministic security/type/test scans. No critical issue was found. The first repair wave fixed the safest high-value issues immediately; larger architecture items remain tracked below.

## Fixed In This Wave

| # | Dimension | Finding | Location | Fix |
|---|-----------|---------|----------|-----|
| F1 | Backend | Manual order creation used service role and did not attach `orders.customer_id` | `src/app/api/admin/orders/route.ts` | Switched to cookie-bound admin client, resolves/creates customer first, inserts manual order with `customer_id` |
| F2 | Backend | Customer detail order history queried by email only | `src/app/admin/customers/[id]/page.tsx` | Primary lookup now uses `customer_id`, with email fallback for legacy rows |
| F3 | Backend | Custom perfume 100ml price contradicted project contract | `src/lib/perfume/pricing.ts`, checkout/session/webhook paths | Centralized custom perfume price: 50ml EUR 29.99, 100ml EUR 199.00 |
| F4 | Backend | Custom perfume payment endpoint accepted arbitrary note strings | `src/app/api/create-perfume/payment/route.ts`, `src/lib/perfume/notes.ts` | Added server-side layer note allowlists |
| F5 | Security | Public live-chat notify depended on anon session SELECT | `src/app/api/live-chat/notify/route.ts`, `supabase/migrations/20260525093000_tighten_live_chat_session_select.sql` | Notify route validates with server service role; migration removes anon-wide session SELECT |
| F6 | Security | Public health endpoint exposed environment/service flags | `src/app/api/health/route.ts` | Public response reduced to `{ status: "ok" }` |
| F7 | Security | Rate limiting failed open in production without Upstash | `src/lib/rate-limit.ts` | Added conservative in-memory production fallback |
| F8 | UX | Sold-out product CTA still said "Add to bag" | `src/components/storefront/ProductActions.tsx`, `StickyATC.tsx` | Disabled CTAs now say "Out of stock" |
| F9 | UX | Cart/trust copy contradicted always-free shipping | `src/lib/constants.ts`, cart/storefront copy | Shipping is now consistently free/included |
| F10 | UX | PDP gallery was capped at 520px | `src/components/storefront/ProductGallery.tsx` | Raised square image container cap to 800px while preserving `object-contain` |
| F11 | Frontend | Product quick view nested a link inside the product card link and used legacy gold styling | `src/components/shop/ProductQuickView.tsx` | Removed nested link, tokenized overlay treatment |

## Remaining High Priority

| # | Dimension | Finding | Location | Fix |
|---|-----------|---------|----------|-----|
| H1 | Frontend | Persistent AI bubble conflicts with planned concierge entrypoint | `src/components/layout/StorefrontChrome.tsx`, `src/components/ai/AiConciergeWidget.tsx` | Split drawer host from trigger; render only the editorial entrypoint globally |
| H2 | Performance | PDP social proof scans recent order JSON in app code | `src/lib/supabase/product-service.ts`, `src/app/products/[slug]/page.tsx` | Replace with DB-side RPC/view or remove live count |
| H3 | Performance | Admin dashboard aggregates multiple full-row scans in Node | `src/app/admin/page.tsx`, `src/lib/supabase/admin-service.ts` | Add one `dashboard_metrics(period)` RPC/view-backed endpoint |
| H4 | Performance | Product grids hydrate every card with Framer Motion and quick-view state | `src/components/ui/ProductCard.tsx` | Make base card a server component and lazy-load quick view as an optional island |
| H5 | Security | Paid checkout session details expose PII by bearer `session_id` | `src/app/api/checkout/session-details/route.ts` | Return non-PII publicly or add signed lookup token in success URL |

## Remaining Medium Priority

| # | Dimension | Finding | Location | Fix |
|---|-----------|---------|----------|-----|
| M1 | UX | Customer detail page still uses off-system dark cards | `src/app/admin/customers/[id]/page.tsx` | Convert to admin token surfaces and reuse table primitives |
| M2 | Admin | Products admin lacks brand/status/stock filters and bulk actions | `src/app/admin/products/page.tsx` | Add filter controls and bulk activate/deactivate |
| M3 | Admin | Orders admin lacks date/amount sort controls | `src/app/admin/orders/page.tsx` | Add sort select mapped to Supabase `.order()` |
| M4 | Performance | Shop fetches broad product sets and filters in JS | `src/app/shop/page.tsx`, `src/app/shop/[category]/page.tsx` | Push product type/category filters into Supabase queries |
| M5 | Performance | Root layout hydrates storefront-only providers for admin too | `src/app/layout.tsx` | Move storefront providers into public route group/layout |
| M6 | Performance | Page transitions add site-wide Framer Motion/analytics work | `src/components/providers/PageTransition.tsx` | Gate to public layout or remove for handoff performance |
| M7 | Performance | Visitor heartbeat writes every 30 seconds | `src/hooks/useVisitorHeartbeat.ts`, `src/app/api/heartbeat/route.ts` | Increase interval or upsert one session row |

## Remaining Low Priority

| # | Dimension | Finding | Location | Fix |
|---|-----------|---------|----------|-----|
| L1 | Backend | Admin write helpers still keep a service-role fallback | `src/lib/supabase/admin-service.ts` | Require explicit write client for admin mutations |
| L2 | Performance | Unused 3D stack remains in source/dependencies | `src/components/3d`, `src/lib/three`, `package.json` | Delete unused 3D stack if no active route imports it |
| L3 | Quality | `any` type count remains non-zero | app/components/src/lib scan | Tighten opportunistically when touching those modules |
