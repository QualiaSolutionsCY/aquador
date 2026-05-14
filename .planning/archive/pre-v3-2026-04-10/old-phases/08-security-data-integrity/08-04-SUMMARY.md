---
phase: 08-security-data-integrity
plan: 04
subsystem: infra
tags: [security, csp, permissions-policy, headers]

# Dependency graph
requires:
  - phase: 08-security-data-integrity
    provides: Initial security headers configuration
provides:
  - Permissions-Policy header restricting browser API access
  - Hardened CSP without unsafe-eval
  - Restricted media-src to specific domains
affects: [deployment, security-audit]

# Tech tracking
tech-stack:
  added: []
  patterns: [Permissions-Policy for API lockdown, Stricter CSP directives]

key-files:
  created: []
  modified: [next.config.mjs]

key-decisions:
  - "Disabled camera, microphone, geolocation, and FLoC via Permissions-Policy"
  - "Removed unsafe-eval from CSP while maintaining unsafe-inline (Next.js/Tailwind requirement)"
  - "Restricted media-src from wildcard https: to specific trusted domains"

patterns-established:
  - "Browser API access restrictions via Permissions-Policy"
  - "Defense-in-depth security headers with minimal attack surface"

# Metrics
duration: <1 min
completed: 2026-03-02
---

# Phase 08 Plan 04: Tighten CSP and Add Permissions-Policy Summary

**Security headers hardened with Permissions-Policy API lockdown and stricter Content Security Policy directives**

## Performance

- **Duration:** <1 min
- **Started:** 2026-03-02T21:40:34Z
- **Completed:** 2026-03-02T21:41:11Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added Permissions-Policy header to disable camera, microphone, geolocation, and FLoC tracking
- Removed unsafe-eval directive from Content Security Policy
- Restricted media-src from wildcard `https:` to specific trusted domains
- Reduced browser attack surface while maintaining application functionality

## Task Commits

Each task was committed atomically:

1. **Tasks 1-2: Add Permissions-Policy and tighten CSP** - `6982a73` (feat)

**Plan metadata:** Will be committed by orchestrator

## Files Created/Modified

- `next.config.mjs` - Added Permissions-Policy header, removed CSP unsafe-eval, restricted media-src to specific domains (static1.squarespace.com, images.squarespace-cdn.com, *.supabase.co)

## Decisions Made

1. **Permissions-Policy scope** - Disabled camera, microphone, geolocation (not needed for e-commerce), and interest-cohort (FLoC tracking protection)
2. **Maintained unsafe-inline in CSP** - Required for Next.js inline styles and Tailwind CSS. Removing this would break the application. Documented as known limitation.
3. **Media-src whitelist** - Limited to legacy Squarespace assets and Supabase storage endpoints. Removed wildcard `https:` that allowed any HTTPS media source.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for next plan (08-05). Security headers are now more restrictive, reducing attack surface for browser-based exploits.

**Notes:**
- Permissions-Policy provides defense-in-depth by preventing malicious scripts from accessing sensitive browser APIs even if CSP is bypassed
- unsafe-inline remains in CSP due to framework constraints but is balanced by other security measures (SameSite cookies, CSRF tokens, server-side validation)
- Future consideration: Evaluate Next.js/Tailwind config to enable CSP nonces and remove unsafe-inline

## Self-Check: PASSED

- FOUND: 08-04-SUMMARY.md
- FOUND: commit 6982a73
- FOUND: next.config.mjs

---
*Phase: 08-security-data-integrity*
*Completed: 2026-03-02*
