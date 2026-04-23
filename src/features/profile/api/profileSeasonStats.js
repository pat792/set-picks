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
 * `source` (added in #244) distinguishes a materialized short-circuit
 * (`'materialized'`, `showsChecked === 1`, `collectionQueries === 0`) from
 * the fallback live-compute path (`'live'`, real counters).
 *
 * @typedef {Object} UserSeasonStatsTelemetry
 * @property {number} showsChecked       Calendar size = point reads performed.
 * @property {number} showsPlayed        Graded non-empty picks for this user.
 * @property {number} collectionQueries  `picks where showDate == X` queries
 *                                       issued during the Wins pass.
 * @property {'materialized' | 'live'} source  Which pipeline served this run.
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
  source: 'live',
});

/**
 * Season stats for a single user. Attempts the #244 materialized path
 * first — a single `users/{uid}` point read — and falls back to the
 * live-compute pipeline when the snapshot is missing or stale.
 *
 * Materialized short-circuit requirements (all must hold):
 *   - The users doc exists and has numeric `totalPoints`, `showsPlayed`,
 *     `wins` fields (server-written by `rollupScoresForShow`).
 *   - `seasonStatsThroughShow >= latestFinalizedShow` — the rollup caught
 *     up to the most recent finalized show the caller is aware of.
 *
 * The live-compute fallback (read cost = `|showDates|` point reads +
 * `|showsPlayed|` collection queries) implements the same aggregation
 * rule as `reduceShowWinners` so the two paths agree:
 *   - `totalPoints` / `shows` — sum of the user's own graded picks.
 *   - `wins` — shows won overall (global high score across every graded,
 *     non-empty pick for that show), not pool-scoped wins. Ties share.
 *
 * Also reports per-invocation read-cost counters via the optional
 * `onTelemetry` callback so `useUserSeasonStats` can ship the #220
 * observability event without re-plumbing internals.
 *
 * @param {string | undefined} uid
 * @param {Array<{ date: string }>} showDates
 * @param {{
 *   onTelemetry?: (t: UserSeasonStatsTelemetry) => void,
 *   latestFinalizedShow?: string | null,
 * }} [options]
 * @returns {Promise<UserSeasonStats>}
 */
export async function computeUserSeasonStats(uid, showDates, options = {}) {
  const { onTelemetry, latestFinalizedShow = null } = options;
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

  // #244 materialized short-circuit. When `rollupScoresForShow` has
  // processed this user through at least the caller-supplied
  // `latestFinalizedShow`, the numeric aggregates on the user doc are
  // authoritative and we can skip the |showDates| + |shows_played|
  // live fan-out.
  telemetry.showsChecked = 1;
  const userRef = doc(db, 'users', id);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() || {} : null;
  const materialized = readMaterializedSeasonStats(
    userData,
    latestFinalizedShow
  );
  if (materialized) {
    telemetry.source = 'materialized';
    emit();
    return materialized;
  }

  // Fallback: the user doc is missing, the materialization snapshot is
  // stale (new show finalized since the last rollup for this user), or
  // the caller didn't supply `latestFinalizedShow`. Live-compute from
  // `picks/{date}_{uid}` — same pipeline as before #244.
  telemetry.source = 'live';

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

/**
 * Short-circuit predicate for the #244 materialized path.
 *
 * Returns the materialized `{ totalPoints, shows, wins }` from a
 * `users/{uid}` doc when:
 *   - the doc exists and has numeric `totalPoints`, `showsPlayed`, `wins`,
 *   - `latestFinalizedShow` is provided by the caller, AND
 *   - `seasonStatsThroughShow >= latestFinalizedShow` (rollup has caught
 *     up).
 *
 * Returns `null` when any check fails — the caller falls back to the
 * live-compute path in that case. Pure so the decision logic can be
 * unit-tested without mocking Firestore.
 *
 * @param {Record<string, unknown> | null | undefined} userData
 * @param {string | null | undefined} latestFinalizedShow
 * @returns {UserSeasonStats | null}
 */
export function readMaterializedSeasonStats(userData, latestFinalizedShow) {
  if (!userData || typeof userData !== 'object') return null;
  const totalPoints =
    typeof userData.totalPoints === 'number' ? userData.totalPoints : null;
  const shows =
    typeof userData.showsPlayed === 'number' ? userData.showsPlayed : null;
  const wins = typeof userData.wins === 'number' ? userData.wins : null;
  if (totalPoints === null || shows === null || wins === null) return null;
  if (typeof latestFinalizedShow !== 'string' || !latestFinalizedShow) {
    return null;
  }
  const through =
    typeof userData.seasonStatsThroughShow === 'string'
      ? userData.seasonStatsThroughShow
      : '';
  if (!through || through < latestFinalizedShow) return null;
  return { totalPoints, shows, wins };
}
