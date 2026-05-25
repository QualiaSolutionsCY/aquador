---
date: 2026-05-25 13:51 +03
mode: full
critical: 0
high: 1
medium: 0
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
| F3 | Backend | Custom perfume price knowledge was stale in planning docs | `src/lib/perfume/pricing.ts`, `.planning/CONTEXT.md` | Preserved production price source: 50ml EUR 29.99, 100ml EUR 49.99 |
| F4 | Backend | Custom perfume payment endpoint accepted arbitrary note strings | `src/app/api/create-perfume/payment/route.ts`, `src/lib/perfume/notes.ts` | Added server-side layer note allowlists |
| F5 | Security | Public live-chat notify depended on anon session SELECT | `src/app/api/live-chat/notify/route.ts`, `supabase/migrations/20260525093000_tighten_live_chat_session_select.sql` | Notify route validates with server service role; migration removes anon-wide session SELECT |
| F6 | Security | Public health endpoint exposed environment/service flags | `src/app/api/health/route.ts` | Public response reduced to `{ status: "ok" }` |
| F7 | Security | Rate limiting failed open in production without Upstash | `src/lib/rate-limit.ts` | Added conservative in-memory production fallback |
| F8 | UX | Sold-out product CTA still said "Add to bag" | `src/components/storefront/ProductActions.tsx`, `StickyATC.tsx` | Disabled CTAs now say "Out of stock" |
| F9 | UX | Cart/trust copy contradicted always-free shipping | `src/lib/constants.ts`, cart/storefront copy | Shipping is now consistently free/included |
| F10 | UX | PDP gallery was capped at 520px | `src/components/storefront/ProductGallery.tsx` | Raised square image container cap to 800px while preserving `object-contain` |
| F11 | Frontend | Product quick view nested a link inside the product card link and used legacy gold styling | `src/components/shop/ProductQuickView.tsx` | Removed nested link, tokenized overlay treatment |
| F12 | Security | Paid checkout session details exposed shipping PII by bearer `session_id` | `src/app/api/checkout/session-details/route.ts` | Public response now omits session id, customer name, address, postal code, country, and ACS checkpoint data |
| F13 | Admin | Orders admin lacked date/amount sort controls | `src/app/admin/orders/page.tsx` | Added server-side Supabase sort control for newest, oldest, highest total, and lowest total |
| F14 | Performance | Visitor heartbeat wrote every 30 seconds | `src/hooks/useVisitorHeartbeat.ts` | Reduced recurring heartbeat cadence to every 2 minutes while preserving immediate page-load presence |
| F15 | Security | Supabase advisors still reported permissive RLS/storage/RPC exposure | `supabase/migrations/20260525111500_clear_remaining_security_advisors.sql` | Applied migration through Supabase MCP; Security Advisor now returns zero lints |
| F16 | Frontend | Persistent floating AI bubble conflicted with the editorial concierge entrypoint | `src/components/ai/AiConciergeWidget.tsx` | Kept the global drawer event host but removed the always-present floating trigger |
| F17 | Performance | PDP social proof scanned recent order JSON in app code | `src/app/products/[slug]/page.tsx`, `src/lib/supabase/product-service.ts` | Removed the live order scan and use the static seasonal proof fallback |
| F18 | Performance | Shop pages fetched broad product sets and filtered in JS | `src/app/shop/page.tsx`, `src/app/shop/[category]/page.tsx`, `src/lib/supabase/product-service.ts` | Added Supabase-filtered shop/category product queries |
| F19 | Performance | Root layout mounted storefront-only providers on admin routes | `src/app/layout.tsx`, `src/components/providers/AppRuntimeShell.tsx`, `src/components/providers/PublicRuntime.tsx` | Admin routes now bypass cart, storefront chrome, splash, visitor heartbeat, scroll tracking, animation budget, and page transitions |
| F20 | Performance | Page transitions ran across admin routes | `src/components/providers/PublicRuntime.tsx` | Page transitions are now scoped to public runtime only |
| F21 | Admin | Products admin lacked brand/status/stock filters and bulk actions | `src/app/admin/products/page.tsx`, `src/components/admin/AdminTable.tsx` | Added brand, visibility, and stock filters plus selected-row bulk show/hide and stock toggles |
| F22 | Performance | Admin dashboard headline metrics used multiple full-row scans in Node | `src/app/admin/page.tsx`, `src/lib/supabase/admin-service.ts`, `supabase/migrations/20260525152000_dashboard_metrics_rpc.sql` | Added one `dashboard_metrics(period)` RPC for revenue, order, conversion, and customer/LTV metrics |
| F23 | UX | Customer detail page still used off-system dark cards | `src/app/admin/customers/[id]/page.tsx`, `src/components/admin/CustomerDetail.tsx` | Routed customer detail through the tokenized admin component with MetricCards, cohort tags, and AdminTable order history |

## Remaining High Priority

| # | Dimension | Finding | Location | Fix |
|---|-----------|---------|----------|-----|
| H4 | Performance | Product grids hydrate every card with Framer Motion and quick-view state | `src/components/ui/ProductCard.tsx` | Make base card a server component and lazy-load quick view as an optional island |

## Remaining Low Priority

| # | Dimension | Finding | Location | Fix |
|---|-----------|---------|----------|-----|
| L1 | Backend | Admin write helpers still keep a service-role fallback | `src/lib/supabase/admin-service.ts` | Require explicit write client for admin mutations |
| L2 | Performance | Unused 3D stack remains in source/dependencies | `src/components/3d`, `src/lib/three`, `package.json` | Delete unused 3D stack if no active route imports it |
| L3 | Quality | `any` type count remains non-zero | app/components/src/lib scan | Tighten opportunistically when touching those modules |
