/**
 * Phish.net recommendation-only setlist history (#721).
 *
 * Widens pick-recommendations priors beyond game `official_setlists` without
 * writing historical nights into scoring docs. Private Storage window cache.
 */
"use strict";

const admin = require("firebase-admin");
const {
  buildSetlistDocFromRows,
  fetchPhishnetSetlistForDate,
  normalizeSetlistRows,
} = require("./phishnetLiveSetlistAutomation");
const { fetchAllShowsNormalized } = require("./phishnetShowCalendar");

/** Compacted prior-show window (Admin SDK only — not public-read). */
const HISTORY_WINDOW_PATH = "pick-recommendations/history/window.json";

/** Default analytical window *t* for Slot fit / playProb features. */
const DEFAULT_HISTORY_YEARS = 1;

/** Max priors fed into the model after merge (covers a dense Phish year). */
const DEFAULT_MERGED_HISTORY_LIMIT = 120;

const DEFAULT_FETCH_DELAY_MS = 250;

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} isoDate YYYY-MM-DD
 * @param {number} years
 * @returns {string}
 */
function isoYearsBefore(isoDate, years) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date for history window: ${isoDate}`);
  }
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {Date} [now]
 * @returns {string}
 */
function todayIsoUtc(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * Convert a completed-show Phish.net payload into a leakage-safe ShowRecord.
 * Mirrors scripts/prediction-backtest/lib/dataset.mjs (CJS port for Functions).
 *
 * @param {string} showDate
 * @param {object} payload
 * @returns {{
 *   showDate: string,
 *   songs: string[],
 *   slots: Record<string, string>,
 *   encoreSongs: string[],
 * } | null}
 */
function showRecordFromPhishnetPayload(showDate, payload) {
  let rows;
  try {
    rows = normalizeSetlistRows(payload);
  } catch {
    return null;
  }
  if (!Array.isArray(rows) || rows.length === 0) return null;

  // Historical complete shows: set2 present marks set1 complete for closers.
  const doc = buildSetlistDocFromRows(rows, {}, null);
  const songs = Array.isArray(doc.officialSetlist)
    ? doc.officialSetlist
    : rows.map((r) => r.title).filter(Boolean);
  if (!songs.length) return null;

  return {
    showDate,
    songs,
    slots: {
      s1o: String(doc.setlist?.s1o || "").trim(),
      s1c: String(doc.setlist?.s1c || "").trim(),
      s2o: String(doc.setlist?.s2o || "").trim(),
      s2c: String(doc.setlist?.s2c || "").trim(),
      enc: String(doc.setlist?.enc || "").trim(),
      wild: "",
    },
    encoreSongs: Array.isArray(doc.encoreSongs)
      ? doc.encoreSongs.map((t) => String(t ?? "").trim()).filter(Boolean)
      : [],
  };
}

/**
 * @param {import('@google-cloud/storage').Bucket} bucket
 * @returns {Promise<{
 *   updatedAt: string,
 *   from: string,
 *   toExclusive: string,
 *   source: string,
 *   showCount: number,
 *   shows: object[],
 * } | null>}
 */
async function loadHistoryWindowFromStorage(bucket) {
  const file = bucket.file(HISTORY_WINDOW_PATH);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [buf] = await file.download();
  try {
    const parsed = JSON.parse(buf.toString("utf8"));
    if (!parsed || !Array.isArray(parsed.shows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {import('@google-cloud/storage').Bucket} bucket
 * @param {{
 *   updatedAt: string,
 *   from: string,
 *   toExclusive: string,
 *   source: string,
 *   showCount: number,
 *   shows: object[],
 * }} window
 */
async function saveHistoryWindowToStorage(bucket, window) {
  const file = bucket.file(HISTORY_WINDOW_PATH);
  const body = Buffer.from(`${JSON.stringify(window)}\n`, "utf8");
  await file.save(body, {
    metadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "private, max-age=0",
    },
  });
  return HISTORY_WINDOW_PATH;
}

/**
 * Merge Phish.net window + Firestore official_setlists. Firestore wins on date ties.
 *
 * @param {{
 *   phishnetShows?: object[],
 *   firestoreShows?: object[],
 *   targetDate: string,
 *   limit?: number,
 * }} args
 * @returns {{ priors: object[], historySource: 'merged' | 'phishnet' | 'firestore' }}
 */
function mergePriorShowRecords(args) {
  const {
    phishnetShows = [],
    firestoreShows = [],
    targetDate,
    limit = DEFAULT_MERGED_HISTORY_LIMIT,
  } = args;

  /** @type {Map<string, object>} */
  const byDate = new Map();
  let usedPhishnet = false;
  let usedFirestore = false;

  for (const rec of phishnetShows) {
    if (!rec?.showDate || rec.showDate >= targetDate) continue;
    if (!Array.isArray(rec.songs) || rec.songs.length === 0) continue;
    byDate.set(rec.showDate, rec);
    usedPhishnet = true;
  }
  for (const rec of firestoreShows) {
    if (!rec?.showDate || rec.showDate >= targetDate) continue;
    if (!Array.isArray(rec.songs) || rec.songs.length === 0) continue;
    byDate.set(rec.showDate, rec);
    usedFirestore = true;
  }

  let priors = [...byDate.values()].sort((a, b) =>
    a.showDate.localeCompare(b.showDate)
  );
  if (priors.length > limit) {
    priors = priors.slice(priors.length - limit);
  }

  /** @type {'merged' | 'phishnet' | 'firestore'} */
  let historySource = "firestore";
  if (usedPhishnet && usedFirestore) historySource = "merged";
  else if (usedPhishnet) historySource = "phishnet";

  return { priors, historySource };
}

/**
 * Fetch / refresh the private 1y Phish.net window in Storage.
 *
 * @param {{
 *   apiKey: string,
 *   bucketName?: string,
 *   years?: number,
 *   toExclusive?: string,
 *   delayMs?: number,
 *   force?: boolean,
 *   logger?: { info?: Function, warn?: Function, error?: Function },
 *   now?: Date,
 * }} opts
 */
async function syncRecommendationHistoryFromPhishnet(opts) {
  const {
    apiKey,
    bucketName,
    years = DEFAULT_HISTORY_YEARS,
    delayMs = DEFAULT_FETCH_DELAY_MS,
    force = false,
    logger,
    now = new Date(),
  } = opts;

  if (!apiKey || !String(apiKey).trim()) {
    throw new Error("PHISHNET_API_KEY is required to sync recommendation history");
  }

  const toExclusive = opts.toExclusive || todayIsoUtc(now);
  const from = isoYearsBefore(toExclusive, years);
  const fromYear = Number(from.slice(0, 4));
  const toYear = Number(toExclusive.slice(0, 4));

  const bucket = bucketName
    ? admin.storage().bucket(bucketName)
    : admin.storage().bucket();

  const existing = force ? null : await loadHistoryWindowFromStorage(bucket);
  /** @type {Map<string, object>} */
  const byDate = new Map();
  if (existing?.shows) {
    for (const rec of existing.shows) {
      if (rec?.showDate) byDate.set(rec.showDate, rec);
    }
  }

  logger?.info?.("pick recommendation history: listing shows", {
    from,
    toExclusive,
    years,
  });

  const allShows = await fetchAllShowsNormalized({
    apiKey: String(apiKey).trim(),
    minYear: fromYear,
    maxYear: toYear,
  });
  const dates = allShows
    .map((s) => s.date)
    .filter(
      (d) =>
        typeof d === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(d) &&
        d >= from &&
        d < toExclusive
    )
    .sort();

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const showDate of dates) {
    if (!force && byDate.has(showDate)) {
      skipped += 1;
      continue;
    }
    try {
      const payload = await fetchPhishnetSetlistForDate(
        showDate,
        String(apiKey).trim()
      );
      const record = showRecordFromPhishnetPayload(showDate, payload);
      if (!record) {
        failed += 1;
        logger?.warn?.("pick recommendation history: empty setlist", {
          showDate,
        });
      } else {
        byDate.set(showDate, record);
        imported += 1;
      }
    } catch (e) {
      failed += 1;
      logger?.warn?.("pick recommendation history: fetch failed", {
        showDate,
        error: e instanceof Error ? e.message : String(e),
      });
    }
    if (delayMs > 0) await sleep(delayMs);
  }

  // Drop shows outside the requested window (rolling trim).
  const shows = [...byDate.values()]
    .filter((r) => r.showDate >= from && r.showDate < toExclusive)
    .sort((a, b) => a.showDate.localeCompare(b.showDate));

  const window = {
    updatedAt: now.toISOString(),
    from,
    toExclusive,
    source: "phish.net",
    showCount: shows.length,
    shows,
  };
  const path = await saveHistoryWindowToStorage(bucket, window);

  logger?.info?.("pick recommendation history: synced", {
    path,
    showCount: shows.length,
    imported,
    skipped,
    failed,
    from,
    toExclusive,
  });

  return {
    path,
    from,
    toExclusive,
    showCount: shows.length,
    imported,
    skipped,
    failed,
    updatedAt: window.updatedAt,
  };
}

module.exports = {
  HISTORY_WINDOW_PATH,
  DEFAULT_HISTORY_YEARS,
  DEFAULT_MERGED_HISTORY_LIMIT,
  DEFAULT_FETCH_DELAY_MS,
  isoYearsBefore,
  todayIsoUtc,
  showRecordFromPhishnetPayload,
  loadHistoryWindowFromStorage,
  saveHistoryWindowToStorage,
  mergePriorShowRecords,
  syncRecommendationHistoryFromPhishnet,
};
