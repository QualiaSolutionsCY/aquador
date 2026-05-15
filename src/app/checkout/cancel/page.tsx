'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart';
import { useRouter } from 'next/navigation';

export default function CheckoutCancelPage() {
  const { openCart, itemCount } = useCart();
  const router = useRouter();

  // Editorial choice: route back to /shop and reopen the drawer in-place via
  // the existing CartProvider context. This avoids a query-param hook on the
  // root layout and keeps the cancel page a pure leaf.
  const handleReturnToBag = () => {
    if (itemCount > 0) {
      openCart();
    }
    router.push('/shop');
  };

  return (
    <section className="min-h-screen bg-bg flex items-center justify-center px-6 py-24">
      <div className="max-w-[42rem] w-full border-t border-border pt-16">
        <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
          Held back
        </p>

        <h1 className="mt-6 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-xl)]">
          Not this time, then.
        </h1>

        <p className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[36rem]">
          Your bag is waiting; the prices haven&apos;t moved. Take it back up
          when you&apos;re ready.
        </p>

        <div className="mt-12 border-t border-border pt-8 flex flex-col sm:flex-row gap-4 sm:items-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleReturnToBag}
          >
            Return to bag
          </Button>
          <Link
            href="/shop"
            className={cn(
              buttonVariants.base,
              buttonVariants.variants.ghost,
              buttonVariants.sizes.lg,
              'px-0',
            )}
          >
            Read the collection
          </Link>
        </div>
      </div>
    </section>
  );
}
