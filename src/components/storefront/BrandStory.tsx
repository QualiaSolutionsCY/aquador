/**
 * BrandStory. Second numbered editorial section, magazine-spread layout
 * (HOME-02).
 *
 * Spec: .planning/DESIGN.md §10b "Magazine spread" pattern. Image column
 * bleeds to the viewport edge on md+ via the negative-page-px margin trick.
 * RSC; FadeUp is the single client boundary on the title block.
 *
 * Image is a parchment placeholder (bg-bg-alt) until production photography
 * is supplied (HOME-02 follow-up). The aspect ratio (4:5) and the bleed are
 * the load-bearing design choices; the image src will swap in later without
 * disturbing layout.
 *
 * Voice constants (locked, grepped by verifier):
 *   eyebrow: "02 / House"
 *   title:   "Cyprus by way of Levantine paperwork."
 */

import FadeUp from './FadeUp';

export default function BrandStory() {
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8 px-[var(--page-px)]">
        <div>
          <FadeUp>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              02 / House
            </p>
            <h2 className="mt-6 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]">
              Cyprus by way of Levantine paperwork.
            </h2>
          </FadeUp>

          <p className="mt-8 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
            Aquad&apos;or operates out of Nicosia. The catalogue draws from
            Lattafa and Al-Haramain houses for oud and amber, from Victoria&apos;s
            Secret originals for the clean musks, and from a small bench of
            independent perfumers we trust. The shipment leaves Cyprus three
            days a week. The letter that comes with it is written by one of us.
          </p>
        </div>

        <div
          aria-hidden="true"
          className="aspect-[4/5] bg-bg-alt md:mr-[calc(-1*var(--page-px))]"
        />
      </div>
    </section>
  );
}
