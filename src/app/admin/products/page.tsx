'use client';

/**
 * Admin / Products — list view consuming the shared `AdminTable` primitive.
 *
 * Phase 2 Task 4 rewrite. The earlier handwritten `ProductsTable` component is
 * gone; column definitions live inline here. Data still flows through the
 * browser Supabase client (the `admin-service.ts` server module is Phase 2
 * Task 2 and will be plugged in by Phase 3 when sort + filter wiring lands).
 *
 * Tokens only — no `bg-gold`/`text-gold` magic strings, no raw hex.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, AlertCircle, Edit, Trash2, Eye } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/currency';
import {
  AdminTable,
  type AdminTableColumn,
} from '@/components/admin/AdminTable';
import { AdminTableToolbar } from '@/components/admin/AdminTableToolbar';
import type { ProductCategory, Product } from '@/lib/supabase/types';

const PER_PAGE = 20;

const CATEGORY_OPTIONS: { value: ProductCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'niche', label: 'Niche' },
  { value: 'essence-oil', label: 'Essence Oil' },
  { value: 'body-lotion', label: 'Body Lotion' },
  { value: 'lattafa-original', label: 'Lattafa Originals' },
  { value: 'al-haramain-originals', label: 'Al Haramain Originals' },
  { value: 'victorias-secret-originals', label: "Victoria's Secret Originals" },
];

/** Escape PostgREST special characters in search queries (SEC-03). */
function escapePostgrestQuery(query: string): string {
  return query.replace(/[%_\\*()[\]!,]/g, '\\$&');
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = (searchParams.get('category') || '') as ProductCategory | '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const offset = (currentPage - 1) * PER_PAGE;

      try {
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + PER_PAGE - 1);

        if (searchQuery) {
          query = query.ilike('name', `%${escapePostgrestQuery(searchQuery)}%`);
        }
        if (categoryFilter) {
          query = query.eq('category', categoryFilter as ProductCategory);
        }

        const { data, count: productCount, error: queryError } = await query;
        if (queryError) throw queryError;
        if (cancelled) return;

        setProducts((data || []) as Product[]);
        setCount(productCount || 0);
      } catch (e) {
        Sentry.addBreadcrumb({
          category: 'admin-products',
          message: 'Products fetch error',
          level: 'error',
          data: { error: e },
        });
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load products');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, categoryFilter, currentPage]);

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    }
    router.push(`/admin/products?${params.toString()}`);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from('products')
      .delete()
      .eq('id', deleteTarget.id);
    setDeleting(false);

    if (delErr) {
      setError(`Failed to delete product: ${delErr.message}`);
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setCount((prev) => Math.max(0, prev - 1));
    router.refresh();
  }

  const totalPages = Math.ceil(count / PER_PAGE);

  const columns: AdminTableColumn<Product>[] = [
    {
      key: 'product',
      header: 'Product',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm bg-bg-alt">
            <Image
              src={row.image}
              alt={row.name}
              fill
              sizes="40px"
              className="object-contain p-0.5"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-fg max-w-[240px]">{row.name}</p>
            <p className="text-[12px] text-fg-muted">{row.size}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      accessor: (row) => (
        <Badge variant="neutral" className="capitalize">
          {row.category.replace(/-/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (row) => (
        <span className="text-fg-muted capitalize">{row.product_type.replace(/-/g, ' ')}</span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      accessor: (row) => {
        const sale = row.sale_price;
        return (
          <div className="flex flex-col items-end leading-tight">
            <span className="font-medium text-fg">{formatPrice(row.price)}</span>
            {sale ? (
              <span className="text-[12px] text-accent-deep">Sale {formatPrice(sale)}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={row.in_stock ? 'success' : 'critical'}>
            {row.in_stock ? 'In Stock' : 'Out of Stock'}
          </Badge>
          {row.is_active === false ? <Badge variant="warning">Hidden</Badge> : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <a
            href={`/products/${row.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-fg-muted hover:bg-bg-alt hover:text-fg transition-colors"
            title="View on storefront"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="h-4 w-4" strokeWidth={1.5} />
          </a>
          <Link
            href={`/admin/products/${row.id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-fg-muted hover:bg-bg-alt hover:text-fg transition-colors"
            title="Edit"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-fg-muted hover:bg-critical/12 hover:text-critical transition-colors"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      ),
    },
  ];

  const toolbar: ReactNode = (
    <AdminTableToolbar
      search={searchQuery}
      onSearchChange={(value) => updateParams({ search: value || null, page: null })}
      searchPlaceholder="Search products by name"
      filters={
        <select
          value={categoryFilter}
          onChange={(e) => updateParams({ category: e.target.value || null, page: null })}
          className="rounded-sm border border-border-strong bg-bg px-3 py-2 text-[14px] font-body text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          aria-label="Filter by category"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      }
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] leading-tight text-fg">Products</h1>
          <p className="text-[13px] text-fg-muted">{count} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-[14px] font-medium text-bg transition-colors hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Add product
        </Link>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-sm border border-critical/40 bg-critical/12 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-critical" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-critical">Error loading products</p>
            <p className="text-[13px] text-critical/80">{error}</p>
          </div>
        </div>
      ) : null}

      <AdminTable
        columns={columns}
        rows={products}
        keyExtractor={(row) => row.id}
        loading={loading}
        emptyText="No products match your filters."
        toolbar={toolbar}
        onRowClick={(row) => router.push(`/admin/products/${row.id}`)}
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?page=${p}${searchQuery ? `&search=${searchQuery}` : ''}${categoryFilter ? `&category=${categoryFilter}` : ''}`}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-sm px-3 text-[13px] font-medium transition-colors ${
                p === currentPage
                  ? 'bg-accent text-bg'
                  : 'border border-border text-fg-muted hover:text-fg hover:bg-bg-alt'
              }`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border border-border bg-bg p-6">
            <h3 className="font-display text-[20px] text-fg">Delete product</h3>
            <p className="mt-2 text-[14px] text-fg-muted">
              Delete &ldquo;{deleteTarget.name}&rdquo;? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
