import { joinPoolByInviteCode } from '../api/joinPool';

/**
 * Single in-flight join request shared across surfaces (#731).
 *
 * The invite route can start the join the moment auth resolves, while the
 * dashboard chunk is still downloading; whichever surface owns the UX
 * afterwards (`usePendingPoolJoin`) awaits the same promise instead of firing a
 * second write. Keyed by user + code so a different account or a different
 * invite always starts fresh.
 *
 * @type {{ key: string, promise: Promise<{ outcome: string, poolId?: string }> } | null}
 */
let inFlight = null;

/**
 * @param {string} userId
 * @param {string} inviteCode
 * @returns {string}
 */
export function pendingPoolJoinKey(userId, inviteCode) {
  return `${userId}:${inviteCode}`;
}

/**
 * Start (or adopt) the join for this user + code.
 *
 * @param {{ userId: string, inviteCode: string, showDates?: Array<string | { date?: string }> }} params
 * @returns {Promise<{ outcome: string, poolId?: string }>}
 */
export function runPendingPoolJoin({ userId, inviteCode, showDates }) {
  const key = pendingPoolJoinKey(userId, inviteCode);
  if (inFlight?.key === key) return inFlight.promise;

  const promise = joinPoolByInviteCode({ userId, inviteCode, showDates });
  inFlight = { key, promise };
  // The early starter never awaits — swallow here so a rejection cannot surface
  // as an unhandled promise. Real consumers still see it via their own await.
  promise.catch(() => {});
  return promise;
}

/**
 * @param {string} userId
 * @param {string} inviteCode
 * @returns {boolean}
 */
export function isPendingPoolJoinRunning(userId, inviteCode) {
  return inFlight?.key === pendingPoolJoinKey(userId, inviteCode);
}

/** Drop the memoized run so a retry issues a fresh request. */
export function clearPendingPoolJoinRun() {
  inFlight = null;
}
