/**
 * Stable URL slug from a Phish.net / calendar tour display label.
 * "Sphere Run 2026" → "sphere-run-2026"
 *
 * @param {string} tourLabel
 * @returns {string}
 */
export function tourLabelToSlug(tourLabel) {
  const raw = String(tourLabel ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return raw || 'tour';
}

/**
 * Default public tour-stats slug — Sphere run (game launch / inaugural Pick'em).
 * Calendar label is typically "Sphere Run 2026" (see show_calendar + overrides).
 */
export const DEFAULT_PUBLIC_TOUR_SLUG = 'sphere-run-2026';

/** Preferred calendar labels that map to {@link DEFAULT_PUBLIC_TOUR_SLUG}. */
export const DEFAULT_PUBLIC_TOUR_LABEL_CANDIDATES = [
  'Sphere Run 2026',
  'Sphere 2026',
  'Sphere',
];
