import { getFunctions, httpsCallable } from 'firebase/functions';

import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

/**
 * @typedef {{
 *   ok: boolean,
 *   hasEmail: boolean,
 *   suppressed: boolean,
 *   reason: string | null,
 *   canResubscribe: boolean,
 *   message: string | null,
 *   lifecycleEnabled: boolean,
 * }} CommsEmailStatus
 */

/**
 * @returns {Promise<CommsEmailStatus>}
 */
export async function fetchCommsEmailStatus() {
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'getCommsEmailStatus');
  const result = await callable({});
  const data = /** @type {Record<string, unknown>} */ (result?.data ?? {});
  return {
    ok: data.ok === true,
    hasEmail: data.hasEmail === true,
    suppressed: data.suppressed === true,
    reason: typeof data.reason === 'string' ? data.reason : null,
    canResubscribe: data.canResubscribe === true,
    message: typeof data.message === 'string' ? data.message : null,
    lifecycleEnabled: data.lifecycleEnabled !== false,
  };
}

/**
 * @returns {Promise<{ ok: boolean }>}
 */
export async function unsubscribeCommsEmail() {
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'unsubscribeCommsEmail');
  const result = await callable({});
  const data = /** @type {Record<string, unknown>} */ (result?.data ?? {});
  return { ok: data.ok === true };
}

/**
 * @returns {Promise<{ ok: boolean }>}
 */
export async function resubscribeCommsEmail() {
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'resubscribeCommsEmail');
  const result = await callable({});
  const data = /** @type {Record<string, unknown>} */ (result?.data ?? {});
  return { ok: data.ok === true };
}
