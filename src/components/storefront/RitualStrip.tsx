'use client';

/**
 * RitualStrip. Three editorial promises rendered as a numbered triptych, the
 * second twist that breaks the homepage rhythm between NotesStory (education)
 * and BrandStory (the perfumer's room). Functions as the brand's "value
 * column" without sliding into Shopify-feature-grid territory: numbered,
 * type-led, with a hairline-divider rule between columns.
 *
 * Layout: 3-col at lg with vertical hairline dividers between columns,
 * stacked single-column on mobile with horizontal hairlines between rows.
 * Numbers in display-2xl italic, body in measured prose width.
 *
 * Motion: each column reveals via FadeUp with 90ms stagger; the rule that
 * separates columns at lg scales in from origin-left on view (one-shot).
 * Reduced motion zeroes both.
 *
 * Voice: editorial, accurate to the actual policy. No marketing puffery, no
 * em-dashes, no emoji. Numbers in roman ("Three") match the brand
 * spelled-out-numerals convention used in TrustBar copy.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, PackageCheck, ScrollText } from 'lucide-react';
import type { ComponentType } from 'react';
import FadeUp from './FadeUp';

type Promise = {
  number: string;
  title: string;
  body: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: true }>;
};

const PROMISES: ReadonlyArray<Promise> = [
  {
    number: 'One',
    title: 'Curated by the desk.',
    body:
      'A small bench of perfumers picks every bottle on the shelf. We do not stock what we would not wear ourselves.',
    icon: ScrollText,
  },
  {
    number: 'Two',
    title: 'Posted from Nicosia.',
    body:
      'Same day inside the city, two to three days across Cyprus. Free shipping over thirty-five euro, no compromises on the seal.',
    icon: PackageCheck,
  },
  {
    number: 'Three',
    title: 'Replied within the day.',
    body:
      'The concierge is a perfumer reading your message, not a chatbot reading a script. We close the loop, every time.',
    icon: MessageCircle,
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function RitualStrip() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="border-t border-border-dark bg-bg-alt py-16 md:py-24 px-[var(--page-px)]">
      <FadeUp className="mb-12 max-w-[var(--container-narrow)]">
        <span aria-hidden="true" className="block h-px w-12 bg-border-strong" />
        <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-h1)]">
          What you can count on, every time.
        </h2>
      </FadeUp>

      <ul className="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {PROMISES.map((promise, index) => (
          <FadeUp
            key={promise.number}
            delay={Math.min(index * 90, 270)}
            className="relative"
          >
            <li className="list-none px-0 py-10 lg:px-10 lg:py-0">
              <div className="flex items-start justify-between gap-6">
                <motion.span
                  aria-hidden="true"
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="block font-display italic text-[length:var(--font-display-2xl)] leading-[1] text-accent-deep"
                >
                  {promise.number}
                </motion.span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-border bg-bg">
                  <promise.icon aria-hidden className="h-5 w-5 text-accent-deep" strokeWidth={1.5} />
                </span>
              </div>
              <h3 className="mt-6 font-display text-fg leading-[1.15] tracking-[-0.01em] text-[length:var(--font-h2)]">
                {promise.title}
              </h3>
              <p className="mt-4 max-w-[28rem] font-body text-fg-muted text-[length:var(--font-size-body)] leading-relaxed">
                {promise.body}
              </p>
            </li>
          </FadeUp>
        ))}
      </ul>
    </section>
  );
}
