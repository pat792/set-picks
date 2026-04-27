import { doc, getDoc } from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import { GAME_LAUNCH_SHOW_DATE } from '../../../shared/config/gameLaunch';
import { fetchGlobalMaxScoreForShow } from '../../scoring';
import { pickCountsTowardSeason } from '../../../shared/utils/showAggregation';
import { pickDataCountsForPool } from './poolFirestore';

/**
 * @typedef {Object} PoolStandingsRow
 * @property {number} totalScore  Sum of graded pick scores eligible for the pool.
 * @property {number} showsPlayed Graded non-empty picks eligible for the pool.
 * @property {number} wins        Shows the user won (rule depends on `source`).
 *                                See `readMaterializedPoolStandings` for the
 *                                global-vs-pool wins discussion.
 */

/**
 * @typedef {Object} PoolStandingsTelemetry
 * @property {number} memberCount         Total members the load was asked about.
 * @property {number} membersMaterialized Members served from the #244 user-doc snapshot.
 * @property {number} membersLiveFallback Members that hit the per-member live path.
 * @property {'all-time' | 'tour'} scope  Surface scope.
 */

/** @type {PoolStandingsRow} */
export const EMPTY_POOL_STANDINGS_ROW = Object.freeze({
  totalScore: 0,
  showsPlayed: 0,
  wins: 0,
});

/**
 * Short-circuit predicate for the pool-standings materialized path.
 *
 * Mirrors `readMaterializedSeasonStats` from
 * `features/profile/api/profileSeasonStats.js`, with one extension: the
 * caller passes a `tourKey` for tour-scoped standings and we read the
 * per-tour `seasonStats.{tourKey}` map instead of the top-level
 * `totalPoints` / `showsPlayed` / `wins`.
 *
 * Returns `null` when:
 *   - the user doc is missing or has non-numeric aggregate fields,
 *   - `latestFinalizedShow` was not provided by the caller, or
 *   - `seasonStatsThroughShow < latestFinalizedShow` (rollup hasn't caught
 *     up to this user yet — fall back to live-compute for that single
 *     member).
 *
 * **Wins semantic note (#254):** the materialized `wins` field on
 * `users/{uid}` is **global** wins — the global-max rule from
 * `reduceShowWinners`. Pool standings historically used a pool-internal
 * max. In practice the two collide for any pool the user is currently
 * in, because `arrayUnionPoolOntoUserPickDocs` (picks API) backfills
 * `pick.pools` onto every existing graded pick at create / join time, so
 * the in-pool eligible set is a superset of the user's own graded
 * picks. The "About all-time standings" copy already describes the
 * global rule. Filed as a follow-up if telemetry indicates this needs
 * pool-internal wins materialization.
 *
 * Pure so the decision table can be unit-tested without Firestore.
 *
 * @param {Record<string, unknown> | null | undefined} userData
 * @param {{
 *   latestFinalizedShow?: string | null,
 *   tourKey?: string | null,
 * }} [options]
 * @returns {PoolStandingsRow | null}
 */
export function readMaterializedPoolStandings(userData, options = {}) {
  const { latestFinalizedShow = null, tourKey = null } = options;
  if (!userData || typeof userData !== 'object') return null;
  if (typeof latestFinalizedShow !== 'string' || !latestFinalizedShow) {
    return null;
  }
  const through =
    typeof userData.seasonStatsThroughShow === 'string'
      ? userData.seasonStatsThroughShow
      : '';
  if (!through || through < latestFinalizedShow) return null;

  if (tourKey) {
    const all = userData.seasonStats;
    if (!all || typeof all !== 'object') return null;
    const entry = /** @type {Record<string, unknown> | undefined} */ (
      /** @type {Record<string, unknown>} */ (all)[tourKey]
    );
    if (!entry || typeof entry !== 'object') return null;
    const totalPoints =
      typeof /** @type {Record<string, unknown>} */ (entry).totalPoints ===
      'number'
        ? /** @type {number} */ (entry.totalPoints)
        : null;
    const shows =
      typeof /** @type {Record<string, unknown>} */ (entry).shows === 'number'
        ? /** @type {number} */ (entry.shows)
        : null;
    const wins =
      typeof /** @type {Record<string, unknown>} */ (entry).wins === 'number'
        ? /** @type {number} */ (entry.wins)
        : null;
    if (totalPoints === null || shows === null || wins === null) return null;
    return { totalScore: totalPoints, showsPlayed: shows, wins };
  }

  const totalPoints =
    typeof userData.totalPoints === 'number' ? userData.totalPoints : null;
  const shows =
    typeof userData.showsPlayed === 'number' ? userData.showsPlayed : null;
  const wins = typeof userData.wins === 'number' ? userData.wins : null;
  if (totalPoints === null || shows === null || wins === null) return null;
  return { totalScore: totalPoints, showsPlayed: shows, wins };
}

