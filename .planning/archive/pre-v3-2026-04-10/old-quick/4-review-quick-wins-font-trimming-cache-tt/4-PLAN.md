# Plan: 4 — Review Quick Wins

**Mode:** quick (no-plan)
**Created:** 2026-03-10

## Task 1: Font weight trimming
**What:** Reduce Playfair Display to ["400","700"] and Poppins to ["300","400","600"] in layout.tsx
**Files:** src/app/layout.tsx
**Done when:** Only needed font weights loaded

## Task 2: Image cache TTL
**What:** Set minimumCacheTTL to 86400 in next.config.mjs
**Files:** next.config.mjs
**Done when:** TTL is 24 hours

## Task 3: CTASection fixes
**What:** Fix invisible text (text-black on dark bg -> text-white), replace CSS background-image with next/image
**Files:** src/components/home/CTASection.tsx
**Done when:** Text visible, image optimized via next/image

## Task 4: generateStaticParams + cache dedup
**What:** Restore generateStaticParams with getAllProductSlugs(), wrap getProductBySlug in React cache()
**Files:** src/app/products/[slug]/page.tsx, src/lib/supabase/product-service.ts
**Done when:** Product pages pre-rendered, metadata/page share one Supabase call

## Task 5: useReducedMotion hydration fix
**What:** Initialize with synchronous matchMedia read to prevent animation flash
**Files:** src/hooks/useReducedMotion.ts
**Done when:** No one-frame animation flash for reduced-motion users

## Task 6: Documentation — done/remaining tracker
**What:** Create REVIEW-STATUS.md documenting completed fixes and remaining items for next agent
**Files:** .planning/quick/4-review-quick-wins-font-trimming-cache-tt/REVIEW-STATUS.md
**Done when:** Clear checklist of done vs remaining
