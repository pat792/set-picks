import { app } from './firebase';

const APP_CHECK_SITE_KEY = '6LdmOKAsAAAAACN1guy_JoAMDhjN6eljCiLLyMSJ';

// App Check (and the ReCaptcha Enterprise runtime it pulls in) is the single
// heaviest eager Firebase dependency. We dynamically import it after React
// has handed the main thread back, so it never blocks first paint.
// `whenFirebaseReady()` lets the earliest-path Firestore callers gate their
// first read on App Check init so prod enforcement doesn't race with boot.
// (issue #242)
// Dashboard / email deep links can call `ensureAppCheckNow()` (#535) to skip
// the idle wait without double-initializing.

let readyPromise = null;
/** @type {null | (() => void)} */
let cancelDeferredStart = null;

/** Registered in Firebase Console → App Check → debug tokens (see docs/TESTING.md). */
const DEV_APPCHECK_DEBUG_TOKEN = '38422efd-029f-45b4-b028-7cf7fcaeeffc';

function runInitialization() {
  if (import.meta.env.DEV && typeof self !== 'undefined') {
    // Use the registered UUID directly — `true` mints a random token that 403s until
    // manually added to the Console and seeded in IndexedDB.
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = DEV_APPCHECK_DEBUG_TOKEN;
  }
  return import('firebase/app-check').then(
    ({ initializeAppCheck, ReCaptchaEnterpriseProvider }) =>
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      })
  );
}

/**
 * Kick off App Check initialization on a background tick so it doesn't
 * contend with React hydration. Safe to call multiple times; the actual
 * init runs once.
 */
export function initializeAppCheckDeferred() {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve, reject) => {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      cancelDeferredStart = null;
      runInitialization().then(resolve, reject);
    };
    // `requestIdleCallback` yields to paint + interaction before running.
    // Fall back to `setTimeout(0)` on Safari / tests / SSR.
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(start, { timeout: 2000 });
      cancelDeferredStart = () => {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleId);
        }
        start();
      };
    } else {
      const timeoutId = setTimeout(start, 0);
      cancelDeferredStart = () => {
        clearTimeout(timeoutId);
        start();
      };
    }
  });
  return readyPromise;
}

/**
 * Start App Check immediately — cancels any pending idle deferral (#535).
 * Safe to call after `initializeAppCheckDeferred`; shares one init promise.
 */
export function ensureAppCheckNow() {
  if (cancelDeferredStart) {
    cancelDeferredStart();
    return readyPromise;
  }
  if (readyPromise) return readyPromise;
  readyPromise = runInitialization();
  return readyPromise;
}

/**
 * Resolves once App Check init has completed. Always kicks deferred init if
 * nothing has started yet — never resolve early with a no-op promise, or
 * earliest Firestore reads race App Check enforcement.
 */
export function whenFirebaseReady() {
  return initializeAppCheckDeferred();
}
