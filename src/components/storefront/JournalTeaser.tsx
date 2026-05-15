'use client';

/**
 * JournalTeaser. Third numbered editorial section on the homepage (HOME-02).
 *
 * Spec: .planning/DESIGN.md §10b "Numbered editorial sections" +
 * "Type micro-shifts" motion rule (underline-reveal on the inline CTA, not a
 * <Button>, because links inside editorial text should not look like
 * conversion buttons).
 *
 * Motion (M3 polish, matches Hero parallax at e1676ca):
 *   - useScroll drives a slow vertical drift across the section's traversal
 *     of the viewport. The title rises slightly; the body and link drift
 *     counter so the eye is pulled top-to-bottom as you scroll past.
 *   - RevealHeader plays the rule → title cascade.
 *   - Body line and CTA each reveal on their own staggered delay.
 *   - Reduced motion zeroes parallax + skips reveal animation via the
 *     reducedMotion branch on each transform / initial state.
 *
 * Voice constants (locked, grepped by verifier):
 *   title: "Recent letters from the desk."
 *   CTA:   "Read the journal"
 */

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import RevealHeader from './RevealHeader';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function JournalTeaser() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['5%', '-5%']);
  const bodyY = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['-3%', '3%']);

  return (
    <section
      ref={sectionRef}
      className="border-t border-border py-16 md:py-24 px-[var(--page-px)]"
    >
      <motion.div style={{ y: titleY }}>
        <RevealHeader
          title="Recent letters from the desk."
          titleClassName="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)] max-w-[var(--container-prose)]"
        />
      </motion.div>

      <motion.div style={{ y: bodyY }}>
        <motion.p
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]"
        >
          Three short essays on what we are wearing this week, why oud reads
          warmer in October, and how to choose a signature without trying every
          bottle in the city. New letters publish on Fridays.
        </motion.p>

        <motion.p
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
          className="mt-10 font-body text-[length:var(--font-size-body)]"
        >
          <Link
            href="/blog"
            className="group relative inline-flex items-baseline text-fg transition-[color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:text-accent-deep hover:-translate-y-[1px]"
          >
            <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:origin-left after:scale-x-100 after:transition-transform after:duration-[var(--duration-base)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-0">
              Read the journal
            </span>
          </Link>
        </motion.p>
      </motion.div>
    </section>
  );
}
