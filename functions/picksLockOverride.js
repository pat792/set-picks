/**
 * Admin one-click picks lock (#522). Writes `show_lock_state/{showDate}` only —
 * no setlist/scoring side effects.
 */

const SHOW_LOCK_STATE_COLLECTION = "show_lock_state";
const LOCK_REASON_ADMIN = "admin_override";

/**
 * @param {unknown} showDate
 * @returns {boolean}
 */
function isAdminPicksLockOverrideDoc(data) {
  if (!data || typeof data !== "object") return false;
  return data.lockReason === LOCK_REASON_ADMIN && data.picksLockedAt != null;
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   showDate: string,
 *   lockedBy?: string | null,
 *   logger?: { info?: (...args: unknown[]) => void },
 * }} opts
 * @returns {Promise<{ ok: true, showDate: string, alreadyLocked: boolean }>}
 */
async function applyLockPicksForShowNow({ db, admin, showDate, lockedBy = null, logger }) {
  const ref = db.collection(SHOW_LOCK_STATE_COLLECTION).doc(showDate);
  const existing = await ref.get();
  if (existing.exists && isAdminPicksLockOverrideDoc(existing.data())) {
    return { ok: true, showDate, alreadyLocked: true };
  }

  await ref.set(
    {
      showDate,
      picksLockedAt: admin.firestore.FieldValue.serverTimestamp(),
      lockReason: LOCK_REASON_ADMIN,
      lockedBy: lockedBy ?? null,
    },
    { merge: true }
  );

  logger?.info?.("lockPicksForShowNow", { showDate, lockedBy, alreadyLocked: false });
  return { ok: true, showDate, alreadyLocked: false };
}

module.exports = {
  SHOW_LOCK_STATE_COLLECTION,
  LOCK_REASON_ADMIN,
  isAdminPicksLockOverrideDoc,
  applyLockPicksForShowNow,
};
