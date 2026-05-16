'use client';

/**
 * CategoryTriptych. Three editorial category cards as a magazine-style
 * triptych — the visual answer to "which family interests me?" after the
 * shopper has scanned the FeaturedGrid. Niche, Lattafa Originals, our own
 * essence oils — each photographed, each linked to its shop route.
 *
 * Layout: 3-col at lg, 2-col at md (with the third spanning full width
 * beneath), single column on mobile. Each card is 4:5 aspect ratio with a
 * full-bleed image, hairline border, and a bottom-anchored text block on a
 * gentle scrim. NOT a Card primitive — the visual container IS the image.
 *
 * Motion: each card lifts 6px and the image scales 1.03 on hover (matches
 * the ProductCard micro-shift pattern). RevealHeader cascades the section
 * opener; cards stagger via FadeUp with 80ms spacing.
 *
 * Voice: short editorial fragments ("Curated by the desk", "From the
 * Lattafa house", "Pressed in Nicosia"). No em-dashes, no emoji.
 */

import Image from 'next/image';
import Link from 'next/link';
import FadeUp from './FadeUp';
import RevealHeader from './RevealHeader';

type Card = {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  image: string;
  imageAlt: string;
};

const CARDS: ReadonlyArray<Card> = [
  {
    eyebrow: 'Niche',
    title: 'Curated by the desk.',
    body: 'Independent perfumers, small batches, the bench we trust.',
    href: '/shop/niche',
    image: '/images/al-haramain-originals.jpg',
    imageAlt: 'A row of niche perfume bottles on a perfumer\'s shelf.',
  },
  {
    eyebrow: 'Lattafa Originals',
    title: 'From the Arabian house.',
    body: 'Oud, amber, smoke. Twenty eight authentic Lattafa originals in stock.',
    href: '/shop/lattafa',
    image: '/images/lattafa-originals.jpg',
    imageAlt: 'Lattafa perfume bottles arranged on a warm linen surface.',
  },
  {
    eyebrow: 'Aquad’or essence oils',
    title: 'Pressed in Nicosia.',
    body: 'One hundred sixty one essence oils, our signature line, hand poured.',
    href: '/shop?category=essence-oil',
    image: '/images/aquadour1.jpg',
    imageAlt: 'An Aquad’or essence oil bottle resting on bone linen.',
  },
];

export default function CategoryTriptych() {
  return (
    <section className="border-t border-border bg-bg py-16 md:py-24 px-[var(--page-px)]">
      <RevealHeader
        className="mb-12 max-w-[var(--container-narrow)]"
        title="Three houses, one desk."
      />

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card, index) => (
          <FadeUp key={card.href} delay={Math.min(index * 80, 240)}>
            <li className="list-none">
              <Link
                href={card.href}
                className="group relative block aspect-[4/5] overflow-hidden border border-border bg-bg-alt transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-quart)] group-hover:scale-[1.03]"
                />

                {/* Bottom-anchored scrim so the type stays legible against arbitrary frames. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-fg/80 via-fg/30 to-transparent"
                />

                <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-8 text-bg">
                  <p className="font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-bg/80">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-4 font-display text-[length:var(--font-display-xl)] leading-[1.05] tracking-[-0.01em]">
                    {card.title}
                  </h3>
                  <p className="mt-3 max-w-[24rem] font-body text-[length:var(--font-size-body-sm)] leading-relaxed text-bg/85">
                    {card.body}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-2 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-bg">
                    <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-bg after:origin-left after:scale-x-100 after:transition-transform after:duration-[var(--duration-base)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-0">
                      Open the room
                    </span>
                    <span aria-hidden="true">{'→'}</span>
                  </p>
                </div>
              </Link>
            </li>
          </FadeUp>
        ))}
      </ul>
    </section>
  );
}
