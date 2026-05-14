'use client';

/**
 * Checkbox — v3.0 token-driven primitive wrapping @radix-ui/react-checkbox.
 *
 * Spec:
 *   - 16×16, 1px border-border-strong, rounded-[2px].
 *   - Checked: bg-accent border-accent.
 *   - Indicator: Check 12px stroke 2 in text-bg when checked.
 *   - Indeterminate: Minus icon (Radix sets data-state="indeterminate" when
 *     `checked === 'indeterminate'` is passed).
 *   - Focus-visible: 2px accent ring offset 2px from bg.
 *   - Radix handles keyboard semantics (Space toggles).
 *
 * Indeterminate usage:
 *   <Checkbox checked="indeterminate" onCheckedChange={...} />
 */

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckboxProps = ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
>;

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(function Checkbox({ className, checked, ...rest }, ref) {
  const isIndeterminate = checked === 'indeterminate';
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      className={cn(
        'inline-flex h-4 w-4 shrink-0 items-center justify-center',
        'rounded-[2px] border border-border-strong bg-bg',
        'transition-colors duration-150',
        'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'data-[state=checked]:bg-accent data-[state=checked]:border-accent',
        'data-[state=indeterminate]:bg-accent data-[state=indeterminate]:border-accent',
        className,
      )}
      {...rest}
    >
      <CheckboxPrimitive.Indicator className="inline-flex items-center justify-center text-bg">
        {isIndeterminate ? (
          <Minus aria-hidden="true" strokeWidth={2} className="h-3 w-3" />
        ) : (
          <Check aria-hidden="true" strokeWidth={2} className="h-3 w-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
