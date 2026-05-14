'use client';

/**
 * Avatar — v3.0 user/profile image primitive (Phase 3 Task 2, PRIM-02).
 *
 * Wraps `@radix-ui/react-avatar` so the image swap → fallback transition is
 * handled correctly (Radix waits for the image to resolve before showing
 * `Avatar.Fallback`). Editorial default: `rounded-sm` (square corners with a
 * 4px radius) — the brand is a perfume merchant, not a social network. Pass
 * `shape="circle"` only when context demands a round portrait.
 *
 * Sizes (px): sm=28, md=40, lg=56. The wrapper sets `text-[N]` so the
 * fallback initials scale with the surface.
 */

import * as React from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarShape = 'square' | 'circle';

export interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Image source. Optional — fallback renders if missing or unresolved. */
  src?: string;
  /** Alt text for the image. Required for a11y when `src` is provided. */
  alt?: string;
  /** Visible glyph when the image cannot load (initials, single letter, etc). */
  fallback: string;
  size?: AvatarSize;
  /** `square` (editorial default, `rounded-sm`) or `circle` (`rounded-full`). */
  shape?: AvatarShape;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-[11px]', // 28px
  md: 'h-10 w-10 text-[13px]', // 40px
  lg: 'h-14 w-14 text-[16px]', // 56px
};

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  (
    { src, alt = '', fallback, size = 'md', shape = 'square', className, ...props },
    ref,
  ) => (
    <RadixAvatar.Root
      ref={ref}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden align-middle',
        'select-none bg-accent/12 text-fg',
        sizeClasses[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-sm',
        className,
      )}
      {...props}
    >
      {src ? (
        <RadixAvatar.Image
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : null}
      <RadixAvatar.Fallback
        delayMs={src ? 200 : 0}
        className={cn(
          'flex h-full w-full items-center justify-center font-micro font-medium uppercase tracking-[0.05em]',
        )}
      >
        {fallback}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  ),
);
Avatar.displayName = 'Avatar';
