const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const {
  syncPhishnetShowCalendarToFirestore,
} = require("./phishnetShowCalendar");
const {
  syncPhishnetSongCatalogToStorage,
} = require("./phishnetSongCatalog");
const {
  candidateShowDates,
  isWithinLiveSetlistPollWindow,
  parseShowCalendarSnapshotToDateSet,
  pollSingleShowDate,
  scheduledCandidateShowDates,
} = require("./phishnetLiveSetlistAutomation");
const {
  parseSuperAdminUidsEnv,
  resolveAdminCallerRole,
  resolveSetAdminClaimCallerRole,
} = require("./adminAuth");
const {
  MAX_POOL_DELETE_BATCH_WRITES,
  findPoolPickActivity,
  parseShowCalendarDates,
} = require("./poolDelete");
const {
  calculateTotalScore,
  actualSetlistFromOfficialDoc,
} = require("./scoringCore");
const { runBackfill } = require("./backfillBustoutsCore");
const {
  computeGlobalMaxScore,
  computePerPickRollup,
  resolveTourKeyForDate,
} = require("./rollupSeasonAggregates");

const phishnetApiKey = defineSecret("PHISHNET_API_KEY");

admin.initializeApp();
const db = admin.firestore();

/**
 * Gate an admin-only callable on the `admin: true` custom claim (issue #139).
 * PR B dropped the legacy email fallback — the claim is the only signal. Use
 * `setAdminClaim` to grant the claim (bootstrap via `SUPER_ADMIN_UIDS`).
 */
function assertAdminClaim(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  if (!resolveAdminCallerRole(request.auth)) {
    throw new HttpsError(
      "permission-denied",
      "Only an admin can perform this action."
    );
  }
}

function assertShowDateString(showDate) {
  if (
    typeof showDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(showDate.trim())
  ) {
    throw new HttpsError(
      "invalid-argument",
      "showDate must be a YYYY-MM-DD string."
    );
  }
  return showDate.trim();
}

/** Firestore batch write limit (same invariant as `adminRollupApi.js` / `profileApi.js`). */
const MAX_FIRESTORE_BATCH_WRITES = 500;

async function recomputeLiveScoresForShow(showDate, actualSetlistFromWrite = null) {
  const setlistDoc =
    actualSetlistFromWrite ||
    (() => {
      throw new Error("actualSetlistFromWrite required when no Firestore fallback");
    })();
  const picksSnap = await db
    .collection("picks")
    .where("showDate", "==", showDate)
    .get();

  if (picksSnap.empty) {
    return { updatedPicks: 0 };
  }

  let batch = db.batch();
  let opCount = 0;
  let updatedPicks = 0;

  for (const pickDoc of picksSnap.docs) {
    if (opCount >= MAX_FIRESTORE_BATCH_WRITES) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
    const pickData = pickDoc.data() || {};
    const userPicks = pickData.picks || {};
    const score = calculateTotalScore(userPicks, setlistDoc);

    // Live scoring only: do not set gradedAt here (pool season uses isGraded from rollup).
    const update = { score };
    if (pickData.isGraded !== true) {
      update.gradedAt = admin.firestore.FieldValue.delete();
    }
    batch.update(pickDoc.ref, update);
    opCount += 1;
    updatedPicks += 1;
  }

  if (opCount > 0) {
    await batch.commit();
  }
  return { updatedPicks };
}

exports.gradePicksOnSetlistWrite = onDocumentWritten(
  "official_setlists/{showDate}",
  async (event) => {
    if (!event.data.after.exists) {
      return null;
    }

    const showDate = event.params.showDate;
    const setlistDoc = event.data.after.data() || {};
    const actualSetlist = actualSetlistFromOfficialDoc(setlistDoc);

    await recomputeLiveScoresForShow(showDate, actualSetlist);
    return null;
  }
);

const PHISHNET_FUNCTIONS_REGION = "us-central1";

exports.refreshLiveScoresForShow = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    assertAdminClaim(request);
    const showDate = assertShowDateString(request.data?.showDate);

    const setlistSnap = await db
      .collection("official_setlists")
      .doc(showDate)
      .get();
    if (!setlistSnap.exists) {
      throw new HttpsError(
        "failed-precondition",
        `official_setlists/${showDate} does not exist. Save the setlist first.`
      );
    }
    const setlistDoc = setlistSnap.data() || {};
    const actualSetlist = actualSetlistFromOfficialDoc(setlistDoc);
    const result = await recomputeLiveScoresForShow(showDate, actualSetlist);
    return { ok: true, ...result };
  }
);

