/**
 * FAQ page for Aquad'or (M4 P2 T4).
 *
 * Server component. Metadata in `./layout.tsx`. Inline-accordion-editorial
 * pattern from DESIGN.md §10b: native <details> for accessibility and zero
 * JS. Token-driven styling, no Section/Card primitives, no gold-on-black
 * surfaces.
 *
 * Voice contract: short answers, no em-dashes, no emoji, no exclamations.
 */

import Link from 'next/link';

type QA = { q: string; a: React.ReactNode };

const qas: QA[] = [
  {
    q: 'How fast do orders ship across Cyprus.',
    a: (
      <>
        Orders placed before 16:00 ship the same day from Nicosia. Nicosia
        and Limassol typically arrive in one to two working days, the rest
        of the island in two to three. Shipping is three euros, free on any
        order over thirty five euros.
      </>
    ),
  },
  {
    q: 'Do you ship outside Cyprus.',
    a: (
      <>
        Yes, to all twenty seven EU member states by DHL Express. Greece,
        Italy, and Germany typically arrive in five working days, the Baltics
        and Scandinavia closer to seven. Shipping is three euros, free on any
        order over thirty five euros. We do not ship outside the EU
        at present.
      </>
    ),
  },
  {
    q: 'What is the return window.',
    a: (
      <>
        Fourteen days from the day the parcel reaches you, on unopened
        bottles with the cellophane intact. Once the return arrives at our
        office, the refund clears within seven working days. Custom builds
        are made to order and cannot be returned, except where the blend
        does not match the composition you chose.
      </>
    ),
  },
  {
    q: 'How long does a custom perfume take.',
    a: (
      <>
        The blend is mixed within four working hours of the order landing,
        rested overnight, then bottled the next morning. Cyprus orders
        arrive within three working days of purchase, EU orders within
        seven. Engraving on the bottle adds one extra day.
      </>
    ),
  },
  {
    q: 'Are the Lattafa and Al-Haramain bottles original.',
    a: (
      <>
        Yes. We import direct from the houses themselves, in the bottles
        they bottle. The catalogue is sectioned by house for that reason:
        Lattafa originals and Al-Haramain originals carry their own
        section, so there is no ambiguity about provenance. If a bottle
        ever arrives with a broken seal or a batch code you cannot verify,
        write us and we replace it.
      </>
    ),
  },
  {
    q: 'How do I read the notes pyramid on a product page.',
    a: (
      <>
        The top notes are what you smell first, in the first ten minutes.
        The heart notes settle in over the next hour and form the body of
        the fragrance. The base notes are the wood, the resin, the musk
        that hold the perfume on your skin through the afternoon. A good
        perfume reads as one perfume across all three.
      </>
    ),
  },
  {
    q: 'What payment methods do you accept.',
    a: (
      <>
        Visa, Mastercard, American Express, Apple Pay, and Google Pay,
        through Stripe. Your card number does not touch our servers. We do
        not accept cash on delivery or bank transfer at present.
      </>
    ),
  },
  {
    q: 'Can I gift wrap or ship to a different address.',
    a: (
      <>
        Yes. At checkout you can add a separate shipping address and a
        short handwritten note. Gift orders ship without a printed invoice
        inside, and the email receipt goes to you, not the recipient. We
        wrap in unmarked paper with a hairline ribbon on request.
      </>
    ),
  },
  {
    q: 'Do you offer wholesale or boutique accounts.',
    a: (
      <>
        For boutiques and concept stores in Cyprus and the EU, yes. We
        accept new wholesale accounts on a rolling basis. Write to
        info@aquadorcy.com with the name of your boutique, the city, and
        what you are looking to carry. We reply within two working days.
      </>
    ),
  },
  {
    q: 'Where are you based and can I visit.',
    a: (
      <>
        The office and boutique are at Ledra 145, 1011 Nicosia. We are open
        Monday to Saturday from 10:00 to 20:00, and Sunday from 12:00 to
        18:00. You can smell the full catalogue in person and pick up a
        custom build if you prefer not to ship.
      </>
    ),
  },
  {
    q: 'Why are some bottles labelled essence oil.',
    a: (
      <>
        Essence oils are alcohol free concentrates. They wear closer to
        the skin than a spray, last longer, and read more intimate. They
        also travel better in heat, which matters in Cyprus from June to
        September. The bottles are smaller and the price per millilitre is
        higher, but the wear time is roughly double.
      </>
    ),
  },
  {
    q: 'Will my data be safe.',
    a: (
      <>
        Order data is held under the EU General Data Protection Regulation.
        Card data is held by Stripe, not by us. You can read the full
        retention list and your rights on the{' '}
        <Link
          href="/privacy"
          className="text-fg underline decoration-border-strong underline-offset-4 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:text-accent-deep"
        >
          privacy policy
        </Link>
        , including how to request deletion.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Opening */}
      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8">
          <div>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              Questions
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <h1 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]">
              Common questions from the desk.
            </h1>
          </div>
          <div>
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              The ones we answer in writing most often: shipping, returns,
              custom turnaround, ingredient sourcing, payment, gifting. If
              your question is not here, write to info@aquadorcy.com. We
              answer within one working day.
            </p>
          </div>
        </div>
      </section>

      {/* Accordion stack */}
      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="mx-auto max-w-[var(--container-prose)]">
          <ul className="divide-y divide-border">
            {qas.map((qa, i) => (
              <li key={i}>
                <details className="group py-6 md:py-8">
                  <summary className="flex cursor-pointer items-baseline justify-between gap-6 text-left list-none [&::-webkit-details-marker]:hidden">
                    <h2 className="font-display text-fg text-[length:var(--font-h3)] leading-snug tracking-[-0.01em] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] group-hover:text-accent-deep">
                      {qa.q}
                    </h2>
                    <span
                      aria-hidden="true"
                      className="mt-1 inline-block shrink-0 font-micro text-[length:var(--font-size-micro)] text-fg-muted transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="mt-6 max-w-[var(--container-narrow)] font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed">
                    {qa.a}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="max-w-[var(--container-narrow)]">
          <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            Still curious
          </p>
          <p className="mt-6 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
            Write to info@aquadorcy.com or come by the boutique at Ledra 145
            in Nicosia. The team replies in English, Greek, or Arabic.
          </p>
          <p className="mt-8 font-body text-[length:var(--font-size-body)]">
            <Link
              href="/contact"
              className="group relative inline-flex items-baseline text-fg transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-quart)] hover:text-accent-deep"
            >
              <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-full after:bg-current after:origin-left after:scale-x-100 after:transition-transform after:duration-[var(--duration-fast)] after:ease-[var(--ease-out-quart)] group-hover:after:scale-x-0">
                Write us
              </span>
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
