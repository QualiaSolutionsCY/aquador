'use client';

import Image from 'next/image';
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
      <div className="mx-auto max-w-[var(--container-wide)] px-[var(--page-px)] py-20 md:py-28">
        <section className="mb-16 md:mb-24 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 lg:items-end">
          <figure className="relative aspect-[3/2] overflow-hidden bg-bg-alt">
            <Image
              src="/create-perfume/atelier-still-life.webp"
              alt="A perfumer's worktable: an amber dropper bottle, a curl of bergamot peel in a ceramic dish, raw frankincense resin and a sprig of dried lavender on cool linen."
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
              priority
            />
          </figure>
          <header className="max-w-prose">
            <p className="font-micro uppercase tracking-[0.08em] text-[length:var(--font-size-micro)] text-fg-muted mb-6">
              A composition in three movements
            </p>
            <h1 className="font-display text-[length:var(--font-display-2xl)] text-fg leading-[1.02] tracking-[-0.01em]">
              Build a perfume that nobody else owns.
            </h1>
            <p className="mt-6 font-body text-[length:var(--font-size-body-lg)] text-fg-muted leading-relaxed">
              Three layers. Top notes that open the door. Heart notes that hold the room. Base notes that follow you home. Choose deliberately. We compose, decant, and ship in four hours.
            </p>
          </header>
        </section>

        <nav className="mb-16 grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-4 border-t border-border pt-6">
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
                  'text-left pb-3 border-b border-border-strong hover:border-fg',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  active ? 'text-fg border-fg' : 'text-fg-muted',
                )}
              >
                {STEP_LABELS[s].eyebrow}
              </button>
            );
          })}
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-16">
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
