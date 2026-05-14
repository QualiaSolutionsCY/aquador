export type PerfumeVolume = '50ml' | '100ml'

/**
 * Calculate price based on perfume volume
 * 50ml = €29.99
 * 100ml = €199.00
 */
export function calculatePrice(volume: PerfumeVolume): number {
  if (!volume) {
    throw new Error('Invalid perfume volume')
  }

  switch (volume) {
    case '50ml':
      return 29.99
    case '100ml':
      return 199.00
    default:
      throw new Error('Invalid perfume volume')
  }
}
