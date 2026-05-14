'use client';

/**
 * Tag — v3.0 dismissible chip (Phase 3 Task 2, PRIM-02).
 *
 * Tag is Badge + an optional remove affordance. Surface and typography
 * are inherited from Badge (`badgeBase` + `badgeVariants`) so the two
 * primitives stay visually identical.
 *
 * When `onRemove` is provided, an inline button renders to the right of
 * `label`. The button hit-target is 44px (touch a11y) achieved with a
 * negative margin trick so the visible glyph stays inline with the label.
 * `aria-label` reads "Remove {label}".
 */

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  badgeBase,
  badgeVariants,
  type BadgeVariant,
} from '@/components/ui/Badge';

export interface TagProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Visible text. Also feeds the remove button's aria-label. */
  label: string;
  variant?: BadgeVariant;
  /** When supplied, renders a 12px × icon and wires it up. */
  onRemove?: () => void;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ label, variant = 'neutral', onRemove, className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeBase, badgeVariants[variant], className)}
      {...props}
    >
      <span>{label}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          // 44px touch target via a 16px-padded hit area around a 12px glyph.
          // Negative margin keeps the visible icon flush with the label so
          // the chip doesn't balloon in width.
          className={cn(
            '-my-3 -mr-1 ml-1 inline-flex h-11 w-11 items-center justify-center',
            'rounded-sm transition-colors duration-150',
            'hover:bg-fg/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          )}
        >
          <X strokeWidth={1.5} className="h-3 w-3" aria-hidden="true" />
        </button>
      ) : null}
    </span>
  ),
);
Tag.displayName = 'Tag';
