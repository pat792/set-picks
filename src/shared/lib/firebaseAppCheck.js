import { app } from './firebase';

const APP_CHECK_SITE_KEY = '6LdmOKAsAAAAACN1guy_JoAMDhjN6eljCiLLyMSJ';

// App Check (and the ReCaptcha Enterprise runtime it pulls in) is the single
// heaviest eager Firebase dependency. We dynamically import it after React
// has handed the main thread back, so it never blocks first paint.
// `whenFirebaseReady()` lets the earliest-path Firestore callers gate their
// first read on App Check init so prod enforcement doesn't race with boot.
// (issue #242)

let readyPromise = null;

function runInitialization() {
  if (import.meta.env.DEV && typeof self !== 'undefined') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
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
    const start = () => {
      runInitialization().then(resolve, reject);
    };
    // `requestIdleCallback` yields to paint + interaction before running.
    // Fall back to `setTimeout(0)` on Safari / tests / SSR.
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(start, { timeout: 2000 });
    } else {
      setTimeout(start, 0);
    }
  });
  return readyPromise;
}

/**
 * Resolves once App Check init has completed (or immediately if init was
 * never kicked off, e.g. in SSR / test environments). Earliest-path
 * Firestore callers should `await whenFirebaseReady()` before their first
 * read to avoid racing App Check Enforcement in prod.
 */
export function whenFirebaseReady() {
  return readyPromise ?? Promise.resolve();
}
