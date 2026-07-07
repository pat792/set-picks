import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../shared/lib/firebase';
import { isAdminPicksLockOverride } from '../../../shared/utils/timeLogic';

const SHOW_LOCK_STATE_COLLECTION = 'show_lock_state';

function assertShowDate(showDate) {
  const value = String(showDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('showDate must be YYYY-MM-DD.');
  }
  return value;
}

function normalizeLockState(data) {
  const isLocked = isAdminPicksLockOverride(data);
  return {
    isLocked,
    lockedBy: isLocked && typeof data?.lockedBy === 'string' ? data.lockedBy : null,
    picksLockedAt: isLocked ? data?.picksLockedAt ?? null : null,
  };
}

/**
 * @param {string} showDate
 * @returns {Promise<{ isLocked: boolean, lockedBy: string | null, picksLockedAt: unknown }>}
 */
export async function fetchShowLockState(showDate) {
  const value = assertShowDate(showDate);
  const snap = await getDoc(doc(db, SHOW_LOCK_STATE_COLLECTION, value));
  if (!snap.exists()) {
    return { isLocked: false, lockedBy: null, picksLockedAt: null };
  }
  return normalizeLockState(snap.data());
}

/**
 * Live listener for `show_lock_state/{showDate}` (#522).
 *
 * @param {string} showDate
 * @param {(state: { isLocked: boolean, lockedBy: string | null, picksLockedAt: unknown }) => void} onState
 * @param {(error: unknown) => void} [onError]
 * @returns {() => void}
 */
export function subscribeShowLockState(showDate, onState, onError) {
  const value = assertShowDate(showDate);
  return onSnapshot(
    doc(db, SHOW_LOCK_STATE_COLLECTION, value),
    (snap) => {
      onState(normalizeLockState(snap.exists() ? snap.data() : null));
    },
    (error) => {
      onState({ isLocked: false, lockedBy: null, picksLockedAt: null });
      onError?.(error);
    }
  );
}
