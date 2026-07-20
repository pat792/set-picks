#!/usr/bin/env node
/**
 * Internal picks rollup report (#687).
 *
 * Walks `picks` by showDate (from calendar and/or --from/--to/--tour),
 * joins optional `official_setlists/{date}`, and writes markdown + JSON.
 *
 * Usage (from `functions/`):
 *   node scripts/picksRollupReport.js --tour="Summer Tour"
 *   node scripts/picksRollupReport.js --from=2026-07-07 --to=2026-07-19
 *   node scripts/picksRollupReport.js --tour="Summer Tour" --out=../docs/picks-rollup/reports
 *   node scripts/picksRollupReport.js --dump=./picks-dump.json --out=../docs/picks-rollup/reports
 *
 * Auth (live Firestore mode): Application Default Credentials
 *   gcloud auth application-default login
 * Project: GOOGLE_CLOUD_PROJECT or .env VITE_FIREBASE_PROJECT_ID
 *
 * Dump mode: JSON array of pick docs (or { picks: [...] }) — no Firebase needed.
 */

const admin = require("firebase-admin");
const fs = require("node:fs");
const path = require("node:path");

const {
  aggregateNight,
  aggregateWindow,
  aggregateSongsAcrossDocs,
  renderMarkdownReport,
} = require("../picksRollupReportCore");

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
      "  node scripts/picksRollupReport.js --tour=\"Summer Tour\"",
      "  node scripts/picksRollupReport.js --from=YYYY-MM-DD --to=YYYY-MM-DD",
      "  node scripts/picksRollupReport.js --dates=2026-07-18,2026-07-19",
      "  node scripts/picksRollupReport.js --dump=./picks-dump.json",
      "",
      "Flags:",
      "  --tour=...       Substring match on show_calendar tour label",
      "  --from=...        Inclusive start date",
      "  --to=...          Inclusive end date",
      "  --dates=...       Explicit comma-separated dates (overrides calendar filter)",
      "  --dump=FILE       Offline JSON dump of pick docs (skips Firestore)",
      "  --out=DIR         Write report.md + report.json under DIR (default: stdout md only)",
      "  --consensus=25    Consensus threshold percent (default 25)",
      "  --top=15          Top-N songs per night / window",
      "  --no-setlists     Skip official_setlists join",
      "",
      "Auth:  gcloud auth application-default login (not needed with --dump)",
      "Env:   GOOGLE_CLOUD_PROJECT or .env VITE_FIREBASE_PROJECT_ID",
      "",
    ].join("\n")
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

function isShowDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 */
async function loadShowCalendar(db) {
  const snap = await db.collection("show_calendar").doc("snapshot").get();
  const data = snap.exists ? snap.data() || {} : {};
  const byTour = Array.isArray(data.showDatesByTour)
    ? data.showDatesByTour
    : [];
  /** @type {Array<{ date: string, tour: string, venue?: string }>} */
  const shows = [];
  for (const group of byTour) {
    const tour = typeof group?.tour === "string" ? group.tour : "";
    if (!Array.isArray(group?.shows)) continue;
    for (const s of group.shows) {
      if (s && typeof s.date === "string" && isShowDate(s.date)) {
        shows.push({
          date: s.date.trim(),
          tour,
          venue: typeof s.venue === "string" ? s.venue : undefined,
        });
      }
    }
  }
  shows.sort((a, b) => a.date.localeCompare(b.date));
  return { shows, byTour };
}

/**
 * @param {Array<{ date: string, tour: string, venue?: string }>} shows
 * @param {Record<string, string | true>} args
 */
function resolveDates(shows, args) {
  if (typeof args.dates === "string" && args.dates.trim()) {
    const dates = args.dates
      .split(",")
      .map((s) => s.trim())
      .filter(isShowDate);
    if (!dates.length) throw new Error("--dates must include YYYY-MM-DD values");
    return [...new Set(dates)].sort();
  }

  let filtered = shows;
  if (typeof args.tour === "string" && args.tour.trim()) {
    const needle = args.tour.trim().toLowerCase();
    filtered = filtered.filter((s) => s.tour.toLowerCase().includes(needle));
  }
  if (typeof args.from === "string" && args.from.trim()) {
    if (!isShowDate(args.from)) throw new Error("--from must be YYYY-MM-DD");
    filtered = filtered.filter((s) => s.date >= args.from.trim());
  }
  if (typeof args.to === "string" && args.to.trim()) {
    if (!isShowDate(args.to)) throw new Error("--to must be YYYY-MM-DD");
    filtered = filtered.filter((s) => s.date <= args.to.trim());
  }

  if (!filtered.length) {
    throw new Error(
      "No show dates matched. Pass --dates=... or check --tour/--from/--to."
    );
  }
  return [...new Set(filtered.map((s) => s.date))].sort();
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {string} showDate
 */
async function loadPicksForShow(db, showDate) {
  const snap = await db
    .collection("picks")
    .where("showDate", "==", showDate)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {string} showDate
 */
async function loadSetlist(db, showDate) {
  const snap = await db.collection("official_setlists").doc(showDate).get();
  return snap.exists ? snap.data() || null : null;
}

/**
 * @param {string} dumpPath
 * @returns {Array<Record<string, unknown>>}
 */
function loadDump(dumpPath) {
  const abs = path.resolve(process.cwd(), dumpPath);
  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.picks)) return raw.picks;
  throw new Error("--dump must be a JSON array or { picks: [...] }");
}

