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
    eyebrow: 'Al-Haramain',
    title: 'Heritage of perfume.',
    body: 'Since 1970. Amber Oud, Gold Edition, the bottles that built the house.',
    href: '/shop/niche',
    image: '/images/al-haramain-poster.webp',
    imageAlt: 'Al-Haramain Amber Oud campaign: five faceted bottles on stone plinths beneath a Levantine arcade, with the Al-Haramain Since 1970 wordmark.',
  },
  {
    eyebrow: 'Lattafa Originals',
    title: 'Timeless scent, true elegance.',
    body: 'Asad, Yara, Fakhar, Badee al Oud. Twenty eight authentic Lattafa originals in stock.',
    href: '/shop/lattafa',
    image: '/images/lattafa-poster.webp',
    imageAlt: 'Lattafa campaign: six perfume bottles arranged beneath the Lattafa Arabic calligraphy mark and the line "Timeless Scent. True Elegance."',
  },
  {
    eyebrow: 'Aquad’or',
    title: 'Refined scent, modern luxury.',
    body: 'Niche Collection, Amber Oud, White Musk, Gold Edition, Oud Elixir. The house line.',
    href: '/shop?category=essence-oil',
    image: '/images/aquador-poster.webp',
    imageAlt: 'Aquad’or campaign: five Aquad’or bottles on stone plinths beneath the lotus wordmark and the line "Refined Scent. Modern Luxury."',
  },
];

export default function CategoryTriptych() {
  return (
    <section className="border-t border-border-dark bg-bg py-16 md:py-24 px-[var(--page-px)]">
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
                className="group block overflow-hidden border border-border-dark bg-bg-alt transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <div className="relative aspect-[4/4.15] overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover object-top transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-quart)] group-hover:scale-[1.03]"
                  />
                </div>

                <div className="border-t border-border bg-bg-alt p-6 md:p-7">
                  <p className="font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-4 font-display text-[length:var(--font-h2)] leading-[1.08] tracking-[-0.01em] text-fg transition-colors duration-[var(--duration-fast)] group-hover:text-accent-deep">
                    {card.title}
                  </h3>
                  <p className="mt-3 max-w-[24rem] font-body text-[length:var(--font-size-body-sm)] leading-relaxed text-fg-muted">
                    {card.body}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-2 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg">
                    <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:origin-left after:scale-x-100 after:transition-transform after:duration-[var(--duration-base)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-0">
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
