/**
 * Parallax animation configurations and utilities
 *
 * Performance-optimized parallax scrolling with mobile detection
 * and reduced motion support.
 *
 * Mobile strategy: Parallax disabled on viewports < 768px to prevent
 * Safari jank and improve battery performance.
 */

import { useEffect, useRef } from 'react';
import { trackParallaxEngagement } from '@/lib/analytics/engagement-tracker';

// Easing from scroll-animations.ts
const EXPO_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Parallax speed multipliers
 *
 * - slow: 0.3 - Gentle background movement
 * - base: 0.5 - Default parallax speed
 * - fast: 0.8 - Dramatic foreground movement
 */
export const PARALLAX_CONFIG = {
  slow: 0.3,
  base: 0.5,
  fast: 0.8,
  easing: EXPO_EASE,
} as const;

/**
 * Accessibility configuration for vestibular-safe parallax
 *
 * Users with vestibular disorders (e.g., BPPV, labyrinthitis) can experience
 * nausea and disorientation from parallax motion. WCAG 2.3.3 recommends
 * reducing or eliminating motion for these users.
 *
 * vestibularSafeMultiplier: 0.33 reduces parallax speed to one-third of
 * the requested speed — enough to retain visual depth without triggering
 * vestibular symptoms. This applies when prefers-reduced-motion is "reduce".
 *
 * Note: Full disable (speed = 0) is also respected when the component
 * explicitly opts in to that behavior.
 */
export const ACCESSIBILITY_CONFIG = {
  /**
   * Multiplier applied to parallax speed when prefers-reduced-motion is active.
   * 0.33 = one third of normal speed (33%).
   */
  vestibularSafeMultiplier: 0.33,
} as const;

/**
 * Get the accessible parallax speed
 *
 * When the user has prefers-reduced-motion enabled, parallax speed is
 * reduced to 33% of the requested value rather than disabled entirely.
 * This retains visual hierarchy cues while preventing vestibular triggers.
 *
 * @param speed - The desired parallax speed (0-1)
 * @param reducedMotion - Whether prefers-reduced-motion is active
 * @returns Effective speed, reduced for vestibular safety if needed
 *
 * @example
 * ```ts
 * const effectiveSpeed = getAccessibleSpeed(0.5, reducedMotion);
 * // With reducedMotion=true:  returns 0.165 (0.5 * 0.33)
 * // With reducedMotion=false: returns 0.5
 * ```
 */
export function getAccessibleSpeed(speed: number, reducedMotion: boolean): number {
  if (reducedMotion) {
    return speed * ACCESSIBILITY_CONFIG.vestibularSafeMultiplier;
  }
  return speed;
}

/**
 * Preset parallax transform ranges
 *
 * Defines input/output ranges for different parallax intensities.
 * All ranges use viewport-based scroll positions.
 */
export const parallaxVariants = {
  subtle: {
    inputRange: [0, 1000],
    outputRange: [0, -30],
  },
  medium: {
    inputRange: [0, 1000],
    outputRange: [0, -80],
  },
  dramatic: {
    inputRange: [0, 1000],
    outputRange: [0, -150],
  },
} as const;

/**
 * Create a parallax transform function
 *
 * Maps scroll position to transform value with optional clamping.
 * Use this with Framer Motion's useTransform() hook.
 *
 * @param scrollY - MotionValue from useScroll()
 * @param inputRange - Scroll positions [start, end]
 * @param outputRange - Transform values [start, end]
 * @param clamp - Whether to clamp values outside range (default: true)
 *
 * @example
 * ```tsx
 * const { scrollY } = useScroll();
 * const y = useTransform(
 *   scrollY,
 *   createParallaxTransform([0, 1000], [0, -100])
 * );
 * ```
 */
export function createParallaxTransform(
  inputRange: [number, number],
  outputRange: [number, number],
  clamp: boolean = true
) {
  return {
    inputRange,
    outputRange,
    clamp,
  };
}

/**
 * Mobile-disabled pattern helper
 *
 * Returns true if parallax should be disabled based on viewport width.
 * Mobile threshold: 768px (md breakpoint in Tailwind)
 *
 * @returns {boolean} true if mobile viewport detected
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Get parallax speed based on viewport
 *
 * Returns zero speed on mobile to disable parallax effects.
 * This prevents jank on mobile Safari and improves performance.
 *
 * @param speed - Desired speed multiplier
 * @param disableOnMobile - Whether to disable on mobile (default: true)
 * @returns Effective speed (0 on mobile if disabled)
 */
export function getEffectiveSpeed(
  speed: number,
  disableOnMobile: boolean = true
): number {
  if (disableOnMobile && isMobileViewport()) {
    return 0;
  }
  return speed;
}

// ─── Parallax Engagement Tracking Hook ───────────────────────────────────────

/**
 * useParallaxEngagementTracking
 *
 * Tracks when a parallax element has been visible in the viewport for >1 second.
 * Uses IntersectionObserver for efficient visibility detection.
 * Fires trackParallaxEngagement when the element leaves the viewport after
 * sufficient engagement time.
 *
 * @param ref - React ref attached to the parallax container element
 * @param elementId - Identifier for this element in analytics (e.g. "hero-background")
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useParallaxEngagementTracking(ref, 'hero-background');
 * return <div ref={ref}>...</div>;
 * ```
 */
export function useParallaxEngagementTracking(
  ref: React.RefObject<Element | null>,
  elementId: string
): void {
  const enterTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Element entered viewport — start timer
            enterTimeRef.current = performance.now();
          } else if (enterTimeRef.current !== null) {
            // Element left viewport — calculate duration and fire if >1s
            const durationMs = performance.now() - enterTimeRef.current;
            enterTimeRef.current = null;
            trackParallaxEngagement(elementId, durationMs);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      // Fire on unmount if element was still visible
      if (enterTimeRef.current !== null) {
        const durationMs = performance.now() - enterTimeRef.current;
        trackParallaxEngagement(elementId, durationMs);
        enterTimeRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementId]);
}
