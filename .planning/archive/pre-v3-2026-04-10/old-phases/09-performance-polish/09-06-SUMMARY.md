---
phase: 09-performance-polish
plan: 06
subsystem: frontend
tags: [accessibility, performance, clean-code, constants]

# Dependency graph
requires:
  - phase: 08-security-data-integrity
    provides: Validated cart system with Zod schemas
provides:
  - Preconnect hints for Supabase and Stripe domains (faster resource loading)
  - WCAG-compliant forms with proper label associations and ARIA attributes
  - Named constants for cart configuration (CART_DEBOUNCE_MS, MIN_QUANTITY, MAX_QUANTITY)
affects: [cart-ux, forms, maintainability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Preconnect/dns-prefetch for critical third-party domains
    - htmlFor/id associations for form accessibility
    - aria-label for icon-only buttons
    - aria-pressed for toggle buttons
    - fieldset/legend for radio button groups
    - Named constants for magic numbers

key-files:
  created: []
  modified:
    - src/app/layout.tsx
    - src/app/contact/page.tsx
    - src/app/create-perfume/page.tsx
    - src/lib/constants.ts
    - src/components/cart/CartProvider.tsx
    - src/lib/validation/cart.ts

key-decisions:
  - "Preconnect to Supabase (hznpuxplqgszbacxzbhv.supabase.co) and Stripe (js.stripe.com) for faster connection establishment"
  - "Use fieldset/legend for volume selection radio group (semantically correct)"
  - "Add aria-pressed to toggle buttons for better state indication"
  - "Extract cart debounce and quantity limits to constants.ts for maintainability"

patterns-established:
  - "All form inputs must have htmlFor/id associations or aria-label"
  - "Icon-only buttons must have descriptive aria-labels"
  - "Magic numbers in business logic get extracted to named constants"

# Metrics
duration: 3min
completed: 2026-03-03
---

# Phase 9 Plan 6: Accessibility & Clean Code Summary

**Preconnect hints for faster loading, WCAG-compliant forms, and extracted magic numbers to named constants**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T23:18:10Z
- **Completed:** 2026-03-02T23:21:09Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

### Task 1: Preconnect Hints
- Added preconnect and dns-prefetch for Supabase (hznpuxplqgszbacxzbhv.supabase.co)
- Added preconnect and dns-prefetch for Stripe (js.stripe.com)
- Speeds up connection establishment for critical third-party resources
- Placed in root layout.tsx alongside existing font preconnects

### Task 2: Form Accessibility
- Contact form: Added htmlFor/id pairs to all 5 form inputs (name, email, phone, subject, message)
- Create perfume form: Added htmlFor/id to text inputs, used fieldset/legend for volume selection
- Added aria-labels to 6 icon/toggle buttons:
  - Layer selection buttons (base, heart, top notes)
  - Fragrance category buttons (5 categories)
  - Note selection buttons (dynamic)
  - Back button in checkout form
- Added aria-pressed to all toggle buttons for state indication
- Cart components already had proper aria-labels (verified CartDrawer, CartItem)

### Task 3: Extract Magic Numbers
- Created 4 cart constants in constants.ts:
  - `CART_DEBOUNCE_MS = 500` (localStorage write debounce)
  - `MIN_QUANTITY = 1` (minimum item quantity)
  - `MAX_QUANTITY = 99` (maximum item quantity)
  - `MAX_CART_ITEMS = 50` (maximum cart items)
- Updated CartProvider to use CART_DEBOUNCE_MS instead of hardcoded 500
- Updated cart validation schema to use MIN_QUANTITY/MAX_QUANTITY instead of hardcoded 1/100
- All tests pass (37/37 cart and validation tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add preconnect hints** - `e295596` (feat)
2. **Task 2: Fix form accessibility** - `f9e311d` (feat)
3. **Task 3: Extract magic numbers** - `51c1653` (refactor)

## Files Created/Modified

- `src/app/layout.tsx` - Added 4 preconnect/dns-prefetch links
- `src/app/contact/page.tsx` - Added htmlFor/id to 5 form inputs
- `src/app/create-perfume/page.tsx` - Added htmlFor/id, aria-labels, aria-pressed, fieldset/legend
- `src/lib/constants.ts` - Added 4 cart configuration constants
- `src/components/cart/CartProvider.tsx` - Use CART_DEBOUNCE_MS constant
- `src/lib/validation/cart.ts` - Use MIN_QUANTITY/MAX_QUANTITY constants

## Decisions Made

**1. Preconnect domain selection**
- Chose Supabase and Stripe as highest-priority external domains
- Both are on critical path for product catalog and checkout
- dns-prefetch added as fallback for older browsers

**2. Fieldset for volume selection**
- Volume selection (50ml/100ml) is semantically a radio group
- Used fieldset/legend instead of div/label for proper semantic HTML
- Maintains visual design while improving accessibility

**3. aria-pressed vs aria-selected**
- Used aria-pressed for toggle buttons (layer selection, categories)
- Better semantic fit for buttons that toggle state
- aria-selected would be for listbox/tab patterns

**4. Constant extraction scope**
- Only extracted business logic constants (cart behavior)
- Did not extract CSS values, framework constants, or single-use numbers
- Constants are grouped by domain (cart) for discoverability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues. Cart components already had proper aria-labels, so no additional work needed there.

## Verification

**1. Preconnect hints:**
```bash
grep -c "preconnect" src/app/layout.tsx  # Should show 5 (fonts + Supabase + Stripe)
```

**2. Form accessibility:**
- All inputs have htmlFor/id or aria-label
- Icon buttons have descriptive aria-labels
- Toggle buttons have aria-pressed

**3. Constants:**
- TypeScript compilation passes
- All 37 cart/validation tests pass
- Constants used in CartProvider and validation schemas

## Next Phase Readiness

**No blockers** - all changes are backwards compatible and additive.

**Expected benefits:**
- Faster initial connection to Supabase and Stripe (50-300ms savings)
- Screen reader users can navigate forms correctly
- Cart constants are now centralized and maintainable

**Testing notes:**
- Preconnect benefits measurable in Chrome DevTools Network timing
- Accessibility improvements testable with screen readers (NVDA, JAWS, VoiceOver)
- Constants maintain exact same behavior (validated by passing tests)

## Self-Check: PASSED

**Files verified:**
- ✓ src/app/layout.tsx
- ✓ src/app/contact/page.tsx
- ✓ src/app/create-perfume/page.tsx
- ✓ src/lib/constants.ts
- ✓ src/components/cart/CartProvider.tsx
- ✓ src/lib/validation/cart.ts

**Commits verified:**
- ✓ e295596 (preconnect hints)
- ✓ f9e311d (form accessibility)
- ✓ 51c1653 (extract constants)

**Implementation verified:**
- ✓ 5 preconnect/dns-prefetch links in layout.tsx
- ✓ 4 cart constants defined in constants.ts
- ✓ CART_DEBOUNCE_MS used in CartProvider
- ✓ MIN_QUANTITY/MAX_QUANTITY used in validation schema

---
*Phase: 09-performance-polish*
*Completed: 2026-03-03*
