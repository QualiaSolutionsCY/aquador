# DESIGN — Aquad'or v3.0

## §1. Direction (the commit)

**Aesthetic direction:** `editorial-luxury, Levant-coded`

Not "modern luxury", not "minimal premium". Editorial means the page reads like a journal spread — generous margins, considered type hierarchy, ornament used sparingly. Levant-coded means the warmth and geometric restraint of Beirut / Limassol design culture, not Parisian glacial minimalism and not Vegas casino gold.

**Color strategy:** `Committed` — one signature warm-gold tone, neutrals tinted toward it (chroma 0.005-0.015), one supporting accent for editorial moments (oxblood for sale prices and accents), no third anchor.

**Scene sentence:**
> A buyer at midday in Limassol, scrolling on an iPhone in a beachfront café, comparing three perfumes before choosing one as an anniversary gift. The page feels less like a shop and more like reading curated correspondence.

**Differentiation (24h memory):**
> "Reading a perfume's page felt like opening a letter from someone who knows scent."

If the page makes you say "elegant Shopify store", we failed. The reaction we're aiming for is "wait, where did they find this".

---

## §2. Color (OKLCH only)

All colors expressed in OKLCH. CSS custom properties live in `src/styles/tokens.css`. No raw `#000` / `#fff` / named hex anywhere in the codebase.

### Anchor palette (commitment — refinable in tokens.css)

```css
:root {
  /* Ink — primary background canvas */
  --color-ink: oklch(0.16 0.018 80);          /* near-black warm; reads as deep saddle */
  --color-ink-soft: oklch(0.22 0.020 80);
  --color-ink-rich: oklch(0.10 0.015 80);

  /* Bone — surface */
  --color-bone: oklch(0.97 0.008 80);         /* warm off-white, paper-like */
  --color-bone-soft: oklch(0.94 0.012 80);
  --color-parchment: oklch(0.91 0.024 78);    /* alt surface, slightly more pigment */

  /* Aged gold — signature accent */
  --color-gold: oklch(0.72 0.135 82);         /* restrained; never neon */
  --color-gold-soft: oklch(0.82 0.090 82);
  --color-gold-deep: oklch(0.58 0.130 78);

  /* Oxblood — editorial accent, used SPARINGLY */
  --color-oxblood: oklch(0.40 0.140 25);
  --color-oxblood-soft: oklch(0.55 0.110 25);

  /* Tinted neutrals — all chroma 0.005-0.015, h=80 (toward gold) */
  --color-neutral-50:  oklch(0.98 0.005 80);
  --color-neutral-100: oklch(0.95 0.006 80);
  --color-neutral-200: oklch(0.90 0.008 80);
  --color-neutral-300: oklch(0.82 0.010 80);
  --color-neutral-400: oklch(0.70 0.012 80);
  --color-neutral-500: oklch(0.55 0.013 80);
  --color-neutral-600: oklch(0.42 0.014 80);
  --color-neutral-700: oklch(0.32 0.012 80);
  --color-neutral-800: oklch(0.22 0.010 80);
  --color-neutral-900: oklch(0.14 0.008 80);

  /* Semantic — never raw colors in components */
  --bg: var(--color-bone);
  --bg-alt: var(--color-parchment);
  --fg: var(--color-ink);
  --fg-muted: var(--color-neutral-500);
  --accent: var(--color-gold);
  --accent-deep: var(--color-gold-deep);
  --critical: var(--color-oxblood);
  --border: var(--color-neutral-200);
  --border-strong: var(--color-neutral-300);
}

[data-theme="dark"] {
  --bg: var(--color-ink);
  --bg-alt: var(--color-ink-soft);
  --fg: var(--color-bone);
  --fg-muted: var(--color-neutral-400);
  --border: var(--color-neutral-700);
  --border-strong: var(--color-neutral-600);
}
```

