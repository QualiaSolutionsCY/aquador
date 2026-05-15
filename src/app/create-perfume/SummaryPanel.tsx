'use client';

/**
 * SummaryPanel: persistent right column. Renders the composition as prose
 * (commas and periods only, no em-dashes), plus a running total that animates
 * between values via requestAnimationFrame. Respects prefers-reduced-motion.
 *
 * Container variant: hairline-stack on a flat surface. NOT a Card.
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Selections } from './_hooks/useBuilderState';

interface SummaryPanelProps {
  selections: Selections;
  totalCents: number;
  volume: '50ml' | '100ml';
}

function formatEur(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Numeric ticker animates from previous value to the current one. */
function NumericTicker({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      fromRef.current = value;
      setDisplayed(value);
      return;
    }
    const start = performance.now();
    const from = fromRef.current;
    const to = value;
    const duration = 250; // var(--duration-base)
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out-quart
      const eased = 1 - Math.pow(1 - t, 4);
      const next = from + (to - from) * eased;
      setDisplayed(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <span
      aria-live="polite"
      className="font-display text-[length:var(--font-display-xl)] text-accent-deep"
    >
      {formatEur(displayed)}
    </span>
  );
}

function renderProse(selections: Selections): string {
  const top = selections.top.join(' and ');
  const heart = selections.heart.join(' and ');
  const base = selections.base.join(' and ');
  const parts: string[] = [];
  if (top) parts.push(`${top} on the rise`);
  if (heart) parts.push(`${heart} at the heart`);
  if (base) parts.push(`${base} as the foundation`);
  if (!parts.length) return 'Pick a few notes. The composition writes itself.';
  return `${parts.join(', ')}.`;
}

export function SummaryPanel({ selections, totalCents, volume }: SummaryPanelProps) {
  return (
    <aside
      className={cn(
        'md:sticky md:top-16',
        'md:border-l md:border-border md:pl-8',
        'py-6',
      )}
      aria-label="Composition summary"
    >
      <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-3">
        In progress
      </p>
      <h2 className="font-display text-[length:var(--font-display-xl)] text-fg leading-tight mb-6">
        Your composition
      </h2>

      <p className="font-body text-[length:var(--font-size-body)] text-fg leading-relaxed mb-8">
        {renderProse(selections)}
      </p>

      <div className="border-t border-border pt-6 flex items-baseline justify-between">
        <div>
          <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted">
            Total
          </p>
          <p className="font-micro text-[length:var(--font-size-micro)] text-fg-muted mt-1">
            {volume}
          </p>
        </div>
        <NumericTicker value={totalCents / 100} />
      </div>
    </aside>
  );
}