const USER_READ_CHUNK_SIZE = 24;
const PICK_READ_CHUNK_SIZE = 24;
const WIN_FETCH_CHUNK_SIZE = 10;

/**
 * Pool standings totals for every member, computed via the cheapest
 * available read path per member.
 *
 * Read cost (cold mount, no React Query cache):
 *   - **Best case (every member caught up):** `N` point reads —
 *     one `users/{uid}` per member. The historical
 *     `members × showDates` fan-out is gone.
 *   - **Mixed case:** caught-up members served from the user doc; stale
 *     members hit per-member live-compute (`|effectiveShowDates|` point
 *     reads + small wins fan-out for that one member only). One
 *     straggler doesn't regress the rest.
 *
 * Behavior parity with the legacy `computePoolSeasonTotalsByUser`:
 *   - `pickDataCountsForPool` gating still applies on the live fallback
 *     path. The materialized path implicitly uses the global aggregate
 *     (see `readMaterializedPoolStandings` — wins semantic note).
 *   - `pickCountsTowardSeason` still gates on `isGraded` + non-empty.
 *   - Tour scope is honored by passing `tourKey` to
 *     `readMaterializedPoolStandings` so the per-tour
 *     `seasonStats.{tourKey}` map is consulted in lieu of top-level
 *     totals.
 *
 * Caller is responsible for passing an `effectiveShowDates` already
 * floored to {@link GAME_LAUNCH_SHOW_DATE} (handled by
 * `usePoolStandingsSection`); the floor is applied here too as a defensive
 * cap so the live fallback never iterates pre-launch noise even if a
 * caller forgets.
 *
 * @param {string} poolId
 * @param {string[]} memberIds
 * @param {Array<{ date: string }>} effectiveShowDates
 * @param {{
 *   latestFinalizedShow?: string | null,
 *   tourKey?: string | null,
 *   onTelemetry?: (t: PoolStandingsTelemetry) => void,
 * }} [options]
 * @returns {Promise<Map<string, PoolStandingsRow>>}
 */
