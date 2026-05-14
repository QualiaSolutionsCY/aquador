---
phase: 17-accessibility-polish
plan: 01
subsystem: ui
tags: [accessibility, wcag, parallax, three-js, keyboard-navigation, vestibular, framer-motion]

requires:
  - phase: 13-parallax-visual-foundation
    provides: parallax.ts, useParallax.ts, ParallaxSection component
  - phase: 14-3d-product-showcase
    provides: Scene.tsx, OrbitControls integration, config.ts
  - phase: 16-analytics-engagement-tracking
    provides: track3DInteraction, trackParallaxEngagement

provides:
  - Vestibular-safe parallax (33% speed when prefers-reduced-motion active)
  - getAccessibleSpeed() function for motion-preference-aware parallax
  - useKeyboardControls hook for full 3D keyboard navigation
  - KeyboardHints overlay component with luxury gold styling
  - KEYBOARD_CONFIG constants (rotationStep, zoomStep)

affects: [17-02, 17-03, all 3D scene consumers, all ParallaxSection consumers]

tech-stack:
  added: []
  patterns:
    - "vestibular-safe: reduce motion to 33% rather than fully disabling (WCAG 2.3.3)"
    - "keyboard controls as callbacks: hook fires onRotate/onZoom/onReset, component decides side effects"
    - "first-visit hints in localStorage with auto-dismiss after 6s"
    - "reduced-motion-aware animations: variants swap at runtime, never skip animation entirely"

key-files:
  created:
    - src/hooks/useKeyboardControls.ts
    - src/components/3d/KeyboardHints.tsx
  modified:
    - src/lib/animations/parallax.ts
    - src/hooks/useParallax.ts
    - src/components/ui/ParallaxSection.tsx
    - src/components/3d/Scene.tsx
    - src/lib/three/config.ts

key-decisions:
  - "33% speed reduction for reduced-motion parallax (WCAG 2.3.3 vestibular safety) — not full disable, to retain visual depth cues"
  - "useKeyboardControls fires callbacks not refs — Scene.tsx owns OrbitControls mutation via controlsRef"
  - "localStorage for hints dismissal (not sessionStorage) — dismissed once, gone forever"
  - "OrbitControls setAzimuthalAngle/setPolarAngle API for keyboard rotation — avoids internal spherical hacks"

patterns-established:
  - "Accessibility overrides: motion preference reduces speed, never eliminates functionality"
  - "Keyboard hints: auto-show on first visit, Escape/X dismiss, 6s auto-timeout"

duration: 4min
completed: 2026-03-09
---

# Phase 17 Plan 01: Accessibility & Polish Summary

**Vestibular-safe parallax (33% speed on prefers-reduced-motion) and full 3D keyboard navigation (arrow rotate, +/- zoom, R reset) with luxury hints overlay**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-09T14:30:41Z
- **Completed:** 2026-03-09T14:34:50Z
- **Tasks:** 3
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments
- Parallax respects vestibular disorders: WCAG 2.3.3 compliant speed reduction to 33% (not full disable) when `prefers-reduced-motion` is active, preserving visual depth cues
- 3D scenes now fully keyboard-accessible: arrow keys rotate, +/- zoom, R resets — no mouse required
- Keyboard hints overlay auto-shows on first visit with luxury gold styling, dismissed via X, Escape, or auto-timeout after 6s

## Task Commits

Each task was committed atomically:

1. **Task 1: Vestibular-safe parallax** - `37712bb` (feat)
2. **Task 2: 3D keyboard navigation** - `6919afb` (feat)
3. **Task 3: Keyboard hints overlay** - `f42c15b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/animations/parallax.ts` — Added `ACCESSIBILITY_CONFIG` (vestibularSafeMultiplier: 0.33) and `getAccessibleSpeed(speed, reducedMotion)` function
- `src/hooks/useParallax.ts` — Imports and applies `getAccessibleSpeed`; parallax reduced not disabled on motion preference
- `src/components/ui/ParallaxSection.tsx` — Updated JSDoc to document vestibular-safe behavior
- `src/hooks/useKeyboardControls.ts` — New hook: arrow key rotation, +/- zoom, R reset with `KeyboardControlsOptions` interface
- `src/lib/three/config.ts` — Added `KEYBOARD_CONFIG` with `rotationStep: 0.1` and `zoomStep: 0.5`
- `src/components/3d/Scene.tsx` — Integrated `useKeyboardControls` with `controlsRef`, added `KeyboardHints` as DOM sibling to Canvas
- `src/components/3d/KeyboardHints.tsx` — New component: luxury gold overlay, localStorage persistence, reduced-motion-aware animations

## Decisions Made
- **33% speed for reduced-motion parallax:** Full disable removes visual hierarchy. 33% is below vestibular trigger threshold while retaining depth cues. WCAG 2.3.3 recommends reducing, not necessarily removing.
- **Callbacks over direct ref mutation in useKeyboardControls:** Keeps the hook generic. Scene.tsx owns the OrbitControls ref and decides how to apply keyboard deltas.
- **localStorage for hints dismissal:** Users who explicitly dismiss the hint should not see it again. SessionStorage would re-show on every tab.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed wrong analytics event type for keyboard zoom**
- **Found during:** Task 2 (Scene.tsx integration)
- **Issue:** Passing `'zoom'` to `track3DInteraction()` but `Interaction3DType` only allows `'zoom_in' | 'zoom_out'` — TypeScript error TS2345
- **Fix:** Replaced with ternary `delta > 0 ? 'zoom_in' : 'zoom_out'` for semantic correctness
- **Files modified:** `src/components/3d/Scene.tsx`
- **Verification:** `npx tsc --noEmit` — no errors
- **Committed in:** `6919afb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Fix required for type correctness and accurate analytics tracking. No scope creep.

## Issues Encountered
None beyond the auto-fixed TS type mismatch above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 17-01 complete: accessibility layer for parallax and 3D scenes
- Plan 17-02 can now build on `useKeyboardControls` pattern for additional keyboard navigation
- Plan 17-03 can reference `ACCESSIBILITY_CONFIG` for any additional motion-sensitive animations

---
*Phase: 17-accessibility-polish*
*Completed: 2026-03-09*
