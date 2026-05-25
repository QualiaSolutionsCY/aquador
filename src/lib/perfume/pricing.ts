import type { PerfumeVolume } from './types'

export type { PerfumeVolume } from './types'

export const CUSTOM_PERFUME_PRICES: Record<PerfumeVolume, number> = {
  '50ml': 29.99,
  '100ml': 49.99,
}

/**
 * Calculate price based on perfume volume
 * 50ml = €29.99
 * 100ml = €49.99
 */
export function calculatePrice(volume: PerfumeVolume): number {
  if (!volume) {
    throw new Error('Invalid perfume volume')
  }

  const price = CUSTOM_PERFUME_PRICES[volume]
  if (price === undefined) throw new Error('Invalid perfume volume')
  return price
}

export function calculatePriceCents(volume: PerfumeVolume): number {
  return Math.round(calculatePrice(volume) * 100)
}
