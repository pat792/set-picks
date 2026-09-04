import { FORM_FIELDS } from '../../../shared/data/gameConfig';

/** Must match `functions/globalStatsLeaderboards.js`. */
export const GLOBAL_LEADERBOARD_TOP_N = 50;
export const GLOBAL_LEADERBOARD_MIN_SHOWS = 3;
export const GLOBAL_LEADERBOARD_SLOTS_PER_SHOW = FORM_FIELDS.length;
export const ALL_TIME_LEADERBOARD_DOC_ID = 'allTime';

export const GLOBAL_LEADERBOARD_BOARDS = [
  {
    key: 'pointsPerShow',
    title: 'Points per show',
    hint: 'Mean points per graded show. Players need at least 3 shows to rank.',
    minShows: GLOBAL_LEADERBOARD_MIN_SHOWS,
  },
  {
    key: 'pickingAverage',
    title: 'Picking average',
    hint: `Correct picks ÷ total picks (${GLOBAL_LEADERBOARD_SLOTS_PER_SHOW} per show). Players need at least 3 shows to rank.`,
    minShows: GLOBAL_LEADERBOARD_MIN_SHOWS,
  },
  {
    key: 'shows',
    title: 'Shows',
    hint: 'Finalized shows with graded picks. No minimum-shows gate.',
    minShows: 0,
  },
];

/**
 * @param {unknown} value
 * @returns {number | null}
 */
export function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * @param {unknown} totalPoints
 * @param {unknown} shows
 * @returns {number | null}
 */
export function computePointsPerShow(totalPoints, shows) {
  const pts = finiteNumber(totalPoints);
  const n = finiteNumber(shows);
  if (pts == null || n == null || n <= 0) return null;
  return pts / n;
}

/**
 * @param {unknown} correctSlots
 * @param {unknown} shows
 * @returns {number | null}
 */
export function computePickingAverage(correctSlots, shows) {
  const correct = finiteNumber(correctSlots);
  const n = finiteNumber(shows);
  if (correct == null || n == null || n <= 0) return null;
  return correct / (n * GLOBAL_LEADERBOARD_SLOTS_PER_SHOW);
}

/**
 * @param {unknown} avg
 * @returns {string}
 */
