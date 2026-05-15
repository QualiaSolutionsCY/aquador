'use client';

/**
 * AdminTable — shared list primitive for /admin/products, /admin/orders,
 * /admin/customers (Phase 2 Task 4 / Milestone 3).
 *
 * Thin wrapper over the M1 `Table` compound (`src/components/ui/Table.tsx`).
 * Responsibilities:
 *   - Take generic `<T>` rows + a `columns` shape and render a token-driven
 *     `<table>` with hairline borders, sticky uppercase micro headers, and
 *     hover row tint. NO `<Card>` wrap — admin chrome is hairline-first.
 *   - Render an empty state (`emptyText`, default "No rows yet.") and a
 *     skeleton-row loading state when `loading` is true.
 *   - Optional `toolbar` slot rendered above the table (used by pages to host
 *     search + filter chips). Optional `onRowClick` makes a row interactive
 *     (keyboard + mouse).
 *
 * Phase 3 extension points (props typed, not yet implemented here — pages can
 * already declare `sortable: true` on a column and pass `onSort` without the
 * wrapper barking at them; the wrapper just forwards the flag downstream once
 * the sort engine lands):
 *   - `column.sortable?: boolean`, `column.sortFn?: (a, b) => number`
 *   - `onSort?: (key, direction) => void`
 *   - `selectable?: boolean`, `onSelectionChange?: (ids) => void`
 *   - `filters?: ReactNode` — toolbar inserts filter chips
 *   - `bulkActions?: ReactNode` — toolbar bulk action row
 *
 * These props are accepted today but produce a static render; Phase 3.3 will
 * wire sort state, selection state, and URL-sync without changing the public
 * shape.
 *
 * Token map (no raw hex / no bg-gray-*):
 *   bg / border / text  →  --bg, --bg-alt, --border, --fg, --fg-muted
 */

import {
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { Table } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';

// ---------------------------------------------------------------------------
// Public column + props contracts (kept stable for Phase 3.3 consumers).
// ---------------------------------------------------------------------------

export type AdminTableSortDirection = 'asc' | 'desc' | null;

export interface AdminTableColumn<T> {
  /** Stable key — used for React lists, sort state, and aria semantics. */
  key: string;
  /** Header label rendered in the <thead> micro row. No emoji in admin UI. */
  header: string;
  /** Cell renderer for a single row. Receives the full row object. */
  accessor: (row: T) => ReactNode;
  /** Right-align numeric columns (prices, counts, dates rendered as numbers). */
  align?: 'left' | 'right' | 'center';
  /** Phase 3 hook — declare a column sortable. Today it renders as static. */
  sortable?: boolean;
  /** Phase 3 hook — caller-supplied comparator. */
  sortFn?: (a: T, b: T) => number;
  /** Optional column width hint (e.g. '120px', '20%'). */
  width?: string;
}

export interface AdminTableProps<T> {
  /** Column definitions, ordered left-to-right. */
  columns: AdminTableColumn<T>[];
  /** Row data. */
  rows: T[];
  /** Stable per-row key (required for React + future selection state). */
  keyExtractor: (row: T) => string;
  /** Empty-state copy; renders centered when `rows.length === 0`. */
  emptyText?: string;
  /** Optional toolbar rendered above the table (search, filters, etc). */
  toolbar?: ReactNode;
  /** Click handler — when provided, rows become interactive (button-like). */
  onRowClick?: (row: T) => void;
  /** Renders skeleton rows in place of data when true. */
  loading?: boolean;
  /** Skeleton row count when `loading` is true (default 5). */
  skeletonRows?: number;

  // -------- Phase 3 extension points (accepted, not yet implemented) --------
  /** Phase 3 hook — sort change callback. */
  onSort?: (key: string, direction: AdminTableSortDirection) => void;
  /** Phase 3 hook — current sort state (display only today). */
  sortState?: { key: string; direction: AdminTableSortDirection };
  /** Phase 3 hook — selectable rows (renders checkbox column). */
  selectable?: boolean;
  /** Phase 3 hook — selection change callback. */
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

// ---------------------------------------------------------------------------
// Implementation.
// ---------------------------------------------------------------------------

export function AdminTable<T>({
  columns,
  rows,
  keyExtractor,
  emptyText = 'No rows yet.',
  toolbar,
  onRowClick,
  loading = false,
  skeletonRows = 5,
}: AdminTableProps<T>) {
  const colCount = columns.length;

  function handleRowKey(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (!onRowClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick(row);
    }
  }

  return (
    <div className="space-y-4">
      {toolbar ? <div data-admin-table-toolbar>{toolbar}</div> : null}

      <div className="border-t border-b border-border">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              {columns.map((col) => (
                <Table.HeaderCell
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : ''
                  }
                >
                  {col.header}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                <Table.Row key={`skeleton-${rowIdx}`}>
                  {columns.map((col) => (
                    <Table.Cell key={col.key} align={col.align ?? 'left'}>
                      <Skeleton variant="text" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))
            ) : rows.length === 0 ? (
              <Table.Empty colSpan={colCount}>{emptyText}</Table.Empty>
            ) : (
              rows.map((row) => {
                const id = keyExtractor(row);
                const interactive = !!onRowClick;
                return (
                  <Table.Row
                    key={id}
                    onClick={interactive ? () => onRowClick?.(row) : undefined}
                    onKeyDown={interactive ? (e) => handleRowKey(e, row) : undefined}
                    tabIndex={interactive ? 0 : undefined}
                    role={interactive ? 'button' : undefined}
                    className={interactive ? 'cursor-pointer' : ''}
                  >
                    {columns.map((col) => (
                      <Table.Cell key={col.key} align={col.align ?? 'left'}>
                        {col.accessor(row)}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                );
              })
            )}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  );
}

export default AdminTable;
