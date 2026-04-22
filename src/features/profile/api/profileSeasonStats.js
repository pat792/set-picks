import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

/**
 * @typedef {Object} UserSeasonStats
 * @property {number} totalPoints   Sum of graded pick scores (this user only).
 * @property {number} shows         Number of finalized shows the user played.
 * @property {number} wins          Shows this user won overall (global max
 *                                  among every graded pick for that show).
 */

/** @type {UserSeasonStats} */
export const EMPTY_USER_SEASON_STATS = Object.freeze({
  totalPoints: 0,
  shows: 0,
  wins: 0,
});

function hasNonEmptyPicksObject(picks) {
  if (picks == null || typeof picks !== 'object' || Array.isArray(picks)) {
    return false;
  }
  return Object.values(picks).some(
    (v) => v != null && String(v).trim() !== ''
  );
}

function pickCountsTowardSeason(pickData) {
  if (!pickData || pickData.isGraded !== true) return false;
  return hasNonEmptyPicksObject(pickData.picks);
}

/**
 * Global max score among every graded, non-empty pick submitted for a single
 * show date. Returns `null` if nobody played the show. Mirrors the
 * "skip when max === 0" guard used by pool season totals so a night where
 * every player whiffed doesn't credit a tied "win" to everyone.
 *
 * @param {string} showDate
 * @returns {Promise<number | null>}
 */
async function fetchGlobalMaxScoreForShow(showDate) {
  const date = showDate?.trim?.();
  if (!date) return null;
  const snap = await getDocs(
    query(collection(db, 'picks'), where('showDate', '==', date))
  );
  let max = null;
  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    if (!pickCountsTowardSeason(data)) return;
    const score = typeof data.score === 'number' ? data.score : 0;
    if (max === null || score > max) max = score;
  });
  if (max === null || max <= 0) return null;
  return max;
}

/**
 * Season stats for a single user computed live from `picks`:
 *   - `totalPoints` / `shows` — sum of the user's own graded picks (picks
 *     aren't double-counted when they belong to multiple pools).
 *   - `wins` — shows won overall (global high score across every graded,
 *     non-empty pick for that show), not pool-scoped wins. Ties share the
 *     win, matching the per-pool leaderboard's tie rule.
 *
 * @param {string | undefined} uid
 * @param {Array<{ date: string }>} showDates
 * @returns {Promise<UserSeasonStats>}
 */
export async function computeUserSeasonStats(uid, showDates) {
  const id = uid?.trim();
  if (!id) return { ...EMPTY_USER_SEASON_STATS };
  if (!Array.isArray(showDates) || showDates.length === 0) {
    return { ...EMPTY_USER_SEASON_STATS };
  }

  const dates = showDates.map((s) => s.date).filter(Boolean);
  const chunkSize = 24;

  /** @type {Array<{ showDate: string, score: number }>} */
  const userGradedPicks = [];

  for (let i = 0; i < dates.length; i += chunkSize) {
    const slice = dates.slice(i, i + chunkSize);
    const snaps = await Promise.all(
      slice.map((date) => getDoc(doc(db, 'picks', `${date}_${id}`)))
    );
    for (let j = 0; j < slice.length; j += 1) {
      const snap = snaps[j];
      if (!snap.exists()) continue;
      const data = snap.data() || {};
      if (!pickCountsTowardSeason(data)) continue;
      const score = typeof data.score === 'number' ? data.score : 0;
      userGradedPicks.push({ showDate: slice[j], score });
    }
  }

  let totalPoints = 0;
  let shows = 0;
  for (const p of userGradedPicks) {
    totalPoints += p.score;
    shows += 1;
  }

  // Overall wins: count each show once where this user tied/beat the global
  // high score. Parallelize across shows the user actually played.
  let wins = 0;
  const winChunkSize = 10;
  for (let i = 0; i < userGradedPicks.length; i += winChunkSize) {
    const slice = userGradedPicks.slice(i, i + winChunkSize);
    const maxes = await Promise.all(
      slice.map((p) => fetchGlobalMaxScoreForShow(p.showDate))
    );
    for (let j = 0; j < slice.length; j += 1) {
      const max = maxes[j];
      if (max === null) continue;
      if (slice[j].score === max) wins += 1;
    }
  }

  return { totalPoints, shows, wins };
}
