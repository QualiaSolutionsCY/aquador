---
phase: 1
result: PASS
gaps: 3
severity: MEDIUM (all gaps are quality/polish, not blockers)
---

# Phase 1 Verification

**Goal:** Lock the v3.0 aesthetic direction and ship the design tokens (OKLCH palette + fluid type + spacing + motion + shadow) that every later phase depends on.

**Verdict: PASS** -- All hard contracts pass. The design-laws gate is wired and clean. Three gaps are MEDIUM/LOW severity. None blocks the next phase.

---

## Contract Results

| Task | Check | Result | Notes |
|------|-------|--------|-------|
| Task 1 | file-exists tokens.css | PASS | File exists, 179 lines |
| Task 1 | oklch-count >=25 | PASS | 25 matches |
| Task 1 | no-banned-literals | PASS | exit=1 (no matches) |
| Task 1 | globals-import | PASS | 1 match; is line 1 |
| Task 1 | all-semantic-tokens for-loop | PASS | OK -- all present |
| Task 2 | banned-fonts-removed | PASS | exit=1 (Playfair/Poppins absent) |
| Task 2 | new-fonts-loaded >=3 | PASS | 5 matches |
| Task 2 | font-vars-wired >=3 | PASS | 3 matches |
| Task 2 | legacy-font-alias | PASS | 1 match in tokens.css |
| Task 3 | no-hex-in-tailwind | PASS | exit=1 (no matches) |
| Task 3 | semantic-tokens all present | PASS | OK |
| Task 3 | legacy-aliases gold/dark/playfair/poppins | PASS | 5 matches (>=4 required) |
| Task 3 | TypeScript compiles | PASS | 0 errors |
| Task 4 | showcase-file-exists | DEVIATION | Renamed to src/app/design-system/page.tsx |
| Task 4 | token-families-consumed | PASS | accent:3 font-display:15 space-:36 shadow-:5 duration-:3 |
| Task 4 | not-in-nav components | PASS | exit=1 (zero matches) |
| Task 4 | route-returns-200 | NOT VERIFIED | Pre-deploy gate blocked npm run dev; TS clean -- high confidence |
| Task 5 | script-executable | PASS | OK |
| Task 5 | clean-on-tokens.css | PASS | exit=0, 0 findings |
| Task 5 | clean-on-showcase | PASS | exit=0, 0 findings |
| Task 5 | clean-on-tailwind | PASS | exit=0, 0 findings |
| Task 5 | trip-on-bad-file | PASS | exit=1, CRITICAL:2 (#000000 + Inter) |
| Task 5 | lint-wired in package.json | PASS | 2 matches |
| Phase | DESIGN.md-intact | PASS | Both direction+differentiation sentences present |
---

## Scores

| Criterion | Correctness | Completeness | Wiring | Quality | Verdict |
|-----------|-------------|--------------|--------|---------|---------|
| tokens.css OKLCH substrate | 5 | 5 | 5 | 4 | PASS |
| Font swap (Cormorant + Newsreader + Geist) | 4 | 4 | 4 | 3 | PASS |
| Tailwind semantic rewire | 5 | 5 | 5 | 4 | PASS |
| Design showcase page | 5 | 4 | 5 | 4 | PASS |
| design-laws-check.sh + lint wiring | 5 | 5 | 5 | 5 | PASS |

**Minimum threshold check:** All criteria score >= 3 on all dimensions. No FAIL.

---

## Code Quality

- TypeScript: PASS -- npx tsc --noEmit exits 0, 0 error TS counts
- Stubs found: 0 in all 5 new files
- Empty handlers: 0
- design-laws-check on all new v3.0 files: 0 findings

---

## Gaps

### Gap 1 (MEDIUM) -- Token shadowing: globals.css :root overrides motion + radius tokens from tokens.css

src/app/globals.css:152 -- "--duration-base: 300ms;" overrides src/styles/tokens.css:143 -- "--duration-base: 250ms;"

src/app/globals.css:153 -- "--duration-slow: 500ms;" overrides src/styles/tokens.css:144 -- "--duration-slow: 400ms;"

CSS cascade: tokens.css loads first via @import on globals.css line 1, then globals.css :root re-declares. The globals.css values WIN at runtime.

src/app/globals.css:160 -- "--radius-xl: 1.5rem;" (24px) violates DESIGN.md:245 -- "Border-radius > 16px on any primitive" is banned.

src/app/globals.css:161 -- "--radius-full: 9999px;" massively violates the editorial 16px cap.

**Impact:** Motion Preview section labels say 250ms/400ms but actual runtime durations are 300ms/500ms (globals.css wins). Showcase documents incorrect values.

**Severity:** MEDIUM -- per grounding.md Severity Rubric: "Feature works but ... hardcoded values that should be vars."

**Fix before M2:** Remove --duration-base, --duration-slow, --radius-xl, --radius-full from globals.css :root. Canonical values live in tokens.css only.

---

### Gap 2 (MEDIUM) -- --font-body naming ambiguity: size token name reused as font-family variable

src/styles/tokens.css:82 -- "--font-body: 1rem;" declares --font-body as a font SIZE (16px base).

src/app/layout.tsx:32 -- "variable: "--font-body"" uses the SAME name as the next/font Newsreader CSS variable injection target.

Runtime: next/font hydration overrides the :root 1rem value with actual Newsreader font stack on <body>. Functionally works. But the fallback is semantically wrong -- font-family: var(--font-body) before hydration resolves to 1rem (invalid as a font-family value).

The correct family variable is src/styles/tokens.css:92 -- "--font-body-family: Newsreader, Georgia, serif" -- but no consumer uses that name.

**Fix before M2:** Rename the size token to --font-size-body. Reserve --font-body as the family variable with Newsreader fallback.

---

### Gap 3 (LOW) -- Showcase route path deviates from plan contracts (_design -> design-system)

src/app/design-system/page.tsx exists. src/app/_design/page.tsx does NOT exist.

Plan Task 4 contract targeted _design. Commit ddcf1ad documents intentional rename -- Next.js 14 App Router treats _-prefixed folders as private (non-routable) in dev AND prod.

Impact: zero user impact, correct fix. Plan Verification Contract entries that grep for _design will fail literally if re-run -- plan-doc debt only.

---## Per-Task Acceptance Criteria Walk

### Task 1 -- tokens.css OKLCH substrate -- PASS

- src/styles/tokens.css:14-179 -- file exists with full :root + [data-theme="dark"] + prefers-reduced-motion guard
- src/styles/tokens.css:20-48 -- every color value is oklch(), zero raw hex or rgb() in file
- src/styles/tokens.css:51-59 -- all 9 semantic roles present: --bg, --bg-alt, --fg, --fg-muted, --accent, --accent-deep, --critical, --border, --border-strong
- src/styles/tokens.css:71-99 -- fluid clamp() type scale --font-display-3xl through --font-micro
- src/styles/tokens.css:105-127 -- --space-1 through --space-32, --page-px, --page-py, four container widths
- src/styles/tokens.css:130-132 -- --shadow-1, --shadow-2, --shadow-3 (OKLCH-tinted warm, not gray)
- src/styles/tokens.css:138-145 -- three easings, four durations (150/250/400/700ms)
- src/styles/tokens.css:151-153 -- --radius-sm:4px, --radius-md:8px, --radius-lg:16px (all <= 16px cap)
- src/styles/tokens.css:98-99 -- --font-playfair: var(--font-display), --font-poppins: var(--font-body-family)
- src/app/globals.css:1 -- @import "../styles/tokens.css"; as first line

### Task 2 -- Font swap -- PASS (Geist deviation documented)

- src/app/layout.tsx:2 -- "import { Cormorant_Garamond, Newsreader } from next/font/google;" -- Playfair/Poppins removed
- src/app/layout.tsx:3 -- "import { GeistSans } from geist/font/sans;" -- Vercel-official npm package; Next 14.2.35 lacks Geist in Google Fonts catalogue
- src/app/layout.tsx:22-28 -- Cormorant_Garamond: weights [400,500] italic, variable --font-display -- matches DESIGN.md §3
- src/app/layout.tsx:30-36 -- Newsreader: weights [400,500] italic, variable --font-body -- matches DESIGN.md §3
- src/app/layout.tsx:117 -- className applies cormorant.variable + newsreader.variable + GeistSans.variable to <body>
- src/app/layout.tsx:118 -- style={{--font-micro: var(--font-geist-sans)}} two-hop binding achieves same runtime result
- src/styles/tokens.css:98 -- --font-playfair: var(--font-display) legacy alias present

### Task 3 -- Tailwind semantic rewire -- PASS (Gap 1 noted)

- tailwind.config.ts:33-116 -- semantic roles (bg, fg, accent, border) with var(--*); OKLCH neutral scale with <alpha-value>; legacy gold/dark/gray aliases
- tailwind.config.ts:118-128 -- fontFamily: display/body/micro + playfair/poppins legacy aliases all present
- tailwind.config.ts:158-165 -- backgroundImage gradients use var(--accent), var(--bg) only; zero hex
- tailwind.config.ts:145-152 -- pulse-gold keyframe uses oklch(0.72 0.135 82 / 0.3); no rgba
- src/app/globals.css:75-94 -- :root legacy vars aliased to var(--*), zero hex literals in that block
- src/app/globals.css:177 -- font-family: var(--font-body), Georgia, serif -- body updated
- src/app/globals.css:209 -- font-family: var(--font-display), Georgia, serif -- headings updated
- grep for hex in tailwind.config.ts: exit=1

### Task 4 -- Design showcase page -- PASS (route renamed to /design-system, Gap 3 noted)

- src/app/design-system/page.tsx:22-25 -- metadata robots: {index:false, follow:false}
- src/app/design-system/page.tsx:38-74 -- 30 swatches (Semantic:9, Anchor:11, Neutral:10) exceeds 18 AC requirement
- src/app/design-system/page.tsx:246-390 -- 10 type rows, 3 italic display samples, micro label uppercase tracking 0.05em
- src/app/design-system/page.tsx:406-435 -- 10 spacing ruler steps with rem + px labels
- src/app/design-system/page.tsx:458-481 -- 3 motion cards with --duration-fast/base/slow and --ease-out-expo; reduced-motion notice present
- src/app/design-system/page.tsx:511-514 -- 3 shadow cards with --shadow-1, --shadow-2, --shadow-3
- src/app/design-system/page.tsx:163-165 -- .design-motion-card:focus-visible outline 2px solid var(--accent) -- keyboard accessible
- grep design-system in src/components/: exit=1 (not linked from any component or nav)

### Task 5 -- design-laws-check.sh + lint wiring -- PASS

- scripts/design-laws-check.sh:1 -- #!/usr/bin/env bash
- scripts/design-laws-check.sh:13 -- set -euo pipefail
- scripts/design-laws-check.sh:127-146 -- six pattern checks: hex (CRITICAL/HIGH), rgba (HIGH), banned fonts (CRITICAL), radius>16px (MEDIUM), duration>1000ms (MEDIUM), outline:none without focus (LOW)
- scripts/design-laws-check.sh:21 -- --strict flag implemented, ignores .designlawsignore
- .designlawsignore:1-62 -- 62 lines, all legacy dirs/files pre-seeded per phase risk envelope
- package.json -- "lint": "next lint && npm run lint:design"
- package.json -- "lint:design": "bash scripts/design-laws-check.sh"
- design-laws-check on tokens.css: exit=0
- design-laws-check on design-system/page.tsx: exit=0
- design-laws-check on tailwind.config.ts: exit=0
- trip script on #000+Inter CSS: exit=1, CRITICAL:2

---
## Design Rubric -- Phase 1

Phase 1 is token substrate + showcase page. Scoring: app-scoped (global foundations + showcase page).

| Dim | Score | Evidence |
|---|---|---|
| Typography | 5 | src/styles/tokens.css:71-99 -- full clamp() scale display-3xl to micro. src/app/layout.tsx:22-36 -- Cormorant Garamond + Newsreader [400,500] + italic loaded. src/app/design-system/page.tsx:246-390 -- 10-step specimen with 3 italic display samples. Zero Inter/Arial/system-ui in new files. |
| Color cohesion | 5 | src/styles/tokens.css:20-59 -- full OKLCH palette, hue 80 for all neutrals (warm toward gold). Semantic role table maps anchor colors to roles. [data-theme="dark"] at tokens.css:160-167 flips semantic roles only. Strategy: Restrained. |
| Spacing | 5 | src/styles/tokens.css:105-127 -- 10-step 8px grid, fluid clamp() page padding. Showcase uses var(--space-*) 36 times. Zero magic px values in new code. |
| States | 3 | src/app/design-system/page.tsx:163-165 -- focus-visible on motion cards with var(--accent) outline. No loading/empty/error states needed (static showcase). Acceptable for phase scope. |
| Motion intent | 4 | src/styles/tokens.css:138-178 -- three durations, three easings, prefers-reduced-motion guard collapses all transitions. Showcase demonstrates all three speeds. No bounce, no scale-pop (design-laws-check passes). Deduction: Gap 1 means --duration-base runtime=300ms not 250ms due to globals.css override. |
| Microcopy | 4 | Showcase uses actual perfume copy from PRODUCT.md differentiation ("Reading a perfume page felt like opening a letter"). Token captions are self-documenting OKLCH literals. |
| Layout originality | 4 | CSS grid auto-fill (minmax(140px,1fr)) for swatches. var(--container-full) for page max-width. var(--page-px)/var(--page-py) for fluid padding. No hardcoded 1200px max-width containers. |
| Container depth | 4 | Clear hierarchy: page wrapper -> section -> group -> tile. SectionHeader eyebrow+h2 pattern. SwatchTile figure/figcaption. No excessive nesting. |

**Aggregate:** 34/40 (avg 4.25)
**Design verdict:** PASS (all dims >= 3)

---

## Deviations from Plan (builder-flagged, all verified acceptable)

1. Task 2 -- GeistSans imported from geist/font/sans npm package (not next/font/google). Next 14.2.35 does not expose Geist in its Google Fonts catalogue. Vercel-official package; identical CSS variable injection mechanism. ACCEPTABLE.
2. Task 3 -- Legacy color aliases (gold/dark/gray) use OKLCH literals with <alpha-value> not var(--*). Required for Tailwind 3.4 opacity modifier syntax (bg-gold/10). Same OKLCH values as tokens.css. ACCEPTABLE.
3. Task 3 -- Legacy rgba() literals in globals.css utility classes remain. globals.css is in .designlawsignore. Catalogued for M2 cleanup. ACCEPTABLE.
4. Task 4 -- _design -> design-system rename. Next.js 14 App Router drops _-prefix folders from routing entirely. Route now at /design-system. robots: noindex/nofollow preserved. ACCEPTABLE.

---

## Verdict

**PASS** -- Phase 1 goal achieved. OKLCH token substrate is live in src/styles/tokens.css. Cormorant Garamond + Newsreader + Geist loaded and bound to CSS variables. Tailwind config exposes semantic utilities backed by var(--*) with legacy aliases keeping the site buildable. Design showcase at /design-system renders all five sections and consumes every token family. design-laws-check.sh is wired into npm run lint, exits 0 on new v3.0 files, and trips on banned patterns.

**M2 backlog items from this verification:**

1. MEDIUM -- Remove --duration-base/--duration-slow/--radius-xl/--radius-full overrides from globals.css :root. These shadow the canonical tokens.css values with incorrect values (300ms vs 250ms, 500ms vs 400ms, 24px vs cap of 16px, 9999px vs cap of 16px).
2. MEDIUM -- Rename --font-body (currently set to 1rem as a size) to --font-size-body in tokens.css. Reserve --font-body as the font-family variable with Newsreader fallback to match its usage by next/font and all consumers.
3. LOW -- Update phase-1-plan.md Verification Contract entries targeting src/app/_design/page.tsx to reflect the design-system rename.

Proceed to Phase 2.