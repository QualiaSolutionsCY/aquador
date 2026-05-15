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
 */

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const EMAIL_PATTERN = /.+@.+\..+/;

interface CaptureResponse {
  ok: boolean;
  status?: 'subscribed' | 'already_subscribed';
  error?: 'invalid_email' | 'storage_failed';
}

export default function EmailCapture() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_PATTERN.test(trimmed)) {
      toast({
        title: 'We could not file that.',
        description: 'Try once more. If it persists, write to us at the desk.',
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
          title: 'Already on the list.',
          description: 'One letter a week, no extras for previous subscribers.',
          variant: 'success',
        });
        setEmail('');
        return;
      }

      toast({
        title: 'We could not file that.',
        description: 'Try once more. If it persists, write to us at the desk.',
        variant: 'error',
      });
    } catch {
      toast({
        title: 'We could not file that.',
        description: 'Try once more. If it persists, write to us at the desk.',
        variant: 'error',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="border-t border-border py-16 md:py-24 px-[var(--page-px)]">
      <div className="max-w-[var(--container-narrow)]">
        <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted">
          Write us once. We will write back with three.
        </p>
        <p className="mt-6 font-body text-fg text-[length:var(--font-size-body-lg)] leading-relaxed">
          One letter a week. Three perfumes worth reading. No middle ground.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col sm:flex-row gap-3 max-w-[36rem]"
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
          <div className="sm:pt-7">
            <Button type="submit" disabled={pending} isLoading={pending}>
              Subscribe
            </Button>
          </div>
        </form>

        <p className="mt-6 font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
          One letter a week. Unsubscribe at the foot of any letter.
        </p>
      </div>
    </section>
  );
}
