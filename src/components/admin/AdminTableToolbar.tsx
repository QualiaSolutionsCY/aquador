'use client';

/**
 * AdminTableToolbar — search + filter + bulk-action row above an `AdminTable`.
 *
 * Layout: a flex row with two slots —
 *   left  → search input + filter chips (caller-rendered)
 *   right → bulk action affordance (caller-rendered; hidden until non-empty)
 *
 * The toolbar owns ONE piece of behavior: a debounced search input. Other
 * filter UIs (Select, Switch, multi-select chips) are passed through via the
 * `filters` slot — each admin page declares its own filter shape because the
 * filter axes vary per resource (products: category/brand/stock; orders:
 * status; customers: repeat-only). Keeping the toolbar pluggable avoids a
 * forked component per page.
 *
 * Tokens only — no raw hex, no bg-gray-*. Surface lives on `var(--bg)` with
 * hairline `var(--border)` separation; the search input pulls its own focus
 * ring from the M1 `Input` primitive.
 */

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Search } from 'lucide-react';

// ---------------------------------------------------------------------------
// useDebouncedValue — local hook so the toolbar is self-contained.
// 300ms default matches the AC ≥ 300ms requirement.
// ---------------------------------------------------------------------------

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ---------------------------------------------------------------------------
// Toolbar surface.
// ---------------------------------------------------------------------------

export interface AdminTableToolbarProps {
  /** Current search text (controlled). Pass undefined to hide the search input. */
  search?: string;
  /** Caller receives the DEBOUNCED value (300ms by default). */
  onSearchChange?: (value: string) => void;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Search debounce window in ms. Defaults to 300ms per AC. */
  debounceMs?: number;
  /** Filter slot — Select / Switch / chip components rendered next to search. */
  filters?: ReactNode;
  /** Right-side bulk actions — hidden until caller renders content. */
  bulkActions?: ReactNode;
}

export function AdminTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  debounceMs = 300,
  filters,
  bulkActions,
}: AdminTableToolbarProps) {
  const showSearch = search !== undefined && !!onSearchChange;
  const [draft, setDraft] = useState(search ?? '');
  const debouncedDraft = useDebouncedValue(draft, debounceMs);
  const lastEmittedRef = useRef<string>(search ?? '');

  // Re-sync local draft when parent resets `search` from outside (e.g. URL nav).
  useEffect(() => {
    if (search !== undefined && search !== draft && search === lastEmittedRef.current) {
      // parent reflects what we last sent; do nothing
      return;
    }
    if (search !== undefined && search !== draft && search !== lastEmittedRef.current) {
      setDraft(search);
      lastEmittedRef.current = search;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Forward debounced value to parent.
  useEffect(() => {
    if (!onSearchChange) return;
    if (debouncedDraft === lastEmittedRef.current) return;
    lastEmittedRef.current = debouncedDraft;
    onSearchChange(debouncedDraft);
  }, [debouncedDraft, onSearchChange]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
        {showSearch ? (
          <div className="relative w-full sm:max-w-sm">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="w-full rounded-sm border border-border-strong bg-bg pl-10 pr-3 py-2 text-[14px] font-body text-fg placeholder:text-fg-muted outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            />
          </div>
        ) : null}
        {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      </div>

      {bulkActions ? (
        <div className="flex items-center gap-2">{bulkActions}</div>
      ) : null}
    </div>
  );
}

export default AdminTableToolbar;