/**
 * Admin ""Finalize and rollup"" for a show — server-side replacement for the
 * client batched writes in `src/features/admin/api/adminRollupApi.js` (#139).
 *
 * Reads `official_setlists/{showDate}`, loads the Storage song catalog once,
 * and for every `picks` doc with that `showDate`:
 *   - computes final `score` using the same path as `gradePicksOnSetlistWrite`
 *   - sets `isGraded: true` (with `gradedAt` on the first grade)
 *   - increments `users.totalPoints` by the score diff and `users.showsPlayed`
 *     by 1 on first-grade (mirrors the client batch exactly).
 *
 * Uses Admin SDK; rules don't apply here. This lets PR B tighten Firestore
 * rules on `picks` + `users` without breaking Finalize.
 */
exports.rollupScoresForShow = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    assertAdminClaim(request);
    const showDate = assertShowDateString(request.data?.showDate);

    const setlistSnap = await db
      .collection("official_setlists")
      .doc(showDate)
      .get();
    if (!setlistSnap.exists) {
      throw new HttpsError(
        "failed-precondition",
        `official_setlists/${showDate} does not exist. Save the setlist first.`
      );
    }
    const setlistDoc = setlistSnap.data() || {};
    const actualSetlist = actualSetlistFromOfficialDoc(setlistDoc);

    const picksSnap = await db
      .collection("picks")
      .where("showDate", "==", showDate)
      .get();

    const callerUid = request.auth?.uid || null;

    if (picksSnap.empty) {
      await writeRollupAuditDoc({
        showDate,
        processedPicks: 0,
        skippedPicks: 0,
        totalPicks: 0,
        callerUid,
      });
      logger.info("rollupScoresForShow", {
        showDate,
        processedPicks: 0,
        skippedPicks: 0,
        totalPicks: 0,
        callerUid,
      });
      return {
        ok: true,
        processedPicks: 0,
        skippedPicks: 0,
        totalPicks: 0,
      };
    }

    // Load the show calendar once so we can map `showDate` → `tourKey` for
    // the `users.{uid}.seasonStats.{tourKey}` materialization (#244). If
    // the calendar is stale (missing the date), the tour-scoped write is
    // skipped and logged — global totals/wins still materialize.
    const calendarSnap = await db
      .collection("show_calendar")
      .doc("snapshot")
      .get();
    const showDatesByTour = calendarSnap.exists
      ? (calendarSnap.data() || {}).showDatesByTour
      : null;
    const tourKey = resolveTourKeyForDate(showDate, showDatesByTour);
    if (!tourKey) {
      logger.warn("rollupScoresForShow: tourKey missing for showDate", {
        showDate,
      });
    }

    // Pre-compute every pick's new score in one pass so we can derive the
    // show's global max (for the wins pass) before issuing any writes.
    // Mirrors `src/shared/utils/showAggregation.js::reduceShowWinners`: only
    // graded, non-empty picks owned by an authenticated user are eligible;
    // `max === 0` credits nobody.
    /** @type {Map<string, number>} */
    const newScoresById = new Map();
    /** @type {Array<Record<string, unknown> & { id: string }>} */
    const provisionalPicks = [];
    for (const pickDoc of picksSnap.docs) {
      const pickData = pickDoc.data() || {};
      if (!pickData.userId) continue;
      const userPicks = pickData.picks || {};
      // Compute against the hypothetical "graded" view so the max reflects
      // the post-commit state even for picks being graded for the first time.
      newScoresById.set(
        pickDoc.id,
        calculateTotalScore(userPicks, actualSetlist)
      );
      provisionalPicks.push({ id: pickDoc.id, ...pickData, isGraded: true });
    }
    const newGlobalMax = computeGlobalMaxScore(provisionalPicks, newScoresById);

    // Three writes per pick (picks doc + users doc + users doc #244 extras),
    // but the users doc is merged into a single `set` — so the actual op
    // count is still 2 per pick. The pick update now also carries
    // `winCredited` so re-runs can diff cleanly against the prior state.
    const OPS_PER_PICK = 2;
    let batch = db.batch();
    let opCount = 0;
    let processedPicks = 0;
    let skippedPicks = 0;

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
      // `seasonStats.{tourKey}` mirrors the three global counters so
      // tour-scoped surfaces (#219 Tour standings, Profile tour card) can
      // read the user doc directly without re-filtering per-show picks.
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
      showDate,
      processedPicks,
      skippedPicks,
      totalPicks,
      callerUid,
    });
    logger.info("rollupScoresForShow", {
      showDate,
      processedPicks,
      skippedPicks,
      totalPicks,
      callerUid,
    });

    return {
      ok: true,
      processedPicks,
      skippedPicks,
      totalPicks,
    };
  }
);

