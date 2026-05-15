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
          <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
            01 / Notes
          </p>
          <h2 className="mt-6 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-h1)]">
            The pyramid, read top to base.
          </h2>
        </FadeUp>
        <p className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed">
          Every perfume on this desk is read like a letter: the opening is what
          the room smells when you walk in, the middle is what stays through
          dinner, and the base is what your coat keeps for a week. We list all
          three. We do not hide the ingredients.
        </p>
      </div>
    </section>
  );
}
