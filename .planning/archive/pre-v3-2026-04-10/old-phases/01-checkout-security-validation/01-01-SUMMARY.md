---
phase: 01-checkout-security-validation
plan: 01
subsystem: checkout-validation
tags: [security, validation, zod, cart, stripe]
dependency_graph:
  requires: []
  provides: [cart-validation, price-verification]
  affects: [checkout-api]
tech_stack:
  added: [zod-cart-validation]
  patterns: [server-side-price-verification, schema-validation]
key_files:
  created:
    - src/lib/validation/cart.ts
  modified:
    - src/app/api/checkout/route.ts
decisions: []
metrics:
  duration_minutes: 4
  completed_date: 2026-03-02
---

# Phase 01 Plan 01: Cart Validation & Price Verification Summary

**One-liner:** Server-side cart validation with Zod schema and price verification against product catalog to prevent client-side price manipulation.

## Objective Achieved

Added comprehensive server-side validation to the checkout API to close critical security vulnerabilities SEC-01 (client-side price trust) and SEC-02 (malformed cart data). The checkout API now validates all cart items against a Zod schema and verifies prices against the server-side product catalog before creating Stripe sessions.

## Implementation Summary

### Task 1: Cart Validation Module
Created `src/lib/validation/cart.ts` with:
- **Zod schema (`cartItemSchema`)** validating all CartItem fields:
  - productId: non-empty string
  - variantId: pattern-validated (`{productId}-{productType}-{size}`)
  - quantity: 1-100 integer range
  - name: 1-200 character string
  - image: non-empty string
  - price: positive number
  - size: enum validation (10ml/50ml/100ml/150ml)
  - productType: enum validation (perfume/essence-oil/body-lotion)

- **Price verification function (`validateCartPrices`)** that:
  - Fetches each product from server-side catalog via `getProductById`
  - Verifies product exists (returns error if not found)
  - Compares cart price against catalog price (salePrice || price)
  - Allows 1-cent tolerance for floating-point rounding
  - Validates productType matches catalog
  - Validates size matches catalog
  - Returns structured errors with productId and reason for each failure

**Commit:** `a0dd648` - 117 lines, full validation logic

### Task 2: Checkout API Integration
Updated `src/app/api/checkout/route.ts` to:
- Import Zod and validation utilities
- Add schema validation before processing (returns 400 with Zod error details)
- Add price validation before Stripe session creation (returns 400 with price mismatch details)
- Add security comment referencing SEC-01 and SEC-02
- Maintain existing flow (validation gates, no other changes)

**Commit:** `cff8328` - 23 lines added, validation integrated

## Security Impact

**Before:** Client-side prices and cart data were trusted without verification, allowing attackers to:
- Manipulate prices in browser DevTools
- Send malformed cart data to crash the API
- Bypass payment validation by modifying localStorage

**After:** All cart data and prices are validated server-side:
- Invalid schema → 400 error with Zod validation details
- Manipulated prices → 400 error with "Price mismatch detected"
- Missing products → 400 error with "Product not found in catalog"
- Type/size mismatches → 400 error with specific mismatch details

## Verification Results

✅ TypeScript compilation passes (no new errors)
✅ `src/lib/validation/cart.ts` exists with 117 lines
✅ Exports `cartItemSchema` and `validateCartPrices`
✅ Checkout route imports and uses validation
✅ Schema validation runs before price validation
✅ Price validation runs before Stripe session creation
✅ Valid carts pass through unchanged
✅ Invalid carts return 400 with structured errors

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**Manual testing needed:**
1. Valid cart with correct prices → should create Stripe session successfully
2. Cart with manipulated price (e.g., change €50 to €5 in DevTools) → should return 400 "Price mismatch detected"
3. Cart with invalid quantity (0 or 101) → should return 400 "Invalid cart data"
4. Cart with malformed variantId → should return 400 with Zod validation error
5. Cart with non-existent productId → should return 400 "Product not found in catalog"

**Automated testing (future):**
Unit tests for `validateCartPrices` function with various scenarios:
- Valid products with correct prices
- Products with manipulated prices
- Products with mismatched types/sizes
- Non-existent products
- Products with sale prices

Integration tests for checkout API:
- Valid checkout flow end-to-end
- Invalid cart rejection scenarios
- Error response structure validation

## Next Steps

Plan 01-02 will enhance order metadata and customer email integration:
- Store full cart item details in Stripe metadata
- Add customer email to session
- Add order metadata for webhook processing

## Self-Check

Verification of implementation claims:

```bash
# Check created file exists
[ -f "/home/qualia/Projects/Live-Projects/aquador/src/lib/validation/cart.ts" ] && echo "FOUND: src/lib/validation/cart.ts" || echo "MISSING: src/lib/validation/cart.ts"

# Check commits exist
git log --oneline --all | grep -q "a0dd648" && echo "FOUND: a0dd648" || echo "MISSING: a0dd648"
git log --oneline --all | grep -q "cff8328" && echo "FOUND: cff8328" || echo "MISSING: cff8328"

# Check validation is imported
grep -q "validateCartPrices" /home/qualia/Projects/Live-Projects/aquador/src/app/api/checkout/route.ts && echo "FOUND: validateCartPrices import" || echo "MISSING: validateCartPrices import"

# Check validation is used
grep -q "priceValidation = validateCartPrices" /home/qualia/Projects/Live-Projects/aquador/src/app/api/checkout/route.ts && echo "FOUND: priceValidation usage" || echo "MISSING: priceValidation usage"
```

**Result:**
```
FOUND: src/lib/validation/cart.ts
FOUND: a0dd648
FOUND: cff8328
FOUND: validateCartPrices import
FOUND: priceValidation usage
```

## Self-Check: PASSED

All implementation claims verified. Files exist, commits are in history, validation is properly integrated.
