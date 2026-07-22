/**
 * Rolling-origin backtest loop (#648).
 */
import { priorShows } from "./features.mjs";
import { runBaseline } from "./baselines.mjs";
import {
  playedSongRecallAtK,
  exactSlotHitAtK,
  rankBrierScore,
  simulatedPickCardOutcome,
  top3Concentration,
  aggregateNights,
  crossSlotOverlap,
} from "./metrics.mjs";
import { playedKeys } from "./dataset.mjs";
import { POSITIONAL_SLOTS } from "./shared.mjs";

export const BASELINE_NAMES = [
  "global_popularity",
  "gap_ascending",
  "recent_frequency",
];

/**
 * @param {import('./features.mjs').ShowRecord[]} historySortedAsc
 * @param {{
 *   minTrainShows?: number,
 *   recentWindow?: number,
 *   baselines?: string[],
 * }} [opts]
 */
export function runRollingBacktest(historySortedAsc, opts = {}) {
  const minTrainShows = opts.minTrainShows ?? 30;
  const baselines = opts.baselines ?? BASELINE_NAMES;
  const recentWindow = opts.recentWindow ?? 25;

  /** @type {Record<string, object[]>} */
  const byBaseline = {};
  for (const name of baselines) byBaseline[name] = [];

  for (let i = 0; i < historySortedAsc.length; i += 1) {
    const target = historySortedAsc[i];
    const priors = priorShows(historySortedAsc, target.showDate);
    if (priors.length < minTrainShows) continue;

    const labels = playedKeys(target);
    const slotLabels = target.slots || {};

    for (const name of baselines) {
      const ranked = runBaseline(name, priors, target.showDate, {
        recentWindow,
      });
      const recallAt5 = playedSongRecallAtK(labels, ranked, 5);
      const recallAt10 = playedSongRecallAtK(labels, ranked, 10);
      const slot5 = exactSlotHitAtK(slotLabels, ranked, 5);
      const slot10 = exactSlotHitAtK(slotLabels, ranked, 10);
      const { brier } = rankBrierScore(labels, ranked, 100);
      const sim = simulatedPickCardOutcome(slotLabels, labels, ranked);
      const concentration = top3Concentration(ranked);

      // Slot-agnostic baselines share one list → overlap = 1 by construction.
      /** @type {Record<string, typeof ranked>} */
      const bySlot = {};
      for (const slot of POSITIONAL_SLOTS) bySlot[slot] = ranked;
      const overlap = crossSlotOverlap(bySlot, 5);

      byBaseline[name].push({
        showDate: target.showDate,
        trainShows: priors.length,
        recallAt5,
        recallAt10,
        slotHitAt5: slot5.mean,
        slotHitAt10: slot10.mean,
        slotHitAt5BySlot: slot5.bySlot,
        brier,
        zeroScoreRate: sim.zeroScore ? 1 : 0,
        top3Concentration: concentration,
        crossSlotOverlapAt5: overlap,
      });
    }
  }

  /** @type {Record<string, object>} */
  const summary = {};
  for (const name of baselines) {
    summary[name] = {
      ...aggregateNights(byBaseline[name]),
      meanCrossSlotOverlapAt5:
        byBaseline[name].length === 0
          ? NaN
          : byBaseline[name].reduce((a, r) => a + r.crossSlotOverlapAt5, 0) /
            byBaseline[name].length,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    minTrainShows,
    recentWindow,
    historyShows: historySortedAsc.length,
    evaluatedNights: Object.values(byBaseline)[0]?.length ?? 0,
    summary,
    nights: byBaseline,
  };
}
