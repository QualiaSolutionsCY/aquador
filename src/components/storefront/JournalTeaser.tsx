/**
 * JournalTeaser. Third numbered editorial section on the homepage (HOME-02).
 *
 * Spec: .planning/DESIGN.md §10b "Numbered editorial sections" +
 * "Type micro-shifts" motion rule (underline-reveal on the inline CTA, not a
 * <Button>, because links inside editorial text should not look like
 * conversion buttons).
 *
 * RSC; FadeUp is the single client boundary on the title block.
 *
 * Voice constants (locked, grepped by verifier):
 *   eyebrow: "03 / Letters"
 *   title:   "Recent letters from the desk."
 *   CTA:     "Read the journal"
 */

import Link from 'next/link';
import FadeUp from './FadeUp';

export default function JournalTeaser() {
  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <FadeUp>
        <span aria-hidden="true" className="block h-px w-12 bg-border-strong" />
        <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)] max-w-[var(--container-prose)]">
          Recent letters from the desk.
        </h2>
      </FadeUp>

      <p className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
        Three short essays on what we are wearing this week, why oud reads
        warmer in October, and how to choose a signature without trying every
        bottle in the city. New letters publish on Fridays.
      </p>

      <p className="mt-10 font-body text-[length:var(--font-size-body)]">
        <Link
          href="/blog"
          className="group relative inline-flex items-baseline text-fg transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:text-accent-deep"
        >
          <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:origin-left after:scale-x-100 after:transition-transform after:duration-[var(--duration-fast)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-0">
            Read the journal
          </span>
        </Link>
      </p>
    </section>
  );
}
