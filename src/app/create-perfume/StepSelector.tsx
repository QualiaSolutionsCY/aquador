'use client';

/**
 * StepSelector: multi-select note picker for one fragrance layer.
 *
 * Layout: a hairline-divider stack of clickable chip-buttons. Each chip
 * borrows the badgeBase/badgeVariants surface treatment so it stays visually
 * consistent with the rest of the v3.0 chip vocabulary, but renders as a
 * <button> so it is keyboard-operable and supports a selected state.
 *
 * Min/Max enforcement: unselected chips become disabled once the layer's
 * selection count hits LAYER_MAX[layer]; reads min/max via props from
 * the parent (which sources them from useBuilderState).
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Layer } from './_hooks/useBuilderState';
import type { FragranceNote } from '@/lib/perfume/types';

interface StepSelectorProps {
  layer: Layer;
  notes: FragranceNote[];
  selected: string[];
  onToggle: (note: string) => void;
  min: number;
  max: number;
  eyebrow: string;
  title: string;
  description: string;
}

export function StepSelector({
  layer,
  notes,
  selected,
  onToggle,
  min,
  max,
  eyebrow,
  title,
  description,
}: StepSelectorProps) {
  const atMax = selected.length >= max;
  const sectionRef = useRef<HTMLElement | null>(null);

  // Scroll-fade-up on mount via IntersectionObserver. One-shot per element.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      node.setAttribute('data-revealed', 'true');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute('data-revealed', 'true');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-layer={layer}
      data-revealed="false"
      className={cn(
        'opacity-0 translate-y-4',
        'data-[revealed=true]:opacity-100 data-[revealed=true]:translate-y-0',
        'transition-all duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)]',
      )}
    >
      <header className="mb-8">
        <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-2">
          {eyebrow}
        </p>
        <h2 className="font-display text-[length:var(--font-h2)] text-fg mb-3">
          {title}
        </h2>
        <p className="font-body text-[length:var(--font-size-body)] text-fg-muted max-w-prose leading-relaxed">
          {description}
        </p>
        <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mt-4">
          {selected.length} of {min === max ? min : `${min} to ${max}`} chosen
        </p>
      </header>

      <div className="border-t border-border">
        <ul className="divide-y divide-border" role="listbox" aria-label={`${layer} notes`}>
          {notes.map((note, idx) => {
            const isSelected = selected.includes(note.name);
            const isDisabled = !isSelected && atMax;
            return (
              <li key={note.name}>
                <button
                  type="button"
                  onClick={() => onToggle(note.name)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  data-selected={isSelected || undefined}
                  className={cn(
                    'group flex w-full items-baseline gap-6 py-5 text-left',
                    'transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                    isSelected ? 'text-fg' : 'text-fg-muted hover:text-fg',
                    isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                  )}
                >
                  <span className="font-micro tabular-nums uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted w-8 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display text-[length:var(--font-h3)] leading-tight">
                      {note.name}
                    </span>
                    {note.description ? (
                      <span className="mt-1 block font-body text-[length:var(--font-size-body-sm)] text-fg-muted">
                        {note.description}
                      </span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'shrink-0 font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] transition-opacity duration-150',
                      isSelected ? 'text-accent-deep opacity-100' : 'opacity-0 group-hover:opacity-100 text-fg-muted',
                    )}
                  >
                    {isSelected ? 'Chosen' : 'Choose'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
