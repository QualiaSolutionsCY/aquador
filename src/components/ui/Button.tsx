'use client';

/**
 * Button — v3.0 token-driven primitive.
 *
 * Spec source: .planning/DESIGN.md §5 (Button) + §10 (anti-patterns).
 *   - Surfaces: --accent / --accent-deep / --bg-alt / --critical (semantic only).
 *   - Micro font (Geist) UPPERCASE 12px, tracking 0.05em.
 *   - 44px+ min touch target on md/lg.
 *   - --radius-sm (4px) via `rounded-sm`.
 *   - --shadow-1 on hover only.
 *   - 7 states: default · hover · focus-visible · active · disabled · loading · error.
 *
 * Implementation notes:
 *   - CSS transitions, NOT framer-motion (motion = --duration-fast +
 *     --ease-out-quart; spring physics are banned by §10).
 *   - `buttonVariants` is exported as a plain class-map object so downstream
 *     primitives (IconButton) reuse the surface treatments without
 *     pulling in `class-variance-authority`.
 *   - Legacy callers (src/app/error.tsx, src/components/home/*) pass
 *     `variant="outline"` and `size="icon"`. Accepted as aliases so the
 *     pre-v3.0 consumers keep compiling — `outline` maps to ghost surface
 *     with a strong border; `icon` maps to md sizing.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Legacy aliases accepted at the prop boundary so pre-v3.0 consumers keep
// compiling; they route to the closest v3.0 equivalent at runtime.
type LegacyButtonVariant = ButtonVariant | 'outline';
type LegacyButtonSize = ButtonSize | 'icon';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: LegacyButtonVariant;
  size?: LegacyButtonSize;
  isLoading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
}

/**
 * Shared class fragments for all button-shaped primitives.
 * `IconButton` reuses `variants` (same surface treatments, different sizing).
 */
export const buttonVariants = {
  base: cn(
    'relative inline-flex items-center justify-center gap-2',
    'font-micro uppercase tracking-[0.05em] font-medium',
    'rounded-sm border border-transparent',
    'transition-all duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
    'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'active:translate-y-px',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'select-none whitespace-nowrap',
  ),
  variants: {
    primary: 'bg-accent text-bg hover:bg-accent-deep hover:shadow-1',
    secondary:
      'bg-bg-alt text-fg border border-border hover:border-border-strong',
    ghost: 'bg-transparent text-fg hover:bg-bg-alt',
    destructive: 'bg-critical text-bg hover:opacity-90',
    // Legacy alias — pre-v3.0 callers using variant="outline".
    outline:
      'bg-transparent text-fg border border-border-strong hover:bg-bg-alt',
  } as const satisfies Record<LegacyButtonVariant, string>,
  sizes: {
    sm: 'px-4 py-2 min-h-9 text-[11px]', // 36px
    md: 'px-6 py-3 min-h-11 text-[12px]', // 44px
    lg: 'px-8 py-4 min-h-12 text-[13px]', // 48px (≥ 44px touch target)
    // Legacy alias — pre-v3.0 callers using size="icon".
    icon: 'min-h-11 min-w-11 px-3 py-3 text-[12px]',
  } as const satisfies Record<LegacyButtonSize, string>,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leadingIcon,
      trailingIcon,
      disabled = false,
      children,
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
          buttonVariants.sizes[size],
          className,
        )}
        {...rest}
      >
        {isLoading ? (
          <Loader2
            aria-hidden="true"
            className="h-4 w-4 animate-spin"
            strokeWidth={1.5}
          />
        ) : (
          leadingIcon && (
            <span aria-hidden="true" className="inline-flex shrink-0">
              {leadingIcon}
            </span>
          )
        )}
        {children}
        {!isLoading && trailingIcon && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {trailingIcon}
          </span>
        )}
      </button>
    );
  },
);

// Default export retained so pre-v3.0 callsites
// (`import Button from '@/components/ui/Button'`) keep compiling.
// Task 5 (Wave 2) will repoint them through the barrel.
export default Button;
