/**
 * BrandMarquee. Horizontal scrolling editorial strip between Hero and the
 * featured grid. Adds visual rhythm without a Card row of logos.
 *
 * Spec: .planning/DESIGN.md §10b "Ticker / marquee strips" pattern. Pauses on
 * hover. prefers-reduced-motion zeros it via tokens.css §7.
 *
 * Voice: editorial fragments separated by a hairline pipe. No emoji, no
 * em-dashes, no announcements.
 */

const PHRASES = [
  'Lattafa Originals',
  'Niche perfumery',
  'Aquad’or essence oils',
  'Al Haramain Originals',
  'Curated by the desk',
  'Free shipping over €35',
  'Three perfumers',
  'Eight notes per perfume',
];

export default function BrandMarquee() {
  // Duplicate the list so the marquee loops seamlessly without a visible reset.
  const items = [...PHRASES, ...PHRASES];

  return (
    <section
      aria-label="House marks the desk carries"
      className="relative overflow-hidden border-y border-border bg-bg py-4"
    >
      <div className="flex w-max animate-marquee items-center gap-12 whitespace-nowrap">
        {items.map((phrase, index) => (
          <span
            key={`${phrase}-${index}`}
            className="flex items-center gap-12 font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.12em] text-fg-muted"
          >
            <span>{phrase}</span>
            <span aria-hidden="true" className="text-border-strong">
              /
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