/**
 * Writes an audit record to `rollup_audit/{showDate}` with the counts and
 * timestamp of the most recent `rollupScoresForShow` invocation. Standalone
 * top-level collection (not under `official_setlists`) so it never re-triggers
 * `gradePicksOnSetlistWrite`. PR B will add a rule that makes this collection
 * admin-read-only; Admin SDK writes bypass rules so this still works under
 * tightened policy. Soft-fails on error so a transient audit write failure
 * never loses a successful grading pass.
 */
async function writeRollupAuditDoc({
  showDate,
  processedPicks,
  skippedPicks,
  totalPicks,
  callerUid,
}) {
  try {
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
        },
        { merge: true }
      );
  } catch (e) {
    const msg = e?.message || String(e);
    logger.warn("rollupScoresForShow.auditWrite failed", {
      showDate,
      msg,
    });
  }
}

/**
 * Grant or revoke the `admin: true` Firebase custom claim on a target user.
 *
 * Authorization rules (PR B — claim-only):
 *   - Caller must be signed in.
 *   - Caller must either already hold `admin: true`, **or** have a UID listed
 *     in the `SUPER_ADMIN_UIDS` env var (comma-separated). `SUPER_ADMIN_UIDS`
 *     is the bootstrap / break-glass path — required on a fresh project or
 *     after an accidental revocation removes the last admin claim holder.
 *
 * Caller can set the claim on their own UID (self-bootstrap) or on another
 * UID (delegate). The target user must refresh their ID token before the new
 * claim is visible to the client (`getIdTokenResult(true)`).
 */
exports.setAdminClaim = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }
    const callerUid = request.auth.uid;
    const superAdminUids = parseSuperAdminUidsEnv();
    const role = resolveSetAdminClaimCallerRole(request.auth, superAdminUids);
    if (!role) {
      throw new HttpsError(
        "permission-denied",
        "Only a super-admin or existing admin can set admin claims."
      );
    }

    const rawTargetUid = request.data?.targetUid;
    const targetUid =
      typeof rawTargetUid === "string" && rawTargetUid.trim()
        ? rawTargetUid.trim()
        : callerUid;
    const grant = request.data?.admin;
    if (typeof grant !== "boolean") {
      throw new HttpsError(
        "invalid-argument",
        "`admin` must be a boolean (true to grant, false to revoke)."
      );
    }

    let existingClaims = {};
    try {
      const existing = await admin.auth().getUser(targetUid);
      existingClaims = existing.customClaims || {};
    } catch (e) {
      // Surface the real error instead of squashing everything to "not-found".
      // Expected firebase-admin error codes include `auth/user-not-found`,
      // `auth/insufficient-permission`, and generic network errors. We still
      // proceed to `setCustomUserClaims` for self-bootstrap so a transient
      // `getUser` permission hiccup doesn't block the first admin — the
      // caller's UID was already validated by the callable auth layer above.
      const code =
        typeof e?.code === "string" ? e.code : e?.errorInfo?.code || "unknown";
      const msg = e?.message || String(e);
      logger.warn("setAdminClaim.getUser failed", {
        targetUid,
        code,
        msg,
      });
      if (targetUid !== callerUid) {
        // Only fail hard when delegating to someone else — we can't be sure
        // the target really exists in that case.
        throw new HttpsError(
          code === "auth/insufficient-permission"
            ? "permission-denied"
            : "not-found",
          `Lookup failed for uid=${targetUid} (${code}): ${msg}`
        );
      }
    }
    const nextClaims = { ...existingClaims, admin: grant };
    if (!grant) {
      delete nextClaims.admin;
    }
    try {
      await admin.auth().setCustomUserClaims(targetUid, nextClaims);
    } catch (e) {
      const code =
        typeof e?.code === "string" ? e.code : e?.errorInfo?.code || "unknown";
      const msg = e?.message || String(e);
      logger.error("setAdminClaim.setCustomUserClaims failed", {
        targetUid,
        code,
        msg,
      });
      throw new HttpsError(
        code === "auth/insufficient-permission"
          ? "permission-denied"
          : "internal",
        `setCustomUserClaims failed for uid=${targetUid} (${code}): ${msg}`
      );
    }

    logger.info("setAdminClaim", {
      callerUid,
      targetUid,
      grant,
      callerRole: role,
    });

    return { ok: true, targetUid, admin: grant };
  }
);

