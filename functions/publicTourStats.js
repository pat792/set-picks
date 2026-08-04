/**
 * Build + write `public_tour_stats/{tourSlug}` aggregate docs (#665).
 * Admin SDK only — never expose full official setlists to clients.
 */
const {
  aggregateTourSetlistStats,
  toPublicTourStatsPayload,
  buildSongEnrichmentByTitle,
  tourLabelToSlug,
} = require("./aggregateTourSetlistStats.cjs");
const { fetchPhishnetSongsNormalized } = require("./phishnetSongCatalog");

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
  GAME_LAUNCH_SHOW_DATE,
};
