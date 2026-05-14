---
phase: 3
goal: "Build the token-driven primitive component library (form + display + overlay + data) and prove it by integrating into one existing page (admin dashboard) + a full showcase route."
tasks: 5
waves: 2
---

# Phase 3: Primitive Components

**Goal:** Under `src/components/ui/`, ship 19 token-driven primitives — Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Card, Badge, Tag, Avatar, Tooltip, Skeleton, Drawer, Dialog, Tabs, Toast, Popover, Table — each rendering via OKLCH tokens (no raw hex, no banned fonts), each interactive primitive supporting all 7 states (default / hover / focus-visible / active / disabled / loading / error), each keyboard-navigable. Overlays implement focus-trap + escape + scrim-click + body-scroll-lock. Then prove the library by replacing the ad-hoc Tailwind in `src/app/admin/page.tsx` and building a complete `src/app/admin/_design/page.tsx` showcase route.

**Why this phase:** Phases 1+2 shipped the tokens and the unified types. Without primitives every page hand-rolls Tailwind class soup that drifts from `tokens.css` (the existing `src/components/ui/Button.tsx` uses raw `#D4AF37`-flavored gold classes, `rgba(0,0,0,...)` shadows, and `tracking-[0.12em] uppercase rounded-none` — banned by DESIGN.md §10 anti-patterns). M3 (admin polish) and M4 (storefront rebuild) are blocked until there is one canonical visual vocabulary. This phase delivers that vocabulary and proves it works in one real page.

**Critical context for every task:**
- The visual contract is DESIGN.md §5 (component specs) + §10 (anti-pattern checklist). Read both before writing any component.
- Tokens live in `src/styles/tokens.css` (Phase 1 output). Tailwind semantic classes (`bg-bg`, `bg-bg-alt`, `text-fg`, `text-fg-muted`, `bg-accent`, `bg-accent-deep`, `text-critical`, `border-border`, `border-border-strong`, `shadow-1/2/3`) resolve to `var(--*)` via `tailwind.config.ts` (Phase 1 output). Use those classes. **Never** write `text-gold`, `bg-gold/10`, `#D4AF37`, `bg-gray-900`, `text-gray-400`, `rgba(...)`, `shadow-[0_2px_16px_rgba(212,175,55,0.15)]`, or any raw hex in component code.
- Fonts: display = Cormorant Garamond, body = Newsreader, micro = Geist (loaded as CSS variables by `next/font` in Phase 1). Banned: Inter, Playfair, Poppins, Arial, Helvetica, Roboto, system-ui.
- Existing `src/components/ui/Button.tsx`, `src/components/ui/Card.tsx`, and `src/components/ui/Skeleton.tsx` are v2.x artifacts using banned tokens. They are **overwritten in place** by this phase — not extended. Treat the existing file's API surface as advisory, not binding.
- `cn()` in `src/lib/utils.ts` uses `clsx` only (no `tailwind-merge`). If a primitive needs conflict resolution between caller `className` and internal classes, add `tailwind-merge` as a dependency (`npm install tailwind-merge`) and update `cn()` to wrap `clsx` output with `twMerge(...)`. This is allowed and documented per phase-context locked decisions.
- Radix UI primitives (`@radix-ui/react-*`) are allowed as **unstyled bases** for primitives that require focus management or portals (Dialog, Drawer-as-Dialog, Popover, Tooltip, Tabs, Switch, Checkbox, Radio, Select). Install with `npm install @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-tabs @radix-ui/react-switch @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-avatar`. Wrap each Radix root with custom-styled wrappers — **never render a default shadcn/Radix variant unstyled**. The visible styling is project-specific tokens.
- Every primitive ≤ ~80 LOC. If you need more, split with compound-component pattern (e.g. `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`).
- Density target (from PRODUCT.md → design-product.md): **Standard** (Stripe/Vercel level). Body 14-15px in tables/forms, hierarchy through weight more than size.
- Tabular numerals (`font-feature-settings: "tnum" 1`) on every numeric column.
- Motion: hover 150ms, panel slide 250ms, scrim fade 250ms, ease-out-quart. Respect `prefers-reduced-motion`.
- **Barrel file (`src/components/ui/index.ts`) policy:** to avoid parallel write-conflicts across Wave 1 tasks, the barrel is touched ONLY in Task 1 (creates it empty/stub) and Task 5 (populates with the full 19-primitive export list). Tasks 2, 3, and 4 do NOT modify `index.ts` — they ship their primitive files and let Task 5 wire the barrel once.

---

## Task 1 — Form primitives (Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch)
**Wave:** 1
**Persona:** frontend
**Files:**
- `src/components/ui/Button.tsx` (overwrite — exports `Button` + `buttonVariants`; variants: `primary | secondary | ghost | destructive`; sizes: `sm | md | lg`)
- `src/components/ui/IconButton.tsx` (create — exports `IconButton`; variants: `primary | secondary | ghost`; sizes: `sm | md | lg`; requires `aria-label` prop)
- `src/components/ui/Input.tsx` (create — exports `Input`; supports `error?: string`, `leadingIcon?`, `trailingIcon?`)
- `src/components/ui/Textarea.tsx` (create — exports `Textarea`; supports `error?: string`, `rows`)
- `src/components/ui/Select.tsx` (create — exports `Select`, `SelectItem`; wraps `@radix-ui/react-select`)
- `src/components/ui/Checkbox.tsx` (create — exports `Checkbox`; wraps `@radix-ui/react-checkbox`; supports `indeterminate`)
- `src/components/ui/Radio.tsx` (create — exports `RadioGroup`, `RadioItem`; wraps `@radix-ui/react-radio-group`)
- `src/components/ui/Switch.tsx` (create — exports `Switch`; wraps `@radix-ui/react-switch`)
- `src/components/ui/index.ts` (create — **empty stub only**: a file that exists with comment placeholders for each task family but no exports yet; Task 5 is the only task that populates it with named exports. Stub content: 4 commented marker lines `// task-1 form`, `// task-2 display`, `// task-3 overlay`, `// task-4 data`)
- `src/lib/utils.ts` (modify — wrap `cn` with `twMerge` if class conflicts arise; install `tailwind-merge` first)
- `package.json` + `package-lock.json` (modify — add `@radix-ui/react-select`, `@radix-ui/react-checkbox`, `@radix-ui/react-radio-group`, `@radix-ui/react-switch`, `tailwind-merge`)

**Depends on:** none

**Why:** Form inputs are the primary interactive surface in the admin (covers PRIM-01: form primitives token-driven with 7 states). The current Button uses banned `#D4AF37`-style hex via the gold Tailwind classes and `rgba(0,0,0,...)` shadows — a slop-detect failure on every render. Replacing it now unblocks every form in M3 + M4. Locked decision: hand-rolled where keyboard-default works (Button, IconButton, Input, Textarea) and Radix-wrapped where focus/ARIA management is non-trivial (Select, Checkbox, Radio, Switch). All 8 primitives must support the 7 states explicitly.

**Acceptance Criteria:**
- All 8 files exist under `src/components/ui/` and export named React components (default export forbidden — barrel re-exports require named).
- `Button` renders 4 variants × 3 sizes via Tailwind semantic classes only (`bg-accent`, `bg-accent-deep`, `bg-bg-alt`, `text-fg`, `text-critical`, `border-border-strong`, `shadow-1`, `rounded-sm`). No raw hex, no `text-gold`, no `rgba(...)`, no `font-family` strings.
- Button micro label: Geist via `var(--font-geist)`, uppercase, `tracking-[0.05em]`, `text-[12px]`, `min-h-11` (44px touch target), `rounded-sm` (4px from `--radius-sm`), `shadow-1` on hover ONLY, transition 150ms ease-out-quart.
- Every interactive primitive renders all 7 states observable in the showcase route (Task 5): default, hover (CSS `:hover`), focus-visible (2px `--accent` ring offset 2px via `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`), active (CSS `:active`), disabled (`opacity-50`, `cursor-not-allowed`, `aria-disabled="true"`, `pointer-events-none`), loading (inline `Loader2` icon from `lucide-react` spinning, button content slot-replaced, `aria-busy="true"`), error (inputs only: 2px `--critical` ring + `aria-invalid="true"` + `aria-describedby` to error text).
- Input/Textarea: 1px `border-border-strong`, `rounded-[8px]` (NOT `rounded-md` magic — explicit), Newsreader body via `var(--font-newsreader)`, `text-[15px]`, `py-3 px-4` (12px vertical from `--space-3`, 16px horizontal from `--space-4`). Visible label rendered above (placeholder-only inputs are banned per design-product.md → Inputs row). Error message rendered below with `id` referenced by `aria-describedby`.
- Checkbox supports `indeterminate` prop (uses Radix `CheckboxPrimitive.Indicator` + `data-state="indeterminate"`).
- Switch: 28px × 16px track, 12px thumb, accent-fill when checked, neutral-200 fill when unchecked, 150ms thumb transition (animate `transform: translateX(...)`, NEVER `left`/`margin`).
- Select renders the Radix portal with `bg-bg-alt`, `border-border`, `shadow-2`, `rounded-sm`, item hover `bg-bg`, active item `bg-accent/12` (use `bg-accent/12` not `rgba`).
- Every primitive forwards `ref` via `React.forwardRef` and accepts `className` prop (callers can extend; `cn(twMerge(...))` resolves conflicts).
- All primitives are keyboard-navigable: Button/IconButton activate on Space/Enter; Input/Textarea native; Select opens with Space/Enter, navigates with arrows, closes with Esc (Radix default); Checkbox/Switch toggle on Space; RadioGroup navigates with arrows.
- `src/components/ui/index.ts` exists as an empty stub file containing only the four marker comments — NO `export` statements yet (Task 5 fills them).
- `tsc --noEmit` exits 0 across the touched files.

