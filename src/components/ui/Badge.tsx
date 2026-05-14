'use client';

/**
 * Badge — v3.0 inline status pill (Phase 3 Task 2, PRIM-02).
 *
 * Five semantic variants: neutral, accent, success, warning, critical.
 * Common shell: 11px uppercase Geist micro, 0.05em tracking, --space-2 × --space-1
 * padding, --radius-sm corners. No fixed min-width — width follows label.
 *
 * The `badgeVariants` map is exported so `Tag` (which extends Badge with a
 * remove affordance) can share the exact same surface treatment without
 * forking the class strings.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'critical';

/**
 * Variant → surface+text class string. Each tile uses a 12% tint of the
 * semantic hue so the badge reads as quiet status rather than UI noise.
 */
export const badgeVariants: Record<BadgeVariant, string> = {
  neutral: 'bg-bg-alt text-fg-muted',
  accent: 'bg-accent/12 text-accent-deep',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/12 text-warning',
  critical: 'bg-critical/12 text-critical',
};

/**
 * Common shell for any badge-shaped chip (Badge + Tag both use it).
 * Editorial restraint: micro typography, no fixed min-width.
 */
export const badgeBase =
  'inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[11px] uppercase tracking-[0.05em] font-medium font-micro';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeBase, badgeVariants[variant], className)}
      {...props}
    />
  ),
);
Badge.displayName = 'Badge';
