#!/usr/bin/env node
/**
 * Recovery helper (#326): reset prematurely finalized picks so a later
 * auto-finalize rollup can apply first-grade counters correctly.
 *
 * Default: dry-run (prints planned writes). Pass --apply to mutate picks.
 * Optional --reconcile-users: reverse user counters using the same
 * computePerPickRollup math as the original rollup (run after --apply or together).
 *
 * Usage:
 *   cd functions
 *   node scripts/resetPrematureGrade.js --showDate=2026-04-30
 *   node scripts/resetPrematureGrade.js --showDate=2026-04-30 --apply
 *   node scripts/resetPrematureGrade.js --showDate=2026-04-30 --apply --reconcile-users
 *
 * Do **not** use after post-encore auto-finalize has already re-rolled the show;
 * prefer a normal corrective rollup instead.
 */

const admin = require("firebase-admin");
const {
  computeGlobalMaxScore,
  computePerPickRollup,
  resolveTourKeyForDate,
} = require("../rollupSeasonAggregates");

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, ...rest] = arg.slice(2).split("=");
    out[k] = rest.length ? rest.join("=") : true;
  }
  return out;
}

function isShowDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function usageAndExit(message) {
  if (message) console.error(`\nError: ${message}\n`);
  console.log(
    [
      "Usage:",
      "  node scripts/resetPrematureGrade.js --showDate=YYYY-MM-DD [--apply] [--reconcile-users]",
      "",
      "  Default: dry-run. --apply writes pick resets.",
      "  --reconcile-users: decrement users.* using rollup parity (use with --apply).",
      "",
      "See docs/ROLLUP_RECOVERY_RUNBOOK.md before running on production.",
    ].join("\n")
  );
  process.exit(message ? 1 : 0);
}

function timestampToMs(ts) {
  if (!ts) return null;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts._seconds === "number") return ts._seconds * 1000;
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usageAndExit();

  const showDate = String(args.showDate || "").trim();
  const apply = args.apply === true;
  const reconcileUsers = args["reconcile-users"] === true;

  if (!isShowDate(showDate)) usageAndExit("--showDate must be YYYY-MM-DD");
  if (reconcileUsers && !apply) {
    usageAndExit("--reconcile-users requires --apply");
  }

  admin.initializeApp();
  const db = admin.firestore();

  const auditSnap = await db.collection("rollup_audit").doc(showDate).get();
  if (auditSnap.exists) {
    const a = auditSnap.data() || {};
    console.log("rollup_audit summary:", {
      trigger: a.trigger,
      processedPicks: a.processedPicks,
      totalPicks: a.totalPicks,
      callerUid: a.callerUid,
      forceEarlyFinalizeOverride: a.forceEarlyFinalizeOverride,
      lastRolledUpAtMs: timestampToMs(a.lastRolledUpAt),
    });
  } else {
    console.log("rollup_audit: (no document)");
  }

  const picksSnap = await db
    .collection("picks")
    .where("showDate", "==", showDate)
    .get();

  const graded = picksSnap.docs
    .map((d) => ({ ref: d.ref, id: d.id, ...d.data() }))
    .filter((row) => row.isGraded === true);

  if (graded.length === 0) {
    console.log(`No isGraded picks for ${showDate}. Nothing to reset.`);
    return;
  }

  const calSnap = await db.collection("show_calendar").doc("snapshot").get();
  const showDatesByTour = calSnap.exists
    ? (calSnap.data() || {}).showDatesByTour
    : null;
  const tourKey = resolveTourKeyForDate(showDate, showDatesByTour);

  const provisional = graded.map((p) => ({
    id: p.id,
    ...p,
    isGraded: true,
  }));
  const newScoresById = new Map();
  for (const p of graded) {
    const sc = typeof p.score === "number" ? p.score : 0;
    newScoresById.set(p.id, sc);
  }
  const newGlobalMax = computeGlobalMaxScore(provisional, newScoresById);

  /** @type {Map<string, { total: number, shows: number, wins: number, seasonTp: number, seasonShows: number, seasonWins: number }>} */
  const userDeltas = new Map();
  for (const p of graded) {
    const uid = String(p.userId || "");
    if (!uid) continue;
    const score = typeof p.score === "number" ? p.score : 0;
    const plan = computePerPickRollup({
      // Simulate pre-rollup pick shape so scoreDiff / winsDelta match the first-grade pass.
      pickData: { ...p, isGraded: false, winCredited: false },
      newScore: score,
      newGlobalMax,
    });
    const row = userDeltas.get(uid) || {
      total: 0,
      shows: 0,
      wins: 0,
      seasonTp: 0,
      seasonShows: 0,
      seasonWins: 0,
    };
    row.total += plan.scoreDiff;
    row.shows += plan.isFirstGrade ? 1 : 0;
    row.wins += plan.winsDelta;
    if (tourKey) {
      row.seasonTp += plan.scoreDiff;
      row.seasonShows += plan.isFirstGrade ? 1 : 0;
      row.seasonWins += plan.winsDelta;
    }
    userDeltas.set(uid, row);
  }

  console.log(
    `\nGraded picks to reset: ${graded.length}. apply=${apply} reconcileUsers=${reconcileUsers}\n`
  );
  for (const p of graded) {
    console.log(
      `  pick ${p.id} user=${p.userId} score=${p.score} winCredited=${p.winCredited === true}`
    );
  }
  console.log("\nPer-user rollup that would be reversed (--reconcile-users):");
  for (const [uid, d] of userDeltas) {
    console.log(
      `  ${uid}: totalPoints -${d.total}, showsPlayed -${d.shows}, wins -${d.wins}` +
        (tourKey
          ? ` | seasonStats.${tourKey}: tp -${d.seasonTp}, shows -${d.seasonShows}, wins -${d.seasonWins}`
          : "")
    );
  }

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to write pick resets.");
    return;
  }

  let batch = db.batch();
  let ops = 0;
  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const p of graded) {
    if (ops >= 450) await flush();
    batch.update(p.ref, {
      isGraded: false,
      score: 0,
      winCredited: false,
      gradedAt: admin.firestore.FieldValue.delete(),
    });
    ops += 1;
  }
  await flush();

  console.log(`\nApplied pick resets for ${graded.length} documents.`);

  if (!reconcileUsers) {
    console.log("Skipped user reconciliation (omit --reconcile-users).");
    return;
  }

  for (const [uid, d] of userDeltas) {
    if (ops >= 450) await flush();
    const ref = db.collection("users").doc(uid);
    const upd = {
      totalPoints: admin.firestore.FieldValue.increment(-d.total),
      showsPlayed: admin.firestore.FieldValue.increment(-d.shows),
      wins: admin.firestore.FieldValue.increment(-d.wins),
    };
    if (tourKey) {
      // Dotted paths so other `seasonStats.*` tour keys are not clobbered on merge.
      upd[`seasonStats.${tourKey}.totalPoints`] =
        admin.firestore.FieldValue.increment(-d.seasonTp);
      upd[`seasonStats.${tourKey}.shows`] =
        admin.firestore.FieldValue.increment(-d.seasonShows);
      upd[`seasonStats.${tourKey}.wins`] =
        admin.firestore.FieldValue.increment(-d.seasonWins);
    }
    batch.set(ref, upd, { merge: true });
    ops += 1;
  }
  await flush();
  console.log(`Applied user reconciliation for ${userDeltas.size} users.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
