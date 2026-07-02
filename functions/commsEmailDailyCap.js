/**
 * Per-user daily email fatigue cap (#453, epic #441).
 *
 * Piggybacks on the existing `fcm_notification_log` collection (already the
 * shared, server-only comms dedup log — see `commsCatalog.js` dedup keys)
 * with a new `email_cap:{uid}:{day}` doc-id shape, instead of introducing a
 * new collection/`firestore.rules` entry. Written transactionally so
 * concurrent Cloud Function invocations for the same user (e.g. two
 * different triggers firing near-simultaneously) can't both win the same
 * day's slot.
 *
 * Day boundary is `America/Los_Angeles`, not per-show venue-local time: a
 * user's inbox isn't tied to a single show/venue (they may follow multiple
 * tours/timezones, or the trigger may have no show at all), so reusing the
 * picks-lock per-show timezone would make "today" incoherently different
 * depending on which trigger is checked. LA also matches the existing daily
 * batch cron's own anchor (`scheduledTourRankingsDailyComms`).
 */

"use strict";

const { ymdInTimeZone } = require("./phishnetLiveSetlistAutomation");

const CAP_COLLECTION = "fcm_notification_log";
const DAY_TIME_ZONE = "America/Los_Angeles";
const EMAIL_DAILY_CAP = 1;

/**
 * One-time-ever lifecycle sends can never contribute to fatigue (there's
 * only ever one) and must never be silently dropped by a same-day
 * collision with another trigger — this is the highest-trust send a new
 * user gets.
 */
const EXEMPT_TRIGGERS = new Set(["account_welcome"]);

/**
 * @param {string} triggerId
 * @returns {boolean}
 */
function isExemptFromDailyCap(triggerId) {
  return EXEMPT_TRIGGERS.has(triggerId);
}

/**
 * @param {string} uid
 * @param {string} day `YYYY-MM-DD` in `DAY_TIME_ZONE`.
 * @returns {string}
 */
function emailDailyCapDocId(uid, day) {
  if (!uid || !day) return "";
  return `email_cap:${uid}:${day}`;
}

/**
 * Reserve today's one discretionary-email slot for a user.
 *
 * - Exempt triggers (`account_welcome`) always return `{allowed: true}`
 *   without touching Firestore.
 * - Non-exempt triggers race for the slot transactionally — whichever
 *   trigger's email worker reserves it first that day wins; later attempts
 *   for the same `(uid, day)` are capped.
 * - **Fails open** (`allowed: true, failedOpen: true`) on any transaction
 *   error. This is a fatigue/UX guard, not a compliance gate — a transient
 *   Firestore hiccup must never silently swallow a legitimate email (e.g.
 *   `picks_lock_reminder`, which isn't even email-channel today, or a
 *   future transactional trigger).
 *
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {typeof import("firebase-admin")} admin
 * @param {{ uid: string, triggerId: string, now?: Date, logger?: { warn?: Function } }} params
 * @returns {Promise<{ allowed: boolean, exempt?: boolean, failedOpen?: boolean, day?: string, winningTriggerId?: string | null }>}
 */
async function reserveEmailDailyCapSlot(db, admin, { uid, triggerId, now = new Date(), logger } = {}) {
  if (isExemptFromDailyCap(triggerId)) {
    return { allowed: true, exempt: true };
  }
  if (!db || !admin || !uid) {
    return { allowed: true };
  }

  const day = ymdInTimeZone(now, DAY_TIME_ZONE);
  const docId = emailDailyCapDocId(uid, day);
  if (!docId) return { allowed: true };
  const ref = db.collection(CAP_COLLECTION).doc(docId);

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? snap.data() || {} : {};
      const count = typeof data.count === "number" ? data.count : 0;

      if (count >= EMAIL_DAILY_CAP) {
        return { allowed: false, day, winningTriggerId: data.lastTriggerId || null };
      }

      tx.set(
        ref,
        {
          kind: "email_daily_cap",
          uid,
          day,
          cap: EMAIL_DAILY_CAP,
          count: count + 1,
          lastTriggerId: triggerId,
          lastEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: snap.exists ? data.createdAt || null : admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { allowed: true, day };
    });
  } catch (error) {
    logger?.warn?.("reserveEmailDailyCapSlot: transaction failed, failing open", {
      uid,
      triggerId,
      error: error?.message || String(error),
    });
    return { allowed: true, failedOpen: true };
  }
}

module.exports = {
  CAP_COLLECTION,
  DAY_TIME_ZONE,
  EMAIL_DAILY_CAP,
  EXEMPT_TRIGGERS,
  isExemptFromDailyCap,
  emailDailyCapDocId,
  reserveEmailDailyCapSlot,
};
