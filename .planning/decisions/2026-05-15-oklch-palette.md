---
adr: "oklch-palette"
title: "OKLCH-first palette over HSL and hex"
date: 2026-05-17
status: Accepted
deciders: Fawzi Goussous (Qualia)
---

# ADR-02: OKLCH-first palette over HSL and hex

## Context

The v2.0 storefront used a gold-on-dark palette expressed as raw hex values
(`#D4AF37`, `#FFD700`, `#0a0a0a`, `#1a1a1a`) and `rgba()` literals scattered
across component classnames and inline styles. The result was a palette that
was visually inconsistent across surfaces (the same "gold" rendered three
different ways depending on the underlying surface), impossible to dark-mode
or theme, and untestable for accessibility contrast without manual
spot-checks.

The v3.0 reset needed a color system that:

1. Survives a wide-gamut display future (Display P3 capable hardware is
   shipping in laptops and phones; sRGB-only palettes leave color on the table).
2. Carries tinted neutrals (a warm parchment surface, a cool ink for body
   copy) that are perceptually distinct from a hex-encoded grey scale.
3. Has a single source of truth so a color change propagates without
   grep-and-replace.

OKLCH is the perceptually uniform color space supported by all modern
browsers (Safari 15.4+, Chrome 111+, Firefox 113+). Tailwind 3.4+ supports
OKLCH directly in `tailwind.config.ts` color tokens. The cost is operator
familiarity: designers and copywriters used to hex pickers need to read
lightness, chroma, and hue values instead.

## Decision

All color tokens are expressed in OKLCH. CSS custom properties live in
`src/styles/tokens.css`. Component code references colors via Tailwind
utility classes that resolve to those tokens (`bg-bg`, `bg-bg-alt`,
`text-ink`, `border-border`, `text-accent`). No raw hex appears in
component source files except for vendor surfaces we do not own (Stripe
hosted Checkout, third-party iframes).

Validation: `grep -rn "#[0-9a-fA-F]" src/components/` returns only
documented exceptions. CSS-level token definitions in
`src/styles/tokens.css` and `src/app/globals.css` use OKLCH literals
(see `globals.css:456-470` for the loading-shimmer gradient expressed
as `oklch(85% 0.11 90)` stops).

## Consequences

What this buys us:

- A single token edit propagates to every consumer. Renaming the brand
  accent does not require a 200-file grep.
- AA contrast can be verified mathematically against the OKLCH lightness
  channel rather than empirically against rendered hex.
- Tinted neutrals (the parchment `bg-alt`, the warm ink, the muted
  hairline) are perceptually distinct from a flat grey scale, which is
  the difference between editorial-luxury and casino-luxury rendering.
- Future-proof: when Display P3 becomes the assumed gamut, the same
  tokens render with wider chroma on capable hardware automatically.

What this costs:

- Designers unfamiliar with OKLCH need a brief orientation. The DESIGN.md
  §2 section serves as that primer.
- Raw hex appearing in a PR is now a lint failure rather than a style
  preference. New contributors will hit this once and learn it.
- Wide-gamut benefit is only realized on Display P3 capable hardware.
  On sRGB displays the rendering is identical to a well-chosen sRGB
  palette, so this is upside, not downside.

## Reverting Criteria

Revert to a hex-first palette only if one of these conditions holds:

1. OKLCH browser support regresses below the Safari 16.4 floor on any
   supported browser version. This is not currently in play and would
   require a vendor-level breaking change.
2. A tooling shift makes hex tokens easier to maintain than OKLCH
   tokens (for example, a future Tailwind release that drops OKLCH
   parsing). The reverse trend is current; tooling is moving toward
   OKLCH support, not away.
3. A specific brand requirement mandates a Pantone-specified color
   that cannot be approximated in OKLCH within delta-E tolerance.
   Aquad'or has no such requirement; the brand palette was designed
   in OKLCH from the start.

None of these conditions is currently observed. The OKLCH palette has
held through Milestone 2 storefront and Milestone 3 admin without
operator complaint or browser-compatibility incident.

## References

- `PROJECT.md` line 119 (Key Decisions row, v3.0 entry: OKLCH-first
  palette, no raw hex).
- `DESIGN.md` §2 "Color (OKLCH only)" lines 21 through 60 (the token
  contract).
- `DESIGN.md` lines 238 through 244 (token validation rules: no raw
  hex, no rgb/rgba literals, no untinted shadows).
- `src/styles/tokens.css` (CSS custom property definitions).
- `src/app/globals.css` lines 456 through 470 (OKLCH gradient stops
  for loading shimmer).
- `OPTIMIZE.md` POLISH-06 and POLISH-07 (token-migration enforcement
  passes; the C2 row in OPTIMIZE.md catalogs the CookieConsent rewrite
  that swapped `font-playfair` and hex literals for token references).
