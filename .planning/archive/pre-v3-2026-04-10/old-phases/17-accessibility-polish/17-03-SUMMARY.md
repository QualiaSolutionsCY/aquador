---
phase: 17-accessibility-polish
plan: 03
subsystem: ui
tags: [progressive-loading, performance, preloading, device-detection, 3d, react-three-fiber]

# Dependency graph
requires:
  - phase: 17-02
    provides: Scene.tsx with keyboard controls and ARIA regions that this plan extends
  - phase: 14-3d-product-showcase
    provides: Scene.tsx, useDeviceCapabilities hook for 3D optimization
  - phase: 15-immersive-navigation-discovery
    provides: ProductCard.tsx with hover state management

provides:
  - Progressive loading state machine with 4-stage transitions (initial → fetching → rendering → interactive)
  - ProgressiveLoader component with gold progress dots and reduced-motion support
  - Extended DeviceCapabilities interface with savesData and supports3D detection
  - Performance metrics module with slow-device detection via load timing
  - 3D scene disabled on low-end mobile with static gold placeholder
  - Hover-triggered prefetching with 300ms debounce and cancel on mouse-leave
  - Scroll-based category preloading via IntersectionObserver

affects:
  - any future 3D features (Scene.tsx extended)
  - product catalog pages (ProductCard.tsx wired)
  - product detail pages (loading.tsx replaced)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Loading state machine with typed stages and transition functions
    - Debounced hover prefetch via link[rel="prefetch"] (no router dependency)
    - Device capability gating with savesData Network Information API check
    - Performance measurement with start/end measurement pairs tracked in module-level Map

key-files:
  created:
    - src/lib/loading/states.ts
    - src/components/ui/ProgressiveLoader.tsx
    - src/lib/performance/metrics.ts
    - src/lib/preload/strategy.ts
  modified:
    - src/hooks/useDeviceCapabilities.ts
    - src/components/3d/Scene.tsx
    - src/components/ui/ProductCard.tsx
    - src/app/products/[slug]/loading.tsx

key-decisions:
  - "Shimmer icon in ProgressiveLoader uses standalone div with rounded-full and gold gradient — LuxurySkeleton has no variant prop"
  - "supports3D false only on mobile AND (low-end OR data-saving) — desktop always gets 3D"
  - "link[rel='prefetch'] over Next.js router.prefetch — simpler, no client router dependency needed"
  - "300ms hover debounce for prefetch to filter accidental hovers"
  - "ProgressiveLoader does NOT re-export LoadingStage — consumers import from states.ts directly"
  - "Performance metrics stored in module-level Map — cheap and no external dependencies"

patterns-established:
  - "Loading state machine pattern: define stages in states.ts, consume in components via ProgressiveLoader"
  - "Preload pattern: debounced prefetch link on mouseEnter, cancel on mouseLeave via ref"
  - "Device capability gating: hook returns supports3D boolean, components do early return with accessible fallback"

# Metrics
duration: 20min
completed: 2026-03-09
---

# Phase 17 Plan 03: Progressive Loading, Preloading & Mobile 3D Optimization Summary

**Loading state machine with staged gold progress indicators, hover-triggered link prefetch on ProductCard, and 3D disabled on low-end mobile with accessible static fallback**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-09
- **Completed:** 2026-03-09
- **Tasks:** 3 of 3
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments

- Built loading state machine (`states.ts`) with `LoadingState`, `LoadingStage`, `getLoadingTransition`, `DEFAULT_3D_STAGES`, and `DEFAULT_PRODUCT_STAGES` — all typed and exported
- Created `ProgressiveLoader` component with gold progress dots, staged messages, shimmer circle, and `prefers-reduced-motion` support
- Extended `useDeviceCapabilities` with `savesData` (Network Information API) and `supports3D` without removing any existing fields; exported as named interface
- Scene.tsx renders a static gold placeholder when `supports3D` is false; uses `ProgressiveLoader` in Suspense fallback instead of `null`
- Created `metrics.ts` with `measureLoadTime`/`endLoadMeasurement`/`isSlowDevice`/`reportWebVitals` using module-level Map
- ProductCard wires `preloadProduct` into `onMouseEnter` with a 300ms debounce and cancels via ref on `onMouseLeave`
- Product page `loading.tsx` replaced with `ProgressiveLoader` using staged product messages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create progressive loading state machine and ProgressiveLoader component** - `d2b13a3` (feat)
2. **Task 2: Extend device capability detection and implement mobile 3D optimization** - `70f1d6b` (feat)
3. **Task 3: Implement intelligent preloading and wire into ProductCard** - `cd4e74c` (feat)

## Files Created/Modified

- `src/lib/loading/states.ts` — Loading state machine: LoadingState, LoadingStage, getLoadingTransition, DEFAULT_3D_STAGES, DEFAULT_PRODUCT_STAGES
- `src/components/ui/ProgressiveLoader.tsx` — Staged loading component with gold progress dots and reduced-motion support
- `src/lib/performance/metrics.ts` — measureLoadTime, endLoadMeasurement, isSlowDevice, reportWebVitals
- `src/lib/preload/strategy.ts` — preloadProduct (debounced hover), preloadCategoryPage, setupScrollPreload (IntersectionObserver)
- `src/hooks/useDeviceCapabilities.ts` — Extended with savesData and supports3D; changed type to exported interface
- `src/components/3d/Scene.tsx` — supports3D guard with static fallback, ProgressiveLoader in Suspense, performance tracking useEffect
- `src/components/ui/ProductCard.tsx` — Wired preloadProduct on onMouseEnter with cancelPreloadRef on onMouseLeave
- `src/app/products/[slug]/loading.tsx` — Replaced skeleton with ProgressiveLoader using DEFAULT_PRODUCT_STAGES

## Decisions Made

- `LoadingSpinner` has no `variant` prop in the actual implementation — used without `variant="gold"` as specified in plan template
- Used `link[rel="prefetch"]` with `as="document"` instead of Next.js router.prefetch — simpler, no client router instance required
- `supports3D` gating: only disabled on mobile + (low-end || data-saving) — desktop always gets full 3D regardless of memory
- Module-level `Map<string, LoadMetrics>` for performance tracking — no external dependency, cheap, synchronous

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed non-existent `variant="gold"` prop from LoadingSpinner usage**
- **Found during:** Task 1 (ProgressiveLoader component)
- **Issue:** Plan template showed `<LoadingSpinner size="lg" variant="gold" />` but LoadingSpinner has no `variant` prop — would cause TypeScript error
- **Fix:** Used `<LoadingSpinner size="lg" />` — the spinner already uses gold colors by default
- **Files modified:** src/components/ui/ProgressiveLoader.tsx
- **Verification:** `npx tsc --noEmit` passes with no errors in new files
- **Committed in:** d2b13a3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type mismatch in plan template)
**Impact on plan:** Minimal — spinner still renders gold, behavior unchanged. No scope creep.

## Issues Encountered

None — plan executed smoothly. Pre-existing TypeScript errors in test files (`CartIcon.test.tsx`, `Button.test.tsx`) are unrelated to this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 17 is now complete (3/3 plans done). The v2.0 Immersive Luxury Experience build (Phases 13-17) is complete.

Ready for:
- Production deployment verification
- Performance audit with Lighthouse
- Real-device mobile testing for 3D fallback

---
*Phase: 17-accessibility-polish*
*Completed: 2026-03-09*
