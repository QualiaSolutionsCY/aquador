# Roadmap — Milestone 1: Design Foundation

Full phase detail for the CURRENT milestone. M2..M4 are sketched in `JOURNEY.md` and detailed by `/qualia-milestone` when each opens.

---

## Phase 1.1 · Direction & Tokens

**Goal:** Lock the v3.0 aesthetic direction and ship the design tokens that every later phase depends on.

**Why this first:** Tokens are read by every primitive in 1.3 and every page in M2/M3. Choosing direction last means rework. Direction commit is also the place where slop-detect runs — if we hedge here, the whole redesign slops.

**Success criteria:**
- `.planning/DESIGN.md` exists, §1 commits to ONE direction word (editorial-luxury, Levant-coded), ONE scene sentence, ONE differentiation sentence
- `src/styles/tokens.css` exposes the full OKLCH palette + spacing scale + motion tokens as CSS custom properties
- Display + body type pair loaded via `next/font` in `src/app/layout.tsx`; both distinctive (not Inter / Playfair / Poppins / system-ui)
- Tokens validated against `qualia-design/design-laws.md` §8 absolute bans
- One demo route (e.g. `src/app/_design/page.tsx` — gated or just preview-only) renders a swatch grid + type specimen + spacing ruler

**Requirements covered:** DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04

**Risks / pitfalls:**
- Font licensing — pick fonts the project has rights to use. Google Fonts options that satisfy "distinctive editorial serif": Cormorant Garamond, Cardo, Tenor Sans display, Fraunces. Body: Newsreader, Sorts Mill Goudy, Fanwood, or Geist Mono for ornament accents.
- Brand continuity — Aquad'or's gold should still feel present in OKLCH form, not abandoned.

---

## Phase 1.2 · Stack & Type Unification

**Goal:** Migrate to Next 16 + React 19, consolidate three coexisting product types to one canonical Supabase shape, fix the 24 pre-existing Jest failures.

**Why this before primitives:** Primitives written on React 19 server components are simpler than on React 18 — using new APIs (`use`, `useActionState`, transitions) deliberately. Type unification before primitives means `ProductCard` (a primitive) is single-shape from day one.

**Success criteria:**
- `package.json` has `next@^16`, `react@^19`, `react-dom@^19`, aligned `@types/*`, `eslint@^9`, `eslint-config-next@^16`
- `npm run build` and `npm run lint` exit 0
- `npm test` exits 0 (currently 5 suites / 24 tests failing — must investigate root causes, not skip)
- `npm run test:e2e` passes chromium suite
- `LegacyProduct` type definition and `Product` legacy re-export removed from `src/types/index.ts`
- Codebase grep returns zero results for `LegacyProduct`
- `src/components/ui/ProductCard.tsx` accepts the Supabase `Product` shape only; the `// handle both LegacyProduct (camelCase) and Supabase Product (snake_case)` comment is gone along with the branch
- `src/app/shop/lattafa/page.tsx` no longer transforms Supabase rows into LegacyProduct (line ~31)

**Requirements covered:** STACK-01, STACK-02, STACK-03, TYPE-01, TYPE-02

**Risks / pitfalls:**
- Next 14 → 16 has API removals (font/google import changes, removed legacy router APIs if any are still in use). Audit on a feature branch.
- React 19 stricter on unmounted state updates; some framer-motion patterns may need adjustment.
- Sentry `@sentry/nextjs` must align with Next 16 — check `@sentry/nextjs@^11` or current.
- The 24 failing tests may have outdated DOM expectations (e.g. `Button.test.tsx` searching for `"Loading..."`); fix the test OR the component, not both, and decide which is canonical against DESIGN.md.

---

## Phase 1.3 · Primitive Components

**Goal:** Build the token-driven primitive component library and integrate it into one existing page (smoke test).

**Why this last in M1:** Primitives are the bridge between tokens and pages. Building them before tokens means re-skinning twice; before stack upgrade means rewriting them once.

**Success criteria:**
- Under `src/components/ui/`, these primitives exist and use tokens only (no raw hex, no `text-gold-500` magic strings):
  - **Form:** `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`
  - **Display:** `Card`, `Badge`, `Tag`, `Avatar`, `Tooltip`, `Skeleton`
  - **Overlay:** `Drawer`, `Dialog`, `Tabs`, `Toast`, `Popover`
  - **Data:** `Table` (columns + sort + sticky header)
- Each interactive primitive supports the 7 states: default, hover, focus-visible, active, disabled, loading, error
- Drawer and Dialog implement focus trap + escape-to-close + scrim click + body-scroll-lock
- All primitives keyboard-navigable; pass axe-core via `@axe-core/playwright` (optional dependency add)
- One existing page (suggested: `src/app/admin/page.tsx` or `src/app/products/[slug]/page.tsx`) renders at least 3 primitives in place of its current ad-hoc Tailwind — proves the system integrates
- `src/app/admin/_design/page.tsx` (or a similar non-public route) is a showcase rendering every primitive in every state — becomes the in-repo reference

**Requirements covered:** PRIM-01, PRIM-02, PRIM-03, PRIM-04, PRIM-05

**Risks / pitfalls:**
- Don't reach for Radix / shadcn out of habit — those are fine but evaluate whether their unstyled primitives buy us more than they cost. If using, customize fully; don't ship default shadcn variants (slop-detect).
- The `cn()` helper in `src/lib/utils.ts` doesn't include `tailwind-merge` — if class conflicts become a problem during primitive composition, add it (small dep, well-worth).
- Storybook is NOT required and would slow M1. The `_design` route is the lightweight alternative.

---

## What M1 explicitly does NOT do

- Touch homepage / PDP / shop / cart visual layouts (M2's job — uses M1's primitives)
- Rebuild admin pages (M3's job)
- Add new features
- Migrate Supabase schema
- Replace Stripe / Supabase / Sentry / Resend
- Reach Lighthouse ≥ 90 (M4's job)

## Ready for `/qualia-plan 1`

Phase 1 (Direction & Tokens) is what `/qualia-plan 1` will break down into wave-based tasks for execution by `/qualia-build 1`.
