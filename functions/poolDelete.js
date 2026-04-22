/**
 * Pure helpers + the Firestore walk used by `deletePoolWithCleanup`
 * (issue #138). Kept separate from `functions/index.js` so unit tests can
 * import without spinning up the Firebase Functions harness.
 *
 * The activity rules mirror `src/features/pools/api/poolFirestore.js`
 * (`pickDataCountsForPool` / `pickDocHasPoolActivity`). Keep both in sync:
 * the server is the source of truth for delete eligibility, but the client
 * surfaces the same message before the round trip when it has the data.
 */

/** Firestore batch write limit (same invariant as rollup + rollup audit). */
const MAX_POOL_DELETE_BATCH_WRITES = 500;

function hasNonEmptyPicksObject(picks) {
  if (picks == null || typeof picks !== "object" || Array.isArray(picks)) {
    return false;
  }
  return Object.values(picks).some(
    (v) => v != null && String(v).trim() !== ""
  );
}

/**
 * Whether a pick document counts toward this pool. Legacy picks without an
 * embedded `pools` snapshot count toward any pool (matches client).
 *
 * @param {Record<string, unknown> | null | undefined} pickData
 * @param {string} poolId
 */
function pickDataCountsForPool(pickData, poolId) {
  if (!poolId || typeof poolId !== "string" || !poolId.trim()) return false;
  if (!pickData || typeof pickData !== "object") return false;
  const pools = /** @type {unknown} */ (pickData.pools);
  if (Array.isArray(pools) && pools.length > 0) {
    return pools.some(
      (p) => p && typeof p === "object" && /** @type {any} */ (p).id === poolId
    );
  }
  return true;
}

/**
 * Same rule as client `pickDocHasPoolActivity`: non-empty picks, graded,
 * or any non-zero score counts as qualifying activity for this pool.
 *
 * @param {Record<string, unknown> | null | undefined} pickData
 * @param {string} poolId
 */
function pickDocHasPoolActivity(pickData, poolId) {
  if (!pickDataCountsForPool(pickData, poolId)) return false;
  if (!pickData || typeof pickData !== "object") return false;
  if (hasNonEmptyPicksObject(/** @type {any} */ (pickData).picks)) return true;
  if (/** @type {any} */ (pickData).isGraded === true) return true;
  const score = /** @type {any} */ (pickData).score;
  if (typeof score === "number" && score > 0) return true;
  return false;
}

/**
 * Parses `show_calendar/snapshot` into a sorted list of `YYYY-MM-DD` strings.
 * Accepts both the v2 `showDatesByTour` + `showDates` shape and a legacy
 * `showDates: string[]` shape so the callable never breaks on transition.
 *
 * @param {Record<string, unknown> | null | undefined} snapshotData
 * @returns {string[]}
 */
function parseShowCalendarDates(snapshotData) {
  if (!snapshotData || typeof snapshotData !== "object") return [];
  /** @type {Set<string>} */
  const out = new Set();

  const byTour = /** @type {any} */ (snapshotData).showDatesByTour;
  if (Array.isArray(byTour)) {
    for (const g of byTour) {
      if (!g || typeof g !== "object") continue;
      const shows = /** @type {any} */ (g).shows;
      if (!Array.isArray(shows)) continue;
      for (const s of shows) {
        if (!s || typeof s !== "object") continue;
        const d = typeof s.date === "string" ? s.date.trim() : "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) out.add(d);
      }
    }
  }

  const flat = /** @type {any} */ (snapshotData).showDates;
  if (Array.isArray(flat)) {
    for (const s of flat) {
      if (s && typeof s === "object") {
        const d = typeof s.date === "string" ? s.date.trim() : "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) out.add(d);
      } else if (typeof s === "string") {
        const d = s.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) out.add(d);
      }
    }
  }

  return [...out].sort();
}

/** Pick document id convention: `{YYYY-MM-DD}_{userId}`. */
function pickDocId(showDate, userId) {
  return `${showDate}_${userId}`;
}

/**
 * Walks `picks/{showDate}_{uid}` for every (date, member) pair and returns
 * `true` as soon as one qualifies as activity for this pool. Mirrors the
 * client walk in `poolFirestore.poolHasPickActivityApi` so the eligibility
 * decision is identical on both sides.
 *
 * The optional `chunkSize` caps in-flight `getDoc` calls per round-trip
 * (default 24, same as client). Bump only if the pool size + calendar grows
 * enough that round-trip latency dominates.
 *
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   poolId: string,
 *   memberIds: string[],
 *   showDates: string[],
 *   chunkSize?: number,
 * }} opts
 * @returns {Promise<boolean>}
 */
async function findPoolPickActivity({
  db,
  poolId,
  memberIds,
  showDates,
  chunkSize = 24,
}) {
  const pid = typeof poolId === "string" ? poolId.trim() : "";
  const members = Array.isArray(memberIds)
    ? [
        ...new Set(
          memberIds.filter((u) => typeof u === "string" && u.trim())
        ),
      ]
    : [];
  const dates = Array.isArray(showDates)
    ? showDates.filter(
        (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
      )
    : [];
  if (!pid || members.length === 0 || dates.length === 0) return false;

  /** @type {{ date: string, uid: string }[]} */
  const tasks = [];
  for (const date of dates) {
    for (const uid of members) tasks.push({ date, uid });
  }

  for (let i = 0; i < tasks.length; i += chunkSize) {
    const slice = tasks.slice(i, i + chunkSize);
    const snaps = await Promise.all(
      slice.map(({ date, uid }) =>
        db.collection("picks").doc(pickDocId(date, uid)).get()
      )
    );
    for (const snap of snaps) {
      if (!snap || !snap.exists) continue;
      const data = snap.data ? snap.data() : null;
      if (pickDocHasPoolActivity(data || {}, pid)) return true;
    }
  }
  return false;
}

module.exports = {
  MAX_POOL_DELETE_BATCH_WRITES,
  findPoolPickActivity,
  hasNonEmptyPicksObject,
  parseShowCalendarDates,
  pickDataCountsForPool,
  pickDocHasPoolActivity,
  pickDocId,
};
