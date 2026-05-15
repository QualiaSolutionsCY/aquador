'use client';

/**
 * Animation Performance Budget System
 *
 * Tracks FPS in real-time and provides performance-based animation simplification.
 * Ensures all animations maintain 60fps on capable devices and gracefully degrade
 * on slower hardware.
 *
 * @module performance/animation-budget
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { usePerformanceMonitor } from '@/lib/analytics/performance-monitor';
import { track } from '@vercel/analytics';

/**
 * Animation budget thresholds
 */
const PERFORMANCE_THRESHOLDS = {
  /** Excellent performance - full effects enabled */
  EXCELLENT: 60,
  /** Good performance - full effects enabled */
  GOOD: 55,
  /** Acceptable performance - simplified effects */
  ACCEPTABLE: 45,
  /** Poor performance - minimal effects only */
  POOR: 45,
} as const;

/**
 * FPS measurement window (ms)
 */
const FPS_MEASUREMENT_WINDOW = 1000; // 1 second

/**
 * Frame drop threshold (ms) - frames taking longer than this are "dropped"
 */
const FRAME_DROP_THRESHOLD = 16; // ~60fps

/**
 * Animation budget interface
 */
export interface AnimationBudget {
  /** Average FPS over the last measurement window */
  averageFps: number;
  /** Whether performance is acceptable (>= 55fps) */
  isPerformant: boolean;
  /** Whether to use simplified animations (< 55fps sustained) */
  shouldSimplify: boolean;
}

/**
 * Animation budget context value
 */
export interface AnimationBudgetContextValue {
  /** Current performance budget */
  budget: AnimationBudget;
  /** Convenience flag for simplified animations */
  shouldUseSimplifiedAnimations: boolean;
}

/**
 * Animation budget context
 */
const AnimationBudgetContext = createContext<AnimationBudgetContextValue | null>(null);

/**
 * Animation Budget Provider
 *
 * Wraps the app and provides global performance monitoring.
 * Automatically tracks FPS and provides performance state to all child components.
 *
 * @example
 * ```tsx
 * <AnimationBudgetProvider>
 *   <App />
 * </AnimationBudgetProvider>
 * ```
 */
