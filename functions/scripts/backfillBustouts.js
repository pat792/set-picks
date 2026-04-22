#!/usr/bin/env node
/**
 * Admin-script for the #214 per-show `bustouts` snapshot backfill.
 *
 * Runs the exact same pipeline as the deployed `backfillBustoutsForShows`
 * callable by importing the shared core module (`functions/backfillBustoutsCore.js`).
 * Does NOT call the deployed callable — so there is no Firebase Auth dance
 * (no custom token, no Identity Toolkit round-trip, no referrer-restricted
 * API key). The script uses Application Default Credentials directly.
 *
 * Usage (from `functions/`):
 *   # Dry-run: list which shows are missing `bustouts`.
 *   node scripts/backfillBustouts.js --missing
 *
 *   # Backfill every show missing a snapshot:
 *   node scripts/backfillBustouts.js --missing --apply
 *
 *   # Backfill specific show dates:
 *   node scripts/backfillBustouts.js --showDates=2025-12-28,2025-12-30 --apply
 *
 * Auth:
 *   Requires Application Default Credentials for firebase-admin:
 *     gcloud auth application-default login
 *   Your ADC identity must have Firestore read/write on the project.
 *
 * Phish.net key:
 *   The core re-fetches Phish.net at runtime to re-derive bustouts from per-row
 *   `gap`. Provide the key via `PHISHNET_API_KEY` env var — the same secret the
 *   deployed function uses. Easiest pull:
 *     PHISHNET_API_KEY="$(firebase functions:secrets:access PHISHNET_API_KEY \
 *       --project=<project-id>)"
 *
 * Project id:
 *   Read from repo-root `.env` (`VITE_FIREBASE_PROJECT_ID`) or the
 *   `GOOGLE_CLOUD_PROJECT` env var.
 *
 * This script is safe to re-run: the core is idempotent (write-merge;
 * score-delta reconciliation is zero when bustouts didn't change).
 */

const admin = require("firebase-admin");
const fs = require("node:fs");
const path = require("node:path");

const { runBackfill } = require("../backfillBustoutsCore");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");

/**
 * @param {string[]} argv
 * @returns {Record<string, string | true>}
 */
function parseArgs(argv) {
  /** @type {Record<string, string | true>} */
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, ...rest] = arg.slice(2).split("=");
    out[k] = rest.length ? rest.join("=") : true;
  }
  return out;
}

function usageAndExit(msg) {
  if (msg) console.error(`\nError: ${msg}\n`);
  console.log(
    [
      "Usage:",
      "  node scripts/backfillBustouts.js --missing [--apply]",
      "  node scripts/backfillBustouts.js --showDates=YYYY-MM-DD[,YYYY-MM-DD...] [--apply]",
      "",
      "Modes:",
      "  --missing           Scan official_setlists for docs without `bustouts`.",
      "  --showDates=...     Comma-separated list of show dates to backfill.",
      "",
      "Flags:",
      "  --dry-run           Default. List target show dates; no writes.",
      "  --apply             Actually run the backfill pipeline.",
      "",
      "Env:",
      "  PHISHNET_API_KEY    Required for --apply. Pull via:",
      "                        firebase functions:secrets:access PHISHNET_API_KEY",
      "  GOOGLE_CLOUD_PROJECT  Optional override (falls back to .env VITE_FIREBASE_PROJECT_ID).",
      "",
      "Auth:  gcloud auth application-default login",
      "",
    ].join("\n"),
  );
  process.exit(msg ? 1 : 0);
}

/** @returns {Record<string, string>} */
function loadEnv() {
  /** @type {Record<string, string>} */
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

function isShowDate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return false;
  const [y, m, d] = v.trim().split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return (
    parsed.getUTCFullYear() === y &&
    parsed.getUTCMonth() === m - 1 &&
    parsed.getUTCDate() === d
  );
}

async function scanMissing(db) {
  const snap = await db.collection("official_setlists").get();
  /** @type {string[]} */
  const missing = [];
  for (const d of snap.docs) {
    const data = d.data() || {};
    if (!Array.isArray(data.bustouts)) missing.push(d.id);
  }
  missing.sort();
  return missing;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usageAndExit();

  const useMissing = args.missing === true;
  const showDatesArg =
    typeof args.showDates === "string" ? args.showDates.trim() : "";
  if (!useMissing && !showDatesArg) {
    usageAndExit("Pass either --missing or --showDates=...");
  }
  if (useMissing && showDatesArg) {
    usageAndExit("Pass only one of --missing or --showDates=... (not both).");
  }

  const apply = args.apply === true;
  const dryRun = !apply || args["dry-run"] === true;

  const fileEnv = loadEnv();
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT || fileEnv.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "Project id missing: set GOOGLE_CLOUD_PROJECT or VITE_FIREBASE_PROJECT_ID in .env",
    );
  }

  admin.initializeApp({ projectId });
  const db = admin.firestore();

  /** @type {string[]} */
  let showDates = [];
  if (useMissing) {
    console.log("Scanning official_setlists for docs missing `bustouts`...");
    showDates = await scanMissing(db);
    if (showDates.length === 0) {
      console.log("No shows missing bustouts. Nothing to do.");
      return;
    }
  } else {
    showDates = showDatesArg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const d of showDates) {
      if (!isShowDate(d)) usageAndExit(`Invalid date in --showDates: ${d}`);
    }
  }

  console.log(
    [
      "",
      `Target show dates: ${showDates.length}`,
      ...showDates.map((d) => `  - ${d}`),
      `Mode: ${dryRun ? "DRY RUN (no writes)" : "APPLY"}`,
      `Project: ${projectId}`,
      "",
    ].join("\n"),
  );

  if (dryRun) {
    console.log("Dry-run complete. Re-run with --apply to execute the backfill.");
    return;
  }

  const phishnetApiKey = process.env.PHISHNET_API_KEY;
  if (!phishnetApiKey || !phishnetApiKey.trim()) {
    throw new Error(
      [
        "PHISHNET_API_KEY env var is required for --apply. Pull it from Firebase secrets:",
        `  firebase functions:secrets:access PHISHNET_API_KEY --project=${projectId}`,
      ].join("\n"),
    );
  }

  console.log(`Running backfill against ${showDates.length} show(s)...`);
  const started = Date.now();
  const { results, minGap } = await runBackfill({
    db,
    admin,
    logger: console,
    phishnetApiKey,
    showDates,
    updatedBy: `backfill-script:${process.env.USER || "unknown"}`,
  });
  const elapsedMs = Date.now() - started;

  console.log(`\nCompleted in ${elapsedMs}ms (minGap=${minGap}):\n`);
  console.log(JSON.stringify({ results }, null, 2));

  let totalPicksUpdated = 0;
  let totalReconciled = 0;
  let skipped = 0;
  for (const row of results) {
    if (row.skipped) {
      skipped += 1;
      continue;
    }
    if (typeof row.updatedPicks === "number") totalPicksUpdated += row.updatedPicks;
    if (typeof row.reconciledGradedPicks === "number")
      totalReconciled += row.reconciledGradedPicks;
  }
  console.log(
    [
      "",
      "Summary:",
      `  shows processed         : ${results.length - skipped}`,
      `  shows skipped           : ${skipped}`,
      `  pick scores recomputed  : ${totalPicksUpdated}`,
      `  graded picks reconciled : ${totalReconciled}`,
      "",
    ].join("\n"),
  );
}

main().catch((err) => {
  console.error("\nbackfillBustouts.js failed:");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
