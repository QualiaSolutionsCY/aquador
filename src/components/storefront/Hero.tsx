'use client';

/**
 * Hero. Homepage magazine-spread editorial moment.
 *
 * Layout: 45/55 grid at lg+. Type column left, full-bleed video right with a
 * professional gradient overlay (warm scrim from bg-alt at the bottom +
 * subtle right-edge vignette) so the body type remains legible against
 * arbitrary video frames.
 *
 * Seamless loop: two stacked <video> elements crossfade over a 1.2s window
 * before the first instance ends. The second instance pre-seeks to t=0 and
 * starts playing; both fade through opacity to hide the hard cut. The first
 * instance then resets to t=0 and waits to swap back. This avoids the
 * visible jump at the boundary of a single `<video loop>`.
 *
 * Parallax: useScroll + useTransform from framer-motion drives a slow Y
 * translation on the video container and a counter-shift on the type column,
 * so scrolling pulls the type up while the imagery falls behind — a classic
 * magazine spread parallax. Reduced-motion users get static positions.
 *
 * Voice: shipping line stays factually accurate (free shipping over 35 euro
 * threshold matches the actual checkout policy at src/lib/constants.ts:34).
 * Title and supporting line refreshed per owner direction.
 */

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const CROSSFADE_S = 1.2;

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', reducedMotion ? '0%' : '18%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', reducedMotion ? '0%' : '-10%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.35, 0.6]);

  useEffect(() => {
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    a.style.opacity = '1';
    b.style.opacity = '0';
    let active: HTMLVideoElement = a;
    let inactive: HTMLVideoElement = b;
    let handoffStarted = false;
    void a.play().catch(() => {});

    const tick = () => {
      const remaining = active.duration - active.currentTime;
      if (!handoffStarted && remaining < CROSSFADE_S && Number.isFinite(remaining)) {
        handoffStarted = true;
        inactive.currentTime = 0;
        void inactive.play().catch(() => {});
      }
      if (handoffStarted) {
        const t = Math.max(0, Math.min(1, remaining / CROSSFADE_S));
        active.style.opacity = String(t);
        inactive.style.opacity = String(1 - t);
      }
    };

    const onEnded = () => {
      handoffStarted = false;
      active.pause();
      active.currentTime = 0;
      active.style.opacity = '0';
      inactive.style.opacity = '1';
      const tmp = active;
      active = inactive;
      inactive = tmp;
    };

    const interval = window.setInterval(tick, 80);
    a.addEventListener('ended', onEnded);
    b.addEventListener('ended', onEnded);

    return () => {
      window.clearInterval(interval);
      a.removeEventListener('ended', onEnded);
      b.removeEventListener('ended', onEnded);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative grid w-full grid-cols-1 overflow-hidden lg:grid-cols-[45%_55%] lg:min-h-[92vh]"
    >
      <motion.div
        style={{ y: textY }}
        className="relative order-2 z-10 flex items-end bg-bg-alt px-[var(--page-px)] py-16 lg:order-1 lg:py-[var(--page-py)]"
      >
        <div className="w-full max-w-[var(--container-prose)]">
          <p className="font-micro uppercase tracking-[0.18em] text-[length:var(--font-size-micro)] text-fg-muted">
            Aquad&apos;or, Nicosia.
          </p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 font-display text-fg leading-[0.95] tracking-[-0.02em] text-[length:var(--font-display-2xl)] lg:text-[length:var(--font-display-3xl)]"
          >
            Perfume,
            <br />
            curated in
            <br />
            <span className="italic text-accent-deep">Nicosia.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 max-w-[var(--container-narrow)] font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed"
          >
            Niche, Lattafa, and our own essence oils. One hundred fragrances on the desk, hand-curated and shipped from Cyprus.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12"
          >
            <Link
              href="/shop"
              className={cn(
                buttonVariants.base,
                buttonVariants.variants.primary,
                buttonVariants.sizes.lg,
                'group relative',
              )}
            >
              <span className="relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-[var(--duration-base)] after:ease-[var(--ease-out-quart)] group-hover:after:w-full">
                Open the collection
              </span>
            </Link>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.55 }}
            className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted"
          >
            <li>Free shipping over 35 euro.</li>
            <li aria-hidden="true" className="text-border-strong">
              /
            </li>
            <li>No returns.</li>
            <li aria-hidden="true" className="text-border-strong">
              /
            </li>
            <li>Authenticity guaranteed.</li>
          </motion.ul>
        </div>
      </motion.div>

      <motion.div
        style={{ y: videoY }}
        className="relative order-1 min-h-[60vh] overflow-hidden bg-bg-alt lg:order-2 lg:min-h-full"
      >
        <video
          ref={videoARef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          src="/videos/hero.mp4"
          poster="/images/aquadour1.jpg"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <video
          ref={videoBRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          src="/videos/hero.mp4"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        <noscript>
          <Image
            src="/images/aquadour1.jpg"
            alt="An Aquad'or perfume composition resting on the perfumer's desk."
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </noscript>

        {/* Editorial overlay — vertical scrim from the bottom in bg-alt, plus a
            warm right-edge vignette that tucks the video into the page so it
            doesn't read as a stock-footage loop. */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: overlayOpacity }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-alt via-bg-alt/30 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-l from-bg-alt/50 via-transparent to-transparent lg:from-bg-alt/30"
        />
        {/* Soft film grain so the overlay reads as paper, not as a flat sheet. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />

        <div className="absolute right-6 bottom-6 z-10 hidden items-center gap-3 lg:flex">
          <span className="h-px w-12 bg-fg/40" aria-hidden="true" />
          <p className="font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-bg/90 [text-shadow:0_1px_2px_oklch(0.10_0_0_/_0.4)]">
            Composition no. 04, on bone linen.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
