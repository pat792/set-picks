/**
 * Functions-owned Global Stats leaderboards (#1004 Phase 2).
 *
 * Scans `users` on the server, ranks Points per show / Picking average /
 * Shows (all-time + per-tour), and writes top-50 boards to
 * `global_stats_leaderboards/{allTime|tour:{tourKey}}`.
 *
 * Clients must `getDoc` those docs + the signed-in `users/{uid}` only —
 * never query/scan `users`.
 */

"use strict";

const GLOBAL_STATS_LEADERBOARDS_COLLECTION = "global_stats_leaderboards";
const ALL_TIME_DOC_ID = "allTime";
const GLOBAL_LEADERBOARD_TOP_N = 50;
const GLOBAL_LEADERBOARD_MIN_SHOWS = 3;
const GLOBAL_LEADERBOARD_SLOTS_PER_SHOW = 6;
const GLOBAL_LEADERBOARD_SCHEMA_VERSION = 1;
const USER_SCAN_PAGE_SIZE = 500;

const BOARD_KEYS = Object.freeze([
  "pointsPerShow",
  "pickingAverage",
  "shows",
]);

/**
 * @param {string} tourKey
 * @returns {string}
 */
function tourLeaderboardDocId(tourKey) {
  return `tour:${tourKey}`;
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * @param {unknown} totalPoints
 * @param {unknown} shows
 * @returns {number | null}
 */
function computePointsPerShow(totalPoints, shows) {
  const pts = finiteNumber(totalPoints);
  const n = finiteNumber(shows);
  if (pts == null || n == null || n <= 0) return null;
  return pts / n;
}

/**
 * Picking average = correct slots / (shows * 6).
 *
 * @param {unknown} correctSlots
 * @param {unknown} shows
 * @returns {number | null}
 */
function computePickingAverage(correctSlots, shows) {
  const correct = finiteNumber(correctSlots);
  const n = finiteNumber(shows);
  if (correct == null || n == null || n <= 0) return null;
  return correct / (n * GLOBAL_LEADERBOARD_SLOTS_PER_SHOW);
}

/**
 * @param {unknown} handle
 * @returns {string}
 */
function normalizeHandle(handle) {
  if (typeof handle === "string" && handle.trim()) return handle.trim();
  return "Anonymous";
}

/**
 * Competition ranking (1, 1, 3). Higher value wins; ties break by more shows,
 * then handle A→Z.
 *
 * @param {Array<{ uid: string, handle: string, value: number | null, shows: number }>} candidates
 * @param {{ minShows?: number, topN?: number }} [opts]
 * @returns {Array<{ uid: string, handle: string, value: number, shows: number, rank: number }>}
 */
function rankBoard(candidates, opts = {}) {
  const minShows = Number.isFinite(opts.minShows)
    ? opts.minShows
    : GLOBAL_LEADERBOARD_MIN_SHOWS;
  const topN = Number.isFinite(opts.topN) ? opts.topN : GLOBAL_LEADERBOARD_TOP_N;

  const eligible = [];
  for (const row of candidates || []) {
    if (!row || typeof row.uid !== "string" || !row.uid) continue;
    if (row.value == null || !Number.isFinite(row.value)) continue;
    const shows = finiteNumber(row.shows) ?? 0;
    if (minShows > 0 && shows < minShows) continue;
    eligible.push({
      uid: row.uid,
      handle: normalizeHandle(row.handle),
      value: row.value,
      shows,
    });
  }

  eligible.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    if (b.shows !== a.shows) return b.shows - a.shows;
    return a.handle.localeCompare(b.handle, "en");
  });

  /** @type {Array<{ uid: string, handle: string, value: number, shows: number, rank: number }>} */
  const ranked = [];
  let lastValue = null;
  let lastRank = 0;
  for (let i = 0; i < eligible.length; i++) {
    const row = eligible[i];
    const rank = lastValue === row.value ? lastRank : i + 1;
    lastValue = row.value;
    lastRank = rank;
    ranked.push({ ...row, rank });
  }
  return ranked.slice(0, topN);
}

/**
 * @param {Array<{
 *   uid: string,
 *   handle?: unknown,
 *   showsPlayed?: unknown,
 *   totalPoints?: unknown,
 *   careerCorrectSlots?: unknown,
 *   seasonStats?: Record<string, { totalPoints?: unknown, shows?: unknown, correctSlots?: unknown }>
 * }>} users
 * @returns {{
 *   allTime: Array<{ uid: string, handle: string, shows: number, pointsPerShow: number | null, pickingAverage: number | null }>,
 *   byTour: Map<string, Array<{ uid: string, handle: string, shows: number, pointsPerShow: number | null, pickingAverage: number | null }>>
 * }}
 */
