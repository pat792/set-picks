/**
 * Truncate catalog `last` (usually YYYY-MM-DD) for compact UI columns.
 * @param {unknown} raw
 * @returns {string} e.g. `7/19/24`, or `—` when missing
 */
export function formatCatalogLastShort(raw) {
  if (typeof raw !== 'string') return '—';
  const t = raw.trim();
  if (!t || t === '—' || t === '-' || /^never$/i.test(t)) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
      return '—';
    }
    const yy = String(y % 100).padStart(2, '0');
    return `${mo}/${d}/${yy}`;
  }
  // Already short / freeform — keep a tight slice
  return t.length > 8 ? t.slice(0, 8) : t;
}