### Contrast (AA verified during 1.1)
- `--fg` on `--bg`: ≥ 12:1
- `--fg-muted` on `--bg`: ≥ 4.5:1
- `--accent` on `--bg`: ≥ 4.5:1 for text usage (only used as text on titles + small UI; large CTAs use `--accent-deep` against `--bg` for guaranteed AA)

---

## §3. Typography

**Display (headings + editorial):** `Cormorant Garamond` (or `Fraunces` as alternate if loadable on Google Fonts) — high-contrast serif with strong italic personality. NOT Playfair (overused).

**Body:** `Newsreader` (Google Fonts) — refined serif body, optical sizing supported. Falls back to system serif. **Body is serif, NOT sans** — this is part of the editorial commitment. Sans is reserved for one role: micro-UI labels.

**Micro / UI labels:** `Geist` (Google Fonts) at small size only — buttons, badges, tags, table headers. Avoid in long-form copy.

**Banned:** Inter, Playfair Display, Poppins, Arial, Helvetica, Roboto, system-ui, Space Grotesk, Lato, Open Sans, Montserrat.

### Scale (fluid clamp())

```css
--font-display-3xl: clamp(2.5rem, 5vw + 1rem, 5rem);     /* hero */
--font-display-2xl: clamp(2rem, 4vw + 0.5rem, 3.5rem);
--font-display-xl: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
--font-h1: clamp(2rem, 3vw + 0.5rem, 3rem);
--font-h2: clamp(1.5rem, 2vw + 0.5rem, 2.25rem);
--font-h3: clamp(1.25rem, 1.5vw + 0.5rem, 1.75rem);
--font-body-lg: clamp(1.125rem, 0.5vw + 1rem, 1.25rem);
--font-body: 1rem;            /* 16px floor */
--font-body-sm: 0.875rem;     /* 14px — captions */
--font-micro: 0.75rem;        /* 12px — UI labels */
```

### Weights
- Display: 400 (regular) and 500 (medium); italics used for ornament.
- Body: 400 default, 500 for emphasis. Avoid 700+ in body — editorial restraint.
- Micro: 500 medium uppercase (tracking 0.05em) for buttons / labels.

### Tracking
- Display: -0.01em to -0.02em (tight)
- Body: 0 (default)
- Micro UPPERCASE: 0.05em to 0.08em

---

## §4. Spacing

8px grid. Use `--space-*` tokens, never magic px values in components.

```css
--space-1: 0.25rem;   /*  4px */
--space-2: 0.5rem;    /*  8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

**Page padding (fluid):**
```css
--page-px: clamp(1rem, 4vw, 4rem);   /* horizontal */
--page-py: clamp(2rem, 6vw, 6rem);   /* vertical */
```

**Container widths:**
```css
--container-narrow: 42rem;   /* editorial reading width — blog, copy-heavy */
--container-prose: 56rem;    /* PDP main column */
--container-wide: 72rem;     /* shop grid */
--container-full: 80rem;     /* admin tables */
```

---

## §5. Components (token-driven specs)

Primitive specs live with the components in `src/components/ui/`. The contracts:

- **Button** — uses `--accent` / `--accent-deep` / `--neutral-200` for surfaces; tracking 0.05em uppercase Geist micro at 12px; 44px+ min touch target; `--radius-sm` (4px); subtle `--shadow-1` on hover only.
- **Input** — 1px border `--border-strong`, 8px radius, body font, 12px vertical padding; focus shows 2px `--accent` ring offset 2px; error state ring `--critical`.
- **Card** — `--bg-alt` surface, no border by default, `--shadow-1` on interactive hover only; padding `--space-6`.
- **Table** — sticky header on `--bg-alt`, body rows on `--bg`, 1px bottom border `--border` per row; hover row gets `--bg-alt`.
- **Drawer / Dialog** — scrim is `oklch(0.10 0 0 / 0.5)` (true black at 50%, the one allowed deviation from tinted neutrals because scrims read better black); surface `--bg`; max-width 28rem drawer, 32rem dialog.
- **Badge / Tag** — micro UPPERCASE 11-12px, padding 4×8, tinted by semantic intent.

Full primitive renderings happen in Phase 1.3.

---

## §6. Depth (3-level shadow elevation)

Tinted, NOT gray. Build from the gold-warm hue.

```css
--shadow-1: 0 1px 2px oklch(0.20 0.010 80 / 0.08), 0 1px 4px oklch(0.20 0.010 80 / 0.06);
--shadow-2: 0 4px 8px oklch(0.20 0.010 80 / 0.10), 0 2px 4px oklch(0.20 0.010 80 / 0.06);
--shadow-3: 0 12px 24px oklch(0.20 0.010 80 / 0.14), 0 4px 8px oklch(0.20 0.010 80 / 0.08);
```

Use `--shadow-1` on interactive hover, `--shadow-2` on cards-in-motion, `--shadow-3` on overlays (Drawer / Dialog / Popover).

---

## §7. Motion

Slow and deliberate. No bounce. Respect `prefers-reduced-motion`.

```css
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);