/**
 * Server-side delete of a pool with full member cleanup (issue #138).
 *
 * Required because Firestore rules only let a user update their own `users`
 * doc — a pool owner cannot clear the pool id from every other member's
 * `users.pools` array from the client. Admin SDK bypasses rules; authz is
 * enforced here.
 *
 * Guarantees:
 *   - Caller must be signed in (`unauthenticated` otherwise).
 *   - Caller must match `pools/{poolId}.ownerId` (`permission-denied` otherwise).
 *   - Pool must have **no qualifying pick activity**; otherwise the client is
 *     told to archive instead (`failed-precondition`). Activity is the same
 *     rule as the client walk (`pickDocHasPoolActivity`) using
 *     `show_calendar/snapshot` as the authoritative date source.
 *   - Every member of `pools/{poolId}.members` has `poolId` removed from
 *     `users/{uid}.pools` via `FieldValue.arrayRemove`, then the pool doc
 *     is deleted in the same logical operation (batched; split at
 *     `MAX_POOL_DELETE_BATCH_WRITES`).
 *
 * NB: We intentionally re-walk the calendar server-side instead of trusting
 * a client-provided list, so a stale client can't bypass the activity guard.
 */
exports.deletePoolWithCleanup = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }
    const callerUid = request.auth.uid;
    const rawPoolId = request.data?.poolId;
    const poolId =
      typeof rawPoolId === "string" && rawPoolId.trim() ? rawPoolId.trim() : "";
    if (!poolId) {
      throw new HttpsError("invalid-argument", "poolId is required.");
    }

    const poolRef = db.collection("pools").doc(poolId);
    const poolSnap = await poolRef.get();
    if (!poolSnap.exists) {
      throw new HttpsError("not-found", `Pool ${poolId} does not exist.`);
    }
    const poolData = poolSnap.data() || {};
    const ownerId =
      typeof poolData.ownerId === "string" ? poolData.ownerId.trim() : "";
    if (!ownerId || ownerId !== callerUid) {
      throw new HttpsError(
        "permission-denied",
        "Only the pool owner can delete this pool."
      );
    }

    const rawMembers = Array.isArray(poolData.members) ? poolData.members : [];
    const memberIds = [
      ...new Set(
        rawMembers
          .filter((u) => typeof u === "string" && u.trim())
          .map((u) => u.trim())
      ),
    ];
    if (!memberIds.includes(ownerId)) memberIds.push(ownerId);

    const calendarSnap = await db
      .collection("show_calendar")
      .doc("snapshot")
      .get();
    const showDates = parseShowCalendarDates(
      calendarSnap.exists ? calendarSnap.data() : null
    );

    const hasActivity = await findPoolPickActivity({
      db,
      poolId,
      memberIds,
      showDates,
    });
    if (hasActivity) {
      throw new HttpsError(
        "failed-precondition",
        "This pool has pick history. Archive it instead of deleting."
      );
    }

    // Split at the Firestore 500-write batch limit. Pool delete is its own
    // write, so we reserve one slot for it before committing.
    let batch = db.batch();
    let opCount = 0;
    let memberUpdates = 0;
    for (const uid of memberIds) {
      if (opCount >= MAX_POOL_DELETE_BATCH_WRITES) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
      batch.set(
        db.collection("users").doc(uid),
        { pools: admin.firestore.FieldValue.arrayRemove(poolId) },
        { merge: true }
      );
      opCount += 1;
      memberUpdates += 1;
    }
    if (opCount >= MAX_POOL_DELETE_BATCH_WRITES) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
    batch.delete(poolRef);
    opCount += 1;
    if (opCount > 0) await batch.commit();

    logger.info("deletePoolWithCleanup", {
      poolId,
      callerUid,
      memberUpdates,
    });

    return { ok: true, poolId, memberUpdates };
  }
);

