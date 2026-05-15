'use client';

/**
 * Hero. Homepage magazine-spread editorial moment (HOME-01, TRUST-01).
 *
 * Spec: .planning/DESIGN.md §10b "Magazine spread" pattern. Image bleeds to
 * the viewport edge on the right; type column on the left. Asymmetric grid
 * (45% type / 55% image at lg+). Mobile collapses to a stacked column with
 * the photo above the type so the first viewport carries something to look at.
 *
 * Motion: Ken Burns drift on the photo (18s loop, subtle scale + drift,
 * transform-only so it stays compositor-cheap). FadeUp wraps the supporting
 * line and the CTA. Underline-reveal micro-shift on hover. All zeroed by
 * tokens.css §7 prefers-reduced-motion.
 *
 * Voice: PRODUCT.md (editorial, restrained, sensual). Voice constants are
 * locked in phase-1-plan.md and grepped by the verifier; do not paraphrase.
 *
 * Deviation note (Task 3 lineage): Button has no `asChild` prop yet, so the
 * CTA uses `buttonVariants` directly on a <Link>. Same surface treatment,
 * no @radix-ui/react-slot dependency.
 */

import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import FadeUp from './FadeUp';

export default function Hero() {
  return (
    <section className="relative grid w-full grid-cols-1 lg:grid-cols-[45%_55%] lg:min-h-[88vh]">
      <div className="relative order-2 flex items-end bg-bg-alt px-[var(--page-px)] py-16 lg:order-1 lg:py-[var(--page-py)]">
        <div className="w-full max-w-[var(--container-prose)]">
          <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
            Aquad&apos;or, Cyprus.
          </p>

          <h1 className="mt-6 font-display text-fg leading-[1.05] tracking-[-0.01em] text-[length:var(--font-display-2xl)] lg:text-[length:var(--font-display-3xl)]">
            Three hundred grams of paper, eight notes per perfume, one letter that knows scent.
          </h1>

          <FadeUp className="mt-8 max-w-[var(--container-narrow)]">
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed">
              One hundred fragrances, three perfumers on the desk. Free shipping over 35 euro across Cyprus.
            </p>
          </FadeUp>

          <FadeUp className="mt-10">
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
          </FadeUp>

          <ul className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            <li>Free shipping over 35 euro.</li>
            <li aria-hidden="true" className="text-border-strong">
              /
            </li>
            <li>No returns.</li>
            <li aria-hidden="true" className="text-border-strong">
              /
            </li>
            <li>Authenticity guaranteed.</li>
          </ul>
        </div>
      </div>

      <div className="relative order-1 min-h-[60vh] overflow-hidden bg-bg-alt lg:order-2 lg:min-h-full">
        <div className="absolute inset-0 animate-ken-burns">
          <Image
            src="/images/aquadour1.jpg"
            alt="An Aquad'or perfume composition resting on the perfumer's desk."
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg-alt/60 to-transparent lg:hidden"
        />

        <div className="absolute right-6 bottom-6 z-10 hidden items-center gap-3 lg:flex">
          <span className="h-px w-12 bg-fg/30" aria-hidden="true" />
          <p className="font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-fg/70">
            Composition no. 04, on bone linen.
          </p>
        </div>
      </div>
    </section>
  );
}
