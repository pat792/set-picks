/**
 * Decode Firestore REST API document payloads (no Admin SDK).
 * Used by SEO prerender (#928) against public-readable aggregates.
 */

/**
 * @param {unknown} value
 * @returns {unknown}
 */
export function decodeFirestoreRestValue(value) {
  if (!value || typeof value !== 'object') return null;
  const v = /** @type {Record<string, unknown>} */ (value);
  if (v.stringValue !== undefined) return String(v.stringValue);
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return Number(v.doubleValue);
  if (v.booleanValue !== undefined) return Boolean(v.booleanValue);
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue && typeof v.arrayValue === 'object') {
    const values = /** @type {{ values?: unknown[] }} */ (v.arrayValue).values;
    return Array.isArray(values) ? values.map(decodeFirestoreRestValue) : [];
  }
  if (v.mapValue && typeof v.mapValue === 'object') {
    const fields = /** @type {{ fields?: Record<string, unknown> }} */ (v.mapValue)
      .fields;
    /** @type {Record<string, unknown>} */
    const out = {};
    if (fields && typeof fields === 'object') {
      for (const [key, nested] of Object.entries(fields)) {
        out[key] = decodeFirestoreRestValue(nested);
      }
    }
    return out;
  }
  return null;
}

/**
 * @param {unknown} docJson
 * @returns {Record<string, unknown> | null}
 */
export function decodeFirestoreRestDocument(docJson) {
  if (!docJson || typeof docJson !== 'object') return null;
  const fields = /** @type {{ fields?: Record<string, unknown>, error?: unknown }} */ (
    docJson
  ).fields;
  if (!fields || typeof fields !== 'object') return null;
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, nested] of Object.entries(fields)) {
    out[key] = decodeFirestoreRestValue(nested);
  }
  return out;
}

/**
 * @param {string} projectId
 * @param {string} documentPath e.g. `public_tour_stats/2026-summer-tour`
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function fetchFirestoreRestDocument(
  projectId,
  documentPath,
  opts = {},
) {
  const path = String(documentPath || '')
    .split('/')
    .map((p) => encodeURIComponent(p))
    .join('/');
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${path}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: opts.signal,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(
      `Firestore REST ${res.status} for ${documentPath}: ${await res.text()}`,
    );
  }
  return decodeFirestoreRestDocument(await res.json());
}
