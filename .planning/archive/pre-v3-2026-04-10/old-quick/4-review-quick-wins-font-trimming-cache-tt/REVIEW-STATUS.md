# Review Status — UI/UX + Performance Audit

**Date:** 2026-03-10
**Source:** 3-agent parallel review (homepage, shop, performance)

## COMPLETED (Quick Task 4)

| # | Fix | Commit | Impact |
|---|-----|--------|--------|
| 1 | Font weight trimming: 12 → 5 weights | badcf8c | ~200-300KB savings, faster FCP |
| 2 | Image cache TTL: 60s → 86400 (24h) | 5f18694 | Fewer reprocessing cycles |
| 3 | CTASection: CSS bg-image → next/image | c638716 | AVIF/WebP, responsive srcset |
| 4 | generateStaticParams restored + cache() dedup | a76fd2d | Pre-built product pages, 1 call vs 3 |
| 5 | useReducedMotion: sync matchMedia init | 7f43e94 | No animation flash for a11y users |

## COMPLETED (Earlier in session)

| # | Fix | Commit |
|---|-----|--------|
| 6 | Header white text on homepage, dark on other pages | a4b65b5 |
| 7 | Remove header top gap (top-5 → top-0) | 4e2ce13 |
| 8 | Scroll threshold 10px → 80px | via agent |
| 9 | checkActive fix (/shop vs /shop/lattafa overlap) | via agent |
| 10 | Hero video poster attribute added | via agent |
| 11 | Hero scroll indicator added | via agent |
| 12 | Categories: priority on first 2 images, mobile Explore CTA | via agent |
| 13 | Footer: social links fixed, logo sized down, border visibility | via agent |
| 14 | Lattafa category card: new image + object-contain | 01ae03d |

## REMAINING — HIGH Priority

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| R-1 | Consolidate 3 product card implementations into one | CategoryContent.tsx, LattafaContent.tsx, ProductCard.tsx | Large |
| R-2 | CartItem X button positioning (missing relative parent) | CartItem.tsx:82 | Small |
| R-3 | Product detail breadcrumb — add category context | products/[slug]/page.tsx:186 | Small |
| R-4 | Gallery aspect-square → aspect-[4/5] for portrait bottles | ProductGallery.tsx:187 | Small |
| R-5 | Mobile perfume builder — notes grid buried below bottle | create-perfume/page.tsx:234 | Medium |
| R-6 | Lattafa hero/content dark-light fracture | LattafaContent.tsx:79 | Medium |
| R-7 | Lattafa empty state black text on dark bg | lattafa/page.tsx:50 | Small |
| R-8 | Middleware double Supabase query on admin routes | middleware.ts:49-64 | Medium |

## REMAINING — MEDIUM Priority

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| R-9 | Free shipping threshold contradiction (€100 vs free) | products/[slug]:219, CartDrawer.tsx:93 | Small |
| R-10 | "Clear Cart" needs confirmation | CartDrawer.tsx:103 | Small |
| R-11 | Cart image container dark bg on white drawer | CartItem.tsx:39 | Small |
| R-12 | Gender not displayed in ProductInfo | ProductInfo.tsx | Small |
| R-13 | Tags shown as raw strings, should be "Fragrance Notes" | ProductInfo.tsx:77 | Small |
| R-14 | Create-perfume success page still dark theme | success-content.tsx:82 | Small |
| R-15 | Price shows €0.00 before volume selection | create-perfume/page.tsx:459 | Small |
| R-16 | Search 2-char minimum no user feedback | ShopContent.tsx:69 | Small |
| R-17 | Disabled notes no tooltip explanation | create-perfume/page.tsx:358 | Small |

## REMAINING — LOW Priority

| # | Issue | File(s) |
|---|-------|---------|
| R-18 | Focus-visible rings on public interactive elements | Pattern across home/* |
| R-19 | Mobile menu focus trap + aria-modal | Navbar.tsx:179 |
| R-20 | useParallax scroll listener runs on mobile when disabled | hooks/useParallax.ts:117 |
| R-21 | AnimatedShaderBackground no SSR fallback | LattafaContent.tsx:11 |
| R-22 | isMobileViewport() sync read during render | AnimatedSection.tsx:145 |
| R-23 | Move hero video from Squarespace to own storage | Hero.tsx:39 |
| R-24 | Full-text search index (tsvector + GIN) before 300+ products | product-service.ts:159 |
| R-25 | Server-side shop filtering via URL params | shop/page.tsx |

## Notes for Next Agent

- Product card consolidation (R-1) is the biggest UX win remaining — 3 separate card implementations diverge on features, badges, aspect ratios
- Small fixes R-2 through R-7 can be batched in one quick task
- R-8 (middleware) is a security/perf improvement worth doing before scaling admin usage
- All COMPLETED items are deployed to production at aquadorcy.com
