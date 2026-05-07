/**
 * Rollup core (extracted from `rollupScoresForShow` callable in #266).
 *
 * Single source of truth for finalizing a show:
 *   - Read `official_setlists/{showDate}` (authoritative snapshot).
 *   - Recompute every matching pick's `score` via the same path as live
 *     scoring (`calculateTotalScore`).
 *   - Set `isGraded: true` (and `gradedAt` on first grade); increment
 *     `users.totalPoints`, `showsPlayed`, `wins`, and `seasonStats.{tourKey}`
 *     by the per-pick delta (`computePerPickRollup`).
 *   - Write a `rollup_audit/{showDate}` record with the caller identity and
 *     a `trigger` tag (`"manual"`, `"auto"`, or `"auto-reconcile"`).
 *
 * Callable wrapper (`functions/index.js::rollupScoresForShow`) passes
 * `trigger: "manual"` and the admin UID. Scheduled poller passes
 * `trigger: "auto"` (first finalize) or `"auto-reconcile"` (post-finalize
 * re-run after a Phish.net edit) and `callerUid: null`.
 *
 * The per-pick math is delta-based so repeated invocations reconcile
 * `users.totalPoints` rather than double-increment; this is why the same
 * core is safe to invoke from both manual and automatic paths.
 */

const {
  calculateTotalScore,
  persistableActualSetlistFromOfficialDoc,
  setlistHasAnyPlayedSong,
} = require("./scoringCore");
const {
  computeGlobalMaxScore,
  computePerPickRollup,
  resolveTourKeyForDate,
} = require("./rollupSeasonAggregates");
const {
  sendPostShowRollupPush,
  CLOSE_CALL_MAX_GAP,
} = require("./postShowRollupPush");

/** Same invariant as `adminRollupApi.js` / `profileApi.js`. */
const MAX_FIRESTORE_BATCH_WRITES = 500;

/**
 * @param {object} params
 * @param {import("firebase-admin").firestore.Firestore} params.db
 * @param {typeof import("firebase-admin")} params.admin
 * @param {string} params.showDate YYYY-MM-DD.
 * @param {string | null} [params.callerUid] Firebase UID of the caller (null for scheduler).
 * @param {"manual" | "auto" | "auto-reconcile"} [params.trigger] Audit tag.
 * @param {{ info?: Function, warn?: Function, error?: Function } | undefined} [params.logger]
 * @param {object | null} [params.manualTimingGate] Manual-callable only (#326): merged into `rollup_audit`.
 * @returns {Promise<{ processedPicks: number, skippedPicks: number, totalPicks: number, setlistExists: boolean, hollowSetlist?: boolean }>}
 */
