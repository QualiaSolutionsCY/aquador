# Lighthouse scores — Milestone 4 Phase 3 T2

Generated: 2026-05-16T23:46:00.558Z
Command: node scripts/lighthouse-runs.mjs

Thresholds: Performance >= 0.9 and Accessibility >= 0.9 on all 8 rows; LCP <= 2500ms on mobile rows; CLS <= 0.1 on all 8 rows; TBT <= 200ms on desktop rows.

PDP slug used: `lattafa-yara`

Note: numbers below are from `npm run dev` (uncompiled, unminified). Production-build scores via `next build && next start` will be substantially higher; treat these as a regression baseline only.

| Route | Viewport | Performance | Accessibility | LCP (ms) | CLS | TBT (ms) | Pass |
|---|---|---|---|---|---|---|---|
| / | mobile | 62 | 89 | 12345 | 0.000 | 459 | no |
| / | desktop | 46 | 89 | 8242 | 0.000 | 457 | no |
| /products/lattafa-yara | mobile | 64 | 96 | 11215 | 0.000 | 445 | no |
| /products/lattafa-yara | desktop | 45 | 96 | 11247 | 0.000 | 517 | no |
| /shop | mobile | 53 | 93 | 11662 | 0.000 | 769 | no |
| /shop | desktop | 37 | 93 | 11522 | 0.000 | 781 | no |
| /cart | mobile | n/a | n/a | n/a | n/a | n/a | no |
| /cart | desktop | n/a | n/a | n/a | n/a | n/a | no |

## Failures

- `/` @ mobile: performance 0.62 < 0.9; accessibility 0.89 < 0.9; lcp 12344.581499999998ms > 2500ms (mobile)
- `/` @ desktop: performance 0.46 < 0.9; accessibility 0.89 < 0.9; tbt 456.9999999999991ms > 200ms (desktop)
- `/products/lattafa-yara` @ mobile: performance 0.64 < 0.9; lcp 11215.158ms > 2500ms (mobile)
- `/products/lattafa-yara` @ desktop: performance 0.45 < 0.9; tbt 517ms > 200ms (desktop)
- `/shop` @ mobile: performance 0.53 < 0.9; lcp 11662.017499999998ms > 2500ms (mobile)
- `/shop` @ desktop: performance 0.37 < 0.9; tbt 781.0000000000036ms > 200ms (desktop)
- `/cart` @ mobile: performance null < 0.9; accessibility null < 0.9; cls null > 0.1; lcp nullms > 2500ms (mobile); lighthouse runtimeError: Lighthouse was unable to reliably load the page you requested. Make sure you are testing the correct URL and that the server is properly responding to all requests. (Status code: 404)
- `/cart` @ desktop: performance null < 0.9; accessibility null < 0.9; cls null > 0.1; tbt nullms > 200ms (desktop); lighthouse runtimeError: Lighthouse was unable to reliably load the page you requested. Make sure you are testing the correct URL and that the server is properly responding to all requests. (Status code: 404)
