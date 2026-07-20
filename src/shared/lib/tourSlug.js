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
