---
phase: quick
plan: 5
subsystem: frontend-ux
tags: [animations, scroll, parallax, loading-states, framer-motion]
dependency_graph:
  requires: [AnimatedSection, AnimatedSectionItem, ParallaxSection, LuxurySkeleton]
  provides: [consistent-scroll-animations, parallax-cta-bg, loading-states-about-contact-create]
  affects: [homepage, about, contact, create-perfume]
tech_stack:
  added: []
  patterns:
    - AnimatedSection variant="stagger" + AnimatedSectionItem for grids
    - ParallaxSection speed=0.3 for background image depth
    - fadeInLeft/fadeInRight variants from scroll-animations.ts for horizontal reveals
    - whileInView="animate" with variants= pattern over inline whileInView props
key_files:
  created:
    - src/app/about/loading.tsx
    - src/app/contact/loading.tsx
    - src/app/create-perfume/loading.tsx
  modified:
    - src/components/home/Categories.tsx
    - src/components/home/CreateSection.tsx
    - src/components/home/CTASection.tsx
    - src/app/about/page.tsx
    - src/app/contact/page.tsx
decisions:
  - "Used AnimatedSection stagger + AnimatedSectionItem for all grid reveals (Categories, CreateSection, CTASection features, Values)"
  - "ParallaxSection speed=0.3 on CTASection background — slow for bg depth effect, disabled on mobile automatically"
  - "Contact + About: used fadeInLeft/fadeInRight from scroll-animations.ts for the two-column layout split (left panel / right panel)"
  - "Contact info cards: kept per-card motion.div with whileInView + delay stagger rather than AnimatedSection stagger (better control of timing relative to parent)"
  - "loading.tsx files are plain server components — LuxurySkeleton uses useState internally so it handles its own client boundary"
metrics:
  duration: "~20 minutes"
  completed_date: 2026-03-10
  tasks_completed: 3
  tasks_total: 3
---

# Quick Task 5: Scroll Animations, Parallax Polish, Loading States — Summary

**One-liner:** Standardized scroll-triggered animations using AnimatedSection/AnimatedSectionItem across homepage sections and about/contact pages; added ParallaxSection to CTASection background; created gold shimmer loading.tsx for 3 previously uncovered pages.

## Tasks Completed

### Task 1 — Homepage sections (d0d7dd3)

**Categories.tsx** — Replaced opacity-only `whileInView={{ opacity: 1 }}` with `AnimatedSection variant="stagger"` wrapping the grid, and `AnimatedSectionItem` for each card. Cards get proper `fadeInUp` with y-movement. Hover/tap micro-interactions preserved via `motion.div` inside `AnimatedSectionItem`.

**CreateSection.tsx** — Removed `motion.framer` imports. Header wrapped in `AnimatedSection fadeInUp`. Stage cards grid uses `AnimatedSection stagger` + `AnimatedSectionItem`. CTA button uses `AnimatedSection fadeInUp delay=0.2`.

**CTASection.tsx** — Replaced the static `absolute inset-0` background `Image` with `ParallaxSection speed={0.3}` for depth. Content uses `AnimatedSection fadeInUp` for heading/subtitle, `AnimatedSection stagger` for features row, `AnimatedSection fadeInUp delay=0.3` for CTA button.

### Task 2 — About & Contact scroll animations (85c785d)

**about/page.tsx** — Story section: replaced `initial={{ opacity:0, x:-20 }} whileInView` with `initial="initial" whileInView="animate" variants={fadeInLeft/fadeInRight}` for left/right panels. Values section: `AnimatedSection fadeInUp` for `SectionHeader`, `AnimatedSection stagger` for values grid with `AnimatedSectionItem`. CTA: `AnimatedSection fadeInUp`.

**contact/page.tsx** — All animations changed from `initial/animate` (mount-only) to `initial="initial" whileInView="animate"`. Form panel uses `fadeInLeft`, info panel uses `fadeInRight`. Contact info cards use per-card `motion.div` with `variants={fadeInUp}` + stagger delay. Map also triggers on scroll.

### Task 3 — Loading states (3a27377)

**about/loading.tsx** — `LuxuryHeroSkeleton` + story skeleton (text lines + image block) + values grid skeleton (4 cards with icon/title/description lines).

**contact/loading.tsx** — `LuxuryHeroSkeleton` + form skeleton (labelled inputs + textarea + submit button) + info cards grid + map placeholder.

**create-perfume/loading.tsx** — `LuxuryHeroSkeleton` + 3D preview area skeleton + note selector skeleton (category tabs, 3 note sections with 6 buttons each, volume + CTA).

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Files created/modified:
- [x] src/components/home/Categories.tsx — exists
- [x] src/components/home/CreateSection.tsx — exists
- [x] src/components/home/CTASection.tsx — exists
- [x] src/app/about/page.tsx — exists
- [x] src/app/contact/page.tsx — exists
- [x] src/app/about/loading.tsx — exists
- [x] src/app/contact/loading.tsx — exists
- [x] src/app/create-perfume/loading.tsx — exists

Commits:
- [x] d0d7dd3 — Task 1
- [x] 85c785d — Task 2
- [x] 3a27377 — Task 3

TypeScript: clean (no errors in production code; pre-existing test file errors unrelated to this task)

## Self-Check: PASSED