**Action:**
1. Run `npm install tailwind-merge @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-radio-group @radix-ui/react-switch` (the Avatar/Dialog/Popover/Tooltip/Tabs packages are also needed and may be installed here for efficiency — they belong to Tasks 2-3 but a single install batch reduces lockfile churn). Confirm `package-lock.json` updates only; no other deps removed.
2. Update `src/lib/utils.ts`: import `twMerge` from `tailwind-merge` and wrap the existing `cn` body: `return twMerge(clsx(inputs));`. Keep the existing exports intact.
3. **Overwrite** `src/components/ui/Button.tsx` (existing v2 file uses banned `#D4AF37`-flavored tokens — replace entirely). New shape:
   - `'use client'` directive only if `framer-motion` is used; prefer no framer-motion in primitives — use CSS transitions for hover/active (160 LOC of framer is excessive for a button). The existing Button's framer-motion usage is REMOVED. CSS `:hover` + `transition-shadow duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]` (or via a custom Tailwind `transition-out-quart` utility from Phase 1) replaces it.
   - Export named: `export function Button(...)` AND `export const buttonVariants = ...` (latter is a `cva`-style record so other primitives like IconButton can reuse — implement as a plain object map, not the `class-variance-authority` package).
   - `forwardRef<HTMLButtonElement, ButtonProps>`.
   - Props: `variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'`, `size?: 'sm' | 'md' | 'lg'`, `isLoading?: boolean`, `leadingIcon?: ReactNode`, `trailingIcon?: ReactNode`, plus all `ButtonHTMLAttributes<HTMLButtonElement>`.
   - When `isLoading`, render `<Loader2 className="animate-spin" />` from `lucide-react` with stroke-width 1.5, replace children, set `aria-busy="true"`, set `disabled` (so click events don't fire).
   - Variant class map (no raw hex, no Tailwind palette colors):
     - `primary`: `bg-accent text-bg hover:bg-accent-deep hover:shadow-1`
     - `secondary`: `bg-bg-alt text-fg border border-border hover:border-border-strong`
     - `ghost`: `bg-transparent text-fg hover:bg-bg-alt`
     - `destructive`: `bg-critical text-bg hover:opacity-90`
   - Size class map:
     - `sm`: `px-4 py-2 min-h-9 text-[11px]`
     - `md`: `px-6 py-3 min-h-11 text-[12px]`
     - `lg`: `px-8 py-4 min-h-12 text-[13px]`
   - Common: `inline-flex items-center justify-center gap-2 font-medium uppercase tracking-[0.05em] rounded-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none font-[var(--font-geist)]`
4. Create `src/components/ui/IconButton.tsx` — square variant of Button. Sizes: `sm = 36×36`, `md = 44×44`, `lg = 52×52`. **Requires** `aria-label` prop (TypeScript-enforced: `interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> { 'aria-label': string; icon: ReactNode; ... }`). Renders icon centered. Same variant classes as Button.
5. Create `src/components/ui/Input.tsx`:
   - Props: `label: string` (required, rendered as `<label htmlFor={id}>` above), `error?: string`, `hint?: string`, `leadingIcon?`, `trailingIcon?`, plus `InputHTMLAttributes<HTMLInputElement>`.
   - Generate `id` via `useId()` if not provided.
   - Wrapper `<div className="flex flex-col gap-2">`, label `text-[12px] uppercase tracking-[0.05em] text-fg-muted font-[var(--font-geist)]`, input `w-full bg-bg border border-border-strong rounded-[8px] py-3 px-4 text-[15px] font-[var(--font-newsreader)] text-fg placeholder:text-fg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-shadow duration-150 disabled:opacity-50 disabled:cursor-not-allowed aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-critical`.
   - Error rendered as `<p id={`${id}-error`} className="text-[12px] text-critical mt-1">{error}</p>` and input gets `aria-invalid="true" aria-describedby={`${id}-error`}`.
6. Create `src/components/ui/Textarea.tsx` — same surface contract as Input, default `rows=4`, `resize-y`.
7. Create `src/components/ui/Select.tsx` — wrap `@radix-ui/react-select`. Compound: `Select.Root`, `Select.Trigger`, `Select.Value`, `Select.Content`, `Select.Item`. Trigger styling matches Input (same border, padding, focus ring). Content portal: `bg-bg-alt border border-border rounded-sm shadow-2 overflow-hidden`, items `px-4 py-2 text-[14px] data-[highlighted]:bg-bg data-[state=checked]:bg-accent/12 cursor-pointer outline-none`. Use `ChevronDown` from `lucide-react` stroke-width 1.5 as trigger icon, `Check` as item-checked icon.
8. Create `src/components/ui/Checkbox.tsx` — wrap `@radix-ui/react-checkbox`. 16×16 box, 1px `border-border-strong`, `rounded-[2px]`, checked = `bg-accent border-accent`, indicator = `Check` icon 12px stroke-width 2 in `text-bg`. Indeterminate = `Minus` icon. Always paired with adjacent `<label>` via `htmlFor`.
9. Create `src/components/ui/Radio.tsx` — wrap `@radix-ui/react-radio-group`. Compound: `RadioGroup`, `RadioItem`. Item: 16×16 circle, `rounded-full border border-border-strong`, checked = inner 8px dot `bg-accent`.
10. Create `src/components/ui/Switch.tsx` — wrap `@radix-ui/react-switch`. Track 28×16 `rounded-full bg-border-strong data-[state=checked]:bg-accent transition-colors duration-150`, thumb 12×12 `bg-bg rounded-full shadow-1 transition-transform duration-150 translate-x-0.5 data-[state=checked]:translate-x-3.5`.
11. Create `src/components/ui/index.ts` as an **empty stub** containing only the four marker comments — NO export statements. Exact content:
    ```ts
    // src/components/ui/index.ts — barrel populated by Task 5 (see phase-3-plan.md).
    // task-1 form
    // task-2 display
    // task-3 overlay
    // task-4 data
    ```
    Tasks 2, 3, and 4 must NOT modify this file. Task 5 replaces it wholesale with the full named-export list for all 19 primitives.
12. Run `npx tsc --noEmit` — fix any errors before committing.
13. Run `scripts/design-laws-check.sh src/components/ui/ 2>/dev/null || echo "design-laws-check not yet present — Phase 1 deliverable; verify manually that no raw hex / banned fonts / rgba shadows / banned border-radius appear in the 8 new files"`. If the script exists from Phase 1, it must exit 0 against the 8 files. If it doesn't exist, the builder verifies by hand: `grep -rEn '#[0-9a-fA-F]{3,6}|rgba?\(|font-family:\s*(Inter|Playfair|Poppins|Arial|Helvetica|Roboto|system-ui)' src/components/ui/Button.tsx src/components/ui/IconButton.tsx src/components/ui/Input.tsx src/components/ui/Textarea.tsx src/components/ui/Select.tsx src/components/ui/Checkbox.tsx src/components/ui/Radio.tsx src/components/ui/Switch.tsx` must return zero matches.

**Validation:** (builder self-check, all must pass before commit)
- `test -f src/components/ui/Button.tsx -a -f src/components/ui/IconButton.tsx -a -f src/components/ui/Input.tsx -a -f src/components/ui/Textarea.tsx -a -f src/components/ui/Select.tsx -a -f src/components/ui/Checkbox.tsx -a -f src/components/ui/Radio.tsx -a -f src/components/ui/Switch.tsx && echo ALL_PRESENT` → `ALL_PRESENT`
- `test -f src/components/ui/index.ts && echo BARREL_STUBBED` → `BARREL_STUBBED`
- `grep -c "^export" src/components/ui/index.ts` → `0` (Task 1 must NOT add exports; Task 5 owns that)
- `grep -rEn '#[0-9a-fA-F]{3,6}|rgba?\(' src/components/ui/Button.tsx src/components/ui/IconButton.tsx src/components/ui/Input.tsx src/components/ui/Textarea.tsx src/components/ui/Select.tsx src/components/ui/Checkbox.tsx src/components/ui/Radio.tsx src/components/ui/Switch.tsx | wc -l` → `0`
- `grep -rEn 'text-gold|bg-gold|text-gray-[0-9]|bg-gray-[0-9]|border-gray-[0-9]' src/components/ui/Button.tsx src/components/ui/IconButton.tsx src/components/ui/Input.tsx src/components/ui/Textarea.tsx src/components/ui/Select.tsx src/components/ui/Checkbox.tsx src/components/ui/Radio.tsx src/components/ui/Switch.tsx | wc -l` → `0` (no legacy palette classes)
- `grep -cE 'forwardRef|React\.forwardRef' src/components/ui/Button.tsx src/components/ui/IconButton.tsx src/components/ui/Input.tsx src/components/ui/Textarea.tsx` → each ≥ 1 (every primitive forwards refs)
- `grep -cE 'focus-visible:ring' src/components/ui/Button.tsx src/components/ui/Input.tsx src/components/ui/Textarea.tsx` → each ≥ 1 (focus state present)
- `grep -cE 'aria-invalid|aria-describedby' src/components/ui/Input.tsx src/components/ui/Textarea.tsx` → each ≥ 1 (error wiring present)
- `npx tsc --noEmit 2>&1 | grep -c 'error TS'` → `0`
- `npm run lint -- src/components/ui/ 2>&1 | grep -c 'error'` → `0`

**Context:** Read
- @.planning/DESIGN.md (sections §2 colors, §3 typography, §5 components, §6 depth, §7 motion, §10 anti-patterns — non-negotiable)
- @.planning/PRODUCT.md (register: mixed product-primary; voice: restrained, editorial — no exclamation, no emoji)
- @~/.claude/qualia-design/design-laws.md (OKLCH-only, banned patterns)
- @~/.claude/qualia-design/design-product.md (Standard density, 14-15px body in product surfaces, tabular numerals on numeric, keyboard-first, every state on every interactive)
- @src/styles/tokens.css (Phase 1 output — token vocabulary)
- @tailwind.config.ts (Phase 1 output — semantic-class wiring)
- @src/components/ui/Button.tsx (current v2 file — overwrite reference, NOT a model to keep)
- @src/lib/utils.ts (extend `cn` with twMerge)
- Radix docs via Context7 if API specifics needed: `mcp__context7__resolve-library-id` → `@radix-ui/react-select` etc. before guessing prop shapes.

**Design:**
- Register: product (form primitives serve admin + checkout flows — Standard density, Stripe-fluency bar)
- Tokens used: `var(--accent)`, `var(--accent-deep)`, `var(--bg)`, `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--critical)`, `var(--border)`, `var(--border-strong)`, `var(--shadow-1)`, `var(--radius-sm)` (4px), `var(--space-3)`, `var(--space-4)`, `var(--space-6)`, `var(--font-geist)`, `var(--font-newsreader)`, `var(--duration-fast)` (150ms), `var(--ease-out-quart)`
- Scope: component library (8 files under `src/components/ui/`)
- Anti-pattern guard: builder runs `bash scripts/design-laws-check.sh src/components/ui/` pre-commit if Phase 1 shipped it; otherwise runs the manual `grep` chain from step 13 above. Commit blocked if any banned token, banned font, raw hex, rgba shadow, or default shadcn Button variant is present. Specifically forbidden in this task: any usage of the v2 classes `text-gold`, `bg-gold`, `border-gold`, `bg-gray-*`, `text-gray-*`, `border-gray-*`, `shadow-[0_2px_16px_rgba(...)`, `tracking-[0.12em]`, `rounded-xl` on a button.

---

## Task 2 — Display primitives (Card, Badge, Tag, Avatar, Tooltip, Skeleton)
**Wave:** 1
**Persona:** frontend
**Files:**
- `src/components/ui/Card.tsx` (overwrite — exports `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`; compound pattern)
- `src/components/ui/Badge.tsx` (create — exports `Badge`; variants: `neutral | accent | success | warning | critical`)
- `src/components/ui/Tag.tsx` (create — exports `Tag`; supports `onRemove?: () => void` for removable chips)
- `src/components/ui/Avatar.tsx` (create — exports `Avatar`; wraps `@radix-ui/react-avatar`; supports `src`, `alt`, `fallback` initials)
- `src/components/ui/Tooltip.tsx` (create — exports `Tooltip`, `TooltipProvider`, `TooltipTrigger`, `TooltipContent`; wraps `@radix-ui/react-tooltip`)
- `src/components/ui/Skeleton.tsx` (overwrite — exports `Skeleton`; supports `variant: 'text' | 'rect' | 'circle'`, `width`, `height`)
- `package.json` + `package-lock.json` (modify — add `@radix-ui/react-avatar`, `@radix-ui/react-tooltip` if not yet installed by Task 1's batch)

**Depends on:** none

**Why:** Display primitives are the connective tissue of every page (covers PRIM-02). The admin dashboard currently uses `bg-gray-900 rounded-xl border border-gray-800` for every card — five different ways across StatCard / Recent Orders / Recent Products / Quick Actions. Shipping a single `Card` primitive replaces ~90 lines of duplicated Tailwind in the admin alone. Skeleton replaces the current `animate-pulse bg-gray-800` ad-hoc loading state with a tokenized skeleton that respects motion preferences. The existing `Card.tsx` and `Skeleton.tsx` use banned classes — overwrite, don't extend.

**Acceptance Criteria:**
- All 6 files exist and export their named components.
- `Card` is a compound component: `<Card>` wraps content with `bg-bg-alt rounded-sm p-6` (24px from `--space-6`), no border by default, optional `interactive` prop adds `hover:shadow-1 transition-shadow duration-150 cursor-pointer`. `CardHeader` provides `flex flex-col gap-1 pb-4`, `CardTitle` is `<h3 className="text-fg text-[18px] font-[var(--font-cormorant)] tracking-tight">`, `CardDescription` is `<p className="text-fg-muted text-[14px] font-[var(--font-newsreader)]">`, `CardContent` is `flex flex-col gap-4`, `CardFooter` is `flex items-center justify-between pt-4 border-t border-border`.
- `Badge` variants render with tinted backgrounds (no raw color): `neutral = bg-bg-alt text-fg-muted`, `accent = bg-accent/12 text-accent-deep`, `success = bg-success/12 text-success` (success token defined in tokens.css; if missing, fall back to a semantic `--success` defined inline with documented OKLCH `oklch(0.62 0.12 145)`), `warning = bg-warning/12 text-warning`, `critical = bg-critical/12 text-critical`. Padding `px-2 py-1`, `rounded-sm`, `text-[11px] uppercase tracking-[0.05em] font-medium font-[var(--font-geist)]`. Minimum width via natural content; no fixed.
- `Tag` is `Badge` + optional close `X` button (44px touch target nested IconButton-style) when `onRemove` provided. `aria-label="Remove {tag label}"` on the button.
- `Avatar` renders a square avatar `rounded-sm` (NOT circle by default — editorial direction; circle available via `shape="circle"` prop). Sizes: `sm = 28`, `md = 40`, `lg = 56`. Fallback is initials over `bg-accent/12 text-fg` if image fails (Radix `Avatar.Fallback` handles).
- `Tooltip` opens 200ms after hover/focus, closes immediately on leave/blur. Surface: `bg-fg text-bg px-3 py-1.5 rounded-sm text-[12px] font-[var(--font-geist)] shadow-2 z-50`. Arrow optional via Radix `Tooltip.Arrow`. Default `delayDuration={200}`.
- `Skeleton` renders a pulsing rectangle/circle/text-line via `bg-bg-alt animate-pulse` (define a custom 1500ms-loop pulse if Tailwind's default is too fast — DESIGN.md product register says 1500ms subtle). Variants: `text` (h-4, w-full default), `rect` (caller specifies dimensions), `circle` (square aspect, `rounded-full`). Respects `prefers-reduced-motion` (CSS handles via the global media query in `tokens.css`).
- All primitives forward `ref` and accept `className`.
- This task does NOT modify `src/components/ui/index.ts` — Task 5 owns the barrel write to prevent parallel write-conflicts in Wave 1.
- `tsc --noEmit` exits 0.

**Action:**
1. If `@radix-ui/react-avatar @radix-ui/react-tooltip` weren't installed in Task 1's batch, run `npm install @radix-ui/react-avatar @radix-ui/react-tooltip`.
2. **Overwrite** `src/components/ui/Card.tsx`. Inspect the existing file first via `Read` — it's v2 ProductCard-style and uses banned classes. Replace with the compound-component pattern above. Export each part as named.
3. Create `src/components/ui/Badge.tsx`:
   - `interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'critical'; }`
   - `forwardRef<HTMLSpanElement, BadgeProps>`.
   - Common: `inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] uppercase tracking-[0.05em] font-medium font-[var(--font-geist)]`.
   - Variant map as in AC above.
   - If `--success` and `--warning` tokens are missing from `tokens.css` (verify by reading the file), DO NOT inline raw colors. Instead, add them to `tokens.css` with these OKLCH values and document the addition as a phase-3 deviation in commit message: `--color-success: oklch(0.62 0.13 145); --color-warning: oklch(0.78 0.14 75); --success: var(--color-success); --warning: var(--color-warning);` plus matching Tailwind config additions to `theme.extend.colors.success` and `.warning`. Both belong to the design system and Phase 1 should have included them — verify and add if absent.
4. Create `src/components/ui/Tag.tsx`. Reuses `Badge` styling via `cn(badgeVariants({variant}), ...)`. Adds `onRemove` button render when prop present. Use `X` icon from `lucide-react` 12px stroke 1.5.
5. Create `src/components/ui/Avatar.tsx` wrapping `@radix-ui/react-avatar`. Compound: just `Avatar` with `src`, `alt`, `fallback`, `size`, `shape` props for simple use; under the hood renders `<Avatar.Root><Avatar.Image /><Avatar.Fallback /></Avatar.Root>`. Sizes via fixed Tailwind `w-7 h-7` / `w-10 h-10` / `w-14 h-14`.
6. Create `src/components/ui/Tooltip.tsx`. Re-export `TooltipProvider` (Radix `Tooltip.Provider`) — caller must wrap their tree once at app root (document in JSDoc). Compound: `Tooltip` = `Tooltip.Root`, `TooltipTrigger` = `Tooltip.Trigger asChild`, `TooltipContent` styled per AC. `sideOffset={6}`, `collisionPadding={8}`.
7. **Overwrite** `src/components/ui/Skeleton.tsx`. The existing v2 file uses banned tokens. New shape:
   - Props: `variant?: 'text' | 'rect' | 'circle'`, `width?: string | number`, `height?: string | number`, plus `HTMLAttributes<HTMLDivElement>`.
   - Renders `<div role="status" aria-live="polite" aria-busy="true" className={cn(base, variantClass, className)} style={{width, height}} />`.
   - Base: `bg-bg-alt animate-skeleton-pulse` — define a custom keyframe in `tailwind.config.ts` (or a small `@keyframes skeleton-pulse` in `tokens.css`): 1500ms infinite, opacity 0.6 → 1 → 0.6. If extending Tailwind config is required, do so and document the addition.
   - Variants: `text = h-4 rounded-sm`, `rect = rounded-sm`, `circle = rounded-full aspect-square`.
   - Also note: there is a duplicate `src/components/ui/LuxurySkeleton.tsx` — leave it alone in this task (M4 cleanup territory), but the new `Skeleton.tsx` is the canonical primitive going forward.
8. **DO NOT modify `src/components/ui/index.ts`.** Task 5 is the only task that writes to the barrel. Skipping this step intentionally is the parallel-safety contract for Wave 1.
9. Run `npx tsc --noEmit` and the design-laws grep chain from Task 1 step 13, but targeting these 6 files. Fix any failures before commit.

**Validation:** (builder self-check)
- `test -f src/components/ui/Card.tsx -a -f src/components/ui/Badge.tsx -a -f src/components/ui/Tag.tsx -a -f src/components/ui/Avatar.tsx -a -f src/components/ui/Tooltip.tsx -a -f src/components/ui/Skeleton.tsx && echo ALL_PRESENT` → `ALL_PRESENT`
- `grep -rEn '#[0-9a-fA-F]{3,6}|rgba?\(' src/components/ui/Card.tsx src/components/ui/Badge.tsx src/components/ui/Tag.tsx src/components/ui/Avatar.tsx src/components/ui/Tooltip.tsx src/components/ui/Skeleton.tsx | wc -l` → `0`
- `grep -rEn 'text-gold|bg-gold|text-gray-[0-9]|bg-gray-[0-9]|border-gray-[0-9]|animate-shimmer' src/components/ui/Card.tsx src/components/ui/Badge.tsx src/components/ui/Tag.tsx src/components/ui/Avatar.tsx src/components/ui/Tooltip.tsx src/components/ui/Skeleton.tsx | wc -l` → `0`
- `grep -cE 'CardHeader|CardTitle|CardDescription|CardContent|CardFooter' src/components/ui/Card.tsx` → `≥ 5` (compound pattern present)
- `grep -cE 'variant.*neutral.*accent.*success.*warning.*critical' src/components/ui/Badge.tsx` → `≥ 1` (or equivalent — all 5 variants present)
- `npx tsc --noEmit 2>&1 | grep -c 'error TS'` → `0`

**Context:** Read
- @.planning/DESIGN.md (§5 Card, Badge specs; §6 shadow elevation; §10 banned patterns including default shadcn variants)
- @~/.claude/qualia-design/design-product.md (Skeleton not spinner for known-shape; Badges/Tags styling rules)
- @src/styles/tokens.css (verify `--success` `--warning` presence; add if missing)
- @tailwind.config.ts (verify semantic color wiring; extend with `success`/`warning` if added)
- @src/components/ui/Card.tsx (current — overwrite target)
- @src/components/ui/Skeleton.tsx (current — overwrite target)
- @src/components/ui/LuxurySkeleton.tsx (read for reference, do NOT modify in this task)
- Radix Avatar/Tooltip docs via Context7 if uncertain.

**Design:**
- Register: product
- Tokens used: `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--accent-deep)`, `var(--critical)`, `var(--border)`, `var(--shadow-1)`, `var(--shadow-2)`, `var(--radius-sm)`, `var(--space-2)`, `var(--space-4)`, `var(--space-6)`, `var(--font-cormorant)`, `var(--font-newsreader)`, `var(--font-geist)`, `var(--duration-base)` (250ms), `var(--ease-out-quart)`
- Scope: component library (6 files under `src/components/ui/`)
- Anti-pattern guard: same chain as Task 1 plus a check that the legacy `bg-gray-900 rounded-xl border border-gray-800` pattern from `admin/page.tsx` is NOT reproduced in `Card.tsx`. `grep -E 'rounded-xl|border-gray-800' src/components/ui/Card.tsx` must return `0`.

---

## Task 3 — Overlay primitives (Drawer, Dialog, Tabs, Toast, Popover)
**Wave:** 1
**Persona:** frontend
**Files:**
- `src/components/ui/Dialog.tsx` (create — exports `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`; wraps `@radix-ui/react-dialog`)
- `src/components/ui/Drawer.tsx` (create — exports same compound surface as Dialog but slides from right; reuses `@radix-ui/react-dialog` with custom animation)
- `src/components/ui/Tabs.tsx` (create — exports `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`; wraps `@radix-ui/react-tabs`)
- `src/components/ui/Toast.tsx` (create — exports `Toaster` (root provider), `useToast` (hook returning `toast(opts)` function); minimal hand-roll, no external lib — see Action for spec)
- `src/components/ui/Popover.tsx` (create — exports `Popover`, `PopoverTrigger`, `PopoverContent`; wraps `@radix-ui/react-popover`)
- `src/app/layout.tsx` (modify — wrap children in `<TooltipProvider>` (from Task 2) and `<Toaster />` for global toasts; minimal additions, do not change other layout structure)
- `package.json` + `package-lock.json` (modify if not done in Task 1 batch — add `@radix-ui/react-dialog`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`)

**Depends on:** none

**Why:** Overlays carry the conversion-critical moments — Add-to-Cart confirmations (Toast), cart drawer, login dialog, filter popovers, admin order detail. The CartDrawer in the codebase is currently a one-off in `src/components/cart/CartDrawer.tsx` with hand-rolled focus management. PRIM-03 requires every overlay to implement focus-trap + escape-to-close + scrim-click + body-scroll-lock — Radix Dialog gives us all four out of the box for Dialog/Drawer; Popover/Tooltip get focus management; Toast we hand-roll because lib choices (sonner, react-hot-toast) impose their own styling that fights tokens. Building these now means M3 + M4 can compose drawers and dialogs from one primitive instead of re-implementing focus traps each time.

**Acceptance Criteria:**
- All 5 files exist with the documented compound exports.
- `Dialog.Content`: max-width `32rem` (per DESIGN.md §5), centered horizontally and vertically, `bg-bg p-8 rounded-sm shadow-3`, `data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out` (250ms ease-out-quart). Scrim: `bg-[oklch(0.10_0_0/0.5)]` (the ONE allowed deviation from tinted neutrals per DESIGN.md §5 — true black at 50%). Focus traps (Radix default), Esc closes (Radix default), scrim click closes (Radix default), body scroll locked via Radix's automatic scroll lock. First focusable element receives focus on open; focus returns to trigger on close.
- `Drawer.Content`: same Radix base but slides from right. Max-width `28rem`, `h-screen fixed top-0 right-0`, `bg-bg p-8 shadow-3`, `data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right` (250ms ease-out-quart). All four Radix behaviors apply (focus trap, Esc, scrim click, scroll lock).
- `Tabs`: horizontal by default. `TabsList = inline-flex gap-1 border-b border-border`, `TabsTrigger = px-4 py-2 text-[13px] font-[var(--font-geist)] uppercase tracking-[0.05em] text-fg-muted data-[state=active]:text-fg data-[state=active]:border-b-2 data-[state=active]:border-accent -mb-px transition-colors`. Keyboard nav: arrow keys move focus, Enter/Space activates (Radix default).
- `Toast`: hand-rolled. `Toaster` renders a fixed `top-4 right-4 z-[100] flex flex-col gap-2` portal. `useToast()` returns `toast({ title, description?, variant?: 'default' | 'success' | 'error', duration?: number })`. Auto-dismiss at 5000ms default (per design-product.md); error variant has `duration: Infinity` (no auto-dismiss); all dismissible via close button (`X` icon, 32px touch target, `aria-label="Dismiss notification"`). Surface: `bg-bg-alt border border-border rounded-sm shadow-2 p-4 min-w-[20rem] flex items-start gap-3`. Variant icon: `success = CheckCircle text-success`, `error = AlertCircle text-critical`, `default = none`. Animation: enter `translate-x-full → 0` 250ms, exit reverse. State via `useReducer` inside `Toaster`, exposed via React Context. `useToast` consumes the context.
- `Popover.Content`: `bg-bg-alt border border-border rounded-sm shadow-2 p-4 min-w-[16rem] z-50`, `sideOffset={6}`, animates fade+offset 200ms. Click outside closes (Radix default). Esc closes (Radix default).
- `src/app/layout.tsx` wraps `children` in `<TooltipProvider delayDuration={200}><Toaster />{children}</TooltipProvider>` (or the equivalent ordering). No other changes to layout.
- This task does NOT modify `src/components/ui/index.ts` — Task 5 owns the barrel write.
- `tsc --noEmit` exits 0.

**Action:**
1. If overlay Radix deps weren't installed in Task 1 batch, run `npm install @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-tabs`.
2. Define animation keyframes. Either extend `tailwind.config.ts` `theme.extend.keyframes` and `animation` (preferred — matches Phase 1's wiring), or add to `src/styles/tokens.css`:
   - `fade-in`: `from { opacity: 0 } to { opacity: 1 }`
   - `fade-out`: reverse
   - `slide-in-right`: `from { transform: translateX(100%) } to { transform: translateX(0) }`
   - `slide-out-right`: reverse
   - All duration 250ms, ease `cubic-bezier(0.25, 1, 0.5, 1)`.
3. Create `src/components/ui/Dialog.tsx`. Use `@radix-ui/react-dialog`. Compound exports per AC. `DialogOverlay` styled as scrim (the one allowed `oklch(0.10 0 0 / 0.5)` — write it as `bg-[oklch(0.10_0_0/0.5)]` Tailwind arbitrary syntax). `DialogContent` styled per AC with `Portal`. Use `<X />` from lucide stroke-width 1.5 for the close button (top-right, IconButton-shaped, 32px touch target inside DialogContent). All ARIA labels (DialogTitle/Description) wired automatically by Radix.
4. Create `src/components/ui/Drawer.tsx`. Reuses `@radix-ui/react-dialog` (a side-anchored modal IS a dialog under the hood — same focus trap + scroll lock + Esc). The only difference is positioning + animation. Export the same compound surface (`Drawer`, `DrawerTrigger`, `DrawerContent`, etc.) so callers can swap dialog↔drawer trivially.
5. Create `src/components/ui/Tabs.tsx` wrapping `@radix-ui/react-tabs`. Standard compound. No portal.
6. Create `src/components/ui/Toast.tsx`. Hand-rolled — no `sonner`/`react-hot-toast` import:
   - Define `ToastContext` (React Context) with `{ toasts: Toast[], dispatch }`.
   - `Toaster` is a `'use client'` component rendering `<ToastContext.Provider>` around `{children}` (Toaster wraps app); inside the provider, render a fixed portal-style div listing current toasts.
   - `useToast()` returns `{ toast(opts), dismiss(id) }`. `toast(opts)` dispatches `{ type: 'ADD', payload: { id: crypto.randomUUID(), ...opts } }` and schedules `setTimeout(() => dispatch('REMOVE', id), opts.duration ?? 5000)` (skipped if `variant === 'error'` and no duration provided).
   - Reducer handles `ADD`, `REMOVE`, `UPDATE`.
   - Individual `<ToastItem />` renders with animation classes from step 2.
   - Maximum 5 simultaneous toasts; older ones drop on overflow.
   - Keep total file ≤ 130 LOC; if it grows, split into `Toast.tsx` (presentational) + `use-toast.tsx` (hook + context).
7. Create `src/components/ui/Popover.tsx` wrapping `@radix-ui/react-popover`. Standard compound. `PopoverContent` portal-rendered.
8. Modify `src/app/layout.tsx`. Read the file first. Locate the `<body>` children area. Wrap with `<TooltipProvider delayDuration={200}>` (from Task 2's Tooltip export) and add `<Toaster />` as a sibling above `{children}` so toasts portal outside the children tree. Do NOT modify font loading, metadata, theme-provider wrapping, or any other existing structure.
9. **DO NOT modify `src/components/ui/index.ts`.** Task 5 is the only task that writes to the barrel. Skipping this step intentionally is the parallel-safety contract for Wave 1.
10. Run `npx tsc --noEmit` and the design-laws grep chain targeting these 5 files. Verify focus-trap is present (it's automatic via Radix Dialog — confirm by `grep -c 'Dialog.Root\|Dialog.Portal' src/components/ui/Dialog.tsx` returns ≥ 1).

**Validation:**
- `test -f src/components/ui/Dialog.tsx -a -f src/components/ui/Drawer.tsx -a -f src/components/ui/Tabs.tsx -a -f src/components/ui/Toast.tsx -a -f src/components/ui/Popover.tsx && echo ALL_PRESENT` → `ALL_PRESENT`
- `grep -rEn '#[0-9a-fA-F]{3,6}' src/components/ui/Dialog.tsx src/components/ui/Drawer.tsx src/components/ui/Tabs.tsx src/components/ui/Toast.tsx src/components/ui/Popover.tsx | grep -v 'oklch' | wc -l` → `0` (the scrim's `oklch(0.10 0 0 / 0.5)` is the only allowed deviation; any other hex fails)
- `grep -cE '@radix-ui/react-dialog' src/components/ui/Dialog.tsx src/components/ui/Drawer.tsx` → each ≥ 1
- `grep -c 'TooltipProvider\|Toaster' src/app/layout.tsx` → `≥ 2`
- `grep -cE 'aria-label|aria-labelledby|aria-describedby' src/components/ui/Dialog.tsx src/components/ui/Drawer.tsx src/components/ui/Toast.tsx` → each ≥ 1
- `grep -cE 'setTimeout.*5000|duration.*5000|DEFAULT_TOAST_DURATION' src/components/ui/Toast.tsx` → `≥ 1` (5s default present)
- `npx tsc --noEmit 2>&1 | grep -c 'error TS'` → `0`

**Context:** Read
- @.planning/DESIGN.md (§5 Drawer/Dialog spec including the `oklch(0.10 0 0 / 0.5)` allowance; §6 shadow-3 for overlays; §7 motion durations + bans on bounce)
- @~/.claude/qualia-design/design-product.md (Toasts: 5s minimum auto-dismiss, errors don't auto-dismiss, always dismissible; Modals last resort with focus trap + Esc + restore focus)
- @src/styles/tokens.css (verify motion duration tokens; add keyframes if extending)
- @tailwind.config.ts (extend keyframes/animation if chosen route)
- @src/app/layout.tsx (modify carefully)
- @src/components/cart/CartDrawer.tsx (read for reference — current hand-rolled drawer; do NOT modify in this task — M4 will migrate it)
- Radix Dialog/Popover/Tabs docs via Context7: `mcp__context7__resolve-library-id` → `@radix-ui/react-dialog` and confirm current API (Radix 1.x stable but verify `Dialog.Title`/`Description` requirement for ARIA).

**Design:**
- Register: product (overlays serve cart, checkout, admin — all product flows)
- Tokens used: `var(--bg)`, `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--accent)`, `var(--critical)`, `var(--success)`, `var(--border)`, `var(--shadow-2)`, `var(--shadow-3)`, `var(--radius-sm)`, `var(--space-4)`, `var(--space-8)` (32px), `var(--font-cormorant)`, `var(--font-newsreader)`, `var(--font-geist)`, `var(--duration-base)`, `var(--ease-out-quart)`, plus the one allowed scrim deviation `oklch(0.10 0 0 / 0.5)`
- Scope: component library + app shell (5 files + layout.tsx)
- Anti-pattern guard: same chain as Task 1+2. Additional check: `grep -E 'modal\.show|alert\(' src/components/ui/Dialog.tsx src/components/ui/Drawer.tsx` must return `0` (no native browser dialogs). The CartDrawer in `src/components/cart/CartDrawer.tsx` is NOT migrated in this task — that's a deferred M4 task; do not touch it here.

---

## Task 4 — Data primitive (Table compound)
**Wave:** 1
**Persona:** frontend
**Files:**
- `src/components/ui/Table.tsx` (create — compound exports: `Table.Root`, `Table.Header`, `Table.Body`, `Table.Row`, `Table.HeaderCell`, `Table.Cell`, `Table.SortHeader`, `Table.Empty`)

**Depends on:** none

**Why:** Tables are the dominant admin surface — Products, Orders, Customers, Blog Posts all need sortable, sticky-header tables (covers PRIM-04). The current admin `src/app/admin/page.tsx` "Recent Orders" and "Recent Products" sections are hand-rolled `divide-y` lists missing sort and proper header styling. PRIM-04 specifies sticky header + sort callback + hover row. Building one Table primitive replaces three (and counting) ad-hoc table implementations in M3.

**Acceptance Criteria:**
- `src/components/ui/Table.tsx` exists and exports the 8 compound parts.
- `Table.Root`: `<table className="w-full border-collapse text-[14px] font-[var(--font-newsreader)] [font-feature-settings:'tnum'_1]">` (tabular numerals enabled per design-product.md). Wrapped in `<div className="w-full overflow-x-auto">` so wide admin tables scroll on mobile.
- `Table.Header`: `<thead className="sticky top-0 bg-bg-alt z-10">` — sticky header on `bg-bg-alt` per DESIGN.md §5.
- `Table.Body`: `<tbody>` — no styling.
- `Table.Row`: `<tr className="border-b border-border hover:bg-bg-alt transition-colors duration-150">` — bottom border + hover row per DESIGN.md §5.
- `Table.HeaderCell`: `<th className="text-left px-4 py-3 text-[11px] uppercase tracking-[0.05em] text-fg-muted font-[var(--font-geist)] font-medium">`.
- `Table.Cell`: `<td className="px-4 py-3 text-fg align-middle">`. Add `align="right"` prop → `text-right` (right-align numbers per design-product.md).
- `Table.SortHeader`: extends `HeaderCell` with `onSort: () => void` and `sortDirection?: 'asc' | 'desc' | null` props. Renders `<button>` inside the `<th>` showing the label + `ArrowUp`/`ArrowDown`/`ArrowUpDown` icon from lucide (stroke 1.5) on the right. Active sort shows the directional icon in `text-fg`; inactive shows `ArrowUpDown` in `text-fg-muted`. Hover shows the icon transition. `aria-sort="ascending"|"descending"|"none"` on the `<th>`.
- `Table.Empty`: rendered inside `<tbody>` as `<tr><td colSpan={...} className="px-4 py-16 text-center text-fg-muted">{children}</td></tr>` — receives `colSpan` prop (number, required) and `children` (icon + message + optional action per design-product.md "Empty data: 'No invoices yet — try [action]'").
- Keyboard: SortHeader button activates on Space/Enter (native `<button>`). Row hover is mouse-only by design; row click handlers must be added by callers via `onClick` on `<Table.Row>` (pass through with `tabIndex={0}` + `onKeyDown` Enter handling if interactive — but the primitive itself does NOT auto-promote rows to interactive; callers opt-in).
- This task does NOT modify `src/components/ui/index.ts` — Task 5 owns the barrel write.
- `tsc --noEmit` exits 0.

**Action:**
1. Create `src/components/ui/Table.tsx`:
   - Top of file: `'use client'` is NOT required for the primitive itself (it has no state). Keep it server-component-compatible.
   - Define a namespace-export pattern: `export const Table = { Root, Header, Body, Row, HeaderCell, Cell, SortHeader, Empty }` plus also export each individually as named (so consumers can `import { Table }` OR `import { TableRow }`).
   - Each subcomponent is a forwardRef. Use semantic HTML (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`).
   - `SortHeader` props: `interface SortHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> { onSort: () => void; sortDirection?: 'asc' | 'desc' | null; }`. Inside: `<th aria-sort={sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none'}><button onClick={onSort} className="..."><span>{children}</span>{icon}</button></th>`.
   - Use lucide icons `ArrowUp`, `ArrowDown`, `ArrowUpDown` at 12px stroke-width 1.5.
   - Tabular numerals: keep CSS `[font-feature-settings:'tnum'_1]` on Root (Tailwind arbitrary syntax) so descendant `<td>` numeric cells inherit.
   - Empty state component: receives `colSpan: number` (required) + `icon?: ReactNode` + `title?: string` + `description?: string` + `action?: ReactNode` props OR just `children` (caller composes). Pick `children` for max flexibility — primitive provides the cell + padding, caller composes the empty-state content.
2. **DO NOT modify `src/components/ui/index.ts`.** Task 5 is the only task that writes to the barrel. Skipping this step intentionally is the parallel-safety contract for Wave 1.
3. Run `npx tsc --noEmit`. Run the design-laws grep chain against `src/components/ui/Table.tsx`. Confirm zero hits.

**Validation:**
- `test -f src/components/ui/Table.tsx && echo EXISTS` → `EXISTS`
- `grep -cE 'Root|Header|Body|Row|HeaderCell|Cell|SortHeader|Empty' src/components/ui/Table.tsx` → `≥ 8` (compound parts present)
- `grep -c 'sticky' src/components/ui/Table.tsx` → `≥ 1` (sticky header)
- `grep -c "tnum" src/components/ui/Table.tsx` → `≥ 1` (tabular numerals)
- `grep -cE 'aria-sort' src/components/ui/Table.tsx` → `≥ 1` (SortHeader a11y)
- `grep -rEn '#[0-9a-fA-F]{3,6}|rgba?\(|text-gold|bg-gold|text-gray-[0-9]|bg-gray-[0-9]' src/components/ui/Table.tsx | wc -l` → `0`
- `npx tsc --noEmit 2>&1 | grep -c 'error TS'` → `0`

**Context:** Read
- @.planning/DESIGN.md (§5 Table spec — sticky header `--bg-alt`, body rows `--bg`, 1px bottom border `--border`, hover row `--bg-alt`)
- @~/.claude/qualia-design/design-product.md (Tables row: tabular numerals, right-align numbers, sort indicators on hover/persistent, sticky headers, empty states with icon + sentence + action)
- @src/styles/tokens.css
- @src/app/admin/page.tsx (current "Recent Orders" / "Recent Products" hand-rolled patterns — Table primitive will replace these in Task 5)

**Design:**
- Register: product (tables are admin-core; Standard density)
- Tokens used: `var(--bg)`, `var(--bg-alt)`, `var(--fg)`, `var(--fg-muted)`, `var(--border)`, `var(--space-3)` (12px row padding), `var(--space-4)` (16px column padding), `var(--font-newsreader)` (body cells), `var(--font-geist)` (header cells), `var(--duration-fast)` (150ms hover)
- Scope: component library (1 file under `src/components/ui/`)
- Anti-pattern guard: same chain. Plus: `grep -E 'rounded-xl|shadow-lg|border-gray-' src/components/ui/Table.tsx` must return `0`. The Table is editorial — sharp, not rounded.

---

## Task 5 — Barrel population + showcase route + admin dashboard integration
**Wave:** 2
**Persona:** frontend
**Files:**
- `src/components/ui/index.ts` (overwrite — replace the Task 1 stub with the full named-export list for all 19 primitives; this is the SOLE write to the barrel after Task 1's stub)
- `src/app/admin/_design/page.tsx` (create — non-public showcase route rendering every primitive in every state)
- `src/app/admin/_design/layout.tsx` (create — minimal layout wrapping showcase in a centered container so it doesn't inherit admin shell; OR opt out by placing under `_design` route group; choose whichever is simpler given current admin layout)
- `src/app/admin/page.tsx` (modify — replace the 4 ad-hoc Tailwind blocks: StatCard (line 357-390), Recent Orders section (line 213-254), Recent Products section (line 256-307), Quick Actions section (line 309-351) with primitives from Tasks 1-4; preserve all data fetching logic unchanged)
- `src/middleware.ts` (verify only — `_design` should already be gated by the existing `/admin/*` matcher; no change unless `_design` needs explicit allow/deny)

**Depends on:** Task 1, Task 2, Task 3, Task 4

**Why:** PRIM-05 requires (a) the showcase route as the in-repo design reference, and (b) one existing page integrated to prove primitives compose correctly. Without integration the primitives are unverified — a primitive that renders fine in isolation but breaks in real composition is not shipped. The admin dashboard is the right integration target per the phase brief: lower-stakes (internal-only), already uses card + table + button + link patterns ad-hoc, and validates that the primitives carry the admin's actual data shapes (Order, Product). The showcase route serves as the lightweight Storybook alternative — every primitive, every variant, every state in one URL the team can review. This task also owns the single barrel write — Tasks 1-4 ship files in parallel but only Task 5 wires `src/components/ui/index.ts`, eliminating the parallel-write conflict that would otherwise exist if every Wave 1 task touched the barrel.

**Acceptance Criteria:**
- `src/components/ui/index.ts` exports every primitive shipped by Tasks 1-4 by name: `Button`, `buttonVariants`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio` (`RadioGroup`, `RadioItem`), `Switch`, `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`), `Badge`, `Tag`, `Avatar`, `Tooltip` (`TooltipProvider`, `TooltipTrigger`, `TooltipContent`), `Skeleton`, `Dialog` (`DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`), `Drawer` (same compound surface), `Tabs` (`TabsList`, `TabsTrigger`, `TabsContent`), `Toaster`, `useToast`, `Popover` (`PopoverTrigger`, `PopoverContent`), `Table`. All 19 primitives reachable via `import { ... } from '@/components/ui'`. The stub marker comments from Task 1 are removed in this overwrite — replaced by clear section comments (`// form`, `// display`, `// overlay`, `// data`) above each export block.
- `src/app/admin/_design/page.tsx` exists, is reachable at `/admin/_design` for authenticated admin users (gated by existing middleware), and renders ALL 19 primitives in their states:
  - Section: Form primitives — Button (4 variants × 3 sizes × {default, hover, focus, active, disabled, loading} states inline-demoed where applicable; live render shows default + disabled + loading; the others communicated via micro-caption "hover/focus/active observable on this live row"). IconButton (3 sizes, 3 variants). Input (default, with leading icon, with trailing icon, disabled, with error message). Textarea (default, disabled, with error). Select (default + open state via initial demo). Checkbox (unchecked, checked, indeterminate, disabled). RadioGroup (3 options demo). Switch (off, on, disabled).
  - Section: Display primitives — Card (default + interactive variant + with Header/Title/Description/Content/Footer). Badge (all 5 variants). Tag (with and without onRemove). Avatar (3 sizes × {image, fallback initials}). Tooltip (one button with tooltip — hover/focus to verify). Skeleton (3 variants: text 3 lines, rect 200×100, circle 48×48).
  - Section: Overlay primitives — Dialog (button triggers a Dialog with title + description + footer with Cancel/Confirm). Drawer (button triggers right-sliding Drawer with similar content). Tabs (3 tabs, second active by default). Toast (4 buttons triggering each variant: default, success, error, with action). Popover (button triggers Popover with content).
  - Section: Data primitive — Table with 5 rows demo, one sortable column (clicking the sort header toggles asc/desc, demo state via `useState`), one numeric column right-aligned (with tabular numerals visible — e.g., €1,234.56 / €234.50 / €12.00 align on the decimal). Plus a second Table with `Table.Empty` rendered (empty state with icon + message + action button).
  - Each section preceded by an `<h2>` heading (Cormorant Garamond) labeling the primitive family.
  - The route is a `'use client'` component (state for Tabs, Toast triggers, sort, Dialog open).
- `src/app/admin/page.tsx` is migrated:
  - `StatCard` inline component (line 357-390) is REMOVED. The 8 StatCard usages are replaced with `<Card>` + `<CardContent>` directly, using `<Badge variant="accent">` for the icon container or just inlining the icon with `text-accent` (no more "bg-blue-500/10 text-blue-400 border-blue-500/20" color soup — single accent treatment, the dashboard reads as ONE palette not five).
  - "Recent Orders" section is rebuilt with `<Card>` containing a `<Table>` (Header: Order #, Customer, Date, Total, Status; right-aligned numeric Total; tabular numerals). Empty state uses `<Table.Empty>` with `ShoppingBag` icon + "No orders yet" + "Orders will appear here after customers purchase" description.
  - "Recent Products" section is rebuilt the same way (Header: Product, Category, Type, Price, Stock; right-aligned numeric Price; Stock column uses `<Badge variant="success">In Stock</Badge>` / `<Badge variant="critical">Out of Stock</Badge>` — replaces the current `text-green-400`/`text-red-400` plaintext).
  - "Quick Actions" section is rebuilt with three `<Card interactive>` components, each wrapping a `<Link>` (or `<a target="_blank">` for "View Store"). Each card contains an icon, `<CardTitle>` (CardTitle is the Cormorant heading), and `<CardDescription>` (Newsreader body muted).
  - Loading state (currently `bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse`) is replaced with `<Skeleton variant="rect" height={120} />` × 4 inside the same grid.
  - Error state (currently `bg-red-500/10 border border-red-500/20 rounded-lg`) is replaced with `<Card>` containing an `AlertCircle` icon (`text-critical`) and the error text. OR triggers a `toast({ variant: 'error', title: 'Error loading data', description: error })` on the catch and the Card-rendered banner is removed entirely (toast is the more product-register-correct pattern). Choose toast.
  - Every `text-white`, `text-gray-400`, `text-gold`, `bg-gray-900`, `border-gray-800`, `bg-gold` class in the migrated regions is replaced with semantic tokens. The PAGE-LEVEL h1 ("Dashboard") and h1 subtitle still use legacy classes only if those classes correspond to semantic equivalents — prefer rewriting them too: `<h1 className="text-fg text-[28px] font-[var(--font-cormorant)]">Dashboard</h1>` + `<p className="text-fg-muted mt-1">...</p>`.
  - At minimum 3 primitives from `src/components/ui/` are imported and rendered in `admin/page.tsx` (PRIM-05 requirement). With the migrations above the count will be ≥ 5 (Card, Table with subcomponents, Badge, Skeleton, plus the toast pathway adding Toast).
- The admin dashboard's behavior is identical to before — same Supabase queries, same realtime subscription, same data displayed. ONLY the presentation layer changes.
- A pre-commit slop check passes on both pages: no raw hex, no banned fonts, no `bg-gray-*` / `text-gray-*` / `text-gold` / `bg-gold` legacy classes anywhere in the modified files.
- `npm run dev` succeeds; `/admin/_design` and `/admin` render without console errors on a fresh authenticated session. Both routes work at 375px (mobile), 768px (iPad), 1280px (laptop) per DESIGN.md §9 — visible breakage at any breakpoint blocks the task.
- `tsc --noEmit` exits 0; `npm run lint` exits 0.

**Action:**
1. **BEFORE ANY OTHER WORK** — overwrite `src/components/ui/index.ts` wholesale, replacing the Task 1 stub with the full named-export list for all 19 primitives shipped by Tasks 1-4. Exact structure (adapt named exports to match what each primitive file actually exports — confirm by reading each file first):
   ```ts
   // src/components/ui/index.ts — primitive barrel (Phase 3).
   // form
   export { Button, buttonVariants } from './Button';
   export { IconButton } from './IconButton';
   export { Input } from './Input';
   export { Textarea } from './Textarea';
   export { Select, SelectItem } from './Select';
   export { Checkbox } from './Checkbox';
   export { RadioGroup, RadioItem } from './Radio';
   export { Switch } from './Switch';
   // display
   export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
   export { Badge } from './Badge';
   export { Tag } from './Tag';
   export { Avatar } from './Avatar';
   export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './Tooltip';
   export { Skeleton } from './Skeleton';
   // overlay
   export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './Dialog';
   export { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from './Drawer';
   export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
   export { Toaster, useToast } from './Toast';
   export { Popover, PopoverTrigger, PopoverContent } from './Popover';
   // data
   export { Table } from './Table';
   ```
   All four marker stubs from Task 1 are removed in this overwrite. Run `npx tsc --noEmit` immediately after writing to confirm every re-exported name resolves to an actual export in the source file; fix any mismatch by either correcting the export in the barrel OR by patching the source file's export name to match the barrel (preserve the canonical name — `RadioGroup` not `Radio`, etc.).
2. Read `src/app/admin/page.tsx` (the full ~390-line file) and `src/app/admin/layout.tsx` (to understand the admin shell — it likely has nav + main wrapper).
3. Create `src/app/admin/_design/layout.tsx` (if admin/layout.tsx is desirable to inherit, skip this and let `_design/page.tsx` use it; if admin shell would dominate, create a minimal layout: `export default function DesignLayout({ children }) { return <div className="min-h-screen bg-bg p-8">{children}</div>; }`). Decision: inherit admin layout — operators visit `_design` while logged in. Skip creating a separate layout unless admin shell breaks the showcase (verify by visiting in dev; create only if needed).
4. Create `src/app/admin/_design/page.tsx`:
   - `'use client'` directive.
   - Imports: all primitives from `@/components/ui` (use barrel).
   - State: `useState` for Tab active value, sort direction, Dialog open, Drawer open, Popover open. `useToast()` from Toast for the trigger buttons.
   - Layout: full-width container with `max-w-[var(--container-full)]` (80rem from DESIGN.md §4), `mx-auto`, `space-y-16` between sections.
   - Each section: `<section><h2 className="text-fg text-[var(--font-h2)] font-[var(--font-cormorant)] mb-8">Form primitives</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{...examples}</div></section>`.
   - Examples wrapped in `<Card>` blocks with a small `<Badge variant="neutral">` label naming the primitive + state.
   - Length target: ≤ 500 LOC. If approaching that, split into sub-files per primitive family (`_design/form-primitives.tsx`, `_design/display-primitives.tsx`, etc.) imported by `page.tsx`. Acceptable to keep monolithic if it fits.
5. Migrate `src/app/admin/page.tsx`:
   - Replace the `StatCard` inline component usage (8 calls) with inline `<Card>` blocks. Delete the `StatCard` function at the bottom of the file. New shape per StatCard:
     ```tsx
     <Card>
       <CardContent className="flex items-center justify-between">
         <div>
           <p className="text-fg-muted text-[12px] uppercase tracking-[0.05em] font-[var(--font-geist)]">{title}</p>
           <p className="text-fg text-[32px] font-[var(--font-cormorant)] mt-1 [font-feature-settings:'tnum'_1]">{value}</p>
         </div>
         <div className="text-accent">{icon}</div>
       </CardContent>
     </Card>
     ```
     Note: dropped the per-color treatment (blue/green/red/gold/purple). All accents are gold (`text-accent`). Live-pulse on the live-visitors icon becomes a single `<span className="inline-flex h-2 w-2 rounded-full bg-success animate-pulse" />` indicator next to the value, replacing the colored background pulse.
   - Replace "Recent Orders" `<div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">` block with:
     ```tsx
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle>Recent Orders</CardTitle>
         <Link href="/admin/orders" className="text-accent hover:text-accent-deep text-[12px] uppercase tracking-[0.05em] font-[var(--font-geist)]">View all →</Link>
       </CardHeader>
       <CardContent>
         <Table.Root>
           <Table.Header>
             <Table.Row>
               <Table.HeaderCell>Order</Table.HeaderCell>
               <Table.HeaderCell>Customer</Table.HeaderCell>
               <Table.HeaderCell>Date</Table.HeaderCell>
               <Table.HeaderCell align="right">Total</Table.HeaderCell>
               <Table.HeaderCell>Status</Table.HeaderCell>
             </Table.Row>
           </Table.Header>
           <Table.Body>
             {recentOrders.length === 0 ? (
               <Table.Empty colSpan={5}>
                 <div className="flex flex-col items-center gap-2">
                   <ShoppingBag className="h-12 w-12 text-fg-muted" strokeWidth={1.5} />
                   <p className="text-fg">No orders yet</p>
                   <p className="text-fg-muted text-[14px]">Orders will appear here after customers purchase</p>
                 </div>
               </Table.Empty>
             ) : (
               recentOrders.map(order => (
                 <Table.Row key={order.id}>
                   <Table.Cell><span className="font-mono text-[13px]">#{order.stripe_session_id?.slice(-8).toUpperCase() ?? order.id.slice(0,8).toUpperCase()}</span></Table.Cell>
                   <Table.Cell>{order.customer_name ?? order.customer_email}</Table.Cell>
                   <Table.Cell>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Table.Cell>
                   <Table.Cell align="right">€{(order.total/100).toFixed(2)}</Table.Cell>
                   <Table.Cell><Badge variant={order.status === 'paid' ? 'success' : 'neutral'}>{order.status}</Badge></Table.Cell>
                 </Table.Row>
               ))
             )}
           </Table.Body>
         </Table.Root>
       </CardContent>
     </Card>
     ```
   - Replace "Recent Products" with the same `<Card>` + `<Table>` pattern (Header: Product, Category, Type, Price [right-aligned], Stock [Badge]).
   - Replace "Quick Actions" with three `<Card interactive>` wrappers each holding the `<Link>` + icon + `<CardTitle>` + `<CardDescription>`. The hover treatment is `Card`'s `interactive` variant (`hover:shadow-1`) — no more `hover:border-gold/50` (banned class).
   - Replace loading state: `{loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <Skeleton key={i} variant="rect" height={120} />)}</div> : <ActualContent />}`. The h1 + subtitle stay visible.
   - Replace error state: in the `catch` block of `fetchData`, call `toast({ variant: 'error', title: 'Error loading data', description: e instanceof Error ? e.message : 'Failed to load data' })`. Remove the `error` state variable + the JSX `{error && ...}` block entirely.
   - Re-import statements: add `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Skeleton, Table, useToast } from '@/components/ui'`. Remove the legacy `bg-gold`-flavored classes from any remaining JSX.
   - Update h1: `<h1 className="text-fg text-[28px] font-[var(--font-cormorant)]">Dashboard</h1>` + `<p className="text-fg-muted mt-1 font-[var(--font-newsreader)]">Welcome to your store admin panel</p>`.
6. Test in dev:
   - `npm run dev`.
   - Visit `/admin` → login → confirm dashboard renders correctly with the new primitives. Resize browser to 375px / 768px / 1280px — no horizontal overflow, no broken layout.
   - Visit `/admin/_design` → confirm every primitive section renders. Click sort header → arrows toggle. Click dialog trigger → dialog opens with focus trapped, Esc closes, scrim click closes, focus returns to trigger. Click drawer trigger → drawer slides from right. Click each toast trigger → toast appears top-right, auto-dismisses (or doesn't for error variant). Tab through all interactive elements → focus rings visible.
   - Open browser console — no errors.
7. Run `npx tsc --noEmit` and `npm run lint`. Both must exit 0.
8. Run the design-laws grep against both modified files:
   - `grep -rEn '#[0-9a-fA-F]{3,6}|rgba?\(|text-gold|bg-gold|text-gray-[0-9]|bg-gray-[0-9]|border-gray-[0-9]' src/app/admin/page.tsx src/app/admin/_design/page.tsx | wc -l` must equal `0`.
   - If the count is non-zero, list the offending lines and remove them. No exceptions.

**Validation:**
- `test -f src/app/admin/_design/page.tsx && echo SHOWCASE_EXISTS` → `SHOWCASE_EXISTS`
- `grep -cE '^export' src/components/ui/index.ts` → `≥ 19` (barrel populated with one export line per primitive family)
- `grep -oE '\b(Button|IconButton|Input|Textarea|Select|Checkbox|RadioGroup|Switch|Card|Badge|Tag|Avatar|Tooltip|Skeleton|Dialog|Drawer|Tabs|Toaster|Popover|Table)\b' src/components/ui/index.ts | sort -u | wc -l` → `≥ 19` (all 19 primitive names referenced in barrel exports; `Radio` may appear as `RadioGroup`)
- `grep -cE 'Button|IconButton|Input|Textarea|Select|Checkbox|Radio|Switch|Card|Badge|Tag|Avatar|Tooltip|Skeleton|Dialog|Drawer|Tabs|Toast|Popover|Table' src/app/admin/_design/page.tsx` → `≥ 19` (all primitive names referenced)
- `grep -cE "from '@/components/ui'" src/app/admin/_design/page.tsx` → `≥ 1`
- `grep -cE 'Card|Table|Badge|Skeleton' src/app/admin/page.tsx` → `≥ 4` (at least 3 primitives integrated — actually 4+ confirmed)
- `grep -rEn '#[0-9a-fA-F]{3,6}|rgba?\(|text-gold|bg-gold|text-gray-[0-9]|bg-gray-[0-9]|border-gray-[0-9]' src/app/admin/page.tsx src/app/admin/_design/page.tsx | wc -l` → `0`
- `grep -c 'function StatCard' src/app/admin/page.tsx` → `0` (legacy StatCard removed)
- `grep -c 'bg-red-500\|bg-green-500\|bg-blue-500\|bg-purple-500' src/app/admin/page.tsx` → `0` (legacy color soup gone)
- `npx tsc --noEmit 2>&1 | grep -c 'error TS'` → `0`
- `npm run lint 2>&1 | grep -c 'error'` → `0`
- Manual: visit `/admin/_design` and `/admin` in dev, confirm zero console errors and visual correctness at 375px / 768px / 1280px viewports.

**Context:** Read
- @.planning/DESIGN.md (full)
- @.planning/PRODUCT.md (voice: restrained — error toast wording follows the brand voice: "We couldn't load the dashboard. Refresh and try again." NOT "Error!" or "Oops!")
- @~/.claude/qualia-design/design-product.md (Empty data: icon + sentence + action; Toasts 5s+ auto-dismiss with errors persistent; Skeleton not spinner)
- @src/app/admin/page.tsx (the file being migrated; ~390 LOC; read fully before editing)
- @src/app/admin/layout.tsx (admin shell — confirm `_design` route inherits cleanly)
- @src/components/ui/index.ts (current Task 1 stub — overwrite target; confirm what Task 1 left here before replacing)
- @src/components/ui/Button.tsx, @src/components/ui/Card.tsx, @src/components/ui/Radio.tsx, @src/components/ui/Select.tsx, @src/components/ui/Toast.tsx, @src/components/ui/Table.tsx (and the other primitive files — confirm exact named-export names before writing the barrel so re-exports resolve)
- @src/middleware.ts (verify `/admin/_design` is gated by existing admin matcher)

**Design:**
- Register: product (admin surfaces)
- Tokens used: all of them. The showcase is the most comprehensive consumer of the token system in the codebase. Every primitive's token set applies here.
- Scope: page (showcase + admin dashboard) + barrel file
- Anti-pattern guard: builder runs the design-laws grep chain (step 8 above) on both files pre-commit; commit blocked on any hit. Plus visual QA at 3 viewports — broken layout at any one blocks. Plus: confirm the `_design` route is not exposed publicly (it lives under `/admin/*` which middleware gates; verify the matcher in `src/middleware.ts` includes it).

---

## Success Criteria
- [ ] 19 primitives exist under `src/components/ui/` — Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Card, Badge, Tag, Avatar, Tooltip, Skeleton, Dialog, Drawer, Tabs, Toast, Popover, Table (counting Table as one primitive even though it has 8 compound parts).
- [ ] `src/components/ui/index.ts` exports all 19 primitives (populated by Task 5; not touched by Tasks 2-4 to preserve Wave 1 parallel safety).
- [ ] Every interactive primitive supports the 7 states (default, hover, focus-visible, active, disabled, loading, error) — verified visually in the `_design` showcase route.
- [ ] Drawer + Dialog implement focus trap, Escape-to-close, scrim-click-to-close, and body-scroll-lock — Radix Dialog provides all four; verified manually in showcase.
- [ ] All primitives are keyboard-navigable — verified by tabbing through the showcase route with zero mouse usage.
- [ ] `src/app/admin/_design/page.tsx` exists and renders every primitive in every state.
- [ ] `src/app/admin/page.tsx` integrates ≥ 3 primitives (actually 4+: Card, Table, Badge, Skeleton, plus Toast pathway) replacing the previous ad-hoc Tailwind.
- [ ] No raw hex, no `rgba(...)` shadows, no banned fonts (Inter/Playfair/Poppins/Arial/Helvetica/Roboto/system-ui), no legacy palette classes (`text-gold`/`bg-gold`/`text-gray-*`/`bg-gray-*`) in any of the 25 modified files.
- [ ] `npx tsc --noEmit` exits 0 across the codebase.
- [ ] `npm run lint` exits 0.
- [ ] Admin dashboard renders correctly at 375px, 768px, 1280px viewports with zero console errors.

---

## Verification Contract

### Contract for Task 1 — Form primitives (file existence)
**Check type:** file-exists
**Command:** `test -f src/components/ui/Button.tsx && test -f src/components/ui/IconButton.tsx && test -f src/components/ui/Input.tsx && test -f src/components/ui/Textarea.tsx && test -f src/components/ui/Select.tsx && test -f src/components/ui/Checkbox.tsx && test -f src/components/ui/Radio.tsx && test -f src/components/ui/Switch.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Any of the 8 files missing

### Contract for Task 1 — Barrel stub created (no exports yet)
**Check type:** command-exit
**Command:** `test -f src/components/ui/index.ts && grep -c "^export" src/components/ui/index.ts`
**Expected:** File exists and returns `0` (Task 1 creates the stub but adds NO exports — Task 5 owns export population)
**Fail if:** File missing OR Task 1 added exports (would create write-conflict with Task 5)

### Contract for Task 1 — Form primitives (no banned tokens)
**Check type:** command-exit
**Command:** `grep -rEn '#[0-9a-fA-F]{3,6}|rgba?\(|text-gold|bg-gold|border-gold|text-gray-[0-9]|bg-gray-[0-9]|border-gray-[0-9]|font-family:\s*(Inter|Playfair|Poppins|Arial|Helvetica|Roboto|system-ui)' src/components/ui/Button.tsx src/components/ui/IconButton.tsx src/components/ui/Input.tsx src/components/ui/Textarea.tsx src/components/ui/Select.tsx src/components/ui/Checkbox.tsx src/components/ui/Radio.tsx src/components/ui/Switch.tsx | wc -l`
**Expected:** `0`
**Fail if:** Any banned hex, banned font, banned palette class, or rgba present

### Contract for Task 1 — Form primitives (7 states wired)
**Check type:** grep-match
**Command:** `grep -cE 'focus-visible:ring|disabled:opacity|aria-busy|aria-invalid' src/components/ui/Button.tsx src/components/ui/Input.tsx`
**Expected:** Each file ≥ 2 (focus + disabled in Button; focus + invalid in Input)
**Fail if:** Any state wiring missing

### Contract for Task 1 — twMerge added
**Check type:** grep-match
**Command:** `grep -c "tailwind-merge" src/lib/utils.ts && grep -c "tailwind-merge" package.json`
**Expected:** Both ≥ 1
**Fail if:** twMerge not installed or not wired into `cn()`

### Contract for Task 2 — Display primitives (file existence)
**Check type:** file-exists
**Command:** `test -f src/components/ui/Card.tsx && test -f src/components/ui/Badge.tsx && test -f src/components/ui/Tag.tsx && test -f src/components/ui/Avatar.tsx && test -f src/components/ui/Tooltip.tsx && test -f src/components/ui/Skeleton.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Any of the 6 files missing

### Contract for Task 2 — Card compound shape
**Check type:** grep-match
**Command:** `grep -cE 'export (function|const) (Card|CardHeader|CardTitle|CardDescription|CardContent|CardFooter)' src/components/ui/Card.tsx`
**Expected:** `≥ 6`
**Fail if:** Compound parts not all exported

### Contract for Task 2 — Badge variants present
**Check type:** grep-match
**Command:** `grep -cE "neutral|accent|success|warning|critical" src/components/ui/Badge.tsx`
**Expected:** `≥ 5` (all variants referenced)
**Fail if:** Variant set incomplete

### Contract for Task 2 — No banned tokens
**Check type:** command-exit
**Command:** `grep -rEn '#[0-9a-fA-F]{3,6}|rgba?\(|text-gold|bg-gold|text-gray-[0-9]|bg-gray-[0-9]|border-gray-[0-9]' src/components/ui/Card.tsx src/components/ui/Badge.tsx src/components/ui/Tag.tsx src/components/ui/Avatar.tsx src/components/ui/Tooltip.tsx src/components/ui/Skeleton.tsx | wc -l`
**Expected:** `0`
**Fail if:** Any banned token present

### Contract for Task 2 — Barrel untouched
**Check type:** command-exit
**Command:** `git diff --name-only HEAD src/components/ui/index.ts 2>/dev/null | wc -l`
**Expected:** `0` for Task 2's commit specifically (Task 2 must NOT modify the barrel; that's Task 5's job to prevent Wave 1 write-conflict)
**Fail if:** Task 2's commit shows `src/components/ui/index.ts` as modified

### Contract for Task 3 — Overlay primitives (file existence)
**Check type:** file-exists
**Command:** `test -f src/components/ui/Dialog.tsx && test -f src/components/ui/Drawer.tsx && test -f src/components/ui/Tabs.tsx && test -f src/components/ui/Toast.tsx && test -f src/components/ui/Popover.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Any of the 5 files missing

### Contract for Task 3 — Radix Dialog wired
**Check type:** grep-match
**Command:** `grep -cE "@radix-ui/react-dialog" src/components/ui/Dialog.tsx src/components/ui/Drawer.tsx`
**Expected:** Both ≥ 1
**Fail if:** Radix not used as base (custom focus-trap implementation likely missing browser support)

### Contract for Task 3 — Toast default 5s
**Check type:** grep-match
**Command:** `grep -cE "5000|DEFAULT_TOAST_DURATION" src/components/ui/Toast.tsx`
**Expected:** `≥ 1`
**Fail if:** Auto-dismiss duration not 5s (violates design-product.md)

### Contract for Task 3 — Layout wraps Toaster + TooltipProvider
**Check type:** grep-match
**Command:** `grep -cE "Toaster|TooltipProvider" src/app/layout.tsx`
**Expected:** `≥ 2`
**Fail if:** App shell doesn't expose toast surface or tooltip context

### Contract for Task 3 — Scrim uses only-allowed deviation
**Check type:** command-exit
**Command:** `grep -E "oklch\(0\.10 0 0 / 0\.5\)|bg-\[oklch\(0\.10_0_0/0\.5\)\]" src/components/ui/Dialog.tsx src/components/ui/Drawer.tsx | wc -l`
**Expected:** `≥ 1` (the documented scrim deviation is present)
**Fail if:** Scrim missing or implemented with rgba

### Contract for Task 3 — Barrel untouched
**Check type:** command-exit
**Command:** `git diff --name-only HEAD src/components/ui/index.ts 2>/dev/null | wc -l`
**Expected:** `0` for Task 3's commit specifically (Task 3 must NOT modify the barrel)
**Fail if:** Task 3's commit shows `src/components/ui/index.ts` as modified

### Contract for Task 4 — Table compound
**Check type:** grep-match
**Command:** `grep -cE "Root|Header|Body|Row|HeaderCell|Cell|SortHeader|Empty" src/components/ui/Table.tsx`
**Expected:** `≥ 8`
**Fail if:** Compound parts missing

### Contract for Task 4 — Sticky header + tabular numerals
**Check type:** grep-match
**Command:** `grep -cE "sticky|tnum" src/components/ui/Table.tsx`
**Expected:** `≥ 2`
**Fail if:** Sticky header or tabular numerals missing — violates DESIGN.md §5 and design-product.md

### Contract for Task 4 — SortHeader a11y
**Check type:** grep-match
**Command:** `grep -cE "aria-sort" src/components/ui/Table.tsx`
**Expected:** `≥ 1`
**Fail if:** Sort accessibility attribute missing

### Contract for Task 4 — Barrel untouched
**Check type:** command-exit
**Command:** `git diff --name-only HEAD src/components/ui/index.ts 2>/dev/null | wc -l`
**Expected:** `0` for Task 4's commit specifically (Task 4 must NOT modify the barrel)
**Fail if:** Task 4's commit shows `src/components/ui/index.ts` as modified

### Contract for Task 5 — Barrel populated with all 19 primitives
**Check type:** grep-match
**Command:** `grep -cE '^export' src/components/ui/index.ts`
**Expected:** `≥ 19`
**Fail if:** Fewer than 19 export lines — at least one primitive family missing from the barrel

### Contract for Task 5 — Barrel references every primitive file
**Check type:** grep-match
**Command:** `grep -oE "from './(Button|IconButton|Input|Textarea|Select|Checkbox|Radio|Switch|Card|Badge|Tag|Avatar|Tooltip|Skeleton|Dialog|Drawer|Tabs|Toast|Popover|Table)'" src/components/ui/index.ts | sort -u | wc -l`
**Expected:** `≥ 19`
**Fail if:** Any of the 19 primitive source files not re-exported from the barrel

### Contract for Task 5 — Barrel exports compile
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -E "src/components/ui/index\.ts" | wc -l`
**Expected:** `0` (no TypeScript errors on the barrel — every re-export resolves)
**Fail if:** Barrel has unresolved re-exports (typo or named-export mismatch)

### Contract for Task 5 — Showcase route
**Check type:** file-exists
**Command:** `test -f src/app/admin/_design/page.tsx && echo EXISTS`
**Expected:** `EXISTS`
**Fail if:** Showcase route not created

### Contract for Task 5 — Showcase imports all 19 primitives
**Check type:** grep-match
**Command:** `grep -oE "Button|IconButton|Input|Textarea|Select|Checkbox|Radio|Switch|Card|Badge|Tag|Avatar|Tooltip|Skeleton|Dialog|Drawer|Tabs|Toast|Popover|Table" src/app/admin/_design/page.tsx | sort -u | wc -l`
**Expected:** `≥ 19`
**Fail if:** Showcase doesn't render every primitive

### Contract for Task 5 — Admin dashboard integration (wiring)
**Check type:** grep-match
**Command:** `grep -cE "from '@/components/ui'" src/app/admin/page.tsx`
**Expected:** `≥ 1`
**Fail if:** Admin page doesn't import the primitive library

### Contract for Task 5 — Admin uses ≥ 3 primitives
**Check type:** grep-match
**Command:** `grep -oE "<(Card|CardHeader|CardTitle|CardDescription|CardContent|CardFooter|Table\.Root|Table\.Header|Table\.Body|Table\.Row|Table\.HeaderCell|Table\.Cell|Table\.Empty|Badge|Skeleton)\b" src/app/admin/page.tsx | sort -u | wc -l`
**Expected:** `≥ 3` (PRIM-05 minimum; actual will be higher)
**Fail if:** Admin page hasn't actually integrated the primitives

### Contract for Task 5 — Legacy StatCard removed
**Check type:** command-exit
**Command:** `grep -c "function StatCard" src/app/admin/page.tsx`
**Expected:** `0`
**Fail if:** Legacy inline StatCard component still present (the migration was partial)

### Contract for Task 5 — No banned tokens in modified pages
**Check type:** command-exit
**Command:** `grep -rEn '#[0-9a-fA-F]{3,6}|rgba?\(|text-gold|bg-gold|border-gold|text-gray-[0-9]|bg-gray-[0-9]|border-gray-[0-9]|bg-red-500|bg-green-500|bg-blue-500|bg-purple-500' src/app/admin/page.tsx src/app/admin/_design/page.tsx | wc -l`
**Expected:** `0`
**Fail if:** Any banned token, palette class, or legacy color in the migrated pages

### Contract for Phase 3 — TypeScript clean
**Check type:** command-exit
**Command:** `npx tsc --noEmit 2>&1 | grep -c "error TS"`
**Expected:** `0`
**Fail if:** Any TypeScript error introduced by this phase

### Contract for Phase 3 — Lint clean
**Check type:** command-exit
**Command:** `npm run lint 2>&1 | grep -cE "error|warning"`
**Expected:** `0` (or no new errors compared to pre-phase baseline if existing warnings persist)
**Fail if:** New lint errors introduced

### Contract for Phase 3 — Admin dashboard renders
**Check type:** behavioral
**Command:** Verifier runs `npm run dev`, logs into `/admin`, observes the dashboard at 375px / 768px / 1280px viewports.
**Expected:** No console errors; dashboard renders with the new primitive system (Card, Table, Badge, Skeleton visible); layout intact at all three viewports; data still loads (same Supabase queries).
**Fail if:** Console errors, broken layout at any viewport, missing data, or visible regression from pre-phase admin

### Contract for Phase 3 — Showcase route renders
**Check type:** behavioral
**Command:** Verifier visits `/admin/_design` while logged in, tabs through every interactive element, triggers a Dialog/Drawer/Toast/Popover, clicks a sortable Table column header.
**Expected:** Every primitive renders in every state; focus rings visible on tab; Dialog/Drawer trap focus, Esc closes, scrim click closes, focus returns to trigger; Toast auto-dismisses at 5s (success/default) and persists (error); Table sort header toggles asc/desc.
**Fail if:** Any primitive missing, any state untested-able, any overlay misses focus management
