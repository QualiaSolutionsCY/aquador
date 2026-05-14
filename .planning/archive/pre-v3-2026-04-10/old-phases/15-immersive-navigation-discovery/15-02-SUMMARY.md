---
phase: 15-immersive-navigation-discovery
plan: 02
subsystem: discovery-experience
tags: [hover-reveals, progressive-disclosure, quick-view, luxury-animations]
dependency_graph:
  requires: [13-01-parallax-foundation, 13-02-micro-interactions]
  provides: [discovery-animations, product-quick-view, progressive-grid-loading]
  affects: [product-browsing, shop-pages, category-pages]
tech_stack:
  added: []
  patterns: [intersection-observer, tap-to-reveal, progressive-disclosure]
key_files:
  created:
    - src/lib/animations/discovery-animations.ts
    - src/components/shop/ProductQuickView.tsx
    - src/components/shop/DiscoveryGrid.tsx
  modified:
    - src/components/ui/ProductCard.tsx
decisions:
  - id: D15-02-001
    title: Image zoom timing set to 700ms for luxury feel
    context: Standard micro-interactions use 200-350ms duration
    decision: Use 700ms for image zoom (1.06x scale) with luxury easing curve
    rationale: Slower timing creates more intentional, high-end experience vs aggressive quick zoom
    alternatives: [350ms standard timing, 1s very slow timing]
    impact: Sets timing pattern for all hover image reveals in v2.0
  - id: D15-02-002
    title: Mobile tap-to-reveal pattern for quick view
    context: Hover states don't exist on touch devices
    decision: First tap reveals ProductQuickView, second tap navigates to product
    rationale: Maintains progressive disclosure UX on mobile without requiring separate UI
    alternatives: [separate "..." button for quick view, long-press gesture, slide gesture]
    impact: Consistent interaction pattern across desktop and mobile
  - id: D15-02-003
    title: Progressive grid loading starts at 2 rows visible
    context: Need balance between immediate content and smooth progressive disclosure
    decision: Show first 8 products (2 rows) immediately, reveal additional rows on scroll
    rationale: 8 products provide enough content above fold while maintaining performance and stagger effect
    alternatives: [4 products (1 row), 12 products (3 rows), all products immediately]
    impact: Sets pattern for all paginated/progressive disclosure grids
  - id: D15-02-004
    title: Extract fragrance notes from product tags
    context: ProductQuickView needs to show fragrance notes but Product schema doesn't have dedicated notes field
    decision: Use tag prefix pattern "note-rose", "note-vanilla" to extract notes
    rationale: Reuses existing tags field, avoids schema migration, flexible for future expansion
    alternatives: [add notes JSON field to schema, hardcode notes per product, skip notes display]
    impact: Pattern for extracting structured data from tags field
metrics:
  duration_minutes: 3
  tasks_completed: 2
  commits: 2
  files_created: 3
  files_modified: 1
  completed_date: 2026-03-09
---

# Phase 15 Plan 02: Discovery & Quick View Summary

**One-liner:** Immersive product browsing with hover-activated quick view overlays (description, fragrance notes, CTA) and progressive grid loading via IntersectionObserver.

## What Was Built

### Core Components

**1. Discovery Animation Library** (`src/lib/animations/discovery-animations.ts`)
- `DISCOVERY_TIMING`: Timing constants for luxury reveals (350ms reveal, 200ms exit, 150ms hover delay)
- `hoverRevealVariants`: Overlay fade-in with upward motion + blur effect
- `progressiveDisclosureVariants`: Height-based expand/collapse for row reveals
- `imageZoomVariants`: Subtle 1.06x zoom over 700ms with luxury easing
- `staggerContainerVariants` + `staggerItemVariants`: Cascading reveals with 80ms stagger
- `reducedMotionDiscoveryVariants`: Instant show/hide fallbacks for accessibility

**2. ProductQuickView Component** (`src/components/shop/ProductQuickView.tsx`)
- Absolute-positioned overlay on product card (not modal)
- Dark backdrop (bg-black/80) with backdrop-blur-md for depth
- Progressive stagger reveal in 3 layers:
  1. Product description (truncated to 80 chars, text-[11px])
  2. Fragrance notes extracted from tags (gold-accented pill badges, limit 5)
  3. "Quick View" button linking to product page (gold outline)
- Respects `prefers-reduced-motion` for accessibility
- Desktop: appears on hover, disappears on mouse leave
- Mobile: controlled by parent ProductCard tap state

**3. Enhanced ProductCard** (`src/components/ui/ProductCard.tsx`)
- Added hover state management: `isHovered`, `isTapRevealed`
- Wrapped image in `motion.div` with `imageZoomVariants` (1.06x scale on hover)
- Desktop interaction: `onMouseEnter` → show overlay, `onMouseLeave` → hide overlay
- Mobile tap-to-reveal:
  - Detects touch device via `matchMedia('(pointer: coarse)')`
  - First tap: `preventDefault()`, set `isTapRevealed=true`, show overlay
  - Second tap: allow navigation to product page
- Integrated ProductQuickView overlay positioned over image area
- Conditional rendering: only show QuickView for Supabase Product type (has `tags` field)
- Removed duplicate CSS `transition-transform` on image (now controlled by Framer Motion)

