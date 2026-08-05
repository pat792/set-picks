/**
 * Post-paint warm for `/login` (#850 / #858).
 *
 * Tier 0: start immediately after form paint; warm Auth + every module the
 * Google click path needs; hold a ready surface so Continue with Google stays
 * disabled until `signInWithPopup` can run with no chunk awaits. App Check
 * warms in parallel (not awaited). Dashboard/setup chunks prefetch for
 * post-auth nav.
 *
 * #857: when Auth + click-path modules resolve, emit `auth_surface_timing`.
 */

import {
  ensureFirebase,
  kickAppCheckWarm,
  requestAuthBoot,
} from '../../../shared/lib/ensureFirebase';
import { prefetchRouteChunk } from '../../../shared/lib/routeChunkPrefetch';
import { reportLoginAuthSurfaceReady } from './authLoginTiming';

let warmed = false;
/** @type {'immediate' | 'idle' | 'intent'} */
let warmPathUsed = 'immediate';
/** @type {Promise<void> | null} */
let readyPromise = null;
let ready = false;
/**
 * Cached Auth + click-path modules for sync Google CTA (#858).
 * @type {{
 *   auth: import('firebase/auth').Auth,
 *   signInWithGoogle: typeof import('../api/splashAuthApi').signInWithGoogle,
 *   startGoogleSignInRedirect: typeof import('../api/splashAuthApi').startGoogleSignInRedirect,
 *   completeGoogleSplashAuth: typeof import('./completeGoogleSplashAuth').completeGoogleSplashAuth,
 * } | null}
 */
let surface = null;
/** @type {Set<(isReady: boolean) => void>} */
const readyListeners = new Set();

function notifyReady() {
  for (const cb of readyListeners) {
    try {
      cb(true);
    } catch {
      // ignore subscriber errors
    }
  }
}

/**
 * @returns {boolean}
 */
export function isLoginAuthSurfaceReady() {
  return ready;
}

/**
 * Sync Google click path when warm succeeded. Null if still warming or warm failed.
 * @returns {typeof surface}
 */
export function getLoginAuthSurface() {
  return surface;
}

/**
 * Subscribe to Auth-surface ready (Google CTA gate).
 * @param {(isReady: boolean) => void} cb
 * @returns {() => void}
 */
export function subscribeLoginAuthSurfaceReady(cb) {
  readyListeners.add(cb);
  if (ready) {
    try {
      cb(true);
    } catch {
      // ignore
    }
  }
  return () => {
    readyListeners.delete(cb);
  };
}

/**
 * Idempotent warm after `/login` form paint (or Google button intent).
 * @param {{ warmPath?: 'immediate' | 'idle' | 'intent' }} [opts]
 * @returns {Promise<void>}
 */
export function warmLoginAuthSurface(opts = {}) {
  if (!warmed) {
    warmed = true;
    warmPathUsed = opts.warmPath || 'immediate';
    readyPromise = (async () => {
      try {
        const fb = await ensureFirebase();
        requestAuthBoot();
        kickAppCheckWarm();
        const [api, completeMod] = await Promise.all([
          import('../api/splashAuthApi'),
          import('./completeGoogleSplashAuth'),
        ]);
        api.warmGoogleProvider();
        surface = {
          auth: fb.auth,
          signInWithGoogle: api.signInWithGoogle,
          startGoogleSignInRedirect: api.startGoogleSignInRedirect,
          completeGoogleSplashAuth: completeMod.completeGoogleSplashAuth,
        };
        ready = true;
        reportLoginAuthSurfaceReady({ warmPath: warmPathUsed });
        notifyReady();
      } catch {
        // Warm failed — enable CTA with click-path fallback (ensureAuthReady)
        // rather than leave Google permanently disabled.
        ready = true;
        surface = null;
        reportLoginAuthSurfaceReady({ warmPath: warmPathUsed });
        notifyReady();
      }
    })();
    prefetchRouteChunk(['dashboard', 'setup']);
  }
  return readyPromise || Promise.resolve();
}

/** @visibleForTesting */
export function resetLoginAuthSurfaceForTests() {
  warmed = false;
  warmPathUsed = 'immediate';
  readyPromise = null;
  ready = false;
  surface = null;
  readyListeners.clear();
}
