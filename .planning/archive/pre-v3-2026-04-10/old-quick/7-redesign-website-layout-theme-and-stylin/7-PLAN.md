# Plan: 7 — Redesign website layout, theme, and styling for modern high-end responsive design

**Mode:** quick
**Created:** 2026-03-11

## Goal
Transform the Aquador website into a more modern, high-end, responsive design while keeping all existing content and the gold/dark color palette intact. Focus on typography hierarchy, spacing, animations, component layouts, and visual flow between sections.

## Task 1: Modernize globals.css design system + Section/PageHero components

**What:** Update the CSS design system and shared section components for a more refined, modern luxury feel.
**Files:**
- `src/app/globals.css` — Add new utility classes for modern effects (diagonal dividers, frosted glass, editorial spacing)
- `src/components/ui/Section.tsx` — Update PageHero for dramatic full-bleed editorial style with stronger visual hierarchy
**Done when:** New CSS utilities available, PageHero renders with refined spacing and overlay effects

## Task 2: Redesign homepage components (Hero, Categories, FeaturedProducts, CreateSection, CTASection)

**What:** Modernize all 5 homepage sections with editorial layouts, better whitespace, staggered reveals, and more sophisticated visual compositions. Replace grid patterns with asymmetric/editorial layouts where appropriate.
**Files:**
- `src/components/home/Hero.tsx` — Bolder typography, refined spacing, more cinematic feel
- `src/components/home/Categories.tsx` — Asymmetric editorial grid instead of uniform 4-col
- `src/components/home/FeaturedProducts.tsx` — More spacious layout with editorial product presentation
- `src/components/home/CreateSection.tsx` — Full-width immersive layout, less boxy cards
- `src/components/home/CTASection.tsx` — More dramatic, refined spacing
**Done when:** Homepage renders with modernized layout, all content preserved, visually cohesive

## Task 3: Modernize Navbar, Footer, About, and Contact pages

**What:** Refine navigation and footer for more modern feel. Update About and Contact pages with editorial layouts and better visual flow.
**Files:**
- `src/components/layout/Navbar.tsx` — More refined spacing and transitions
- `src/components/layout/Footer.tsx` — Modern footer with better hierarchy
- `src/app/about/page.tsx` — Editorial layout with stronger visual storytelling
- `src/app/contact/page.tsx` — Cleaner, more spacious form layout
**Done when:** All 4 components render with modernized design, all content preserved
