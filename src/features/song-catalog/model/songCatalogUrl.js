import { firebaseStorageMediaUrl } from '../../../shared/lib/firebaseStorageMediaUrl.js';
import { loadFirebaseStorage } from '../../../shared/lib/firebaseStorage.js';

const CATALOG_OBJECT_PATH = 'song-catalog.json';

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
 * Resolves URL candidates used to `fetch()` the catalog JSON.
 *
 * - **`VITE_SONG_CATALOG_URL`:** used as-is (e.g. your own CDN). Must allow anonymous GET + CORS.
 * - **Default:** Firebase `getDownloadURL()` for `song-catalog.json` — honors **Storage rules**
 *   (`allow read: if true` on that path) without making the bucket public on IAM. Plain
 *   `https://storage.googleapis.com/<bucket>/song-catalog.json` **does not** use Firebase rules
 *   and returns **AccessDenied** unless you grant `allUsers` objectViewer on GCS.
 *   Always appends the anonymous `alt=media` URL so Last/Gap/Total stay on the
 *   live catalog when App Check blocks the SDK (Vercel preview) or the
 *   tokenized download returns 402.
 *
 * @returns {Promise<string[]>}
 */
export async function resolveSongCatalogFetchUrls() {
  const explicit = import.meta.env.VITE_SONG_CATALOG_URL;
  if (typeof explicit === 'string' && explicit.trim()) {
    return [explicit.trim()];
  }
  const fallback = firebaseStorageMediaUrl(CATALOG_OBJECT_PATH);
  try {
    const { storage, ref, getDownloadURL } = await loadFirebaseStorage();
    const r = ref(storage, CATALOG_OBJECT_PATH);
    return uniqueUrls(await getDownloadURL(r), fallback);
  } catch (err) {
    if (fallback) return [fallback];
    throw err;
  }
}

export { CATALOG_OBJECT_PATH };
