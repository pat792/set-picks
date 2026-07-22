/**
 * Group artifact recommendations for Prediction Lab (#651).
 */

const BAND_ORDER = ['safe', 'slot_fit', 'long_shot'];

const BAND_LABELS = {
  safe: 'Safe',
  slot_fit: 'Slot fit',
  long_shot: 'Long shot',
};

const BAND_HINTS = {
  safe: 'Likely to play somewhere tonight',
  slot_fit: 'Historically common in this slot',
  long_shot: 'Long gap / bustout upside',
};

/**
 * @param {unknown} title
 * @returns {string}
 */
export function normalizePickTitle(title) {
  return String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Titles already selected in other slots (and optionally the active slot).
 * @param {Record<string, string>} formData
 * @param {string} [activeSlotId] — if set, still exclude this slot's current value
 *   so re-applying the same song is fine but cross-slot dupes are filtered.
 * @returns {Set<string>}
 */
export function selectedTitleKeys(formData, activeSlotId) {
  /** @type {Set<string>} */
  const keys = new Set();
  if (!formData || typeof formData !== 'object') return keys;
  for (const [slot, value] of Object.entries(formData)) {
    if (slot === activeSlotId) continue;
    const k = normalizePickTitle(value);
    if (k) keys.add(k);
  }
  return keys;
}

/**
 * @param {Array<{ name?: string, normalizedName?: string, riskBand?: string, rank?: number }> | null | undefined} rows
 * @param {Set<string>} excludeKeys
 * @returns {{ band: string, label: string, hint: string, items: object[] }[]}
 */
export function groupRecommendationsByRiskBand(rows, excludeKeys = new Set()) {
  /** @type {Record<string, object[]>} */
  const buckets = { safe: [], slot_fit: [], long_shot: [] };
  if (!Array.isArray(rows)) {
    return BAND_ORDER.map((band) => ({
      band,
      label: BAND_LABELS[band],
      hint: BAND_HINTS[band],
      items: [],
    }));
  }

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const key =
      normalizePickTitle(row.normalizedName) ||
      normalizePickTitle(row.name);
    if (!key || excludeKeys.has(key)) continue;
    // Only Lab bands — skip unbanded / unknown residuals.
    if (
      row.riskBand !== 'safe' &&
      row.riskBand !== 'long_shot' &&
      row.riskBand !== 'slot_fit'
    ) {
      continue;
    }
    buckets[row.riskBand].push(row);
  }

  for (const band of BAND_ORDER) {
    buckets[band].sort(
      (a, b) => (Number(a.rank) || 99) - (Number(b.rank) || 99),
    );
  }

  return BAND_ORDER.map((band) => ({
    band,
    label: BAND_LABELS[band],
    hint: BAND_HINTS[band],
    items: buckets[band],
  }));
}

export { BAND_HINTS, BAND_LABELS, BAND_ORDER };
