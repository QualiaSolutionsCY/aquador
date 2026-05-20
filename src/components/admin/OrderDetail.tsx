'use client';

/**
 * OrderDetail — unified admin order view (Phase 3 Task 2, ADMIN-05).
 *
 * Hairline-divider section stack: Header, Line items, Customer, Fulfillment.
 * No raw <table>; line items render through the shared `AdminTable` primitive.
 * Status mutation + notes autosave-on-blur via PATCH /api/admin/orders/[id].
 *
 * Voice: admin-direct. Functional copy only.
 */

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { formatPrice, fromCents } from '@/lib/currency';
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable';
import type { Customer, Order, OrderStatus } from '@/lib/supabase/types';

interface OrderLineItem {
  name: string;
  quantity: number;
  price: number;
  // Admin-Customer-Service fields. Persisted by the Stripe webhook for new
  // orders; older orders that pre-date the schema bump leave these undefined.
  slug?: string;
  image?: string;
  brand?: string;
  size?: string;
  productType?: string;
  customPerfume?: {
    name: string;
    topNote: string;
    heartNote: string;
    baseNote: string;
    specialRequests?: string;
  };
}
interface OrderDetailProps { order: Order; customer: Customer | null }

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: 'warning', confirmed: 'accent', processing: 'accent',
  shipped: 'accent', delivered: 'success', cancelled: 'critical', refunded: 'neutral',
};

const sectionHead = 'mb-3 font-micro text-[11px] uppercase tracking-[0.05em] text-fg-muted';
const microLabel = 'font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted';

function shortId(o: Order): string { return `#${(o.stripe_session_id || o.id).slice(-8).toUpperCase()}`; }

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function parseItems(raw: Order['items']): OrderLineItem[] {
  if (!Array.isArray(raw)) return [];
  const out: OrderLineItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const o = entry as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name : null;
    const quantity = Number(o.quantity);
    const price = Number(o.price ?? o.unitPrice);
    if (!name || !Number.isFinite(quantity) || !Number.isFinite(price)) continue;
    out.push({
      name,
      quantity,
      price,
      slug: typeof o.slug === 'string' ? o.slug : undefined,
      image: typeof o.image === 'string' ? o.image : undefined,
      brand: typeof o.brand === 'string' ? o.brand : undefined,
      size: typeof o.size === 'string' ? o.size : undefined,
      productType: typeof o.productType === 'string' ? o.productType : undefined,
      customPerfume:
        o.customPerfume && typeof o.customPerfume === 'object' && !Array.isArray(o.customPerfume)
          ? {
              name: typeof (o.customPerfume as Record<string, unknown>).name === 'string'
                ? (o.customPerfume as Record<string, unknown>).name as string
                : 'Custom Perfume',
              topNote: typeof (o.customPerfume as Record<string, unknown>).topNote === 'string'
                ? (o.customPerfume as Record<string, unknown>).topNote as string
                : 'Not captured',
              heartNote: typeof (o.customPerfume as Record<string, unknown>).heartNote === 'string'
                ? (o.customPerfume as Record<string, unknown>).heartNote as string
                : 'Not captured',
              baseNote: typeof (o.customPerfume as Record<string, unknown>).baseNote === 'string'
                ? (o.customPerfume as Record<string, unknown>).baseNote as string
                : 'Not captured',
              specialRequests: typeof (o.customPerfume as Record<string, unknown>).specialRequests === 'string'
                ? (o.customPerfume as Record<string, unknown>).specialRequests as string
                : undefined,
            }
          : undefined,
    });
  }
  return out;
}

function readNotes(tags: Order['tags']): string {
  if (!tags || typeof tags !== 'object' || Array.isArray(tags)) return '';
  const v = (tags as Record<string, unknown>).notes;
  return typeof v === 'string' ? v : '';
}

