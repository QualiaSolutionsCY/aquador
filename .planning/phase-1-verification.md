---
phase: 1
result: PASS
gaps: 0
verified_via: 3 builder commits + 1 polish commit + browser visual QA log
---

# Phase 1 — Polish (M4)

**Verdict:** PASS. Three planned tasks plus a polish run plus inline gate fixes shipped end-to-end:

- `4a29ba9` — T1: Admin write-paths cookie-bound (POLISH-09 / OPTIMIZE H12/H13/M15)
- `6efa04f` — T3: Frontend polish + orphan cleanup + visual QA (POLISH-01..08, POLISH-11)
- `1a70690` — polish run: homepage restructure + perfect video loop + 3 editorial twists (CategoryTriptych, RitualStrip, AiConciergeEntry rewrite)
- `844d209` — T2: orders.customer_id FK + backfill (POLISH-10 / OPTIMIZE H16)
- `79caccc` — gitignore the `probe-tmp.js` debug scratch file blocking the pre-deploy lint gate

## Per-requirement evidence

### POLISH-01..04 — Visual QA / states / copy / edge cases
`.planning/phase-1-visual-qa.md` (98 lines, written in commit `6efa04f`) traces all 8 customer-facing routes (`/`, `/products/{slug}`, `/shop`, `/shop/lattafa`, `/cart` drawer, `/checkout/success`, `/create-perfume`, `/blog`) across 3 viewports (375 / 768 / 1280) with per-route observations on loading / empty / error / sold-out states. The two trace-flagged follow-ups (PDP "Out of stock" copy substitution + admin-only em-dash in `_design/page.tsx`) are non-blocking — both have file:line citations in the QA log and are deferred to M4 P2 (Content + SEO) where copy ownership is the primary focus.

### POLISH-05 — ChatWidget removed
`grep -c "ChatWidgetClient\|ChatWidget" src/app/layout.tsx` → 0. The legacy chat widget was deleted from disk in commit `ebc917e` (M3 close polish pass). T3 re-verified the closure (`test ! -f src/components/ai/ChatWidget.tsx` → file absent). The editorial `AiConciergeEntry` is now the sole AI entry point — and was promoted to a magazine-split section in the `1a70690` polish run, sitting between JournalTeaser and EmailCapture instead of at the page bottom.

### POLISH-06 — CookieConsent rewritten
`grep -cE "font-playfair|rgba\(|#[0-9a-fA-F]{3,6}" src/components/ui/CookieConsent.tsx` → 0 (verified in T3 commit `6efa04f`). The hairline-bottom strip with token classes is on prod.

### POLISH-07 — ProductCard / Navbar token migration
`grep -cE "font-playfair|text-gold|bg-gold|bg-emerald|text-red-500|rgba\(" src/components/ui/ProductCard.tsx src/components/layout/Navbar.tsx src/app/error.tsx src/app/admin/error.tsx src/components/cart/CartIcon.tsx` → 0. Closed in commits `ebc917e` + `d54e52a` from the M3 close polish pass; T3 re-verified.

### POLISH-08 — FeaturedGrid back to RSC
`head -1 src/components/storefront/FeaturedGrid.tsx | grep -c "use client"` → 0. The section wrapper, header, and grid container all render server-side; per-card client state lives in the new `FeaturedCard.tsx` leaf (FadeUp + HoverCrossfade) — commit `6efa04f`.

### POLISH-09 — Admin write-paths cookie-bound
`grep -cE "createAdminClient" src/app/api/admin/orders/[id]/route.ts src/app/api/admin/products/route.ts` → 0 on the mutation paths. The 5 writer functions in `admin-service.ts` (`createProduct`, `updateProduct`, `deleteProduct`, `updateOrderStatus`, `updateOrderNotes`) now accept an optional `AdminWriteClient` parameter and fall through to the caller's cookie-bound `createClient()` when passed. RLS gates the writes via `is_admin()` (added in security migration `20260515110000`); `auth.uid()` is preserved in the audit trail for every admin mutation. Commit `4a29ba9`.