function collectCandidatesFromUsers(users) {
  /** @type {Array<{ uid: string, handle: string, shows: number, pointsPerShow: number | null, pickingAverage: number | null }>} */
  const allTime = [];
  /** @type {Map<string, Array<{ uid: string, handle: string, shows: number, pointsPerShow: number | null, pickingAverage: number | null }>>} */
  const byTour = new Map();

  for (const user of users || []) {
    if (!user || typeof user.uid !== "string" || !user.uid) continue;
    const handle = normalizeHandle(user.handle);
    const showsPlayed = finiteNumber(user.showsPlayed) ?? 0;
    if (showsPlayed > 0) {
      allTime.push({
        uid: user.uid,
        handle,
        shows: showsPlayed,
        pointsPerShow: computePointsPerShow(user.totalPoints, showsPlayed),
        pickingAverage: computePickingAverage(
          user.careerCorrectSlots,
          showsPlayed
        ),
      });
    }

    const seasonStats =
      user.seasonStats && typeof user.seasonStats === "object"
        ? user.seasonStats
        : {};
    for (const [tourKey, stats] of Object.entries(seasonStats)) {
      if (!tourKey || !stats || typeof stats !== "object") continue;
      const shows = finiteNumber(stats.shows) ?? 0;
      if (shows <= 0) continue;
      if (!byTour.has(tourKey)) byTour.set(tourKey, []);
      byTour.get(tourKey).push({
        uid: user.uid,
        handle,
        shows,
        pointsPerShow: computePointsPerShow(stats.totalPoints, shows),
        pickingAverage: computePickingAverage(stats.correctSlots, shows),
      });
    }
  }

  return { allTime, byTour };
}

/**
 * @param {Array<{ uid: string, handle: string, shows: number, pointsPerShow: number | null, pickingAverage: number | null }>} rows
 * @returns {{
 *   pointsPerShow: ReturnType<typeof rankBoard>,
 *   pickingAverage: ReturnType<typeof rankBoard>,
 *   shows: ReturnType<typeof rankBoard>,
 * }}
 */
function boardsFromCandidates(rows) {
  return {
    pointsPerShow: rankBoard(
      rows.map((r) => ({
        uid: r.uid,
        handle: r.handle,
        value: r.pointsPerShow,
        shows: r.shows,
      })),
      { minShows: GLOBAL_LEADERBOARD_MIN_SHOWS }
    ),
    pickingAverage: rankBoard(
      rows.map((r) => ({
        uid: r.uid,
        handle: r.handle,
        value: r.pickingAverage,
        shows: r.shows,
      })),
      { minShows: GLOBAL_LEADERBOARD_MIN_SHOWS }
    ),
    shows: rankBoard(
      rows.map((r) => ({
        uid: r.uid,
        handle: r.handle,
        value: r.shows,
        shows: r.shows,
      })),
      { minShows: 0 }
    ),
  };
}

/**
 * @param {{
 *   users: Parameters<typeof collectCandidatesFromUsers>[0],
 *   tourKey?: string | null,
 *   allTours?: boolean,
 * }} params
 * @returns {Array<{ docId: string, scope: "allTime" | "tour", tourKey: string | null, playerCount: number, boards: ReturnType<typeof boardsFromCandidates> }>}
 */
function buildLeaderboardPayloads({
  users,
  tourKey = null,
  allTours = false,
}) {
  const { allTime, byTour } = collectCandidatesFromUsers(users);
  /** @type {Array<{ docId: string, scope: "allTime" | "tour", tourKey: string | null, playerCount: number, boards: ReturnType<typeof boardsFromCandidates> }>} */
  const payloads = [
    {
      docId: ALL_TIME_DOC_ID,
      scope: "allTime",
      tourKey: null,
      playerCount: allTime.length,
      boards: boardsFromCandidates(allTime),
    },
  ];

  /** @type {string[]} */
  let tourKeys = [];
  if (allTours) {
    tourKeys = [...byTour.keys()].sort((a, b) => a.localeCompare(b, "en"));
  } else if (typeof tourKey === "string" && tourKey.trim()) {
    tourKeys = [tourKey.trim()];
  }

  for (const key of tourKeys) {
    const rows = byTour.get(key) || [];
    payloads.push({
      docId: tourLeaderboardDocId(key),
      scope: "tour",
      tourKey: key,
      playerCount: rows.length,
      boards: boardsFromCandidates(rows),
    });
  }

  return payloads;
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @returns {Promise<Array<{ uid: string } & Record<string, unknown>>>}
 */
async function scanUsersCollection(db) {
  /** @type {Array<{ uid: string } & Record<string, unknown>>} */
  const users = [];
  let last = null;
  // Paginate so a growing roster never depends on a single unbounded get().
  for (;;) {
    let query = db
      .collection("users")
      .orderBy("__name__")
      .limit(USER_SCAN_PAGE_SIZE);
    if (last) query = query.startAfter(last);
    const snap = await query.get();
    if (snap.empty) break;
    for (const docSnap of snap.docs) {
      const data = docSnap.data() || {};
      users.push({ uid: docSnap.id, ...data });
    }
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < USER_SCAN_PAGE_SIZE) break;
  }
  return users;
}

