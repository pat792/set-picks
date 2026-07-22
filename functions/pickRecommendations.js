/**
 * Generate + publish versioned `pick-recommendations.json` to Storage (#650).
 *
 * Mirrors song-catalog publish: public live object + download token, scheduled
 * and admin refresh. Uses official_setlists history with showDate < target only.
 */
"use strict";

const crypto = require("node:crypto");
const admin = require("firebase-admin");
const {
  MODEL_VERSION,
  MODEL_TRAINING_WINDOW,
  POSITIONAL_SLOTS,
  normalizeTitle,
  rankCombinedForSlot,
  rankCombinedPlayOnly,
} = require("./pickRecommendationsModel");
const { getNextShow } = require("./showFinalizationGate");
const {
  parseShowCalendarSnapshotToShows,
} = require("./phishnetLiveSetlistAutomation");

const REC_STORAGE_PATH = "pick-recommendations.json";
const REC_ARCHIVE_PREFIX = "pick-recommendations/archive/";
const DEFAULT_HISTORY_LIMIT = 80;
const DEFAULT_TOP_K = 25;

/**
 * @param {string} updatedAtIso
 * @returns {string}
 */
function recommendationsArchiveObjectPath(updatedAtIso) {
  const d = new Date(String(updatedAtIso || "").trim() || Date.now());
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid recommendations archive timestamp: ${updatedAtIso}`);
  }
  const stamp = d
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replace(/:/g, "-");
  return `${REC_ARCHIVE_PREFIX}${stamp}.json`;
}

/**
 * @param {string} bucketName
 * @returns {string}
 */
function publicGcsUrlForRecommendations(bucketName) {
  return `https://storage.googleapis.com/${bucketName}/${REC_STORAGE_PATH}`;
}

/**
 * @param {FirebaseFirestore.DocumentData | undefined} data
 * @param {string} showDate
 */
function showRecordFromOfficialDoc(data, showDate) {
  if (!data || typeof data !== "object") return null;
  const officialSetlist = Array.isArray(data.officialSetlist)
    ? data.officialSetlist.map((t) => String(t ?? "").trim()).filter(Boolean)
    : [];
  const setlist =
    data.setlist && typeof data.setlist === "object" ? data.setlist : {};
  if (!officialSetlist.length && !Object.values(setlist).some(Boolean)) {
    return null;
  }
  const songs =
    officialSetlist.length > 0
      ? officialSetlist
      : Object.values(setlist)
          .map((t) => String(t ?? "").trim())
          .filter(Boolean);
  return {
    showDate,
    songs,
    slots: {
      s1o: String(setlist.s1o ?? "").trim(),
      s1c: String(setlist.s1c ?? "").trim(),
      s2o: String(setlist.s2o ?? "").trim(),
      s2c: String(setlist.s2c ?? "").trim(),
      enc: String(setlist.enc ?? "").trim(),
      wild: "",
    },
    encoreSongs: Array.isArray(data.encoreSongs)
      ? data.encoreSongs.map((t) => String(t ?? "").trim()).filter(Boolean)
      : [],
  };
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {string} targetDate
 * @param {number} [limit]
 */
async function loadPriorShowRecords(db, targetDate, limit = DEFAULT_HISTORY_LIMIT) {
  // Avoid documentId orderBy/startAfter index requirements on this collection.
  // Game-scale official_setlists is small — filter + sort in memory.
  const snap = await db.collection("official_setlists").get();

  /** @type {ReturnType<typeof showRecordFromOfficialDoc>[]} */
  const records = [];
  for (const doc of snap.docs) {
    if (doc.id >= targetDate) continue;
    const rec = showRecordFromOfficialDoc(doc.data(), doc.id);
    if (rec) records.push(rec);
  }
  records.sort((a, b) => a.showDate.localeCompare(b.showDate));
  if (records.length > limit) {
    return records.slice(records.length - limit);
  }
  return records;
}

/**
 * Display casing from last prior occurrence of a normalized key.
 * @param {object[]} priors
 * @param {string} songKey
 */
function displayNameFor(priors, songKey) {
  for (let i = priors.length - 1; i >= 0; i -= 1) {
    for (const t of priors[i].songs || []) {
      if (normalizeTitle(t) === songKey) return t;
    }
  }
  return songKey;
}

/**
 * @param {object[]} ranked
 * @param {object[]} priors
 * @param {number} topK
 */
function serializeRanked(ranked, priors, topK) {
  return ranked.slice(0, topK).map((r, i) => ({
    name: displayNameFor(priors, r.songKey),
    normalizedName: r.songKey,
    rank: i + 1,
    score: Number(r.score.toFixed(6)),
    playProb: Number((r.playProb ?? r.score).toFixed(6)),
    slotAffinity:
      typeof r.slotAffinity === "number"
        ? Number(r.slotAffinity.toFixed(6))
        : null,
    confidence: Number((r.playProb ?? r.score).toFixed(6)),
    riskBand: r.riskBand || "slot_fit",
    reasons: Array.isArray(r.reasons) ? r.reasons.slice(0, 2) : [],
  }));
}

/**
 * Pure builder — used by tests without Storage.
 *
 * @param {{
 *   targetShow: { date: string, venue?: string, city?: string, tour?: string, timeZone?: string },
 *   priors: object[],
 *   topK?: number,
 *   now?: Date,
 * }} args
 */
function buildPickRecommendationsArtifact(args) {
  const { targetShow, priors, topK = DEFAULT_TOP_K, now = new Date() } = args;
  const targetDate = targetShow?.date;
  if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return { skipped: true, reason: "invalid-target-date" };
  }
  if (!Array.isArray(priors) || priors.length === 0) {
    return { skipped: true, reason: "insufficient-history" };
  }

  /** @type {Record<string, ReturnType<typeof serializeRanked>>} */
  const slots = {};
  for (const slot of POSITIONAL_SLOTS) {
    const ranked = rankCombinedForSlot(priors, targetDate, slot);
    slots[slot] = serializeRanked(ranked, priors, topK);
  }
  const wildRanked = rankCombinedPlayOnly(priors, targetDate);
  slots.wild = serializeRanked(wildRanked, priors, topK);

  return {
    skipped: false,
    artifact: {
      generatedAt: now.toISOString(),
      modelVersion: MODEL_VERSION,
      trainingWindow: MODEL_TRAINING_WINDOW,
      targetShow: {
        date: targetDate,
        venue: targetShow.venue || "",
        city: targetShow.city || "",
        tour: targetShow.tour || "",
        timeZone: targetShow.timeZone || "",
      },
      historyShowCount: priors.length,
      topK,
      slots,
    },
  };
}

