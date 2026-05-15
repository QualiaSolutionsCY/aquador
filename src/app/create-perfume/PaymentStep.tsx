'use client';

/**
 * PaymentStep: final review + handoff to Stripe.
 *
 * DEVIATION from the plan body: the plan describes a Stripe Elements
 * <PaymentElement /> flow that confirms with `return_url=/create-perfume/success`
 * and a `payment_intent_client_secret` URL parameter. The READ-ONLY contract
 * for /create-perfume/success/page.tsx detects `session_id` from a Stripe
 * Checkout Session redirect (see success-content.tsx), and the READ-ONLY
 * /api/create-perfume/payment route mints a Checkout Session (not a
 * PaymentIntent). The task header explicitly says both surfaces are
 * byte-identical contracts, so this step preserves the Checkout Session
 * redirect rather than the Elements flow described in the prose. This is
 * the only way to satisfy both "READ-ONLY success page" and "API contract
 * unchanged" simultaneously.
 *
 * On submit: POST { perfumeName, composition, volume, specialRequests } to
 * /api/create-perfume/payment, read { url } from the response, redirect.
 * Failure surfaces the locked error toast voice.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { Selections } from './_hooks/useBuilderState';
import type { PerfumeVolume } from '@/lib/perfume/types';

interface PaymentStepProps {
  selections: Selections;
  volume: PerfumeVolume;
  totalCents: number;
  canSubmit: boolean;
  eyebrow: string;
  title: string;
}

function buildPerfumeName(selections: Selections): string {
  const primary =
    selections.base[0] ||
    selections.heart[0] ||
    selections.top[0] ||
    'Bespoke';
  return `Bespoke ${primary}`;
}

function joinNotes(layer: string[]): string {
  if (!layer.length) return '';
  if (layer.length === 1) return layer[0];
  return layer.join(', ');
}

export function PaymentStep({
  selections,
  volume,
  totalCents,
  canSubmit,
  eyebrow,
  title,
}: PaymentStepProps) {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      node.setAttribute('data-revealed', 'true');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute('data-revealed', 'true');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const summary = useMemo(
    () => ({
      top: joinNotes(selections.top),
      heart: joinNotes(selections.heart),
      base: joinNotes(selections.base),
    }),
    [selections],
  );

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/create-perfume/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeName: buildPerfumeName(selections),
          composition: summary,
          volume,
          specialRequests: '',
        }),
      });
      if (!response.ok) throw new Error('payment_route_failed');
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error('missing_redirect_url');
      window.location.href = data.url;
    } catch {
      setSubmitting(false);
      toast({
        title: "We couldn't reach the desk. Try again.",
        variant: 'error',
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      data-revealed="false"
      className={cn(
        'opacity-0 translate-y-4',
        'data-[revealed=true]:opacity-100 data-[revealed=true]:translate-y-0',
        'transition-all duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)]',
      )}
    >
      <header className="mb-8">
        <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-2">
          {eyebrow}
        </p>
        <h2 className="font-display text-[length:var(--font-h2)] text-fg mb-3">
          {title}
        </h2>
      </header>

      <dl className="border-t border-border divide-y divide-border">
        {(['top', 'heart', 'base'] as const).map((layer) => (
          <div
            key={layer}
            className="grid grid-cols-[auto_1fr] gap-6 py-4 items-baseline"
          >
            <dt className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
              {layer}
            </dt>
            <dd className="font-body text-[length:var(--font-size-body)] text-fg">
              {summary[layer] || 'Pending'}
            </dd>
          </div>
        ))}
        <div className="grid grid-cols-[auto_1fr] gap-6 py-4 items-baseline">
          <dt className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            Volume
          </dt>
          <dd className="font-body text-[length:var(--font-size-body)] text-fg">
            {volume}
          </dd>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-6 py-4 items-baseline">
          <dt className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            Total
          </dt>
          <dd className="font-body text-[length:var(--font-size-body-lg)] text-accent-deep">
            {new Intl.NumberFormat('en-IE', {
              style: 'currency',
              currency: 'EUR',
            }).format(totalCents / 100)}
          </dd>
        </div>
      </dl>

      <div className="mt-10">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit}
          isLoading={submitting}
          aria-label="Continue to payment"
        >
          Continue to payment
        </Button>
      </div>
    </section>
  );
}
