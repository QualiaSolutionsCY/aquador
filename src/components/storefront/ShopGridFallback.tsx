/**
 * ShopGridFallback. Server-renderable Suspense fallback for the shop route
 * family (M2 Phase 2.3 Task 3, SHOP-03).
 *
 * Renders eight tokenized `Skeleton` cards in the same responsive grid that
 * `ProductGrid` uses, so the layout does not jump when the client island
 * hydrates. Used both as the `<Suspense fallback>` on `/shop`, `/shop/[category]`,
 * `/shop/lattafa`, and as the body of `src/app/shop/loading.tsx` for visual
 * continuity between the route-segment loading state and the RSC stream.
 *
 * Pure server component. No `use client`, no hooks, no event handlers. Motion
 * (1500ms pulse) is owned by `Skeleton`. Honours `prefers-reduced-motion`
 * via tokens.css.
 */

import { Skeleton } from '@/components/ui/Skeleton';

const FALLBACK_COUNT = 8;

export default function ShopGridFallback() {
  return (
    <ul
      aria-hidden="true"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 px-[var(--page-px)] py-10 md:py-12"
    >
      {Array.from({ length: FALLBACK_COUNT }).map((_, i) => (
        <li key={`shop-grid-fallback-${i}`}>
          <Skeleton variant="rect" className="w-full aspect-[3/4]" />
          <Skeleton variant="text" className="mt-4 w-1/3" />
          <Skeleton variant="text" className="mt-2 w-2/3" />
        </li>
      ))}
    </ul>
  );
}
