import { loadFirebaseStorage } from '../../../shared/lib/firebaseStorage.js';

const REC_OBJECT_PATH = 'pick-recommendations.json';

/**
 * Resolves the URL used to `fetch()` pick-recommendations JSON (#650).
 *
 * - **`VITE_PICK_RECOMMENDATIONS_URL`:** used as-is (CDN override).
 * - **Default:** Firebase `getDownloadURL()` for `pick-recommendations.json`.
 *
 * @returns {Promise<string>}
 */
export async function resolvePickRecommendationsFetchUrl() {
  const explicit = import.meta.env.VITE_PICK_RECOMMENDATIONS_URL;
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim();
  }
  const { storage, ref, getDownloadURL } = await loadFirebaseStorage();
  const r = ref(storage, REC_OBJECT_PATH);
  return getDownloadURL(r);
}

export { REC_OBJECT_PATH };
