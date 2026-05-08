import { getFunctions, httpsCallable } from 'firebase/functions';

import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

/** Keep in sync with `DELETE_ACCOUNT_CONFIRMATION_PHRASE` in `functions/accountDelete.js`. */
export const DELETE_ACCOUNT_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

/**
 * Self-serve account deletion (callable `deleteAccountWithAudit`).
 *
 * @param {{ acknowledgedPermanentDeletion: boolean, confirmationPhrase: string }} params
 * @returns {Promise<{ ok: boolean, reportId: string, picksDeleted: number, poolsUpdated: number }>}
 */
export async function deleteAccountWithAudit(params) {
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'deleteAccountWithAudit');
  try {
    const result = await callable({
      acknowledgedPermanentDeletion: params.acknowledgedPermanentDeletion === true,
      confirmationPhrase:
        typeof params.confirmationPhrase === 'string' ? params.confirmationPhrase : '',
    });
    const data = /** @type {any} */ (result?.data ?? {});
    return {
      ok: data.ok === true,
      reportId: typeof data.reportId === 'string' ? data.reportId : '',
      picksDeleted: typeof data.picksDeleted === 'number' ? data.picksDeleted : 0,
      poolsUpdated: typeof data.poolsUpdated === 'number' ? data.poolsUpdated : 0,
    };
  } catch (e) {
    throw normalizeDeleteAccountError(e);
  }
}

/**
 * @param {unknown} e
 * @returns {Error & { code?: string }}
 */
function normalizeDeleteAccountError(e) {
  const rawMessage =
    e instanceof Error ? e.message : 'Could not delete your account. Try again.';
  const rawCode =
    e && typeof e === 'object' && 'code' in e
      ? String(/** @type {any} */ (e).code)
      : '';
  const code = rawCode.includes('/') ? rawCode.split('/').pop() : rawCode;

  /** @type {Error & { code?: string }} */
  const err = new Error(rawMessage);
  if (code === 'failed-precondition') {
    err.code = 'owns-pools';
  } else if (code === 'invalid-argument') {
    err.code = 'invalid-argument';
  } else if (code === 'unauthenticated') {
    err.code = 'unauthenticated';
  } else if (code === 'not-found') {
    err.code = 'not-found';
  } else if (code === 'internal') {
    err.code = 'internal';
  } else {
    err.code = code || 'unknown';
  }
  return err;
}
