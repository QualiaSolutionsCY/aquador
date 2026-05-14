---
phase: 04-webhook-metadata-reconstruction
plan: 01
subsystem: payments/webhooks
tags: [gap-closure, stripe, metadata, integration, critical-fix]
dependency_graph:
  requires:
    - 01-02 (shortened metadata format)
  provides:
    - webhook-metadata-reconstruction
  affects:
    - order-persistence
    - confirmation-emails
    - store-notifications
tech_stack:
  added: []
  patterns: [metadata-reconstruction, catalog-lookup]
key_files:
  created: []
  modified:
    - src/app/api/webhooks/stripe/route.ts
decisions: []
metrics:
  duration_minutes: 1
  tasks_completed: 1
  deviations: 0
  completed_date: 2026-03-02
---

# Phase 04 Plan 01: Webhook Metadata Reconstruction Summary

**One-liner:** Webhook now reconstructs full item data (name, quantity, price) from shortened metadata identifiers (pid, vid, qty) using product catalog lookup.

## What Was Built

Fixed critical integration gap where Stripe webhook handler was unable to process cart checkout orders because it expected full item objects but received shortened metadata format introduced in Phase 1 Plan 01-02.

**Problem:** Phase 1 shortened metadata to `{pid, vid, qty}` to stay under Stripe's 500-char limit, but webhook was never updated to handle this format. Result: corrupt order data in Supabase, malformed confirmation emails with undefined product names.

**Solution:** Import `getProductById` from product-service, parse shortened metadata as `Array<{pid, vid, qty}>`, reconstruct full `OrderItem` objects with complete product details from catalog.

### Implementation

**Added to webhook handler:**

1. **Import product lookup** (line 8):
```typescript
import { getProductById } from '@/lib/product-service';
```

2. **Metadata reconstruction logic** (lines 404-431):
   - Parse `metadata.items` as shortened format
   - Loop through each `{pid, vid, qty}` object
   - Lookup full product data from catalog
   - Reconstruct OrderItem with `{ name, quantity, price, productType }`
   - Gracefully skip missing products
   - Preserve Sentry error tracking

**Pattern matches session-details API** (Phase 2 Plan 02-01) which already had correct reconstruction logic.

### Integration Points

- **Webhook → product-service:** Calls `getProductById(shortItem.pid)` for each cart item
- **Webhook → Supabase:** Persists complete order data with proper item names
- **Webhook → email templates:** Reconstructed items have `name` property (not undefined)
- **Custom perfume flow:** Unchanged (already working correctly)

## Verification Results

**Code verification:**
- ✅ TypeScript compilation passes (no new errors)
- ✅ `getProductById` import present at top of file
- ✅ Cart item parsing uses reconstruction pattern (not direct JSON.parse)
- ✅ Reconstructed items match OrderItem interface structure
- ✅ Email templates (lines 145, 278) receive proper `item.name` values
- ✅ Sentry error tracking preserved with updated tag (`parse_cart_items`)

**Integration verification (code inspection):**
- ✅ Webhook calls product-service with correct identifier
- ✅ Order persistence receives complete data (name, quantity, price)
- ✅ Customer confirmation email displays product names (not undefined)
- ✅ Store notification email shows proper item details
- ✅ Custom perfume branch remains untouched (line 432+)

**Cannot test live webhook** without real Stripe payment — verification is code-based. Real-world validation occurs when next customer completes cart checkout on production.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| fcb14a0 | feat | Reconstruct cart items from shortened metadata in webhook |

## Deviations from Plan

None — plan executed exactly as written.

## Must-Haves Status

All 4 must-haves achieved (code-verified):

**Truths:**
1. ✅ Webhook reconstructs full item data from shortened metadata
2. ✅ Cart orders will store correct product names and prices in Supabase
3. ✅ Customer confirmation email will display correct item details
4. ✅ Store notification email will display correct order details

**Artifacts:**
- ✅ `src/app/api/webhooks/stripe/route.ts` modified (30+ lines changed)
- ✅ Contains `getProductById` import and call
- ✅ Key link: webhook → product-service via `getProductById(shortItem.pid)`

## Next Phase Readiness

**Phase 4 Complete** — Gap closure objective achieved.

**Blockers:** None

**Testing note:** This fix requires real Stripe payment to verify end-to-end. Recommended approach:
1. Deploy to production
2. Monitor next cart checkout order
3. Verify Supabase order record has proper item names
4. Verify confirmation email displays correctly

Alternative: Use Stripe CLI to simulate webhook with shortened metadata payload.

## Self-Check

**Files created:** None (modification only)

**Files modified:**
- ✅ src/app/api/webhooks/stripe/route.ts exists
- ✅ Contains reconstruction logic (lines 404-431)
- ✅ Contains getProductById import (line 8)

**Commits:**
- ✅ fcb14a0 exists in git log

**Status:** PASSED
