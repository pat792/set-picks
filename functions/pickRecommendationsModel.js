/**
 * Production CJS port of the explainable recommendation model (#649/#650).
 * Keep MODEL_VERSION / MODEL_WEIGHTS in sync with scripts/prediction-backtest/lib/model.mjs.
 * Generated/maintained for Cloud Functions deploy (scripts/ is not packaged).
 */
"use strict";

const POSITIONAL_SLOTS = ["s1o", "s1c", "s2o", "s2c", "enc"];

function normalizeTitle(title) {
  return String(title ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function daysBetween(a, b) {
  const ta = Date.parse(a + "T12:00:00Z");
  const tb = Date.parse(b + "T12:00:00Z");
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return NaN;
  return Math.round((tb - ta) / 86400000);
}

/**
 * Feature extraction with strict showDate < targetDate cutoffs (#648).
 * Never reads target-night labels as candidate features.
 */
/**
 * @typedef {{
 *   showDate: string,
 *   songs: string[],
 *   slots: Record<string, string>,
 *   encoreSongs: string[],
 * }} ShowRecord
 */

/**
 * @param {ShowRecord[]} historySortedAsc
 * @param {string} targetDate
 * @returns {ShowRecord[]}
 */
function priorShows(historySortedAsc, targetDate) {
  return historySortedAsc.filter((s) => s.showDate < targetDate);
}

/**
 * Rebuild play counts and last-played dates from prior shows only.
 * @param {ShowRecord[]} priors
 * @returns {{
 *   playCount: Map<string, number>,
 *   lastPlayed: Map<string, string>,
 *   slotCounts: Map<string, Map<string, number>>,
 *   songs: Set<string>,
 *   showCount: number,
 * }}
 */
function buildHistoryIndex(priors) {
  /** @type {Map<string, number>} */
  const playCount = new Map();
  /** @type {Map<string, string>} */
  const lastPlayed = new Map();
  /** @type {Map<string, Map<string, number>} */
  const slotCounts = new Map();
  /** @type {Set<string>} */
  const songs = new Set();

  for (const show of priors) {
    const seenTonight = new Set();
    for (const raw of show.songs) {
      const key = normalizeTitle(raw);
      if (!key || seenTonight.has(key)) continue;
      seenTonight.add(key);
      songs.add(key);
      playCount.set(key, (playCount.get(key) || 0) + 1);
      lastPlayed.set(key, show.showDate);
    }
    for (const [slot, title] of Object.entries(show.slots || {})) {
      const key = normalizeTitle(title);
      if (!key) continue;
      if (!slotCounts.has(slot)) slotCounts.set(slot, new Map());
      const m = slotCounts.get(slot);
      m.set(key, (m.get(key) || 0) + 1);
    }
  }

  return {
    playCount,
    lastPlayed,
    slotCounts,
    songs,
    showCount: priors.length,
  };
}

/**
 * Shows-since-last-play reconstructed from prior history (not target songGaps).
 * @param {ShowRecord[]} priors
 * @param {string} targetDate
 * @param {string} songKey normalized
 * @returns {number} gap in shows; Infinity if never played
 */
function reconstructGap(priors, targetDate, songKey) {
  let gap = 0;
  for (let i = priors.length - 1; i >= 0; i -= 1) {
    const show = priors[i];
    if (show.showDate >= targetDate) continue;
    const hit = show.songs.some((t) => normalizeTitle(t) === songKey);
    if (hit) return gap;
    gap += 1;
  }
  return Number.POSITIVE_INFINITY;
}

/**
 * Recent-window play counts ending strictly before targetDate.
 * @param {ShowRecord[]} priors
 * @param {number} window
 * @returns {Map<string, number>}
 */
function recentPlayCounts(priors, window) {
  const slice = priors.slice(Math.max(0, priors.length - window));
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const show of slice) {
    const seen = new Set();
    for (const raw of show.songs) {
      const key = normalizeTitle(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

/**
 * @param {ShowRecord[]} priors
 * @param {string} targetDate
 * @returns {{ daysSincePriorShow: number | null, priorShowDate: string | null }}
 */
function calendarContext(priors, targetDate) {
  const prior = priors.length ? priors[priors.length - 1] : null;
  if (!prior) return { daysSincePriorShow: null, priorShowDate: null };
  return {
    daysSincePriorShow: daysBetween(prior.showDate, targetDate),
    priorShowDate: prior.showDate,
  };
}

/**
 * Guard: ensure labels for targetDate are not mixed into feature priors.
 * @param {ShowRecord[]} priors
 * @param {string} targetDate
 */
function assertNoTargetLeakage(priors, targetDate) {
  for (const show of priors) {
    if (show.showDate >= targetDate) {
      throw new Error(
        `Leakage: prior show ${show.showDate} is not strictly before target ${targetDate}`
      );
    }
  }
}


/**
 * Explainable play × slot recommendation model (#649).
 *
 * modelVersion is frozen in MODEL_VERSION / docs after it beats baselines.
 */
/** Frozen identifier once calibration ships — bump when weights change. */
const MODEL_VERSION = "v0.1.0-explainable";

/** Training-window description for reports / artifact metadata. */
const MODEL_TRAINING_WINDOW =
  "rolling-origin; features from all prior cached shows";

/**
 * Hand-tuned v0 weights — replace only with a version bump after re-backtest.
 * Kept intentionally simple / explainable (no black-box ML).
 */
const MODEL_WEIGHTS = {
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
function riskBand(playProb, gap) {
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
function rankCombinedForSlot(priors, targetDate, slot) {
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
function rankCombinedPlayOnly(priors, targetDate) {
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


module.exports = {
  MODEL_VERSION,
  MODEL_TRAINING_WINDOW,
  MODEL_WEIGHTS,
  POSITIONAL_SLOTS,
  normalizeTitle,
  riskBand,
  rankCombinedForSlot,
  rankCombinedPlayOnly,
  priorShows,
  buildHistoryIndex,
  assertNoTargetLeakage,
};
