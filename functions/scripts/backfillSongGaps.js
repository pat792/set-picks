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
 *   node scripts/backfillSongGaps.js --existing
 *   node scripts/backfillSongGaps.js --existing --apply
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
      "  node scripts/backfillSongGaps.js --existing [--apply]",
      "  node scripts/backfillSongGaps.js --showDates=YYYY-MM-DD[,...] [--apply]",
      "",
      "  --missing     Scan official_setlists for docs without songGaps.",
      "  --existing    Scan official_setlists for docs that already have songGaps.",
      "  --apply       Write songGaps only. Default is dry-run. Never writes bustouts.",
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
 * @param {unknown} data
 * @returns {boolean}
 */
function hasSongGapsMap(data) {
  const gaps = data && typeof data === "object" ? data.songGaps : null;
  return Boolean(
    gaps && typeof gaps === "object" && !Array.isArray(gaps) && Object.keys(gaps).length > 0,
  );
}

/**
 * Firestore patch for a song-gap backfill. `bustouts` is intentionally absent
 * so a merge write cannot rebuild or clear the scoring snapshot (#1062).
 *
 * @param {Record<string, number>} songGaps
 * @returns {{ songGaps: Record<string, number>, updatedBy: string }}
 */
function songGapsBackfillPatch(songGaps) {
  return {
    songGaps,
    updatedBy: "backfill-song-gaps",
  };
}

/**
 * @param {Array<{ id: string, data?: object }>} docs
 * @param {"missing" | "existing"} mode
 * @returns {string[]}
 */
function selectShowDatesForSongGapBackfill(docs, mode) {
  const out = [];
  for (const doc of docs) {
    const has = hasSongGapsMap(doc?.data);
    if (mode === "existing" ? has : !has) out.push(doc.id);
  }
  out.sort();
  return out;
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {"missing" | "existing"} mode
 * @returns {Promise<string[]>}
 */
async function scanShowsForSongGapBackfill(db, mode) {
  const snap = await db.collection("official_setlists").get();
  const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() || {} }));
  return selectShowDatesForSongGapBackfill(docs, mode);
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
    targets = await scanShowsForSongGapBackfill(db, "missing");
  } else if (args.existing === true) {
    targets = await scanShowsForSongGapBackfill(db, "existing");
  } else {
    usageAndExit("Pass --missing, --existing, or --showDates=...");
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

  if (!apiKey.trim()) {
    if (!apply) {
      console.log("\nDry-run listed targets only (no PHISHNET_API_KEY to diff).");
      console.log("Re-run with --apply to write, or set PHISHNET_API_KEY to preview diffs.");
      return;
    }
    usageAndExit("PHISHNET_API_KEY required for --apply (env or repo-root .env).");
  }

  let written = 0;
  let unchanged = 0;
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
      const prior = snap.data() || {};
      const priorGaps =
        prior.songGaps && typeof prior.songGaps === "object" && !Array.isArray(prior.songGaps)
          ? prior.songGaps
          : {};
      const changedKeys = [
        ...Object.keys(songGaps).filter((k) => priorGaps[k] !== songGaps[k]),
        ...Object.keys(priorGaps).filter((k) => !Object.prototype.hasOwnProperty.call(songGaps, k)),
      ];
      const spotlight = ["melt the guns", "walk away", "seven below", "no men in no man's land"]
        .filter((k) => k in songGaps || k in priorGaps)
        .map((k) => `${k} ${priorGaps[k] ?? "∅"}→${songGaps[k] ?? "∅"}`);
      const patch = songGapsBackfillPatch(songGaps);
      if (Object.prototype.hasOwnProperty.call(patch, "bustouts")) {
        throw new Error("songGaps backfill patch must not include bustouts");
      }
      const bustoutCount = Array.isArray(prior.bustouts) ? prior.bustouts.length : 0;
      const summary = `${showDate}: ${changedKeys.length} gap${changedKeys.length === 1 ? "" : "s"} differ (${Object.keys(songGaps).length} in feed, bustouts untouched: ${bustoutCount})${spotlight.length ? ` [${spotlight.join("; ")}]` : ""}`;
      if (!apply) {
        console.log(`  would update ${summary}`);
        continue;
      }
      if (changedKeys.length === 0) {
        unchanged += 1;
        console.log(`  unchanged ${summary}`);
        continue;
      }
      await ref.set(
        {
          ...patch,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      written += 1;
      console.log(`  wrote ${summary}`);
    } catch (e) {
      failed += 1;
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  ${showDate}: FAILED — ${msg}`);
    }
  }

  if (!apply) {
    console.log("\nDry-run complete. Re-run with --apply to write songGaps only.");
    return;
  }
  console.log(`\nBackfill complete. Written: ${written}. Unchanged: ${unchanged}. Failed: ${failed}.`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("\nbackfillSongGaps.js failed:");
    console.error(e instanceof Error ? e.stack || e.message : e);
    process.exit(1);
  });
}

module.exports = {
  hasSongGapsMap,
  selectShowDatesForSongGapBackfill,
  songGapsBackfillPatch,
};
