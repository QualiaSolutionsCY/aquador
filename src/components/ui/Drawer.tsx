'use client';

/**
 * Drawer — v3.0 right-side overlay primitive.
 *
 * A side-anchored modal IS a dialog under the hood — same focus-trap, escape,
 * scrim-click, scroll-lock semantics. We reuse `@radix-ui/react-dialog` for
 * the heavy lifting and only swap the positioning + slide animation.
 *
 * Compound API mirrors Dialog so callers can swap dialog↔drawer trivially:
 *   <Drawer>
 *     <DrawerTrigger asChild><Button>Open Cart</Button></DrawerTrigger>
 *     <DrawerContent>
 *       <DrawerHeader>
 *         <DrawerTitle>Your Cart</DrawerTitle>
 *         <DrawerDescription>2 items, €148 subtotal</DrawerDescription>
 *       </DrawerHeader>
 *       …
 *       <DrawerFooter>…</DrawerFooter>
 *     </DrawerContent>
 *   </Drawer>
 *
 * Spec (DESIGN.md §5 / §6 / §7):
 *   - max-w-[28rem] h-screen, fixed top-0 right-0
 *   - --bg surface, --shadow-3 elevation, p-8 interior
 *   - 250ms slide-in-right / slide-out-right, --ease-out-quart
 *   - scrim same as Dialog: oklch(0.10 0 0 / 0.5)
 *
 * NOTE: This task does NOT migrate the legacy CartDrawer at
 * src/components/cart/CartDrawer.tsx. Migration happens in M4.
 */

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerPortal = DialogPrimitive.Portal;
export const DrawerClose = DialogPrimitive.Close;

export const DrawerOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DrawerOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        // Scrim — the one allowed deviation from tinted neutrals (§5).
        'fixed inset-0 z-50 bg-[oklch(0.10_0_0/0.5)]',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className,
      )}
      {...props}
    />
  );
});

export interface DrawerContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean;
}

export const DrawerContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(function DrawerContent({ className, children, hideCloseButton = false, ...props }, ref) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Position — right-anchored full height.
          'fixed top-0 right-0 z-50 h-screen w-full max-w-[28rem]',
          // Surface — --bg, --shadow-3, p-8 interior. No radius (edge-bleeds
          // to viewport edge — editorial restraint).
          'bg-bg p-8 shadow-3',
          // Layout — vertical column so callers can stretch header / body / footer.
          'flex flex-col gap-4',
          // Motion (§7) — 250ms slide, --ease-out-quart.
          'data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right',
          // Strip Radix's default focus ring on the surface itself.
          'focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            aria-label="Close drawer"
            className={cn(
              'absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center',
              'rounded-sm text-fg-muted hover:text-fg',
              'transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
              'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            )}
          >
            <X aria-hidden="true" strokeWidth={1.5} className="h-5 w-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DrawerPortal>
  );
});

export function DrawerHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-2 pr-12', className)}
      {...props}
    />
  );
}

export function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-auto flex flex-col gap-3 border-t border-border pt-6',
        className,
      )}
      {...props}
    />
  );
}

export const DrawerTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DrawerTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        'font-display text-[length:var(--font-h3)] font-medium text-fg',
        'tracking-[-0.01em] leading-tight',
        className,
      )}
      {...props}
    />
  );
});

export const DrawerDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DrawerDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn(
        'font-body text-[length:var(--font-size-body-sm)] text-fg-muted leading-relaxed',
        className,
      )}
      {...props}
    />
  );
});
