'use client';

/**
 * ProductNotesStory. PDP-flavoured notes section consumed by the product page
 * rewrite (Phase 2.2 Task 4).
 *
 * Spec: .planning/phase-2-plan.md §Task 3 (renamed from NotesStory to avoid
 * collision with the homepage `NotesStory.tsx` shipped in Phase 2.1 — that one
 * is a no-prop editorial section, this one consumes product data).
 *
 * Behaviour: PDP-02 requires editorial PROSE composition, not a top-level
 * bullet list. Three short paragraphs anchored by font-micro eyebrows
 * ("THE OPENING" / "THE HEART" / "THE DRYDOWN") with the notes woven into
 * sentences via `weaveNotes`.
 *
 * Motion: each prose block fades up from `opacity-0 translate-y-4` to
 * `opacity-100 translate-y-0` when scrolled into view via `IntersectionObserver`
 * (one-shot, no re-trigger). Honors `prefers-reduced-motion` via the global
 * media query in tokens.css.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sanitizeDescriptionHtml } from '@/lib/product-description';

export interface ProductNotesStoryProps {
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  fragranceFamily?: string;
  description?: string;
}

/**
 * Weave a notes array into a readable sentence fragment.
 *   ["bergamot"]                            -> "bergamot"
 *   ["bergamot", "pink pepper"]             -> "bergamot and pink pepper"
 *   ["bergamot", "pink pepper", "neroli"]   -> "bergamot, pink pepper, and neroli"
 */
function weaveNotes(notes: string[]): string {
  const cleaned = notes.map((note) => note.trim()).filter(Boolean);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(', ')}, and ${cleaned[cleaned.length - 1]}`;
}

/**
 * useInView. One-shot IntersectionObserver hook for editorial reveals.
 * Returns a ref + a boolean that flips true on first intersection and stays.
 */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible } as const;
}

function Reveal({
  children,
  delayMs = 0,
}: {
  children: ReactNode;
  delayMs?: number;
}) {
  const { ref, visible } = useInView(0.2);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
      className={`transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  );
}

const LAYER_COPY = {
  top: 'meets the skin first and sets the room.',
  heart: 'settles in around the second hour and becomes the wear.',
  base: 'is what a coat sleeve still remembers the next morning.',
} as const;

export function ProductNotesStory({
  topNotes = [],
  heartNotes = [],
  baseNotes = [],
  fragranceFamily,
  description,
}: ProductNotesStoryProps) {
  // When the product carries a real admin description, render it verbatim and
  // skip the auto-woven opening/heart/drydown narrative. That generated prose
  // reads as nonsense whenever the notes data is weak (e.g. Lattafa originals,
  // whose notes are just the brand/category), so the authored copy wins.
  const hasDescription = Boolean(description && description.trim());

  const familyLine = fragranceFamily
    ? `A ${fragranceFamily.toLowerCase()} composition, read top to base.`
    : 'A composition read top to base.';

  const opening = topNotes.length > 0
    ? `${capitalize(weaveNotes(topNotes))} ${LAYER_COPY.top}`
    : `The opening ${LAYER_COPY.top}`;

  const heart = heartNotes.length > 0
    ? `Then the heart turns toward ${weaveNotes(heartNotes)}, and ${LAYER_COPY.heart}`
    : `Then the heart turns inward, and ${LAYER_COPY.heart}`;

  const drydown = baseNotes.length > 0
    ? `The drydown rests on ${weaveNotes(baseNotes)}. That ${LAYER_COPY.base}`
    : `The drydown rests low. That ${LAYER_COPY.base}`;

  return (
    <section className="border-t border-border-dark px-[var(--page-px)] py-16 md:py-24">
      <div className="max-w-[var(--container-narrow)]">
        <Reveal>
          <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.08em] text-fg-muted">
            02 / Notes
          </p>
          {hasDescription ? (
            <div
              className="mt-6 font-body text-[length:var(--font-size-body-lg)] leading-relaxed text-fg-muted prose prose-sm max-w-none prose-p:my-3 prose-headings:font-display prose-headings:text-fg prose-headings:tracking-tight prose-strong:text-fg prose-em:text-fg-muted prose-ul:my-3 prose-ol:my-3 prose-li:my-1"
              dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(description as string) }}
            />
          ) : (
            <h2 className="mt-6 font-display text-[length:var(--font-h1)] leading-[1.1] tracking-[-0.01em] text-fg italic">
              {familyLine}
            </h2>
          )}
        </Reveal>

        {!hasDescription ? (
          <div className="mt-12 grid gap-10 md:mt-16 md:gap-12">
            <Reveal delayMs={80}>
              <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.08em] text-fg-muted">
                The opening
              </p>
              <p className="mt-3 font-body text-[length:var(--font-size-body-lg)] leading-relaxed text-fg">
                {opening}
              </p>
            </Reveal>

            <Reveal delayMs={160}>
              <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.08em] text-fg-muted">
                The heart
              </p>
              <p className="mt-3 font-body text-[length:var(--font-size-body-lg)] leading-relaxed text-fg">
                {heart}
              </p>
            </Reveal>

            <Reveal delayMs={240}>
              <p className="font-micro text-[length:var(--font-size-micro)] uppercase tracking-[0.08em] text-fg-muted">
                The drydown
              </p>
              <p className="mt-3 font-body text-[length:var(--font-size-body-lg)] leading-relaxed text-fg">
                {drydown}
              </p>
            </Reveal>
          </div>
        ) : null}

      </div>
    </section>
  );
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default ProductNotesStory;