export function AnimationBudgetProvider({ children }: { children: ReactNode }) {
  const [budget, setBudget] = useState<AnimationBudget>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return { averageFps: 60, isPerformant: false, shouldSimplify: true };
    }
    return { averageFps: 60, isPerformant: true, shouldSimplify: false };
  });

  // Monitor global FPS and frame drops via RAF — fires analytics on unmount if degraded
  usePerformanceMonitor('animation_budget_global');

  // Track quality adjustment when performance degrades (shouldSimplify flips to true)
  useEffect(() => {
    if (!budget.shouldSimplify) return;
    try {
      track('animation_quality_adjusted', {
        reason: budget.averageFps < 45 ? 'fps_drop' : 'frame_drops',
        avg_fps: Math.round(budget.averageFps),
        device_type: typeof window !== 'undefined'
          ? (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
          : 'desktop',
        timestamp: Date.now(),
      });
    } catch {
      // Fail silently
    }
  }, [budget.shouldSimplify, budget.averageFps]);

  // Track when FPS drops below POOR threshold (budget exceeded)
  useEffect(() => {
    if (budget.averageFps >= PERFORMANCE_THRESHOLDS.POOR) return;
    try {
      track('animation_budget_exceeded', {
        avg_fps: Math.round(budget.averageFps),
        budget_threshold: PERFORMANCE_THRESHOLDS.POOR,
        device_type: typeof window !== 'undefined'
          ? (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
          : 'desktop',
      });
    } catch {
      // Fail silently
    }
  }, [budget.averageFps]);

  useEffect(() => {
    // Skip FPS tracking on server
    if (typeof window === 'undefined') return;

    // Reduced-motion preference is honored at initial state via the lazy initializer;
    // skip FPS measurement loop when it's set so we never overwrite that decision.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let frameCount = 0;
    let lastTime = performance.now();
    let frameId: number;
    let isActive = true;

    const measureFPS = () => {
      if (!isActive) return;

      const currentTime = performance.now();
      const delta = currentTime - lastTime;

      frameCount++;

      // Calculate FPS every second
      if (delta >= FPS_MEASUREMENT_WINDOW) {
        const fps = Math.round((frameCount * 1000) / delta);
        const isPerformant = fps >= PERFORMANCE_THRESHOLDS.GOOD;
        const shouldSimplify = fps < PERFORMANCE_THRESHOLDS.GOOD;

        setBudget({
          averageFps: fps,
          isPerformant,
          shouldSimplify,
        });

        // Log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[AnimationBudget] Average FPS: ${fps}, Performant: ${isPerformant}`);
        }

        // Reset counters
        frameCount = 0;
        lastTime = currentTime;
      }

      frameId = requestAnimationFrame(measureFPS);
    };

    // Start tracking
    frameId = requestAnimationFrame(measureFPS);

    // Cleanup
    return () => {
      isActive = false;
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const contextValue: AnimationBudgetContextValue = {
    budget,
    shouldUseSimplifiedAnimations: budget.shouldSimplify,
  };

  return (
    <AnimationBudgetContext.Provider value={contextValue}>
      {children}
    </AnimationBudgetContext.Provider>
  );
}

/**
 * Hook to access animation budget
 *
 * Provides current FPS metrics and performance flags.
 * Use this to conditionally apply complex animations based on device performance.
 *
 * @returns Animation budget with FPS metrics and performance flags
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const { shouldUseSimplifiedAnimations } = useAnimationBudget();
 *
 *   return (
 *     <motion.div
 *       variants={shouldUseSimplifiedAnimations ? simpleVariants : complexVariants}
 *     />
 *   );
 * }
 * ```
 */
export function useAnimationBudget(): AnimationBudgetContextValue {
  const context = useContext(AnimationBudgetContext);

  if (!context) {
    // Return default budget if not wrapped in provider
    // This allows components to work even without provider (SSR)
    return {
      budget: {
        averageFps: 60,
        isPerformant: true,
        shouldSimplify: false,
      },
      shouldUseSimplifiedAnimations: false,
    };
  }

  return context;
}

/**
 * Track animation performance (development only)
 *
 * Measures animation execution time and logs warnings for dropped frames.
 * In production, reports slow animations to Sentry.
 *
 * @param animationName - Name of the animation for logging
 * @param callback - Animation callback to measure
 *
 * @example
 * ```tsx
 * trackAnimationPerformance('hero-entrance', () => {
 *   // Animation code
 * });
 * ```
 */
export function trackAnimationPerformance(
  animationName: string,
  callback: () => void
): void {
  const startTime = performance.now();

  callback();

  const duration = performance.now() - startTime;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    if (duration > FRAME_DROP_THRESHOLD) {
      console.warn(
        `[Animation] ${animationName}: ${duration.toFixed(2)}ms (dropped frame - threshold: ${FRAME_DROP_THRESHOLD}ms)`
      );
    } else {
      console.log(`[Animation] ${animationName}: ${duration.toFixed(2)}ms`);
    }
  }

  // Report to Sentry in production if duration exceeds threshold
  if (process.env.NODE_ENV === 'production' && duration > FRAME_DROP_THRESHOLD) {
    // Only report if Sentry is available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Sentry.captureMessage(
        `Slow animation: ${animationName} took ${duration.toFixed(2)}ms`,
        {
          level: 'warning',
          tags: {
            animation: animationName,
            duration: duration.toFixed(2),
          },
        }
      );
    }
  }
}

/**
 * Get performance recommendation based on current FPS
 *
 * @param fps - Current average FPS
 * @returns Performance level and recommendation
 */
export function getPerformanceLevel(fps: number): {
  level: 'excellent' | 'good' | 'acceptable' | 'poor';
  recommendation: string;
} {
  if (fps >= PERFORMANCE_THRESHOLDS.EXCELLENT) {
    return {
      level: 'excellent',
      recommendation: 'Full effects enabled',
    };
  }
  if (fps >= PERFORMANCE_THRESHOLDS.GOOD) {
    return {
      level: 'good',
      recommendation: 'Full effects enabled',
    };
  }
  if (fps >= PERFORMANCE_THRESHOLDS.ACCEPTABLE) {
    return {
      level: 'acceptable',
      recommendation: 'Simplified effects recommended',
    };
  }
  return {
    level: 'poor',
    recommendation: 'Minimal effects only',
  };
}
