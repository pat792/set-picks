/**
 * One-time / ops recovery batch for `tour_countdown` when the scheduled cron
 * missed a window (e.g. #514 flat showDates bug).
 *
 * Resolves tour metadata from `show_calendar/snapshot.showDatesByTour`, fans out
 * to users with a non-empty handle, and calls `deliverCommsTrigger` (all channels).
 */

"use strict";

const { deliverCommsTrigger, buildDefaultWorkers } = require("./commsDelivery");
const { createCommsEmailWorker, buildResendClient } = require("./commsEmailWorker");
const { ymdInTimeZone } = require("./phishnetLiveSetlistAutomation");

const TRIGGER_ID = "tour_countdown";
const DEFAULT_SHOW_TIME_ZONE = "America/Los_Angeles";
const DEFAULT_LOCK_TIME_LOCAL = "7:55 PM";

/**
 * @param {unknown} data
 * @returns {string}
 */
function handleFromUser(data) {
  const h = data && typeof data.handle === "string" ? data.handle.trim() : "";
  return h;
}

/**
 * @param {string} venue
 * @returns {string}
 */
function cityFromVenue(venue) {
  const parts = String(venue || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.slice(1).join(", ");
  return "";
}

/**
 * @param {import("firebase-admin").firestore.DocumentData | null | undefined} calData
 * @param {{ tourName?: string, daysRemaining: number, now?: Date }} opts
 */
function resolveTourCountdownTarget(calData, { tourName, daysRemaining, now = new Date() }) {
  const groups = Array.isArray(calData?.showDatesByTour) ? calData.showDatesByTour : [];
  if (groups.length === 0) {
    throw new Error("show_calendar/snapshot missing showDatesByTour");
  }

  const needle = typeof tourName === "string" ? tourName.trim().toLowerCase() : "";
  /** @type {typeof groups[number] | null} */
  let group = null;

  if (needle) {
    group =
      groups.find((g) => String(g?.tour || "").trim().toLowerCase() === needle) ||
      groups.find((g) => String(g?.tour || "").toLowerCase().includes(needle)) ||
      null;
    if (!group) {
      throw new Error(`No tour group matching "${tourName}" in showDatesByTour`);
    }
  } else {
    /** @type {{ group: typeof groups[number], firstDate: string } | null} */
    let bestUpcoming = null;
    for (const g of groups) {
      const shows = Array.isArray(g?.shows) ? g.shows : [];
      if (shows.length === 0) continue;
      const sorted = [...shows]
        .map((s) => ({
          date: typeof s?.date === "string" ? s.date.trim() : "",
          show: s,
        }))
        .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date))
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      if (sorted.length === 0) continue;
      const first = sorted[0];
      const tz =
        typeof first.show?.timeZone === "string" && first.show.timeZone.trim()
          ? first.show.timeZone.trim()
          : DEFAULT_SHOW_TIME_ZONE;
      const todayYmd = ymdInTimeZone(now, tz);
      if (todayYmd >= first.date) continue;
      if (!bestUpcoming || first.date < bestUpcoming.firstDate) {
        bestUpcoming = { group: g, firstDate: first.date };
      }
    }
    if (!bestUpcoming) {
      throw new Error("No upcoming tour found in showDatesByTour");
    }
    group = bestUpcoming.group;
  }

  const shows = Array.isArray(group.shows) ? group.shows : [];
  const sorted = [...shows]
    .map((s) => ({
      date: typeof s?.date === "string" ? s.date.trim() : "",
      show: s,
    }))
    .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (sorted.length === 0) {
    throw new Error(`Tour "${group.tour}" has no valid show dates`);
  }

  const first = sorted[0].show;
  const firstDate = sorted[0].date;
  const tz =
    typeof first?.timeZone === "string" && first.timeZone.trim()
      ? first.timeZone.trim()
      : DEFAULT_SHOW_TIME_ZONE;
  const venue = typeof first?.venue === "string" ? first.venue.trim() : "";
  const city =
    typeof first?.city === "string" && first.city.trim()
      ? first.city.trim()
      : cityFromVenue(venue);

  return {
    tourId: String(group.tour || "").trim() || "tour",
    tour_name: String(group.tour || "").trim() || "The tour",
    days_remaining: daysRemaining,
    first_show_date: firstDate,
    first_show_venue: venue,
    first_show_city: city,
    timeZone: tz,
    lock_time_local: DEFAULT_LOCK_TIME_LOCAL,
  };
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @returns {Promise<Array<{ uid: string, userData: Record<string, unknown> }>>}
 */
