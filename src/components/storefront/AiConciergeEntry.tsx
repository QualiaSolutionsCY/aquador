'use client';

/**
 * AiConciergeEntry. Editorial inline trigger that opens the concierge Drawer
 * (HOME-04). Phase 2.5 Task 3 replaced the placeholder body with the actual
 * chat surface (`AiConciergeDrawer`); this file only owns the trigger button
 * and the open/close state.
 *
 * Spec: .planning/DESIGN.md §10b. Hairline-divider section, type-led layout,
 * NO Card wrapper. Explicitly NOT a chatbot widget: no MessageCircle icon, no
 * floating viewport-bottom-right bubble, no chat input box. Just an editorial
 * inline button (font-micro, uppercase, underline-on-hover) that opens a
 * standard Drawer with the concierge body.
 *
 * Motion (M3 polish, matches Hero parallax at e1676ca):
 *   - The intro line splits into words and reveals each on a 60ms stagger so
 *     the sentence composes itself like typewriter type, but on quart-ease so
 *     it stays editorial rather than terminal-coded.
 *   - The trigger button border breathes via a 4.5s pulsing shadow loop in
 *     bone tones (NOT a glow ring — that would read as chatbot-flat). The
 *     pulse uses tokens, never raw rgba.
 *   - Reduced motion zeroes via tokens.css §7 + the useReducedMotion fallback
 *     that ships the words static.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import AiConciergeDrawer from '@/components/ai/AiConciergeDrawer';

const INTRO = 'A perfumer reads your message and replies within a day.';
const EASE = [0.22, 1, 0.36, 1] as const;

export default function AiConciergeEntry() {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  const words = INTRO.split(' ');

  return (
    <>
      <section className="border-t border-border py-24 md:py-32 px-[var(--page-px)] text-center scroll-mt-24">
        <p
          className="mx-auto max-w-[var(--container-narrow)] font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed"
          aria-label={INTRO}
        >
          {words.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              aria-hidden="true"
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                duration: 0.7,
                delay: reducedMotion ? 0 : index * 0.06,
                ease: EASE,
              }}
              className="inline-block"
            >
              {word}
              {index < words.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </p>
        <motion.button
          type="button"
          data-testid="concierge-trigger"
          onClick={() => setOpen(true)}
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, delay: reducedMotion ? 0 : 0.6, ease: EASE }}
          className="mt-8 inline-block rounded-sm border border-border-strong bg-transparent px-6 py-3 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg outline-none transition-[transform,box-shadow,border-color] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:-translate-y-[1px] hover:border-fg hover:shadow-[var(--shadow-1)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg animate-concierge-pulse"
        >
          Ask the desk
        </motion.button>
      </section>

      <AiConciergeDrawer isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
