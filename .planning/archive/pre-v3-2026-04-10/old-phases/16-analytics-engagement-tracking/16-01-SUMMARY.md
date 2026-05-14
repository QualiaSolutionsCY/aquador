---
phase: 16
plan: "01"
subsystem: analytics
tags: [analytics, 3d-tracking, scroll-depth, parallax, vercel-analytics]
dependency_graph:
  requires:
    - "14-01 (React Three Fiber Scene component)"
    - "13-01 (Parallax animation utilities)"
    - "@vercel/analytics package"
  provides:
    - "Centralized engagement tracking API"
    - "3D interaction events in Vercel Analytics"
    - "Scroll depth milestone events"
    - "Parallax visibility duration events"
  affects:
    - "src/components/3d/Scene.tsx"
    - "src/lib/animations/parallax.ts"
    - "src/lib/animations/scroll-animations.ts"
tech_stack:
  added: []
  patterns:
    - "try/catch analytics wrapper — non-blocking event tracking"
    - "OrbitControls onStart/onEnd for 3D interaction duration measurement"
    - "IntersectionObserver for parallax visibility tracking"
    - "sessionStorage deduplication for scroll depth milestones"
key_files:
  created:
    - "src/lib/analytics/engagement-tracker.ts"
  modified:
    - "src/components/3d/Scene.tsx"
    - "src/components/3d/ProductViewer.tsx"
    - "src/lib/animations/parallax.ts"
    - "src/lib/animations/scroll-animations.ts"
decisions:
  - "try/catch wraps every track() call — analytics must never break UI or 3D experiences"
  - "rotateStartTimeRef declared at Scene component top level (not inside useEffect) per plan spec"
  - "Parallax engagement threshold set to >1000ms to filter accidental/brief visibility"
  - "Scroll depth dedup uses sessionStorage keyed by pathname — resets across tabs/sessions"
  - "IntersectionObserver threshold 0.1 — fires when 10% of element enters viewport"
metrics:
  duration: "~3 minutes"
  completed: "2026-03-09"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 16 Plan 01: Analytics Engagement Tracking — Centralized Infrastructure

**One-liner:** Non-blocking analytics for 3D interactions (rotate with duration), scroll depth milestones (25/50/75/100% with sessionStorage dedup), and parallax visibility engagement (IntersectionObserver, >1s threshold).

## What Was Built

### Task 1 — Centralized engagement tracking utilities

Created `src/lib/analytics/engagement-tracker.ts` with three exported tracking functions and one helper:

- `track3DInteraction(type, options)` — tracks rotate_start/rotate_end/zoom_in/zoom_out/reset with productName, duration, and device type
- `trackScrollDepth(milestone, pagePath)` — tracks 25/50/75/100% milestones
- `trackParallaxEngagement(elementId, durationMs)` — tracks parallax visibility, ignores <1s
- `getDeviceType()` — returns mobile/tablet/desktop based on viewport width

All functions wrap `track()` from `@vercel/analytics` in try/catch — never throw, never block UI.

**Commit:** 43bfbca

### Task 2 — 3D interaction tracking in Scene and ProductViewer

Updated `Scene.tsx`:
- Accepts `productName` prop (forwarded to analytics)
- `rotateStartTimeRef` declared at component top level
- `handleRotateStart` / `handleRotateEnd` callbacks with `useCallback` memoization
- OrbitControls `onStart` / `onEnd` fire the tracking calls with calculated duration

Updated `ProductViewer.tsx`:
- `ProductViewer3DContent` receives `productName` prop and passes it to `Scene`

**Commit:** 7a19f59

### Task 3 — Scroll depth and parallax engagement hooks

Added `useScrollDepthTracking` to `scroll-animations.ts`:
- Passive scroll event listener, calculates percentage against `scrollHeight - innerHeight`
- Fires milestones at 25/50/75/100%, deduplicates via sessionStorage per-pathname
- Restores previously-fired milestones on mount to handle re-renders

Added `useParallaxEngagementTracking` to `parallax.ts`:
- IntersectionObserver (threshold 0.1) tracks when element enters/leaves viewport
- Records entry time, calculates duration on exit, fires if >1000ms
- Fires on component unmount if element was still visible when component destroyed

**Commit:** dcd7c1c

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All 5 key files exist. All 3 task commits verified (43bfbca, 7a19f59, dcd7c1c).
