import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose className strings. `clsx` resolves conditional shapes (arrays,
 * objects, falsy filtering) and `twMerge` collapses Tailwind utility conflicts
 * so callers can override (e.g. `<Button className="bg-bg-alt" />` wins over
 * the variant's default `bg-accent`). Required by the v3.0 primitive layer.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export formatPrice from currency module for backward compatibility
export { formatPrice } from './currency';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
