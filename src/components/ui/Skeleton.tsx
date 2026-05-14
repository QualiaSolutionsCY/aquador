'use client';

/**
 * Skeleton — v3.0 loading placeholder (Phase 3 Task 2, PRIM-02).
 *
 * Tokenized replacement for ad-hoc pulse-over-neutral usages. Surface is
 * `bg-bg-alt` so the placeholder reads as a paused tile of the page.
 * Three shapes:
 *   - text:   `h-4 w-full rounded-sm` — single line of body copy
 *   - rect:   `rounded-sm` with caller-supplied width/height (image, card body)
 *   - circle: `rounded-full aspect-square` — avatar, dot indicator
 *
 * Motion: 1500ms ease-in-out opacity loop (`animate-skeleton-pulse`, defined
 * in tailwind.config.ts theme). `prefers-reduced-motion` is honoured by the
 * global reduced-motion media query in tokens.css.
 *
 * A11y: renders `role="status"`, `aria-busy="true"`, `aria-live="polite"` so
 * screen readers announce the pending state without trapping focus.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  /** Caller-supplied width. Number → px, string → CSS value (e.g. '8rem', '100%'). */
  width?: string | number;
  /** Caller-supplied height. Number → px, string → CSS value. */
  height?: string | number;
}

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded-sm',
  rect: 'rounded-sm',
  circle: 'rounded-full aspect-square',
};

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'text', width, height, className, style, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'bg-bg-alt animate-skeleton-pulse',
        variantClasses[variant],
        className,
      )}
      style={{
        ...style,
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';
