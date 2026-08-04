/**
 * Lazy Firebase singleton for app boot (#835 login interaction auth).
 *
 * Keeps `firebase.js` / firebase-core off the `main.jsx` static graph so anon
 * `/login` can paint the form before Auth/App Check download. Call
 * {@link ensureAuthReady} from Google / email CTAs (and redirect completion).
 */

/** @type {Promise<{ app: import('firebase/app').FirebaseApp, auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore }> | null} */
let firebasePromise = null;

let authBootRequested = false;
/** @type {Array<() => void>} */
const authBootWaiters = [];

/**
 * Dynamic-import the Firebase app/auth/firestore singletons once.
 * @returns {Promise<{ app: import('firebase/app').FirebaseApp, auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore }>}
 */
export function ensureFirebase() {
  if (!firebasePromise) {
    firebasePromise = import('./firebase.js').then((m) => ({
      app: m.app,
      auth: m.auth,
      db: m.db,
    }));
  }
  return firebasePromise;
}

/**
 * Signal AuthProvider to start onAuthStateChanged (anon `/login` deferred path).
 */
export function requestAuthBoot() {
  authBootRequested = true;
  while (authBootWaiters.length) {
    const resolve = authBootWaiters.shift();
    try {
      resolve();
    } catch {
      // ignore
    }
  }
}

/**
 * Resolves when {@link requestAuthBoot} / {@link ensureAuthReady} has been called.
 * Eager boot paths should call {@link requestAuthBoot} immediately.
 * @returns {Promise<void>}
 */
export function waitForAuthBootRequest() {
  if (authBootRequested) return Promise.resolve();
  return new Promise((resolve) => {
    authBootWaiters.push(resolve);
  });
}

/**
 * Load Firebase + warm App Check and wake AuthProvider.
 * Call at the start of Google / email sign-in/up (and Google redirect return).
 * @returns {Promise<{ app: import('firebase/app').FirebaseApp, auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore }>}
 */
export async function ensureAuthReady() {
  requestAuthBoot();
  const fb = await ensureFirebase();
  const { ensureAppCheckNow } = await import('./firebaseAppCheck.js');
  await ensureAppCheckNow();
  return fb;
}

/**
 * Anon `/login` should paint the form without downloading firebase-core.
 * Eager when session hint, Google redirect intent, or any non-login path.
 *
 * @param {string} [pathname]
 * @param {{ hasSession?: boolean, hasRedirectIntent?: boolean }} [opts]
 * @returns {boolean}
 */
export function shouldDeferFirebaseBoot(pathname, opts = {}) {
  if (typeof pathname !== 'string' || pathname !== '/login') return false;
  if (opts.hasSession) return false;
  if (opts.hasRedirectIntent) return false;
  return true;
}
