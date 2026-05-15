'use client';

/**
 * Hero. Homepage full-bleed editorial moment (HOME-01, TRUST-01).
 *
 * Spec: .planning/DESIGN.md §10b "Full-bleed imagery" pattern + Motion rule 10.
 * Voice: PRODUCT.md (editorial, restrained, sensual). Voice constants are
 * locked in phase-1-plan.md and grepped by the verifier; do not paraphrase.
 *
 * Layout: one full-bleed canvas (min-h-[80vh] / md:min-h-[88vh]) on
 * bg-bg-alt, content stacked at the bottom: eyebrow / headline / body /
 * primary CTA / trust triplet.
 *
 * Motion: FadeUp wraps the supporting line. CTA carries an underline-reveal
 * micro-shift on hover (--duration-fast). prefers-reduced-motion zeroed
 * globally by tokens.css §7.
 *
 * Deviation note (Task 3): Button has no `asChild` prop yet (see
 * src/components/ui/Button.tsx:38, ButtonProps extends ButtonHTMLAttributes
 * only). Rather than pulling @radix-ui/react-slot for one consumer, the CTA
 * uses `buttonVariants` directly on a <Link>. Same surface treatment, same
 * states, no new dependency. Plan Action step 5 explicitly approves this.
 */

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import FadeUp from './FadeUp';

export default function Hero() {
  return (
    <section className="relative min-h-[80vh] md:min-h-[88vh] w-full flex items-end bg-bg-alt px-[var(--page-px)] py-[var(--page-py)]">
      <div className="w-full max-w-[var(--container-prose)]">
        <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
          Aquad&apos;or, Cyprus.
        </p>

        <h1 className="mt-6 font-display text-fg leading-[1.05] tracking-[-0.01em] text-[length:var(--font-display-3xl)]">
          Three hundred grams of paper, eight notes per perfume, one letter that knows scent.
        </h1>

        <FadeUp className="mt-8 max-w-[var(--container-narrow)]">
          <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed">
            One hundred fragrances, three perfumers on the desk, and free shipping across Cyprus.
          </p>
        </FadeUp>

        <div className="mt-10">
          <Link
            href="/shop"
            className={cn(
              buttonVariants.base,
              buttonVariants.variants.primary,
              buttonVariants.sizes.lg,
              'group relative',
            )}
          >
            <span className="relative after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-[var(--duration-fast)] after:ease-[var(--ease-out-quart)] group-hover:after:w-full">
              Read the collection
            </span>
          </Link>
        </div>

        <ul className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
          <li>Free shipping across Cyprus.</li>
          <li aria-hidden="true" className="text-border-strong">
            /
          </li>
          <li>Thirty day returns.</li>
          <li aria-hidden="true" className="text-border-strong">
            /
          </li>
          <li>Authenticity guaranteed.</li>
        </ul>
      </div>
    </section>
  );
}
