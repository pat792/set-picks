import { firebaseStorageBucket } from './firebase';

/**
 * Anonymous Firebase Storage media URL for a public object.
 * Used when `getDownloadURL()` cannot run (App Check on preview hosts).
 *
 * @param {string} objectPath
 * @returns {string | null}
 */
export function firebaseStorageMediaUrl(objectPath) {
  const bucket = typeof firebaseStorageBucket === 'string' ? firebaseStorageBucket.trim() : '';
  const path = typeof objectPath === 'string' ? objectPath.trim() : '';
  if (!bucket || !path) return null;
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}
