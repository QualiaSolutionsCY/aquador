# Plan: 5 — Scroll animations, parallax polish, loading states & UX best practices

**Mode:** quick
**Created:** 2026-03-10

## Task 1: Add scroll-triggered animations to all homepage sections

**What:** Wrap Categories, CreateSection, and CTASection in AnimatedSection or use consistent scroll-triggered fadeInUp patterns. Categories currently only fades opacity (no y movement). CreateSection and CTASection use inline whileInView — standardize on the existing AnimatedSection component with stagger for grids. Add parallax to CTASection background image.

**Files:** src/components/home/Categories.tsx, src/components/home/CreateSection.tsx, src/components/home/CTASection.tsx
**Done when:** All homepage sections animate in on scroll with fadeInUp + stagger for grids, CTASection has parallax background

## Task 2: Add scroll animations to About & Contact pages

**What:** About and Contact pages use mount-only animations (initial/animate) instead of scroll-triggered (whileInView). Convert to proper scroll-triggered animations using AnimatedSection wrapper or whileInView with fadeInUp variants. Add staggered entrance for value cards and contact info cards.

**Files:** src/app/about/page.tsx, src/app/contact/page.tsx
**Done when:** Sections animate as user scrolls to them, not all at once on page load

## Task 3: Add missing loading states + polish existing ones

**What:** Add loading.tsx for about, contact, and create-perfume pages. Use existing LuxurySkeleton components for brand consistency. Add a generic page loading skeleton component to reduce duplication.

**Files:** src/app/about/loading.tsx, src/app/contact/loading.tsx, src/app/create-perfume/loading.tsx
**Done when:** All major pages have branded loading states with gold shimmer skeletons
