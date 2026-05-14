'use client';

import { useInView, type UseInViewOptions } from 'framer-motion';
import { useRef, type RefObject } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Return type for useScrollAnimation hook
 */
export interface UseScrollAnimationReturn {
  /** Ref to attach to the element you want to observe */
  ref: RefObject<Element | null>;
  /** True when the element is in view */
  isInView: boolean;
  /** True when animations should be played (respects reduced motion) */
  shouldAnimate: boolean;
}

/**
 * Combines Framer Motion's useInView with reduced motion awareness
 *
 * This hook provides scroll-triggered animation control that respects
 * user accessibility preferences. If the user has prefers-reduced-motion
 * enabled, shouldAnimate will be false.
 *
 * Default intersection options:
 * - once: true (animate once, don't repeat)
 * - amount: 0.2 (trigger when 20% visible)
 * - margin: "-50px" (trigger slightly before entering viewport)
 *
 * @param options - Optional Framer Motion intersection options to override defaults
 * @returns Object with ref, isInView, and shouldAnimate
 *
 * @example
 * ```tsx
 * function ScrollAnimatedSection() {
 *   const { ref, shouldAnimate } = useScrollAnimation();
 *
 *   return (
 *     <motion.div
 *       ref={ref}
 *       initial={{ opacity: 0, y: 30 }}
 *       animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 *
 * @example Custom intersection options
 * ```tsx
 * const { ref, shouldAnimate } = useScrollAnimation({
 *   once: false,        // Repeat animation on scroll
 *   amount: 0.5,        // Trigger when 50% visible
 *   margin: "0px",      // No margin offset
 * });
 * ```
 */
export function useScrollAnimation(
  options?: UseInViewOptions
): UseScrollAnimationReturn {
  const ref = useRef<Element>(null);
  const reducedMotion = useReducedMotion();

  // Default intersection options optimized for scroll animations
  const defaultOptions: UseInViewOptions = {
    once: true,      // Animate once by default
    amount: 0.2,     // Trigger when 20% of element is visible
    margin: '-50px', // Trigger 50px before element enters viewport
  };

  // Merge provided options with defaults
  const mergedOptions = { ...defaultOptions, ...options };

  // Use Framer Motion's useInView with our ref and options
  const isInView = useInView(ref, mergedOptions);

  // Determine if we should animate
  // If user has reduced motion enabled, don't animate
  const shouldAnimate = !reducedMotion && isInView;

  return {
    ref,
    isInView,
    shouldAnimate,
  };
}
