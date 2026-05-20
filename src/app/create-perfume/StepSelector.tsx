'use client';

/**
 * StepSelector: single-note picker for one fragrance layer.
 *
 * Renders the layer's notes as an icon-anchored tile grid. Each tile shows a
 * Lucide icon (mapped via noteIcons.ts), the note name in display serif, and
 * a one-line descriptor. Selection is mutually exclusive within the layer —
 * picking a new tile swaps via the useBuilderState reducer's MAX=1 swap branch.
 *
 * Layout: 2 cols at base, 3 at sm, 4 at md+. Tiles maintain a min height so
 * the grid stays even across rows. Selected tile flips to fg surface; hover
 * applies a hairline border.
 */

import { cn } from '@/lib/utils';
import type { Layer } from './_hooks/useBuilderState';
import type { FragranceNote } from '@/lib/perfume/types';
import { iconForNote } from './noteIcons';

interface StepSelectorProps {
  layer: Layer;
  notes: FragranceNote[];
  selected: string[];
  onToggle: (note: string) => void;
  eyebrow: string;
  title: string;
  description: string;
}

export function StepSelector({
  layer,
  notes,
  selected,
  onToggle,
  eyebrow,
  title,
  description,
}: StepSelectorProps) {
  return (
    <section data-layer={layer} className="w-full max-w-[var(--container-wide)] mx-auto">
      <header className="text-center mb-10 md:mb-14">
        <p className="font-micro uppercase tracking-[0.16em] text-[length:var(--font-size-micro)] text-fg-muted mb-4">
          {eyebrow}
        </p>
        <h2 className="font-display text-[length:var(--font-display-2xl)] text-fg leading-[1.02] tracking-[-0.02em]">
          {title}
        </h2>
        <p className="mt-5 font-body text-[length:var(--font-size-body-lg)] text-fg-muted max-w-prose mx-auto leading-relaxed">
          {description}
        </p>
      </header>

      <ul
        role="listbox"
        aria-label={`${layer} notes`}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-border border border-border"
      >
        {notes.map((note) => {
          const isSelected = selected.includes(note.name);
          const Icon = iconForNote(note);
          return (
            <li key={note.name} className="bg-bg">
              <button
                type="button"
                onClick={() => onToggle(note.name)}
                aria-pressed={isSelected}
                data-selected={isSelected || undefined}
                className={cn(
                  'group flex w-full h-full min-h-[160px] flex-col items-center justify-center gap-3 px-4 py-6 text-center',
                  'transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
                  isSelected
                    ? 'bg-fg text-bg'
                    : 'bg-bg text-fg-muted hover:bg-bg-alt hover:text-fg',
                )}
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.25}
                  className={cn(
                    'h-8 w-8 transition-colors duration-150',
                    isSelected ? 'text-bg' : 'text-fg-muted group-hover:text-accent-deep',
                  )}
                />
                <span className="font-display text-[length:var(--font-h3)] leading-tight">
                  {note.name}
                </span>
                {note.description ? (
                  <span
                    className={cn(
                      'font-micro uppercase tracking-[0.08em] text-[10px] leading-relaxed max-w-[18ch]',
                      isSelected ? 'text-bg/70' : 'text-fg-muted/80',
                    )}
                  >
                    {note.description}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
