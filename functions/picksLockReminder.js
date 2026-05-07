/**
 * Pre-lock pick reminder fan-out (issue #276) — venue-local day + lock window,
 * deduped in `fcm_notification_log`.
 */

const {
  parseShowCalendarSnapshotToShows,
  ymdInTimeZone,
  hourInTimeZone,
} = require("./phishnetLiveSetlistAutomation");
const { hasNonEmptyPicksObject } = require("./rollupSeasonAggregates");
const { sendWebPushToToken } = require("./fcmMessagingCore");

/** Mirrors `src/shared/utils/timeLogic.js` (7:55pm local, #303). */
const SHOW_PICKS_LOCK_HOUR = 19;
const SHOW_PICKS_LOCK_MINUTE = 55;

const DEFAULT_SHOW_TIME_ZONE = "America/Los_Angeles";
/** Only nudge from 4pm local onward on show day (#276). */
const REMINDER_LOCAL_START_HOUR = 16;

const MAX_REMINDER_SENDS_PER_TICK = 150;
const MAX_TOKEN_DOCS_SCANNED = 900;

const LOG_COLLECTION = "fcm_notification_log";

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
 * @param {Array<{ date: string, timeZone?: string }>} calendarShows
 * @param {Date} now
 * @returns {{ showDate: string, timeZone: string } | null}
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
    return { showDate: date, timeZone: tz };
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
 * @param {import("firebase-admin").firestore.DocumentData | null | undefined} userData
 */
function userWantsReminders(userData) {
  const p = userData?.notificationPrefs;
  if (!p || typeof p !== "object") return true;
  return p.reminders !== false;
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   logger?: { info?: Function, warn?: Function, error?: Function },
 *   now?: Date,
 * }} params
 */
async function runPicksLockReminderFanout({ db, admin, logger, now = new Date() }) {
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

  const userDataCache = new Map();
  const logExistsCache = new Map();
  const reminded = new Set();
  let sent = 0;

  async function loadUser(uid) {
    if (userDataCache.has(uid)) return userDataCache.get(uid);
    const snap = await db.collection("users").doc(uid).get();
    const data = snap.exists ? snap.data() || {} : {};
    userDataCache.set(uid, data);
    return data;
  }

  async function reminderAlreadySent(uid) {
    if (logExistsCache.has(uid)) return logExistsCache.get(uid);
    const snap = await db
      .collection(LOG_COLLECTION)
      .doc(reminderLogDocId(showDate, uid))
      .get();
    const exists = snap.exists;
    logExistsCache.set(uid, exists);
    return exists;
  }

  const tokenSnap = await db
    .collectionGroup("private_fcmTokens")
    .limit(MAX_TOKEN_DOCS_SCANNED)
    .get();

  for (const tokenDoc of tokenSnap.docs) {
    if (sent >= MAX_REMINDER_SENDS_PER_TICK) break;

    const userRef = tokenDoc.ref.parent.parent;
    const uid = typeof userRef?.id === "string" ? userRef.id : "";
    if (!uid) continue;

    if (usersWithPicks.has(uid) || reminded.has(uid)) continue;

    if (await reminderAlreadySent(uid)) continue;

    const userData = await loadUser(uid);
    if (!userWantsReminders(userData)) continue;

    const token = tokenDoc.data()?.token;
    if (typeof token !== "string" || !token.trim()) continue;

    const res = await sendWebPushToToken({
      admin,
      db,
      token: token.trim(),
      userId: uid,
      title: "Tonight's picks lock soon",
      body: `Lock in your picks for ${showDate} before showtime.`,
      data: {
        kind: "pickReminder",
        showDate,
      },
      logger,
    });

    if (res.ok) {
      reminded.add(uid);
      logExistsCache.set(uid, true);
      await db
        .collection(LOG_COLLECTION)
        .doc(reminderLogDocId(showDate, uid))
        .set(
          {
            kind: "reminder",
            showDate,
            userId: uid,
            delivered: true,
            decidedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      sent += 1;
    }
  }

  logger?.info?.("picksLockReminder complete", { showDate, sent });
  return { ok: true, showDate, sent };
}

module.exports = {
  LOG_COLLECTION,
  findReminderTonightShow,
  isPastPicksLock,
  reminderLogDocId,
  runPicksLockReminderFanout,
};
