// Barrel for `src/components/products`.
//
// History: `RelatedProducts` and `ProductVariantSelector` were removed in
// M4 P1 T3 (POLISH-11) as confirmed orphans — the canonical related-products
// surface is `RelatedCarousel` under `src/components/storefront`, and the
// storefront PDP uses single-variant pricing.
//
// Active member:
//   - ProductViewTracker — analytics shim mounted by /products/[slug]/page.tsx
//
// Discovered but out of scope (left untouched): `RichDescription.tsx` is
// also currently unimported; flagged for the next cleanup pass so the
// planner can confirm whether it's reserved for an upcoming PDP rich-text
// path before deletion.
export { ProductViewTracker } from './ProductViewTracker';
