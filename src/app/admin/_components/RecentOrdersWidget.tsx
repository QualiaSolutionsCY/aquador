'use client';

/**
 * RecentOrdersWidget — latest 10 orders, rendered through AdminTable
 * (Phase 2 Task 5, DASH-05).
 *
 * Receives the orders array from the server-rendered page. Row click
 * pushes to `/admin/orders/[id]` via the App Router. Status renders as
 * a semantic Badge — neutral for pending, success for confirmed →
 * delivered, critical for cancelled / refunded.
 *
 * Currency formatted via `Intl.NumberFormat('en-IE', { currency: 'EUR' })`.
 * Date rendered as short locale day-month so the column stays narrow.
 */

import { useRouter } from 'next/navigation';
import {
  AdminTable,
  type AdminTableColumn,
} from '@/components/admin/AdminTable';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import type { RecentOrderRow } from '@/lib/supabase/admin-service';
import type { OrderStatus } from '@/lib/supabase/types';

const EUR = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});

const DATE = new Intl.DateTimeFormat('en-IE', {
  day: 'numeric',
  month: 'short',
});

function statusVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case 'confirmed':
    case 'processing':
    case 'shipped':
    case 'delivered':
      return 'success';
    case 'cancelled':
    case 'refunded':
      return 'critical';
    case 'pending':
    default:
      return 'neutral';
  }
}

const columns: AdminTableColumn<RecentOrderRow>[] = [
  {
    key: 'id',
    header: 'Order',
    width: '140px',
    accessor: (row) => (
      <span className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg">
        #{row.id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: 'customer',
    header: 'Customer',
    accessor: (row) => (
      <span className="font-body text-[14px] text-fg">
        {row.customer_name || row.customer_email}
      </span>
    ),
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    width: '120px',
    accessor: (row) => (
      <span className="font-display text-[14px] text-fg [font-feature-settings:'tnum'_1]">
        {EUR.format(row.total / 100)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    width: '120px',
    accessor: (row) => (
      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
    ),
  },
  {
    key: 'created',
    header: 'Created',
    width: '110px',
    accessor: (row) => (
      <span className="font-body text-[13px] text-fg-muted">
        {DATE.format(new Date(row.created_at))}
      </span>
    ),
  },
];

export interface RecentOrdersWidgetProps {
  orders: RecentOrderRow[];
}

export function RecentOrdersWidget({ orders }: RecentOrdersWidgetProps) {
  const router = useRouter();
  return (
    <section aria-label="Recent orders" className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display text-[20px] leading-tight text-fg">
          Recent orders
        </h2>
        <p className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
          latest 10
        </p>
      </header>
      <AdminTable
        columns={columns}
        rows={orders}
        keyExtractor={(o) => o.id}
        emptyText="No orders yet."
        onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
      />
    </section>
  );
}

export default RecentOrdersWidget;
