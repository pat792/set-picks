import { getFunctions, httpsCallable } from 'firebase/functions';

import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

/**
 * Callable wrapper around `deletePoolWithCleanup` (issue #138). The server
 * is the source of truth for eligibility:
 *   - `permission-denied` → caller is not the pool owner.
 *   - `failed-precondition` → pool has qualifying pick history; UI should
 *     suggest archive instead.
 *   - `not-found` → pool doc does not exist.
 *   - `unauthenticated` → caller is signed out.
 *   - `invalid-argument` → missing / bad `poolId`.
 *
 * The Firebase Functions SDK surfaces these as either the bare `code` (e.g.
 * `"failed-precondition"`) or a namespaced `"functions/<code>"`. We
 * normalize to a stable set of string codes on the error so the orchestrator
 * (`usePoolAdminControls`) can render the right message without depending on
 * the SDK's exact code shape.
 *
 * @param {string} poolId
 * @returns {Promise<{ ok: boolean, poolId: string, memberUpdates: number }>}
 */
export async function deletePoolWithCleanup(poolId) {
  const value = typeof poolId === 'string' ? poolId.trim() : '';
  if (!value) throw new Error('Missing pool id.');

  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'deletePoolWithCleanup');
  try {
    const result = await callable({ poolId: value });
    const data = /** @type {any} */ (result?.data ?? {});
    return {
      ok: data.ok === true,
      poolId: typeof data.poolId === 'string' ? data.poolId : value,
      memberUpdates:
        typeof data.memberUpdates === 'number' ? data.memberUpdates : 0,
    };
  } catch (e) {
    throw normalizeCallableError(e);
  }
}

/**
 * @param {unknown} e
 * @returns {Error & { code?: string }}
 */
function normalizeCallableError(e) {
  const rawMessage =
    e instanceof Error ? e.message : 'Could not delete this pool.';
  const rawCode =
    e && typeof e === 'object' && 'code' in e
      ? String(/** @type {any} */ (e).code)
      : '';
  const code = rawCode.includes('/') ? rawCode.split('/').pop() : rawCode;

  /** @type {Error & { code?: string }} */
  const err = new Error(rawMessage);
  if (code === 'failed-precondition') {
    err.code = 'pool-has-activity';
  } else if (code === 'permission-denied') {
    err.code = 'permission-denied';
  } else if (code === 'not-found') {
    err.code = 'pool-not-found';
  } else if (code === 'unauthenticated') {
    err.code = 'unauthenticated';
  } else if (code === 'invalid-argument') {
    err.code = 'invalid-argument';
  } else {
    err.code = code || 'unknown';
  }
  return err;
}
