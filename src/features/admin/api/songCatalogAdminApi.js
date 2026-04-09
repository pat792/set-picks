import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

/**
 * Admin-only: upload `song-catalog.json` to Cloud Storage from Phish.net v5 `songs.json` (issue #158).
 * @returns {Promise<{ ok?: boolean, songCount?: number }>}
 */
export async function refreshPhishnetSongCatalog() {
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'refreshPhishnetSongCatalog');
  const result = await callable({});
  return result.data;
}
