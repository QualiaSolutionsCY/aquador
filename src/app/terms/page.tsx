/**
 * Terms of service page for Aquad'or (M4 P2 T4).
 *
 * Server component. Metadata in `./layout.tsx`. Hairline-stack per
 * DESIGN.md §10b. Cyprus governing law, liability cap, IP, order acceptance,
 * payment, dispute resolution. Voice: editorial, restrained. No em-dashes,
 * no emoji, no exclamations.
 */

const sections: Array<{ id: string; eyebrow: string; title: string; body: React.ReactNode }> = [
  {
    id: 'parties',
    eyebrow: '01 / The parties',
    title: 'Who you are agreeing with.',
    body: (
      <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
        These terms govern your use of aquadorcy.com and any order you place
        with Aquad&apos;or, a business registered in the Republic of Cyprus
        with offices at Ledra 145, 1011 Nicosia. By placing an order or
        creating an account, you accept these terms. If you do not accept
        them, do not use the site.
      </p>
    ),
  },
  {
    id: 'eligibility',
    eyebrow: '02 / Eligibility',
    title: 'You must be eighteen.',
    body: (
      <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
        Some of what we sell contains alcohol. You confirm, by placing an
        order, that you are at least eighteen years old. We do not knowingly
        sell to minors. If we discover an order was placed by a minor, we
        cancel and refund it.
      </p>
    ),
  },
  {
    id: 'orders',
    eyebrow: '03 / Order acceptance',
    title: 'The contract forms when we ship.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          Adding an item to the cart and paying for it is an offer to buy.
          The order confirmation email is our acknowledgement, not our
          acceptance. The contract forms when we dispatch the order, at which
          point you receive a shipping email.
        </p>
        <p className="mt-6 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          We reserve the right to refuse or cancel an order before dispatch,
          for reasons that include but are not limited to: a pricing or stock
          error, a payment that fails verification, a suspected fraudulent
          order, or a shipping address we cannot reach. When we cancel before
          dispatch, the full charge is refunded within seven working days.
        </p>
      </>
    ),
  },
  {
    id: 'pricing',
    eyebrow: '04 / Pricing',
    title: 'Euros, VAT included.',
    body: (
      <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
        Prices on the site are in euros and include Cyprus VAT at the
        prevailing rate. Shipping is shown separately at checkout. We try to
        keep prices accurate, but if a clear pricing error appears, we may
        cancel the affected order and refund. We do this rarely, and only
        when the error is obviously not the intended price.
      </p>
    ),
  },
  {
    id: 'payment',
    eyebrow: '05 / Payment',
    title: 'Stripe handles the card.',
    body: (
      <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
        Payment is processed by Stripe Payments Europe Limited. We accept
        major card networks, Apple Pay, and Google Pay. Your card number
        never touches our servers. Payment must clear before the order
        dispatches.
      </p>
    ),
  },
  {
    id: 'shipping',
    eyebrow: '06 / Shipping and returns',
    title: 'Set out separately.',
    body: (
      <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
        Delivery times, costs, and the return window are covered in our
        shipping and returns page. Those terms are incorporated into this
        agreement by reference. In short: Cyprus in two to three working
        days, the EU in five to seven, fourteen day return on unopened
        bottles, full refund of the purchase price on accepted returns.
      </p>
    ),
  },
  {
    id: 'ip',
    eyebrow: '07 / Intellectual property',
    title: 'The brand stays ours.',
    body: (
      <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
        The Aquad&apos;or name, the logo, the photography, the editorial copy
        on the site, and the brand layout are protected by Cyprus and EU
        copyright and trade mark law. You may share links to the site, you
        may quote short passages with attribution. You may not reproduce the
        site, scrape the catalogue, or use our marks on another site without
        written permission.
      </p>
    ),
  },
  {
    id: 'liability',
    eyebrow: '08 / Limitation of liability',
    title: 'Capped at what you paid.',
    body: (
      <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
        To the extent permitted by Cyprus and EU law, our total liability for
        any claim arising out of an order is limited to the price you paid
        for that order. We are not liable for indirect or consequential loss,
        including loss of profit, loss of opportunity, or loss of reputation.
        Nothing in these terms limits our liability for fraud, gross
        negligence, or any liability that cannot be excluded under law.
      </p>
    ),
  },
  {
    id: 'law',
    eyebrow: '09 / Governing law',
    title: 'Cyprus law, Cyprus courts.',
    body: (
      <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
        These terms are governed by the law of the Republic of Cyprus. Any
        dispute that cannot be resolved between us is subject to the
        exclusive jurisdiction of the courts of Nicosia. If you are a
        consumer in another EU member state, you retain the rights given to
        you by your local consumer law.
      </p>
    ),
  },
  {
    id: 'changes',
    eyebrow: '10 / Changes',
    title: 'When the terms move.',
    body: (
      <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
        We update these terms when the law changes or when we change the way
        the shop operates. Material changes are posted here thirty days
        before they take effect. Continuing to use the site after that date
        is acceptance of the revised terms.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8">
          <div>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              Terms of service
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <h1 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]">
              The agreement, in plain language.
            </h1>
          </div>
          <div>
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              These are the terms that govern an order from Aquad&apos;or and
              the use of this site. They are written under Cyprus law. Read
              them once. The short version: we ship what you ordered, you
              return it within fourteen days if it is wrong, and we settle in
              Nicosia if we ever disagree.
            </p>
            <p className="mt-6 font-body text-fg-muted text-[length:var(--font-size-body)] leading-relaxed max-w-[var(--container-narrow)]">
              Last revised on 17 May 2026.
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

      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="max-w-[var(--container-narrow)]">
          <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            For questions
          </p>
          <p className="mt-6 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
            Email info@aquadorcy.com, phone +357 99 980809, or write to
            Aquad&apos;or, Ledra 145, 1011 Nicosia, Cyprus.
          </p>
        </div>
      </section>
    </div>
  );
}
