/**
 * Table — editorial-luxury data primitive (Aquad'or v3.0)
 * ---------------------------------------------------------------------------
 * Compound component for tabular data. Sharp (not rounded) by design — tables
 * are an editorial surface, not a fintech card. Semantic HTML throughout
 * (<table>/<thead>/<tbody>/<tr>/<th>/<td>) so screen readers and zoom users
 * get native row/column semantics for free.
 *
 * Contract (consumers may import the namespaced `Table` OR individual parts):
 *
 *   Table.Root          — <table> wrapped in a horizontal-scroll <div>. Sets
 *                         tabular-num font-feature so every descendant numeric
 *                         <td> inherits aligned digits. 14px Newsreader body.
 *   Table.Header        — <thead> with sticky-top header on --bg-alt surface.
 *   Table.Body          — <tbody>, unstyled.
 *   Table.Row           — <tr> with bottom border + hover row tint. Callers
 *                         that want an interactive row add `onClick` +
 *                         `tabIndex={0}` + `onKeyDown` themselves; the
 *                         primitive does NOT auto-promote rows to buttons.
 *   Table.HeaderCell    — static <th>. 11px uppercase Geist micro,
 *                         tracking 0.05em, --fg-muted.
 *   Table.Cell          — <td>. Optional `align` prop ('left' | 'right' |
 *                         'center'); right-align for numeric columns per
 *                         design-product.md ("right-align numbers").
 *   Table.SortHeader    — interactive <th> wrapping a <button>. Caller passes
 *                         `onSort` + `sortDirection`. Renders an Arrow
 *                         indicator (lucide-react, stroke 1.5, 12px) that
 *                         reflects state. `aria-sort` is set on <th>.
 *   Table.Empty         — empty-state row inside <tbody>. Caller passes
 *                         `colSpan` (required to span all columns) plus
 *                         children (compose icon + sentence + action per
 *                         PRODUCT.md empty-state contract).
 *
 * Token map (no raw hex, no rgb, no bg-gray-*):
 *   bg-bg-alt       → var(--bg-alt)    parchment surface for headers + hover
 *   border-border   → var(--border)    1px row separator
 *   text-fg         → var(--fg)        body cell text + active sort icon
 *   text-fg-muted   → var(--fg-muted)  header label + inactive sort icon
 *   font-body       → Newsreader       body cells
 *   font-micro      → Geist            header cells + sort button
 *   duration-150    → --duration-fast  hover/sort transition
 */

import {
  forwardRef,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  type TableHTMLAttributes,
} from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Table.Root — <table> + horizontal-scroll wrapper
// ---------------------------------------------------------------------------

type RootProps = TableHTMLAttributes<HTMLTableElement>;

const Root = forwardRef<HTMLTableElement, RootProps>(function Root(
  { className = '', children, ...rest },
  ref,
) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={`w-full border-collapse text-[14px] font-body [font-feature-settings:'tnum'_1] ${className}`.trim()}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Table.Header — sticky <thead>
// ---------------------------------------------------------------------------

type HeaderProps = HTMLAttributes<HTMLTableSectionElement>;

const Header = forwardRef<HTMLTableSectionElement, HeaderProps>(function Header(
  { className = '', children, ...rest },
  ref,
) {
  return (
    <thead
      ref={ref}
      className={`sticky top-0 bg-bg-alt z-10 ${className}`.trim()}
      {...rest}
    >
      {children}
    </thead>
  );
});

// ---------------------------------------------------------------------------
// Table.Body — unstyled <tbody>
// ---------------------------------------------------------------------------

type BodyProps = HTMLAttributes<HTMLTableSectionElement>;

const Body = forwardRef<HTMLTableSectionElement, BodyProps>(function Body(
  { className = '', children, ...rest },
  ref,
) {
  return (
    <tbody ref={ref} className={className} {...rest}>
      {children}
    </tbody>
  );
});

// ---------------------------------------------------------------------------
// Table.Row — bottom border + hover tint
// ---------------------------------------------------------------------------

type RowProps = HTMLAttributes<HTMLTableRowElement>;

const Row = forwardRef<HTMLTableRowElement, RowProps>(function Row(
  { className = '', children, ...rest },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={`border-b border-border hover:bg-bg-alt transition-colors duration-150 ${className}`.trim()}
      {...rest}
    >
      {children}
    </tr>
  );
});

// ---------------------------------------------------------------------------
// Table.HeaderCell — static <th>
// ---------------------------------------------------------------------------

type HeaderCellProps = ThHTMLAttributes<HTMLTableCellElement>;

const HeaderCell = forwardRef<HTMLTableCellElement, HeaderCellProps>(
  function HeaderCell({ className = '', children, ...rest }, ref) {
    return (
      <th
        ref={ref}
        className={`text-left px-4 py-3 text-[11px] uppercase tracking-[0.05em] text-fg-muted font-micro font-medium ${className}`.trim()}
        {...rest}
      >
        {children}
      </th>
    );
  },
);

