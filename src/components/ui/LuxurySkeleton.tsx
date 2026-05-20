'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LuxurySkeletonProps {
  className?: string;
}

/**
 * Base luxury skeleton component with gold shimmer sweep animation.
 * Replaces generic gray pulse with branded gold shimmer for premium feel.
 */
export function LuxurySkeleton({ className = '' }: LuxurySkeletonProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div
      className={`bg-gray-100 border border-gray-800/15 rounded-2xl ${className}`}
      style={{
        background: prefersReducedMotion
          ? 'oklch(0.94 0.005 85)' // Static light background with slight gold tint
          : 'linear-gradient(90deg, oklch(0.94 0.005 85) 25%, oklch(0.94 0.005 85 / 0.95) 37.5%, oklch(0.78 0.11 85 / 0.08) 50%, oklch(0.94 0.005 85 / 0.95) 62.5%, oklch(0.94 0.005 85) 75%)',
        backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
        animation: prefersReducedMotion ? 'none' : 'luxuryShimmer 2s ease-in-out infinite',
      }}
    />
  );
}

/**
 * Luxury product card skeleton matching ProductCard exact dimensions.
 */
export function LuxuryProductCardSkeleton() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-800/15 bg-gray-100">
      {/* Image placeholder - aspect-[4/5] matching ProductImage card variant */}
      <div
        className="w-full aspect-[4/5]"
        style={{
          background: prefersReducedMotion
            ? 'oklch(0.94 0.005 85)'
            : 'linear-gradient(90deg, oklch(0.94 0.005 85) 25%, oklch(0.15 0.01 85 / 0.95) 37.5%, oklch(0.78 0.11 85 / 0.08) 50%, oklch(0.15 0.01 85 / 0.95) 62.5%, oklch(0.94 0.005 85) 75%)',
          backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
          animation: prefersReducedMotion ? 'none' : 'luxuryShimmer 2s ease-in-out infinite',
        }}
      />

      {/* Content placeholders - matching ProductCard padding */}
      <div className="p-4 md:p-5 space-y-3">
        {/* Brand placeholder */}
        <div
          className="h-2.5 w-16 rounded"
          style={{
            background: prefersReducedMotion
              ? 'oklch(0.94 0.005 85)'
              : 'linear-gradient(90deg, oklch(0.94 0.005 85) 25%, oklch(0.15 0.01 85 / 0.95) 37.5%, oklch(0.78 0.11 85 / 0.08) 50%, oklch(0.15 0.01 85 / 0.95) 62.5%, oklch(0.94 0.005 85) 75%)',
            backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
            animation: prefersReducedMotion ? 'none' : 'luxuryShimmer 2s ease-in-out infinite',
            animationDelay: '0.1s',
          }}
        />

        {/* Name placeholder */}
        <div
          className="h-4 w-3/4 rounded"
          style={{
            background: prefersReducedMotion
              ? 'oklch(0.94 0.005 85)'
              : 'linear-gradient(90deg, oklch(0.94 0.005 85) 25%, oklch(0.15 0.01 85 / 0.95) 37.5%, oklch(0.78 0.11 85 / 0.08) 50%, oklch(0.15 0.01 85 / 0.95) 62.5%, oklch(0.94 0.005 85) 75%)',
            backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
            animation: prefersReducedMotion ? 'none' : 'luxuryShimmer 2s ease-in-out infinite',
            animationDelay: '0.2s',
          }}
        />

        {/* Price placeholder */}
        <div
          className="h-5 w-20 rounded"
          style={{
            background: prefersReducedMotion
              ? 'oklch(0.94 0.005 85)'
              : 'linear-gradient(90deg, oklch(0.94 0.005 85) 25%, oklch(0.15 0.01 85 / 0.95) 37.5%, oklch(0.78 0.11 85 / 0.08) 50%, oklch(0.15 0.01 85 / 0.95) 62.5%, oklch(0.94 0.005 85) 75%)',
            backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
            animation: prefersReducedMotion ? 'none' : 'luxuryShimmer 2s ease-in-out infinite',
            animationDelay: '0.3s',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Product grid skeleton with staggered shimmer wave effect.
 */
interface LuxuryProductGridSkeletonProps {
  count?: number;
}

export function LuxuryProductGridSkeleton({ count = 8 }: LuxuryProductGridSkeletonProps) {
  return (
    <>
      <style jsx global>{`
        @keyframes luxuryShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.4,
            }}
          >
            <LuxuryProductCardSkeleton />
          </motion.div>
        ))}
      </div>
    </>
  );
}

/**
 * Filter bar skeleton matching AnimatedFilterBar dimensions.
 */
export function LuxuryFilterSkeleton() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const pills = [
    { width: 'w-24' },
    { width: 'w-20' },
    { width: 'w-28' },
    { width: 'w-24' },
    { width: 'w-32' },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes luxuryShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>

      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {pills.map((pill, index) => (
          <div
            key={index}
            className={`h-[44px] ${pill.width} rounded-lg`}
            style={{
              background: prefersReducedMotion
                ? 'oklch(0.94 0.005 85)'
                : 'linear-gradient(90deg, oklch(0.94 0.005 85) 25%, oklch(0.15 0.01 85 / 0.95) 37.5%, oklch(0.78 0.11 85 / 0.08) 50%, oklch(0.15 0.01 85 / 0.95) 62.5%, oklch(0.94 0.005 85) 75%)',
              backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
              animation: prefersReducedMotion ? 'none' : 'luxuryShimmer 2s ease-in-out infinite',
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Hero section skeleton for shop/category pages.
 */
export function LuxuryHeroSkeleton() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes luxuryShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>

      <div className="relative py-16 md:py-20 overflow-hidden bg-gray-100/50">
        <div className="mx-auto max-w-[var(--container-full)] px-4 text-center space-y-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div
            className="h-12 w-64 rounded mx-auto"
            style={{
              background: prefersReducedMotion
                ? 'oklch(0.94 0.005 85)'
                : 'linear-gradient(90deg, oklch(0.94 0.005 85) 25%, oklch(0.15 0.01 85 / 0.95) 37.5%, oklch(0.78 0.11 85 / 0.08) 50%, oklch(0.15 0.01 85 / 0.95) 62.5%, oklch(0.94 0.005 85) 75%)',
              backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
              animation: prefersReducedMotion ? 'none' : 'luxuryShimmer 2s ease-in-out infinite',
            }}
          />

          {/* Subtitle */}
          <div
            className="h-6 w-96 max-w-full rounded mx-auto"
            style={{
              background: prefersReducedMotion
                ? 'oklch(0.94 0.005 85)'
                : 'linear-gradient(90deg, oklch(0.94 0.005 85) 25%, oklch(0.15 0.01 85 / 0.95) 37.5%, oklch(0.78 0.11 85 / 0.08) 50%, oklch(0.15 0.01 85 / 0.95) 62.5%, oklch(0.94 0.005 85) 75%)',
              backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
              animation: prefersReducedMotion ? 'none' : 'luxuryShimmer 2s ease-in-out infinite',
              animationDelay: '0.2s',
            }}
          />
        </div>
      </div>
    </>
  );
}
