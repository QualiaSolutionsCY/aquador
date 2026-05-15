'use client';

/**
 * ManualOrderForm — admin-side creation of off-Stripe orders (ADMIN-06).
 *
 * Aquad'or sells in-person at Limassol popup events; those sales must land in
 * the `orders` table for revenue accounting but never round-trip through
 * Stripe. This form POSTs to /api/admin/orders with `source: 'manual'`. The
 * API route inserts directly via service-role and does NOT invoke Stripe.
 *
 * Voice: admin-direct. "Create order", "Add line item", "Remove line",
 * "Save and notify customer". No editorial register.
 */

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatPrice } from '@/lib/currency';

interface LineItemDraft {
  name: string;
  quantity: number;
  price: number;
}

const EMPTY_LINE: LineItemDraft = { name: '', quantity: 1, price: 0 };

export default function ManualOrderForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingLine1, setShippingLine1] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostal, setShippingPostal] = useState('');
  const [shippingCountry, setShippingCountry] = useState('CY');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItemDraft[]>([{ ...EMPTY_LINE }]);
  const [emailError, setEmailError] = useState<string | undefined>();

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + (l.price || 0) * (l.quantity || 0), 0),
    [lines],
  );

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, patch: Partial<LineItemDraft>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function validate(): boolean {
    setEmailError(undefined);
    if (!customerEmail.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail.trim())) {
      setEmailError('A valid customer email is required');
      return false;
    }
    const valid = lines.filter((l) => l.name.trim() && l.price > 0 && l.quantity > 0);
    if (valid.length === 0) {
      toast({ title: 'Add at least one line item', variant: 'error' });
      return false;
    }
    return true;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const items = lines
      .filter((l) => l.name.trim() && l.price > 0 && l.quantity > 0)
      .map((l) => ({ name: l.name.trim(), quantity: l.quantity, price: l.price, productType: 'perfume' }));

    const hasShipping = shippingLine1.trim().length > 0;
    const payload = {
      customerEmail: customerEmail.trim(),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items,
      total,
      notes: notes.trim() || undefined,
      shippingAddress: hasShipping
        ? {
            name: customerName.trim() || undefined,
            address: {
              line1: shippingLine1.trim(),
              city: shippingCity.trim() || undefined,
              postal_code: shippingPostal.trim() || undefined,
              country: shippingCountry.trim() || undefined,
            },
          }
        : undefined,
    };

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/orders', {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          toast({ title: 'Create failed', description: json.error ?? 'Unknown error', variant: 'error' });
          return;
        }
        toast({ title: 'Order created', variant: 'success' });
        router.push(json?.order?.id ? `/admin/orders/${json.order.id}` : '/admin/orders');
      } catch (err) {
        toast({ title: 'Create failed', description: err instanceof Error ? err.message : 'Network error', variant: 'error' });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl">
      <header className="flex items-center gap-3">
        <Link href="/admin/orders" aria-label="Back to orders"
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-bg-alt hover:text-fg">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
        <div>
          <h1 className="font-display text-[28px] leading-tight text-fg">New manual order</h1>
          <p className="font-body text-[13px] text-fg-muted">In-person or off-platform sale. Bypasses Stripe.</p>
        </div>
      </header>

      <section className="border-t border-border pt-6 space-y-4">
        <h2 className="font-micro text-[11px] uppercase tracking-[0.05em] text-fg-muted">Customer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" required value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} error={emailError} placeholder="customer@example.com" />
          <Input label="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" />
        </div>
        <Input label="Phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+357 99 123456" />
      </section>

      <section className="border-t border-border pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-micro text-[11px] uppercase tracking-[0.05em] text-fg-muted">Line items</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addLine} leadingIcon={<Plus className="h-4 w-4" strokeWidth={1.5} />}>
            Add line item
          </Button>
        </div>
        <div className="space-y-4">
          {lines.map((line, i) => (
            <div key={i} className="grid gap-3 md:grid-cols-12 md:items-end">
              <div className="md:col-span-6">
                <Input label={i === 0 ? 'Product' : ''} value={line.name} onChange={(e) => updateLine(i, { name: e.target.value })} placeholder="Product name" required />
              </div>
              <div className="md:col-span-2">
                <Input label={i === 0 ? 'Qty' : ''} type="number" min={1} step={1} value={line.quantity || ''} onChange={(e) => updateLine(i, { quantity: parseInt(e.target.value, 10) || 0 })} />
              </div>
              <div className="md:col-span-3">
                <Input label={i === 0 ? 'Unit price (EUR)' : ''} type="number" min={0} step={0.01} value={line.price || ''} onChange={(e) => updateLine(i, { price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="md:col-span-1 flex justify-end">
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    aria-label="Remove line"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-bg-alt hover:text-critical"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">Total</span>
          <span className="font-display text-[22px] text-fg">{formatPrice(total)}</span>
        </div>
      </section>

      <section className="border-t border-border pt-6 space-y-4">
        <h2 className="font-micro text-[11px] uppercase tracking-[0.05em] text-fg-muted">Shipping address (optional)</h2>
        <Input label="Street" value={shippingLine1} onChange={(e) => setShippingLine1(e.target.value)} placeholder="Street address" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="City" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
          <Input label="Postal code" value={shippingPostal} onChange={(e) => setShippingPostal(e.target.value)} />
          <Input label="Country" value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} placeholder="CY" />
        </div>
      </section>

      <section className="border-t border-border pt-6">
        <Textarea label="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} hint="Visible only to operators." rows={3} />
      </section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur md:-mx-6 md:px-6">
        <Button type="button" variant="secondary" size="md" onClick={() => router.push('/admin/orders')} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" isLoading={isPending}>
          Save and notify customer
        </Button>
      </div>
    </form>
  );
}
