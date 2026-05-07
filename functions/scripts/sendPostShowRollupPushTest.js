#!/usr/bin/env node
/**
 * QA: send the **real** post-show rollup push templates (same code path as production
 * `sendPostShowRollupPush` in postShowRollupPush.js) without running finalize/rollup.
 *
 * Uses your Firestore user doc (`notificationPrefs`), real `private_fcmTokens`, and
 * writes `fcm_notification_log` on success — same as production.
 *
 * Usage (from `functions/`):
 *   node scripts/sendPostShowRollupPushTest.js --uid=<firebase-uid> --dry-run
 *   node scripts/sendPostShowRollupPushTest.js --uid=<firebase-uid> --apply
 *
 * Optional:
 *   --kind=win|nearMiss     Default win (nearMiss uses --global-max in the body).
 *   --show-date=YYYY-MM-DD  Default 2099-12-31 (obviously fake; avoids colliding with real shows).
 *   --pick-id=<id>          Default qa_post_show_<timestamp> so each run is idempotent-clean.
 *   --global-max=<n>        For nearMiss body only (default 9).
 *   --project=<project-id>  Override project (else GOOGLE_CLOUD_PROJECT / .env VITE_FIREBASE_PROJECT_ID).
 *
 * Auth: `gcloud auth application-default login` (same as sendPushCanaryForUser.js).
 *
 * Re-runs: after a successful send, the same --pick-id is skipped (log exists). Use a new
 * --pick-id or delete the matching `fcm_notification_log` doc to test again.
 */

const admin = require("firebase-admin");
const fs = require("node:fs");
const path = require("node:path");

const { sendPostShowRollupPush } = require("../postShowRollupPush");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, ...rest] = arg.slice(2).split("=");
    out[k] = rest.length ? rest.join("=") : true;
  }
  return out;
}

function usageAndExit(message) {
  if (message) console.error(`\nError: ${message}\n`);
  console.log(
    [
      "Usage:",
      "  node scripts/sendPostShowRollupPushTest.js --uid=<firebase-uid> [--dry-run|--apply]",
      "",
      "  --kind=win|nearMiss   (default win)",
      "  --show-date=YYYY-MM-DD",
      "  --pick-id=...         (default unique qa_post_show_<ms>)",
      "  --global-max=N        (default 9; nearMiss body only)",
      "",
      "Dry-run is the default unless you pass --apply.",
      "",
    ].join("\n")
  );
  process.exit(message ? 1 : 0);
}

function loadEnv() {
  const env = {};
  if (!fs.existsSync(ENV_PATH)) return env;
  const text = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    env[k] = v;
  }
  return env;
}

function assertShowDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) {
    usageAndExit(`Invalid --show-date: ${s}`);
  }
  return s.trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usageAndExit();

  const uid = typeof args.uid === "string" ? args.uid.trim() : "";
  if (!uid) usageAndExit("--uid is required.");

  const apply = args.apply === true;
  const dryRun = !apply;

  const kindRaw = typeof args.kind === "string" ? args.kind.trim().toLowerCase() : "win";
  const kind = kindRaw === "nearmiss" ? "nearMiss" : "win";
  if (kind !== "win" && kind !== "nearMiss") {
    usageAndExit(`--kind must be win or nearMiss (got ${kindRaw})`);
  }

  const showDate =
    typeof args["show-date"] === "string" && args["show-date"].trim()
      ? assertShowDate(args["show-date"])
      : "2099-12-31";

  const pickId =
    typeof args["pick-id"] === "string" && args["pick-id"].trim()
      ? args["pick-id"].trim()
      : `qa_post_show_${Date.now()}`;

  const globalMaxRaw =
    typeof args["global-max"] === "string" && args["global-max"].trim()
      ? Number.parseInt(args["global-max"].trim(), 10)
      : 9;
  const newGlobalMax = Number.isFinite(globalMaxRaw) ? globalMaxRaw : 9;

  const fileEnv = loadEnv();
  const projectId =
    (typeof args.project === "string" && args.project.trim()) ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    fileEnv.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "Project id missing. Pass --project or set GOOGLE_CLOUD_PROJECT or VITE_FIREBASE_PROJECT_ID."
    );
  }

  admin.initializeApp({ projectId });
  const db = admin.firestore();

  const hints = [{ kind, userId: uid, pickId }];

  console.log(
    [
      `Project: ${projectId}`,
      `User: ${uid}`,
      `showDate: ${showDate}`,
      `pickId: ${pickId}`,
      `kind: ${kind}`,
      `newGlobalMax (nearMiss copy): ${newGlobalMax}`,
      `Mode: ${dryRun ? "DRY RUN (pass --apply to send)" : "APPLY"}`,
      "",
    ].join("\n")
  );

  const userSnap = await db.collection("users").doc(uid).get();
  const prefs = userSnap.exists ? userSnap.data()?.notificationPrefs : null;
  console.log("notificationPrefs:", prefs ?? "(missing → defaults on server)");

  const tokensSnap = await db
    .collection("users")
    .doc(uid)
    .collection("private_fcmTokens")
    .limit(3)
    .get();
  console.log(`private_fcmTokens docs (sample, max 3): ${tokensSnap.size}`);

  if (dryRun) {
    console.log("\nDry-run only. Re-run with --apply to invoke sendPostShowRollupPush.");
    return;
  }

  const logger = {
    info: (...a) => console.log("[info]", ...a),
    warn: (...a) => console.warn("[warn]", ...a),
  };

  const result = await sendPostShowRollupPush({
    db,
    admin,
    showDate,
    newGlobalMax,
    hints,
    logger,
  });

  console.log("\nResult:", result);
}

main().catch((err) => {
  console.error("\nsendPostShowRollupPushTest.js failed:");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
