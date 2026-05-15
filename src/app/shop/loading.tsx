/**
 * Shop route-segment loading state (M2 Phase 2.3 Task 3, SHOP-03).
 *
 * Mirrors the `<Suspense fallback={<ShopGridFallback />}>` body used inside
 * each `/shop/*` page so the route-segment loading boundary and the RSC
 * stream are visually continuous: a hero placeholder above the same skeleton
 * grid the page hydrates into.
 */

import { Skeleton } from '@/components/ui/Skeleton';
import ShopGridFallback from '@/components/storefront/ShopGridFallback';

export default function ShopLoading() {
  return (
    <main className="pt-32 md:pt-40 lg:pt-44 pb-20 bg-bg min-h-screen">
      <header className="border-b border-border pb-12 mb-12 px-[var(--page-px)]">
        <Skeleton variant="text" className="h-4 w-16 mb-2" />
        <Skeleton variant="text" className="h-12 w-2/3" />
      </header>
      <ShopGridFallback />
    </main>
  );
}
