#!/usr/bin/env node
/**
 * Ops backfill for per-show `songGaps` snapshots (#587 Phase B).
 *
 * Display-only: writes `official_setlists/{showDate}.songGaps` from Phish.net
 * row `gap`. Does **not** recompute pick scores (unlike the bustouts backfill).
 *
 * Usage (from `functions/`):
 *   node scripts/backfillSongGaps.js --missing
 *   node scripts/backfillSongGaps.js --missing --apply
 *   node scripts/backfillSongGaps.js --showDates=2026-07-04,2026-07-05 --apply
 *
 * Auth: GOOGLE_APPLICATION_CREDENTIALS or ADC.
 * Phish.net: PHISHNET_API_KEY env, or repo-root `.env`.
 */

const admin = require("firebase-admin");
const fs = require("node:fs");
const path = require("node:path");

const {
  deriveSongGapsFromRows,
  fetchPhishnetSetlistForDate,
  normalizeSetlistRows,
} = require("../phishnetLiveSetlistAutomation");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");
const SHOW_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
      "  node scripts/backfillSongGaps.js --missing [--apply]",
      "  node scripts/backfillSongGaps.js --showDates=YYYY-MM-DD[,...] [--apply]",
      "",
      "  --missing     Scan official_setlists for docs without songGaps.",
      "  --apply       Write. Default is dry-run.",
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

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @returns {Promise<string[]>}
 */
async function scanShowsMissingSongGaps(db) {
  const snap = await db.collection("official_setlists").get();
  /** @type {string[]} */
  const out = [];
  for (const d of snap.docs) {
    const data = d.data() || {};
    const gaps = data.songGaps;
    if (!gaps || typeof gaps !== "object" || Array.isArray(gaps) || Object.keys(gaps).length === 0) {
      out.push(d.id);
    }
  }
  out.sort();
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) usageAndExit();

  const fileEnv = loadEnv();
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    fileEnv.VITE_FIREBASE_PROJECT_ID ||
    "set-picks";
  const apiKey =
    process.env.PHISHNET_API_KEY || fileEnv.PHISHNET_API_KEY || "";
  const apply = args.apply === true;

  if (!admin.apps.length) {
    admin.initializeApp({ projectId });
  }
  const db = admin.firestore();

  /** @type {string[]} */
  let targets;
  if (typeof args.showDates === "string" && args.showDates.trim()) {
    targets = args.showDates
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const d of targets) {
      if (!SHOW_DATE_RE.test(d)) usageAndExit(`Invalid showDate: ${d}`);
    }
  } else if (args.missing === true) {
    targets = await scanShowsMissingSongGaps(db);
  } else {
    usageAndExit("Pass --missing or --showDates=...");
  }

  console.log(`\nbackfill-song-gaps (#587 Phase B)`);
  console.log(`  project: ${projectId}`);
  console.log(`  mode: ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`  targets: ${targets.length}`);
  if (targets.length === 0) {
    console.log("Nothing to do.");
    return;
  }
  console.log(`  ${targets.slice(0, 8).join(", ")}${targets.length > 8 ? `, … +${targets.length - 8} more` : ""}`);

  if (!apply) {
    console.log("\nDry-run complete. Re-run with --apply to write.");
    return;
  }
  if (!apiKey.trim()) {
    usageAndExit("PHISHNET_API_KEY required for --apply (env or repo-root .env).");
  }

  let written = 0;
  let failed = 0;
  for (const showDate of targets) {
    const ref = db.collection("official_setlists").doc(showDate);
    const snap = await ref.get();
    if (!snap.exists) {
      console.log(`  ${showDate}: skip (no doc)`);
      continue;
    }
    try {
      const payload = await fetchPhishnetSetlistForDate(showDate, apiKey);
      const rows = normalizeSetlistRows(payload);
      const songGaps = deriveSongGapsFromRows(rows);
      await ref.set(
        {
          songGaps,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: "backfill-song-gaps",
        },
        { merge: true },
      );
      written += 1;
      console.log(`  ${showDate}: wrote ${Object.keys(songGaps).length} gaps`);
    } catch (e) {
      failed += 1;
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  ${showDate}: FAILED — ${msg}`);
    }
  }

  console.log(`\nBackfill complete. Written: ${written}. Failed: ${failed}.`);
}

main().catch((e) => {
  console.error("\nbackfillSongGaps.js failed:");
  console.error(e instanceof Error ? e.stack || e.message : e);
  process.exit(1);
});
