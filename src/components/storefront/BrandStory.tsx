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

import Image from 'next/image';
import FadeUp from './FadeUp';

export default function BrandStory() {
  return (
    <section className="border-t border-border-dark py-16 md:py-24 overflow-x-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-10 md:gap-12 px-[var(--page-px)] items-start">
        <div>
          <FadeUp>
            <span aria-hidden="true" className="block h-px w-12 bg-border-strong" />
            <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]">
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

        <FadeUp className="relative aspect-[4/5] overflow-hidden bg-bg-alt md:mr-[calc(-1*var(--page-px))]">
          <Image
            src="/brand-story/cyprus-desk.webp"
            alt="A perfumer's desk in a Cypriot atelier: a sepia-ink ledger, a brass wax seal beside an oxblood wax pool, three glass sample vials, and a sprig of dried lavender at a tall arched window."
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            className="object-cover"
          />
        </FadeUp>
      </div>
    </section>
  );
}
