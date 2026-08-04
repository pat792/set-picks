/**
 * Public tour-stats fetch without Firebase / App Check (#832 / #827).
 * Reads CDN-cached Vercel API that proxies `public_tour_stats` via Admin SDK.
 */

const FETCH_TIMEOUT_MS = 12_000;

/**
 * @param {string} slug `_index` or tour slug
 * @returns {Promise<Record<string, unknown>>}
 */
async function fetchPublicTourStatsJson(slug) {
  const safe = String(slug ?? '').trim() || '_index';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `/api/public-tour-stats?slug=${encodeURIComponent(safe)}`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
    );
    if (!res.ok) {
      throw new Error(`Tour stats unavailable (${res.status})`);
    }
    return await res.json();
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Tour stats timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {Promise<{
 *   tours: Array<Record<string, unknown>>,
 *   defaultTourSlug: string,
 * }>}
 */
export async function fetchPublicTourStatsIndexHttp() {
  const data = await fetchPublicTourStatsJson('_index');
  const tours = Array.isArray(data.tours) ? data.tours : [];
  const defaultTourSlug =
    typeof data.defaultTourSlug === 'string' && data.defaultTourSlug
      ? data.defaultTourSlug
      : tours[0]?.tourSlug || '';
  return { tours, defaultTourSlug };
}

/**
 * @param {string} tourSlug
 * @returns {Promise<null | Record<string, unknown>>}
 */
export async function fetchPublicTourStatsDocHttp(tourSlug) {
  const slug = String(tourSlug ?? '').trim();
  if (!slug || slug.startsWith('_')) return null;
  const data = await fetchPublicTourStatsJson(slug);
  if (!data || data.notFound) return null;
  return { id: slug, ...data };
}