async function runRollupForShow({
  db,
  admin,
  showDate,
  callerUid = null,
  trigger = "manual",
  logger = undefined,
  manualTimingGate = null,
}) {
  const setlistSnap = await db
    .collection("official_setlists")
    .doc(showDate)
    .get();
  if (!setlistSnap.exists) {
    // Surfaced to the manual callable as `failed-precondition`; the auto
    // path checks existence before invoking, so this branch is defensive.
    return {
      processedPicks: 0,
      skippedPicks: 0,
      totalPicks: 0,
      setlistExists: false,
    };
  }
  const setlistDoc = setlistSnap.data() || {};
  const actualSetlist = persistableActualSetlistFromOfficialDoc(setlistDoc);

  if (!setlistHasAnyPlayedSong(actualSetlist)) {
    logger?.warn?.("runRollupForShow: hollow setlist (no played songs); skipping rollup", {
      showDate,
      trigger,
    });
    return {
      processedPicks: 0,
      skippedPicks: 0,
      totalPicks: 0,
      setlistExists: true,
      hollowSetlist: true,
    };
  }

  const picksSnap = await db
    .collection("picks")
    .where("showDate", "==", showDate)
    .get();

  if (picksSnap.empty) {
    await writeRollupAuditDoc({
      db,
      admin,
      showDate,
      processedPicks: 0,
      skippedPicks: 0,
      totalPicks: 0,
      callerUid,
      trigger,
      logger,
      manualTimingGate,
    });
    logger?.info?.("runRollupForShow", {
      showDate,
      trigger,
      processedPicks: 0,
      skippedPicks: 0,
      totalPicks: 0,
      callerUid,
    });
    return {
      processedPicks: 0,
      skippedPicks: 0,
      totalPicks: 0,
      setlistExists: true,
    };
  }

  // Load show calendar once for `showDate` → `tourKey` (#244). If the
  // calendar is stale (missing the date), tour-scoped writes are skipped
  // with a warn; global totals/wins still materialize.
  const calendarSnap = await db.collection("show_calendar").doc("snapshot").get();
  const showDatesByTour = calendarSnap.exists
    ? (calendarSnap.data() || {}).showDatesByTour
    : null;
  const tourKey = resolveTourKeyForDate(showDate, showDatesByTour);
  if (!tourKey) {
    logger?.warn?.("runRollupForShow: tourKey missing for showDate", {
      showDate,
      trigger,
    });
  }

  // Pre-compute every pick's new score to derive `newGlobalMax` before any
  // write lands. Mirrors `src/shared/utils/showAggregation.js::reduceShowWinners`:
  // only graded, non-empty picks owned by an authenticated user are eligible;
  // `max === 0` credits nobody.
  /** @type {Map<string, number>} */
  const newScoresById = new Map();
  const provisionalPicks = [];
  for (const pickDoc of picksSnap.docs) {
    const pickData = pickDoc.data() || {};
    if (!pickData.userId) continue;
    const userPicks = pickData.picks || {};
    newScoresById.set(
      pickDoc.id,
      calculateTotalScore(userPicks, actualSetlist)
    );
    provisionalPicks.push({ id: pickDoc.id, ...pickData, isGraded: true });
  }
  const newGlobalMax = computeGlobalMaxScore(provisionalPicks, newScoresById);

  // Two writes per pick (pick doc + user doc, merged) — 500-op batch limit.
  const OPS_PER_PICK = 2;
  let batch = db.batch();
  let opCount = 0;
  let processedPicks = 0;
  let skippedPicks = 0;

  /** @type {{ kind: "win" | "nearMiss", userId: string, pickId: string, newScore?: number }[]} */
  const rollupPushHints = [];

  for (const pickDoc of picksSnap.docs) {
    const pickData = pickDoc.data() || {};
    if (!pickData.userId) {
      skippedPicks += 1;
      continue;
    }
    if (opCount + OPS_PER_PICK > MAX_FIRESTORE_BATCH_WRITES) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
    const newScore = newScoresById.get(pickDoc.id) || 0;
    const plan = computePerPickRollup({
      pickData,
      newScore,
      newGlobalMax,
    });

    if (pickData.userId && plan.isFirstGrade) {
      if (plan.newIsWin) {
        rollupPushHints.push({
          kind: "win",
          userId: pickData.userId,
          pickId: pickDoc.id,
        });
      } else if (
        plan.countsTowardSeason &&
        typeof newGlobalMax === "number" &&
        newGlobalMax > 0 &&
        !plan.newIsWin &&
        newScore >= 0 &&
        newGlobalMax - newScore <= CLOSE_CALL_MAX_GAP
      ) {
        rollupPushHints.push({
          kind: "nearMiss",
          userId: pickData.userId,
          pickId: pickDoc.id,
          newScore,
        });
      }
    }

    const pickUpdate = {
      score: newScore,
      isGraded: true,
      winCredited: plan.newIsWin,
    };
    if (plan.isFirstGrade) {
      pickUpdate.gradedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    batch.update(pickDoc.ref, pickUpdate);

    const userUpdate = {
      totalPoints: admin.firestore.FieldValue.increment(plan.scoreDiff),
      showsPlayed: admin.firestore.FieldValue.increment(
        plan.isFirstGrade ? 1 : 0
      ),
      wins: admin.firestore.FieldValue.increment(plan.winsDelta),
      seasonStatsSnapshotAt: admin.firestore.FieldValue.serverTimestamp(),
      seasonStatsThroughShow: showDate,
    };
    if (tourKey) {
      userUpdate.seasonStats = {
        [tourKey]: {
          totalPoints: admin.firestore.FieldValue.increment(plan.scoreDiff),
          shows: admin.firestore.FieldValue.increment(
            plan.isFirstGrade ? 1 : 0
          ),
          wins: admin.firestore.FieldValue.increment(plan.winsDelta),
        },
      };
    }
    batch.set(
      db.collection("users").doc(pickData.userId),
      userUpdate,
      { merge: true }
    );
    opCount += OPS_PER_PICK;
    processedPicks += 1;
  }

  if (opCount > 0) {
    await batch.commit();
  }

  const totalPicks = picksSnap.size;
  await writeRollupAuditDoc({
    db,
    admin,
    showDate,
    processedPicks,
    skippedPicks,
    totalPicks,
    callerUid,
    trigger,
    logger,
    manualTimingGate,
  });
  logger?.info?.("runRollupForShow", {
    showDate,
    trigger,
    processedPicks,
    skippedPicks,
    totalPicks,
    callerUid,
  });

  if (rollupPushHints.length > 0) {
    try {
      await sendPostShowRollupPush({
        db,
        admin,
        showDate,
        newGlobalMax,
        hints: rollupPushHints,
        logger,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger?.warn?.("runRollupForShow.postShowPush failed", {
        showDate,
        trigger,
        msg,
      });
    }
  }

  return {
    processedPicks,
    skippedPicks,
    totalPicks,
    setlistExists: true,
  };
}

/**
 * Append-style audit write for every rollup invocation.
 *
 * Standalone top-level collection (not under `official_setlists`) so it never
 * re-triggers `gradePicksOnSetlistWrite`. Soft-fails so a transient audit
 * write failure never loses a successful grading pass.
 */
async function writeRollupAuditDoc({
  db,
  admin,
  showDate,
  processedPicks,
  skippedPicks,
  totalPicks,
  callerUid,
  trigger,
  logger,
  manualTimingGate = null,
}) {
  try {
    const timingExtras =
      trigger === "manual" && manualTimingGate && typeof manualTimingGate === "object"
        ? {
            manualTimingReason: manualTimingGate.reason ?? null,
            showStatusAtManualFinalize: manualTimingGate.showStatus ?? null,
            forceEarlyFinalizeOverride:
              manualTimingGate.forceEarlyFinalizeOverride === true,
          }
        : {};
    await db
      .collection("rollup_audit")
      .doc(showDate)
      .set(
        {
          lastRolledUpAt: admin.firestore.FieldValue.serverTimestamp(),
          processedPicks,
          skippedPicks,
          totalPicks,
          callerUid: callerUid || null,
          trigger: trigger || "manual",
          ...timingExtras,
        },
        { merge: true }
      );
  } catch (e) {
    const msg = e?.message || String(e);
    logger?.warn?.("runRollupForShow.auditWrite failed", {
      showDate,
      trigger,
      msg,
    });
  }
}

module.exports = {
  MAX_FIRESTORE_BATCH_WRITES,
  runRollupForShow,
  writeRollupAuditDoc,
};
