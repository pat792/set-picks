/**
 * Unit tests for prediction backtest harness (#648).
 * Run: node --test scripts/prediction-backtest/lib/*.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  priorShows,
  buildHistoryIndex,
  reconstructGap,
  assertNoTargetLeakage,
  recentPlayCounts,
} from "./features.mjs";
import {
  baselineGlobalPopularity,
  baselineGapAscending,
  baselineRecentFrequency,
} from "./baselines.mjs";
import {
  playedSongRecallAtK,
  exactSlotHitAtK,
  rankBrierScore,
} from "./metrics.mjs";
import { showRecordFromPhishnetPayload } from "./dataset.mjs";
import { normalizeTitle } from "./shared.mjs";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('./features.mjs').ShowRecord[]} */
const FIXTURE_HISTORY = [
  {
    showDate: "2024-01-01",
    songs: ["Alpha", "Beta", "Gamma"],
    slots: { s1o: "Alpha", s1c: "Beta", s2o: "Gamma", s2c: "Alpha", enc: "Beta" },
    encoreSongs: ["Beta"],
  },
  {
    showDate: "2024-01-05",
    songs: ["Beta", "Delta", "Epsilon"],
    slots: { s1o: "Beta", s1c: "Delta", s2o: "Epsilon", s2c: "Beta", enc: "Delta" },
    encoreSongs: ["Delta"],
  },
  {
    showDate: "2024-01-10",
    songs: ["Alpha", "Zeta"],
    slots: { s1o: "Alpha", s1c: "Zeta", s2o: "Alpha", s2c: "Zeta", enc: "Alpha" },
    encoreSongs: ["Alpha"],
  },
  {
    showDate: "2024-01-15",
    songs: ["Beta", "Alpha", "Eta"],
    slots: { s1o: "Beta", s1c: "Alpha", s2o: "Eta", s2c: "Beta", enc: "Alpha" },
    encoreSongs: ["Alpha"],
  },
];

test("normalizeTitle collapses case and spaces", () => {
  assert.equal(normalizeTitle("  Tweezer  Reprise "), "tweezer reprise");
});

test("priorShows enforces strict date cutoff", () => {
  const priors = priorShows(FIXTURE_HISTORY, "2024-01-10");
  assert.deepEqual(
    priors.map((s) => s.showDate),
    ["2024-01-01", "2024-01-05"]
  );
});

test("assertNoTargetLeakage throws when target sneaks into priors", () => {
  assert.throws(() =>
    assertNoTargetLeakage(FIXTURE_HISTORY, "2024-01-05")
  );
});

test("reconstructGap never uses target night", () => {
  const priors = priorShows(FIXTURE_HISTORY, "2024-01-15");
  // Alpha last played 2024-01-10 → gap 1 show (2024-01-15 is target, not counted)
  assert.equal(reconstructGap(priors, "2024-01-15", "alpha"), 0);
  // Epsilon last on 2024-01-05 → two shows after in priors (01-10 only? wait)
  // priors = 01-01, 01-05, 01-10. From end: 01-10 no epsilon → gap1; 01-05 hit → gap 1
  assert.equal(reconstructGap(priors, "2024-01-15", "epsilon"), 1);
  assert.equal(
    reconstructGap(priors, "2024-01-15", "never-played"),
    Number.POSITIVE_INFINITY
  );
});

test("baselines refuse target leakage via assert", () => {
  assert.throws(() =>
    baselineGlobalPopularity(FIXTURE_HISTORY, "2024-01-01")
  );
});

test("global popularity ranks Alpha/Beta above rare songs", () => {
  const priors = priorShows(FIXTURE_HISTORY, "2024-01-15");
  const ranked = baselineGlobalPopularity(priors, "2024-01-15");
  assert.ok(ranked.length >= 3);
  const topKeys = ranked.slice(0, 3).map((r) => r.songKey);
  assert.ok(topKeys.includes("alpha"));
  assert.ok(topKeys.includes("beta"));
});

test("gap ascending prefers recently played songs", () => {
  const priors = priorShows(FIXTURE_HISTORY, "2024-01-15");
  const ranked = baselineGapAscending(priors, "2024-01-15");
  // Alpha and Zeta played on last prior night → should outrank ancient Epsilon
  const idx = (k) => ranked.findIndex((r) => r.songKey === k);
  assert.ok(idx("alpha") < idx("epsilon"));
  assert.ok(idx("zeta") < idx("epsilon"));
});

test("recent frequency window limits history", () => {
  const priors = priorShows(FIXTURE_HISTORY, "2024-01-15");
  const counts = recentPlayCounts(priors, 1);
  assert.equal(counts.get("alpha"), 1);
  assert.equal(counts.get("zeta"), 1);
  assert.equal(counts.get("epsilon"), undefined);
  const ranked = baselineRecentFrequency(priors, "2024-01-15", 1);
  assert.ok(ranked.every((r) => ["alpha", "zeta"].includes(r.songKey)));
});

test("recall and slot hit metrics", () => {
  const ranked = [
    { songKey: "alpha", score: 3 },
    { songKey: "beta", score: 2 },
    { songKey: "zzz", score: 1 },
  ];
  assert.equal(
    playedSongRecallAtK(["Alpha", "Beta", "Eta"], ranked, 2),
    2 / 3
  );
  const hit = exactSlotHitAtK(
    { s1o: "Alpha", s1c: "Nope", s2o: "Beta", s2c: "", enc: "Alpha" },
    ranked,
    2
  );
  assert.equal(hit.bySlot.s1o, 1);
  assert.equal(hit.bySlot.s1c, 0);
  assert.equal(hit.bySlot.s2o, 1);
  assert.ok(hit.mean > 0);
  const { brier, n } = rankBrierScore(["Alpha"], ranked, 3);
  assert.ok(n === 3);
  assert.ok(brier >= 0 && brier <= 1);
});

test("showRecordFromPhishnetPayload builds slots from fixture", () => {
  const payload = JSON.parse(
    readFileSync(
      join(here, "../__fixtures__/phishnet-setlist-sample.json"),
      "utf8"
    )
  );
  const rec = showRecordFromPhishnetPayload("2024-07-19", payload);
  assert.ok(rec);
  assert.equal(rec.showDate, "2024-07-19");
  assert.equal(rec.slots.s1o, "Song A");
  assert.equal(rec.slots.s2o, "Song C");
  assert.equal(rec.slots.enc, "Song E");
  // Closers require set2/encore present — fixture has both.
  assert.equal(rec.slots.s1c, "Song B");
  assert.equal(rec.slots.s2c, "Song D");
  assert.ok(!rec.songs.includes("")); // no empties
});

test("buildHistoryIndex ignores future shows when fed priors only", () => {
  const priors = priorShows(FIXTURE_HISTORY, "2024-01-10");
  const idx = buildHistoryIndex(priors);
  assert.equal(idx.showCount, 2);
  assert.equal(idx.playCount.get("alpha"), 1);
  assert.equal(idx.playCount.get("zeta"), undefined);
});
