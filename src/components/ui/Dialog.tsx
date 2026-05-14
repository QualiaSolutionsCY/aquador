'use client';

/**
 * Dialog — v3.0 overlay primitive.
 *
 * Wraps `@radix-ui/react-dialog` to ship the four behaviors PRIM-03 requires
 * for every modal surface in the app:
 *   - focus trap (Radix `Dialog.Content` traps + restores)
 *   - escape-to-close
 *   - scrim click closes
 *   - body scroll lock while open
 *
 * Surface tokens (DESIGN.md §5 / §6 / §7):
 *   - max-w-[32rem], centered, --bg surface, --shadow-3 elevation
 *   - scrim = oklch(0.10 0 0 / 0.5) — the ONE allowed deviation from tinted
 *     neutrals (§5, §10). Read better as true black at 50% alpha behind the
 *     warm bone surface.
 *   - 250ms fade in/out, --ease-out-quart
 *
 * Compound exports:
 *   Dialog, DialogTrigger, DialogPortal, DialogOverlay,
 *   DialogContent, DialogHeader, DialogTitle, DialogDescription,
 *   DialogFooter, DialogClose
 *
 * Compose pattern:
 *   <Dialog>
 *     <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
 *     <DialogContent>
 *       <DialogHeader>
 *         <DialogTitle>Title</DialogTitle>
 *         <DialogDescription>Description</DialogDescription>
 *       </DialogHeader>
 *       <p>Body…</p>
 *       <DialogFooter>
 *         <DialogClose asChild><Button>Cancel</Button></DialogClose>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 */

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        // Scrim — the one allowed oklch deviation from tinted neutrals (§5).
        'fixed inset-0 z-50 bg-[oklch(0.10_0_0/0.5)]',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className,
      )}
      {...props}
    />
  );
});

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /**
   * Hide the default top-right close button. Use when the dialog provides its
   * own close affordance inside the body (e.g. a single primary CTA).
   */
  hideCloseButton?: boolean;
}

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, hideCloseButton = false, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Position — centered on viewport.
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          // Surface — max 32rem, --bg, --shadow-3, --radius-sm (4px).
          'w-full max-w-[32rem] bg-bg p-8 rounded-sm shadow-3',
          // Spacing — vertical rhythm inside body.
          'flex flex-col gap-4',
          // Motion (§7) — 250ms, --ease-out-quart.
          'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
          // Focus ring suppression on the content surface itself (Radix moves
          // focus to the first focusable child on open — interior elements
          // own their own focus-visible styling).
          'focus:outline-none',
          className,
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            aria-label="Close dialog"
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
    </DialogPortal>
  );
});

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-2 pr-12', className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3',
        className,
      )}
      {...props}
    />
  );
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
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

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
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
