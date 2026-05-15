'use client';

/**
 * SettingsForm — client form for /admin/settings (Phase 4 Task 2).
 *
 * Receives initial values from the server component, exposes a sectioned
 * editorial form (Contact, Shipping, Returns, Payment, SEO), PUTs to
 * /api/admin/settings on submit, and surfaces success/failure via the
 * shared <Toast> primitive.
 *
 * Voice: admin-direct. DESIGN §10b copy bans do NOT apply here — em-dashes
 * and plain functional labels are OK. Tokens + typography hierarchy still
 * apply: no Card wrappers, hairline section dividers, micro labels.
 */

import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';

export interface StoreSettingsValues {
  contactEmail: string;
  contactPhone: string;
  instagramUrl: string;
  facebookUrl: string;
  shippingPolicySummary: string;
  returnsPolicySummary: string;
  freeShippingThresholdCents: number;
  stripePaymentEnabled: boolean;
  stripeApplePayEnabled: boolean;
  stripeGooglePayEnabled: boolean;
  seoDefaultTitle: string;
  seoDefaultDescription: string;
}

interface SettingsFormProps {
  initial: StoreSettingsValues;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [values, setValues] = useState<StoreSettingsValues>(initial);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  function set<K extends keyof StoreSettingsValues>(key: K, val: StoreSettingsValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const saved = (await res.json()) as StoreSettingsValues;
      setValues((prev) => ({ ...prev, ...saved }));
      toast({ title: 'Settings saved', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  const thresholdEur = (values.freeShippingThresholdCents / 100).toFixed(2);

  return (
    <form onSubmit={handleSubmit} className="space-y-12 max-w-2xl">
      {/* Contact */}
      <section className="space-y-6">
        <header>
          <h2 className="font-display text-[20px] leading-tight text-fg">Contact</h2>
          <p className="mt-1 font-body text-[13px] text-fg-muted">
            Visible on the storefront footer and order confirmation emails.
          </p>
        </header>
        <Input
          label="Contact email"
          type="email"
          value={values.contactEmail}
          onChange={(e) => set('contactEmail', e.target.value)}
          placeholder="hello@aquadorcy.com"
        />
        <Input
          label="Contact phone"
          value={values.contactPhone}
          onChange={(e) => set('contactPhone', e.target.value)}
          placeholder="+357 ..."
        />
        <Input
          label="Instagram URL"
          type="url"
          value={values.instagramUrl}
          onChange={(e) => set('instagramUrl', e.target.value)}
          placeholder="https://instagram.com/aquadorcy"
        />
        <Input
          label="Facebook URL"
          type="url"
          value={values.facebookUrl}
          onChange={(e) => set('facebookUrl', e.target.value)}
          placeholder="https://facebook.com/aquadorcy"
        />
      </section>

      <div className="h-px bg-border" aria-hidden="true" />

      {/* Shipping */}
      <section className="space-y-6">
        <header>
          <h2 className="font-display text-[20px] leading-tight text-fg">Shipping</h2>
          <p className="mt-1 font-body text-[13px] text-fg-muted">
            Threshold and summary copy shown at checkout and on the cart page.
          </p>
        </header>
        <Input
          label="Free shipping threshold (EUR)"
          type="number"
          min={0}
          step="0.01"
          value={thresholdEur}
          onChange={(e) => {
            const eur = parseFloat(e.target.value);
            const cents = Number.isFinite(eur) ? Math.round(eur * 100) : 0;
            set('freeShippingThresholdCents', cents);
          }}
          hint="Orders at or above this amount ship free."
        />
        <Textarea
          label="Shipping policy summary"
          rows={5}
          value={values.shippingPolicySummary}
          onChange={(e) => set('shippingPolicySummary', e.target.value)}
          hint="Short paragraph. Appears on cart + checkout trust strip."
        />
      </section>

      <div className="h-px bg-border" aria-hidden="true" />

      {/* Returns */}
      <section className="space-y-6">
        <header>
          <h2 className="font-display text-[20px] leading-tight text-fg">Returns</h2>
          <p className="mt-1 font-body text-[13px] text-fg-muted">
            Two to three sentences. Surfaced on the PDP trust strip.
          </p>
        </header>
        <Textarea
          label="Returns policy summary"
          rows={5}
          value={values.returnsPolicySummary}
          onChange={(e) => set('returnsPolicySummary', e.target.value)}
        />
      </section>

      <div className="h-px bg-border" aria-hidden="true" />

      {/* Payment methods */}
      <section className="space-y-6">
        <header>
          <h2 className="font-display text-[20px] leading-tight text-fg">Payment methods</h2>
          <p className="mt-1 font-body text-[13px] text-fg-muted">
            Stripe Checkout payment-sheet visibility. Toggling off hides the option from shoppers.
          </p>
        </header>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-[15px] text-fg">Card payments</p>
            <p className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
              Visa / Mastercard / Amex
            </p>
          </div>
          <Switch
            checked={values.stripePaymentEnabled}
            onCheckedChange={(v) => set('stripePaymentEnabled', v)}
            aria-label="Toggle card payments"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-[15px] text-fg">Apple Pay</p>
            <p className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
              Available on Safari + iOS
            </p>
          </div>
          <Switch
            checked={values.stripeApplePayEnabled}
            onCheckedChange={(v) => set('stripeApplePayEnabled', v)}
            aria-label="Toggle Apple Pay"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-body text-[15px] text-fg">Google Pay</p>
            <p className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
              Available on Chrome + Android
            </p>
          </div>
          <Switch
            checked={values.stripeGooglePayEnabled}
            onCheckedChange={(v) => set('stripeGooglePayEnabled', v)}
            aria-label="Toggle Google Pay"
          />
        </div>
      </section>

      <div className="h-px bg-border" aria-hidden="true" />

      {/* SEO defaults */}
      <section className="space-y-6">
        <header>
          <h2 className="font-display text-[20px] leading-tight text-fg">SEO defaults</h2>
          <p className="mt-1 font-body text-[13px] text-fg-muted">
            Used as fallbacks when a page does not set its own meta tags.
          </p>
        </header>
        <Input
          label="Default meta title"
          value={values.seoDefaultTitle}
          onChange={(e) => set('seoDefaultTitle', e.target.value)}
          placeholder="Aquad'or Cyprus — Luxury Perfumes"
        />
        <Textarea
          label="Default meta description"
          rows={3}
          value={values.seoDefaultDescription}
          onChange={(e) => set('seoDefaultDescription', e.target.value)}
          placeholder="Curated luxury perfumes shipped from Cyprus."
        />
      </section>

      <div className="pt-2">
        <Button
          type="submit"
          isLoading={saving}
          disabled={saving}
          leadingIcon={<Save className="h-4 w-4" strokeWidth={1.5} />}
        >
          Save settings
        </Button>
      </div>
    </form>
  );
}

export default SettingsForm;