exports.scheduledPhishnetLiveSetlistPoll = onSchedule(
  {
    // Wake every 3m; in-window spacing vs Phish.net is enforced by per-date
    // `nextPollAt` (3–5m jitter after each scheduled fetch — issue #180).
    schedule: "*/3 * * * *",
    timeZone: "America/New_York",
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
  },
  async () => {
    const key = phishnetApiKey.value();
    if (!key || !String(key).trim()) {
      logger.error(
        "scheduledPhishnetLiveSetlistPoll: PHISHNET_API_KEY missing; skip poll."
      );
      return null;
    }
    const now = new Date();
    if (!isWithinLiveSetlistPollWindow(now)) {
      logger.info("scheduledPhishnetLiveSetlistPoll: outside 4pm–3am ET window; skip.");
      return null;
    }
    const calSnap = await db.collection("show_calendar").doc("snapshot").get();
    const calendarSet = parseShowCalendarSnapshotToDateSet(
      calSnap.exists ? calSnap.data() : null
    );
    if (!calendarSet) {
      logger.info(
        "scheduledPhishnetLiveSetlistPoll: show_calendar snapshot missing/empty; strict skip (no Phish.net)."
      );
      return null;
    }
    const dates = scheduledCandidateShowDates(now, calendarSet);
    if (!dates.length) {
      logger.info(
        "scheduledPhishnetLiveSetlistPoll: no matching show dates in calendar; skip."
      );
      return null;
    }
    const started = Date.now();
    const results = [];
    for (const showDate of dates) {
      const result = await pollSingleShowDate({
        db,
        admin,
        showDate,
        apiKey: String(key).trim(),
        logger,
        force: false,
      });
      results.push(result);
    }
    logger.info("live setlist poll cycle", {
      dates,
      results,
      durationMs: Date.now() - started,
    });
    return null;
  }
);

exports.setLiveSetlistAutomationState = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    assertAdminClaim(request);
    const showDate = assertShowDateString(request.data?.showDate);
    const enabled = request.data?.enabled;
    if (typeof enabled !== "boolean") {
      throw new HttpsError("invalid-argument", "enabled must be boolean.");
    }
    await db
      .collection("live_setlist_automation")
      .doc(showDate)
      .set(
        {
          showDate,
          enabled,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: request.auth.token?.email ?? null,
          pausedAt: enabled
            ? admin.firestore.FieldValue.delete()
            : admin.firestore.FieldValue.serverTimestamp(),
          pausedBy: enabled
            ? admin.firestore.FieldValue.delete()
            : request.auth.token?.email ?? null,
        },
        { merge: true }
      );
    return { ok: true, showDate, enabled };
  }
);

exports.pollLiveSetlistNow = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    assertAdminClaim(request);
    const key = phishnetApiKey.value();
    if (!key || !String(key).trim()) {
      throw new HttpsError(
        "failed-precondition",
        "Phish.net API key is not configured (set secret PHISHNET_API_KEY)."
      );
    }
    const explicitShowDate = request.data?.showDate;
    const dates =
      explicitShowDate == null
        ? candidateShowDates(new Date())
        : [assertShowDateString(explicitShowDate)];
    const started = Date.now();
    const results = [];
    for (const showDate of dates) {
      const result = await pollSingleShowDate({
        db,
        admin,
        showDate,
        apiKey: String(key).trim(),
        logger,
        force: true,
        requestorEmail: request.auth.token?.email ?? null,
      });
      if (result.changed) {
        const setlistSnap = await db.collection("official_setlists").doc(showDate).get();
        const setlistDoc = setlistSnap.data() || {};
        const actualSetlist = actualSetlistFromOfficialDoc(setlistDoc);
        result.updatedPicks = (
          await recomputeLiveScoresForShow(showDate, actualSetlist)
        ).updatedPicks;
      }
      results.push(result);
    }
    logger.info("manual live setlist poll", {
      dates,
      results,
      durationMs: Date.now() - started,
    });
    return { ok: true, dates, results };
  }
);

/**
 * Secure proxy for Phish.net v5 setlists/showdate (epic #42, issue #146).
 * Secret: `PHISHNET_API_KEY` via `firebase functions:secrets:set PHISHNET_API_KEY`
 */
