import { doc, getDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import { GAME_LAUNCH_SHOW_DATE } from '../../../shared/config/gameLaunch';
import { pickCountsTowardSeason } from '../../../shared/utils/showAggregation';
import { pickDataCountsForPool } from './poolFirestore';

/**
 * @typedef {Object} PoolStandingsRow
 * @property {number} totalScore  Sum of graded pick scores eligible for the pool.
 * @property {number} showsPlayed Graded non-empty picks eligible for the pool.
 * @property {number} wins        Shows the user won inside this pool — max
 *                                across pool members' eligible picks for
 *                                that night, ties share, `max === 0` skips.
 */

/**
 * @typedef {Object} PoolStandingsTelemetry
 * @property {number} memberCount   Total members the load was asked about.
 * @property {number} showsScanned  Show dates iterated (post game-launch floor).
 * @property {'all-time' | 'tour'} scope  Surface scope.
 */

/** @type {PoolStandingsRow} */
export const EMPTY_POOL_STANDINGS_ROW = Object.freeze({
  totalScore: 0,
  showsPlayed: 0,
  wins: 0,
});

const PICK_READ_CHUNK_SIZE = 24;

/**
 * Pure aggregation step factored out of {@link loadPoolStandings} so the
 * pool-internal wins rule (and the points / shows accumulation) can be
 * unit-tested without mocking Firestore.
 *
 * `picks` must already be filtered to the rows that count for this pool
 * + season (i.e. `pickDataCountsForPool(data, poolId)` and
 * `pickCountsTowardSeason(data)` returned `true`). Wins are pool-internal:
 * for each show, the max score among the supplied rows wins; ties share;
 * `max === 0` (hollow night) credits no one.
 *
 * @param {string[]} memberIds
 * @param {Array<{ userId: string, showDate: string, score: number }>} picks
 * @returns {Map<string, PoolStandingsRow>}
 */
export function aggregatePoolStandings(memberIds, picks) {
  /** @type {Map<string, PoolStandingsRow>} */
  const totals = new Map();
  const allowed = new Set();
  for (const uid of Array.isArray(memberIds) ? memberIds : []) {
    if (!uid) continue;
    totals.set(uid, { ...EMPTY_POOL_STANDINGS_ROW });
    allowed.add(uid);
  }

  /** @type {Map<string, Array<{ userId: string, score: number }>>} */
  const byShow = new Map();

  for (const p of Array.isArray(picks) ? picks : []) {
    if (!p || typeof p !== 'object') continue;
    if (!allowed.has(p.userId)) continue;
    if (typeof p.showDate !== 'string' || !p.showDate) continue;
    if (typeof p.score !== 'number') continue;
    const row = totals.get(p.userId);
    if (row) {
      row.totalScore += p.score;
      row.showsPlayed += 1;
    }
    const list = byShow.get(p.showDate) || [];
    list.push({ userId: p.userId, score: p.score });
    byShow.set(p.showDate, list);
  }

  for (const [, list] of byShow) {
    if (list.length === 0) continue;
    let max = 0;
    for (const x of list) if (x.score > max) max = x.score;
    if (max === 0) continue;
    for (const x of list) {
      if (x.score !== max) continue;
      const row = totals.get(x.userId);
      if (row) row.wins += 1;
    }
  }

  return totals;
}

/**
 * Pool-scoped standings totals (points, shows, pool-internal wins) for
 * every member across `effectiveShowDates`.
 *
 * Direct port of the pre-#254 `computePoolSeasonTotalsByUser` so behavior
 * matches the proven leaderboard exactly:
 *   - **Inclusion gate:** `pickDataCountsForPool` (`pick.pools` snapshot,
 *     with the legacy "no snapshot → counts everywhere" fallback) +
 *     `pickCountsTowardSeason` (graded + non-empty).
 *   - **Wins:** per show, the **pool-internal** max across the pool's
 *     qualifying picks; ties share the win; `max === 0` (hollow show)
 *     credits no one. Distinct from the global "winner of the night"
 *     used by Standings #218 / Profile #217 — pool standings have always
 *     been pool-scoped here.
 *
 * The earlier #254 attempt routed this through the materialized
 * `users.{uid}.totalPoints` / `seasonStats.{tourKey}` aggregates, but
 * those are global sums — they cannot honor the per-pool inclusion gate
 * above and they encode the global winner rule (a real, observed
 * regression). Pool-scoped materialization is filed separately; until
 * it lands, this is the source of truth.
 *
 * `effectiveShowDates` is floored to {@link GAME_LAUNCH_SHOW_DATE} as
 * a defensive cap so we never iterate pre-launch upstream tour dates
 * even if the caller's calendar slips.
 *
 * Read cost (cold mount, no React Query cache): `|members| × |effective
 * showDates|` Firestore point reads on `picks/{date}_{uid}`. React
 * Query (#243) keys the result so back-nav within the session reissues
 * zero reads.
 *
 * @param {string} poolId
 * @param {string[]} memberIds
 * @param {Array<{ date: string }>} effectiveShowDates
 * @param {{
 *   onTelemetry?: (t: PoolStandingsTelemetry) => void,
 *   scope?: 'all-time' | 'tour',
 * }} [options]
 * @returns {Promise<Map<string, PoolStandingsRow>>}
 */
export async function loadPoolStandings(
  poolId,
  memberIds,
  effectiveShowDates,
  options = {}
) {
  const { onTelemetry, scope = 'all-time' } = options;

  const pid = poolId?.trim();
  const members = Array.isArray(memberIds) ? memberIds.filter(Boolean) : [];
  /** @type {Map<string, PoolStandingsRow>} */
  const totals = new Map();
  for (const uid of members) {
    totals.set(uid, { ...EMPTY_POOL_STANDINGS_ROW });
  }

  const flooredShowDates = Array.isArray(effectiveShowDates)
    ? effectiveShowDates
        .filter(
          (s) =>
            s &&
            typeof s.date === 'string' &&
            s.date >= GAME_LAUNCH_SHOW_DATE
        )
        .map((s) => s.date)
    : [];

  /** @type {PoolStandingsTelemetry} */
  const telemetry = {
    memberCount: members.length,
    showsScanned: flooredShowDates.length,
    scope,
  };
  const emit = () => {
    if (typeof onTelemetry === 'function') {
      try {
        onTelemetry(telemetry);
      } catch (err) {
        console.warn('loadPoolStandings telemetry callback failed:', err);
      }
    }
  };

  if (!pid || members.length === 0 || flooredShowDates.length === 0) {
    emit();
    return totals;
  }

  /** @type {Array<{ showDate: string, userId: string, score: number }>} */
  const eligiblePicks = [];

  /** @type {Array<{ showDate: string, userId: string }>} */
  const tasks = [];
  for (const showDate of flooredShowDates) {
    for (const userId of members) {
      tasks.push({ showDate, userId });
    }
  }

  for (let i = 0; i < tasks.length; i += PICK_READ_CHUNK_SIZE) {
    const slice = tasks.slice(i, i + PICK_READ_CHUNK_SIZE);
    const snaps = await Promise.all(
      slice.map(({ showDate, userId }) =>
        getDoc(doc(db, 'picks', `${showDate}_${userId}`))
      )
    );
    for (let j = 0; j < slice.length; j += 1) {
      const snap = snaps[j];
      const { showDate, userId } = slice[j];
      if (!snap.exists()) continue;
      const data = snap.data() || {};
      if (!pickDataCountsForPool(data, pid)) continue;
      if (!pickCountsTowardSeason(data)) continue;
      const score = typeof data.score === 'number' ? data.score : 0;
      eligiblePicks.push({ showDate, userId, score });
    }
  }

  const aggregated = aggregatePoolStandings(members, eligiblePicks);
  for (const [uid, row] of aggregated) totals.set(uid, row);

  emit();
  return totals;
}
