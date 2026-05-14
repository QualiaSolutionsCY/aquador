---
phase: 1
goal: "Lock the v3.0 aesthetic direction and ship the design tokens (OKLCH palette + fluid type + spacing + motion + shadow) that every later phase depends on."
tasks: 5
waves: 2
---

# Phase 1: Direction & Tokens

**Goal:** The v3.0 aesthetic substrate is live in code. `src/styles/tokens.css` exposes the full OKLCH palette + spacing + motion + shadow tokens from DESIGN.md §2/§4/§6/§7. `src/app/layout.tsx` loads Cormorant Garamond + Newsreader + Geist via `next/font/google` and binds them to `--font-display` / `--font-body` / `--font-micro`. `tailwind.config.ts` exposes new semantic utilities (`text-fg`, `bg-bg`, `bg-accent`, `border-border`, etc.) backed by `var(--*)`, with legacy `gold-*` / `dark-*` aliases pointing to the new tokens so existing pages still build. A non-routed `src/app/_design/page.tsx` showcase renders a swatch grid, type specimen, spacing ruler, motion preview, and shadow elevation samples — the visual proof that tokens behave as committed. `scripts/design-laws-check.sh` greps for DESIGN.md §10 absolute bans and exits non-zero on hit, wired into `npm run lint`.

**Why this phase:** Every subsequent v3.0 phase (stack migration, primitives, page rebuilds) consumes these tokens. Shipping them first turns the rest of M1 into substitution work, not invention. Without tokens locked, every primitive built in Phase 3 would hardcode hex and we'd re-do the whole library when the tokens land late.

**Risk envelope:** The site stays buildable. Legacy `text-gold-500` / `bg-dark` Tailwind classes continue to render correctly (they alias to the new tokens). No existing page's visual fidelity is required to improve in this phase — that's M2's job. The slop-detect script blocks NEW banned-pattern commits without retro-banning the legacy code; legacy hex offenders are catalogued (not deleted) and cleared in M2.

---

## Task 1 — Create `src/styles/tokens.css` (the OKLCH substrate)
**Wave:** 1
**Persona:** frontend
**Files:**
- `src/styles/tokens.css` (NEW — exports the full OKLCH palette, semantic role tokens, type scale, spacing scale, container widths, motion tokens, shadow tokens, page padding tokens, radius tokens). Pure CSS custom properties under `:root` and `[data-theme="dark"]` — no selectors that touch elements.
- `src/app/globals.css` (MODIFY — add `@import "../styles/tokens.css";` as the **first** line of the file, before the `@tailwind` directives. Leave the rest of the file untouched in this task; legacy cleanup lives in Task 3).

**Depends on:** none

**Why:** DESIGN.md §2/§4/§6/§7 commit to the palette, scale, motion, and shadows but they currently live only in the planning document. Without runtime CSS variables, the Tailwind rewire (Task 3) and the showcase page (Task 4) have nothing to consume. This task is the single ground-truth file every later phase imports. (Implements DESIGN-02, DESIGN-04)