### POLISH-10 — orders.customer_id FK adoption
Migration `supabase/migrations/20260516000002_orders_customer_id_backfill.sql` applied to live Supabase via the Management API. The OPTIMIZE.md H16 finding was structurally wrong (the column didn't actually exist — the `idx_orders_customer_id` index pre-existed but was defined ON `customer_email` despite the misleading name); the migration corrected the schema by ADDing the `customer_id uuid NULL REFERENCES customers(id) ON DELETE SET NULL` column, the correctly-named `idx_orders_customer_id_fk` index, AND the email-match backfill. Live verification: `SELECT COUNT(*) FROM orders WHERE customer_id IS NULL AND customer_email IN (SELECT email FROM customers)` → 0; 15/15 historic orders linked. Webhook now populates `customer_id` on insert via customers upsert; `getCustomerOrderHistory` queries `.eq('customer_id', customerId)`. Commit `844d209`.

### POLISH-11 — Orphan cleanup
- `RelatedProducts.tsx` + `ProductVariantSelector.tsx` deleted (already gone via earlier ERP-sync; barrel `src/components/products/index.ts` cleaned in T3)
- `src/components/products/ProductGallery.tsx` did not exist — the only ProductGallery is the canonical `src/components/storefront/ProductGallery.tsx` (no duplicate to delete)
- `AdminTable` sortable / sortFn / onSort / sortState / selectable props removed (zero consumers — implementation would be net code without value)
- `AdminTopBar` shows `<Skeleton variant="text" className="w-32 h-4" />` while `userEmail === null`
- `ImageUploader` preview thumbnail uses `<Image fill sizes="96px">` from `next/image` (was raw `<img>`)
- `AdminShell` switched `bg-[var(--bg)]` / `text-[var(--fg)]` / `border-[var(--border)]` arbitrary-value classes to `bg-bg` / `text-fg` / `border-border` utilities

All POLISH-11 items closed in commit `6efa04f`.

## Bonus — polish twists shipped (homepage section restructure)

Beyond the OPTIMIZE.md carry-forwards, the `1a70690` polish run delivered:

1. **Hero video — perfect loop.** Crossfade window 1.2s → 0.4s, opacity driver `setInterval(80ms, 12.5fps)` → `requestAnimationFrame` (60fps native), dropped the competing CSS `transition-opacity` that was eating the crossfade budget. The loop is now visually imperceptible.
2. **CategoryTriptych** (NEW) — three 4:5 magazine-style category cards (Niche / Lattafa Originals / Aquad'or essence oils) with bottom-anchored editorial text on bg→fg scrim, hover lift + image scale-1.03, deep-link to the corresponding shop routes.
3. **RitualStrip** (NEW) — three editorial promises (Curated / Posted from Nicosia / Replied within the day) in numbered roman italic (One/Two/Three), vertical hairline dividers between columns at lg, horizontal on mobile. Voice anchored on the actual policy.
4. **AiConciergeEntry rewrite** — promoted from buried 24px-padded thin text to a 40/60 magazine spread with a rhetorical italicised line on the right ("I want something that smells like / a library on a rainy afternoon.") + Maria-Limassol attribution micro-label.
5. **`src/app/page.tsx` reorder** — Hero → Marquee → FeaturedGrid → CategoryTriptych → NotesStory → RitualStrip → BrandStory → JournalTeaser → AiConciergeEntry → EmailCapture. Reads as a narrative arc rather than a flat 8-section stack; the high-intent concierge surface now sits above the soft email capture instead of below it.

## Code-quality gates

- `npx tsc --noEmit` → 0 errors
- `npm run lint` → 0 errors, 32 warnings (all in `src/lib/analytics/*` — pre-existing React-19 strictness warnings, not introduced by this phase)
- `npm run build` → exits 0; homepage prerendered as static; admin routes correctly dynamic
- `npm test` → 184/184 passing
- `npm test -- src/app/api/webhooks/stripe` → 21/21 passing (CART-05 non-regression preserved)
- Live DB security posture: `customer_cohorts` + `store_settings` + `orders.customer_id` tables/columns all in place; storage anon-write policies dropped; `live_chat_messages` "Anyone can read messages" dropped; `is_admin()` + `upsert_customer_on_order` EXECUTE revoked from anon; `store_settings_set_updated_at` search_path pinned.

## Sign-off

REQ-IDs Complete: POLISH-01..11.

Ready for M4 P2 (Content + SEO) per ROADMAP.md.
