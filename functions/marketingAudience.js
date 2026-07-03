/**
 * Summer Tour 2026 launch — audience resolver (#468).
 *
 * Cohort:
 *  - Sphere Run seed players (graded, non-empty picks on any Sphere inaugural date)
 *  - Users who signed up on/after Sphere go-live through send time
 */

"use strict";

/** @typedef {'sphere_alum' | 'post_sphere_signup' | 'sphere_alum_and_new'} AudienceSegment */

/**
 * Sphere Run dates — keep aligned with `sphereTourRecapDelivery.js` and
 * `src/shared/data/showDates.js`.
 *
 * @type {readonly string[]}
 */
const SPHERE_2026_INAUGURAL_SHOW_DATES = Object.freeze([
  "2026-04-16",
  "2026-04-17",
  "2026-04-18",
  "2026-04-23",
  "2026-04-24",
  "2026-04-25",
  "2026-04-30",
  "2026-05-01",
  "2026-05-02",
]);

/** First Sphere show — public app go-live anchor for post-Sphere signups. */
const SPHERE_GO_LIVE_ISO = "2026-04-16T00:00:00.000Z";

/**
 * @param {unknown} picks
 * @returns {boolean}
 */
function hasNonEmptyPicksObject(picks) {
  if (picks == null || typeof picks !== "object" || Array.isArray(picks)) {
    return false;
  }
  return Object.values(picks).some(
    (v) => v != null && String(v).trim() !== ""
  );
}

/**
 * @param {Record<string, unknown> | null | undefined} pickData
 * @returns {boolean}
 */
function pickCountsTowardSeason(pickData) {
  if (!pickData || pickData.isGraded !== true) return false;
  return hasNonEmptyPicksObject(pickData.picks);
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @returns {Promise<Set<string>>}
 */
async function loadSphereAlumUids(db) {
  const snap = await db
    .collection("picks")
    .where("showDate", "in", [...SPHERE_2026_INAUGURAL_SHOW_DATES])
    .get();

  /** @type {Set<string>} */
  const uids = new Set();
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    if (!pickCountsTowardSeason(data)) continue;
    const uid = String(data.userId || data.uid || "").trim();
    if (uid) uids.add(uid);
  }
  return uids;
}

/**
 * @param {import("firebase-admin").firestore.Timestamp | Date | null | undefined} createdAt
 * @returns {boolean}
 */
function createdOnOrAfterGoLive(createdAt) {
  if (!createdAt) return false;
  const goLiveMs = new Date(SPHERE_GO_LIVE_ISO).getTime();
  const ms =
    typeof createdAt.toDate === "function"
      ? createdAt.toDate().getTime()
      : createdAt instanceof Date
        ? createdAt.getTime()
        : NaN;
  return Number.isFinite(ms) && ms >= goLiveMs;
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @returns {Promise<Array<{ uid: string, segment: AudienceSegment }>>}
 */
async function resolveSummerTour2026LaunchAudience(db) {
  const sphereAlums = await loadSphereAlumUids(db);
  const usersSnap = await db.collection("users").get();

  /** @type {Map<string, AudienceSegment>} */
  const byUid = new Map();

  for (const uid of sphereAlums) {
    byUid.set(uid, "sphere_alum");
  }

  for (const doc of usersSnap.docs) {
    const data = doc.data() || {};
    if (!createdOnOrAfterGoLive(data.createdAt)) continue;
    const uid = doc.id;
    if (byUid.has(uid)) {
      byUid.set(uid, "sphere_alum_and_new");
    } else {
      byUid.set(uid, "post_sphere_signup");
    }
  }

  return [...byUid.entries()].map(([uid, segment]) => ({ uid, segment }));
}

module.exports = {
  SPHERE_2026_INAUGURAL_SHOW_DATES,
  SPHERE_GO_LIVE_ISO,
  resolveSummerTour2026LaunchAudience,
};
