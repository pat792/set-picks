/**
 * Milestone badge awards (#568) — idempotent merge onto `users/{uid}.badges`.
 *
 * v1 awards Participation (`shows_played_1/5/10`) + Competitive (`win_1`)
 * from career rollup counters already written by `runRollupForShow`.
 * Streaks / tour-scoped / days-at-#1 deferred per matrix.
 */

/** @type {readonly { id: string, showsPlayed?: number, wins?: number }[]} */
const CAREER_BADGE_RULES = Object.freeze([
  { id: "shows_played_1", showsPlayed: 1 },
  { id: "shows_played_5", showsPlayed: 5 },
  { id: "shows_played_10", showsPlayed: 10 },
  { id: "win_1", wins: 1 },
]);

/**
 * Pure unlock helper from career counters.
 *
 * @param {{ showsPlayed?: unknown, wins?: unknown }} stats
 * @returns {string[]}
 */
function computeUnlockedBadgeIds(stats) {
  const shows =
    typeof stats?.showsPlayed === "number" && Number.isFinite(stats.showsPlayed)
      ? stats.showsPlayed
      : 0;
  const wins =
    typeof stats?.wins === "number" && Number.isFinite(stats.wins)
      ? stats.wins
      : 0;

  /** @type {string[]} */
  const unlocked = [];
  for (const rule of CAREER_BADGE_RULES) {
    if (
      typeof rule.showsPlayed === "number" &&
      shows >= rule.showsPlayed
    ) {
      unlocked.push(rule.id);
      continue;
    }
    if (typeof rule.wins === "number" && wins >= rule.wins) {
      unlocked.push(rule.id);
    }
  }
  return unlocked;
}

/**
 * Diff unlocked IDs against an existing badges map — only return IDs not yet awarded.
 *
 * @param {string[]} unlockedIds
 * @param {Record<string, unknown> | null | undefined} existingBadges
 * @returns {string[]}
 */
function badgeIdsToAward(unlockedIds, existingBadges) {
  const existing =
    existingBadges && typeof existingBadges === "object" && !Array.isArray(existingBadges)
      ? existingBadges
      : {};
  return unlockedIds.filter((id) => {
    const entry = existing[id];
    return !(entry && typeof entry === "object");
  });
}

/**
 * After rollup commit: read affected users, award any newly unlocked v1 badges.
 * Soft-fail friendly — callers should wrap in try/catch.
 *
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   userIds: Iterable<string>,
 *   showDate: string,
 *   logger?: { info?: Function, warn?: Function },
 * }} params
 * @returns {Promise<{ usersChecked: number, awardsWritten: number }>}
 */
async function awardBadgesForUsers({
  db,
  admin,
  userIds,
  showDate,
  logger = undefined,
}) {
  const ids = [
    ...new Set(
      [...userIds]
        .map((u) => (typeof u === "string" ? u.trim() : ""))
        .filter(Boolean)
    ),
  ];
  if (ids.length === 0) {
    return { usersChecked: 0, awardsWritten: 0 };
  }

  const refs = ids.map((uid) => db.collection("users").doc(uid));
  const snaps = await db.getAll(...refs);

  let batch = db.batch();
  let opCount = 0;
  let awardsWritten = 0;
  const MAX_OPS = 450;

  const flush = async () => {
    if (opCount === 0) return;
    await batch.commit();
    batch = db.batch();
    opCount = 0;
  };

  for (let i = 0; i < snaps.length; i += 1) {
    const snap = snaps[i];
    if (!snap.exists) continue;
    const data = snap.data() || {};
    const unlocked = computeUnlockedBadgeIds({
      showsPlayed: data.showsPlayed,
      wins: data.wins,
    });
    const toAward = badgeIdsToAward(unlocked, data.badges);
    if (toAward.length === 0) continue;

    /** @type {Record<string, { awardedAt: unknown, scope: string, sourceThroughShow: string }>} */
    const patch = {};
    for (const id of toAward) {
      patch[id] = {
        awardedAt: admin.firestore.FieldValue.serverTimestamp(),
        scope: "career",
        sourceThroughShow: showDate,
      };
    }

    if (opCount + 1 > MAX_OPS) {
      await flush();
    }
    batch.set(
      snap.ref,
      { badges: patch },
      { merge: true }
    );
    opCount += 1;
    awardsWritten += toAward.length;
  }

  await flush();

  logger?.info?.("awardBadgesForUsers", {
    showDate,
    usersChecked: ids.length,
    awardsWritten,
  });

  return { usersChecked: ids.length, awardsWritten };
}

module.exports = {
  CAREER_BADGE_RULES,
  computeUnlockedBadgeIds,
  badgeIdsToAward,
  awardBadgesForUsers,
};
