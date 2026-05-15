'use client';

/**
 * Admin / Customers — list view consuming the shared `AdminTable` primitive.
 *
 * Phase 2 Task 4 rewrite. The legacy `CustomersTable` component is gone;
 * column definitions inlined. The row-click navigation to `/admin/customers/[id]`
 * is wired via `AdminTable`'s `onRowClick`.
 *
 * Tokens only. Currency formatted via `formatPrice(fromCents(...))`.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, fromCents } from '@/lib/currency';
import {
  AdminTable,
  type AdminTableColumn,
} from '@/components/admin/AdminTable';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar';
import type { Customer } from '@/lib/supabase/types';

const PAGE_SIZE = 20;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('last_order_at', { ascending: false, nullsFirst: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) {
      const escaped = search.trim().replace(/[%_]/g, '\\$&');
      query = query.or(`email.ilike.%${escaped}%,name.ilike.%${escaped}%`);
    }

    const { data, count } = await query;
    setCustomers((data || []) as Customer[]);
    setTotalCount(count || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const columns: AdminTableColumn<Customer>[] = [
    {
      key: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div className="flex flex-col leading-tight">
          <span className="font-medium text-fg">{row.name || 'Unnamed'}</span>
          <span className="text-[12px] text-fg-muted">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'right',
      accessor: (row) => <span className="text-fg">{row.total_orders}</span>,
    },
    {
      key: 'spent',
      header: 'Total Spent',
      align: 'right',
      accessor: (row) => (
        <span className="font-medium text-fg">{formatPrice(fromCents(row.total_spent))}</span>
      ),
    },
    {
      key: 'first',
      header: 'First Order',
      accessor: (row) => (
        <span className="text-[13px] text-fg-muted">{formatDate(row.first_order_at)}</span>
      ),
    },
    {
      key: 'last',
      header: 'Last Order',
      accessor: (row) => (
        <span className="text-[13px] text-fg-muted">{formatDate(row.last_order_at)}</span>
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
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight text-fg">Customers</h1>
          <p className="text-[13px] text-fg-muted">
            {totalCount} total customer{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={customers}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyText="No customers match your filters."
        toolbar={toolbar}
        onRowClick={(row) => router.push(`/admin/customers/${row.id}`)}
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