async function loadUsersWithHandles(db) {
  const snap = await db.collection("users").where("handle", ">", "").get();
  return snap.docs
    .map((doc) => ({ uid: doc.id, userData: doc.data() || {} }))
    .filter((row) => handleFromUser(row.userData));
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   dryRun?: boolean,
 *   forceResend?: boolean,
 *   onlyUids?: string[],
 *   tourName?: string,
 *   daysRemaining?: number,
 *   resendApiKey?: string,
 *   resendWebhookSecret?: string,
 *   logger?: { info?: Function, warn?: Function },
 * }} params
 */
async function deliverTourCountdownRecovery({
  db,
  admin,
  dryRun = true,
  forceResend = false,
  onlyUids,
  tourName,
  daysRemaining = 1,
  resendApiKey,
  resendWebhookSecret,
  logger,
}) {
  const calSnap = await db.collection("show_calendar").doc("snapshot").get();
  const target = resolveTourCountdownTarget(calSnap.exists ? calSnap.data() : null, {
    tourName,
    daysRemaining,
  });

  let audience = await loadUsersWithHandles(db);
  const onlyUidSet =
    Array.isArray(onlyUids) && onlyUids.length > 0
      ? new Set(onlyUids.map((u) => String(u).trim()).filter(Boolean))
      : null;
  if (onlyUidSet) {
    audience = audience.filter((m) => onlyUidSet.has(m.uid));
  }

  if (audience.length === 0) {
    return {
      ok: true,
      dryRun,
      triggerId: TRIGGER_ID,
      target,
      cohortSize: 0,
      processed: 0,
      delivered: 0,
      message: onlyUidSet
        ? "No matching recipients for onlyUids filter."
        : "No users with handles in cohort.",
    };
  }

  /** @type {import("./commsDelivery").deliverCommsTrigger extends (...args: infer A) => any ? A[0]["recipients"] : never} */
  const recipients = audience.map(({ uid, userData }) => ({
    uid,
    userData,
    payload: {
      handle: handleFromUser(userData),
      tour_name: target.tour_name,
      days_remaining: target.days_remaining,
      first_show_date: target.first_show_date,
      first_show_venue: target.first_show_venue,
      first_show_city: target.first_show_city,
      lock_time_local: target.lock_time_local,
    },
    vars: {
      uid,
      tourId: target.tourId,
      days_remaining: target.days_remaining,
    },
  }));

  const preview = recipients.slice(0, 10).map((r) => ({
    uid: r.uid,
    handle: r.payload.handle,
    email:
      typeof r.userData?.email === "string" && r.userData.email.includes("@")
        ? r.userData.email.trim()
        : null,
  }));

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      triggerId: TRIGGER_ID,
      target,
      cohortSize: audience.length,
      sendable: recipients.length,
      onlyUids: onlyUidSet ? [...onlyUidSet] : undefined,
      preview,
    };
  }

  const emailWorker = createCommsEmailWorker({
    resendClient: buildResendClient(resendApiKey, logger),
    db,
    admin,
    unsubscribeSigningSecret: resendWebhookSecret,
    logger,
  });

  const delivery = await deliverCommsTrigger({
    db,
    admin,
    triggerId: TRIGGER_ID,
    recipients,
    workers: buildDefaultWorkers({ emailWorker }),
    dryRun: false,
    forceResend,
    bypassDailyCap: true,
    logger,
  });

  return {
    ok: delivery.ok !== false,
    dryRun: false,
    triggerId: TRIGGER_ID,
    target,
    cohortSize: audience.length,
    sendable: recipients.length,
    preview,
    delivery,
  };
}

module.exports = {
  TRIGGER_ID,
  deliverTourCountdownRecovery,
  resolveTourCountdownTarget,
  loadUsersWithHandles,
};
