#!/usr/bin/env node

/**
 * QA helper for issue #159:
 * Clone picks from one show date to another so historical-date scoring can be tested
 * even when the picks UI is intentionally locked for past shows.
 *
 * Dry-run by default. Pass --apply to write.
 *
 * Usage:
 *   cd functions
 *   node scripts/clonePicksForShowQa.js --from=2026-04-16 --to=2024-07-21
 *   node scripts/clonePicksForShowQa.js --from=2026-04-16 --to=2024-07-21 --userIds=uid1,uid2 --apply
 */

const admin = require("firebase-admin");

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
      "  node scripts/clonePicksForShowQa.js --from=YYYY-MM-DD --to=YYYY-MM-DD [--userIds=uid1,uid2] [--apply]",
      "",
      "Defaults to dry-run. Use --apply to write.",
    ].join("\n")
  );
  process.exit(message ? 1 : 0);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usageAndExit();

  const fromDate = String(args.from || "").trim();
  const toDate = String(args.to || "").trim();
  const apply = args.apply === true;
  const userIds =
    typeof args.userIds === "string" && args.userIds.trim()
      ? args.userIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

  if (!isShowDate(fromDate)) usageAndExit("--from must be YYYY-MM-DD");
  if (!isShowDate(toDate)) usageAndExit("--to must be YYYY-MM-DD");
  if (fromDate === toDate) usageAndExit("--from and --to must differ");

  admin.initializeApp();
  const db = admin.firestore();

  const sourceSnap = await db
    .collection("picks")
    .where("showDate", "==", fromDate)
    .get();

  if (sourceSnap.empty) {
    console.log(`No picks found for source showDate ${fromDate}.`);
    return;
  }

  const rows = sourceSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((row) => !userIds || userIds.includes(String(row.userId || "")));

  if (rows.length === 0) {
    console.log(
      userIds
        ? `No matching source picks for requested userIds on ${fromDate}.`
        : `No source picks available after filtering for ${fromDate}.`
    );
    return;
  }

  const planned = rows.map((row) => {
    const userId = String(row.userId || "").trim();
    if (!userId) return null;
    const targetId = `${toDate}_${userId}`;
    return {
      targetId,
      payload: {
        userId,
        handle: String(row.handle || "Anonymous"),
        showDate: toDate,
        updatedAt: new Date().toISOString(),
        score: 0,
        isGraded: false,
        picks: row.picks && typeof row.picks === "object" ? row.picks : {},
        pools: Array.isArray(row.pools) ? row.pools : [],
      },
    };
  }).filter(Boolean);

  console.log(
    [
      `Source show: ${fromDate}`,
      `Target show: ${toDate}`,
      `Docs planned: ${planned.length}`,
      `Mode: ${apply ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`,
    ].join("\n")
  );

  if (!apply) {
    console.log(
      "\nDry-run complete. Re-run with --apply to create/update target picks docs."
    );
    return;
  }

  const batch = db.batch();
  for (const item of planned) {
    const ref = db.collection("picks").doc(item.targetId);
    batch.set(ref, item.payload);
  }
  await batch.commit();

  console.log(
    `Wrote ${planned.length} picks docs for ${toDate}. You can now save official_setlists/${toDate} to trigger score recompute.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