function readShipping(addr: Order['shipping_address']): string[] {
  if (!addr || typeof addr !== 'object' || Array.isArray(addr)) return [];
  const o = addr as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name : null;
  const acsCheckpoint = typeof o.acs_checkpoint === 'string' ? `ACS checkpoint: ${o.acs_checkpoint}` : null;
  const inner = o.address && typeof o.address === 'object' && !Array.isArray(o.address)
    ? (o.address as Record<string, unknown>) : null;
  const line1 = inner && typeof inner.line1 === 'string' ? inner.line1 : null;
  const line2 = inner && typeof inner.line2 === 'string' ? inner.line2 : null;
  const city = inner && typeof inner.city === 'string' ? inner.city : null;
  const postal = inner && typeof inner.postal_code === 'string' ? inner.postal_code : null;
  const country = inner && typeof inner.country === 'string' ? inner.country : null;
  return [name, acsCheckpoint, line1, line2, [city, postal].filter(Boolean).join(' ') || null, country].filter((s): s is string => !!s);
}

export default function OrderDetail({ order, customer }: OrderDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [notes, setNotes] = useState<string>(() => readNotes(order.tags));
  const [savedNotes, setSavedNotes] = useState<string>(notes);
  const [savingNotes, setSavingNotes] = useState(false);
  const [isPending, startTransition] = useTransition();

  const items = useMemo(() => parseItems(order.items), [order.items]);
  const customItems = useMemo(
    () => items.filter((item) => item.productType === 'custom-perfume' || item.customPerfume),
    [items],
  );
  const shippingLines = useMemo(() => readShipping(order.shipping_address), [order.shipping_address]);

  async function patchOrder(payload: { status?: OrderStatus; notes?: string }) {
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? 'Update failed');
    }
  }

  function onStatusSubmit() {
    startTransition(async () => {
      try {
        await patchOrder({ status });
        toast({ title: 'Status updated', variant: 'success' });
        router.refresh();
      } catch (err) {
        toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Network error', variant: 'error' });
      }
    });
  }

  async function onNotesBlur() {
    if (notes === savedNotes) return;
    setSavingNotes(true);
    try {
      await patchOrder({ notes });
      setSavedNotes(notes);
      toast({ title: 'Notes saved', variant: 'success' });
    } catch (err) {
      toast({ title: 'Save failed', description: err instanceof Error ? err.message : 'Network error', variant: 'error' });
    } finally {
      setSavingNotes(false);
    }
  }

  type RowShape = OrderLineItem & { _rowKey: string };
  const columns: AdminTableColumn<RowShape>[] = [
    {
      key: 'thumb',
      header: '',
      accessor: (r) => (
        r.image ? (
          // 48x48 thumbnail. Click-through to the live PDP if we have a slug,
          // so a CS operator opens the customer's actual product page in one
          // click. eslint-disable-next-line @next/next/no-img-element — admin
          // shell deliberately uses raw <img> for non-customer-facing surfaces
          // to avoid the next/image domain allowlist tax on Supabase-hosted CDNs.
          r.slug ? (
            <Link href={`/products/${r.slug}`} target="_blank" rel="noopener" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.image}
                alt=""
                className="h-12 w-12 rounded-sm border border-border object-cover"
                loading="lazy"
              />
            </Link>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={r.image}
              alt=""
              className="h-12 w-12 rounded-sm border border-border object-cover"
              loading="lazy"
            />
          )
        ) : (
          <div aria-hidden="true" className="h-12 w-12 rounded-sm border border-border bg-bg-alt" />
        )
      ),
    },
    {
      key: 'name',
      header: 'Product',
      accessor: (r) => (
        <div className="flex flex-col">
          {r.brand && (
            <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-fg-muted">
              {r.brand}
            </span>
          )}
          {r.slug ? (
            <Link
              href={`/products/${r.slug}`}
              target="_blank"
              rel="noopener"
              className="text-fg underline-offset-2 hover:underline"
            >
              {r.name}
            </Link>
          ) : (
            <span className="text-fg">{r.name}</span>
          )}
          {(r.size || r.productType) && (
            <span className="font-body text-[12px] text-fg-muted">
              {[r.size, r.productType].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      ),
    },
    { key: 'qty', header: 'Qty', align: 'right', accessor: (r) => <span>{r.quantity}</span> },
    { key: 'price', header: 'Unit', align: 'right', accessor: (r) => <span>{formatPrice(r.price)}</span> },
    { key: 'line', header: 'Line total', align: 'right',
      accessor: (r) => <span className="font-medium text-fg">{formatPrice(r.price * r.quantity)}</span> },
  ];

  const notesLabel = savingNotes
    ? 'Internal notes (saving…)'
    : notes === savedNotes && notes ? 'Internal notes (saved)' : 'Internal notes';

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <Link href="/admin/orders" aria-label="Back to orders"
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-bg-alt hover:text-fg">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-[28px] leading-tight text-fg">Order {shortId(order)}</h1>
          <p className="font-body text-[13px] text-fg-muted">
            Placed {formatDateTime(order.created_at)}
            {order.order_source === 'manual' ? ' · Manual order' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[order.status]} className="capitalize">{order.status}</Badge>
          <span className="font-display text-[22px] text-fg">{formatPrice(fromCents(order.total))}</span>
        </div>
      </header>

      <section className="border-t border-border pt-6">
        <h2 className={sectionHead}>Line items</h2>
        <AdminTable
          columns={columns}
          rows={items.map((r, i) => ({ ...r, _rowKey: `${i}-${r.name}` }))}
          keyExtractor={(r) => r._rowKey}
          emptyText="This order has no recorded line items."
        />
      </section>

      {customItems.length > 0 ? (
        <section className="border-t border-border pt-6">
          <h2 className={sectionHead}>Custom perfume details</h2>
          <div className="grid gap-4">
            {customItems.map((item, index) => (
              <div key={`${item.name}-${index}`} className="border border-border bg-bg-alt p-4">
                <p className="font-display text-[20px] text-fg">{item.customPerfume?.name || item.name}</p>
                <p className="mt-1 text-[12px] text-fg-muted">{item.size || 'Bottle size not captured'}</p>
                <dl className="mt-4 grid gap-3 text-[13px] md:grid-cols-3">
                  <div>
                    <dt className={microLabel}>Top</dt>
                    <dd className="mt-1 text-fg">{item.customPerfume?.topNote || 'Not captured'}</dd>
                  </div>
                  <div>
                    <dt className={microLabel}>Heart</dt>
                    <dd className="mt-1 text-fg">{item.customPerfume?.heartNote || 'Not captured'}</dd>
                  </div>
                  <div>
                    <dt className={microLabel}>Base</dt>
                    <dd className="mt-1 text-fg">{item.customPerfume?.baseNote || 'Not captured'}</dd>
                  </div>
                </dl>
                {item.customPerfume?.specialRequests ? (
                  <p className="mt-4 text-[13px] text-fg-muted">{item.customPerfume.specialRequests}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 border-t border-border pt-6 md:grid-cols-2">
        <div>
          <h2 className={sectionHead}>Customer</h2>
          <p className="text-fg">{order.customer_name ?? customer?.name ?? 'Unnamed customer'}</p>
          <p className="text-[13px] text-fg-muted">{order.customer_email}</p>
          {(order.customer_phone || customer?.phone) ? (
            <p className="text-[13px] text-fg-muted">{order.customer_phone ?? customer?.phone}</p>
          ) : null}
          {customer ? (
            <Link href={`/admin/customers/${customer.id}`}
              className="mt-2 inline-block text-[12px] font-micro uppercase tracking-[0.05em] text-accent-deep underline-offset-4 hover:underline">
              View customer
            </Link>
          ) : null}
        </div>
        <div>
          <h2 className={sectionHead}>Shipping address</h2>
          {shippingLines.length > 0 ? (
            <div className="text-[13px] leading-relaxed text-fg-muted">
              {shippingLines.map((line, i) => (
                <div key={i} className={i === 0 ? 'text-fg' : ''}>{line}</div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-fg-muted">No shipping address on file.</p>
          )}
        </div>
      </section>

      <section className="border-t border-border pt-6">
        <h2 className={sectionHead}>Fulfillment</h2>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <label className="flex flex-col gap-2">
            <span className={microLabel}>Update status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="rounded-sm border border-border-strong bg-bg px-3 py-2 text-[14px] text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </label>
          <Button type="button" variant="primary" size="md" onClick={onStatusSubmit}
            disabled={isPending || status === order.status} isLoading={isPending}>
            Save status
          </Button>
        </div>
        <div className="mt-4">
          <Textarea label={notesLabel} value={notes} onChange={(e) => setNotes(e.target.value)}
            onBlur={onNotesBlur} hint="Saved automatically when you leave the field." rows={4} />
        </div>
      </section>
    </div>
  );
}
