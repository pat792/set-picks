#!/usr/bin/env node
/**
 * Run leakage-safe rolling-origin baseline + combined model backtest (#648/#649).
 *
 * Usage (repo root):
 *   npm run backtest:recommendations
 *   npm run backtest:recommendations -- --min-train=40 --recent-window=25
 *
 * Requires a local setlist cache from:
 *   npm run backtest:import-setlists -- --years=2
 *
 * Writes JSON + markdown under data/prediction-backtest/reports/ (gitignored).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPORTS_DIR } from "./lib/shared.mjs";
import { loadAllShowRecords } from "./lib/dataset.mjs";
import {
  runRollingBacktest,
  evaluateGoNoGo,
  BASELINE_NAMES,
  MODEL_NAME,
} from "./lib/backtest.mjs";
import {
  MODEL_VERSION,
  MODEL_WEIGHTS,
  MODEL_TRAINING_WINDOW,
} from "./lib/model.mjs";

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

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(4) : "—";
}

const args = parseArgs(process.argv.slice(2));
const minTrainShows = Number(args["min-train"] || args.minTrain || 30);
const recentWindow = Number(args["recent-window"] || args.recentWindow || 25);
const baselinesOnly = Boolean(args["baselines-only"]);

const history = loadAllShowRecords();
if (history.length < minTrainShows + 5) {
  console.error(
    `Need more cached setlists (have ${history.length}, want ≥ ${minTrainShows + 5}).\n` +
      `Run: npm run backtest:import-setlists -- --years=2`
  );
  process.exit(1);
}

console.log(
  `Backtest: ${history.length} cached shows, minTrain=${minTrainShows}, recentWindow=${recentWindow}`
);

const result = runRollingBacktest(history, {
  minTrainShows,
  recentWindow,
  baselines: BASELINE_NAMES,
  includeCombined: !baselinesOnly,
});

const goNoGo = baselinesOnly
  ? { pass: false, reason: "baselines-only run" }
  : evaluateGoNoGo(result);

mkdirSync(REPORTS_DIR, { recursive: true });
const stamp = result.generatedAt.replace(/[:.]/g, "-");
const jsonPath = join(REPORTS_DIR, `baseline-backtest-${stamp}.json`);
writeFileSync(
  jsonPath,
  `${JSON.stringify({ ...result, goNoGo, MODEL_WEIGHTS, MODEL_TRAINING_WINDOW }, null, 2)}\n`,
  "utf8"
);

const rowNames = baselinesOnly
  ? BASELINE_NAMES
  : [...BASELINE_NAMES, MODEL_NAME];

/** @type {string[]} */
const md = [];
md.push("# Prediction baseline backtest");
md.push("");
md.push(`Generated: \`${result.generatedAt}\``);
md.push(`History shows: **${result.historyShows}**`);
md.push(`Evaluated nights: **${result.evaluatedNights}**`);
md.push(
  `minTrainShows: **${result.minTrainShows}** · recentWindow: **${result.recentWindow}**`
);
if (!baselinesOnly) {
  md.push(`Combined model: **\`${MODEL_VERSION}\`**`);
  md.push(`Go/no-go: **${goNoGo.pass ? "PASS" : "FAIL"}** — ${goNoGo.reason}`);
}
md.push("");
md.push("## Leakage controls");
md.push("");
md.push("- Features use only shows with `showDate < targetDate`.");
md.push(
  "- Target-night `songGaps` / official setlist are **labels only**, never candidate features."
);
md.push(
  "- Gaps for gap-ascending / combined cadence are **reconstructed** from prior history."
);
md.push("");
md.push("## Summary (means across evaluated nights)");
md.push("");
md.push(
  "| Model | recall@5 | recall@10 | slotHit@5 | slotHit@10 | Brier↓ | zeroScoreRate↓ | top3Conc |"
);
md.push("|---|---:|---:|---:|---:|---:|---:|---:|");
for (const name of rowNames) {
  const s = result.summary[name];
  md.push(
    `| \`${name}\` | ${fmt(s.recallAt5)} | ${fmt(s.recallAt10)} | ${fmt(s.slotHitAt5)} | ${fmt(s.slotHitAt10)} | ${fmt(s.brier)} | ${fmt(s.zeroScoreRate)} | ${fmt(s.top3Concentration)} |`
  );
}
md.push("");
md.push("### How to read");
md.push("");
md.push(
  "- **recall@K** — fraction of that night’s played songs appearing in the model’s top-K."
);
md.push(
  "- **slotHit@K** — mean exact-slot hit rate (s1o/s1c/s2o/s2c/enc) in top-K."
);
md.push("- **Brier** — rank-pseudo-probability calibration (lower better).");
md.push(
  "- **zeroScoreRate** — share of nights where locking recommended picks would still score 0."
);
md.push(
  "- Combined model is **slot-aware**; baselines are slot-agnostic (#648)."
);
md.push("");
md.push(`Raw JSON: \`${jsonPath}\``);
md.push("");

const mdPath = join(REPORTS_DIR, `baseline-backtest-${stamp}.md`);
writeFileSync(mdPath, `${md.join("\n")}\n`, "utf8");

console.log(md.join("\n"));
console.log(`\nWrote:\n  ${jsonPath}\n  ${mdPath}`);
if (!baselinesOnly && !goNoGo.pass) {
  console.error("\nGo/no-go FAILED — do not freeze model for Wave 3 artifact yet.");
  process.exitCode = 2;
}
