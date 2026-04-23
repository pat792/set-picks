import { doc, getDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import { pickCountsTowardSeason } from '../../../shared/utils/showAggregation';
import { fetchGlobalMaxScoreForShow } from '../../scoring';

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

/**
 * Season stats for a single user computed live from `picks`:
 *   - `totalPoints` / `shows` — sum of the user's own graded picks (picks
 *     aren't double-counted when they belong to multiple pools).
 *   - `wins` — shows won overall (global high score across every graded,
 *     non-empty pick for that show), not pool-scoped wins. Ties share the
 *     win, matching the per-pool leaderboard's tie rule and the shared
 *     `reduceShowWinners` rule used by Standings (#218) and Tour standings
 *     (#219).
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
  // high score. Parallelize across shows the user actually played. The
  // global-max fetch lives in `features/scoring` so the Standings "winner of
  // the night" surface (#218) uses identical math.
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
