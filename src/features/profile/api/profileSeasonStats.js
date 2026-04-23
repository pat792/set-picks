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

/**
 * Per-invocation read-cost counters for the live profile season stats
 * pipeline. Surfaced so `useUserSeasonStats` (and the `#220` telemetry
 * wrapper) can report Firestore reads per profile view without needing to
 * re-instrument internals.
 *
 * @typedef {Object} UserSeasonStatsTelemetry
 * @property {number} showsChecked       Calendar size = point reads performed.
 * @property {number} showsPlayed        Graded non-empty picks for this user.
 * @property {number} collectionQueries  `picks where showDate == X` queries
 *                                       issued during the Wins pass.
 */

/** @type {UserSeasonStats} */
export const EMPTY_USER_SEASON_STATS = Object.freeze({
  totalPoints: 0,
  shows: 0,
  wins: 0,
});

/** @type {UserSeasonStatsTelemetry} */
export const EMPTY_USER_SEASON_STATS_TELEMETRY = Object.freeze({
  showsChecked: 0,
  showsPlayed: 0,
  collectionQueries: 0,
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
 * Also reports per-invocation read-cost counters via the optional
 * `onTelemetry` callback so `useUserSeasonStats` can ship the #220
 * observability event without re-plumbing internals.
 *
 * @param {string | undefined} uid
 * @param {Array<{ date: string }>} showDates
 * @param {{ onTelemetry?: (t: UserSeasonStatsTelemetry) => void }} [options]
 * @returns {Promise<UserSeasonStats>}
 */
export async function computeUserSeasonStats(uid, showDates, options = {}) {
  const { onTelemetry } = options;
  const telemetry = { ...EMPTY_USER_SEASON_STATS_TELEMETRY };
  const emit = () => {
    if (typeof onTelemetry === 'function') {
      try {
        onTelemetry(telemetry);
      } catch (err) {
        console.warn('computeUserSeasonStats telemetry callback failed:', err);
      }
    }
  };

  const id = uid?.trim();
  if (!id) {
    emit();
    return { ...EMPTY_USER_SEASON_STATS };
  }
  if (!Array.isArray(showDates) || showDates.length === 0) {
    emit();
    return { ...EMPTY_USER_SEASON_STATS };
  }

  const dates = showDates.map((s) => s.date).filter(Boolean);
  telemetry.showsChecked = dates.length;
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

  telemetry.showsPlayed = userGradedPicks.length;

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
    telemetry.collectionQueries += slice.length;
    for (let j = 0; j < slice.length; j += 1) {
      const max = maxes[j];
      if (max === null) continue;
      if (slice[j].score === max) wins += 1;
    }
  }

  emit();
  return { totalPoints, shows, wins };
}
