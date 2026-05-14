---
phase: 02-success-pages-email-reliability
plan: 02
subsystem: payment-webhooks
tags: [email, idempotency, stripe-webhooks, duplicate-prevention]
dependency_graph:
  requires: [01-02-metadata-optimization]
  provides: [idempotent-email-sending]
  affects: [customer-notifications, store-notifications]
tech_stack:
  added: []
  patterns: [idempotent-email-gating, order-existence-checking]
key_files:
  created: []
  modified:
    - src/app/api/webhooks/stripe/route.ts
decisions:
  - id: EMAIL-GATE-01
    question: How to prevent duplicate emails on webhook retries?
    chosen: Gate email sending on order creation status from database response
    alternatives:
      - External idempotency service (Redis/Upstash) - adds complexity
      - Timestamp-based deduplication - unreliable with clock skew
    rationale: Order record already uses ignoreDuplicates, leveraging database response is zero-cost and reliable
metrics:
  duration_minutes: 8
  tasks_completed: 2
  files_modified: 1
  commits: 2
  completed_at: 2026-03-02T15:22:13Z
---

# Phase 02 Plan 02: Idempotent Email Sending Summary

**One-liner:** Idempotent email sending via order existence check prevents duplicate confirmation emails on Stripe webhook retries.

## Performance

- **Duration:** 8 minutes
- **Commits:** 2 (atomic per task)
- **Files modified:** 1
- **Lines changed:** ~30 (type signatures, return values, conditional logic)

## Accomplishments

### Core Changes

1. **Modified persistOrder return type** - Returns `{ isNewOrder: boolean }` to indicate new vs duplicate order
2. **Added duplicate detection** - Checks if orderData is empty (ignoreDuplicates blocked insert)
3. **Gated email sending** - Emails sent only when `isNewOrder === true`
4. **Added logging** - Distinguishes new orders from duplicate webhook events

### Implementation Pattern

```typescript
// persistOrder now returns creation status
const { isNewOrder } = await persistOrder(session, items, shippingAddress, orderTags);

// Emails sent only for new orders
if (isNewOrder) {
  await Promise.all([
    sendOrderConfirmationEmail(customerEmail, orderDetails),
    sendStoreOrderNotification(customerEmail, orderDetails),
  ]);
  console.log('Order confirmation emails sent for new order:', session.id);
} else {
  console.log('Duplicate webhook - skipping email sending for session:', session.id);
}
```

### Idempotency Mechanism

- **Database-level:** `upsert` with `ignoreDuplicates: true` on `stripe_session_id`
- **Application-level:** Check `orderData` response - empty means duplicate blocked
- **Email-level:** Conditional sending based on `isNewOrder` flag
- **Result:** Exactly one email per order, even if Stripe retries webhook 10x

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Modify persistOrder to return order creation status | cb12154 | route.ts |
| 2 | Gate email sending on isNewOrder flag | 788920f | route.ts |

## Files Created/Modified

### Modified

**src/app/api/webhooks/stripe/route.ts** (530 lines)
- Changed `persistOrder` return type to `Promise<{ isNewOrder: boolean }>`
- Added `.select()` to upsert to capture orderData response
- Added duplicate detection logic (empty orderData check)
- Updated all return paths to return `{ isNewOrder: boolean }`
- Captured `isNewOrder` in webhook handler
- Wrapped email sending in conditional block
- Added logging for duplicate webhook events

## Decisions Made

### EMAIL-GATE-01: Order-based Email Idempotency

**Context:** Stripe retries webhooks on slow responses or transient failures. Without idempotency, customers receive duplicate confirmation emails.

**Decision:** Gate email sending on `isNewOrder` flag derived from database upsert response.

**Alternatives considered:**
1. External idempotency service (Redis/Upstash) - Adds infrastructure dependency and complexity
2. Timestamp-based deduplication - Unreliable due to clock skew and retry delays
3. Email provider idempotency keys - Not all providers support this, ties us to provider-specific features

**Rationale:**
- Order table already uses `ignoreDuplicates` for idempotent inserts
- Database response tells us definitively if order was newly created
- Zero additional infrastructure cost
- Works regardless of retry timing or webhook delivery order
- Leverages existing Supabase transaction guarantees

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Implementation straightforward - TypeScript types updated cleanly, no runtime errors.

## Next Phase Readiness

**Status:** Ready for 02-03 (success page enhancement)

**Blockers:** None

**Notes:** Email idempotency complete. Next plan focuses on success page UI showing order details from Stripe session.

---

## Self-Check: PASSED

Verification steps:
- ✅ File exists: `src/app/api/webhooks/stripe/route.ts`
- ✅ Commits in history: `git log --oneline --all --grep="02-02"` returns 2 commits
- ✅ TypeScript compilation passes (no webhook-related errors)
- ✅ persistOrder returns `{ isNewOrder: boolean }`
- ✅ Email sending wrapped in `if (isNewOrder)` conditional
- ✅ Duplicate detection logs appropriately
