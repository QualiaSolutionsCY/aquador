'use client';

import { motion, MotionProps } from 'framer-motion';
import { useParallax } from '@/hooks/useParallax';
import { ElementType, ReactNode } from 'react';
import { useParallaxEngagementTracking } from '@/lib/animations/parallax';

/**
 * Props for ParallaxSection component
 */
export interface ParallaxSectionProps {
  /**
   * Content to render inside the parallax container
   */
  children: ReactNode;

  /**
   * Parallax speed multiplier (0-1)
   * - 0.3: Slow background movement
   * - 0.5: Default parallax speed
   * - 0.8: Fast foreground movement
   * @default 0.5
   */
  speed?: number;

  /**
   * Additional CSS classes to apply
   */
  className?: string;

  /**
   * HTML element type to render
   * @default 'div'
   */
  as?: ElementType;

  /**
   * Disable parallax on mobile viewports (< 768px)
   * @default true
   */
  disableOnMobile?: boolean;

  /**
   * Transform range as fraction of scroll distance
   * @default [0, 1]
   */
  range?: [number, number];

  /**
   * Analytics element ID for parallax engagement tracking
   * If provided, tracks time this element is visible in viewport (>1s)
   */
  trackingId?: string;

  /**
   * Accessible label for this parallax section.
   *
   * - Omit (or leave undefined) for purely **decorative** backgrounds — the
   *   component will set role="presentation" so screen readers skip it.
   * - Provide a string when the section carries **meaningful content** that
   *   screen readers should announce.
   */
  ariaLabel?: string;
}

/**
 * ParallaxSection - Reusable parallax wrapper component
 *
 * Drop-in wrapper that adds smooth parallax scrolling to any content.
 * Automatically handles:
 * - Reduced motion / vestibular safety: when prefers-reduced-motion is active,
 *   parallax speed is reduced to 33% (via ACCESSIBILITY_CONFIG.vestibularSafeMultiplier)
 *   rather than fully disabled — retaining visual depth without triggering symptoms
 * - Mobile viewport detection: parallax fully disabled on < 768px to prevent jank
 * - GPU-accelerated transforms
 * - SSR compatibility
 *
 * Performance:
 * - Uses Framer Motion's optimized scroll hooks
 * - Transform-only animations (no layout recalculation)
 * - Passive scroll listeners for 60fps
 * - Automatically disabled on mobile to prevent jank
 *
 * @example
 * ```tsx
 * // Background layer with slow parallax
 * <ParallaxSection speed={0.3} className="absolute inset-0">
 *   <div className="bg-gradient-to-b from-black to-gray-900" />
 * </ParallaxSection>
 *
 * // Foreground element with fast parallax
 * <ParallaxSection speed={0.8} as="section">
 *   <h2>Parallax Content</h2>
 * </ParallaxSection>
 * ```
 */
export function ParallaxSection({
  children,
  speed = 0.5,
  className = '',
  as = 'div',
  disableOnMobile = true,
  range = [0, 1],
  trackingId,
  ariaLabel,
}: ParallaxSectionProps) {
  const { ref, transform, shouldAnimate } = useParallax({
    speed,
    disableOnMobile,
    range,
  });

  // Track parallax engagement when element is visible >1s
  useParallaxEngagementTracking(ref, trackingId ?? `parallax-${speed}`);

  // Create motion component with the specified element type
  const MotionComponent = motion[as as keyof typeof motion] as React.ComponentType<
    MotionProps & { ref: React.RefObject<HTMLElement | null>; className?: string }
  >;

  // Decorative parallax elements get role="presentation" so screen readers
  // skip them. Meaningful sections receive an aria-label instead.
  const ariaProps = ariaLabel
    ? { 'aria-label': ariaLabel }
    : { role: 'presentation' as const, 'aria-hidden': true as const };

  return (
    <MotionComponent
      ref={ref}
      className={className}
      style={{
        y: shouldAnimate ? transform : 0,
        willChange: shouldAnimate ? 'transform' : 'auto',
      }}
      // Prevent layout shift during initial render
      initial={false}
      {...ariaProps}
    >
      {children}
    </MotionComponent>
  );
}
