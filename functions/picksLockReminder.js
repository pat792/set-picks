/**
 * Pre-lock pick reminder fan-out (issues #276, #524) — venue-local day + lock window,
 * deduped in `fcm_notification_log`, delivered via `deliverCommsTrigger`.
 */

const {
  parseShowCalendarSnapshotToShows,
  ymdInTimeZone,
  hourInTimeZone,
} = require("./phishnetLiveSetlistAutomation");
const { hasNonEmptyPicksObject } = require("./rollupSeasonAggregates");
const { createCommsAdapterRuntime } = require("./commsAdapterRuntime");
const { resolveDedupKey } = require("./commsCatalog");

/** Mirrors `src/shared/utils/timeLogic.js` (7:55pm local, #303). */
const SHOW_PICKS_LOCK_HOUR = 19;
const SHOW_PICKS_LOCK_MINUTE = 55;
const LOCK_TIME_LOCAL_LABEL = "7:55 PM";

const DEFAULT_SHOW_TIME_ZONE = "America/Los_Angeles";
/** Only nudge from 4pm local onward on show day (#276). */
const REMINDER_LOCAL_START_HOUR = 16;

const MAX_REMINDER_SENDS_PER_TICK = 150;
const MAX_USERS_SCANNED = 900;

const LOG_COLLECTION = "fcm_notification_log";
const TRIGGER_ID = "picks_lock_reminder";

/**
 * @param {string} showYmd
 * @param {string} showTimeZone
 * @param {Date} now
 */
function isPastPicksLock(showYmd, showTimeZone, now) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: showTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(now);
  const map = Object.fromEntries(
    parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  const ymd = `${map.year}-${map.month}-${map.day}`;
  if (ymd !== showYmd) return false;
  const hour = Number(map.hour);
  const minute = Number(map.minute);
  return (
    hour > SHOW_PICKS_LOCK_HOUR ||
    (hour === SHOW_PICKS_LOCK_HOUR && minute >= SHOW_PICKS_LOCK_MINUTE)
  );
}

/**
 * @param {string} showYmd `YYYY-MM-DD`
 * @param {string} showTimeZone IANA tz
 * @param {Date} now
 * @returns {string}
 */
