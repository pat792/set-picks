/**
 * Fetch the first URL that returns JSON. Used for Storage objects that have
 * a tokenized `getDownloadURL` plus a public `alt=media` fallback.
 *
 * @param {Array<string | null | undefined>} urls
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<unknown>}
 */
export async function fetchFirstOkJson(urls, options = {}) {
  const unique = [
    ...new Set(
      (Array.isArray(urls) ? urls : [])
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter(Boolean),
    ),
  ];
  if (unique.length === 0) {
    throw new Error('No URL to fetch.');
  }

  let lastError = /** @type {Error | null} */ (null);
  for (const url of unique) {
    try {
      const res = await fetch(url, {
        signal: options.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      if (options.signal?.aborted) throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('No URL to fetch.');
}
