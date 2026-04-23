import { loadFirebaseStorage } from '../../../shared/lib/firebaseStorage.js';

const CATALOG_OBJECT_PATH = 'song-catalog.json';

/**
 * Resolves the URL used to `fetch()` the catalog JSON.
 *
 * - **`VITE_SONG_CATALOG_URL`:** used as-is (e.g. your own CDN). Must allow anonymous GET + CORS.
 * - **Default:** Firebase `getDownloadURL()` for `song-catalog.json` — honors **Storage rules**
 *   (`allow read: if true` on that path) without making the bucket public on IAM. Plain
 *   `https://storage.googleapis.com/<bucket>/song-catalog.json` **does not** use Firebase rules
 *   and returns **AccessDenied** unless you grant `allUsers` objectViewer on GCS.
 *
 * @returns {Promise<string>}
 */
export async function resolveSongCatalogFetchUrl() {
  const explicit = import.meta.env.VITE_SONG_CATALOG_URL;
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim();
  }
  const { storage, ref, getDownloadURL } = await loadFirebaseStorage();
  const r = ref(storage, CATALOG_OBJECT_PATH);
  return getDownloadURL(r);
}
