/**
 * Explainable play × slot recommendation model (#649).
 *
 * modelVersion is frozen in MODEL_VERSION / docs after it beats baselines.
 */
import {
  buildHistoryIndex,
  recentPlayCounts,
  reconstructGap,
  assertNoTargetLeakage,
  calendarContext,
} from "./features.mjs";
import { normalizeTitle, POSITIONAL_SLOTS } from "./shared.mjs";

/** Frozen identifier once calibration ships — bump when weights change. */
export const MODEL_VERSION = "v0.1.0-explainable";

/** Training-window description for reports / artifact metadata. */
export const MODEL_TRAINING_WINDOW =
  "rolling-origin; features from all prior cached shows";

/**
 * Hand-tuned v0 weights — replace only with a version bump after re-backtest.
 * Kept intentionally simple / explainable (no black-box ML).
 */
export const MODEL_WEIGHTS = {
  recent10: 0.35,
  recent25: 0.25,
  recent50: 0.15,
  lifetime: 0.15,
  gapCadence: 0.2,
  priorNightRepeatPenalty: 0.45,
  daysSincePriorScale: 0.05,
  slotSmoothingAlpha: 1.5,
  bustoutGapMin: 30,
};

/**
 * Precompute shared maps once per (priors, targetDate).
 * @param {import('./features.mjs').ShowRecord[]} priors
 * @param {string} targetDate
 */
function buildFeatureContext(priors, targetDate) {
  const idx = buildHistoryIndex(priors);
  const r10 = recentPlayCounts(priors, 10);
  const r25 = recentPlayCounts(priors, 25);
  const r50 = recentPlayCounts(priors, 50);
  const lastPrior = priors[priors.length - 1] || null;
  const priorNightKeys = new Set(
    (lastPrior?.songs || []).map(normalizeTitle).filter(Boolean)
  );
  const { daysSincePriorShow } = calendarContext(priors, targetDate);
  /** @type {Map<string, number>} */
  const gaps = new Map();
  for (const songKey of idx.songs) {
    gaps.set(songKey, reconstructGap(priors, targetDate, songKey));
  }
  return {
    idx,
    r10,
    r25,
    r50,
    priorNightKeys,
    daysSincePriorShow,
    gaps,
  };
}

/**
 * @param {ReturnType<typeof buildFeatureContext>} ctx
 * @param {string} songKey
 */
function playFeaturesFromCtx(ctx, songKey) {
  const plays = ctx.idx.playCount.get(songKey) || 0;
  const showCount = Math.max(1, ctx.idx.showCount);
  const recent10 = (ctx.r10.get(songKey) || 0) / Math.min(10, showCount);
  const recent25 = (ctx.r25.get(songKey) || 0) / Math.min(25, showCount);
  const recent50 = (ctx.r50.get(songKey) || 0) / Math.min(50, showCount);
  const lifetime = (plays + 1) / (showCount + 10);
  const gap = ctx.gaps.get(songKey) ?? Number.POSITIVE_INFINITY;

  let gapCadence = 0.15;
  if (Number.isFinite(gap) && plays > 0) {
    const expectedReturn = Math.max(2, Math.round(1 / Math.max(lifetime, 0.02)));
    const ratio = gap / expectedReturn;
    gapCadence = Math.exp(-((ratio - 1) ** 2) / 0.7);
  }

  const restBonus =
    ctx.daysSincePriorShow != null && ctx.daysSincePriorShow >= 3
      ? Math.min(1, (ctx.daysSincePriorShow - 2) / 10)
      : 0;

  return {
    recent10,
    recent25,
    recent50,
    lifetime,
    gap,
    gapCadence,
    playedPriorNight: ctx.priorNightKeys.has(songKey),
    restBonus,
    plays,
  };
}

/**
 * @param {ReturnType<typeof playFeaturesFromCtx>} f
 * @returns {{ playProb: number, reasons: string[] }}
 */
