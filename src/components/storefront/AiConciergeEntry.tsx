'use client';

/**
 * AiConciergeEntry. Promoted from buried inline trigger to a magazine-split
 * section (HOME-04). Visual weight now matches BrandStory — the concierge is
 * the conversion surface for browse-mode buyers (Khaled persona in
 * PRODUCT.md), and burying it under EmailCapture was wasting it.
 *
 * Layout: 40/60 grid at lg+. Left column is the editorial invitation +
 * primary CTA; right column is a single italicized rhetorical line that
 * mimics how a perfumer would actually pitch the concierge in conversation.
 * Mobile collapses to a stack with the rhetorical line below the CTA.
 *
 * Spec: .planning/DESIGN.md §10b. Hairline-divider section, type-led layout,
 * NO Card wrapper. Explicitly NOT a chatbot widget: opens a standard Drawer
 * (`AiConciergeDrawer`) when the CTA is clicked.
 *
 * Motion: RevealHeader cascade for the title; the italicised side line drifts
 * in via FadeUp with a 250ms delay so the eye lands on the title first.
 *
 * Voice: PRODUCT.md brand voice — editorial, restrained, sensual. No em-dash,
 * no emoji, no "Need help? Ask our chatbot!" sales-floor tone.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { openAiConcierge } from '@/components/ai/AiConciergeWidget';
import FadeUp from './FadeUp';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function AiConciergeEntry() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="concierge"
      className="border-t border-border-dark bg-bg py-20 md:py-28 px-[var(--page-px)] scroll-mt-24"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[40%_60%] lg:gap-16">
        <div>
          <span aria-hidden="true" className="block h-px w-12 bg-border-strong" />
          <p className="mt-6 font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
            Aquad&apos;or AI Agent
          </p>
          <h2 className="mt-6 font-display text-fg leading-[1.05] tracking-[-0.02em] text-[length:var(--font-display-2xl)]">
            Tell us what you&apos;re after.
          </h2>

          <p className="mt-8 max-w-[var(--container-narrow)] font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed">
            An agent trained on the catalogue reads your message and replies
            in the moment. Describe a memory, a mood, a moment you want to
            bottle. We&apos;ll send back two or three picks from the desk,
            with notes on why each one earns the recommendation.
          </p>

          <div className="mt-10">
            <button
              type="button"
              data-testid="concierge-trigger"
              onClick={openAiConcierge}
              className="group relative inline-flex min-h-12 items-center gap-3 border border-fg bg-fg px-6 py-3 font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.12em] text-bg transition-all duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:bg-bg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <span>Talk to the agent</span>
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover:translate-x-1"
              >
                →
              </span>
            </button>
          </div>

          <p className="mt-6 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
            Replies in the moment. Real picks. No newsletter follow-ups.
          </p>

          <p className="mt-10 font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
            Powered by{' '}
            <a
              href="https://qualiasolutions.cy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg transition-colors duration-[var(--duration-fast)] hover:text-accent-deep"
            >
              Qualia Solutions
            </a>
          </p>
        </div>

        <FadeUp
          className="relative flex items-center lg:border-l lg:border-border lg:pl-16"
          delay={reducedMotion ? 0 : 250}
        >
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
            className="w-full"
          >
            <p
              aria-hidden="true"
              className="font-display text-fg leading-[1.15] tracking-[-0.01em] text-[length:var(--font-display-xl)] lg:text-[length:var(--font-display-2xl)]"
            >
              <span className="text-fg-muted">&ldquo;</span>
              I want something that smells like
              <br />
              <span className="italic text-accent-deep">
                a library on a rainy afternoon.
              </span>
              <span className="text-fg-muted">&rdquo;</span>
            </p>
            <p className="mt-8 font-micro uppercase tracking-[0.18em] text-[length:var(--font-size-micro)] text-fg-muted">
              Maria, Limassol. Wrote on a Tuesday. Khamrah, by lunch.
            </p>
          </motion.div>
        </FadeUp>
      </div>
    </section>
  );
}