/**
 * @param {Array<Record<string, unknown>>} docs
 * @returns {string[]}
 */
function datesFromDocs(docs) {
  const set = new Set();
  for (const d of docs) {
    if (typeof d.showDate === "string" && isShowDate(d.showDate)) {
      set.add(d.showDate.trim());
    }
  }
  return [...set].sort();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usageAndExit();

  const consensusPct =
    typeof args.consensus === "string" ? Number(args.consensus) : 25;
  const topN = typeof args.top === "string" ? Number(args.top) : 15;
  const joinSetlists = args["no-setlists"] !== true;
  const outDir =
    typeof args.out === "string" && args.out.trim()
      ? path.resolve(process.cwd(), args.out.trim())
      : null;
  const dumpPath =
    typeof args.dump === "string" && args.dump.trim()
      ? args.dump.trim()
      : null;

  /** @type {ReturnType<typeof aggregateNight>[]} */
  const nights = [];
  /** @type {Array<Record<string, unknown>>} */
  const allSubmittedDocs = [];
  /** @type {string[]} */
  let dates = [];
  /** @type {string} */
  let projectId = "dump";

  if (dumpPath) {
    const dumpDocs = loadDump(dumpPath);
    dates = datesFromDocs(dumpDocs);
    if (!dates.length) throw new Error("Dump has no valid showDate values");

    console.error(
      [
        "",
        "picks-rollup-report (#687)",
        `  mode: dump (${dumpPath})`,
        `  nights: ${dates.length} (${dates[0]} → ${dates[dates.length - 1]})`,
        `  docs: ${dumpDocs.length}`,
        "",
      ].join("\n")
    );

    for (const showDate of dates) {
      const pickDocs = dumpDocs.filter((d) => d.showDate === showDate);
      const night = aggregateNight(showDate, pickDocs, {
        consensusPct,
        topN,
        setlist: null,
      });
      nights.push(night);
      allSubmittedDocs.push(...pickDocs);
      console.error(
        `  ${showDate}: submitted=${night.submitted} graded=${night.graded} docs=${night.totalDocs}`
      );
    }
  } else {
    const fileEnv = loadEnv();
    projectId =
      process.env.GOOGLE_CLOUD_PROJECT || fileEnv.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error(
        "Project id missing: set GOOGLE_CLOUD_PROJECT or VITE_FIREBASE_PROJECT_ID in .env"
      );
    }

    admin.initializeApp({ projectId });
    const db = admin.firestore();

    const { shows } = await loadShowCalendar(db);
    dates = resolveDates(shows, args);

    console.error(
      [
        "",
        "picks-rollup-report (#687)",
        `  project: ${projectId}`,
        `  nights: ${dates.length} (${dates[0]} → ${dates[dates.length - 1]})`,
        `  setlists: ${joinSetlists ? "yes" : "no"}`,
        "",
      ].join("\n")
    );

    for (const showDate of dates) {
      const pickDocs = await loadPicksForShow(db, showDate);
      const setlist = joinSetlists ? await loadSetlist(db, showDate) : null;
      const night = aggregateNight(showDate, pickDocs, {
        consensusPct,
        topN,
        setlist,
      });
      nights.push(night);
      allSubmittedDocs.push(...pickDocs);
      console.error(
        `  ${showDate}: submitted=${night.submitted} graded=${night.graded} docs=${night.totalDocs}`
      );
    }
  }

  const window = aggregateWindow(nights, { consensusPct, topN });
  const tourSongs = aggregateSongsAcrossDocs(allSubmittedDocs, {
    topN: Math.max(topN, 25),
  });

  const generatedAt = new Date().toISOString();
  const title = `Picks rollup — ${dates[0]} → ${dates[dates.length - 1]}`;
  const meta = {
    project: projectId,
    issue: "#687",
    consensusThreshold: `${consensusPct}%`,
    ...(dumpPath ? { dump: dumpPath } : {}),
    ...(typeof args.tour === "string" ? { tourFilter: args.tour } : {}),
  };

  const markdown = renderMarkdownReport({
    title,
    generatedAt,
    window,
    nights,
    tourSongs,
    meta,
  });

  const payload = {
    generatedAt,
    meta,
    dates,
    window,
    nights,
    tourSongs,
  };

  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = generatedAt.slice(0, 10);
    const base = `picks-rollup-${dates[0]}_${dates[dates.length - 1]}_${stamp}`;
    const mdPath = path.join(outDir, `${base}.md`);
    const jsonPath = path.join(outDir, `${base}.json`);
    fs.writeFileSync(mdPath, markdown, "utf8");
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    console.error(`\nWrote:\n  ${mdPath}\n  ${jsonPath}\n`);
  }

  process.stdout.write(markdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
