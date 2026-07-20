/**
 * Stable URL slug from a Phish.net / calendar tour display label.
 * "2026 Sphere" → "2026-sphere"
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
 * Default public tour-stats slug — Sphere (game launch / inaugural Pick'em).
 * Live `show_calendar` label is currently **"2026 Sphere"** → `2026-sphere`.
 */
export const DEFAULT_PUBLIC_TOUR_SLUG = '2026-sphere';

/** Preferred calendar labels that map to the Sphere default slug family. */
export const DEFAULT_PUBLIC_TOUR_LABEL_CANDIDATES = [
  '2026 Sphere',
  'Sphere Run 2026',
  'Sphere 2026',
  'Sphere Run',
  'Sphere',
];