/**
 * @param {object} params
 * @param {import("firebase-admin").firestore.Firestore} params.db
 * @param {typeof import("firebase-admin")} params.admin
 * @param {string | null} [params.tourKey] Rebuild all-time + this tour only.
 * @param {boolean} [params.allTours] Rebuild all-time + every tour in seasonStats.
 * @param {"rollup" | "scheduled" | "admin" | "revert"} [params.trigger]
 * @param {{ info?: Function, warn?: Function, error?: Function }} [params.logger]
 * @returns {Promise<{ docsWritten: number, usersScanned: number, tourKeys: string[] }>}
 */
async function rebuildGlobalStatsLeaderboards({
  db,
  admin,
  tourKey = null,
  allTours = false,
  trigger = "admin",
  logger = undefined,
}) {
  const users = await scanUsersCollection(db);
  const payloads = buildLeaderboardPayloads({ users, tourKey, allTours });
  const writtenAt = admin.firestore.FieldValue.serverTimestamp();

  for (const payload of payloads) {
    await db
      .collection(GLOBAL_STATS_LEADERBOARDS_COLLECTION)
      .doc(payload.docId)
      .set({
        schemaVersion: GLOBAL_LEADERBOARD_SCHEMA_VERSION,
        minShows: GLOBAL_LEADERBOARD_MIN_SHOWS,
        slotsPerShow: GLOBAL_LEADERBOARD_SLOTS_PER_SHOW,
        topN: GLOBAL_LEADERBOARD_TOP_N,
        scope: payload.scope,
        tourKey: payload.tourKey,
        playerCount: payload.playerCount,
        boards: payload.boards,
        trigger,
        rebuiltAt: writtenAt,
      });
  }

  const tourKeys = payloads
    .filter((p) => p.scope === "tour" && p.tourKey)
    .map((p) => p.tourKey);

  logger?.info?.("rebuildGlobalStatsLeaderboards", {
    trigger,
    usersScanned: users.length,
    docsWritten: payloads.length,
    tourKeys,
  });

  return {
    docsWritten: payloads.length,
    usersScanned: users.length,
    tourKeys,
  };
}

/**
 * Soft-fail wrapper so rollup / revert never lose a successful scoring pass.
 *
 * @param {Parameters<typeof rebuildGlobalStatsLeaderboards>[0]} params
 * @returns {Promise<Awaited<ReturnType<typeof rebuildGlobalStatsLeaderboards>> | null>}
 */
async function rebuildGlobalStatsLeaderboardsSafe(params) {
  try {
    return await rebuildGlobalStatsLeaderboards(params);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    params.logger?.warn?.("rebuildGlobalStatsLeaderboards failed", {
      trigger: params.trigger,
      tourKey: params.tourKey || null,
      msg,
    });
    return null;
  }
}

module.exports = {
  ALL_TIME_DOC_ID,
  BOARD_KEYS,
  GLOBAL_LEADERBOARD_MIN_SHOWS,
  GLOBAL_LEADERBOARD_SCHEMA_VERSION,
  GLOBAL_LEADERBOARD_SLOTS_PER_SHOW,
  GLOBAL_LEADERBOARD_TOP_N,
  GLOBAL_STATS_LEADERBOARDS_COLLECTION,
  boardsFromCandidates,
  buildLeaderboardPayloads,
  collectCandidatesFromUsers,
  computePickingAverage,
  computePointsPerShow,
  rankBoard,
  rebuildGlobalStatsLeaderboards,
  rebuildGlobalStatsLeaderboardsSafe,
  tourLeaderboardDocId,
};
