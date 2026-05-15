'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { StepSelector } from './StepSelector';
import { SummaryPanel } from './SummaryPanel';
import { VolumeSelect } from './VolumeSelect';
import { PaymentStep } from './PaymentStep';
import {
  useBuilderState,
  type Step,
  type Layer,
  LAYER_MIN,
  LAYER_MAX,
} from './_hooks/useBuilderState';

const STEP_LAYER: Record<Exclude<Step, 4 | 5>, Layer> = {
  1: 'top',
  2: 'heart',
  3: 'base',
};

const STEP_LABELS: Record<Step, { eyebrow: string; title: string; description: string }> = {
  1: {
    eyebrow: '01 / Top notes',
    title: 'Top notes',
    description: 'The first thing anyone smells. Pick two or three.',
  },
  2: {
    eyebrow: '02 / Heart notes',
    title: 'Heart notes',
    description: 'What stays after the top fades. Pick three to five.',
  },
  3: {
    eyebrow: '03 / Base notes',
    title: 'Base notes',
    description: 'The wood and the resin. Pick two.',
  },
  4: {
    eyebrow: '04 / How much',
    title: 'How much',
    description: 'Fifty millilitres for daily, one hundred for the shelf.',
  },
  5: { eyebrow: '05 / Read it back', title: 'Read it back', description: '' },
};

export default function CreatePerfumePage() {
  const b = useBuilderState();
  const layer = (STEP_LAYER as Record<number, Layer>)[b.step];

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="container-wide py-16">
        <header className="mb-12 max-w-3xl">
          <p className="font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)] text-fg-muted mb-4">
            Three layers, four hours, one perfume.
          </p>
          <h1 className="font-display text-[length:var(--font-h1)] text-fg leading-tight">
            Build a perfume
          </h1>
        </header>

        <nav className="mb-12 flex flex-wrap gap-x-6 gap-y-3 border-t border-b border-border py-4">
          {([1, 2, 3, 4, 5] as Step[]).map((s) => {
            const active = s === b.step;
            return (
              <button
                key={s}
                type="button"
                onClick={() => b.setStep(s)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'font-micro uppercase tracking-[0.05em] text-[length:var(--font-size-micro)]',
                  'transition-all duration-150 ease-[cubic-bezier(0.25,1,0.5,1)]',
                  'border-b border-transparent hover:border-accent',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  active ? 'text-fg border-accent translate-y-px' : 'text-fg-muted',
                )}
              >
                {STEP_LABELS[s].eyebrow}
              </button>
            );
          })}
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-12">
          <main key={b.step}>
            {layer ? (
              <StepSelector
                layer={layer}
                notes={b.notesForLayer(layer)}
                selected={b.selections[layer]}
                onToggle={(n) => b.toggleNote(layer, n)}
                min={LAYER_MIN[layer]}
                max={LAYER_MAX[layer]}
                eyebrow={STEP_LABELS[b.step].eyebrow}
                title={STEP_LABELS[b.step].title}
                description={STEP_LABELS[b.step].description}
              />
            ) : b.step === 4 ? (
              <VolumeSelect
                value={b.volume}
                onChange={b.setVolume}
                eyebrow={STEP_LABELS[4].eyebrow}
                title={STEP_LABELS[4].title}
                description={STEP_LABELS[4].description}
              />
            ) : (
              <PaymentStep
                selections={b.selections}
                volume={b.volume}
                totalCents={b.totalCents}
                canSubmit={b.validation.isValid}
                eyebrow={STEP_LABELS[5].eyebrow}
                title={STEP_LABELS[5].title}
              />
            )}

            <div className="mt-10 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => b.setStep(Math.max(1, b.step - 1) as Step)}
                disabled={b.step === 1}
              >
                Back
              </Button>
              {b.step < 5 && (
                <Button
                  variant="primary"
                  onClick={() => b.setStep(Math.min(5, b.step + 1) as Step)}
                  disabled={!b.canAdvance}
                >
                  Continue
                </Button>
              )}
            </div>
          </main>

          <SummaryPanel
            selections={b.selections}
            totalCents={b.totalCents}
            volume={b.volume}
          />
        </div>
      </div>
    </div>
  );
}
