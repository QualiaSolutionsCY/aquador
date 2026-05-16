/**
 * Privacy policy page for Aquad'or (M4 P2 T4).
 *
 * Server component. Metadata in `./layout.tsx`. Privacy policy aligned with
 * GDPR (EU) and Cyprus law. Editorial-restrained register per PRODUCT.md
 * §Brand voice. Hairline-stack layout per DESIGN.md §10b.
 *
 * Voice contract: short sentences. No em-dashes, no emoji, no legalese
 * theatre, no exclamations. Periods, commas, colons only.
 */

const sections: Array<{ id: string; eyebrow: string; title: string; body: React.ReactNode }> = [
  {
    id: 'controller',
    eyebrow: '01 / The controller',
    title: 'Who holds the data.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          Aquad&apos;or, registered in the Republic of Cyprus, is the data
          controller for everything you submit through this site. Our office
          is at Ledra 145, 1011 Nicosia. The inbox for any privacy request is
          info@aquadorcy.com.
        </p>
      </>
    ),
  },
  {
    id: 'collected',
    eyebrow: '02 / What we collect',
    title: 'Order data, contact data, technical data.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          When you place an order, we collect your name, email, phone number,
          shipping address, and the items in the order. We do not see or store
          your card number. Payment is handled by Stripe, who carry the card
          data on their own systems.
        </p>
        <p className="mt-6 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          When you write through the contact form, we collect your name,
          email, optional phone, and the body of your message. When you
          subscribe to the journal, we collect your email and the date you
          subscribed. When you visit the site, our analytics collect anonymous
          technical data: the page, the referrer, the country, the browser.
          We do not link this to your account.
        </p>
      </>
    ),
  },
  {
    id: 'basis',
    eyebrow: '03 / Why we hold it',
    title: 'Legal basis, in plain language.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          We hold order data to perform the contract with you, that is, to
          ship the perfume you bought and to handle returns. We hold contact
          form messages to respond to you. We hold subscriber emails on the
          basis of your consent, which you can withdraw at any time. We hold
          analytics under our legitimate interest in understanding how the
          site is used, with the data anonymised where possible.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    eyebrow: '04 / How long',
    title: 'Retention periods.',
    body: (
      <>
        <ul className="space-y-4 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          <li>
            <span className="font-medium">Order records.</span> Retained for
            seven years to meet Cyprus tax law.
          </li>
          <li>
            <span className="font-medium">Contact form messages.</span> Ninety
            days, then deleted.
          </li>
          <li>
            <span className="font-medium">Subscriber emails.</span> Until you
            unsubscribe, then deleted within thirty days.
          </li>
          <li>
            <span className="font-medium">Shopping cart.</span> Stored only in
            your browser as localStorage. Clear your browser data and it is
            gone.
          </li>
          <li>
            <span className="font-medium">Analytics.</span> Aggregated and
            retained for twenty four months.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    eyebrow: '05 / Who else sees it',
    title: 'The short list of processors.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          We do not sell your data. The processors that touch it on our
          behalf are: Stripe for payment, Resend for transactional email,
          Vercel for hosting, Sentry for error reporting, Supabase for the
          database. Each operates under a data processing agreement with us
          and is GDPR compliant. We disclose data to any other party only when
          required by Cyprus law.
        </p>
      </>
    ),
  },
  {
    id: 'rights',
    eyebrow: '06 / Your rights',
    title: 'Access, correction, deletion, portability.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          Under the GDPR you have the right to ask for a copy of the data we
          hold about you, to ask us to correct anything that is wrong, to ask
          us to delete it, to ask us to restrict what we do with it, and to
          receive your data in a portable form. Write to info@aquadorcy.com
          with the request. We respond within one calendar month. If you are
          not satisfied with our response, you can complain to the Cyprus
          Office of the Commissioner for Personal Data Protection.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    eyebrow: '07 / Cookies',
    title: 'What runs in your browser.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          We use a small number of first party cookies to keep your cart, to
          remember your cookie preference, and to power admin sessions. We use
          Vercel Analytics for anonymous traffic measurement, which uses
          first party cookies only. Stripe sets its own cookies on the
          checkout page to prevent fraud. You can manage cookies through your
          browser settings or through the consent banner.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    eyebrow: '08 / Changes',
    title: 'When the policy moves.',
    body: (
      <>
        <p className="font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          We update this policy when the law changes or when we change a
          processor. Material changes are announced on this page with a
          revision date thirty days before they take effect. If you have an
          active subscription, we email you when the policy moves.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Opening */}
      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8">
          <div>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              Privacy policy
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <h1 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]">
              The data we hold, and why.
            </h1>
          </div>
          <div>
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              This policy explains what we collect from you when you shop with
              Aquad&apos;or, why we hold it, how long we hold it for, and who
              else sees it. Aquad&apos;or operates from Cyprus and processes
              your data under the EU General Data Protection Regulation and
              the Cyprus Law 125(I)/2018.
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

      {/* Contact for requests */}
      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="max-w-[var(--container-narrow)]">
          <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            For requests
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
