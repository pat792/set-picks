/**
 * Evaluation metrics for recommendation backtests (#648).
 */
import { normalizeTitle, POSITIONAL_SLOTS } from "./shared.mjs";

/**
 * @param {string[]} playedTitles
 * @param {{ songKey: string }[]} ranked
 * @param {number} k
 * @returns {number} recall in [0,1]
 */
export function playedSongRecallAtK(playedTitles, ranked, k) {
  const truth = new Set(
    playedTitles.map(normalizeTitle).filter(Boolean)
  );
  if (truth.size === 0) return 0;
  const top = ranked.slice(0, k).map((r) => r.songKey);
  let hits = 0;
  for (const key of top) {
    if (truth.has(key)) hits += 1;
  }
  return hits / truth.size;
}

/**
 * @param {Record<string, string>} slots
 * @param {{ songKey: string }[]} ranked
 * @param {number} k
 * @returns {{ bySlot: Record<string, number>, mean: number }}
 */
export function exactSlotHitAtK(slots, ranked, k) {
  const top = new Set(ranked.slice(0, k).map((r) => r.songKey));
  /** @type {Record<string, number>} */
  const bySlot = {};
  let sum = 0;
  let n = 0;
  for (const slot of POSITIONAL_SLOTS) {
    const truth = normalizeTitle(slots?.[slot]);
    if (!truth) continue;
    const hit = top.has(truth) ? 1 : 0;
    bySlot[slot] = hit;
    sum += hit;
    n += 1;
  }
  return { bySlot, mean: n ? sum / n : 0 };
}

/**
 * Rank-based pseudo-probabilities vs binary play outcomes (Brier).
 * @param {string[]} playedTitles
 * @param {{ songKey: string, score: number }[]} ranked
 * @param {number} [cap] evaluate top-N only (rest treated as p≈0)
 * @returns {{ brier: number, n: number }}
 */
export function rankBrierScore(playedTitles, ranked, cap = 100) {
  const truth = new Set(playedTitles.map(normalizeTitle).filter(Boolean));
  const slice = ranked.slice(0, cap);
  if (!slice.length) return { brier: 1, n: 0 };
  const inv = slice.map((_, i) => 1 / (i + 1));
  const invSum = inv.reduce((a, b) => a + b, 0);
  let sumSq = 0;
  for (let i = 0; i < slice.length; i += 1) {
    const p = inv[i] / invSum;
    const y = truth.has(slice[i].songKey) ? 1 : 0;
    sumSq += (p - y) ** 2;
  }
  return { brier: sumSq / slice.length, n: slice.length };
}

/**
 * If a player locked top-1 per positional slot from this ranking, would they
 * score any points? Proxy for "avoid zero-score night" (exact or in-setlist).
 * @param {Record<string, string>} slots
 * @param {string[]} playedTitles
 * @param {{ songKey: string }[]} ranked
 * @returns {{ zeroScore: boolean, exactHits: number, inSetlistHits: number }}
 */
export function simulatedPickCardOutcome(slots, playedTitles, ranked) {
  const played = new Set(playedTitles.map(normalizeTitle).filter(Boolean));
  const top1 = ranked[0]?.songKey;
  let exactHits = 0;
  let inSetlistHits = 0;
  for (const slot of POSITIONAL_SLOTS) {
    const pick = top1; // slot-agnostic baselines share one ranking
    if (!pick) continue;
    const truth = normalizeTitle(slots?.[slot]);
    if (truth && pick === truth) exactHits += 1;
    else if (played.has(pick)) inSetlistHits += 1;
  }
  // Wild: top1 in setlist counts as non-zero
  const wildHit = top1 && played.has(top1) ? 1 : 0;
  const anyPoints = exactHits + inSetlistHits + wildHit > 0;
  return {
    zeroScore: !anyPoints,
    exactHits,
    inSetlistHits: inSetlistHits + wildHit,
  };
}

/**
 * Overlap of top-K lists across slots (slot-agnostic → 1.0).
 * @param {Record<string, { songKey: string }[]>} rankedBySlot
 * @param {number} k
 * @returns {number} mean pairwise Jaccard
 */
export function crossSlotOverlap(rankedBySlot, k) {
  const slots = Object.keys(rankedBySlot);
  if (slots.length < 2) return 1;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const a = new Set(rankedBySlot[slots[i]].slice(0, k).map((r) => r.songKey));
      const b = new Set(rankedBySlot[slots[j]].slice(0, k).map((r) => r.songKey));
      let inter = 0;
      for (const x of a) if (b.has(x)) inter += 1;
      const union = a.size + b.size - inter;
      sum += union ? inter / union : 1;
      n += 1;
    }
  }
  return n ? sum / n : 1;
}

/**
 * Concentration proxy: share of mass in top-3 of a softmax-ish of inverse ranks.
 * @param {{ songKey: string }[]} ranked
 * @returns {number}
 */
export function top3Concentration(ranked) {
  const n = Math.min(20, ranked.length);
  if (!n) return 0;
  const inv = Array.from({ length: n }, (_, i) => 1 / (i + 1));
  const sum = inv.reduce((a, b) => a + b, 0);
  return (inv[0] + (inv[1] || 0) + (inv[2] || 0)) / sum;
}

/**
 * @param {object[]} nightRows per-show metric objects
 * @returns {object} means
 */
export function aggregateNights(nightRows) {
  if (!nightRows.length) {
    return { nights: 0 };
  }
  const keys = [
    "recallAt5",
    "recallAt10",
    "slotHitAt5",
    "slotHitAt10",
    "brier",
    "zeroScoreRate",
    "top3Concentration",
  ];
  /** @type {Record<string, number>} */
  const out = { nights: nightRows.length };
  for (const key of keys) {
    const vals = nightRows.map((r) => r[key]).filter((v) => Number.isFinite(v));
    out[key] = vals.length
      ? vals.reduce((a, b) => a + b, 0) / vals.length
      : NaN;
  }
  return out;
}
