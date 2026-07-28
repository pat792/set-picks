#!/usr/bin/env node
/**
 * Import bounded Phish.net historical setlists into a local cache (#648).
 *
 * Usage (repo root):
 *   npm run backtest:import-setlists -- --from=2024-01-01 --to=2025-12-31
 *   npm run backtest:import-setlists -- --years=2
 *
 * Requires PHISHNET_API_KEY in repo-root .env.
 * Writes JSON under data/prediction-backtest/setlists/ (gitignored).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  CACHE_DIR,
  loadPhishnetApiKey,
  loadShowCalendar,
  loadSetlistAutomation,
  sleep,
} from "./lib/shared.mjs";
import {
  showRecordFromPhishnetPayload,
  writeShowRecord,
  readShowRecord,
} from "./lib/dataset.mjs";

function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    if (eq === -1) out[arg.slice(2)] = true;
    else out[arg.slice(2, eq)] = arg.slice(eq + 1);
  }
  return out;
}

function isoDaysAgo(years) {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const args = parseArgs(process.argv.slice(2));
const years = args.years ? Number(args.years) : null;
const from = String(args.from || (years ? isoDaysAgo(Number(years)) : ""));
const to = String(args.to || todayIso());
const delayMs = Number(args.delayMs || 200);
const force = Boolean(args.force);

if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
  console.error(
    "Usage: npm run backtest:import-setlists -- --from=YYYY-MM-DD --to=YYYY-MM-DD\n" +
      "   or: npm run backtest:import-setlists -- --years=2"
  );
  process.exit(1);
}

const apiKey = loadPhishnetApiKey();
if (!apiKey) {
  console.error("Add PHISHNET_API_KEY=... to .env (repo root).");
  process.exit(1);
}

const { fetchAllShowsNormalized } = loadShowCalendar();
const { fetchPhishnetSetlistForDate } = loadSetlistAutomation();

const fromYear = Number(from.slice(0, 4));
const toYear = Number(to.slice(0, 4));

console.log(`Listing Phish.net shows ${from} → ${to} (years ${fromYear}–${toYear})…`);
const allShows = await fetchAllShowsNormalized({
  apiKey,
  minYear: fromYear,
  maxYear: toYear,
});
const dates = allShows
  .map((s) => s.date)
  .filter((d) => typeof d === "string" && d >= from && d <= to)
  .sort();

console.log(`Candidates: ${dates.length} show dates`);
mkdirSync(CACHE_DIR, { recursive: true });

let imported = 0;
let skipped = 0;
let failed = 0;

for (const showDate of dates) {
  if (!force && readShowRecord(showDate)) {
    skipped += 1;
    continue;
  }
  try {
    const payload = await fetchPhishnetSetlistForDate(showDate, apiKey);
    const record = showRecordFromPhishnetPayload(showDate, payload);
    if (!record) {
      failed += 1;
      console.warn(`  skip empty/error ${showDate}`);
    } else {
      writeShowRecord(record);
      imported += 1;
      console.log(
        `  ${showDate}  songs=${record.songs.length}  s1o=${record.slots.s1o || "—"}`
      );
    }
  } catch (e) {
    failed += 1;
    console.warn(
      `  fail ${showDate}:`,
      e instanceof Error ? e.message : String(e)
    );
  }
  if (delayMs > 0) await sleep(delayMs);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  from,
  to,
  candidates: dates.length,
  imported,
  skippedExisting: skipped,
  failed,
  cacheDir: CACHE_DIR.replace(ROOT, "."),
};

writeFileSync(
  join(CACHE_DIR, "import-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);

console.log("\nDone:", manifest);