/**
 * Resolve upcoming show from calendar snapshot; null if none usable.
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {Date} [now]
 */
async function resolveUpcomingShow(db, now = new Date()) {
  const snap = await db.collection("show_calendar").doc("snapshot").get();
  if (!snap.exists) return null;
  const shows = parseShowCalendarSnapshotToShows(snap.data());
  if (!Array.isArray(shows) || shows.length === 0) return null;
  try {
    return getNextShow(shows, now);
  } catch {
    return null;
  }
}

/**
 * @param {import('firebase-admin').firestore.Firestore} db
 * @param {{
 *   logger?: { info?: Function, warn?: Function, error?: Function },
 *   bucketName?: string,
 *   historyLimit?: number,
 *   topK?: number,
 *   now?: Date,
 * }} [opts]
 */
async function syncPickRecommendationsToStorage(db, opts = {}) {
  const {
    logger,
    bucketName,
    historyLimit = DEFAULT_HISTORY_LIMIT,
    topK = DEFAULT_TOP_K,
    now = new Date(),
  } = opts;

  const upcoming = await resolveUpcomingShow(db, now);
  if (!upcoming?.date) {
    logger?.info?.("pick recommendations: no upcoming show; skip publish");
    return {
      skipped: true,
      reason: "no-upcoming-show",
      publicUrl: null,
      archivePath: null,
    };
  }

  const priors = await loadPriorShowRecords(db, upcoming.date, historyLimit);
  const built = buildPickRecommendationsArtifact({
    targetShow: upcoming,
    priors,
    topK,
    now,
  });
  if (built.skipped) {
    logger?.info?.("pick recommendations: skip publish", { reason: built.reason });
    return {
      skipped: true,
      reason: built.reason,
      publicUrl: null,
      archivePath: null,
      targetDate: upcoming.date,
    };
  }

  const artifact = built.artifact;
  const json = JSON.stringify(artifact);
  const body = Buffer.from(json, "utf8");

  const bucket = bucketName
    ? admin.storage().bucket(bucketName)
    : admin.storage().bucket();
  const file = bucket.file(REC_STORAGE_PATH);

  await file.save(body, {
    metadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "public, max-age=300",
      metadata: {
        firebaseStorageDownloadTokens: crypto.randomUUID(),
      },
    },
  });

  try {
    await file.makePublic();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger?.warn?.(
      "pick recommendations: makePublic failed (download URL may still work)",
      msg
    );
  }

  let archivePath = null;
  try {
    archivePath = recommendationsArchiveObjectPath(artifact.generatedAt);
    await bucket.file(archivePath).save(body, {
      metadata: {
        contentType: "application/json; charset=utf-8",
        cacheControl: "private, max-age=0",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger?.error?.(
      "pick recommendations: archive failed (live object updated)",
      msg,
      e
    );
    archivePath = null;
  }

  const publicUrl = publicGcsUrlForRecommendations(bucket.name);
  logger?.info?.("pick recommendations uploaded", {
    targetDate: upcoming.date,
    modelVersion: MODEL_VERSION,
    historyShowCount: priors.length,
    publicUrl,
    archivePath,
  });

  return {
    skipped: false,
    reason: null,
    targetDate: upcoming.date,
    modelVersion: MODEL_VERSION,
    historyShowCount: priors.length,
    publicUrl,
    bucket: bucket.name,
    archivePath,
  };
}

module.exports = {
  REC_STORAGE_PATH,
  REC_ARCHIVE_PREFIX,
  DEFAULT_HISTORY_LIMIT,
  DEFAULT_TOP_K,
  recommendationsArchiveObjectPath,
  publicGcsUrlForRecommendations,
  showRecordFromOfficialDoc,
  buildPickRecommendationsArtifact,
  resolveUpcomingShow,
  loadPriorShowRecords,
  syncPickRecommendationsToStorage,
};
