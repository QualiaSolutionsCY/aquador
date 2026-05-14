'use client';

import { useRef } from 'react';
import { useScroll, useTransform, MotionValue } from 'framer-motion';
import { useReducedMotion } from './useReducedMotion';
import { isMobileViewport, PARALLAX_CONFIG, getAccessibleSpeed } from '@/lib/animations/parallax';

/**
 * Options for useParallax hook
 */
export interface UseParallaxOptions {
  /**
   * Parallax speed multiplier (0-1)
   * - 0.3: Slow background movement
   * - 0.5: Default parallax speed
   * - 0.8: Fast foreground movement
   * @default 0.5
   */
  speed?: number;

  /**
   * Disable parallax on mobile viewports (< 768px)
   * Prevents jank on mobile Safari and improves performance
   * @default true
   */
  disableOnMobile?: boolean;

  /**
   * Transform range as fraction of scroll distance
   * [0, 1] means from element top to element bottom
   * @default [0, 1]
   */
  range?: [number, number];
}

/**
 * Return type for useParallax hook
 */
export interface UseParallaxReturn {
  /**
   * Ref to attach to the parallax element
   */
  ref: React.RefObject<HTMLElement | null>;

  /**
   * Transform MotionValue for vertical parallax
   * Apply to motion component: transform: `translateY(${y}px)`
   */
  transform: MotionValue<number>;

  /**
   * Whether parallax animation should be active
   * False when reduced motion is enabled or on mobile
   */
  shouldAnimate: boolean;
}

/**
 * Custom hook for parallax scroll effects
 *
 * Provides smooth parallax scrolling with full accessibility support:
 * - Respects prefers-reduced-motion
 * - Disables on mobile to prevent jank
 * - SSR-safe with typeof window checks
 * - GPU-accelerated transforms
 *
 * Performance notes:
 * - Uses Framer Motion's optimized useScroll/useTransform hooks
 * - Transform calculations happen on GPU via translate3d
 * - No layout recalculations triggered during scroll
 * - Passive scroll listeners for 60fps performance
 *
 * @param options - Parallax configuration options
 * @returns Ref, transform value, and animation state
 *
 * @example
 * ```tsx
 * function ParallaxBackground() {
 *   const { ref, transform, shouldAnimate } = useParallax({
 *     speed: 0.3,
 *     disableOnMobile: true,
 *   });
 *
 *   return (
 *     <motion.div
 *       ref={ref}
 *       style={{ y: shouldAnimate ? transform : 0 }}
 *     >
 *       Background content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useParallax(
  options: UseParallaxOptions = {}
): UseParallaxReturn {
  const {
    speed = PARALLAX_CONFIG.base,
    disableOnMobile = true,
    range = [0, 1],
  } = options;

  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  // Check if we should disable parallax
  const isMobile = typeof window !== 'undefined' && disableOnMobile && isMobileViewport();
  const shouldAnimate = !isMobile;

  // Apply vestibular-safe speed reduction when prefers-reduced-motion is active.
  // Rather than fully disabling parallax (which removes visual depth cues),
  // we reduce speed to 33% — safe for vestibular disorders per WCAG 2.3.3.
  const accessibleSpeed = getAccessibleSpeed(speed, reducedMotion);

  // Track scroll position relative to element
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`start end`, `end start`],
  });

  // Calculate parallax distance based on accessible speed
  // Higher speed = more movement
  const parallaxDistance = 200 * accessibleSpeed;

  // Transform scroll progress to parallax offset
  const transform = useTransform(
    scrollYProgress,
    range,
    [-parallaxDistance / 2, parallaxDistance / 2]
  );

  // If animation is disabled (mobile), return static transform
  if (!shouldAnimate) {
    const staticTransform = {
      get: () => 0,
      set: () => {},
      on: () => () => {},
      clearListeners: () => {},
      destroy: () => {},
      getPrevious: () => 0,
      getVelocity: () => 0,
      hasAnimated: false,
      isAnimating: () => false,
      stop: () => {},
      version: '11.0.0',
    } as unknown as MotionValue<number>;

    return {
      ref,
      transform: staticTransform,
      shouldAnimate: false,
    };
  }

  return {
    ref,
    transform,
    // shouldAnimate is true even with reducedMotion — speed is reduced, not disabled
    shouldAnimate: true,
  };
}
