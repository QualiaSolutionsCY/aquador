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
            independent perfumers we trust.
          </p>

          <dl className="mt-10 max-w-[var(--container-narrow)] divide-y divide-border border-y border-border">
            <div className="grid grid-cols-[5.5rem_1fr] gap-x-6 py-5">
              <dt className="font-micro tabular-nums uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
                01 / Sourcing
              </dt>
              <dd className="font-body text-fg text-[length:var(--font-size-body)] leading-relaxed">
                Independent perfumers in Beirut, Sharjah, Dubai. Small batches.
                No middlemen on the import. The bench picks every bottle in
                stock.
              </dd>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-x-6 py-5">
              <dt className="font-micro tabular-nums uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
                02 / The letter
              </dt>
              <dd className="font-body text-fg text-[length:var(--font-size-body)] leading-relaxed">
                Every shipment leaves with a handwritten note. Two lines,
                signed, never templated. If a bottle is a gift, the letter is
                addressed to the recipient by name.
              </dd>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-x-6 py-5">
              <dt className="font-micro tabular-nums uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
                03 / The post
              </dt>
              <dd className="font-body text-fg text-[length:var(--font-size-body)] leading-relaxed">
                Monday, Wednesday, Friday. Cyprus to your door in three days
                across the island, four for the Aegean and remote postcodes,
                seven outside the EU.
              </dd>
            </div>
          </dl>

          <p className="mt-10 font-display italic text-fg text-[length:var(--font-h3)] leading-[1.25] max-w-[var(--container-narrow)]">
            &ldquo;Reading a perfume&apos;s page felt like opening a letter from
            someone who knows scent.&rdquo;
          </p>
          <p className="mt-3 font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
            Maria, Limassol. After her first visit.
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