function scorePlayLikelihood(f) {
  const w = MODEL_WEIGHTS;
  let raw =
    w.recent10 * f.recent10 +
    w.recent25 * f.recent25 +
    w.recent50 * f.recent50 +
    w.lifetime * f.lifetime +
    w.gapCadence * f.gapCadence +
    w.daysSincePriorScale * f.restBonus;

  const reasons = [];
  if (f.recent25 >= 0.2) reasons.push("frequent this tour window");
  if (f.gapCadence >= 0.7 && Number.isFinite(f.gap)) {
    reasons.push(`due vs cadence (gap ${f.gap})`);
  }
  if (f.playedPriorNight) {
    raw *= 1 - w.priorNightRepeatPenalty;
    reasons.push("unlikely repeat after prior night");
  }
  if (f.gap >= w.bustoutGapMin && Number.isFinite(f.gap)) {
    reasons.push(`bustout / long-shot upside (gap ${f.gap})`);
  }

  const playProb = 1 / (1 + Math.exp(-6 * (raw - 0.25)));
  return { playProb, reasons: reasons.slice(0, 2) };
}

/**
 * @param {ReturnType<typeof buildFeatureContext>} ctx
 * @param {string} songKey
 * @param {string} slot
 */
function slotAffinityFromCtx(ctx, songKey, slot) {
  const plays = ctx.idx.playCount.get(songKey) || 0;
  const slotMap = ctx.idx.slotCounts.get(slot) || new Map();
  const slotHits = slotMap.get(songKey) || 0;
  const alpha = MODEL_WEIGHTS.slotSmoothingAlpha;
  if (slot === "wild") {
    return { affinity: 1, reason: null };
  }
  const affinity =
    (slotHits + alpha) / (plays + alpha * POSITIONAL_SLOTS.length);
  const reason =
    slotHits > 0 ? `strong ${slot} history (${slotHits}/${plays || 0})` : null;
  return { affinity, reason };
}

/**
 * @param {number} playProb
 * @param {number} gap
 * @returns {'safe' | 'slot_fit' | 'long_shot'}
 */
export function riskBand(playProb, gap) {
  if (playProb >= 0.55) return "safe";
  if (
    Number.isFinite(gap) &&
    gap >= MODEL_WEIGHTS.bustoutGapMin &&
    playProb < 0.4
  ) {
    return "long_shot";
  }
  return "slot_fit";
}

/**
 * Rank songs for a single slot using playProb × slotAffinity.
 *
 * @param {import('./features.mjs').ShowRecord[]} priors
 * @param {string} targetDate
 * @param {string} slot
 */
export function rankCombinedForSlot(priors, targetDate, slot) {
  assertNoTargetLeakage(priors, targetDate);
  const ctx = buildFeatureContext(priors, targetDate);
  /** @type {Array<{
   *   songKey: string,
   *   score: number,
   *   playProb: number,
   *   slotAffinity: number,
   *   riskBand: string,
   *   reasons: string[],
   *   modelVersion: string,
   * }>} */
  const rows = [];

  for (const songKey of ctx.idx.songs) {
    const f = playFeaturesFromCtx(ctx, songKey);
    const { playProb, reasons } = scorePlayLikelihood(f);
    const aff = slotAffinityFromCtx(ctx, songKey, slot);
    const score =
      slot === "wild" ? playProb : playProb * Math.max(0.05, aff.affinity);
    const band = riskBand(playProb, f.gap);
    /** @type {string[]} */
    const allReasons = [...reasons];
    if (aff.reason) allReasons.unshift(aff.reason);

    rows.push({
      songKey,
      score,
      playProb,
      slotAffinity: aff.affinity,
      riskBand: band,
      reasons: allReasons.slice(0, 2),
      modelVersion: MODEL_VERSION,
    });
  }

  return rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.songKey.localeCompare(b.songKey);
  });
}

/**
 * Slot-agnostic ranking (wildcard / play-only) for recall metrics.
 * @param {import('./features.mjs').ShowRecord[]} priors
 * @param {string} targetDate
 */
export function rankCombinedPlayOnly(priors, targetDate) {
  return rankCombinedForSlot(priors, targetDate, "wild").map((r) => ({
    songKey: r.songKey,
    score: r.score,
    reason: r.reasons.join("; ") || "combined_play",
    playProb: r.playProb,
    riskBand: r.riskBand,
    reasons: r.reasons,
    modelVersion: r.modelVersion,
  }));
}
