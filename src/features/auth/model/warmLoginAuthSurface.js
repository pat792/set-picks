/**
 * Post-paint warm for `/login` (#850 / #857).
 *
 * SPA practice: Auth SDK ready before Continue with Google so Safari keeps the
 * user gesture for `signInWithPopup`. App Check warms in parallel (not awaited).
 * Dashboard/setup chunks prefetch so post-auth navigation is not a cold download.
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
let warmPathUsed = 'idle';
/** @type {Promise<void> | null} */
let readyPromise = null;

/**
 * Idempotent warm after `/login` form paint (or Google button intent).
 * @param {{ warmPath?: 'immediate' | 'idle' | 'intent' }} [opts]
 * @returns {Promise<void>}
 */
export function warmLoginAuthSurface(opts = {}) {
  if (!warmed) {
    warmed = true;
    warmPathUsed = opts.warmPath || 'idle';
    readyPromise = (async () => {
      try {
        await ensureFirebase().then(() => {
          requestAuthBoot();
        });
        kickAppCheckWarm();
        await Promise.all([
          import('../api/splashAuthApi'),
          import('./completeGoogleSplashAuth'),
        ]);
        reportLoginAuthSurfaceReady({ warmPath: warmPathUsed });
      } catch {
        // Best-effort warm + telemetry — CTAs still call ensureAuthReady.
      }
    })();
    prefetchRouteChunk(['dashboard', 'setup']);
  }
  return readyPromise || Promise.resolve();
}