export function formatPointsPerShow(avg) {
  if (typeof avg !== 'number' || !Number.isFinite(avg)) return '—';
  const rounded = Math.round(avg * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Batting-average style (".500", "1.000").
 *
 * @param {unknown} avg
 * @returns {string}
 */
export function formatPickingAverage(avg) {
  if (typeof avg !== 'number' || !Number.isFinite(avg)) return '—';
  const fixed = avg.toFixed(3);
  return fixed.startsWith('0.') ? fixed.slice(1) : fixed;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatShowsCount(value) {
  const n = finiteNumber(value);
  return n == null ? '—' : String(n);
}

/**
 * @param {'pointsPerShow' | 'pickingAverage' | 'shows'} boardKey
 * @param {unknown} value
 * @returns {string}
 */
export function formatBoardValue(boardKey, value) {
  if (boardKey === 'pickingAverage') return formatPickingAverage(value);
  if (boardKey === 'shows') return formatShowsCount(value);
  return formatPointsPerShow(value);
}

/**
 * @param {string} tourKey
 * @returns {string}
 */
export function tourLeaderboardDocId(tourKey) {
  return `tour:${tourKey}`;
}

/**
 * Competition ranking (1, 1, 3). Higher value wins; ties break by more shows,
 * then handle A→Z.
 *
 * @param {Array<{ uid?: string, handle?: string, value?: unknown, shows?: unknown }>} candidates
 * @param {{ minShows?: number, topN?: number }} [opts]
 * @returns {Array<{ uid: string, handle: string, value: number, shows: number, rank: number }>}
 */
export function rankBoard(candidates, opts = {}) {
  const minShows = Number.isFinite(opts.minShows)
    ? opts.minShows
    : GLOBAL_LEADERBOARD_MIN_SHOWS;
  const topN = Number.isFinite(opts.topN) ? opts.topN : GLOBAL_LEADERBOARD_TOP_N;

  const eligible = [];
  for (const row of candidates || []) {
    if (!row || typeof row.uid !== 'string' || !row.uid) continue;
    const value = finiteNumber(row.value);
    if (value == null) continue;
    const shows = finiteNumber(row.shows) ?? 0;
    if (minShows > 0 && shows < minShows) continue;
    const handle =
      typeof row.handle === 'string' && row.handle.trim()
        ? row.handle.trim()
        : 'Anonymous';
    eligible.push({ uid: row.uid, handle, value, shows });
  }

  eligible.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    if (b.shows !== a.shows) return b.shows - a.shows;
    return a.handle.localeCompare(b.handle, 'en');
  });

  const ranked = [];
  let lastValue = null;
  let lastRank = 0;
  for (let i = 0; i < eligible.length; i += 1) {
    const row = eligible[i];
    const rank = lastValue === row.value ? lastRank : i + 1;
    lastValue = row.value;
    lastRank = rank;
    ranked.push({ ...row, rank });
  }
  return ranked.slice(0, topN);
}

/**
 * Viewer metrics from the signed-in `users/{uid}` doc (no extra collection scan).
 *
 * @param {Record<string, unknown> | null | undefined} userDoc
 * @param {{ uid?: string | null, tourKey?: string | null, scope: 'allTime' | 'tour' }} opts
 * @returns {{
 *   uid: string,
 *   handle: string,
 *   shows: number,
 *   values: { pointsPerShow: number | null, pickingAverage: number | null, shows: number | null },
 * } | null}
 */
export function viewerMetricsFromUserDoc(userDoc, { uid, tourKey, scope }) {
  const viewerUid = typeof uid === 'string' ? uid.trim() : '';
  if (!viewerUid || !userDoc || typeof userDoc !== 'object') return null;

  const handle =
    typeof userDoc.handle === 'string' && userDoc.handle.trim()
      ? userDoc.handle.trim()
      : 'Anonymous';

  if (scope === 'tour') {
    if (!tourKey) return null;
    const season =
      userDoc.seasonStats && typeof userDoc.seasonStats === 'object'
        ? userDoc.seasonStats[tourKey]
        : null;
    const shows = finiteNumber(season?.shows) ?? 0;
    return {
      uid: viewerUid,
      handle,
      shows,
      values: {
        pointsPerShow: computePointsPerShow(season?.totalPoints, shows),
        pickingAverage: computePickingAverage(season?.correctSlots, shows),
        shows: shows > 0 ? shows : finiteNumber(season?.shows),
      },
    };
  }

  const shows = finiteNumber(userDoc.showsPlayed) ?? 0;
  return {
    uid: viewerUid,
    handle,
    shows,
    values: {
      pointsPerShow: computePointsPerShow(userDoc.totalPoints, shows),
      pickingAverage: computePickingAverage(userDoc.careerCorrectSlots, shows),
      shows: shows > 0 ? shows : finiteNumber(userDoc.showsPlayed),
    },
  };
}

/**
 * Highlight the viewer in the top 50, or append a you-row when they sit outside.
 *
 * @param {Array<{ uid?: string, handle?: string, value?: unknown, shows?: unknown, rank?: unknown }>} boardRows
 * @param {{
 *   uid: string,
 *   handle: string,
 *   shows: number,
 *   value: number | null,
 * } | null} viewer
 * @returns {Array<{
 *   uid: string,
 *   handle: string,
 *   value: number | null,
 *   shows: number,
 *   rank: number | null,
 *   isSelf: boolean,
 *   outsideTop: boolean,
 * }>}
 */
export function mergeYouRow(boardRows, viewer) {
  const list = Array.isArray(boardRows) ? boardRows : [];
  const normalized = list
    .filter((row) => row && typeof row.uid === 'string' && row.uid)
    .map((row) => ({
      uid: row.uid,
      handle:
        typeof row.handle === 'string' && row.handle.trim()
          ? row.handle.trim()
          : 'Anonymous',
      value: finiteNumber(row.value),
      shows: finiteNumber(row.shows) ?? 0,
      rank: finiteNumber(row.rank),
      isSelf: false,
      outsideTop: false,
    }));

  if (!viewer?.uid) return normalized;

  const inList = normalized.some((row) => row.uid === viewer.uid);
  if (inList) {
    return normalized.map((row) =>
      row.uid === viewer.uid ? { ...row, isSelf: true } : row
    );
  }

  return [
    ...normalized,
    {
      uid: viewer.uid,
      handle: viewer.handle,
      value: viewer.value,
      shows: viewer.shows,
      rank: null,
      isSelf: true,
      outsideTop: true,
    },
  ];
}

/**
 * @param {Record<string, unknown> | null | undefined} aggregateDoc
 * @param {ReturnType<typeof viewerMetricsFromUserDoc>} viewer
 * @returns {Record<string, ReturnType<typeof mergeYouRow>>}
 */
export function mergeAllBoards(aggregateDoc, viewer) {
  const boards =
    aggregateDoc?.boards && typeof aggregateDoc.boards === 'object'
      ? aggregateDoc.boards
      : {};
  /** @type {Record<string, ReturnType<typeof mergeYouRow>>} */
  const merged = {};
  for (const { key } of GLOBAL_LEADERBOARD_BOARDS) {
    const rows = Array.isArray(boards[key]) ? boards[key] : [];
    const you = viewer
      ? {
          uid: viewer.uid,
          handle: viewer.handle,
          shows: viewer.shows,
          value: viewer.values[key] ?? null,
        }
      : null;
    merged[key] = mergeYouRow(rows, you);
  }
  return merged;
}