**4. DiscoveryGrid Component** (`src/components/shop/DiscoveryGrid.tsx`)
- Progressive disclosure grid wrapper for shop/category pages
- Groups products into rows of 4 for animation purposes
- First 2 rows (8 products) visible immediately
- IntersectionObserver with 200px threshold reveals subsequent rows on scroll
- Each row fades in with staggered product animation (80ms per card)
- Performance: only renders visible rows, incremental reveal as user scrolls
- Sentinel element triggers next row reveal when approaching viewport
- Respects `prefers-reduced-motion`: all rows visible immediately if enabled
- Props: `products`, `priority` (default 4 for hero images), `className`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added conditional rendering for ProductQuickView**
- **Found during:** Task 2 (ProductCard enhancement)
- **Issue:** ProductCard supports both LegacyProduct and Supabase Product types. ProductQuickView requires Product type with `tags` field for fragrance notes extraction. Without type guard, would crash on LegacyProduct cards.
- **Fix:** Added type check `{'tags' in product && ...}` before rendering ProductQuickView, cast to `Product` type for component
- **Files modified:** `src/components/ui/ProductCard.tsx`
- **Commit:** 0d3a98f

**2. [Rule 1 - Bug] Fixed unused import lint error**
- **Found during:** TypeScript/lint verification after Task 1
- **Issue:** `Transition` type imported from framer-motion but never used in discovery-animations.ts
- **Fix:** Removed unused import, kept only `Variants` type
- **Files modified:** `src/lib/animations/discovery-animations.ts`
- **Commit:** 0d3a98f (included in Task 2 commit)

**3. [Rule 1 - Bug] Removed duplicate image transition**
- **Found during:** Task 2 (ProductCard enhancement)
- **Issue:** ProductCard had CSS `transition-transform duration-500 group-hover:scale-105` on image, conflicting with new Framer Motion `imageZoomVariants` control
- **Fix:** Removed CSS classes, motion.div now controls all image transformations
- **Files modified:** `src/components/ui/ProductCard.tsx`
- **Commit:** 0d3a98f

## Verification Results

### Manual Testing
✅ TypeScript compilation: `npx tsc --noEmit` — no errors
✅ Dev server starts successfully on localhost:3000
✅ Shop page loads with skeleton states (components rendering)
✅ All exports present in discovery-animations.ts
✅ ProductQuickView component exports correctly

### Automated Checks
✅ All Task 1 files created
✅ All Task 2 files modified
✅ Git commits created with proper format
✅ Commit hashes recorded

### Pending Verification (requires browser)
⏳ Hover over product card → image zoom + quick view overlay appears
⏳ Mouse leave → overlay exits smoothly
⏳ Mobile (375px) → first tap reveals overlay, second tap navigates
⏳ Scroll product grid → rows progressively appear with stagger
⏳ Reduced motion → instant show/hide, no zoom animation
⏳ Fragrance notes display (if product has "note-*" tags)

## Self-Check: PASSED

All created files exist:
```bash
✓ src/lib/animations/discovery-animations.ts
✓ src/components/shop/ProductQuickView.tsx
✓ src/components/shop/DiscoveryGrid.tsx
```

All commits exist:
```bash
✓ 686989c - feat(15-02): create discovery animation library and ProductQuickView overlay
✓ 0d3a98f - feat(15-02): enhance ProductCard with hover reveals and create DiscoveryGrid
```

All modified files staged correctly:
```bash
✓ src/components/ui/ProductCard.tsx
✓ src/lib/animations/discovery-animations.ts
```

## Technical Notes

**Animation Performance:**
- All animations use GPU-accelerated properties (transform, opacity, filter)
- Image zoom controlled via `scale` transform (GPU compositing)
- Backdrop blur may cause slight repaint but acceptable for luxury UX
- Reduced motion automatically disables all animations

**Mobile Interaction Pattern:**
- `matchMedia('(pointer: coarse)')` detects touch devices reliably
- First tap prevents navigation (`e.preventDefault()`) and shows overlay
- Second tap allows default link behavior to navigate
- State reset on mouse leave ensures clean state for desktop hover

**Progressive Loading Strategy:**
- IntersectionObserver more performant than scroll event listeners
- 200px threshold provides smooth reveals before content enters viewport
- Sentinel element approach scales to large product catalogs
- First 2 rows immediate visibility ensures above-fold content without delay

**Type Safety:**
- ProductQuickView requires full Product type (has `tags` field)
- ProductCard supports both LegacyProduct and Product via union type
- Conditional rendering with type guard prevents runtime crashes
- TypeScript strict mode satisfied

## Integration Points

**Consumes:**
- `useReducedMotion` hook from Phase 13-02 (micro-interactions)
- `Product` type from Supabase schema
- `formatPrice` utility for consistent currency display
- Framer Motion animation primitives

**Provides:**
- Discovery animation variants (export from `discovery-animations.ts`)
- ProductQuickView component (reusable for other grid contexts)
- DiscoveryGrid component (replace basic div.grid in shop pages)
- Tap-to-reveal pattern (reference for other mobile interactions)

**Next Steps:**
- Integrate DiscoveryGrid in ShopContent.tsx and CategoryContent.tsx (replace basic grid)
- Add more "note-*" tags to products in Supabase for richer quick view
- Consider adding quick-add-to-cart button in ProductQuickView (Phase 16)
- Test performance with 100+ product grid (may need virtualization)

## Commits

| Hash    | Message                                                    | Files Changed |
| ------- | ---------------------------------------------------------- | ------------- |
| 686989c | feat(15-02): create discovery animation library and ProductQuickView overlay | 2 created     |
| 0d3a98f | feat(15-02): enhance ProductCard with hover reveals and create DiscoveryGrid | 3 modified, 1 created |

**Total:** 2 commits, 3 files created, 1 file modified, 3 minutes duration

---

**Plan Status:** ✅ COMPLETE (all autonomous tasks executed, both commits successful)

**Blockers:** None

**Next Plan:** 15-03 (Gesture Navigation & Touch Patterns)
