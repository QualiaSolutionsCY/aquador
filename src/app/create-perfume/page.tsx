'use client';

/**
 * Build-a-perfume page: full-viewport multi-step builder.
 *
 * Layout shell:
 *   - Sticky 5-step header at top
 *   - Centred step content (min ~100vh on desktop, scrollable on small)
 *   - Sticky footer with Back / total / Next
 *
 * Steps:
 *   1. Pick the top note (1)
 *   2. Pick the heart note (1)
 *   3. Pick the base note (1)
 *   4. Pick the volume (50ml €29.99 / 100ml €49.99)
 *   5. Review and pay
 *
 * The hero image and side-by-side magazine layout from the previous build
 * are removed: customers come here to build, not to read.
 */

import { cn } from '@/lib/utils';
import { StepSelector } from './StepSelector';
import { SummaryPanel } from './SummaryPanel';
import { VolumeSelect } from './VolumeSelect';
import { PaymentStep } from './PaymentStep';
import {
  useBuilderState,
  type Step,
  type Layer,
} from './_hooks/useBuilderState';

const STEP_LAYER: Record<Exclude<Step, 4 | 5>, Layer> = {
  1: 'top',
  2: 'heart',
  3: 'base',
};

const STEP_LABELS: Record<
  Step,
  { eyebrow: string; title: string; description: string; nav: string }
> = {
  1: {
    eyebrow: 'Step one of five',
    title: 'Pick the top note.',
    description:
      'The first thing anyone smells when you walk into the room. Pick one.',
    nav: 'Top',
  },
  2: {
    eyebrow: 'Step two of five',
    title: 'Pick the heart note.',
    description:
      'What stays after the top fades. The room remembers this one. Pick one.',
    nav: 'Heart',
  },
  3: {
    eyebrow: 'Step three of five',
    title: 'Pick the base note.',
    description:
      'The wood, the resin, the foundation. This is what follows you home. Pick one.',
    nav: 'Base',
  },
  4: {
    eyebrow: 'Step four of five',
    title: 'How much.',
    description:
      'Fifty millilitres for daily wear, one hundred for the shelf and the gift box.',
    nav: 'Volume',
  },
  5: {
    eyebrow: 'Step five of five',
    title: 'Read it back, then send it to the bench.',
    description: '',
    nav: 'Review',
  },
};

const TOTAL_STEPS = 5;

function formatEuro(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export default function CreatePerfumePage() {
  const b = useBuilderState();
  const layer = (STEP_LAYER as Record<number, Layer>)[b.step];

  const goBack = () => b.setStep(Math.max(1, b.step - 1) as Step);
  const goNext = () => b.setStep(Math.min(TOTAL_STEPS, b.step + 1) as Step);

  const stepLabel = STEP_LABELS[b.step];

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      {/* Stepper — sticky to top of viewport, below the global navbar. */}
      <nav
        aria-label="Builder steps"
        className="sticky top-14 md:top-16 lg:top-[72px] z-30 bg-bg/95 backdrop-blur-md border-b border-border"
      >
        <ol className="mx-auto max-w-[var(--container-wide)] grid grid-cols-5 gap-x-3 px-[var(--page-px)] py-4">
          {([1, 2, 3, 4, 5] as Step[]).map((s) => {
            const active = s === b.step;
            const complete = s < b.step;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => b.setStep(s)}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex w-full flex-col items-start gap-2 text-left',
                    'transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'block h-[2px] w-full transition-colors duration-150',
                      active
                        ? 'bg-fg'
                        : complete
                          ? 'bg-accent-deep'
                          : 'bg-border-strong',
                    )}
                  />
                  <span className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        'font-micro tabular-nums uppercase tracking-[0.12em] text-[10px]',
                        active || complete ? 'text-fg' : 'text-fg-muted',
                      )}
                    >
                      {String(s).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'hidden sm:inline font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)]',
                        active
                          ? 'text-fg'
                          : complete
                            ? 'text-fg-muted'
                            : 'text-fg-muted/70',
                      )}
                    >
                      {STEP_LABELS[s].nav}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content. Each step keys to re-trigger mount transitions. */}
      <main
        key={b.step}
        className="flex flex-1 items-start justify-center px-[var(--page-px)] py-12 md:py-20 lg:min-h-[calc(100vh-9rem)] lg:items-center"
      >
        {layer ? (
          <StepSelector
            layer={layer}
            notes={b.notesForLayer(layer)}
            selected={b.selections[layer]}
            onToggle={(n) => b.toggleNote(layer, n)}
            eyebrow={stepLabel.eyebrow}
            title={stepLabel.title}
            description={stepLabel.description}
          />
        ) : b.step === 4 ? (
          <div className="w-full max-w-[var(--container-prose)] mx-auto">
            <VolumeSelect
              value={b.volume}
              onChange={b.setVolume}
              eyebrow={stepLabel.eyebrow}
              title={stepLabel.title}
              description={stepLabel.description}
            />
          </div>
        ) : (
          <div className="w-full max-w-[var(--container-prose)] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
            <PaymentStep
              selections={b.selections}
              volume={b.volume}
              totalCents={b.totalCents}
              canSubmit={b.validation.isValid}
              eyebrow={stepLabel.eyebrow}
              title={stepLabel.title}
            />
            <SummaryPanel
              selections={b.selections}
              totalCents={b.totalCents}
              volume={b.volume}
            />
          </div>
        )}
      </main>

      {/* Sticky footer: Back / live total / Next. */}
      <footer className="sticky bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur-md">
        <div className="mx-auto max-w-[var(--container-wide)] flex items-center justify-between gap-4 px-[var(--page-px)] py-4">
          <button
            type="button"
            onClick={goBack}
            disabled={b.step === 1}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 px-4 py-2',
              'font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)]',
              'transition-colors duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              b.step === 1
                ? 'text-fg-muted/40 cursor-not-allowed'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>

          <div className="text-center">
            <p className="font-micro uppercase tracking-[0.12em] text-[10px] text-fg-muted">
              Running total
            </p>
            <p className="font-display tabular-nums text-fg text-[length:var(--font-h3)] leading-tight">
              {formatEuro(b.totalCents)}
              <span className="ml-2 font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-fg-muted">
                · {b.volume}
              </span>
            </p>
          </div>

          {b.step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!b.canAdvance}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 border border-fg bg-fg px-6 py-2 text-bg',
                'font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)]',
                'transition-all duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
                'hover:bg-bg hover:text-fg',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                !b.canAdvance && 'opacity-40 cursor-not-allowed hover:bg-fg hover:text-bg',
              )}
            >
              <span>Continue</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <p className="font-micro uppercase tracking-[0.12em] text-[length:var(--font-size-micro)] text-fg-muted">
              Send to the bench below
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
