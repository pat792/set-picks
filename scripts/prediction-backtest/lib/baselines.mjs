/**
 * Baseline rankers for #648 (no combined model — that is #649).
 */
import {
  buildHistoryIndex,
  recentPlayCounts,
  reconstructGap,
  assertNoTargetLeakage,
} from "./features.mjs";
import { normalizeTitle } from "./shared.mjs";

/**
 * @typedef {{ songKey: string, score: number, reason: string }} RankedSong
 */

/**
 * @param {Map<string, number>} scores
 * @param {string} reason
 * @returns {RankedSong[]}
 */
function rankFromScores(scores, reason) {
  return [...scores.entries()]
    .map(([songKey, score]) => ({ songKey, score, reason }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.songKey.localeCompare(b.songKey);
    });
}

/**
 * Global lifetime play count before target.
 * @param {import('./features.mjs').ShowRecord[]} priors
 * @param {string} targetDate
 * @returns {RankedSong[]}
 */
export function baselineGlobalPopularity(priors, targetDate) {
  assertNoTargetLeakage(priors, targetDate);
  const { playCount } = buildHistoryIndex(priors);
  return rankFromScores(playCount, "global_popularity");
}

/**
 * Autocomplete-style: lowest reconstructed gap first, then most plays.
 * @param {import('./features.mjs').ShowRecord[]} priors
 * @param {string} targetDate
 * @returns {RankedSong[]}
 */
export function baselineGapAscending(priors, targetDate) {
  assertNoTargetLeakage(priors, targetDate);
  const { playCount, songs } = buildHistoryIndex(priors);
  /** @type {RankedSong[]} */
  const rows = [];
  for (const songKey of songs) {
    const gap = reconstructGap(priors, targetDate, songKey);
    const plays = playCount.get(songKey) || 0;
    // Invert gap into a score: lower gap → higher score; never-played last.
    const gapScore = Number.isFinite(gap) ? 1 / (1 + gap) : 0;
    rows.push({
      songKey,
      score: gapScore * 1e6 + plays,
      reason: `gap_asc gap=${Number.isFinite(gap) ? gap : "inf"} plays=${plays}`,
    });
  }
  return rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.songKey.localeCompare(b.songKey);
  });
}

/**
 * Plays in the trailing `window` shows before target.
 * @param {import('./features.mjs').ShowRecord[]} priors
 * @param {string} targetDate
 * @param {number} [window]
 * @returns {RankedSong[]}
 */
export function baselineRecentFrequency(priors, targetDate, window = 25) {
  assertNoTargetLeakage(priors, targetDate);
  const counts = recentPlayCounts(priors, window);
  return rankFromScores(counts, `recent_freq_${window}`);
}

/**
 * @param {'global_popularity' | 'gap_ascending' | 'recent_frequency'} name
 * @param {import('./features.mjs').ShowRecord[]} priors
 * @param {string} targetDate
 * @param {{ recentWindow?: number }} [opts]
 * @returns {RankedSong[]}
 */
export function runBaseline(name, priors, targetDate, opts = {}) {
  switch (name) {
    case "global_popularity":
      return baselineGlobalPopularity(priors, targetDate);
    case "gap_ascending":
      return baselineGapAscending(priors, targetDate);
    case "recent_frequency":
      return baselineRecentFrequency(priors, targetDate, opts.recentWindow ?? 25);
    default:
      throw new Error(`Unknown baseline: ${name}`);
  }
}

/**
 * Display title from last casing seen in priors, else songKey.
 * @param {import('./features.mjs').ShowRecord[]} priors
 * @param {string} songKey
 * @returns {string}
 */
export function displayTitleFor(priors, songKey) {
  for (let i = priors.length - 1; i >= 0; i -= 1) {
    for (const t of priors[i].songs) {
      if (normalizeTitle(t) === songKey) return t;
    }
  }
  return songKey;
}
