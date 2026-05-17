'use client';

/**
 * SplashScreen — first-visit luxury loader.
 *
 * Renders a centered Aquad'or wordmark over a bone-on-ink panel for ~2.4s,
 * then fades out. Shown ONCE per browser session (gated on sessionStorage)
 * so back/forward and route navigations inside the same session do not
 * replay the curtain.
 *
 * Mounted high in the tree (root layout) so the splash sits above the page
 * content during its lifetime; once the exit animation completes the
 * component unmounts entirely (no DOM weight remaining).
 *
 * Motion (DESIGN.md §7):
 *   - Wordmark scale-in + fade from 0.92 to 1.0 in 700ms ease-out-quart.
 *   - Hairline grows under the wordmark from 0 to 64px in 900ms after a
 *     200ms delay (signature reveal accent).
 *   - Whole screen fades to 0 + lifts -6px on exit (600ms ease-out-quart).
 *   - All motion zeroed under prefers-reduced-motion (skip splash entirely).
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'aquador:splash-seen:v1';
const HOLD_MS = 2200;

export default function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip for users with reduced-motion preference, or anyone who has seen
    // the splash this session.
    const reducedMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let seen = false;
    try {
      seen = window.sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      // sessionStorage can throw in private windows / SSR rehydration —
      // fall through and show the splash, then mark it on a best-effort basis.
    }
    if (seen) return;

    setShow(true);

    const timer = window.setTimeout(() => {
      setShow(false);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // Ignore — splash will replay next page load, which is acceptable.
      }
    }, HOLD_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
          style={{ pointerEvents: show ? 'auto' : 'none' }}
        >
          {/* Wordmark — scale + opacity reveal */}
          <motion.span
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-fg leading-none tracking-[-0.03em] text-[clamp(2.5rem,8vw,5rem)]"
          >
            Aquad&apos;or
            <span aria-hidden="true" className="ml-1 text-[0.32em] align-top text-accent">
              *
            </span>
          </motion.span>

          {/* Hairline reveal under the wordmark */}
          <motion.span
            aria-hidden="true"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 64, opacity: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-6 block h-px bg-accent"
          />

          {/* Micro-tagline — slow fade after the line draws */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-4 font-micro uppercase tracking-[0.32em] text-[10px] sm:text-[11px] text-fg-muted"
          >
            Nicosia · Niche fragrance
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
