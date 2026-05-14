'use client';

/**
 * Tooltip — v3.0 hover/focus hint primitive (Phase 3 Task 2, PRIM-02).
 *
 * Thin wrapper around `@radix-ui/react-tooltip`. Compound API:
 *
 *   <TooltipProvider>                  // app-root once
 *     <Tooltip>
 *       <TooltipTrigger asChild>...    // any focusable element
 *       <TooltipContent>...            // styled surface
 *     </Tooltip>
 *   </TooltipProvider>
 *
 * Surface: dark fg-on-bg pill — inverse contrast so the hint reads against
 * the page surface no matter the theme. 200ms open delay; 6px side offset.
 * Z-index 50 sits above primary content but below Dialog/Drawer (z-60+).
 */

import * as React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

/** Wraps Radix.Provider with `delayDuration={200}` defaulted per design spec. */
export const TooltipProvider: React.FC<RadixTooltip.TooltipProviderProps> = ({
  delayDuration = 200,
  ...props
}) => <RadixTooltip.Provider delayDuration={delayDuration} {...props} />;
TooltipProvider.displayName = 'TooltipProvider';

/** Root — composes `Radix.Root`. Accepts `open`, `defaultOpen`, `onOpenChange`. */
export const Tooltip = RadixTooltip.Root;

/** Trigger — always `asChild` so callers wrap their own focusable element. */
export const TooltipTrigger = RadixTooltip.Trigger;

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof RadixTooltip.Content> {}

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof RadixTooltip.Content>,
  TooltipContentProps
>(({ className, sideOffset = 6, ...props }, ref) => (
  <RadixTooltip.Portal>
    <RadixTooltip.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 px-3 py-1.5 rounded-sm text-[12px] font-micro',
        'bg-fg text-bg shadow-2',
        'data-[state=delayed-open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className,
      )}
      {...props}
    />
  </RadixTooltip.Portal>
));
TooltipContent.displayName = 'TooltipContent';
