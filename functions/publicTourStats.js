/**
 * Build + write `public_tour_stats/{tourSlug}` aggregate docs (#665).
 * Admin SDK only — never expose full official setlists to clients.
 */
const {
  aggregateTourSetlistStats,
  toPublicTourStatsPayload,
  buildSongEnrichmentByTitle,
  lastPlayedBeforeFromHistory,
  tourLabelToSlug,
} = require("./aggregateTourSetlistStats.cjs");
const {
  fetchPhishnetSongsNormalized,
  isPhishNetPayloadOk,
} = require("./phishnetSongCatalog");

/** Game launch floor — keep aligned with `src/shared/config/gameLaunch.js`. */
const GAME_LAUNCH_SHOW_DATE = "2026-04-16";

/**
 * #666 Phase 1: per-song lifetime enrichment from phish.net (server-side
 * fetch only — the API key never reaches clients). Best-effort: any upstream
 * failure logs and returns null so the public stats refresh itself never
 * depends on phish.net being up.
 *
 * @param {string} apiKey
 * @param {Console} logger
 * @returns {Promise<Map<string, { lifetimePlays: number | null, debutYear: number | null }> | null>}
 */
async function fetchSongEnrichment(apiKey, logger) {
  const key = String(apiKey ?? "").trim();
  if (!key) return null;
  try {
    const songs = await fetchPhishnetSongsNormalized(key);
    const map = buildSongEnrichmentByTitle(songs);
    logger.info("refreshPublicTourStats: phish.net enrichment loaded", {
      songs: songs.length,
      enriched: map.size,
    });
    return map;
  } catch (err) {
    logger.warn(
      "refreshPublicTourStats: phish.net enrichment unavailable — writing unenriched docs",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Safety cap on per-song history lookups per refresh run. Bustout + high-gap
 * songs across all tours are typically well under this; the cap only guards
 * against a pathological calendar from turning the refresh into a phish.net
 * crawl.
 */
const MAX_LAST_PLAYED_LOOKUPS = 80;

/** @param {unknown} title */
function normalizeTitleKey(title) {
  return String(title ?? "").trim().toLowerCase();
}

/**
 * Full play history (`YYYY-MM-DD` show dates) for one song via phish.net
 * `/v5/setlists/slug/{slug}.json`. Phish rows only — the setlists table also
 * carries side-project artists, and gap math is Phish-show based.
 *
 * @param {string} apiKey
 * @param {string} slug
 * @returns {Promise<string[]>}
 */
async function fetchPhishnetSongHistoryDates(apiKey, slug) {
  const url = `https://api.phish.net/v5/setlists/slug/${encodeURIComponent(
    slug
  )}.json?apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`Phish.net HTTP ${res.status}: ${bodyText.slice(0, 120)}`);
  }
  const data = JSON.parse(bodyText);
  if (!isPhishNetPayloadOk(data)) {
    throw new Error(
      typeof data?.error_message === "string"
        ? data.error_message
        : "Phish.net API error."
    );
  }
  const rows = Array.isArray(data.data) ? data.data : [];
  const dates = new Set();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const artist = row.artistid ?? row.artist_id;
    if (artist != null && String(artist) !== "1") continue;
    const d = typeof row.showdate === "string" ? row.showdate.trim() : "";
    if (d) dates.add(d);
  }
  return [...dates];
}

/**
 * #709 follow-up: stamp `lastPlayed` (date the song was last played *before*
 * that tour night) onto bustout / high-gap payload rows. Mutates `payload`
 * in place. Best-effort per song: a failed history lookup just leaves those
 * rows date-less (the UI hides the column when no row has one).
 *
 * `historyCache` (slug → string[] | null) is shared across tours within one
 * refresh run so a song appearing in multiple tour docs costs one lookup.
 *
 * @param {{ bustouts?: Array<object>, gapHighlights?: Array<object> }} payload
 * @param {{
 *   enrichmentByTitle: Map<string, { slug?: string | null }> | null,
 *   apiKey: string,
 *   historyCache: Map<string, string[] | null>,
 *   logger: Console,
 *   state: { lookups: number },
 * }} opts
 * @returns {Promise<number>} rows stamped
 */
async function stampLastPlayedDates(payload, opts) {
  const { enrichmentByTitle, apiKey, historyCache, logger, state } = opts;
  if (!(enrichmentByTitle instanceof Map) || !apiKey) return 0;

  /** @type {Map<string, Array<{ title?: string, showDate?: string | null }>>} */
  const rowsBySlug = new Map();
  for (const row of [
    ...(payload.bustouts || []),
    ...(payload.gapHighlights || []),
  ]) {
    if (!row || typeof row !== "object" || !row.showDate) continue;
    const slug = enrichmentByTitle.get(normalizeTitleKey(row.title))?.slug;
    if (!slug) continue;
    const bucket = rowsBySlug.get(slug);
    if (bucket) bucket.push(row);
    else rowsBySlug.set(slug, [row]);
  }

  let stamped = 0;
  let failed = 0;
  for (const [slug, rows] of rowsBySlug) {
    if (!historyCache.has(slug)) {
      if (state.lookups >= MAX_LAST_PLAYED_LOOKUPS) break;
      state.lookups += 1;
      try {
        historyCache.set(slug, await fetchPhishnetSongHistoryDates(apiKey, slug));
      } catch (err) {
        historyCache.set(slug, null);
        failed += 1;
        logger.warn("refreshPublicTourStats: song history lookup failed", {
          slug,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    const dates = historyCache.get(slug);
    if (!dates) continue;
    for (const row of rows) {
      const lastPlayed = lastPlayedBeforeFromHistory(dates, row.showDate);
      if (lastPlayed) {
        row.lastPlayed = lastPlayed;
        stamped += 1;
      }
    }
  }

  if (stamped > 0 || failed > 0) {
    logger.info("refreshPublicTourStats: lastPlayed dates stamped", {
      stamped,
      failed,
      lookupsSoFar: state.lookups,
    });
  }
  return stamped;
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {{ logger?: Console, today?: string, phishnetApiKey?: string }} [opts]
 */
async function refreshPublicTourStats(db, opts = {}) {
  const logger = opts.logger || console;
  const today =
    typeof opts.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(opts.today)
      ? opts.today
      : new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

  const snap = await db.collection("show_calendar").doc("snapshot").get();
  if (!snap.exists) {
    logger.warn("refreshPublicTourStats: show_calendar/snapshot missing");
    return { toursWritten: 0, today };
  }

  const data = snap.data() || {};
  const showDatesByTour = Array.isArray(data.showDatesByTour)
    ? data.showDatesByTour
    : [];

  /** @type {Array<{ tour: string, shows: Array<{ date: string }> }>} */
  const selectable = [];
  for (const group of showDatesByTour) {
    if (!group || typeof group.tour !== "string" || !Array.isArray(group.shows)) {
      continue;
    }
    const eligible = group.shows.filter(
      (s) =>
        s &&
        typeof s.date === "string" &&
        s.date >= GAME_LAUNCH_SHOW_DATE &&
        s.date <= today
    );
    if (eligible.length === 0) continue;
    selectable.push({ tour: group.tour.trim(), shows: eligible });
  }

  let toursWritten = 0;
  const writtenAt = new Date().toISOString();

  // #666: one phish.net fetch per refresh, shared across every tour doc.
  const enrichmentByTitle = await fetchSongEnrichment(
    opts.phishnetApiKey || "",
    logger
  );

  // #709 follow-up: per-song history lookups (lastPlayed) shared across tours.
  const historyCache = new Map();
  const lookupState = { lookups: 0 };

  for (const group of selectable) {
    const tourLabel = group.tour;
    const tourSlug = tourLabelToSlug(tourLabel);
    const showDates = [
      ...new Set(
        group.shows
          .map((s) => s.date)
          .filter((d) => typeof d === "string" && d)
      ),
    ].sort();

    /** @type {Array<{ showDate: string, setlist: object | null }>} */
    const docs = [];
    // Chunk getAll (max 10 in some SDK versions — use batches of 30)
    const chunkSize = 30;
    for (let i = 0; i < showDates.length; i += chunkSize) {
      const chunk = showDates.slice(i, i + chunkSize);
      const refs = chunk.map((d) => db.collection("official_setlists").doc(d));
      const snaps = await db.getAll(...refs);
      for (let j = 0; j < snaps.length; j += 1) {
        const s = snaps[j];
        docs.push({
          showDate: chunk[j],
          setlist: s.exists ? s.data() : null,
        });
      }
    }

    const stats = aggregateTourSetlistStats(docs, {
      tourShowCount: showDates.length,
    });
    const payload = toPublicTourStatsPayload(stats, enrichmentByTitle);
    await stampLastPlayedDates(payload, {
      enrichmentByTitle,
      apiKey: String(opts.phishnetApiKey || "").trim(),
      historyCache,
      logger,
      state: lookupState,
    });

    await db
      .collection("public_tour_stats")
      .doc(tourSlug)
      .set(
        {
          tourSlug,
          tourLabel,
          showDates,
          firstShowDate: showDates[0] || null,
          lastShowDate: showDates[showDates.length - 1] || null,
          ...payload,
          // #666: null when the refresh ran without phish.net (missing key /
          // upstream failure) — rows then omit lifetimePlays/debutYear.
          enrichment: enrichmentByTitle
            ? { source: "phish.net/v5/songs", enrichedAt: writtenAt }
            : null,
          writtenAt,
          schemaVersion: 2,
        },
        { merge: false }
      );
    toursWritten += 1;
    logger.info("refreshPublicTourStats: wrote", {
      tourSlug,
      tourLabel,
      showsWithSetlist: payload.showsWithSetlist,
    });
  }

  // Index doc for public tour picker (no setlist payloads).
  const indexTours = selectable
    .map((g) => {
      const dates = g.shows.map((s) => s.date).filter(Boolean).sort();
      return {
        tourSlug: tourLabelToSlug(g.tour),
        tourLabel: g.tour,
        lastShowDate: dates[dates.length - 1] || null,
        firstShowDate: dates[0] || null,
        showCount: dates.length,
      };
    })
    .sort((a, b) => {
      const la = a.lastShowDate || "";
      const lb = b.lastShowDate || "";
      if (lb !== la) return lb > la ? 1 : -1;
      return a.tourLabel.localeCompare(b.tourLabel);
    });

  const defaultTourSlug = pickDefaultPublicTourSlug(indexTours);

  await db.collection("public_tour_stats").doc("_index").set(
    {
      tours: indexTours,
      defaultTourSlug,
      writtenAt,
      schemaVersion: 1,
    },
    { merge: false }
  );

  return { toursWritten, today, indexCount: indexTours.length, defaultTourSlug };
}

/**
 * Current tour = newest by `lastShowDate` (index already sorted that way).
 * @param {Array<{ tourSlug: string, tourLabel?: string, lastShowDate?: string | null }>} indexTours
 * @returns {string}
 */
function pickDefaultPublicTourSlug(indexTours) {
  return indexTours[0]?.tourSlug || "";
}

module.exports = {
  refreshPublicTourStats,
  pickDefaultPublicTourSlug,
  stampLastPlayedDates,
  GAME_LAUNCH_SHOW_DATE,
};
