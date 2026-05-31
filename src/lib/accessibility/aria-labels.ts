/**
 * ARIA label utilities for animated UI elements.
 *
 * Centralizes accessible label strings so they stay consistent across
 * components and are easy to update or localize.
 */

// ---------------------------------------------------------------------------
// Filter bar labels
// ---------------------------------------------------------------------------

/**
 * Returns the ARIA label for a filter pill.
 *
 * @param filterLabel - The visible filter label (e.g. "Women", "Niche")
 * @param isActive - Whether the filter is currently active
 * @returns ARIA label string
 */
export function getFilterLabel(filterLabel: string, isActive: boolean): string {
  return isActive
    ? `${filterLabel} filter, currently selected`
    : `Filter by ${filterLabel}`;
}

/**
 * Returns the live-region announcement when a filter is applied.
 *
 * @param filterLabel - The filter that was activated, or null for "All"
 * @param resultCount - Optional product count to announce
 * @returns Announcement string for aria-live="polite" region
 */
export function getFilterAnnouncement(
  filterLabel: string | null,
  resultCount?: number
): string {
  const filter = filterLabel ?? 'All';
  if (resultCount !== undefined) {
    return `Showing ${resultCount} ${resultCount === 1 ? 'product' : 'products'} for ${filter}`;
  }
  return `Filter set to ${filter}`;
}

// ---------------------------------------------------------------------------
// Parallax labels
// ---------------------------------------------------------------------------

/**
 * Returns the ARIA label for a decorative parallax section.
 * Parallax backgrounds are purely decorative — they get role="presentation"
 * so screen readers skip them entirely.  This helper produces the label for
 * the rare case where a parallax section carries meaningful content.
 *
 * @param description - Optional meaningful description (omit for decorative)
 * @returns ARIA label string, or undefined when the element is decorative
 */
export function getParallaxLabel(description?: string): string | undefined {
  return description;
}

// ---------------------------------------------------------------------------
// High-contrast mode detection
// ---------------------------------------------------------------------------

/**
 * Returns true when the user has enabled a high-contrast mode via the
 * forced-colors CSS media feature (Windows High Contrast) or the
 * prefers-contrast: more media query.
 *
 * Safe to call server-side — returns false when window is unavailable.
 */
export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Windows High Contrast / Forced Colors
  if (window.matchMedia('(forced-colors: active)').matches) return true;

  // macOS / browser "more contrast" preference
  if (window.matchMedia('(prefers-contrast: more)').matches) return true;

  return false;
}
