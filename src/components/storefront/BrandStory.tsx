'use client';

/**
 * BrandStory. Second numbered editorial section, magazine-spread layout
 * (HOME-02).
 *
 * Spec: .planning/DESIGN.md §10b "Magazine spread" pattern. Image column
 * bleeds to the viewport edge on md+ via the negative-page-px margin trick.
 *
 * Motion (M3 polish, matches Hero parallax at e1676ca):
 *   - useScroll tracks the section across the viewport.
 *   - The image panel parallaxes down ~8% as you scroll past, while the type
 *     column counter-shifts upward by ~5%, the same trick the Hero uses for
 *     its 45/55 spread.
 *   - The image carries the ken-burns class (defined in tokens.css §7) so the
 *     parchment placeholder breathes slowly until production photography
 *     swaps in.
 *   - RevealHeader plays the rule → title cascade; the body line follows on
 *     a 0.3s delay so the eye reads top to bottom in choreography.
 *
 * Image is a parchment placeholder (bg-bg-alt) until production photography
 * is supplied. The aspect ratio (4:5) and the bleed are the load-bearing
 * design choices; the image src will swap in later without disturbing layout.
 *
 * Voice constants (locked, grepped by verifier):
 *   title: "Cyprus by way of Levantine paperwork."
 */

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import RevealHeader from './RevealHeader';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function BrandStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const textY = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['5%', '-5%']);
  const imageY = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['-4%', '8%']);

  return (
    <section
      ref={sectionRef}
      className="border-t border-border py-16 md:py-24 overflow-x-hidden overflow-y-visible"
    >
      <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8 px-[var(--page-px)]">
        <motion.div style={{ y: textY }}>
          <RevealHeader
            title="Cyprus by way of Levantine paperwork."
            titleClassName="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]"
          />

          <motion.p
            initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
            className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]"
          >
            Aquad&apos;or operates out of Nicosia. The catalogue draws from
            Lattafa and Al-Haramain houses for oud and amber, from Victoria&apos;s
            Secret originals for the clean musks, and from a small bench of
            independent perfumers we trust. The shipment leaves Cyprus three
            days a week. The letter that comes with it is written by one of us.
          </motion.p>
        </motion.div>

        <motion.div
          aria-hidden="true"
          style={{ y: imageY }}
          className="relative aspect-[4/5] overflow-hidden bg-bg-alt md:mr-[calc(-1*var(--page-px))]"
        >
          {/* Inner ken-burns layer. Even without a photo, the slow scale drift
              keeps the parchment surface from reading as flat dead space. */}
          <div className="absolute inset-0 animate-ken-burns bg-bg-alt" />
        </motion.div>
      </div>
    </section>
  );
}
