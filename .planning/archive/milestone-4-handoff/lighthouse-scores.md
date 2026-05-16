# Lighthouse scores — Milestone 4 Phase 3 T2

**Status:** OPERATOR RUN REQUIRED — see "How to run" below
**Command:** `npm run build && npm run lighthouse`
**Script:** `scripts/lighthouse-runs.mjs`
**Last script update:** 2026-05-17 (dev → prod build, `/cart` → `/create-perfume`)

## Audit infrastructure

- `scripts/lighthouse-runs.mjs` — Lighthouse v13 programmatic runner. Boots `next start` (production build), runs 4 routes × 2 viewports (mobile 375×667, desktop 1280×800), `onlyCategories: ['performance', 'accessibility']`, writes this file, exits 0 only if all 8 rows pass thresholds.
- `package.json` — `"lighthouse": "node scripts/lighthouse-runs.mjs"` script entry; `lighthouse@^13.3.0` + `chrome-launcher@^1.2.1` devDeps.

## Thresholds (per QA-02)

- Performance ≥ 0.90 on all 8 runs
- Accessibility ≥ 0.90 on all 8 runs
- LCP ≤ 2500ms on the 4 mobile rows
- CLS ≤ 0.1 on all 8 rows
- TBT ≤ 200ms on the 4 desktop rows

## Routes

1. `/` — home
2. `/products/<in-stock-slug>` — PDP. Slug sourced from Supabase at runtime via `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, with a fallback to `lattafa-yara`.
3. `/shop` — catalogue index
4. `/create-perfume` — custom-perfume builder, the second payment surface. Replaces the original `/cart` from the spec; cart is a Radix Drawer overlay mounted at every layout and has no standalone route, so Lighthouse 404'd on it.

## How to run (operator)

The Claude Code build sandbox cannot execute headless Chrome long enough — Lighthouse needs ~2–4 min for 8 runs and the sandbox kills the process at exit 144 before completion. The script runs correctly on a normal local shell:

```bash
# from repo root, on operator machine
npm install                # ensures lighthouse + chrome-launcher present
npm run build              # production build into .next/ (script will throw if absent)
npm run lighthouse         # runs all 8 audits against `next start` on :3000
```

The script:

- Reuses an existing server on :3000 if one is already up (will NOT spawn or kill the operator's foreground server).
- Otherwise spawns `next start`, polls readiness, runs all 8 audits, kills the spawned server in a `finally` block.
- Writes this file unconditionally (even on partial failure) so deltas are debuggable.
- Exits 0 only if all 8 rows pass; otherwise exits 1 with a per-failure summary.

## Earlier (invalid) run on 2026-05-16T23:46Z

The earlier run measured the wrong things and is preserved here as a regression baseline only:

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

These numbers are invalid because:

1. **Server**: ran `npm run dev` (uncompiled, unminified, no tree-shake, no minification). Real users hit the production build via Vercel CDN. Dev-server perf scores are routinely 30–60 points lower than production scores; LCP is typically 5–10× slower because every request triggers compilation on demand.
2. **Route**: `/cart` returns 404 — cart is a Radix Drawer overlay mounted globally, not a routable page. Lighthouse refused to score and both rows are n/a.

Both issues are now fixed in `scripts/lighthouse-runs.mjs`:

- `startDevServer()` → `startProdServer()` — spawns `next start`, asserts `.next/` exists first, fails loudly with `npm run build` instruction if not.
- `/cart` → `/create-perfume` — real route, the second payment surface per QA-02.

## Expected outcome on operator run

Based on the audit infrastructure shipped in M4 P1 + P2 — image optimization, OKLCH tokens, Server Components, `Suspense` boundaries, no client-side waterfalls on home, hero `<video>` set to `preload="metadata"`, JSON-LD blocks server-rendered:

- **Performance ≥ 0.90** — likely PASS on home / shop / create-perfume (server-rendered, minimal client JS). PDP may need an image-priority audit if it falls short.
- **Accessibility ≥ 0.90** — likely PASS across the board; the M4 P2 hairline-stack pattern uses semantic headings, the M4 P3 T1 axe-scaffolding fix to `SortControl` resolved the `aria-valid-attr-value` regression, and the existing token system carries AA-compliant contrast on `text-fg` / `text-fg-muted`.
- **LCP ≤ 2500ms mobile** — likely PASS on home (hero image is `priority`, video is metadata-only). PDP / shop PASS contingent on image-CDN headers.
- **CLS ≤ 0.1** — likely PASS (no late-loading shifters; images carry width/height; fonts use `display: swap` with `size-adjust`).
- **TBT ≤ 200ms desktop** — likely PASS (no main-thread blockers; Stripe and Sentry load async).

If any row fails on the operator's run, those are real findings — surface to M4 P4 Handoff as a defect, do NOT relax thresholds.

## Operator follow-up

After running `npm run build && npm run lighthouse` locally:

1. The script overwrites this file with real production-build numbers.
2. Commit the populated file with: `chore(p3): lighthouse scores populated from operator run (M4 P3 T2)`.
3. If any row fails, file a GH issue per failing (route, viewport, metric) and add to the M4 P4 Handoff defect list.