// ---------------------------------------------------------------------------
// Table.Cell — <td> with optional alignment
// ---------------------------------------------------------------------------

type CellAlign = 'left' | 'right' | 'center';

interface CellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /** Horizontal text alignment. Defaults to `'left'`. Use `'right'` for
   *  numeric columns (prices, quantities, dates) per design-product.md. */
  align?: CellAlign;
}

const ALIGN_CLASS: Record<CellAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const Cell = forwardRef<HTMLTableCellElement, CellProps>(function Cell(
  { className = '', align = 'left', children, ...rest },
  ref,
) {
  return (
    <td
      ref={ref}
      className={`px-4 py-3 text-fg align-middle ${ALIGN_CLASS[align]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </td>
  );
});

// ---------------------------------------------------------------------------
// Table.SortHeader — interactive <th> with sort affordance
// ---------------------------------------------------------------------------

type SortDirection = 'asc' | 'desc' | null;

interface SortHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Invoked when the user clicks (or presses Enter/Space on) the header.
   *  Caller cycles the direction; the primitive renders the icon. */
  onSort: () => void;
  /** Active sort direction. `null` (default) renders ArrowUpDown in muted. */
  sortDirection?: SortDirection;
}

function ariaSortFor(dir: SortDirection): 'ascending' | 'descending' | 'none' {
  if (dir === 'asc') return 'ascending';
  if (dir === 'desc') return 'descending';
  return 'none';
}

const SortHeader = forwardRef<HTMLTableCellElement, SortHeaderProps>(
  function SortHeader(
    { className = '', children, onSort, sortDirection = null, ...rest },
    ref,
  ) {
    let icon;
    if (sortDirection === 'asc') {
      icon = (
        <ArrowUp
          size={12}
          strokeWidth={1.5}
          className="text-fg"
          aria-hidden="true"
        />
      );
    } else if (sortDirection === 'desc') {
      icon = (
        <ArrowDown
          size={12}
          strokeWidth={1.5}
          className="text-fg"
          aria-hidden="true"
        />
      );
    } else {
      icon = (
        <ArrowUpDown
          size={12}
          strokeWidth={1.5}
          className="text-fg-muted"
          aria-hidden="true"
        />
      );
    }

    return (
      <th
        ref={ref}
        aria-sort={ariaSortFor(sortDirection)}
        className={`text-left px-4 py-3 ${className}`.trim()}
        {...rest}
      >
        <button
          type="button"
          onClick={onSort}
          className="inline-flex items-center gap-2 text-left text-[11px] uppercase tracking-[0.05em] text-fg-muted font-micro font-medium hover:text-fg transition-colors duration-150"
        >
          <span>{children}</span>
          {icon}
        </button>
      </th>
    );
  },
);

// ---------------------------------------------------------------------------
// Table.Empty — empty-state row inside <tbody>
// ---------------------------------------------------------------------------

interface EmptyProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Number of columns to span — set to the count of <th> in the header. */
  colSpan: number;
}

const Empty = forwardRef<HTMLTableRowElement, EmptyProps>(function Empty(
  { className = '', colSpan, children, ...rest },
  ref,
) {
  return (
    <tr ref={ref} className={className} {...rest}>
      <td
        colSpan={colSpan}
        className="px-4 py-16 text-center text-fg-muted"
      >
        {children}
      </td>
    </tr>
  );
});

// ---------------------------------------------------------------------------
// Exports — namespaced object AND individual aliases
// ---------------------------------------------------------------------------

/**
 * Namespaced compound entry. Prefer this in new code:
 *
 *   import { Table } from '@/components/ui/Table';
 *   <Table.Root>
 *     <Table.Header>
 *       <Table.Row>
 *         <Table.HeaderCell>Name</Table.HeaderCell>
 *         <Table.SortHeader onSort={...} sortDirection="asc">Price</Table.SortHeader>
 *       </Table.Row>
 *     </Table.Header>
 *     <Table.Body>
 *       <Table.Row><Table.Cell>...</Table.Cell></Table.Row>
 *     </Table.Body>
 *   </Table.Root>
 */
export const Table = {
  Root,
  Header,
  Body,
  Row,
  HeaderCell,
  Cell,
  SortHeader,
  Empty,
};

// Individual aliases for consumers who prefer flat named imports.
export {
  Root as TableRoot,
  Header as TableHeader,
  Body as TableBody,
  Row as TableRow,
  HeaderCell as TableHeaderCell,
  Cell as TableCell,
  SortHeader as TableSortHeader,
  Empty as TableEmpty,
};

export type {
  RootProps as TableRootProps,
  HeaderProps as TableHeaderProps,
  BodyProps as TableBodyProps,
  RowProps as TableRowProps,
  HeaderCellProps as TableHeaderCellProps,
  CellProps as TableCellProps,
  CellAlign as TableCellAlign,
  SortHeaderProps as TableSortHeaderProps,
  SortDirection as TableSortDirection,
  EmptyProps as TableEmptyProps,
};
