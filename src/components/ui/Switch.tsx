'use client';

/**
 * Switch — v3.0 token-driven primitive wrapping @radix-ui/react-switch.
 *
 * Spec:
 *   - Track 28×16, rounded-full.
 *   - Track unchecked: bg-border-strong (neutral-300). Checked: bg-accent.
 *   - Thumb 12×12, bg-bg, rounded-full, shadow-1.
 *   - Thumb position via `translateX` ONLY (never `left`/`margin` per spec).
 *     translate-x-0.5 → translate-x-3.5 on data-[state=checked].
 *   - 150ms transition on both bg-color (track) and transform (thumb).
 *   - Focus-visible: 2px accent ring offset 2px from bg.
 *   - Radix handles keyboard semantics (Space toggles).
 */

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(function Switch({ className, ...rest }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center',
        'rounded-full bg-border-strong',
        'transition-colors duration-150',
        'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'data-[state=checked]:bg-accent',
        className,
      )}
      {...rest}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-3 w-3 rounded-full bg-bg shadow-1',
          'transition-transform duration-150',
          'translate-x-0.5 data-[state=checked]:translate-x-3.5',
        )}
      />
    </SwitchPrimitive.Root>
  );
});