exports.getPhishnetSetlist = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
    // Gen 2 callables run on Cloud Run; without public invoker, browsers get CORS preflight failures
    // (no Access-Control-Allow-Origin) and FirebaseError: internal. Auth is still enforced in handler.
    invoker: "public",
    // Avoid App Check blocking admin fetch from localhost before debug tokens are registered.
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      assertAdminClaim(request);

      const showDate = request.data?.showDate;
      if (
        typeof showDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(showDate.trim())
      ) {
        throw new HttpsError(
          "invalid-argument",
          "showDate must be a YYYY-MM-DD string."
        );
      }

      const key = phishnetApiKey.value();
      if (!key || !String(key).trim()) {
        throw new HttpsError(
          "failed-precondition",
          "Phish.net API key is not configured (set secret PHISHNET_API_KEY)."
        );
      }

      const url = `https://api.phish.net/v5/setlists/showdate/${encodeURIComponent(
        showDate.trim()
      )}.json?apikey=${encodeURIComponent(String(key).trim())}`;

      let res;
      try {
        res = await fetch(url, { headers: { Accept: "application/json" } });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error to Phish.net";
        // Use `unavailable` (not `internal`) so the client SDK forwards the message; `internal` is redacted.
        throw new HttpsError("unavailable", msg);
      }

      let bodyText;
      try {
        bodyText = await res.text();
      } catch (e) {
        throw new HttpsError(
          "unavailable",
          "Failed to read Phish.net response."
        );
      }

      if (!res.ok) {
        throw new HttpsError(
          "failed-precondition",
          `Phish.net HTTP ${res.status}: ${bodyText.slice(0, 240)}`
        );
      }

      let data;
      try {
        data = JSON.parse(bodyText);
      } catch {
        throw new HttpsError(
          "failed-precondition",
          "Phish.net returned non-JSON."
        );
      }

      // Phish.net: success is `error: false`, `0`, or `"0"`; numeric ≥1 (e.g. 2) = invalid key, etc.
      const apiErr = data && typeof data === "object" ? data.error : undefined;
      const phishNetOk =
        apiErr === undefined ||
        apiErr === null ||
        apiErr === false ||
        apiErr === 0 ||
        apiErr === "0";
      if (!phishNetOk) {
        const apiMsg =
          typeof data.error_message === "string"
            ? data.error_message
            : "Phish.net API error.";
        throw new HttpsError("failed-precondition", apiMsg);
      }

      return data;
    } catch (e) {
      if (e instanceof HttpsError) {
        throw e;
      }
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("getPhishnetSetlist unexpected error", msg, e);
      // Map unexpected throws (e.g. secret/param) to a code whose message is not stripped client-side.
      throw new HttpsError(
        "failed-precondition",
        `getPhishnetSetlist failed: ${msg}`
      );
    }
  }
);

/**
 * Backfill `official_setlists/{showDate}.bustouts` for a batch of shows (#214).
 *
 * For each show date, this callable:
 *   1. Re-fetches the Phish.net setlist by showdate (rows include per-row
 *      pre-show `gap` — the definitional bustout metric).
 *   2. Derives `bustouts` from rows with `gap >= BUSTOUT_MIN_GAP`.
 *   3. Writes `bustouts` onto `official_setlists/{showDate}` via merge, which
 *      triggers `gradePicksOnSetlistWrite` → live-score recompute.
 *   4. When a show is graded (`isGraded: true` on any pick), also runs
 *      `rollupScoresForShow` semantics inline so `users.totalPoints` reconciles
 *      by the score delta.
 *
 * Safe to run multiple times — write is idempotent when the snapshot matches.
 *
 * Input: `{ showDates: string[] }` (each `YYYY-MM-DD`) OR `{ mode: "missing" }`
 * to scan `official_setlists` for docs missing `bustouts`.
 */
