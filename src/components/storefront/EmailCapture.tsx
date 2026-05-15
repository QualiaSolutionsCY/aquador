'use client';

/**
 * EmailCapture. Editorial newsletter capture (HOME-05, TRUST-03).
 *
 * Spec: .planning/DESIGN.md §10b. Hairline-divider section, type-led layout,
 * NO Card wrapper. Voice constants locked in phase-1-plan.md and grepped by
 * the verifier (no em-dashes, no emojis, no exclamations).
 *
 * Behaviour: posts to /api/email-capture with no navigation. Toasts the
 * three locked outcomes (subscribed, already_subscribed, error). Submit
 * button shows disabled+busy state while pending; input clears on success.
 *
 * Client-side validation is intentionally minimal (`/.+@.+\..+/`): the
 * server's Zod schema is authoritative. The regex only guards against the
 * obvious "no @" submission so we do not round-trip a clear network failure.
 *
 * Motion (M3 polish, matches Hero parallax at e1676ca):
 *   - The eyebrow + body line reveal in cascade when the section enters view.
 *   - Two hairline rules around the form draw left-to-right (scaleX 0 → 1) in
 *     sequence — the top rule first, the bottom rule on a 0.25s delay — so
 *     the form composes itself like an editorial pull-quote rather than
 *     dropping in flat.
 *   - The Subscribe button gets an underline-reveal on hover (sits inside the
 *     Button's content slot as a span with origin-left scaleX).
 *   - Reduced motion zeroes via framer-motion's useReducedMotion + tokens.css
 *     §7.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const EMAIL_PATTERN = /.+@.+\..+/;
const EASE = [0.22, 1, 0.36, 1] as const;

interface CaptureResponse {
  ok: boolean;
  status?: 'subscribed' | 'already_subscribed';
  error?: 'invalid_email' | 'storage_failed';
}

export default function EmailCapture() {
  const { toast } = useToast();
  const reducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_PATTERN.test(trimmed)) {
      toast({
        title: 'Something stalled.',
        description: 'Try once more. If it persists, write to hello@aquadorcy.com.',
        variant: 'error',
      });
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = (await response.json().catch(() => ({}))) as CaptureResponse;

      if (response.ok && data.ok && data.status === 'subscribed') {
        toast({
          title: 'Your address is filed.',
          description: 'The first letter goes out on Friday.',
          variant: 'success',
        });
        setEmail('');
        return;
      }

      if (response.ok && data.ok && data.status === 'already_subscribed') {
        toast({
          title: 'You are already on the list.',
          description: 'The next letter still finds you.',
          variant: 'success',
        });
        setEmail('');
        return;
      }

      toast({
        title: 'Something stalled.',
        description: 'Try once more. If it persists, write to hello@aquadorcy.com.',
        variant: 'error',
      });
    } catch {
      toast({
        title: 'Something stalled.',
        description: 'Try once more. If it persists, write to hello@aquadorcy.com.',
        variant: 'error',
      });
    } finally {
      setPending(false);
    }
  };

  const ruleInitial = reducedMotion ? { scaleX: 1 } : { scaleX: 0 };
  const textInitial = reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 };

  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <div className="max-w-[var(--container-narrow)]">
        <motion.p
          initial={textInitial}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted"
        >
          Write us once. We will write back with three.
        </motion.p>
        <motion.p
          initial={textInitial}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          className="mt-6 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed"
        >
          One letter on Fridays. Three fragrances chosen, with a note on each.
        </motion.p>

        <motion.span
          aria-hidden="true"
          initial={ruleInitial}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
          style={{ transformOrigin: 'left center' }}
          className="mt-10 block h-px w-full max-w-[36rem] bg-border"
        />

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col sm:flex-row gap-3 max-w-[36rem]"
          noValidate
        >
          <div className="flex-1">
            <Input
              type="email"
              name="email"
              required
              placeholder="your.address@domain"
              label="Email address"
              aria-label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
              autoComplete="email"
            />
          </div>
          <div className="group/cta sm:pt-7">
            <Button type="submit" disabled={pending} isLoading={pending}>
              <span className="relative inline-block">
                <span>Subscribe</span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-quart)] group-hover/cta:scale-x-100"
                />
              </span>
            </Button>
          </div>
        </form>

        <motion.span
          aria-hidden="true"
          initial={ruleInitial}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
          style={{ transformOrigin: 'left center' }}
          className="mt-6 block h-px w-full max-w-[36rem] bg-border"
        />

        <motion.p
          initial={textInitial}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          className="mt-6 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted"
        >
          One letter a week. Unsubscribe at the foot of any letter.
        </motion.p>
      </div>
    </section>
  );
}
