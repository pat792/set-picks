import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

function assertShowDate(showDate) {
  const value = String(showDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('showDate must be YYYY-MM-DD.');
  }
  return value;
}

/**
 * Admin-only: stamp `show_lock_state/{showDate}` with `lockReason: admin_override`.
 *
 * @param {{ showDate: string }} opts
 * @returns {Promise<{ ok: true, showDate: string, alreadyLocked: boolean }>}
 */
export async function lockPicksForShowNow({ showDate } = {}) {
  const value = assertShowDate(showDate);
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'lockPicksForShowNow');
  const result = await callable({ showDate: value });
  const data = result?.data ?? {};
  return {
    ok: data.ok === true,
    showDate: typeof data.showDate === 'string' ? data.showDate : value,
    alreadyLocked: data.alreadyLocked === true,
  };
}
