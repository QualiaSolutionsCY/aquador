'use client';

/**
 * NotesStory. Numbered editorial section 01 of the homepage (HOME-02).
 *
 * Spec: .planning/DESIGN.md §10b — hairline-divider stack, type-led layout,
 * NO Card wrapper. Voice constants are locked in phase-1-plan.md and grepped
 * by the verifier.
 *
 * Motion (M3 polish, matches Hero parallax at e1676ca):
 *   - useScroll tracks the section across its full traversal of the viewport.
 *   - The headline rises slightly as you scroll down past it; the body line
 *     falls slightly. Parallax sits on outer motion divs so it composes with
 *     the inner reveal animation without fighting it.
 *   - The header cascade (rule → h2) reveals in choreographed sequence via
 *     RevealHeader; the body line reveals with a 0.3s delay so the eye is
 *     pulled top to base, in the same order the copy reads.
 *   - Reduced-motion users get static positions (parallax zeroed, reveal
 *     animations short-circuited by RevealHeader and the inline motion.p).
 */

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import RevealHeader from './RevealHeader';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function NotesStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['6%', '-6%']);
  const bodyY = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['-3%', '3%']);

  return (
    <section
      ref={sectionRef}
      className="border-t border-border py-16 md:py-24 px-[var(--page-px)]"
    >
      <div className="max-w-[var(--container-narrow)]">
        <motion.div style={{ y: titleY }}>
          <RevealHeader title="The pyramid, read top to base." />
        </motion.div>
        <motion.div style={{ y: bodyY }} className="mt-8">
          <motion.p
            initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
            className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed"
          >
            A fragrance opens with citrus and aldehydes, then settles into heart
            florals and spice, and ends on woods, resins, and musk. The top is
            the first impression. The heart is the wear. The base is what the
            wool of a coat remembers a week later. Every page on the site reads
            in that order.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
