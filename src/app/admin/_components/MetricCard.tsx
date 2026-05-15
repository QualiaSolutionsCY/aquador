/**
 * MetricCard — single dashboard metric tile (Phase 2 Task 5).
 *
 * Pure presentational. Server-compatible (no hooks, no client state).
 * Used for the six headline tiles on `/admin`. This is the legitimate
 * Card-as-container use case per DESIGN.md §10b — a discrete metric
 * lives in a Card; section composition does not.
 *
 * Layout (top → bottom):
 *   label    — Geist micro 12px UPPERCASE 0.05em, fg-muted
 *   value    — display 32px, fg, tabular-nums
 *   footer   — delta arrow + percent OR caption (fg-muted micro)
 *
 * The delta cell only renders when `delta` is provided. Positive delta
 * reads as `--accent`; negative reads as `--critical` (per
 * REQUIREMENTS DASH-01). When `delta === 0` the row reads as fg-muted
 * with a hairline horizontal dash so the operator sees "no change",
 * not "no signal".
 */

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
  /** Operator-direct label. No exclamation, no emoji. */
  label: string;
  /** Pre-formatted value string. Currency + percent are formatted by caller. */
  value: string;
  /**
   * Delta vs the comparable prior period, expressed as a decimal
   * (e.g. 0.12 = +12%, -0.08 = -8%). Omit when no comparison applies
   * (e.g. all-time customer count).
   */
  delta?: number;
  /** Optional caption rendered beneath the value (e.g. "via site visits"). */
  caption?: string;
}

function formatDelta(delta: number): string {
  const pct = Math.abs(delta) * 100;
  const rounded = pct >= 100 ? Math.round(pct) : Math.round(pct * 10) / 10;
  return `${rounded}%`;
}

export function MetricCard({ label, value, delta, caption }: MetricCardProps) {
  const direction =
    typeof delta === 'number'
      ? delta > 0
        ? 'up'
        : delta < 0
          ? 'down'
          : 'flat'
      : null;

  return (
    <Card className="flex flex-col gap-3 p-5">
      <p className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
        {label}
      </p>
      <p className="font-display text-[32px] leading-none text-fg [font-feature-settings:'tnum'_1]">
        {value}
      </p>
      <div className="mt-auto flex min-h-[1.25rem] items-center gap-2">
        {direction !== null ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-micro text-[12px] uppercase tracking-[0.05em]',
              direction === 'up' && 'text-accent',
              direction === 'down' && 'text-critical',
              direction === 'flat' && 'text-fg-muted',
            )}
          >
            {direction === 'up' ? (
              <ArrowUp aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
            ) : direction === 'down' ? (
              <ArrowDown
                aria-hidden="true"
                className="h-3 w-3"
                strokeWidth={2}
              />
            ) : (
              <Minus aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
            )}
            {formatDelta(delta as number)}
          </span>
        ) : null}
        {caption ? (
          <span className="font-micro text-[12px] tracking-[0.01em] text-fg-muted">
            {caption}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export default MetricCard;
