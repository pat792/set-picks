/**
 * @param {unknown} body
 * @returns {object | null}
 */
export function selectPickRecommendations(body) {
  if (!body || typeof body !== 'object') return null;
  const rec = /** @type {Record<string, unknown>} */ (body);
  if (typeof rec.modelVersion !== 'string' || !rec.modelVersion.trim()) {
    return null;
  }
  if (!rec.targetShow || typeof rec.targetShow !== 'object') return null;
  const date = /** @type {Record<string, unknown>} */ (rec.targetShow).date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  if (!rec.slots || typeof rec.slots !== 'object') return null;
  return /** @type {object} */ (body);
}
