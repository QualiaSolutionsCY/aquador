import { calculatePrice, PerfumeVolume } from '../pricing'

describe('Perfume Pricing', () => {
  describe('calculatePrice', () => {
    it('should return 29.99 for 50ml volume', () => {
      const volume: PerfumeVolume = '50ml'
      expect(calculatePrice(volume)).toBe(29.99)
    })

    it('should return 49.99 for 100ml volume', () => {
      const volume: PerfumeVolume = '100ml'
      expect(calculatePrice(volume)).toBe(49.99)
    })

    it('should throw error for invalid volume', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => calculatePrice('75ml')).toThrow('Invalid perfume volume')
    })

    it('should throw error for null volume', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => calculatePrice(null)).toThrow('Invalid perfume volume')
    })

    it('should throw error for undefined volume', () => {
      // @ts-expect-error - Testing invalid input
      expect(() => calculatePrice(undefined)).toThrow('Invalid perfume volume')
    })
  })

  describe('price validation', () => {
    it('should return prices with exactly 2 decimal places', () => {
      const price50ml = calculatePrice('50ml')
      const price100ml = calculatePrice('100ml')

      expect(price50ml.toFixed(2)).toBe('29.99')
      expect(price100ml.toFixed(2)).toBe('49.99')
    })
  })
})
