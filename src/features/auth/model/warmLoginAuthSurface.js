/**
 * Post-paint warm for `/login` (#850).
 *
 * SPA practice: Auth SDK ready before Continue with Google so Safari keeps the
 * user gesture for `signInWithPopup`. App Check warms in parallel (not awaited).
 * Dashboard/setup chunks prefetch so post-auth navigation is not a cold download.
 */

import {
  ensureFirebase,
  kickAppCheckWarm,
  requestAuthBoot,
} from '../../../shared/lib/ensureFirebase';
import { prefetchRouteChunk } from '../../../shared/lib/routeChunkPrefetch';

let warmed = false;

/**
 * Idempotent warm after `/login` form paint (or Google button intent).
 */
export function warmLoginAuthSurface() {
  if (warmed) return;
  warmed = true;

  void ensureFirebase().then(() => {
    requestAuthBoot();
  });
  kickAppCheckWarm();
  void import('../api/splashAuthApi');
  prefetchRouteChunk(['dashboard', 'setup']);
}
