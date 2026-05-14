---
phase: 16-analytics-engagement-tracking
plan: 03
subsystem: ui
tags: [vercel-analytics, performance, framer-motion, raf, fps-monitoring]

# Dependency graph
requires:
  - phase: 14-3d-product-showcase
    provides: animation-budget.tsx and device performance patterns
  - phase: 15-immersive-navigation-discovery
    provides: PageTransition.tsx and cinematic.ts foundations
provides:
  - RAF-based FPS monitor hook (usePerformanceMonitor) with frame drop detection
  - Vercel Analytics events for animation_performance_issue, animation_quality_adjusted, animation_budget_exceeded
  - trackCinematicEngagement utility for cinematic element lifecycle tracking
  - createTrackedCinematicVariant helper for wrapping Framer Motion variants with analytics callbacks
  - Page transition timing captured (view start → complete duration)
affects:
  - 16-01 (engagement-tracker — getDeviceType now inlined in performance-monitor, can be wired once 16-01 ships)
  - 17-accessibility-polish (animation budget provider now provides performance analytics context)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - RAF-based FPS monitoring at hook level (not component level) for non-blocking measurement
    - Fail-silent analytics pattern (try/catch around all track() calls)
    - Quality degradation tracking via useEffect dependency on budget.shouldSimplify
    - Framer Motion onAnimationStart/onAnimationComplete for cinematic engagement timing

key-files:
  created:
    - src/lib/analytics/performance-monitor.ts
  modified:
    - src/lib/performance/animation-budget.tsx
    - src/components/providers/PageTransition.tsx
    - src/lib/animations/cinematic.ts

key-decisions:
  - "getDeviceType inlined in performance-monitor.ts (engagement-tracker.ts from 16-01 not yet created)"
  - "animation_budget_exceeded fires when FPS < POOR threshold (45fps), not on every update"
  - "createTrackedCinematicVariant returns callbacks as props (not higher-order component) to avoid wrapper complexity"
  - "transitionStartRef used instead of useState for start timestamp (no re-render needed)"

patterns-established:
  - "Performance Monitor Pattern: usePerformanceMonitor hook at provider top-level, fires on unmount only when degradation detected"
  - "Fail-Silent Analytics: all track() calls wrapped in try/catch, never block rendering"
  - "Tracked Variant Helper: createTrackedCinematicVariant returns { variants, onAnimationStart, onAnimationComplete } for spread onto motion elements"

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 16 Plan 03: Performance Monitoring Summary

**RAF-based FPS/frame-drop monitoring integrated into global animation provider with Vercel Analytics events for degradation, quality adjustments, and cinematic element engagement timing.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T14:22:56Z
- **Completed:** 2026-03-09T14:25:56Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Global FPS and frame drop monitoring runs continuously in AnimationBudgetProvider via RAF without blocking rendering
- Vercel Analytics receives `animation_performance_issue`, `animation_quality_adjusted`, and `animation_budget_exceeded` events with device type and FPS metadata
- Cinematic page transitions tracked with precise start-to-complete duration using performance.now()
- `createTrackedCinematicVariant` helper provides opt-in tracking for any Framer Motion variant object

## Task Commits

Each task was committed atomically:

1. **Task 1: Create performance monitoring utilities** - `5f67064` (feat)
2. **Task 2: Integrate performance monitoring into animation budget provider** - `864691a` (feat)
3. **Task 3: Add cinematic element engagement tracking** - `017624b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/lib/analytics/performance-monitor.ts` - New: usePerformanceMonitor hook, trackAnimationPerformance, trackCinematicEngagement, measureFPS, getDeviceType (inlined)
- `src/lib/performance/animation-budget.tsx` - Modified: added usePerformanceMonitor call + quality/budget exceeded tracking events
- `src/components/providers/PageTransition.tsx` - Modified: added trackCinematicEngagement calls on animation start/complete with duration
- `src/lib/animations/cinematic.ts` - Modified: added createTrackedCinematicVariant exported helper + trackCinematicEngagement import

## Decisions Made

- `getDeviceType` inlined directly in performance-monitor.ts rather than importing from engagement-tracker — engagement-tracker.ts from 16-01 was not yet created when this plan ran. Once 16-01 ships the inlined version can be replaced with a shared import.
- `animation_budget_exceeded` event fires when FPS drops below the existing `PERFORMANCE_THRESHOLDS.POOR` (45fps) rather than defining a new threshold. Keeps thresholds DRY.
- `createTrackedCinematicVariant` returns a plain object `{ variants, onAnimationStart, onAnimationComplete }` for spreading onto motion elements — avoids higher-order component complexity and keeps it composable.
- `transitionStartRef` used (not `useState`) for capturing transition start time in PageTransition — no re-render needed for a timing reference.

## Deviations from Plan

None — plan executed exactly as written. The note about potentially missing engagement-tracker.ts was anticipated in the plan spec, and the fallback (inline getDeviceType) was explicitly approved.

## Issues Encountered

None — TypeScript and ESLint both clean. The only pre-existing TS errors are in test files (`CartIcon.test.tsx`, `Button.test.tsx`) from testing-library type mismatches that predate this plan.

## User Setup Required

None — no external service configuration required. All tracking uses the existing `@vercel/analytics` integration.

## Next Phase Readiness

- Performance monitoring layer is complete and fully operational
- When 16-01 (engagement-tracker.ts) ships, the inlined `getDeviceType` in performance-monitor.ts can be replaced with a shared import
- Phase 17 (accessibility-polish) can use `useAnimationBudget()` to respect the now-tracked shouldSimplify flag

---
*Phase: 16-analytics-engagement-tracking*
*Completed: 2026-03-09*
