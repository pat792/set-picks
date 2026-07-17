/**
 * Client-side feature spotlight catalog (#639).
 * Soft “New” markers; dismissals persist in localStorage (per uid).
 */

/**
 * @typedef {{
 *   id: string,
 *   since: string,
 *   until: string,
 *   surfaces: string[],
 *   path: string,
 * }} FeatureSpotlight
 */

/** @type {readonly FeatureSpotlight[]} */
export const FEATURE_SPOTLIGHTS = Object.freeze([
  {
    id: 'tour-stats',
    since: '2026-06-01',
    until: '2026-08-31',
    surfaces: ['standings-stats-tab'],
    path: '/dashboard/tour-stats',
  },
  {
    id: 'live-setlist',
    since: '2026-06-01',
    until: '2026-08-31',
    surfaces: ['standings-setlist-card'],
    path: '/dashboard/standings',
  },
  {
    id: 'profile-identity',
    since: '2026-06-01',
    until: '2026-08-31',
    surfaces: ['profile-avatar', 'profile-badges'],
    path: '/dashboard/profile',
  },
]);

const BY_ID = new Map(FEATURE_SPOTLIGHTS.map((s) => [s.id, s]));

/**
 * @param {string} featureId
 * @returns {FeatureSpotlight | null}
 */
export function getFeatureSpotlight(featureId) {
  return BY_ID.get(featureId) || null;
}

/**
 * Calendar date YYYY-MM-DD in local time (for since/until window).
 * @param {Date} [now]
 * @returns {string}
 */
export function localYmd(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * True when today is within [since, until] inclusive.
 * @param {FeatureSpotlight} spot
 * @param {string} [todayYmd]
 */
export function isSpotlightInWindow(spot, todayYmd = localYmd()) {
  if (!spot?.since || !spot?.until) return false;
  return todayYmd >= spot.since && todayYmd <= spot.until;
}

/**
 * @param {string} uid
 * @param {string} featureId
 */
export function spotlightStorageKey(uid, featureId) {
  return `set-picks-feature-spotlight:${uid}:${featureId}`;
}

/**
 * @param {string | null | undefined} uid
 * @param {string} featureId
 */
export function readSpotlightSeen(uid, featureId) {
  if (!uid || typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(spotlightStorageKey(uid, featureId)) === '1';
  } catch {
    return true;
  }
}

/**
 * @param {string | null | undefined} uid
 * @param {string} featureId
 */
export function writeSpotlightSeen(uid, featureId) {
  if (!uid || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(spotlightStorageKey(uid, featureId), '1');
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Whether the spotlight should show (in window, not seen, signed-in).
 * @param {string} featureId
 * @param {{ uid?: string | null, todayYmd?: string }} [opts]
 */
export function isSpotlightActive(featureId, opts = {}) {
  const { uid = null, todayYmd = localYmd() } = opts;
  if (!uid) return false;
  const spot = getFeatureSpotlight(featureId);
  if (!spot || !isSpotlightInWindow(spot, todayYmd)) return false;
  return !readSpotlightSeen(uid, featureId);
}
