/**
 * Feature extraction with strict showDate < targetDate cutoffs (#648).
 * Never reads target-night labels as candidate features.
 */
import { normalizeTitle, daysBetween } from "./shared.mjs";

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
export function priorShows(historySortedAsc, targetDate) {
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
export function buildHistoryIndex(priors) {
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
export function reconstructGap(priors, targetDate, songKey) {
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
export function recentPlayCounts(priors, window) {
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
export function calendarContext(priors, targetDate) {
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
export function assertNoTargetLeakage(priors, targetDate) {
  for (const show of priors) {
    if (show.showDate >= targetDate) {
      throw new Error(
        `Leakage: prior show ${show.showDate} is not strictly before target ${targetDate}`
      );
    }
  }
}