**Acceptance Criteria:**
- `src/styles/tokens.css` exists and contains every CSS custom property listed in DESIGN.md §2 (ink/bone/parchment/gold/oxblood/neutrals + semantic `--bg`/`--fg`/`--accent`/`--border` mappings under `:root`, and the dark-theme overrides under `[data-theme="dark"]`).
- The same file contains the fluid type scale from §3 (`--font-display-3xl` through `--font-micro`, weights + tracking notes can live as comments), the spacing scale from §4 (`--space-1` through `--space-32`), page padding (`--page-px`, `--page-py`), container widths (`--container-narrow` through `--container-full`), the motion tokens from §7 (3 easings + 4 durations + the `prefers-reduced-motion` guard), the shadow tokens from §6 (`--shadow-1`/`--shadow-2`/`--shadow-3`), and a `--radius-sm`/`--radius-md`/`--radius-lg` triad (max 16px per §10).
- Every color value is OKLCH. Zero `#000`, `#fff`, named hex, `rgb()`, `rgba()`, or `hsl()` literals in `tokens.css`.
- `src/app/globals.css` starts with `@import "../styles/tokens.css";` and the existing Tailwind directives + body styles + all legacy CSS continues to live below it untouched.
- `npm run build` exits 0 and the dev server boots (the existing pages render — possibly visually unchanged or slightly off since the new tokens are not yet wired into Tailwind; that's fine for this task).

**Action:**
1. Create the directory: `mkdir -p src/styles`.
2. Create `src/styles/tokens.css` with the literal blocks from DESIGN.md §2 (anchor palette + semantic roles + dark overrides), §3 (font scale custom properties), §4 (spacing + page padding + container widths), §6 (3-level shadow elevation), §7 (easings + durations + reduced-motion media query). Use the exact OKLCH values from DESIGN.md — do NOT round, re-pick, or "improve" them.
3. Add radius tokens (`--radius-sm: 4px; --radius-md: 8px; --radius-lg: 16px;`) — values capped at 16px per DESIGN.md §10 ("Border-radius > 16px on any primitive" is banned).
4. Add `--font-display`, `--font-body`, `--font-micro` to `:root` as fallback chains that will be OVERRIDDEN by `next/font`'s injection on `<body>` once Task 2 lands. Declare them with literal serif/sans fallbacks so the site renders correctly even if Task 2 has not yet committed:
   ```css
   /* Will be re-bound by next/font on <body> in Task 2 — these are the fallbacks. */
   --font-display: 'Cormorant Garamond', Georgia, serif;
   --font-body: 'Newsreader', Georgia, serif;
   --font-micro: 'Geist', system-ui, sans-serif;

   /* Legacy font aliases — every component written before v3.0 reads these names.
      They resolve to the new pair so the live site doesn't break.
      Remove after M2 component migration clears the last reference. */
   --font-playfair: var(--font-display);
   --font-poppins: var(--font-body);
   ```
   This makes Task 1 the SOLE writer of `src/styles/tokens.css`; Task 2 only edits `src/app/layout.tsx`. The wave graph stays parallel-safe.
5. Open `src/app/globals.css`, prepend `@import "../styles/tokens.css";` as line 1 (before `@tailwind base;`). Do NOT touch any other line in `globals.css` in this task — leave legacy `--gold`, `--background`, etc. in place; they will be reconciled in Task 3.
6. Run `npm run build` to confirm the import path resolves and the CSS compiles.

**Validation:** (builder self-check)
- `test -f src/styles/tokens.css && echo EXISTS` → `EXISTS`
- `grep -E '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(' src/styles/tokens.css; echo "exit=$?"` → `exit=1` (no matches; grep exits 1)
- `grep -c "oklch(" src/styles/tokens.css` → ≥ 25 (palette has 20+ OKLCH literals)
- `grep -c "@import \"../styles/tokens.css\"" src/app/globals.css` → 1
- `head -1 src/app/globals.css` → `@import "../styles/tokens.css";`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `npm run build 2>&1 | tail -20` → no CSS compilation errors, build succeeds

**Context:** Read @.planning/DESIGN.md (especially §2, §3, §4, §6, §7, §10), @/home/qualia/.claude/qualia-design/design-laws.md (§1 OKLCH rules, §8 absolute bans), @src/app/globals.css (current state, to see what NOT to remove yet).

**Design:**
- Register: product (mixed — substrate file serves both registers)
- Tokens used: this task DEFINES the tokens. References to DESIGN.md §2/§3/§4/§6/§7 are verbatim.
- Scope: app (token substrate is global)
- Anti-pattern guard: pre-commit grep — `grep -E '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(' src/styles/tokens.css` must return exit 1 (no matches). If any banned literal lands, the commit must be blocked locally.

---

## Task 2 — Swap fonts in `src/app/layout.tsx` to Cormorant Garamond + Newsreader + Geist
**Wave:** 1
**Persona:** frontend
**Files:**
- `src/app/layout.tsx` (MODIFY — replace the `Playfair_Display` and `Poppins` imports from `next/font/google` with `Cormorant_Garamond`, `Newsreader`, and `Geist`. Map them to `--font-display`, `--font-body`, `--font-micro` respectively. Apply all three variable class names to `<body>`. The existing `playfair`/`poppins` const names go away; legacy components that read `var(--font-playfair)` or `var(--font-poppins)` keep working because Task 1 already declared `--font-playfair: var(--font-display)` and `--font-poppins: var(--font-body)` in tokens.css. This task touches ONLY `src/app/layout.tsx`.)

**Depends on:** none

**Why:** DESIGN.md §3 commits to a serif-first editorial typography pair (Cormorant Garamond display + Newsreader body + Geist micro). The current layout loads Playfair Display + Poppins, both explicitly on DESIGN.md's banned list (§3 banned roster) and the design-laws §8 absolute-bans set. Keeping Playfair would make every later phase ship slop by default. Loading the new pair via `next/font/google` also gives us preconnect + display-swap + zero CLS for free — switching later is more expensive than switching now. (Implements DESIGN-03)

**Acceptance Criteria:**
- `src/app/layout.tsx` no longer imports `Playfair_Display` or `Poppins` from `next/font/google`.
- It imports `Cormorant_Garamond`, `Newsreader`, and `Geist` from `next/font/google` and binds them to CSS variables `--font-display`, `--font-body`, `--font-micro`.
- Weights loaded match DESIGN.md §3: display `[400, 500]` with italic, body `[400, 500]` with italic, micro `[500]`. All with `display: "swap"` and `subsets: ["latin"]`.
- The three variable class names are applied to `<body>` (e.g. `className={`${cormorant.variable} ${newsreader.variable} ${geist.variable} antialiased`}`).
- Backward-compat: Task 1 has already declared `--font-playfair: var(--font-display)` and `--font-poppins: var(--font-body)` in `src/styles/tokens.css` (see Task 1 Action step 4). Verify these aliases exist with: `grep -c -- "--font-playfair: var(--font-display)" src/styles/tokens.css` → `1`. Do NOT write to `src/styles/tokens.css` in this task — Task 1 is the sole writer of that file. Existing components reading `var(--font-playfair)` will resolve to the new display font via the alias chain already in place.
- `npm run build` exits 0. The dev server boots; the homepage hero renders with the new Cormorant Garamond display face (not Playfair, not Times fallback).

**Action:**
1. Open `src/app/layout.tsx`. Replace lines 2 (`import { Playfair_Display, Poppins } from "next/font/google";`) with `import { Cormorant_Garamond, Newsreader, Geist } from "next/font/google";`.
2. Replace the `playfair` and `poppins` const blocks (lines 21-33) with three new const blocks:
   ```ts
   const cormorant = Cormorant_Garamond({
     subsets: ["latin"],
     variable: "--font-display",
     display: "swap",
     weight: ["400", "500"],
     style: ["normal", "italic"],
   });

   const newsreader = Newsreader({
     subsets: ["latin"],
     variable: "--font-body",
     display: "swap",
     weight: ["400", "500"],
     style: ["normal", "italic"],
   });

   const geist = Geist({
     subsets: ["latin"],
     variable: "--font-micro",
     display: "swap",
     weight: ["500"],
   });
   ```
3. Update the `<body>` element's `className` (line 113): replace `` `${poppins.variable} ${playfair.variable} antialiased` `` with `` `${cormorant.variable} ${newsreader.variable} ${geist.variable} antialiased` ``.
4. Verify the Google Fonts weights/styles are loadable: Cormorant Garamond (400, 500, 400 italic, 500 italic), Newsreader (400, 500, 400 italic, 500 italic), Geist (500). If any combo errors at build time with "weight not available", consult https://fonts.google.com/specimen/{font} via the next-devtools MCP / WebFetch and adjust to the nearest supported weight (e.g. Newsreader supports 400-700 — request exactly the weights DESIGN.md specifies).
5. Run `npm run build` to confirm no font-loading errors.

**Validation:**
- `grep -E "Playfair_Display|Poppins" src/app/layout.tsx; echo "exit=$?"` → `exit=1` (no matches)
- `grep -c "Cormorant_Garamond" src/app/layout.tsx` → 1
- `grep -c "Newsreader" src/app/layout.tsx` → 1
- `grep -c "Geist" src/app/layout.tsx` → 1
- `grep -c -- '--font-display' src/app/layout.tsx` → ≥ 1
- `grep -c -- '--font-playfair: var(--font-display)' src/styles/tokens.css` → 1 (legacy alias present — written by Task 1, verified here)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `npm run build 2>&1 | grep -iE "error|failed" | head` → no font-load errors

**Context:** Read @.planning/DESIGN.md §3 (typography commitment), @/home/qualia/.claude/qualia-design/design-laws.md §4 + §8 (typography rules + banned fonts), @src/app/layout.tsx (current font setup, the lines you're replacing).

**Design:**
- Register: product (mixed — fonts ship for both registers via the app shell)
- Tokens used: `var(--font-display)`, `var(--font-body)`, `var(--font-micro)`
- Scope: app (font substrate is global)
- Anti-pattern guard: pre-commit grep — `grep -rE "Inter|Playfair|Poppins|Arial|Helvetica|Roboto|system-ui|Space Grotesk|Lato|Montserrat|Open Sans" src/app/layout.tsx; echo "exit=$?"` must return `exit=1`. Banned font names appearing anywhere in `layout.tsx` block the commit.

---

## Task 3 — Rewire `tailwind.config.ts` to semantic-token utilities (with legacy aliases)
**Wave:** 2
**Persona:** frontend
**Files:**
- `tailwind.config.ts` (MODIFY — replace the `colors` block entirely. Add a semantic-role table that maps `bg`, `bg-alt`, `fg`, `fg-muted`, `accent`, `accent-deep`, `critical`, `border`, `border-strong` to `var(--bg)`, `var(--fg)`, `var(--accent)`, etc. Keep `gold` and `dark` as legacy aliases pointing at the new tokens so existing markup like `bg-gold`, `text-gold-500`, `bg-dark` continues to render — the legacy classes resolve to the NEW palette, not the old hex. Add `fontFamily.display`, `fontFamily.body`, `fontFamily.micro` mapped to the CSS variables from Task 2. Remove the `playfair`/`poppins` entries and replace with `display`/`body`/`micro`; add `playfair`/`poppins` as legacy aliases pointing to the same variables for backward compat.)
- `src/app/globals.css` (MODIFY — replace the `:root` block's legacy variables (`--background`, `--foreground`, `--gold`, `--gold-light`, `--gold-dark`, `--bg-black`, `--bg-dark`, `--bg-darker`, `--gray-50` through `--gray-500`) with aliases that point to the Task 1 semantic tokens. E.g. `--background: var(--bg);`, `--foreground: var(--fg);`, `--gold: var(--accent);`. Touch ONLY the legacy variable declarations; do NOT delete component CSS, animations, or utility classes. The `body { font-family: var(--font-poppins), 'Poppins', sans-serif; }` line at line 173 — update to `body { font-family: var(--font-body), Georgia, serif; }` since body is now serif per DESIGN.md §3. The `h1-h6` rule at line 205 — update `font-family: var(--font-playfair)...` to `font-family: var(--font-display), Georgia, serif;`.)

**Depends on:** Task 1, Task 2

**Why:** Without this rewire, the new tokens.css is dead weight — Tailwind keeps emitting the old hex palette, every existing `bg-gold` class resolves to `#D4AF37` (not the OKLCH aged-gold), and any new component using semantic classes (`bg-bg`, `text-fg`) won't compile. Backward-compatible aliasing is the only way to flip the palette without breaking the live site in one commit — legacy class names keep their syntax but resolve to the NEW values, so the page color-shifts to v3.0 even before any component is rewritten. This is the keystone task: it activates the substrate.

**Acceptance Criteria:**
- `tailwind.config.ts` `theme.extend.colors` exposes semantic roles: `bg`, `bg-alt`, `fg`, `fg-muted`, `accent`, `accent-deep`, `critical`, `border`, `border-strong` (each mapped to a `var(--*)` token from Task 1).
- The legacy `gold` and `dark` color families remain present BUT every shade resolves to a `var(--*)` token from Task 1, not a raw hex. Example: `gold.DEFAULT: "var(--accent)"`, `gold[500]: "var(--accent)"`, `dark.DEFAULT: "var(--bg)"`.
- `tailwind.config.ts` `theme.extend.fontFamily` exposes `display: ["var(--font-display)", "Georgia", "serif"]`, `body: ["var(--font-body)", "Georgia", "serif"]`, `micro: ["var(--font-micro)", "system-ui", "sans-serif"]`. Legacy `playfair` and `poppins` entries remain, pointing at the same display and body variables respectively.
- The `gold-gradient` / `dark-gradient` / `light-gradient` `backgroundImage` entries in `tailwind.config.ts` (lines 76-80) are removed OR rewritten to use `oklch()` values from tokens.css. DESIGN.md §8 bans gradient text and gradient backgrounds-as-default; if a gradient is used in legacy markup we keep one neutral fallback (`linear-gradient(135deg, var(--accent), var(--accent-deep))`) so legacy class names still resolve, but no `#D4AF37`/`#FFD700` literals remain in `tailwind.config.ts`.
- `src/app/globals.css` `:root` block contains zero hex literals (only `var(--*)` references or OKLCH values). The body and `h1-h6` font-family declarations point at `--font-body` and `--font-display`.
- `npm run build` exits 0. The homepage renders: the gold reads as the new restrained OKLCH aged-gold (not the old neon `#FFD700`), backgrounds are warm bone (not pure `#FAFAF8`), text is the warm ink color. Visual fidelity of existing pages may shift — that is the intended outcome.
- `grep -E "#[0-9a-fA-F]{3,8}" tailwind.config.ts; echo "exit=$?"` returns `exit=1` (no hex literals).

**Action:**
1. Open `tailwind.config.ts`. Replace the entire `theme.extend.colors` block (lines 11-47) with:
   ```ts
   colors: {
     // Semantic roles — primary API for v3.0 components
     bg: "var(--bg)",
     "bg-alt": "var(--bg-alt)",
     fg: "var(--fg)",
     "fg-muted": "var(--fg-muted)",
     accent: { DEFAULT: "var(--accent)", deep: "var(--accent-deep)" },
     critical: "var(--critical)",
     border: { DEFAULT: "var(--border)", strong: "var(--border-strong)" },

     // Tinted neutral scale
     neutral: {
       50: "var(--color-neutral-50)",
       100: "var(--color-neutral-100)",
       200: "var(--color-neutral-200)",
       300: "var(--color-neutral-300)",
       400: "var(--color-neutral-400)",
       500: "var(--color-neutral-500)",
       600: "var(--color-neutral-600)",
       700: "var(--color-neutral-700)",
       800: "var(--color-neutral-800)",
       900: "var(--color-neutral-900)",
     },

     // Legacy aliases — existing markup keeps compiling, resolves to new tokens
     gold: {
       DEFAULT: "var(--accent)",
       light: "var(--color-gold-soft)",
       dark: "var(--accent-deep)",
       50: "var(--color-neutral-50)",
       100: "var(--color-neutral-100)",
       200: "var(--color-neutral-200)",
       300: "var(--color-gold-soft)",
       400: "var(--color-gold-soft)",
       500: "var(--accent)",
       600: "var(--accent-deep)",
       700: "var(--accent-deep)",
       800: "var(--color-ink-soft)",
       900: "var(--color-ink)",
     },
     dark: {
       DEFAULT: "var(--bg)",
       light: "var(--bg-alt)",
       lighter: "var(--color-neutral-100)",
     },
     gray: {
       50: "var(--color-neutral-50)",
       100: "var(--color-neutral-100)",
       200: "var(--color-neutral-200)",
       300: "var(--color-neutral-300)",
       400: "var(--color-neutral-400)",
       500: "var(--color-neutral-500)",
     },
     // Keep generic mappings the existing layout uses
     background: "var(--bg)",
     foreground: "var(--fg)",
     muted: { DEFAULT: "var(--bg-alt)", foreground: "var(--fg-muted)" },
   },
   ```
2. Replace `theme.extend.fontFamily` (lines 48-51) with:
   ```ts
   fontFamily: {
     display: ["var(--font-display)", "Georgia", "serif"],
     body: ["var(--font-body)", "Georgia", "serif"],
     micro: ["var(--font-micro)", "system-ui", "sans-serif"],
     // Legacy aliases — resolve to the new pair so existing components keep rendering
     playfair: ["var(--font-display)", "Georgia", "serif"],
     poppins: ["var(--font-body)", "Georgia", "serif"],
   },
   ```
3. Rewrite `theme.extend.backgroundImage` (lines 76-80) — replace every hex literal:
   ```ts
   backgroundImage: {
     "gold-gradient": "linear-gradient(135deg, var(--accent) 0%, var(--color-gold-soft) 50%, var(--accent) 100%)",
     "dark-gradient": "linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 50%, var(--bg) 100%)",
     "light-gradient": "linear-gradient(135deg, var(--bg) 0%, var(--bg-alt) 50%, var(--bg) 100%)",
   },
   ```
4. Rewrite the `pulse-gold` keyframe (lines 67-70) and other keyframes that reference `rgba(212, 175, 55, ...)` — replace with `oklch()` form: `boxShadow: "0 0 20px oklch(0.72 0.135 82 / 0.3)"` for the 0%/100% step and the equivalent at 50%. Same treatment for any other rgba in the config.
5. Open `src/app/globals.css`. In the `:root` block (lines 69-158), replace EVERY hex literal (`#FAFAF8`, `#0a0a0a`, etc.) with a `var(--*)` reference into Task 1's tokens. Specifically:
   - `--background: var(--bg);`
   - `--foreground: var(--fg);`
   - `--gold: var(--accent);`
   - `--gold-light: var(--color-gold-soft);`
   - `--gold-dark: var(--accent-deep);`
   - `--bg-black: var(--bg);`
   - `--bg-dark: var(--bg-alt);`
   - `--bg-darker: var(--color-neutral-100);`
   - Keep the `--gray-*` block but each value becomes `var(--color-neutral-*)`.
6. Update the body font-family (line 173) to `font-family: var(--font-body), Georgia, serif;` and the h1-h6 rule (lines 204-210) to `font-family: var(--font-display), Georgia, serif;`. Update `.heading-luxury` (line 217) similarly.
7. **Do NOT delete** the existing component CSS, animation keyframes, or utility classes in `globals.css`. The legacy `rgba(212, 175, 55, ...)` literals scattered through animations and `.text-gradient-gold` etc. will be cleaned up in M2 — for THIS phase, the requirement is that the `:root` declarations and the body/heading font-family lines stop hardcoding hex/banned fonts. Cataloguing legacy offenders is Task 5's job.
8. Run `npm run build`. The pages must compile. Visual review the homepage in the dev server (`npm run dev`) — the gold should read warmer/restrained and the typeface should clearly be Cormorant Garamond, not Playfair. If a page errors with "color not defined" the legacy alias mapping is incomplete; fix the missing alias before continuing.

**Validation:**
- `grep -E "#[0-9a-fA-F]{3,8}" tailwind.config.ts; echo "exit=$?"` → `exit=1`
- `grep -E "rgba?\(" tailwind.config.ts; echo "exit=$?"` → `exit=1` (only OKLCH/var allowed)
- `grep -c "var(--bg)" tailwind.config.ts` → ≥ 1
- `grep -c "var(--accent)" tailwind.config.ts` → ≥ 1
- `grep -c "var(--font-display)" tailwind.config.ts` → ≥ 1 (display family bound)
- `grep -nE "#[0-9a-fA-F]{3,8}" src/app/globals.css | head -5` (manual scan — the `:root` block at lines 69-158 must show zero matches; later sections with legacy `rgba(212,175,55,...)` are tolerated for this phase)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `npm run build 2>&1 | grep -iE "error|failed" | grep -v node_modules` → no Tailwind/CSS errors
- `npm run dev` and visit `http://localhost:3000` → homepage renders without console errors, gold shade is the new OKLCH aged-gold (visibly warmer/less neon than the previous `#FFD700`), and the display font is Cormorant Garamond (clear high-contrast Garamond letterforms, not the Playfair vertical-axis cut).

**Context:** Read @.planning/DESIGN.md §2 (semantic role table), @src/styles/tokens.css (the substrate this task wires into Tailwind — created in Task 1), @tailwind.config.ts (current shape, the blocks you're replacing), @src/app/globals.css lines 69-158 (the `:root` block you're rewiring), @src/app/layout.tsx (font variables you're now binding into Tailwind — created in Task 2).

**Design:**
- Register: product (mixed)
- Tokens used: every semantic CSS var from Task 1 — `--bg`, `--fg`, `--accent`, `--accent-deep`, `--border`, `--font-display`, `--font-body`, `--font-micro`
- Scope: app (Tailwind config is global)
- Anti-pattern guard: pre-commit grep — `grep -E '#[0-9a-fA-F]{3,8}|rgba?\(' tailwind.config.ts; echo "exit=$?"` must return `exit=1`. Any hex or rgba in the Tailwind config blocks the commit.

---

## Task 4 — Build the `_design` showcase route (visual proof of tokens)
**Wave:** 2
**Persona:** ux
**Files:**
- `src/app/_design/page.tsx` (NEW — server component, default export `DesignShowcasePage`. Renders five sections: (1) Swatch grid for every semantic role + neutral scale + ink/bone/gold/oxblood anchors with the OKLCH literal shown as caption; (2) Type specimen — each scale step (`display-3xl` through `micro`) with the literal `clamp()` value as caption, plus italic + uppercase samples; (3) Spacing ruler — visual bars of `--space-1` through `--space-32` with px-equivalent labels; (4) Motion preview — three hoverable cards demonstrating `--duration-fast`/`--duration-base`/`--duration-slow` with each easing, plus a `prefers-reduced-motion` notice; (5) Shadow elevation samples — three cards showing `--shadow-1`/`--shadow-2`/`--shadow-3`. The route lives under `_design` so Next.js excludes it from production routing — it's reachable in dev at `/`+`_design` but NOT linked anywhere in production nav.)

**Depends on:** Task 1, Task 2

**Why:** Tokens are abstract until rendered. Without a showcase, the verifier has no way to confirm visually that the OKLCH values render as DESIGN.md describes (warm bone background, restrained aged-gold, ink-not-pure-black text, italic Cormorant Garamond, fluid type scaling). The showcase also becomes the QA artifact for every later phase: when M2 adds primitives, the team checks them against this page first. It is the "design system reference card" rendered in code, not a Figma file we have to keep in sync. The single-folder `_design` prefix is Next.js's documented opt-out from routing — confirmed via `next/font` docs convention — keeping it preview-only.

**Acceptance Criteria:**
- Route `http://localhost:3000/_design` renders a single page with five clearly-labeled sections in the order above. The page itself uses the new tokens — bone background, ink text, Cormorant Garamond headings, Newsreader body, Geist labels.
- Section 1 (Swatch grid): renders ≥ 18 swatches — every semantic role (`--bg`, `--bg-alt`, `--fg`, `--fg-muted`, `--accent`, `--accent-deep`, `--critical`, `--border`, `--border-strong`) plus the full neutral scale (50-900) plus the four anchor families (ink/bone/gold/oxblood). Each swatch is a 96×96px tile with the OKLCH value shown below in `font-micro` Geist 12px uppercase tracking 0.05em.
- Section 2 (Type specimen): each of `--font-display-3xl`, `--font-display-2xl`, `--font-display-xl`, `--font-h1`, `--font-h2`, `--font-h3`, `--font-body-lg`, `--font-body`, `--font-body-sm`, `--font-micro` rendered with sample text + the clamp() literal in a Geist caption. At least two of the display lines show italic Cormorant Garamond (the personality cut DESIGN.md §3 calls for). One micro label sample is uppercase tracking 0.05em.
- Section 3 (Spacing ruler): 10 horizontal bars from `--space-1` to `--space-32`, each labeled with the rem and px value. Visually the proportional rhythm reads as 8px-grid.
- Section 4 (Motion preview): three cards labeled "Fast (150ms)", "Base (250ms)", "Slow (400ms)". Each card has a `transform: translateY` hover transition using the matching duration and `--ease-out-expo`. Below the row, a smaller card notes "Hovering on a `prefers-reduced-motion: reduce` system shows no motion" — verified by the global media query already in tokens.css. No bounce / spring / scale-pop motion (banned per DESIGN.md §7).
- Section 5 (Shadow samples): three rectangular cards stacked or in a row, each carrying `box-shadow: var(--shadow-1)` / `--shadow-2` / `--shadow-3`, labeled "Hover elevation", "Card in motion", "Overlay". The shadows visibly differ in spread + softness; their hue is warm (tinted toward gold) not gray.
- The page is keyboard-navigable — focusable swatches have a visible `:focus-visible` ring using `--accent` per design-laws §6 / design-product.md state requirements. Or, if swatches are non-interactive, the page contains zero `outline: none` rules.
- The page is responsive: at 375px (iPhone SE) every section reflows to a single column, type still reads, the spacing ruler scales. At 1440px the layout uses generous margins (`var(--page-px)` for horizontal padding).
- The route is NOT linked in `Navbar.tsx`, `Footer.tsx`, or any sitemap entry. `grep -r "_design" src/components/layout/` returns zero matches.
- `grep -r "_design" src/app/sitemap.ts` returns zero matches (or sitemap.ts is unchanged from main).

**Action:**
1. Create directory: `mkdir -p src/app/_design`.
2. Create `src/app/_design/page.tsx` as a React server component. Export a `DesignShowcasePage` default. The file should be ~250-400 LOC total — all five sections inline (no extracted primitives in this phase; primitives are M2 — but inline JSX is fine because the showcase is the consumer of the tokens, not a producer of components).
3. The page itself uses semantic Tailwind classes built in Task 3 — `bg-bg text-fg`, `font-display`, `font-body`, `font-micro`. Page wrapper: `<main className="bg-bg text-fg min-h-screen" style={{ padding: 'var(--page-py) var(--page-px)' }}>`.
4. **Section 1** — Swatch grid: build a 2D array of `{ name, cssVar, oklch }` tuples covering every role enumerated in Acceptance Criteria. Render with CSS grid (`grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))`). Each swatch is `<div style={{ background: 'var(--accent)' }} className="aspect-square">` plus a caption beneath. Use `font-micro` uppercase tracking-[0.05em] for the captions.
5. **Section 2** — Type specimen: render lines of dummy text (use a real perfume-related phrase, not Lorem ipsum — e.g. "Reading a perfume's page felt like opening a letter" — pulls from PRODUCT.md differentiation). Each line has its `font-size` set inline to `var(--font-display-3xl)`, etc. Show two display lines in italic (`font-style: italic`). Use the literal "1 / line-height 1.05" tight-leading on display.
6. **Section 3** — Spacing ruler: map over `['space-1', 'space-2', 'space-3', 'space-4', 'space-6', 'space-8', 'space-12', 'space-16', 'space-24', 'space-32']`, render `<div style={{ width: \`var(--${s})\`, height: '24px', background: 'var(--accent)' }} />` with a caption row.
7. **Section 4** — Motion preview: three cards with `<button type="button" aria-label="Fast motion sample">` (focusable). On hover, the card translates `Y` by `-8px` with `transition: transform var(--duration-fast) var(--ease-out-expo)` (and the base/slow variants). The reduced-motion notice is just a `<p>` — the global media query in tokens.css handles enforcement.
8. **Section 5** — Shadow samples: three cards each with `style={{ boxShadow: 'var(--shadow-1)' }}` etc., on `bg-bg-alt` so the shadow has surface to read against.
9. Add a `<title>` via Next.js metadata export at the bottom of the file: `export const metadata = { title: "Design System — Aquad'or v3.0 (internal)", robots: { index: false, follow: false } };` — keep it out of search engines.
10. Run `npm run dev` and visit `http://localhost:3000/_design`. Eyeball every section against DESIGN.md §2/§3/§4/§6/§7 — colors, type, spacing, motion, shadows. The captions should make the rendering self-documenting.
11. Confirm the route is NOT crawlable: `grep -r "_design" src/components/` and `grep "_design" src/app/sitemap.ts` both return nothing.

**Validation:**
- `test -f src/app/_design/page.tsx && echo EXISTS` → `EXISTS`
- `grep -c "var(--accent)" src/app/_design/page.tsx` → ≥ 3 (palette is consumed)
- `grep -c "var(--font-display" src/app/_design/page.tsx` → ≥ 2 (type scale is consumed)
- `grep -c "var(--space-" src/app/_design/page.tsx` → ≥ 5 (spacing is consumed)
- `grep -c "var(--shadow-" src/app/_design/page.tsx` → ≥ 3 (shadows are consumed)
- `grep -c "var(--duration-" src/app/_design/page.tsx` → ≥ 3 (motion durations are consumed)
- `grep -rE "_design" src/components/layout/ ; echo "exit=$?"` → `exit=1` (no nav links into the showcase)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `0`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/_design` (after `npm run dev` is running) → `200`
- Manual visual check at 375px and 1440px viewport widths — both must reflow correctly and read clearly.

**Context:** Read @.planning/DESIGN.md (entire — this page renders the spec), @src/styles/tokens.css (every token consumed here — created in Task 1), @.planning/PRODUCT.md (voice, copy samples — pull the differentiation line into the specimen), @/home/qualia/.claude/qualia-design/design-laws.md §5 + §6 (layout + motion rules).

**Design:**
- Register: product (the showcase serves internal-tool use — design system reference, Linear-bar fluency)
- Tokens used: every CSS var from tokens.css — `--bg`, `--bg-alt`, `--fg`, `--fg-muted`, `--accent`, `--accent-deep`, `--critical`, `--border`, `--border-strong`, all `--color-neutral-*`, all `--font-*`, all `--space-*`, all `--shadow-*`, all `--duration-*`, all `--ease-*`, `--page-px`, `--page-py`
- Scope: page (single showcase route)
- Anti-pattern guard: `bash scripts/design-laws-check.sh src/app/_design/page.tsx` (the script from Task 5) must exit 0. Specifically: no `#000`/`#fff`, no `rgb()`, no banned fonts, no `outline: none`, no border-radius > 16px, no animation duration > 1000ms.

---

## Task 5 — `scripts/design-laws-check.sh` — anti-pattern grep wired into lint
**Wave:** 1
**Persona:** frontend
**Files:**
- `scripts/design-laws-check.sh` (NEW — executable bash. Greps the codebase (default: `src/`) for DESIGN.md §10 banned patterns: raw hex outside `tokens.css`, `rgb()`/`rgba()` literals in NEW files, banned font names in CSS / TSX, `border-radius` declarations > 16px, animation durations > 1000ms, `outline: none` without an accompanying `outline:` reset. Each violation prints `<file>:<line> — <pattern> — <severity>` and the script exits non-zero on any CRITICAL-severity match. Tolerates legacy files via an opt-in `--strict` flag and an `.designlawsignore` ledger of pre-existing legacy offenders.)
- `.designlawsignore` (NEW — newline-separated list of file globs that are EXEMPT from the strictest checks for this phase. Pre-seed with the legacy CSS files known to contain `rgba(212, 175, 55, ...)` literals — to be cleared in M2: `src/app/globals.css`, `src/components/cart/**`, `src/components/layout/**`. Future phases can shorten this list.)
- `package.json` (MODIFY — add a script entry: `"lint:design": "bash scripts/design-laws-check.sh"` and chain it into the existing `lint` script: change `"lint": "next lint"` to `"lint": "next lint && npm run lint:design"`.)

**Depends on:** none

**Why:** DESIGN.md §10 explicitly states "A short shell-script lives in `scripts/design-laws-check.sh` ... wired into pre-commit via lint task." Without the script, every later phase relies on memory + manual review to avoid regressions, and AI-generated component code (M2/M3) defaults to slop patterns (raw hex, rgba shadows, `rgb()`, `system-ui` fallback). The script is the *enforcement* arm of the tokens — tokens.css gives us the right values, the script blocks the wrong ones. Wiring it into `npm run lint` ensures it runs in the same gate the deployment pipeline already enforces, no new infra needed.

**Acceptance Criteria:**
- `scripts/design-laws-check.sh` exists, is executable (`chmod +x`), and starts with `#!/usr/bin/env bash` + `set -euo pipefail`.
- Running `bash scripts/design-laws-check.sh src/app/_design/page.tsx` exits 0 (the showcase from Task 4 is clean).
- Running `bash scripts/design-laws-check.sh src/styles/tokens.css` exits 0.
- Running `bash scripts/design-laws-check.sh tailwind.config.ts` exits 0 (post-Task-3 the config has no banned literals).
- Running it on a deliberately-bad string (e.g. a temporary test file containing `color: #000000;` + `font-family: Inter;`) exits non-zero and prints both findings with `file:line` evidence.
- `.designlawsignore` exists and lists `src/app/globals.css` plus the layout/cart component dirs (legacy offenders catalogued, NOT deleted — clearing them is M2's job per phase risk envelope).
- `package.json` `scripts.lint` runs `next lint && npm run lint:design`. `npm run lint` exits 0 against the current codebase (legacy offenders are ignored via `.designlawsignore`).
- The script's check list covers, AT MINIMUM, these DESIGN.md §10 patterns:
  1. Raw hex (`#[0-9a-fA-F]{3,8}`) in `.css`/`.tsx`/`.ts` files NOT listed in `.designlawsignore`
  2. `rgb(` or `rgba(` literals (same scope)
  3. Banned `font-family:` values — Inter, Playfair, Poppins, Arial, Helvetica, Roboto, system-ui (when used as primary not fallback), Space Grotesk, Lato, Open Sans, Montserrat
  4. `border-radius: [17-9]\d*px|[2-9]\d+px|[0-9]+rem` where rem > 1 (cap is 16px = 1rem)
  5. `transition-duration` or `animation-duration` with literal > 1000ms or > 1s
  6. `outline: none` without an accompanying replacement (focus-visible ring)

**Action:**
1. Create `scripts/design-laws-check.sh`. Use `grep -rnE` for each pattern. Read `.designlawsignore` line by line, build a `--exclude-dir` / `--exclude` argument list, and apply it to every grep. Each finding gets severity: CRITICAL for banned fonts and raw `#000`/`#fff`, HIGH for raw hex / `rgb()` / `rgba()` in non-legacy files, MEDIUM for radius / duration overages, LOW for `outline: none`. Exit non-zero if any CRITICAL OR HIGH finding is in a non-ignored path. Print a summary footer counting findings by severity.
2. Accept an optional positional arg: `bash scripts/design-laws-check.sh [path]` — if provided, scope the scan to that path; otherwise scan `src/`.
3. Accept a `--strict` flag — when passed, ignore `.designlawsignore` (used by M2 to verify a file is fully cleaned before removing it from the ignore list).
4. `chmod +x scripts/design-laws-check.sh`.
5. Create `.designlawsignore` at the repo root with the following initial entries (each is a path that the script's grep will skip via `--exclude` / `--exclude-dir`):
   ```
   src/app/globals.css
   src/components/cart
   src/components/layout
   src/components/sections
   src/components/blog
   src/components/ui
   src/components/ai
   src/components/perfume
   src/components/admin
   src/components/providers
   src/components/visitor
   src/components/analytics
   src/app/blog
   src/app/admin
   src/app/create-perfume
   src/app/shop
   src/app/account
   src/app/product
   src/app/contact
   src/app/about
   src/app/page.tsx
   ```
   This explicitly catalogues every existing TSX dir as legacy — the script's job in M1 is to keep NEW code (Task 4's `_design/`, future M2 primitives) clean, while the old code is migrated incrementally in M2/M3. The ignore-list is the contract: "by M2 close, this list is empty."
6. Open `package.json`. Add `"lint:design": "bash scripts/design-laws-check.sh"` to the `scripts` block. Modify the existing `"lint": "next lint"` line to `"lint": "next lint && npm run lint:design"`.
7. Run `npm run lint` — must exit 0 against the current tree (legacy CSS is ignored, the only NEW files Task 1 + 2 + 3 + 4 produced should be clean).
8. Verify the script trips correctly on a bad file: `echo 'color: #000000;' > /tmp/bad.css && bash scripts/design-laws-check.sh /tmp/bad.css ; echo "exit=$?"` → should print a CRITICAL finding and exit non-zero. (Clean up `/tmp/bad.css` after.)

**Validation:**
- `test -x scripts/design-laws-check.sh && echo EXISTS` → `EXISTS`
- `test -f .designlawsignore && echo EXISTS` → `EXISTS`
- `bash scripts/design-laws-check.sh src/styles/tokens.css ; echo "exit=$?"` → `exit=0`
- `bash scripts/design-laws-check.sh src/app/_design/page.tsx ; echo "exit=$?"` → `exit=0`
- `bash scripts/design-laws-check.sh tailwind.config.ts ; echo "exit=$?"` → `exit=0`
- `grep -c "lint:design" package.json` → 1
- `grep "\"lint\":" package.json` → contains `next lint && npm run lint:design`
- `npm run lint 2>&1 | tail -3` → exits 0 with no design-law violations (legacy ignored)
- Trip test: `printf 'body { color: #000; font-family: Inter; }\n' > /tmp/bad.css && bash scripts/design-laws-check.sh /tmp/bad.css ; echo "exit=$?"; rm -f /tmp/bad.css` → exit non-zero, both findings printed

**Context:** Read @.planning/DESIGN.md §10 (anti-pattern checklist — the script's complete spec), @/home/qualia/.claude/qualia-design/design-laws.md §8 (absolute bans, severity guidance), @package.json scripts block (the `lint` script you're chaining into).

**Design:**
- Register: product (tooling script — no UI surface, serves engineering workflow)
- Tokens used: none (the script ENFORCES tokens; it doesn't render anything)
- Scope: app (script governs the whole tree)
- Anti-pattern guard: the script IS the guard. Self-check: run it on itself (`bash scripts/design-laws-check.sh scripts/design-laws-check.sh`) — must exit 0 (no banned patterns in a bash script that contains the patterns as regex strings; quote-escape them so the script doesn't trip on its own regex literals — `'#[0-9a-fA-F]'` not `"#[0-9a-fA-F]"`).

---

## Success Criteria
(Verbatim from Phase 1 of ROADMAP.md — Phase 1 is DONE when every box is checked.)

<!-- DESIGN-01 is pre-committed; verified by the phase-level contract (DESIGN.md file-exists + grep check). -->

- [ ] `.planning/DESIGN.md` exists with §1 commits (already committed pre-Phase-1; verify the file is at HEAD and contains §1 "Direction (the commit)" with `editorial-luxury, Levant-coded` direction sentence + scene sentence + differentiation sentence)
- [ ] `src/styles/tokens.css` exposes the full OKLCH palette + spacing scale + motion + shadow tokens as CSS custom properties (ported verbatim from DESIGN.md §2/§4/§6/§7)
- [ ] Display + body type pair loaded via `next/font` in `src/app/layout.tsx`; both distinctive (NOT Inter / Playfair / Poppins / system-ui). Loaded fonts: Cormorant Garamond (display, `--font-display`), Newsreader (body, `--font-body`), Geist (micro, `--font-micro`)
- [ ] Tokens validated against `qualia-design/design-laws.md` §8 absolute bans (no raw `#000`/`#fff` in tokens.css or tailwind.config.ts, no `rgb()`, no banned fonts, no banned-shadow forms)
- [ ] One demo route `src/app/_design/page.tsx` (preview only, NOT linked in production nav) renders a swatch grid + type specimen + spacing ruler (+ motion preview + shadow elevation samples)
- [ ] `npm run lint` exits 0 (including the new `lint:design` step) — the substrate is enforceable, not just declared
- [ ] `npm run build` exits 0 — the live site continues to build with the new tokens active and legacy aliases routing old class names to new values
- [ ] Existing pages (homepage `/`, shop `/shop`, blog `/blog`, PDP `/product/[slug]`) still render without console errors and visually reflect the new palette (warm bone surfaces + restrained aged-gold accent + Cormorant Garamond headings)

---

## Verification Contract

### Contract for Task 1 — tokens.css exists
**Check type:** file-exists
**Command:** `test -f src/styles/tokens.css && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File does not exist

### Contract for Task 1 — tokens.css contains the full OKLCH palette
**Check type:** grep-match
**Command:** `grep -c "oklch(" src/styles/tokens.css`
**Expected:** ≥ 25
**Fail if:** Fewer than 25 OKLCH literals — the DESIGN.md §2 palette has 20+ anchor + neutral entries; <25 means truncation

### Contract for Task 1 — tokens.css contains zero banned literals
**Check type:** command-exit
**Command:** `grep -E '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(' src/styles/tokens.css ; echo "exit=$?"`
**Expected:** `exit=1`
**Fail if:** Any hex / rgb / rgba / hsl literal exists in tokens.css

### Contract for Task 1 — tokens.css wired into globals.css
**Check type:** grep-match
**Command:** `grep -c "@import \"../styles/tokens.css\"" src/app/globals.css`
**Expected:** `1`
**Fail if:** tokens.css is not imported by globals.css — the runtime won't see the tokens

### Contract for Task 1 — every required semantic role token present
**Check type:** command-exit
**Command:** `for v in --bg --bg-alt --fg --fg-muted --accent --accent-deep --critical --border --border-strong --shadow-1 --shadow-2 --shadow-3 --duration-fast --duration-base --duration-slow --ease-out-quart --ease-out-expo --space-4 --space-8 --container-narrow --container-prose --page-px --page-py; do grep -q -- "$v" src/styles/tokens.css || { echo "MISSING: $v"; exit 1; }; done && echo OK`
**Expected:** `OK`
**Fail if:** Any required token name is missing from tokens.css

### Contract for Task 2 — banned fonts removed from layout.tsx
**Check type:** command-exit
**Command:** `grep -E "Playfair_Display|Poppins" src/app/layout.tsx ; echo "exit=$?"`
**Expected:** `exit=1`
**Fail if:** Playfair_Display or Poppins still imported

### Contract for Task 2 — new fonts loaded
**Check type:** grep-match
**Command:** `grep -cE "Cormorant_Garamond|Newsreader|Geist" src/app/layout.tsx`
**Expected:** ≥ 3
**Fail if:** Any of the three fonts is not imported

### Contract for Task 2 — font CSS variables wired
**Check type:** grep-match
**Command:** `grep -cE -- "--font-display|--font-body|--font-micro" src/app/layout.tsx`
**Expected:** ≥ 3
**Fail if:** The three font variable names are not present (one per font)

### Contract for Task 2 — legacy font aliases present in tokens.css (don't break old components)
**Check type:** grep-match
**Command:** `grep -c -- "--font-playfair: var(--font-display)" src/styles/tokens.css`
**Expected:** `1`
**Fail if:** Legacy alias missing — every component reading `var(--font-playfair)` will fall through to system serif

### Contract for Task 3 — tailwind.config.ts contains zero hex/rgba
**Check type:** command-exit
**Command:** `grep -E '#[0-9a-fA-F]{3,8}|rgba?\(' tailwind.config.ts ; echo "exit=$?"`
**Expected:** `exit=1`
**Fail if:** Any hex or rgba literal in the Tailwind config

### Contract for Task 3 — semantic tokens exposed in Tailwind
**Check type:** command-exit
**Command:** `for token in 'var(--bg)' 'var(--fg)' 'var(--accent)' 'var(--border)' 'var(--font-display)' 'var(--font-body)' 'var(--font-micro)'; do grep -q -- "$token" tailwind.config.ts || { echo "MISSING: $token"; exit 1; }; done && echo OK`
**Expected:** `OK`
**Fail if:** Any semantic token name is missing — legacy class compilation will fail or resolve to undefined

### Contract for Task 3 — legacy aliases preserved
**Check type:** grep-match
**Command:** `grep -cE "^[[:space:]]*gold:|^[[:space:]]*dark:|playfair:|poppins:" tailwind.config.ts`
**Expected:** ≥ 4
**Fail if:** Any of the legacy entries (gold, dark, playfair, poppins) is missing — existing pages break

### Contract for Task 3 — build still succeeds
**Check type:** command-exit
**Command:** `npm run build 2>&1 | tail -1`
**Expected:** Exit code 0 (the last line typically reads something like `○  /  Static  …` or the build summary; non-zero exit indicates failure)
**Fail if:** Build errors with Tailwind class not found, CSS import error, or font loading failure

### Contract for Task 4 — showcase page exists
**Check type:** file-exists
**Command:** `test -f src/app/_design/page.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** File missing

### Contract for Task 4 — showcase consumes every token family
**Check type:** command-exit
**Command:** `for v in 'var(--accent)' 'var(--font-display' 'var(--space-' 'var(--shadow-' 'var(--duration-'; do c=$(grep -c -- "$v" src/app/_design/page.tsx); test "$c" -ge 1 || { echo "MISSING: $v"; exit 1; }; done && echo OK`
**Expected:** `OK`
**Fail if:** Any token family (palette, typography, spacing, shadow, motion) is not consumed by the showcase

### Contract for Task 4 — route NOT linked in production nav
**Check type:** command-exit
**Command:** `grep -rE "_design" src/components/layout/ ; echo "exit=$?"`
**Expected:** `exit=1`
**Fail if:** The showcase route is linked from Navbar, Footer, or any layout component — it must remain a preview-only route

### Contract for Task 4 — route returns 200 in dev
**Check type:** behavioral
**Command:** Verifier runs `npm run dev` in a background shell, waits for the server to come up, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/_design`
**Expected:** `200`
**Fail if:** 404, 500, or compile error — the showcase doesn't render

### Contract for Task 4 — visual reflow at 375px (mobile)
**Check type:** behavioral
**Command:** Verifier opens `http://localhost:3000/_design` in Chrome DevTools device emulation set to iPhone SE (375px). Visually confirms: swatch grid reflows to 2-3 columns, type specimen lines wrap cleanly without horizontal scroll, spacing ruler readable, motion cards stack vertically.
**Expected:** All five sections legible and scroll-correct at 375px
**Fail if:** Any section overflows horizontally or becomes unreadable

### Contract for Task 5 — script exists and is executable
**Check type:** command-exit
**Command:** `test -x scripts/design-laws-check.sh && echo OK`
**Expected:** `OK`
**Fail if:** Missing or not executable

### Contract for Task 5 — script passes on clean v3.0 files
**Check type:** command-exit
**Command:** `bash scripts/design-laws-check.sh src/styles/tokens.css src/app/_design/page.tsx tailwind.config.ts ; echo "exit=$?"`
**Expected:** `exit=0`
**Fail if:** Script reports a CRITICAL/HIGH finding in any of the three v3.0 files — the substrate isn't clean

### Contract for Task 5 — script trips on banned patterns
**Check type:** command-exit
**Command:** `printf 'body { color: #000000; font-family: Inter; }\n' > /tmp/qualia-bad.css && bash scripts/design-laws-check.sh /tmp/qualia-bad.css ; rc=$?; rm -f /tmp/qualia-bad.css; echo "exit=$rc"`
**Expected:** `exit=` non-zero (script must exit with a non-zero code when banned patterns are present)
**Fail if:** `exit=0` — the script silently passed a known-bad file, meaning it won't catch future regressions

### Contract for Task 5 — lint wires in the design-laws check
**Check type:** grep-match
**Command:** `grep -cE "lint:design.*design-laws-check.sh|lint.*lint:design" package.json`
**Expected:** ≥ 2 (both the `lint:design` script entry AND the chained `lint` script must be present)
**Fail if:** Either entry is missing — design laws aren't enforced by `npm run lint`

### Contract for Task 5 — full lint exits 0 against the tree
**Check type:** command-exit
**Command:** `npm run lint 2>&1 | tail -3`
**Expected:** Exit code 0
**Fail if:** Either `next lint` or `lint:design` fails — legacy offenders must be in `.designlawsignore`, new v3.0 files must be clean

### Contract for Phase — DESIGN.md committed and intact
**Check type:** command-exit
**Command:** `test -f .planning/DESIGN.md && grep -q "editorial-luxury, Levant-coded" .planning/DESIGN.md && grep -q "Reading a perfume's page felt like opening a letter" .planning/DESIGN.md && echo OK`
**Expected:** `OK`
**Fail if:** DESIGN.md is missing the direction commit or the differentiation sentence — the locked decisions aren't in the repo

### Contract for Phase — existing pages still render (regression smoke)
**Check type:** behavioral
**Command:** Verifier runs `npm run dev` and visits `/`, `/shop`, `/blog`, and one product PDP. Each must return 200, render content, and show zero red console errors. Visual: gold accents read as restrained aged-gold (not the previous neon `#FFD700`), surfaces are warm bone (not pure `#FAFAF8`), headings clearly use Cormorant Garamond.
**Expected:** All four routes load, no console errors, palette + typography visibly v3.0
**Fail if:** Any route 500s, has a console error from a missing CSS var, or still renders Playfair / pure-hex gold