exports.backfillBustoutsForShows = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    assertAdminClaim(request);

    const key = phishnetApiKey.value();
    if (!key || !String(key).trim()) {
      throw new HttpsError(
        "failed-precondition",
        "Phish.net API key is not configured (set secret PHISHNET_API_KEY)."
      );
    }

    const explicitDates = request.data?.showDates;
    const mode = request.data?.mode === "missing" ? "missing" : undefined;
    if (
      !(Array.isArray(explicitDates) && explicitDates.length > 0) &&
      mode !== "missing"
    ) {
      throw new HttpsError(
        "invalid-argument",
        'Pass { showDates: ["YYYY-MM-DD", ...] } or { mode: "missing" }.'
      );
    }

    try {
      const { results } = await runBackfill({
        db,
        admin,
        logger,
        phishnetApiKey: key,
        showDates: Array.isArray(explicitDates) ? explicitDates : undefined,
        mode,
        updatedBy: request.auth?.token?.email || "backfill-bustouts",
      });
      logger.info("backfillBustoutsForShows callable complete", {
        callerUid: request.auth?.uid || null,
      });
      return { ok: true, results };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/^showDate must be a YYYY-MM-DD/.test(msg)) {
        throw new HttpsError("invalid-argument", msg);
      }
      throw e;
    }
  }
);

/**
 * Monthly sync: Phish.net v5 `shows/showyear/{year}` → Firestore `show_calendar/snapshot` (issue #160).
 * First of each month 6:00 America/New_York. Same secret as setlist proxy; key never sent to browsers.
 */
exports.scheduledPhishnetShowCalendar = onSchedule(
  {
    schedule: "0 6 1 * *",
    timeZone: "America/New_York",
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
  },
  async () => {
    const key = phishnetApiKey.value();
    if (!key || !String(key).trim()) {
      logger.error(
        "scheduledPhishnetShowCalendar: PHISHNET_API_KEY missing; skip sync."
      );
      return null;
    }
    await syncPhishnetShowCalendarToFirestore(db, String(key).trim(), {
      logger,
    });
    return null;
  }
);

/**
 * Admin-only on-demand refresh of `show_calendar/snapshot` (issue #160).
 */
exports.refreshPhishnetShowCalendar = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      assertAdminClaim(request);

      const key = phishnetApiKey.value();
      if (!key || !String(key).trim()) {
        throw new HttpsError(
          "failed-precondition",
          "Phish.net API key is not configured (set secret PHISHNET_API_KEY)."
        );
      }

      const result = await syncPhishnetShowCalendarToFirestore(
        db,
        String(key).trim(),
        { logger }
      );
      return {
        ok: true,
        showCount: result.showCount,
        groupCount: result.groupCount,
      };
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("refreshPhishnetShowCalendar unexpected error", msg, e);
      throw new HttpsError(
        "failed-precondition",
        `refreshPhishnetShowCalendar failed: ${msg}`
      );
    }
  }
);

/**
 * Weekly sync: Phish.net v5 `songs.json` → Storage `song-catalog.json` (issue #158).
 * Sunday 7:00 America/New_York. Same secret as other Phish.net callables.
 */
exports.scheduledPhishnetSongCatalog = onSchedule(
  {
    schedule: "0 7 * * 0",
    timeZone: "America/New_York",
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
  },
  async () => {
    const key = phishnetApiKey.value();
    if (!key || !String(key).trim()) {
      logger.error(
        "scheduledPhishnetSongCatalog: PHISHNET_API_KEY missing; skip sync."
      );
      return null;
    }
    try {
      const result = await syncPhishnetSongCatalogToStorage(
        String(key).trim(),
        { logger }
      );
      logger.info("scheduledPhishnetSongCatalog public URL", result.publicUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("scheduledPhishnetSongCatalog failed", msg, e);
    }
    return null;
  }
);

/**
 * Admin-only on-demand refresh of Storage `song-catalog.json` (issue #158).
 */
exports.refreshPhishnetSongCatalog = onCall(
  {
    region: PHISHNET_FUNCTIONS_REGION,
    secrets: [phishnetApiKey],
    invoker: "public",
    enforceAppCheck: false,
  },
  async (request) => {
    try {
      assertAdminClaim(request);

      const key = phishnetApiKey.value();
      if (!key || !String(key).trim()) {
        throw new HttpsError(
          "failed-precondition",
          "Phish.net API key is not configured (set secret PHISHNET_API_KEY)."
        );
      }

      const result = await syncPhishnetSongCatalogToStorage(
        String(key).trim(),
        { logger }
      );
      return {
        ok: true,
        songCount: result.songCount,
        publicUrl: result.publicUrl,
      };
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("refreshPhishnetSongCatalog unexpected error", msg, e);
      throw new HttpsError(
        "failed-precondition",
        `refreshPhishnetSongCatalog failed: ${msg}`
      );
    }
  }
);
