'use client';

/**
 * CustomerDetail — admin customer detail view (Phase 3 Task 3, ADMIN-06).
 *
 * Hairline-divider editorial stack — Card NOT used as a section container
 * per M2+ feedback; MetricCard tiles are the legitimate exception.
 * Sections: header, three MetricCards, cohort chips + add control,
 * order history AdminTable linking to /admin/orders/[id].
 *
 * Cohort mutations call `/api/admin/customers/[id]/cohorts` (POST add,
 * DELETE remove). Optimistic UI: chip appears/disappears instantly, then
 * rolls back on a non-2xx with a Toast. Duplicate adds surface as a Toast
 * without throwing.
 */

import { useCallback, useMemo, useState, useTransition, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { formatPrice, fromCents } from '@/lib/currency';
import { useToast } from '@/components/ui/Toast';
import { Tag } from '@/components/ui/Tag';
import { MetricCard } from '@/app/admin/_components/MetricCard';
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import type { Customer, Order } from '@/lib/supabase/types';

interface CustomerDetailProps {
  customer: Customer;
  orders: Order[];
  cohorts: string[];
}

const COHORT_PATTERN = /^[a-z0-9-]{1,32}$/;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusVariant(status: Order['status']): BadgeVariant {
  if (status === 'delivered' || status === 'shipped') return 'success';
  if (status === 'cancelled' || status === 'refunded') return 'critical';
  if (status === 'pending') return 'warning';
  return 'neutral';
}

export function CustomerDetail({ customer, orders, cohorts: initialCohorts }: CustomerDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [cohorts, setCohorts] = useState<string[]>(initialCohorts);
  const [draft, setDraft] = useState('');
  const [pending, startTransition] = useTransition();

  const summary = useMemo(() => {
    const count = orders.length;
    const totalCents = orders.reduce((a, o) => a + (typeof o.total === 'number' ? o.total : 0), 0);
    return {
      orderCount: count,
      aov: formatPrice(fromCents(count === 0 ? 0 : totalCents / count)),
      lastOrderAt: orders[0]?.created_at ?? null,
    };
  }, [orders]);

  const addCohort = useCallback((raw: string) => {
    const cohort = raw.trim().toLowerCase();
    if (!cohort) return;
    if (!COHORT_PATTERN.test(cohort)) {
      toast({
        title: 'Invalid cohort label',
        description: 'Lowercase letters, digits, and hyphens only (1-32 chars).',
        variant: 'error',
      });
      return;
    }
    if (cohorts.includes(cohort)) {
      toast({ title: `Already tagged with ${cohort}`, variant: 'default' });
      return;
    }
    setCohorts((prev) => [...prev, cohort]);
    setDraft('');
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/customers/${customer.id}/cohorts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cohort }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }
        router.refresh();
      } catch (err) {
        setCohorts((prev) => prev.filter((c) => c !== cohort));
        toast({
          title: 'Could not add cohort',
          description: err instanceof Error ? err.message : String(err),
          variant: 'error',
        });
      }
    });
  }, [cohorts, customer.id, router, toast]);

  const removeCohort = useCallback((cohort: string) => {
    const previous = cohorts;
    setCohorts((prev) => prev.filter((c) => c !== cohort));
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/admin/customers/${customer.id}/cohorts?cohort=${encodeURIComponent(cohort)}`,
          { method: 'DELETE' },
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }
        router.refresh();
      } catch (err) {
        setCohorts(previous);
        toast({
          title: 'Could not remove cohort',
          description: err instanceof Error ? err.message : String(err),
          variant: 'error',
        });
      }
    });
  }, [cohorts, customer.id, router, toast]);

  const orderColumns: AdminTableColumn<Order>[] = [
    {
      key: 'created_at',
      header: 'Date',
      accessor: (row) => <span className="text-[13px] text-fg-muted">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'id',
      header: 'Order',
      accessor: (row) => (
        <span className="font-mono text-[13px] text-fg">
          #{row.stripe_session_id ? row.stripe_session_id.slice(-8).toUpperCase() : row.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      accessor: (row) => <span className="font-medium text-fg">{formatPrice(fromCents(row.total))}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'source',
      header: 'Source',
      accessor: (row) => (
        <Badge variant={row.order_source === 'manual' ? 'warning' : 'neutral'}>
          {row.order_source === 'manual' ? 'manual' : 'stripe'}
        </Badge>
      ),
    },
  ];

  function onDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addCohort(draft);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start gap-3">
        <Link
          href="/admin/customers"
          aria-label="Back to customers"
          className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-fg-muted transition-colors hover:bg-bg-alt hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] leading-tight text-fg">
            {customer.name?.trim() || 'Unnamed customer'}
          </h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            <span>{customer.email}</span>
            <span className="mx-2 text-border">{'·'}</span>
            <span>Joined {formatDate(customer.created_at)}</span>
            <span className="mx-2 text-border">{'·'}</span>
            <span className="text-fg">{formatPrice(fromCents(customer.total_spent))} lifetime</span>
          </p>
        </div>
      </header>

      <section aria-label="Customer summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Orders" value={String(summary.orderCount)} />
        <MetricCard label="Avg order value" value={summary.aov} />
        <MetricCard label="Last order" value={summary.lastOrderAt ? formatDate(summary.lastOrderAt) : '—'} />
      </section>

      <section aria-label="Cohort tags" className="space-y-3 border-t border-border pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[18px] text-fg">Cohorts</h2>
          <span className="text-[12px] uppercase tracking-[0.05em] text-fg-muted font-micro">
            {cohorts.length} tagged
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cohorts.length === 0 ? (
            <span className="text-[13px] text-fg-muted">No cohorts yet.</span>
          ) : (
            cohorts.map((c) => (
              <Tag
                key={c}
                label={c}
                variant={c === 'vip' ? 'accent' : 'neutral'}
                onRemove={pending ? undefined : () => removeCohort(c)}
              />
            ))
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onDraftKeyDown}
            placeholder="vip, repeat, lattafa-buyer..."
            aria-label="New cohort label"
            disabled={pending}
            className="w-full max-w-[280px] rounded-[8px] border border-border-strong bg-bg px-4 py-2.5 text-[14px] font-body text-fg placeholder:text-fg-muted/60 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => addCohort(draft)}
            disabled={pending || !draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border-strong bg-bg px-3 py-2 text-[13px] font-medium text-fg transition-colors hover:bg-bg-alt disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            Add cohort
          </button>
        </div>
      </section>

      <section aria-label="Order history" className="space-y-3 border-t border-border pt-6">
        <h2 className="font-display text-[18px] text-fg">Order history</h2>
        <AdminTable<Order>
          columns={orderColumns}
          rows={orders}
          keyExtractor={(row) => row.id}
          emptyText="No orders yet."
          onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
        />
      </section>
    </div>
  );
}

export default CustomerDetail;
