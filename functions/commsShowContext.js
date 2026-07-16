/**
 * Firestore I/O for `comms_show_context/{showDate}` (#572).
 */

"use strict";

const {
  buildCommsShowContext,
  showLevelPayloadFields,
} = require("./commsShowContextCore");
const { tourDatesForKey } = require("./tourRankingsDailyCore");
const { resolveTourKeyForDate } = require("./rollupSeasonAggregates");

/**
 * Load prior tour setlist docs (exclusive of showDate).
 * @param {FirebaseFirestore.Firestore} db
 * @param {string[]} priorDates
 */
async function loadPriorSetlistDocs(db, priorDates) {
  /** @type {Array<Record<string, unknown>>} */
  const docs = [];
  for (const d of priorDates) {
    // eslint-disable-next-line no-await-in-loop
    const snap = await db.collection("official_setlists").doc(d).get();
    if (snap.exists) docs.push(snap.data() || {});
  }
  return docs;
}

/**
 * Build + write show context. Idempotent merge.
 * @param {{
 *   db: FirebaseFirestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   showDate: string,
 *   setlistDoc?: Record<string, unknown> | null,
 *   showDatesByTour?: unknown,
 *   logger?: { info?: Function, warn?: Function },
 * }} params
 */
async function writeCommsShowContext({
  db,
  admin,
  showDate,
  setlistDoc = null,
  showDatesByTour = null,
  logger,
}) {
  if (!showDate) return null;

  let setlist = setlistDoc;
  if (!setlist) {
    const snap = await db.collection("official_setlists").doc(showDate).get();
    if (!snap.exists) {
      logger?.warn?.("writeCommsShowContext: no official_setlists doc", { showDate });
      return null;
    }
    setlist = snap.data() || {};
  }

  let tourKey = null;
  /** @type {string[]} */
  let priorDates = [];
  if (showDatesByTour) {
    tourKey = resolveTourKeyForDate(showDate, showDatesByTour);
    const tourDates = tourKey ? tourDatesForKey(showDatesByTour, tourKey) : [];
    priorDates = tourDates.filter((d) => d < showDate);
  } else {
    try {
      const calSnap = await db.collection("show_calendar").doc("snapshot").get();
      const byTour = calSnap.exists ? calSnap.data()?.showDatesByTour : null;
      if (byTour) {
        tourKey = resolveTourKeyForDate(showDate, byTour);
        const tourDates = tourKey ? tourDatesForKey(byTour, tourKey) : [];
        priorDates = tourDates.filter((d) => d < showDate);
        showDatesByTour = byTour;
      }
    } catch (e) {
      logger?.warn?.("writeCommsShowContext: calendar load failed", {
        showDate,
        msg: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const priorDocs = priorDates.length
    ? await loadPriorSetlistDocs(db, priorDates.slice(-12))
    : [];

  const context = buildCommsShowContext({
    showDate,
    setlistDoc: setlist,
    priorTourSetlistDocs: priorDocs,
    tourKey,
  });

  const ref = db.collection("comms_show_context").doc(showDate);
  await ref.set(
    {
      ...context,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  logger?.info?.("writeCommsShowContext", {
    showDate,
    tourKey,
    hasHighlight: Boolean(context.setlist_highlight),
    bustouts: context.bustout_titles.length,
    tourDebuts: context.tour_debut_titles.length,
  });

  return context;
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} showDate
 */
async function loadCommsShowContext(db, showDate) {
  if (!showDate) return null;
  const snap = await db.collection("comms_show_context").doc(showDate).get();
  if (!snap.exists) return null;
  return snap.data() || null;
}

/**
 * Ensure context exists; rebuild if missing.
 */
async function ensureCommsShowContext(params) {
  const existing = await loadCommsShowContext(params.db, params.showDate);
  if (existing?.setlist_highlight || existing?.schemaVersion) {
    return existing;
  }
  return writeCommsShowContext(params);
}

module.exports = {
  writeCommsShowContext,
  loadCommsShowContext,
  ensureCommsShowContext,
  showLevelPayloadFields,
};
