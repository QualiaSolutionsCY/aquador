---
adr: "editorial-luxury-direction"
title: "Editorial-luxury design direction (not casino-luxury)"
date: 2026-05-17
status: Accepted
deciders: Fawzi Goussous (Qualia)
---

# ADR-05: Editorial-luxury design direction (not casino-luxury)

## Context

The v2.0 storefront leaned into the standard perfume e-commerce
aesthetic: gold-on-black surfaces, Playfair Display flourish on every
heading, animated bubbles, gradient sweeps, and CTA buttons that
glittered. The result was visually indistinguishable from a hundred
other niche perfume sites and, more critically, from the casino and
gambling sites that share the same gold-luxury visual vocabulary.

The v3.0 reset needed a visual direction that:

1. Differentiates Aquad'or from the gold-on-black cliché so a returning
   visitor recognizes the brand on shape, not on the color of the chrome.
2. Reads as confident rather than insistent. Luxury products do not
   shout. The visual language should mirror the product positioning.
3. Survives operator turnover. A direction that requires a sole
   creative director to maintain is not a direction; it is a person.
   Editorial restraint codifies into rules a future operator can hold.

The trade-off is initial wow-factor on first load. Casino-luxury
generates more "ooh" in the first 300 milliseconds. Editorial restraint
trades that for dwell time on PDP and editorial pages, and for trust
on the checkout step where wow-factor stops mattering and confidence
in the merchant starts mattering.

## Decision

The v3.0 direction is editorial-restrained. The codified rules:

- **Surfaces:** hairline borders over heavy chrome. Card containers
  use `border-border` (a token-defined hairline), not box-shadow.
  Section dividers are 1px rules, not gradient sweeps.
- **Color:** OKLCH tinted neutrals over saturated gold. The brand
  accent is used as a single visual anchor per surface, not as
  pervasive chrome. See ADR-02.
- **Typography:** display font (Cormorant Garamond) for product names
  and editorial headings only. Body copy is a neutral sans (Inter).
  The old `font-playfair` flourish on every heading is gone.
- **Section markers:** numbered editorial markers (`01 / Opening`,
  `02 / Heart`) over decorative ornaments or icon glyphs.
- **Interactive surfaces:** native HTML controls where content is
  read, not interacted with. The FAQ page uses native `<details>`
  elements (see `src/app/faq/page.tsx:194`) rather than animated
  Radix dialogs. This reduces bundle weight, improves keyboard
  accessibility, and matches the editorial register.
- **Voice:** no em-dashes, no en-dashes, no emojis, no exclamation
  marks in customer-visible copy. Hero text, body copy, PDP
  descriptions, microcopy, button labels, tooltips, toast messages,
  email capture text, AI concierge prompts, error states, and empty
  states all follow this rule. Sentence splits, commas, colons, and
  periods replace dash punctuation.

Validation: `grep -rn "font-playfair\|text-gold\|bg-gold"
src/components/` should return only documented legacy holdouts.
Customer-visible copy strings in `src/components/` are scanned for
dash punctuation and return zero hits.

## Consequences

What this buys us:

- A visual direction that holds across the storefront, admin, error
  pages, and emails. The brand reads as one product, not as a
  collection of sites that share a color palette.
- Reduced bundle weight on pages that previously imported animated
  dialog libraries for content that did not need them.
- Improved accessibility on the surfaces that swapped to native
  HTML controls. Native `<details>` is keyboard-navigable and
  screen-reader-friendly by default.
- A copy contract that copywriters can follow without ongoing
  creative-director review. The voice rules are a checklist.

What this costs:

- Reduced wow-factor on first load relative to the casino-luxury
  baseline. Mitigated by the observation that the v2.0 wow-factor
  was not converting; the M4 P1 polish and P2 content launches went
  live without conversion regression.
- Copywriters and designers need orientation toward the
  `DESIGN.md` §10b and §11 banned-surface and brand-continuity
  rules. The orientation is a single read.
- Legacy v2.0 surfaces that bleed through (ChatWidget casino-gold
  bubble, CookieConsent rounded card with `font-playfair`, etc.)
  are visible regressions when they appear, which is the point:
  they are easier to spot and easier to fix. See OPTIMIZE.md C1
  and C2 for the canonical removals.

## Reverting Criteria

Revert to the casino-luxury direction only if:

1. Analytics show the editorial direction is suppressing conversion
   below the v2.0 baseline over a 30-day window with statistically
   significant traffic. Currently this is not observed; M4 P1 and
   P2 launches did not produce a conversion regression.
2. A brand repositioning (a category change, an acquisition, a new
   product line) requires a louder visual register. This would be
   a positioning decision, not a design decision, and warrants its
   own ADR.

Partial reverts (a single surface adopting more chrome for a
specific campaign) are allowed without revisiting this ADR, provided
the §10b voice rules and the §11 brand-continuity rules continue to
hold. Banned chrome on the customer-visible product path requires
this ADR to be revisited.

## References

- `PROJECT.md` line 120 (Key Decisions row, v3.0 entry: editorial-luxury
  direction, NOT casino-luxury").
- `DESIGN.md` §10b "M2 storefront constraints (locked 2026-05-15)"
  lines 254 through 320 (the banned-surface and voice rules).
- `DESIGN.md` §11 "Brand continuity" line 322 onward.
- `OPTIMIZE.md` Critical-1 (ChatWidget casino-gold bubble removal
  from `src/app/layout.tsx`).
- `OPTIMIZE.md` Critical-2 (CookieConsent rewrite from
  `font-playfair` rounded card to hairline-bottom strip).
- `src/app/faq/page.tsx` line 194 (native `<details>` for FAQ
  accordions, per `DESIGN.md` §10b).
- `src/components/ui/ProductCard.tsx` lines 1 through 24 (the
  card-surface comment header that codifies the editorial-restraint
  rules at the component level).
- The user-memory file `feedback_storefront_copy_layout.md` enshrines
  the storefront copy and layout constraints for future Claude
  sessions.
