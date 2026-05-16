/**
 * Shipping and returns page for Aquad'or (M4 P2 T4).
 *
 * Server component. Metadata in `./layout.tsx`. Hairline-stack layout per
 * DESIGN.md §10b. Voice: editorial, restrained. No em-dashes, no emoji,
 * no exclamations.
 */

const sections: Array<{ id: string; eyebrow: string; title: string; body: React.ReactNode }> = [
  {
    id: 'cyprus',
    eyebrow: '01 / Cyprus',
    title: 'Two to three working days.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          Orders placed before 16:00 ship the same day. Anything later goes
          out the next morning. Nicosia and Limassol typically arrive in one
          to two working days. The rest of Cyprus arrives in two to three.
          The courier is ACS for the island and DHL for any order over one
          hundred euros, which adds tracking and insurance.
        </p>
      </>
    ),
  },
  {
    id: 'eu',
    eyebrow: '02 / European Union',
    title: 'Five to seven working days.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          We ship to all twenty seven EU member states. The carrier is DHL
          Express. Delivery to Greece, Italy, and Germany typically lands in
          five working days. The Baltics and Scandinavia run closer to seven.
          You receive a tracking link the moment the parcel is collected.
        </p>
        <p className="mt-6 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          We are unable to ship outside the EU at present. We are working on
          adding the United Kingdom and the GCC in 2026.
        </p>
      </>
    ),
  },
  {
    id: 'cost',
    eyebrow: '03 / Cost',
    title: 'Free over thirty five euros.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          Standard shipping across Cyprus is six euros, and free on any order
          over thirty five euros. EU shipping is twelve euros, and free on any
          order over one hundred euros. The threshold is applied to the
          subtotal before tax. The price you see at checkout is the price you
          pay, with no customs added on EU orders.
        </p>
      </>
    ),
  },
  {
    id: 'packaging',
    eyebrow: '04 / Packaging',
    title: 'Wrapped to travel.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          Every order is double boxed: the bottle in its retail box, then in a
          shipping box with shaped inserts. Glass damage in transit is rare.
          When it happens, we ship a replacement the same day, no
          photographic evidence required.
        </p>
      </>
    ),
  },
  {
    id: 'returns',
    eyebrow: '05 / Returns',
    title: 'Fourteen days, unopened.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          You have fourteen days from the day you receive an order to ask for
          a return. The bottle must be unopened, with the cellophane intact,
          in its retail box. We refund the full purchase price to the original
          payment method within seven working days of receiving the return.
          Shipping is not refunded unless the order arrived damaged or wrong.
        </p>
        <p className="mt-6 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          Custom perfumes from the builder are made to order and cannot be
          returned, unless the blend does not match the composition you chose,
          in which case we replace it.
        </p>
      </>
    ),
  },
  {
    id: 'starting',
    eyebrow: '06 / Starting a return',
    title: 'Write us first.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          Email info@aquadorcy.com with your order number and the reason for
          the return. We send a return label and instructions. Drop the parcel
          with any ACS or DHL point. Once it reaches us, the refund is
          processed within seven working days.
        </p>
      </>
    ),
  },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Opening */}
      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8">
          <div>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              Shipping and returns
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <h1 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]">
              Cyprus by Friday. The EU within the week.
            </h1>
          </div>
          <div>
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              Orders ship six days a week from Nicosia. Free shipping kicks in
              at thirty five euros across Cyprus and at one hundred across the
              EU. Returns are accepted within fourteen days on unopened
              bottles.
            </p>
          </div>
        </div>
      </section>

      {sections.map((s) => (
        <section
          key={s.id}
          className="border-t border-border px-[var(--page-px)] py-16 md:py-24"
        >
          <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8">
            <div>
              <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
                {s.eyebrow}
              </p>
              <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
              <h2 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-xl)]">
                {s.title}
              </h2>
            </div>
            <div className="max-w-[var(--container-narrow)]">{s.body}</div>
          </div>
        </section>
      ))}
    </div>
  );
}
