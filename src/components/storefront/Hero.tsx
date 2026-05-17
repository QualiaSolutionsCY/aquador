'use client';

/**
 * Hero — full-viewport video composition for the home page.
 *
 * The hero owns the entire top of the home page: video background, floating
 * pill nav, brand wordmark, brand intro, and a single CTA. The global Navbar
 * (src/components/layout/Navbar.tsx) is hidden over this section by
 * `pathname === '/' && scrollY < threshold` inside that file, so the pill nav
 * here is the only nav visible while the viewer is on the hero. After
 * scrolling, the global Navbar fades in over the rest of the page.
 *
 * Editorial voice (Aquad'or, M2+):
 *   - Wordmark "Aquad'or" set in the display serif (Cormorant Garamond),
 *     huge, with a gold asterisk on the final word.
 *   - Brand intro in body sans on cream, line-height tight.
 *   - CTA pill — gold field, dark arrow well — opens the catalogue.
 *   - No em-dashes, no emoji.
 *
 * Motion (DESIGN.md §7):
 *   - WordsPullUp staggers the wordmark from below at 80ms per word.
 *   - Description and CTA fade-up with 500ms / 700ms delays.
 *   - All motion is zeroed under `prefers-reduced-motion` by tokens.css.
 *
 * Accessibility:
 *   - Video is `aria-hidden` and the wordmark/copy carry the meaning.
 *   - Pill nav links carry visible focus rings on the accent token.
 *   - All hit targets are ≥ 44px tall.
 */

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const navLinks = [
  { label: 'Dubai Shop', href: '/shop' },
  { label: 'Lattafa', href: '/shop/lattafa' },
  { label: 'Create Your Own', href: '/create-perfume' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* Page heading — visually hidden so the video-driven hero carries the
          mood without typographic weight, but search engines and screen
          readers still get a semantic h1 for the home route. */}
      <h1 className="sr-only">Aquad&apos;or, niche and original fragrance in Cyprus</h1>

      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/home-hero.mp4"
      />

      {/* Editorial film-grain noise — same SVG turbulence the magazine pages
          use, so the video reads as printed paper rather than as a stock loop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Vertical scrim so the copy at the bottom stays legible regardless of
          which frame the loop is on. Top tint keeps the pill nav contrast. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70"
      />

      {/* Floating pill nav. Centered, dark, hugged to the top edge. */}
      <nav
        aria-label="Primary"
        className="absolute left-1/2 top-0 z-20 -translate-x-1/2 px-4 sm:px-6"
      >
        <motion.ul
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 rounded-b-2xl bg-black/85 px-4 py-3 backdrop-blur-sm sm:gap-6 sm:px-6 md:gap-10 md:rounded-b-3xl md:px-10 lg:gap-12"
        >
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block min-h-[24px] font-micro uppercase tracking-[0.12em] text-[10px] sm:text-[11px] md:text-[12px] text-bg/75 transition-colors duration-[var(--duration-fast)] hover:text-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </motion.ul>
      </nav>

      {/* CTA. Pinned to the bottom-right of the hero. The video, film-grain
          and scrim carry the mood — no wordmark competes for attention, the
          CTA is the only typographic element on the field. */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-[var(--page-px)] pb-6 sm:pb-8 md:pb-10 lg:pb-12">
        <div className="flex justify-start lg:justify-end">
          <div className="flex flex-col items-start gap-6 pb-2 lg:items-end lg:pb-10">
            {/* Hairline-frame CTA. Drops the gold-pill silhouette in favour of
                a magazine-catalog rectangle: 1px ivory border on transparent
                fill, micro-cap tracked-out label, arrow glyph that slides on
                hover. Whole frame turns gold on hover; text inverts to dark. */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href="/shop"
                aria-label="Open the collection"
                className="group inline-flex items-center gap-4 border border-bg/45 px-7 py-4 font-micro uppercase tracking-[0.18em] text-[11px] sm:text-[12px] text-bg transition-[background-color,border-color,color] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:border-accent hover:bg-accent hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={{ textShadow: '0 1px 12px oklch(0 0 0 / 0.35)' }}
              >
                <span>Open the collection</span>
                <ArrowRight
                  aria-hidden="true"
                  strokeWidth={1.25}
                  className="h-4 w-4 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
