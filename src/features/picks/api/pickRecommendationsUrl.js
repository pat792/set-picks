import { firebaseStorageMediaUrl } from '../../../shared/lib/firebaseStorageMediaUrl.js';
import { loadFirebaseStorage } from '../../../shared/lib/firebaseStorage.js';

const REC_OBJECT_PATH = 'pick-recommendations.json';

function uniqueUrls(...urls) {
  return [
    ...new Set(
      urls
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter(Boolean),
    ),
  ];
}

/**
 * Resolves URL candidates used to `fetch()` pick-recommendations JSON (#650).
 *
 * - **`VITE_PICK_RECOMMENDATIONS_URL`:** used as-is (CDN override).
 * - **Default:** Firebase `getDownloadURL()` for `pick-recommendations.json`,
 *   then the anonymous `alt=media` URL when App Check blocks the SDK
 *   (Vercel preview hosts) or the tokenized download returns 402.
 *
 * @returns {Promise<string[]>}
 */
export async function resolvePickRecommendationsFetchUrls() {
  const explicit = import.meta.env.VITE_PICK_RECOMMENDATIONS_URL;
  if (typeof explicit === 'string' && explicit.trim()) {
    return [explicit.trim()];
  }
  const fallback = firebaseStorageMediaUrl(REC_OBJECT_PATH);
  try {
    const { storage, ref, getDownloadURL } = await loadFirebaseStorage();
    const r = ref(storage, REC_OBJECT_PATH);
    return uniqueUrls(await getDownloadURL(r), fallback);
  } catch (err) {
    if (fallback) return [fallback];
    throw err;
  }
}

export { REC_OBJECT_PATH };
