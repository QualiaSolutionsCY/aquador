'use client';

/**
 * RadioGroup + RadioItem — v3.0 token-driven primitives wrapping
 * @radix-ui/react-radio-group.
 *
 * Spec:
 *   - 16×16 circle, rounded-full, 1px border-border-strong.
 *   - Checked: inner 8px dot bg-accent, border-accent.
 *   - Focus-visible: 2px accent ring offset 2px from bg.
 *   - Radix handles keyboard semantics (Arrow keys move within group).
 */

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

export type RadioGroupProps = ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>;

export const RadioGroup = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(function RadioGroup({ className, ...rest }, ref) {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn('grid gap-2', className)}
      {...rest}
    />
  );
});

export type RadioItemProps = ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
>;

export const RadioItem = forwardRef<
  ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioItemProps
>(function RadioItem({ className, ...rest }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center',
        'rounded-full border border-border-strong bg-bg',
        'transition-colors duration-150',
        'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'data-[state=checked]:border-accent',
        className,
      )}
      {...rest}
    >
      <RadioGroupPrimitive.Indicator className="inline-flex items-center justify-center">
        <span
          aria-hidden="true"
          className="block h-2 w-2 rounded-full bg-accent"
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