--duration-fast: 150ms;
--duration-base: 250ms;
--duration-slow: 400ms;
--duration-slowest: 700ms;

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

**Bans:** spring physics with overshoot, scale-up-then-down "pop" animations on appearance, automatic carousel rotation, parallax that fights scroll velocity.

---

## §8. Iconography

ONE family: `lucide-react` at stroke-width 1.5 (slightly lighter than default 2 for editorial feel), 20-24px sizes. No mixing with `@heroicons` or `react-icons`.

For ornament icons (perfume bottle, fragrance family glyphs in editorial sections), commission or source a small set of SVG line illustrations — kept consistent in stroke + style. Not in M1 scope; deferred to M2.

---

## §9. Responsive

Mobile-first. Three breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px (sparingly)

**Touch targets:** ≥ 44px on every interactive element below `md`. Buttons get `min-h-11` and adequate `px`.

Test viewports: 375px (iPhone SE/13 mini), 768px (iPad portrait), 1280px (laptop), 1440px (desktop). Visual QA checks all four every phase that touches layout.

---

## §10. Anti-pattern checklist (auto-runnable in M1.1)

Tokens fail validation if any of these are true:

- ❌ Any `#000` or `#fff` literal in `tokens.css` or component files
- ❌ Any `rgb(...)` or `rgba(...)` literal (use OKLCH)
- ❌ `font-family: Inter` / `Playfair Display` / `Poppins` / `Arial` / `Helvetica` / `Roboto` / `system-ui` in CSS
- ❌ Magic-string Tailwind colors (`text-gold-500`, `bg-yellow-300`) in components — must use semantic `text-fg`, `bg-accent`, etc.
- ❌ Shadow expressed with `rgba(0,0,0,...)` — must be tinted OKLCH
- ❌ Border-radius > 16px on any primitive (we're editorial, not fintech rounded)
- ❌ Animation duration > 1000ms
- ❌ Generic carousel autoplay
- ❌ Default shadcn Button rendered without customisation

A short shell-script lives in `scripts/design-laws-check.sh` (added in 1.1) that greps for these and exits non-zero on hit. Wired into pre-commit via lint task.

---

## §11. Brand continuity

Aquad'or's gold doesn't disappear — it stops being the "gold-on-black casino" form and becomes the warm signature against bone/parchment. The brand mark stays; the brand voice (editorial-luxury, Levant-coded) is what changes.

References to LOOK AT (not copy):
- Aesop — page rhythm, generous margins, restrained accent (we're warmer)
- Le Labo — editorial product copy, ornament restraint (we're more openly luxurious)
- Maison Margiela 'Replica' — atmospheric scene-led PDPs (we're closer to this than to Aesop)
- Diptyque — typographic restraint with ornament moments (closest match)

Anti-references (do NOT look like):
- Generic Shopify perfume stores
- "Casino luxury" gold-on-black perfume sites with red sale banners
- Glossier-coded pastel-and-rounded perfume e-comm
- Aggressive discount-coded landing pages
