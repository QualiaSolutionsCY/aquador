/**
 * BrandMarquee. Horizontal scrolling editorial strip between Hero and the
 * featured grid. Adds visual rhythm without a Card row of logos.
 *
 * Spec: .planning/DESIGN.md §10b "Ticker / marquee strips" pattern. Pauses on
 * hover. prefers-reduced-motion zeros it via tokens.css §7.
 *
 * Motion (M3 polish, matches Hero parallax at e1676ca):
 *   - Loop duration bumped from 40s to 50s so the marquee reads languid
 *     rather than anxious (still inside the §10b 30–60s window).
 *   - Every fourth phrase gets a slow scale breath (1.0 → 1.04 → 1.0) on a
 *     1.2s loop, each with a staggered animation-delay so the pulses don't
 *     fire in sync. The pulse is a token-driven keyframe (no raw px / rgba).
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
  'Free shipping over 35 euro',
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
        {items.map((phrase, index) => {
          // Pulse every fourth phrase. Stagger each pulse by 0.4s so the
          // breaths cascade across the strip rather than firing in lockstep.
          const isPulsing = index % 4 === 0;
          const delay = `${(index % 16) * 0.4}s`;
          return (
            <span
              key={`${phrase}-${index}`}
              className="flex items-center gap-12 font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.12em] text-fg-muted"
            >
              <span
                className={isPulsing ? 'animate-marquee-phrase-pulse' : undefined}
                style={isPulsing ? { animationDelay: delay } : undefined}
              >
                {phrase}
              </span>
              <span aria-hidden="true" className="text-border-strong">
                /
              </span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
