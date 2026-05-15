/**
 * LtvBuckets — customer lifetime-value distribution as a hairline bar
 * chart (Phase 2 Task 5, DASH-03).
 *
 * Pure server component. Takes the `ltvBuckets` object straight from
 * `admin-service.getCustomerMetrics()` and renders four rows: label,
 * count, hairline bar scaled to the largest bucket. No chart library —
 * each bar is a `<div>` with a percentage width. This is the editorial-
 * stack pattern from DESIGN.md §10 (NOT a Card grid).
 *
 * Empty store: when every bucket is 0, we still render the four labels
 * (so the operator sees the buckets exist) with `0` count and an empty
 * hairline track. No skeleton, no fallback copy — per the plan AC:
 * "If a query returns 0, the tile shows 0 — not a dash."
 */

export interface LtvBucketsProps {
  buckets: {
    lt50: number;
    lt200: number;
    lt500: number;
    gte500: number;
  };
}

const BUCKET_DEFS: ReadonlyArray<{
  key: keyof LtvBucketsProps['buckets'];
  label: string;
}> = [
  { key: 'lt50', label: 'under €50' },
  { key: 'lt200', label: '€50 to €200' },
  { key: 'lt500', label: '€200 to €500' },
  { key: 'gte500', label: '€500 and up' },
];

export function LtvBuckets({ buckets }: LtvBucketsProps) {
  const counts = BUCKET_DEFS.map((b) => buckets[b.key]);
  const max = Math.max(1, ...counts); // floor at 1 so 0/0/0/0 stays a flat track

  return (
    <section
      aria-label="Customer lifetime value distribution"
      className="flex flex-col"
    >
      <header className="flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="font-display text-[20px] leading-tight text-fg">
          Customer LTV
        </h2>
        <p className="font-micro text-[12px] uppercase tracking-[0.05em] text-fg-muted">
          buckets
        </p>
      </header>

      <ul className="flex flex-col">
        {BUCKET_DEFS.map(({ key, label }) => {
          const count = buckets[key];
          const widthPct = (count / max) * 100;
          return (
            <li
              key={key}
              className="flex items-center gap-4 border-b border-border py-3 last:border-b-0"
            >
              <span className="w-32 shrink-0 font-body text-[14px] text-fg">
                {label}
              </span>
              <span
                aria-hidden="true"
                className="relative h-1 flex-1 bg-bg-alt"
              >
                <span
                  className="absolute inset-y-0 left-0 bg-accent"
                  style={{ width: `${widthPct}%` }}
                />
              </span>
              <span className="w-12 shrink-0 text-right font-display text-[16px] text-fg [font-feature-settings:'tnum'_1]">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default LtvBuckets;
