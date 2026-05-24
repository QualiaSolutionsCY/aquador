'use client';

/**
 * CartItem. Hairline-divider row consumed by CartDrawer.
 *
 * Spec source: .planning/phase-4-plan.md Task 1, .planning/DESIGN.md §10b.
 * D-06: no card wrapper. Cart rows are flex rows separated by a top hairline
 * (border-t border-border). The drawer body composes them as a vertical stack.
 *
 * Layout: 64x64 image then name + product-type/size + qty stepper then line
 * price + remove. Tokens only: bg-bg, text-fg, text-fg-muted, border-border.
 * No hex literals. No display-font legacy alias. Motion: animate-fade-in-up
 * on mount (keyframes live in src/styles/tokens.css).
 */

import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import type { CartItem as CartItemType } from '@/types/cart';
import { formatPrice } from '@/lib/currency';
import { getProductTypeLabel } from '@/lib/constants';
import { IconButton } from '@/components/ui';
import { useCart } from './CartProvider';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.variantId, item.quantity - 1);
    } else {
      removeItem(item.variantId);
    }
  };

  const handleIncrease = () => {
    updateQuantity(item.variantId, item.quantity + 1);
  };

  return (
    <li
      className="flex gap-4 py-5 border-t border-border first:border-t-0 animate-fade-in-up"
      data-testid="cart-item"
    >
      {/* Product image. 64x64 square with bone-tinted placeholder. */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-bg-alt">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-contain p-1"
          sizes="64px"
        />
      </div>

      {/* Middle column: name, product-type/size, qty stepper. */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h4 className="truncate font-display text-[length:var(--font-size-body)] text-fg leading-tight">
            {item.name}
          </h4>
          <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
            {getProductTypeLabel(item.productType)} · {item.size}
          </p>
        </div>

        {/* Quantity stepper. Square 36px controls clear the 44px touch floor
            when composed with the tabular-nums readout in the same row. */}
        <div className="flex items-center gap-1">
          <IconButton
            aria-label={`Decrease quantity for ${item.name}`}
            size="sm"
            variant="ghost"
            onClick={handleDecrease}
            icon={<Minus strokeWidth={1.5} />}
          />
          <span
            aria-live="polite"
            className="min-w-8 text-center font-micro text-[length:var(--font-size-micro)] tabular-nums uppercase tracking-[0.05em] text-fg transition-all duration-[var(--duration-base)] ease-[var(--ease-out-quart)]"
          >
            {item.quantity}
          </span>
          <IconButton
            aria-label={`Increase quantity for ${item.name}`}
            size="sm"
            variant="ghost"
            onClick={handleIncrease}
            icon={<Plus strokeWidth={1.5} />}
          />
        </div>
      </div>

      {/* Right column: remove (top) + line price (bottom). */}
      <div className="flex flex-col items-end justify-between gap-2">
        <IconButton
          aria-label={`Remove ${item.name} from bag`}
          size="sm"
          variant="ghost"
          onClick={() => removeItem(item.variantId)}
          icon={<X strokeWidth={1.5} />}
        />
        <p className="font-body text-[length:var(--font-size-body-sm)] tabular-nums text-fg transition-all duration-[var(--duration-base)] ease-[var(--ease-out-quart)]">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </li>
  );
}
