/**
 * Lazy Firebase singleton for app boot (#835 / #850).
 *
 * Keeps `firebase.js` / firebase-core off the `main.jsx` static graph so anon
 * `/login` can paint the form first. Warm Auth after paint on `/login`; never
 * await App Check before `signInWithPopup` (Safari user-gesture — #850).
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
 * Kick App Check without blocking the caller (#850).
 * Firestore paths still await via {@link whenFirebaseReady}.
 */
export function kickAppCheckWarm() {
  void import('./firebaseAppCheck.js')
    .then((m) => m.ensureAppCheckNow())
    .catch(() => {
      // Best-effort warm; auth CTAs must not fail if Check lags.
    });
}

/**
 * Load Firebase Auth and wake AuthProvider.
 * Does **not** await App Check — required so Safari can open Google popup
 * inside the user gesture (#850). Call {@link kickAppCheckWarm} in parallel;
 * await Check only before Firestore writes/reads.
 *
 * @returns {Promise<{ app: import('firebase/app').FirebaseApp, auth: import('firebase/auth').Auth, db: import('firebase/firestore').Firestore }>}
 */
export async function ensureAuthReady() {
  requestAuthBoot();
  const fb = await ensureFirebase();
  kickAppCheckWarm();
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
