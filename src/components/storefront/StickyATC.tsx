'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';

export interface StickyATCProps {
  price: number;
  productName: string;
  onAddToCart: () => void;
  disabled?: boolean;
  label?: string;
}

const priceFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});

export function StickyATC({
  price,
  productName,
  onAddToCart,
  disabled = false,
  label = 'Add to bag',
}: StickyATCProps) {
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    // Reveal the sticky bar only after the shopper scrolls past the gallery,
    // so the primary Add to bag stays the inline one up near the image and
    // product info. The bar then slides up as a persistent CTA further down.
    const onScroll = () => setElevated(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      data-elevated={elevated}
      aria-hidden={!elevated}
      className="storefront-sticky-atc fixed bottom-0 inset-x-0 z-40 translate-y-full border-t border-border-dark bg-bg transition-transform duration-[var(--duration-base)] data-[elevated=true]:translate-y-0 md:hidden"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
            {productName}
          </p>
          <p className="font-display text-[length:var(--font-h3)] text-fg">
            {priceFormatter.format(price)}
          </p>
        </div>
        <Button onClick={onAddToCart} disabled={disabled} className="shrink-0">
          {label}
        </Button>
      </div>
    </div>
  );
}

export default StickyATC;
