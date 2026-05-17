import type { Variants } from 'framer-motion'

/**
 * Page Transition Animation System
 *
 * Optimized for Next.js App Router with focus on perceived performance.
 * Uses opacity-only transitions to prevent layout shift during navigation.
 */

/**
 * Main page transition with smooth fade + soft blur on enter/exit.
 * - Opacity + filter:blur only, no y-axis movement so layout never shifts.
 * - 380ms enter / 220ms exit — exit is slightly faster than enter so the
 *   incoming route feels responsive while the outgoing one releases cleanly.
 * - Cubic-bezier easing matches globals.css --ease-out-expo (enter) and a
 *   classic ease-in (exit) so the curve direction reads as "moving away".
 */
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
  },
  exit: {
    opacity: 0,
    filter: 'blur(6px)',
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] }
  }
}

/**
 * Reduced motion variant for accessibility
 * - Faster timing (100ms enter, 50ms exit)
 * - Respects user's prefers-reduced-motion preference
 */
export const pageTransitionReducedMotion: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.05 } }
}

/**
 * Active navigation indicator animation
 * - Smooth underline/indicator that follows active link
 * - Use with Framer Motion layoutId for shared layout animations
 */
export const navIndicatorVariants: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    scaleX: 0,
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

/**
 * Navigation link hover state
 * - Subtle lift effect on hover
 * - Enhances tactile feedback for navigation
 */
export const navLinkVariants: Variants = {
  idle: { y: 0 },
  hover: {
    y: -2,
    transition: { duration: 0.2, ease: 'easeOut' }
  }
}

/**
 * Navigation configuration for shared settings
 */
export const navTransitionConfig = {
  /**
   * Duration for active indicator movement between links
   */
  indicatorDuration: 0.3,

  /**
   * Duration for link hover effects
   */
  hoverDuration: 0.2,

  /**
   * Easing function for smooth transitions
   */
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
} as const
