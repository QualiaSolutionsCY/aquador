'use client';

/**
 * Contact page for Aquad'or (M4 P2 T4).
 *
 * Client component: form uses useState + react-hook-form + zod. Page metadata
 * lives in `./layout.tsx`. Surrounding copy rewritten in brand voice per
 * PRODUCT.md §Brand voice; layout follows the hairline-stack pattern from
 * DESIGN.md §10b. No Section/Card primitives, no gold-on-black surfaces.
 *
 * Voice contract: no em-dashes, no emoji, no exclamations. Periods, commas,
 * colons only.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { track } from '@vercel/analytics';
import Button from '@/components/ui/Button';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least two characters.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least five characters.'),
  message: z.string().min(10, 'Message must be at least ten characters.'),
  honeypot: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactRows: Array<{ label: string; lines: string[] }> = [
  { label: 'Boutique', lines: ['Ledra 145, 1011', 'Nicosia, Cyprus'] },
  { label: 'Phone', lines: ['+357 99 980809'] },
  { label: 'Email', lines: ['info@aquadorcy.com'] },
  { label: 'Hours', lines: ['Monday to Saturday, 10:00 to 20:00', 'Sunday, 12:00 to 18:00'] },
];

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'We could not send your message just now.');
      }

      track('contact_submitted', { subject: data.subject });

      setIsSubmitted(true);
      reset();
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Something went wrong on our end.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* 01 / Opening */}
      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-[40%_60%] gap-8">
          <div>
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              01 / Write
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <h1 className="mt-8 font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-2xl)]">
              Write us about a fragrance.
            </h1>
          </div>
          <div>
            <p className="font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed max-w-[var(--container-narrow)]">
              About a bottle you are weighing, a custom blend you want to
              commission, a visit to the Ledra boutique. We answer in English,
              Greek, or Arabic, usually within one working day. The form
              reaches the same inbox the team reads in the morning.
            </p>
          </div>
        </div>
      </section>

      {/* 02 / Form and details */}
      <section className="border-t border-border px-[var(--page-px)] py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-12 lg:gap-16">
          <div className="min-w-0">
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              02 / Send a message
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />

            {isSubmitted ? (
              <div className="mt-12 max-w-[var(--container-narrow)]">
                <h2 className="font-display text-fg leading-[1.1] tracking-[-0.01em] text-[length:var(--font-display-xl)]">
                  Message received.
                </h2>
                <p className="mt-6 font-body text-fg-muted text-[length:var(--font-size-body-lg)] leading-relaxed">
                  Thank you. We will write back from info@aquadorcy.com within
                  one working day.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-12 max-w-[var(--container-narrow)] space-y-6"
              >
                <input
                  {...register('honeypot')}
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                  aria-hidden="true"
                />

                {submitError && (
                  <div
                    role="alert"
                    className="border border-[color:var(--critical)] bg-bg-alt p-4"
                  >
                    <p className="font-body text-[length:var(--font-size-body-sm)] text-[color:var(--critical)]">
                      {submitError}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-2 block"
                    >
                      Name
                    </label>
                    <input
                      {...register('name')}
                      id="contact-name"
                      type="text"
                      autoComplete="name"
                      className={`input-base py-3.5 ${errors.name ? 'border-[color:var(--critical)]' : ''}`}
                    />
                    {errors.name && (
                      <p className="mt-1.5 font-body text-[length:var(--font-size-body-sm)] text-[color:var(--critical)]">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-2 block"
                    >
                      Email
                    </label>
                    <input
                      {...register('email')}
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      className={`input-base py-3.5 ${errors.email ? 'border-[color:var(--critical)]' : ''}`}
                    />
                    {errors.email && (
                      <p className="mt-1.5 font-body text-[length:var(--font-size-body-sm)] text-[color:var(--critical)]">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-phone"
                    className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-2 block"
                  >
                    Phone, optional
                  </label>
                  <input
                    {...register('phone')}
                    id="contact-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    className="input-base py-3.5"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-2 block"
                  >
                    Subject
                  </label>
                  <input
                    {...register('subject')}
                    id="contact-subject"
                    type="text"
                    className={`input-base py-3.5 ${errors.subject ? 'border-[color:var(--critical)]' : ''}`}
                  />
                  {errors.subject && (
                    <p className="mt-1.5 font-body text-[length:var(--font-size-body-sm)] text-[color:var(--critical)]">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-2 block"
                  >
                    Message
                  </label>
                  <textarea
                    {...register('message')}
                    id="contact-message"
                    rows={6}
                    className={`input-base resize-none py-3.5 ${errors.message ? 'border-[color:var(--critical)]' : ''}`}
                  />
                  {errors.message && (
                    <p className="mt-1.5 font-body text-[length:var(--font-size-body-sm)] text-[color:var(--critical)]">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" isLoading={isSubmitting}>
                  Send message
                </Button>
              </form>
            )}
          </div>

          <aside className="min-w-0">
            <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              03 / The desk
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-12 bg-border-strong" />
            <dl className="mt-10 space-y-8">
              {contactRows.map((row) => (
                <div key={row.label}>
                  <dt className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
                    {row.label}
                  </dt>
                  {row.lines.map((line) => (
                    <dd
                      key={line}
                      className="mt-2 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed"
                    >
                      {line}
                    </dd>
                  ))}
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>
    </div>
  );
}
