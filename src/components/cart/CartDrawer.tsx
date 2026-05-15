'use client';

/**
 * CartDrawer. v3.0 editorial bag surface.
 *
 * Spec source: .planning/phase-4-plan.md Phase 2.4 Task 1, .planning/DESIGN.md §10b.
 *
 * Locked decisions in force here:
 *   D-03. TrustBar imported from src/components/storefront/TrustBar (Phase 2.2).
 *   D-06. No card wrapper. Items are hairline-divider rows from CartItem.
 *   D-07. Motion mandatory: drawer slide (primitive) + row fade-translate
 *         (CartItem) + tabular-nums subtotal ticker (CSS transition).
 *   D-08. Voice: "Bag" / "Subtotal" / "Empty for now." / "Continue to checkout".
 *         No long dashes, no exclamation, no announcements.
 *
 * Footer is pinned to the drawer bottom with sticky so the subtotal,
 * TrustBar, and Continue-to-checkout never scroll out of view at 375px
 * (CART-03 reframing in phase plan).
 */

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  IconButton,
  Button,
} from '@/components/ui';
import { TrustBar } from '@/components/storefront/TrustBar';
import { formatPrice } from '@/lib/currency';
import { useCart } from './CartProvider';
import CartItem from './CartItem';
import CheckoutButton from './CheckoutButton';

export default function CartDrawer() {
  const router = useRouter();
  const { cart, isCartOpen, closeCart, subtotal } = useCart();
  const isEmpty = cart.items.length === 0;

  const handleReadCollection = () => {
    closeCart();
    router.push('/shop');
  };

  return (
    <Drawer
      open={isCartOpen}
      onOpenChange={(open) => {
        if (!open) closeCart();
      }}
    >
      <DrawerContent
        hideCloseButton
        aria-describedby={undefined}
        className="flex h-screen w-full max-w-[28rem] flex-col gap-0 p-0"
      >
        {/* Header. Title plus close. p-6 matches the editorial chrome rhythm. */}
        <DrawerHeader className="flex flex-row items-center justify-between gap-0 border-b border-border px-6 py-5 pr-6">
          <DrawerTitle>Bag</DrawerTitle>
          <IconButton
            aria-label="Close bag"
            size="md"
            variant="ghost"
            onClick={closeCart}
            icon={<X strokeWidth={1.5} />}
          />
        </DrawerHeader>

        {/* Body. Scrollable. Empty state is editorial copy plus ghost CTA;
            populated state is a hairline-divider list of CartItem rows. */}
        <div className="flex-1 overflow-y-auto px-6">
          {isEmpty ? (
            <div className="flex h-full flex-col items-start justify-center gap-6 py-12 animate-fade-in-up">
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-[length:var(--font-h3)] leading-tight text-fg">
                  Empty for now.
                </h3>
                <p className="font-body text-[length:var(--font-size-body)] text-fg-muted">
                  Three things people are wearing this week.
                </p>
              </div>
              <Button
                variant="ghost"
                size="md"
                onClick={handleReadCollection}
              >
                Read the collection
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col">
              {cart.items.map((item) => (
                <CartItem key={item.variantId} item={item} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer. Sticky bottom, hairline-topped. Stack: subtotal row,
            shipping note, TrustBar, CheckoutButton. Hidden on empty state
            so the editorial copy breathes. */}
        {!isEmpty && (
          <DrawerFooter className="sticky bottom-0 mt-0 flex flex-col gap-4 border-t border-border bg-bg px-6 py-6">
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.05em] text-fg-muted">
                Subtotal
              </span>
              <span
                aria-live="polite"
                className="font-display text-[length:var(--font-h3)] tabular-nums leading-tight text-fg transition-all duration-[var(--duration-base)] ease-[var(--ease-out-quart)]"
              >
                {formatPrice(subtotal)}
              </span>
            </div>

            <p className="font-body text-[length:var(--font-size-body-sm)] text-fg-muted">
              Free shipping. Ships in three days.
            </p>

            <TrustBar variant="compact" />

            <CheckoutButton />
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
