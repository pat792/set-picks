import { app } from './firebase';

// `firebase/storage` is lazy-imported on first use so it stays out of the
// splash + dashboard boot critical path. Callers use `loadFirebaseStorage()`
// to get both the `storage` singleton and any SDK functions (`ref`,
// `getDownloadURL`, etc.) they need — avoids a static top-level
// `import 'firebase/storage'` anywhere in app code (issue #242).
let modulePromise = null;

export function loadFirebaseStorage() {
  if (!modulePromise) {
    modulePromise = import('firebase/storage').then((mod) => ({
      ...mod,
      storage: mod.getStorage(app),
    }));
  }
  return modulePromise;
}

/**
 * Convenience wrapper when callers only need the `storage` singleton.
 * Prefer `loadFirebaseStorage()` when you also need `ref` / `getDownloadURL`
 * — a single await gives you everything in one chunk.
 */
export async function getFirebaseStorage() {
  const { storage } = await loadFirebaseStorage();
  return storage;
}
