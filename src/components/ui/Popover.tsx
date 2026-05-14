'use client';

/**
 * Popover — v3.0 floating-content primitive.
 *
 * Wraps `@radix-ui/react-popover`. Ships with collision detection, arrow-key
 * focus management, click-outside-to-close, and portal rendering — all free.
 * Use for filter menus, contextual actions, info bubbles.
 *
 * Compound exports:
 *   Popover, PopoverTrigger, PopoverPortal, PopoverContent, PopoverAnchor, PopoverClose
 *
 * Compose pattern:
 *   <Popover>
 *     <PopoverTrigger asChild><IconButton><Filter /></IconButton></PopoverTrigger>
 *     <PopoverContent>…</PopoverContent>
 *   </Popover>
 *
 * Spec (DESIGN.md §5 / §6 / §7):
 *   - --bg-alt surface, 1px --border, --radius-sm (4px), --shadow-2
 *   - p-4 interior, min-w-[16rem]
 *   - sideOffset=6, fade + small offset animation
 */

import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverPortal = PopoverPrimitive.Portal;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export interface PopoverContentProps
  extends ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {}

export const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(function PopoverContent(
  { className, align = 'center', sideOffset = 6, ...props },
  ref,
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[16rem]',
          'bg-bg-alt border border-border rounded-sm shadow-2',
          'p-4 font-body text-[length:var(--font-size-body-sm)] text-fg',
          // Motion — fade + small side offset (200ms, --ease-out-quart).
          'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
          // Surface focus — Radix focuses Content on open when no autofocus
          // target. Show a visible ring rather than swallowing the outline.
          'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
