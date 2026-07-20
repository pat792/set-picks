/**
 * Pure tour setlist aggregation for Cloud Functions (#665).
 * Mirrors `src/features/tour-stats/model/aggregateTourSetlistStats.js` (no lifetime tiebreak).
 * Keep in sync when changing private explorer math.
 */

const TOUR_STATS_TOP_N = 15;
const TOUR_STATS_GAP_HIGHLIGHT_MIN = 10;
const BUSTOUT_MIN_GAP = 30;

function normalizeTitle(title) {
  return String(title ?? "")
    .trim()
    .toLowerCase();
}

function toGap(raw) {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

/**
 * @param {Array<{ showDate: string, setlist: object | null }>} docs
 * @param {{ tourShowCount?: number, topN?: number }} [options]
 */
function aggregateTourSetlistStats(docs, options = {}) {
  const topN =
    typeof options.topN === "number" && options.topN > 0
      ? Math.trunc(options.topN)
      : TOUR_STATS_TOP_N;
  const tourShowCount =
    typeof options.tourShowCount === "number" && options.tourShowCount >= 0
      ? Math.trunc(options.tourShowCount)
      : Array.isArray(docs)
        ? docs.length
        : 0;

  /** @type {Map<string, { title: string, timesPlayed: number }>} */
  const bySong = new Map();
  /** @type {Array<{ title: string, showDate: string, gap: number | null }>} */
  const bustouts = [];
  /** @type {Array<{ title: string, showDate: string, gap: number }>} */
  const gapHighlights = [];
  let showsWithSetlist = 0;
  let totalSongPlays = 0;

  const list = Array.isArray(docs) ? docs : [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const showDate = typeof entry.showDate === "string" ? entry.showDate.trim() : "";
    const setlist = entry.setlist;
    if (!setlist || typeof setlist !== "object") continue;

    const titles = Array.isArray(setlist.officialSetlist)
      ? setlist.officialSetlist.map((t) => String(t ?? "").trim()).filter(Boolean)
      : [];
    if (titles.length === 0) continue;
    showsWithSetlist += 1;

    const playedThisShow = new Set();
    for (const title of titles) {
      const key = normalizeTitle(title);
      if (!key || playedThisShow.has(key)) continue;
      playedThisShow.add(key);
      totalSongPlays += 1;
      const existing = bySong.get(key);
      if (existing) existing.timesPlayed += 1;
      else bySong.set(key, { title, timesPlayed: 1 });
    }

    const songGaps =
      setlist.songGaps &&
      typeof setlist.songGaps === "object" &&
      !Array.isArray(setlist.songGaps)
        ? setlist.songGaps
        : null;

    const bustoutKeys = new Set();
    const bustoutList = Array.isArray(setlist.bustouts) ? setlist.bustouts : [];
    for (const raw of bustoutList) {
      const title = String(raw ?? "").trim();
      const key = normalizeTitle(title);
      if (!title || !key || bustoutKeys.has(key)) continue;
      if (!playedThisShow.has(key)) continue;
      bustoutKeys.add(key);
      bustouts.push({
        title,
        showDate,
        gap: songGaps ? toGap(songGaps[key]) : null,
      });
    }

    if (songGaps) {
      for (const [key, gapRaw] of Object.entries(songGaps)) {
        if (!playedThisShow.has(key) || bustoutKeys.has(key)) continue;
        const gap = toGap(gapRaw);
        if (gap == null || gap < BUSTOUT_MIN_GAP) continue;
        bustoutKeys.add(key);
        const match = bySong.get(key);
        bustouts.push({ title: match?.title || key, showDate, gap });
      }

      for (const [key, gapRaw] of Object.entries(songGaps)) {
        if (!playedThisShow.has(key) || bustoutKeys.has(key)) continue;
        const gap = toGap(gapRaw);
        if (gap == null || gap < TOUR_STATS_GAP_HIGHLIGHT_MIN || gap >= BUSTOUT_MIN_GAP) {
          continue;
        }
        const match = bySong.get(key);
        gapHighlights.push({ title: match?.title || key, showDate, gap });
      }
    }
  }

  const topSongs = [...bySong.values()]
    .sort((a, b) => {
      if (b.timesPlayed !== a.timesPlayed) return b.timesPlayed - a.timesPlayed;
      return a.title.localeCompare(b.title);
    })
    .slice(0, topN)
    .map((row) => ({ title: row.title, timesPlayed: row.timesPlayed }));

  bustouts.sort((a, b) => {
    const ga = a.gap ?? -1;
    const gb = b.gap ?? -1;
    if (gb !== ga) return gb - ga;
    return a.title.localeCompare(b.title);
  });

  gapHighlights.sort((a, b) => {
    if (b.gap !== a.gap) return b.gap - a.gap;
    return a.title.localeCompare(b.title);
  });

  return {
    tourShowCount,
    showsWithSetlist,
    uniqueSongs: bySong.size,
    totalSongPlays,
    topSongs,
    bustouts,
    gapHighlights: gapHighlights.slice(0, topN),
  };
}

/**
 * Public payload — aggregates only (no officialSetlist arrays, no per-song showDates lists).
 * Bustout/gap rows may include a single showDate (song event), never a full night setlist.
 */
function toPublicTourStatsPayload(stats) {
  return {
    tourShowCount: stats.tourShowCount,
    showsWithSetlist: stats.showsWithSetlist,
    uniqueSongs: stats.uniqueSongs,
    totalSongPlays: stats.totalSongPlays,
    topSongs: (stats.topSongs || []).map((r) => ({
      title: r.title,
      timesPlayed: r.timesPlayed,
    })),
    bustouts: (stats.bustouts || []).map((r) => ({
      title: r.title,
      gap: r.gap,
      showDate: r.showDate || null,
    })),
    gapHighlights: (stats.gapHighlights || []).map((r) => ({
      title: r.title,
      gap: r.gap,
      showDate: r.showDate || null,
    })),
  };
}

function tourLabelToSlug(tourLabel) {
  const raw = String(tourLabel ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return raw || "tour";
}

module.exports = {
  aggregateTourSetlistStats,
  toPublicTourStatsPayload,
  tourLabelToSlug,
  TOUR_STATS_TOP_N,
  TOUR_STATS_GAP_HIGHLIGHT_MIN,
  BUSTOUT_MIN_GAP,
};
