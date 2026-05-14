// Re-export cart and order types
export * from './cart';
export * from './order';

// Re-export product types
export { type ProductType, type ProductSize } from './product';

// Gender type for Lattafa products
export type ProductGender = 'men' | 'women' | 'unisex';

// Canonical product shape — sourced from Supabase generated types (snake_case).
// All consumers should import Product from here for stability if the underlying
// schema source ever moves.
export type { Product } from '@/lib/supabase/types';

export interface FragranceNote {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface CustomPerfume {
  name: string;
  topNote: FragranceNote | null;
  heartNote: FragranceNote | null;
  baseNote: FragranceNote | null;
  size: '50ml' | '100ml';
  specialRequests?: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Category interface for shop categories
export interface Category {
  id: 'men' | 'women' | 'niche' | 'essence-oil' | 'body-lotion' | 'lattafa-original' | 'al-haramain-originals' | 'victorias-secret-originals';
  name: string;
  slug: string;
  description: string;
  image: string;
  contain?: boolean;
}
