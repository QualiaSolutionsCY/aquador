'use client';

/**
 * IconButton — square Button for icon-only triggers (close, more, sort).
 *
 * Inherits Button's variant surfaces (primary | secondary | ghost | destructive).
 * Sizes are square: 36 (sm) / 44 (md) / 52 (lg). `aria-label` is mandatory —
 * icon-only buttons must announce their action to screen readers, enforced by TS.
 *
 * Spec source: .planning/DESIGN.md §5 (Button surface contract).
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants, type ButtonVariant, type ButtonSize } from './Button';

export type IconButtonVariant = ButtonVariant;
export type IconButtonSize = ButtonSize;

export interface IconButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'disabled' | 'aria-label' | 'children'
  > {
  /** Required: icon-only buttons must announce their action to screen readers. */
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isLoading?: boolean;
  icon: ReactNode;
  disabled?: boolean;
}

const iconSizes: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9 p-2', // 36px
  md: 'h-11 w-11 p-2.5', // 44px (touch-target floor)
  lg: 'h-[52px] w-[52px] p-3', // 52px
};

const iconGlyphSizes: Record<IconButtonSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      className,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      icon,
      disabled = false,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || isLoading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={isLoading || undefined}
        className={cn(
          buttonVariants.base,
          buttonVariants.variants[variant],
          iconSizes[size],
          'gap-0',
          className,
        )}
        {...rest}
      >
        {isLoading ? (
          <Loader2
            aria-hidden="true"
            className={cn(iconGlyphSizes[size], 'animate-spin')}
            strokeWidth={1.5}
          />
        ) : (
          <span
            aria-hidden="true"
            className={cn('inline-flex shrink-0', iconGlyphSizes[size])}
          >
            {icon}
          </span>
        )}
      </button>
    );
  },
);
