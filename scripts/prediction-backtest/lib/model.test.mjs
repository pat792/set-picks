/**
 * Combined model unit tests (#649).
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  rankCombinedForSlot,
  rankCombinedPlayOnly,
  riskBand,
  MODEL_VERSION,
} from "./model.mjs";
import { priorShows } from "./features.mjs";
import { runRollingBacktest, evaluateGoNoGo, MODEL_NAME } from "./backtest.mjs";

/** @type {import('./features.mjs').ShowRecord[]} */
function buildHistory(n = 40) {
  /** @type {import('./features.mjs').ShowRecord[]} */
  const out = [];
  const openers = ["Alpha", "Beta", "Gamma", "Delta"];
  for (let i = 0; i < n; i += 1) {
    const d = new Date(Date.UTC(2023, 0, 1 + i * 3));
    const showDate = d.toISOString().slice(0, 10);
    const s1o = openers[i % openers.length];
    const s1c = openers[(i + 1) % openers.length];
    const s2o = openers[(i + 2) % openers.length];
    const s2c = openers[(i + 3) % openers.length];
    const enc = i % 5 === 0 ? "RareCut" : openers[i % openers.length];
    const songs = [s1o, "FillA", s1c, s2o, "FillB", s2c, enc];
    if (i % 7 === 0) songs.push("BustoutHero");
    out.push({
      showDate,
      songs,
      slots: { s1o, s1c, s2o, s2c, enc },
      encoreSongs: [enc],
    });
  }
  return out;
}

test("MODEL_VERSION is set", () => {
  assert.match(MODEL_VERSION, /^v\d+\.\d+\.\d+/);
});

test("riskBand maps safe / slot_fit / long_shot / unbanded", () => {
  assert.equal(riskBand(0.7, 5), "safe");
  assert.equal(riskBand(0.2, 40), "long_shot");
  assert.equal(riskBand(0.45, 5), "unbanded");
  assert.equal(
    riskBand(0.45, 5, { slot: "s1o", slotHits: 5, showCount: 40 }),
    "slot_fit"
  );
  assert.equal(
    riskBand(0.7, 5, { slot: "s1o", slotHits: 5, showCount: 40 }),
    "slot_fit",
    "slot strength wins over high playProb when browsing a slot"
  );
  assert.equal(
    riskBand(0.45, 5, { slot: "s1o", slotHits: 1, showCount: 40 }),
    "unbanded",
    "single slot hit is not strong enough"
  );
});

test("combined model is slot-aware and leakage-safe", () => {
  const history = buildHistory(35);
  const target = history[34];
  const priors = priorShows(history, target.showDate);
  const s1o = rankCombinedForSlot(priors, target.showDate, "s1o");
  const enc = rankCombinedForSlot(priors, target.showDate, "enc");
  assert.ok(s1o.length > 5);
  assert.ok(enc.length > 5);
  assert.ok(s1o[0].playProb > 0);
  assert.ok(["safe", "slot_fit", "long_shot"].includes(s1o[0].riskBand));
  // Slot affinity should change at least one score vs wild/play-only path
  const playOnly = rankCombinedPlayOnly(priors, target.showDate);
  const s1Scores = new Map(s1o.map((r) => [r.songKey, r.score]));
  assert.ok(
    playOnly.some((r) => Math.abs((s1Scores.get(r.songKey) || 0) - r.score) > 1e-9)
  );
  assert.throws(() =>
    rankCombinedForSlot(history, history[0].showDate, "s1o")
  );
});

test("play-only ranking exposes modelVersion", () => {
  const history = buildHistory(35);
  const target = history[34];
  const priors = priorShows(history, target.showDate);
  const ranked = rankCombinedPlayOnly(priors, target.showDate);
  assert.equal(ranked[0].modelVersion, MODEL_VERSION);
});

test("synthetic backtest includes combined and go/no-go helper runs", () => {
  const history = buildHistory(45);
  const result = runRollingBacktest(history, {
    minTrainShows: 20,
    includeCombined: true,
  });
  assert.ok(result.summary[MODEL_NAME]);
  assert.ok(result.evaluatedNights > 5);
  const gate = evaluateGoNoGo(result);
  assert.equal(typeof gate.pass, "boolean");
  assert.ok(gate.reason);
});
