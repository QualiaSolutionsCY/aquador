/**
 * NotesStory. Numbered editorial section 01 of the homepage (HOME-02).
 *
 * Spec: .planning/DESIGN.md §10b — hairline-divider stack, numbered eyebrow,
 * type-led layout, NO Card wrapper. Voice constants are locked in
 * phase-1-plan.md and grepped by the verifier.
 *
 * RSC by default. FadeUp wraps the title block for IntersectionObserver
 * scroll-reveal (one-shot, respects prefers-reduced-motion).
 */

import FadeUp from './FadeUp';

export default function NotesStory() {
  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <div className="max-w-[var(--container-narrow)]">
        <FadeUp>
          <span aria-hidden="true" className="block h-px w-12 bg-border-strong" />
          <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-h1)]">
            The pyramid, read top to base.
          </h2>
        </FadeUp>
        <p className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed">
          A fragrance opens with citrus and aldehydes, then settles into heart
          florals and spice, and ends on woods, resins, and musk. The top is
          the first impression. The heart is the wear. The base is what the
          wool of a coat remembers a week later. Every page on the site reads
          in that order.
        </p>
      </div>
    </section>
  );
}
