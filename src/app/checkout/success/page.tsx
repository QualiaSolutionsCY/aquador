'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { buttonVariants } from '@/components/ui';
import { useCart } from '@/components/cart';
import TrustBar from '@/components/storefront/TrustBar';
import { cn } from '@/lib/utils';

interface OrderData {
  orderNumber: string;
  total: number;
  currency: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  // Stripe redirects with ?session_id={CHECKOUT_SESSION_ID}.
  // We preserve the parsing so the receipt line can render the order number,
  // but the page does NOT block on it; the editorial copy stands alone.
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) return;

    let cancelled = false;
    fetch(`/api/checkout/session-details?session_id=${sessionId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('session-details fetch failed');
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setOrderData({
          orderNumber: data.orderNumber,
          total: (data.total ?? 0) / 100,
          currency: data.currency,
        });
        clearCart();
      })
      .catch((err) => {
        Sentry.addBreadcrumb({
          category: 'checkout-success',
          message: 'Error fetching order details',
          level: 'error',
          data: { error: err },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, clearCart]);

  return (
    <section className="min-h-screen bg-bg flex items-center justify-center px-6 py-24">
      <div className="max-w-[42rem] w-full border-t border-border pt-16">
        <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
          Confirmed
        </p>

        <h1 className="mt-6 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-xl)]">
          It&apos;s ours to send now.
        </h1>

        <p className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[36rem]">
          You&apos;ll have it in three days, maybe four. The notes settle best
          after the first wear; let it find its skin.
        </p>

        {orderData && (
          <div className="mt-10 border-t border-border pt-6">
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              Order
            </p>
            <p className="mt-2 font-body text-fg text-[length:var(--font-size-body)]">
              {orderData.orderNumber}
            </p>
          </div>
        )}

        <div className="mt-12 border-t border-border pt-8">
          <TrustBar variant="inline" />
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <Link
            href="/shop"
            className={cn(
              buttonVariants.base,
              buttonVariants.variants.ghost,
              buttonVariants.sizes.lg,
              'px-0',
            )}
          >
            Continue reading the collection
          </Link>
        </div>
      </div>
    </section>
  );
}