function formatTimeToLock(showYmd, showTimeZone, now) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: showTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(now).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  const localYmd = `${parts.year}-${parts.month}-${parts.day}`;
  if (localYmd !== showYmd) return "tonight";

  const nowMinutes = Number(parts.hour) * 60 + Number(parts.minute);
  const lockMinutes = SHOW_PICKS_LOCK_HOUR * 60 + SHOW_PICKS_LOCK_MINUTE;
  const diff = lockMinutes - nowMinutes;
  if (diff <= 0) return "soon";

  if (diff < 60) return `${diff} minute${diff === 1 ? "" : "s"}`;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (mins === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours}h ${mins}m`;
}

/**
 * @param {Array<{ date: string, timeZone?: string, venue?: string, city?: string }>} calendarShows
 * @param {Date} now
 * @returns {{ showDate: string, timeZone: string, venue_name: string, venue_city: string } | null}
 */
function findReminderTonightShow(calendarShows, now) {
  if (!Array.isArray(calendarShows) || calendarShows.length === 0) return null;
  for (const show of calendarShows) {
    if (!show || typeof show !== "object") continue;
    const date = typeof show.date === "string" ? show.date.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const tz =
      typeof show.timeZone === "string" && show.timeZone.trim()
        ? show.timeZone.trim()
        : DEFAULT_SHOW_TIME_ZONE;
    const localYmd = ymdInTimeZone(now, tz);
    if (localYmd !== date) continue;
    if (isPastPicksLock(date, tz, now)) continue;
    const hour = hourInTimeZone(now, tz);
    if (hour < REMINDER_LOCAL_START_HOUR) continue;
    return {
      showDate: date,
      timeZone: tz,
      venue_name: typeof show.venue === "string" ? show.venue.trim() : "",
      venue_city: typeof show.city === "string" ? show.city.trim() : "",
    };
  }
  return null;
}

/**
 * @param {string} showDate
 * @param {string} uid
 */
function reminderLogDocId(showDate, uid) {
  return `reminder_${showDate}_${uid}`;
}

/**
 * @param {string | undefined | null} handle
 */
function handleFromUser(handle) {
  const h = typeof handle === "string" ? handle.trim() : "";
  return h;
}

/**
 * @param {{
 *   usersWithPicks: Set<string>,
 *   showDate: string,
 *   showMeta: { timeZone: string, venue_name: string, venue_city: string },
 *   userDocs: Array<{ id: string, data: () => Record<string, unknown> }>,
 *   dedupedUids: Set<string>,
 *   now: Date,
 *   cap: number,
 * }} params
 */
function buildPicksLockReminderRecipients({
  usersWithPicks,
  showDate,
  showMeta,
  userDocs,
  dedupedUids,
  now,
  cap,
}) {
  /** @type {Array<{ uid: string, userData: Record<string, unknown>, payload: Record<string, unknown>, vars: Record<string, unknown> }>} */
  const recipients = [];
  for (const userDoc of userDocs) {
    if (recipients.length >= cap) break;
    const uid = userDoc.id;
    if (!uid || usersWithPicks.has(uid) || dedupedUids.has(uid)) continue;
    const userData = userDoc.data() || {};
    if (!handleFromUser(userData.handle)) continue;
    recipients.push({
      uid,
      userData,
      payload: {
        handle: handleFromUser(userData.handle),
        show_date: showDate,
        venue_name: showMeta.venue_name,
        venue_city: showMeta.venue_city,
        time_to_lock: formatTimeToLock(showDate, showMeta.timeZone, now),
        lock_time_local: LOCK_TIME_LOCAL_LABEL,
      },
      vars: { uid, showYmd: showDate },
    });
  }
  return recipients;
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   resendApiKey?: string,
 *   resendWebhookSecret?: string,
 *   logger?: { info?: Function, warn?: Function, error?: Function },
 *   now?: Date,
 * }} params
 */
async function runPicksLockReminderFanout({
  db,
  admin,
  resendApiKey,
  resendWebhookSecret,
  logger,
  now = new Date(),
}) {
  const calSnap = await db.collection("show_calendar").doc("snapshot").get();
  const calendarShows = parseShowCalendarSnapshotToShows(
    calSnap.exists ? calSnap.data() : null
  );
  if (!calendarShows) {
    logger?.info?.("picksLockReminder: empty calendar", {});
    return { ok: true, reason: "no-calendar" };
  }

  const target = findReminderTonightShow(calendarShows, now);
  if (!target) {
    return { ok: true, reason: "no-target-show" };
  }

  const { showDate } = target;

  const picksSnap = await db
    .collection("picks")
    .where("showDate", "==", showDate)
    .get();

  const usersWithPicks = new Set();
  for (const doc of picksSnap.docs) {
    const d = doc.data() || {};
    const uid = typeof d.userId === "string" ? d.userId.trim() : "";
    if (!uid) continue;
    if (hasNonEmptyPicksObject(d.picks)) usersWithPicks.add(uid);
  }

  const usersSnap = await db
    .collection("users")
    .where("handle", ">", "")
    .limit(MAX_USERS_SCANNED)
    .get();

  const candidateDocs = usersSnap.docs.filter((userDoc) => {
    const uid = userDoc.id;
    if (!uid || usersWithPicks.has(uid)) return false;
    const userData = userDoc.data() || {};
    return Boolean(handleFromUser(userData.handle));
  });

  const dedupedUids = new Set();
  for (const userDoc of candidateDocs) {
    const dedupId = resolveDedupKey(TRIGGER_ID, { uid: userDoc.id, showYmd: showDate });
    if (!dedupId) continue;
    // eslint-disable-next-line no-await-in-loop
    const snap = await db.collection(LOG_COLLECTION).doc(dedupId).get();
    if (snap.exists) dedupedUids.add(userDoc.id);
  }

  const recipients = buildPicksLockReminderRecipients({
    usersWithPicks,
    showDate,
    showMeta: target,
    userDocs: candidateDocs,
    dedupedUids,
    now,
    cap: MAX_REMINDER_SENDS_PER_TICK,
  });

  if (recipients.length === 0) {
    logger?.info?.("picksLockReminder: no eligible recipients", { showDate });
    return { ok: true, showDate, processed: 0, delivered: 0 };
  }

  const runtime = createCommsAdapterRuntime({
    db,
    admin,
    resendApiKey,
    resendWebhookSecret,
    logger,
  });
  const result = await runtime.deliver(TRIGGER_ID, recipients, { dryRun: false });

  logger?.info?.("picksLockReminder complete", {
    showDate,
    processed: result.processed,
    delivered: result.delivered,
    skipped: result.skipped,
    byChannel: result.byChannel,
  });

  return { ok: true, showDate, ...result };
}

module.exports = {
  LOG_COLLECTION,
  TRIGGER_ID,
  findReminderTonightShow,
  isPastPicksLock,
  formatTimeToLock,
  reminderLogDocId,
  buildPicksLockReminderRecipients,
  runPicksLockReminderFanout,
};
