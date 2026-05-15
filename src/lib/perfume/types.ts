export type FragranceCategory = 'floral' | 'fruity' | 'woody' | 'oriental' | 'gourmand'

export type PerfumeVolume = '50ml' | '100ml'

export interface FragranceNote {
  name: string
  category: FragranceCategory
  /**
   * @deprecated v2.0 emoji icon. Not rendered anywhere in v3.0; kept optional
   * to avoid breaking the existing notes.ts entries (which still set the field
   * for back-compat with the prebuild AI catalogue script). Remove entirely
   * after the next prebuild snapshot regen.
   */
  icon?: string
  color: string
  description: string
}

export interface PerfumeComposition {
  top: FragranceNote | null
  heart: FragranceNote | null
  base: FragranceNote | null
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface CustomPerfume {
  name: string
  composition: PerfumeComposition
  volume: PerfumeVolume
  specialRequests?: string
  price: number
}

export interface PerfumeFormData {
  name: string
  composition: PerfumeComposition
  volume: PerfumeVolume | null
  specialRequests: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: {
    name?: string[]
    composition?: string[]
    volume?: string[]
    specialRequests?: string[]
  }
}