export async function loadPoolStandings(
  poolId,
  memberIds,
  effectiveShowDates,
  options = {}
) {
  const {
    latestFinalizedShow = null,
    tourKey = null,
    onTelemetry,
  } = options;

  const pid = poolId?.trim();
  const members = Array.isArray(memberIds) ? memberIds.filter(Boolean) : [];
  /** @type {Map<string, PoolStandingsRow>} */
  const totals = new Map();
  for (const uid of members) {
    totals.set(uid, { ...EMPTY_POOL_STANDINGS_ROW });
  }

  /** @type {PoolStandingsTelemetry} */
  const telemetry = {
    memberCount: members.length,
    membersMaterialized: 0,
    membersLiveFallback: 0,
    scope: tourKey ? 'tour' : 'all-time',
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

  if (!pid || members.length === 0) {
    emit();
    return totals;
  }

  const flooredShowDates = Array.isArray(effectiveShowDates)
    ? effectiveShowDates.filter(
        (s) =>
          s &&
          typeof s.date === 'string' &&
          s.date >= GAME_LAUNCH_SHOW_DATE
      )
    : [];

  /** @type {string[]} */
  const liveMembers = [];

  for (let i = 0; i < members.length; i += USER_READ_CHUNK_SIZE) {
    const slice = members.slice(i, i + USER_READ_CHUNK_SIZE);
    const snaps = await Promise.all(
      slice.map((uid) => getDoc(doc(db, 'users', uid)))
    );
    for (let j = 0; j < slice.length; j += 1) {
      const uid = slice[j];
      const snap = snaps[j];
      const userData = snap.exists() ? snap.data() || {} : null;
      const materialized = readMaterializedPoolStandings(userData, {
        latestFinalizedShow,
        tourKey,
      });
      if (materialized) {
        totals.set(uid, materialized);
        telemetry.membersMaterialized += 1;
      } else {
        liveMembers.push(uid);
      }
    }
  }

  if (liveMembers.length > 0 && flooredShowDates.length > 0) {
    await Promise.all(
      liveMembers.map(async (uid) => {
        const row = await computeSingleMemberPoolStandingsLive(
          pid,
          uid,
          flooredShowDates
        );
        totals.set(uid, row);
      })
    );
    telemetry.membersLiveFallback += liveMembers.length;
  } else {
    telemetry.membersLiveFallback += liveMembers.length;
  }

  emit();
  return totals;
}

/**
 * Per-member live-compute fallback used when a member's #244 snapshot is
 * missing or stale.
 *
 * Same rule as the legacy `computePoolSeasonTotalsByUser` restricted to a
 * single user:
 *   - Sum `score` for every graded, non-empty pick of this user that
 *     `pickDataCountsForPool` accepts.
 *   - Count those picks as `showsPlayed`.
 *   - For each show the user has a qualifying pick, look up the global
 *     max via `fetchGlobalMaxScoreForShow` (cached upstream); credit a
 *     win when the user tied or beat it. Same global-wins rule the
 *     materialized path returns, so the two paths report the same wins
 *     value modulo rollup freshness.
 *
 * @param {string} poolId
 * @param {string} userId
 * @param {Array<{ date: string }>} showDates
 * @returns {Promise<PoolStandingsRow>}
 */
async function computeSingleMemberPoolStandingsLive(poolId, userId, showDates) {
  const dates = showDates.map((s) => s.date).filter(Boolean);
  /** @type {Array<{ showDate: string, score: number }>} */
  const userGradedPicks = [];

  for (let i = 0; i < dates.length; i += PICK_READ_CHUNK_SIZE) {
    const slice = dates.slice(i, i + PICK_READ_CHUNK_SIZE);
    const snaps = await Promise.all(
      slice.map((date) => getDoc(doc(db, 'picks', `${date}_${userId}`)))
    );
    for (let j = 0; j < slice.length; j += 1) {
      const snap = snaps[j];
      if (!snap.exists()) continue;
      const data = snap.data() || {};
      if (!pickDataCountsForPool(data, poolId)) continue;
      if (!pickCountsTowardSeason(data)) continue;
      const score = typeof data.score === 'number' ? data.score : 0;
      userGradedPicks.push({ showDate: slice[j], score });
    }
  }

  let totalScore = 0;
  let showsPlayed = 0;
  for (const p of userGradedPicks) {
    totalScore += p.score;
    showsPlayed += 1;
  }

  let wins = 0;
  for (let i = 0; i < userGradedPicks.length; i += WIN_FETCH_CHUNK_SIZE) {
    const slice = userGradedPicks.slice(i, i + WIN_FETCH_CHUNK_SIZE);
    const maxes = await Promise.all(
      slice.map((p) => fetchGlobalMaxScoreForShow(p.showDate))
    );
    for (let j = 0; j < slice.length; j += 1) {
      const max = maxes[j];
      if (max === null) continue;
      if (slice[j].score === max) wins += 1;
    }
  }

  return { totalScore, showsPlayed, wins };
}
