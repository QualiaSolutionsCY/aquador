'use client';

/**
 * Admin / Orders — list view consuming the shared `AdminTable` primitive.
 *
 * Phase 2 Task 4 rewrite. Column definitions inlined; the legacy
 * `OrdersTable` component (which mixed an expand-on-click detail panel into
 * the table itself) is gone. The status select stays inline as a per-row
 * mutation control — Phase 3.3 will replace it with a row-detail drawer.
 *
 * Tokens only. Status badges use the semantic Badge variants — no raw
 * red/green/blue/yellow Tailwind classes.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { formatPrice } from '@/lib/currency';
import { fromCents } from '@/lib/currency';
import {
  AdminTable,
  type AdminTableColumn,
} from '@/components/admin/AdminTable';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar';
import type { Order, OrderStatus } from '@/lib/supabase/types';

const PAGE_SIZE = 20;

const STATUSES: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
];

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'created_desc', column: 'created_at', ascending: false },
  { label: 'Oldest first', value: 'created_asc', column: 'created_at', ascending: true },
  { label: 'Highest total', value: 'total_desc', column: 'total', ascending: false },
  { label: 'Lowest total', value: 'total_asc', column: 'total', ascending: true },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: 'warning',
  confirmed: 'accent',
  processing: 'accent',
  shipped: 'accent',
  delivered: 'success',
  cancelled: 'critical',
  refunded: 'neutral',
};

function formatOrderId(order: Order): string {
  const source = order.stripe_session_id || order.id;
  return `#${source.slice(-8).toUpperCase()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sort, setSort] = useState<SortValue>('created_desc');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const sortOption = SORT_OPTIONS.find((option) => option.value === sort) ?? SORT_OPTIONS[0];

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order(sortOption.column, { ascending: sortOption.ascending })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (search.trim()) {
      // SEC-03: Escape SQL wildcards
      const escaped = search.trim().replace(/[%_]/g, '\\$&');
      query = query.or(
        `customer_email.ilike.%${escaped}%,customer_name.ilike.%${escaped}%`,
      );
    }

    const { data, count } = await query;
    setOrders((data || []) as Order[]);
    setTotalCount(count || 0);
    setLoading(false);
  }, [page, statusFilter, search, sort]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const columns: AdminTableColumn<Order>[] = [
    {
      key: 'order',
      header: 'Order',
      accessor: (row) => (
        <div className="flex flex-col leading-tight">
          <span className="font-mono text-[13px] text-fg">{formatOrderId(row)}</span>
          {row.order_source === 'manual' ? (
            <Badge variant="warning" className="mt-1 w-fit">Manual</Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div className="flex flex-col leading-tight">
          <span className="text-fg">{row.customer_name ?? 'Unnamed'}</span>
          <span className="text-[12px] text-fg-muted">{row.customer_email}</span>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      accessor: (row) => (
        <span className="font-medium text-fg">{formatPrice(fromCents(row.total))}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <select
          value={row.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            handleStatusChange(row.id, e.target.value as OrderStatus);
          }}
          aria-label={`Status for ${formatOrderId(row)}`}
          className="rounded-sm border border-border bg-bg px-2 py-1 text-[12px] font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'status-badge',
      header: 'State',
      accessor: (row) => (
        <Badge variant={STATUS_VARIANT[row.status]} className="capitalize">{row.status}</Badge>
      ),
    },
    {
      key: 'created',
      header: 'Date',
      accessor: (row) => (
        <span className="text-[13px] text-fg-muted">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  const toolbar: ReactNode = (
    <AdminTableToolbar
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(0);
      }}
      searchPlaceholder="Search by name or email"
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortValue);
              setPage(0);
            }}
            aria-label="Sort orders"
            className="h-9 rounded-sm border border-border bg-bg px-3 font-body text-[13px] text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setStatusFilter(s.value);
                  setPage(0);
                }}
                className={`rounded-sm px-3 py-1.5 text-[12px] font-micro uppercase tracking-[0.05em] transition-colors ${
                  statusFilter === s.value
                    ? 'bg-accent/12 text-accent-deep'
                    : 'border border-border text-fg-muted hover:text-fg hover:bg-bg-alt'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight text-fg">Orders</h1>
          <p className="text-[13px] text-fg-muted">
            {totalCount} total order{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-[14px] font-medium text-bg transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Add order
        </Link>
      </div>

      <AdminTable
        columns={columns}
        rows={orders}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyText="No orders match your filters."
        toolbar={toolbar}
        onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-fg-muted">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-sm border border-border px-3 py-1.5 text-[13px] text-fg-muted hover:text-fg hover:bg-bg-alt disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-sm border border-border px-3 py-1.5 text-[13px] text-fg-muted hover:text-fg hover:bg-bg-alt disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
