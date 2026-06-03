'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { track } from '@vercel/analytics';
import * as Sentry from '@sentry/nextjs';
import { Button, useToast } from '@/components/ui';
import type { ShippingDestination } from '@/lib/shipping';
import { useCart } from './CartProvider';

export default function CheckoutButton({
  destination = 'cy-eu',
}: {
  destination?: ShippingDestination;
}) {
  const { cart } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCheckout = useCallback(async () => {
    if (isProcessing) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsProcessing(true);
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Track checkout started
    const totalValue = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    track('checkout_started', {
      item_count: cart.items.length,
      total_value: totalValue,
    });

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: cart.items, destination }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      Sentry.addBreadcrumb({
        category: 'checkout-button',
        message: 'Checkout error',
        level: 'error',
        data: { error: err },
      });
      toast({
        variant: 'error',
        title: 'Could not start checkout',
        description:
          err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setIsProcessing(false);
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [cart.items, isProcessing, toast, destination]);

  const isDisabled = isLoading || isProcessing || cart.items.length === 0;

  return (
    <div className="space-y-3">
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isDisabled}
        onClick={handleCheckout}
        aria-busy={isLoading || undefined}
      >
        {isLoading ? (
          <>
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin"
              strokeWidth={1.5}
            />
            Working
          </>
        ) : (
          'Continue to checkout'
        )}
      </Button>

      <p className="text-center font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
        Secure payment, encrypted.
      </p>
    </div>
  );
}
