/**
 * About page for Aquad'or (M4 P2 T4).
 *
 * Server component. Metadata lives in `./layout.tsx` via buildPageMetadata.
 * Editorial-luxury, Levant-coded. Hairline-stack section pattern per
 * DESIGN.md §10b. No Section/Card primitives, no parchment fillers,
 * no gold-on-black surfaces.
 *
 * Voice contract: editorial, restrained, sensual. Periods, commas, colons
 * only. No em-dashes, no emoji, no exclamations.
 */

import Link from 'next/link';
import Image from 'next/image';
import {
  Beaker,
  MapPin,
  PackageCheck,
  PenLine,
  ScrollText,
  Sparkles,
  Truck,
} from 'lucide-react';
import Button from '@/components/ui/Button';

const noteCards = [
  { icon: ScrollText, label: 'Sourced direct', body: 'Original houses, not anonymous stock.' },
  { icon: Sparkles, label: 'Bench tested', body: 'Every addition earns its place.' },
  { icon: PenLine, label: 'Packed by hand', body: 'A note leaves with first orders.' },
];

const deliveryCards = [
  { icon: MapPin, label: 'Nicosia desk', body: 'Ledra 145, 1011.' },
  { icon: Truck, label: 'ACS pickup', body: 'Choose your checkpoint at checkout.' },
  { icon: PackageCheck, label: 'Sealed returns', body: 'Fourteen days, unopened bottles.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* 01 / Opening */}
      <section className="border-t border-border-dark px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[30%_minmax(0,1fr)_24%] lg:gap-12">
          <div>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              01 / The house
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <h1 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]">
              A small perfume house in Nicosia.
            </h1>
          </div>
          <div>
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              Aquad&apos;or began in Cyprus, with a short list of fragrances we
              actually wanted to wear. The list is longer now, but the
              principle has not moved. We curate. We do not stock the catalogue
              of a distributor, then write copy around it. Each bottle on the
              site is a bottle one of us would buy at full price.
            </p>
            <p className="mt-6 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              The shop runs from a small office in Nicosia. Orders pack the
              same morning they come in, six days a week. The letter that
              ships with a first order is written by one of us, not generated.
            </p>
          </div>
          <aside className="relative min-h-[22rem] overflow-hidden border border-border bg-bg-alt lg:min-h-full">
            <Image
              src="/images/aquadour1.jpg"
              alt="Aquad'or perfume bottle with its black and gold packaging on a polished table."
              fill
              sizes="(min-width: 1024px) 24vw, 100vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-fg/75 to-transparent" />
            <p className="absolute bottom-5 left-5 right-5 font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-bg">
              House bottle · Nicosia
            </p>
          </aside>
        </div>
      </section>

      {/* 02 / Placement */}
      <section className="border-t border-border-dark px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8">
          <div>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              02 / The shelf
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-xl)]">
              Levant first, then the wider catalogue.
            </h2>
          </div>
          <div>
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              The core of the shelf is Levantine. Lattafa originals for the
              ambers, the gourmands, the spice. Al-Haramain originals for the
              oud and the rosewater accords. These are not designer dupes.
              They are the houses themselves, imported direct, in the bottles
              they bottle.
            </p>
            <p className="mt-6 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              Around that core sits a small selection: women, men, niche,
              Victoria&apos;s Secret originals, body lotions and essence oils
              from the same houses. The catalogue grows when a perfume earns
              the place. Nothing is on the site to fill a category.
            </p>
            <ul className="mt-10 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
              {noteCards.map(({ icon: Icon, label, body }) => (
                <li key={label} className="bg-bg p-5">
                  <Icon aria-hidden className="h-5 w-5 text-accent-deep" strokeWidth={1.5} />
                  <p className="mt-5 font-micro uppercase tracking-[0.14em] text-[length:var(--font-size-micro)] text-fg-muted">
                    {label}
                  </p>
                  <p className="mt-3 font-body text-[length:var(--font-size-body-sm)] leading-relaxed text-fg">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 03 / Custom */}
      <section className="border-t border-border-dark px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[30%_minmax(0,1fr)_30%] lg:gap-12">
          <div>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              03 / Custom
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-xl)]">
              A perfume built three layers at a time.
            </h2>
          </div>
          <div>
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              The custom builder is the other half of what we do. Choose top
              notes, heart notes, base notes. Pick fifty or one hundred
              millilitres. The blend is mixed in the office and shipped inside
              the week. It is the same composition logic a perfumer uses, in a
              form a buyer can hold.
            </p>
            <p className="mt-6 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              People come to the builder for a wedding, an anniversary, a
              private signature. The bottle is unlabelled by default. Some ask
              for a name on the side; we engrave when we can.
            </p>
            <p className="mt-10 font-body text-[length:var(--font-size-body)]">
              <Link
                href="/create-perfume"
                className="group relative inline-flex items-baseline text-fg transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:text-accent-deep"
              >
                <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:origin-left after:scale-x-100 after:transition-transform after:duration-[var(--duration-fast)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-0">
                  Build a perfume
                </span>
              </Link>
            </p>
          </div>
          <aside className="relative min-h-[18rem] overflow-hidden border-y border-border bg-bg-alt lg:min-h-full lg:border-x lg:border-y-0">
            <Image
              src="/create-perfume/atelier-still-life.webp"
              alt="A small amber perfume oil bottle with citrus peel, resin and lavender on a light atelier table."
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="object-cover"
            />
            <div className="absolute left-5 top-5 inline-flex items-center gap-3 bg-bg/90 px-4 py-3 backdrop-blur-sm">
              <Beaker aria-hidden className="h-4 w-4 text-accent-deep" strokeWidth={1.5} />
              <span className="font-micro uppercase tracking-[0.14em] text-[length:var(--font-size-micro)] text-fg-muted">
                Three layers
              </span>
            </div>
          </aside>
        </div>
      </section>

      {/* 04 / Practical */}
      <section className="border-t border-border-dark px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8">
          <div>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              04 / Practical
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-xl)]">
              Cyprus in two to three days. The EU in five to seven.
            </h2>
          </div>
          <div>
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              Orders pack the morning they come in. Cyprus delivery arrives in
              two to three working days, EU delivery in five to seven. Shipping
              is free on orders over thirty five euros. Returns are accepted
              within fourteen days for unopened bottles.
            </p>
            <ul className="mt-10 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
              {deliveryCards.map(({ icon: Icon, label, body }) => (
                <li key={label} className="bg-bg-alt p-5">
                  <Icon aria-hidden className="h-5 w-5 text-accent-deep" strokeWidth={1.5} />
                  <p className="mt-5 font-micro uppercase tracking-[0.14em] text-[length:var(--font-size-micro)] text-fg-muted">
                    {label}
                  </p>
                  <p className="mt-3 font-body text-[length:var(--font-size-body-sm)] leading-relaxed text-fg">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/shop">
                <Button variant="primary" size="md">Browse the catalogue</Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" size="md">Write us</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
