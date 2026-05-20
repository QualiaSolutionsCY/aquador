'use client';

/**
 * useBuilderState: sole state owner for the create-perfume builder flow.
 *
 * Imports three primitives from the READ-ONLY perfume domain library:
 *   - fragranceDatabase (note catalogue per layer)
 *   - validateComposition (single-note-per-layer validator)
 *   - calculatePrice (volume to EUR)
 *
 * The UI lets shoppers pick MULTIPLE notes per layer (per the locked voice
 * samples: "Pick two or three", "Pick three to five", "Pick two"). The
 * domain validator expects a single FragranceNote per layer, so for the
 * gating we map each layer's array to its first selected note before
 * handing it to validateComposition. That keeps zero duplication of
 * domain logic and keeps src/lib/perfume/* untouched.
 */

import { useCallback, useMemo, useReducer } from 'react';
import { fragranceDatabase } from '@/lib/perfume/notes';
import type {
  FragranceNote,
  FragranceCategory,
  PerfumeComposition,
  PerfumeVolume,
} from '@/lib/perfume/types';
import { validateComposition } from '@/lib/perfume/composition';
import { calculatePrice } from '@/lib/perfume/pricing';

export type Layer = 'top' | 'heart' | 'base';
export type Step = 1 | 2 | 3 | 4 | 5;

export interface Selections {
  top: string[];
  heart: string[];
  base: string[];
}

interface BuilderState {
  step: Step;
  selections: Selections;
  volume: PerfumeVolume;
}

type BuilderAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'TOGGLE_NOTE'; layer: Layer; note: string }
  | { type: 'SET_VOLUME'; volume: PerfumeVolume }
  | { type: 'RESET' };

export const LAYER_MIN: Record<Layer, number> = { top: 1, heart: 1, base: 1 };
export const LAYER_MAX: Record<Layer, number> = { top: 1, heart: 1, base: 1 };

const INITIAL: BuilderState = {
  step: 1,
  selections: { top: [], heart: [], base: [] },
  volume: '50ml',
};

function reducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'TOGGLE_NOTE': {
      const current = state.selections[action.layer];
      const has = current.includes(action.note);
      if (has) {
        return {
          ...state,
          selections: {
            ...state.selections,
            [action.layer]: current.filter((n) => n !== action.note),
          },
        };
      }
      if (current.length >= LAYER_MAX[action.layer]) {
        // Single-select layer: swap the selection. Multi-select: no-op.
        if (LAYER_MAX[action.layer] === 1) {
          return {
            ...state,
            selections: {
              ...state.selections,
              [action.layer]: [action.note],
            },
          };
        }
        return state;
      }
      return {
        ...state,
        selections: {
          ...state.selections,
          [action.layer]: [...current, action.note],
        },
      };
    }
    case 'SET_VOLUME':
      return { ...state, volume: action.volume };
    case 'RESET':
      return INITIAL;
    default:
      return state;
  }
}

/**
 * Flatten the catalogue across all five fragrance categories into a single
 * lookup of name -> FragranceNote, so the picker can render notes by name
 * regardless of which family they live in.
 */
const ALL_NOTES: Record<string, FragranceNote> = (
  Object.keys(fragranceDatabase) as FragranceCategory[]
).reduce<Record<string, FragranceNote>>((acc, category) => {
  for (const note of fragranceDatabase[category]) acc[note.name] = note;
  return acc;
}, {});

export function noteByName(name: string): FragranceNote | undefined {
  return ALL_NOTES[name];
}

export const NOTES_BY_LAYER: Record<Layer, FragranceNote[]> = {
  // Top: bright, lifted. Fruity plus a hand of floral.
  top: [...fragranceDatabase.fruity, ...fragranceDatabase.floral.slice(0, 4)],
  // Heart: the emotional core. Floral plus a hand of gourmand.
  heart: [
    ...fragranceDatabase.floral,
    ...fragranceDatabase.gourmand.slice(0, 4),
  ],
  // Base: foundation. Woody plus oriental.
  base: [...fragranceDatabase.woody, ...fragranceDatabase.oriental],
};

export interface BuilderApi {
  step: Step;
  setStep: (step: Step) => void;
  selections: Selections;
  toggleNote: (layer: Layer, note: string) => void;
  volume: PerfumeVolume;
  setVolume: (v: PerfumeVolume) => void;
  totalCents: number;
  validation: ReturnType<typeof validateComposition>;
  canAdvance: boolean;
  reset: () => void;
  notesForLayer: (layer: Layer) => FragranceNote[];
  /** Single-note PerfumeComposition derived from selections[0] of each layer. */
  composition: PerfumeComposition;
}

export function useBuilderState(): BuilderApi {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const composition = useMemo<PerfumeComposition>(
    () => ({
      top: state.selections.top[0] ? noteByName(state.selections.top[0]) ?? null : null,
      heart: state.selections.heart[0]
        ? noteByName(state.selections.heart[0]) ?? null
        : null,
      base: state.selections.base[0] ? noteByName(state.selections.base[0]) ?? null : null,
    }),
    [state.selections],
  );

  const validation = useMemo(() => validateComposition(composition), [composition]);

  const totalCents = useMemo(
    () => Math.round(calculatePrice(state.volume) * 100),
    [state.volume],
  );

  const canAdvance = useMemo(() => {
    const layerForStep: Record<Step, Layer | null> = {
      1: 'top',
      2: 'heart',
      3: 'base',
      4: null,
      5: null,
    };
    const layer = layerForStep[state.step];
    if (layer) {
      const count = state.selections[layer].length;
      return count >= LAYER_MIN[layer] && count <= LAYER_MAX[layer];
    }
    if (state.step === 4) return Boolean(state.volume);
    if (state.step === 5) return validation.isValid;
    return false;
  }, [state.step, state.selections, state.volume, validation.isValid]);

  const setStep = useCallback((step: Step) => dispatch({ type: 'SET_STEP', step }), []);
  const toggleNote = useCallback(
    (layer: Layer, note: string) => dispatch({ type: 'TOGGLE_NOTE', layer, note }),
    [],
  );
  const setVolume = useCallback(
    (volume: PerfumeVolume) => dispatch({ type: 'SET_VOLUME', volume }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const notesForLayer = useCallback((layer: Layer) => NOTES_BY_LAYER[layer], []);

  return {
    step: state.step,
    setStep,
    selections: state.selections,
    toggleNote,
    volume: state.volume,
    setVolume,
    totalCents,
    validation,
    canAdvance,
    reset,
    notesForLayer,
    composition,
  };
}
