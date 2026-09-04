/**
 * Resend open/click persistence (#512 Slice A).
 *
 * Writes `comms_email_engagement/{resendEmailId}` so Optimize and the Slice B
 * reminder batch can join delivered → opened without scraping the Resend UI.
 * Idempotent: webhooks are at-least-once; first `openedAt` / `clickedAt` wins.
 * A click without a prior open also stamps `openedAt` (out-of-order delivery).
 */

"use strict";

const { findUserDocsByEmail, normalizeEmail } = require("./commsEmailSuppression");
const { extractResendEmailId, extractResendTags } = require("./commsEmailTags");

const ENGAGEMENT_COLLECTION = "comms_email_engagement";

/**
 * @param {unknown} event
 * @returns {string[]}
 */
function recipientEmailsFromEvent(event) {
  const to = event?.data?.to;
  if (Array.isArray(to)) {
    return to.map((entry) => normalizeEmail(String(entry))).filter(Boolean);
  }
  if (typeof to === "string") {
    const normalized = normalizeEmail(to);
    return normalized ? [normalized] : [];
  }
  return [];
}

/**
 * @param {import("firebase-admin").firestore.Firestore} db
 * @param {string[]} emails
 * @returns {Promise<string | null>}
 */
async function resolveUidFromRecipients(db, emails) {
  if (emails.length !== 1) return null;
  const userDocs = await findUserDocsByEmail(db, emails[0]);
  return userDocs.length === 1 ? userDocs[0].id : null;
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   event: { type?: string, data?: Record<string, unknown> },
 *   eventId?: string | null,
 *   logger?: { info?: Function, warn?: Function },
 * }} params
 */
async function persistResendEmailEngagement({ db, admin, event, eventId, logger }) {
  const type = event?.type;
  const isOpen = type === "email.opened";
  const isClick = type === "email.clicked";
  if (!isOpen && !isClick) {
    return { ok: true, handled: false, reason: "not_engagement_event", type };
  }

  const resendEmailId = extractResendEmailId(event);
  if (!resendEmailId) {
    return { ok: true, handled: false, reason: "missing_email_id", type };
  }

  const tags = extractResendTags(event?.data);
  const emails = recipientEmailsFromEvent(event);
  let uid = typeof tags.uid === "string" && tags.uid.trim() ? tags.uid.trim() : null;
  const triggerId =
    typeof tags.triggerId === "string" && tags.triggerId.trim() ? tags.triggerId.trim() : null;
  const campaignId =
    typeof tags.campaignId === "string" && tags.campaignId.trim() ? tags.campaignId.trim() : null;

  if (!uid) {
    uid = await resolveUidFromRecipients(db, emails);
  }

  const ref = db.collection(ENGAGEMENT_COLLECTION).doc(resendEmailId);
  const snap = await ref.get();
  const prev = snap.exists ? snap.data() || {} : {};
  const ts = admin.firestore.FieldValue.serverTimestamp();

  /** @type {Record<string, unknown>} */
  const patch = {
    resendEmailId,
    updatedAt: ts,
  };
  if (uid) patch.uid = uid;
  if (triggerId) patch.triggerId = triggerId;
  if (campaignId) patch.campaignId = campaignId;
  if (emails[0]) patch.email = emails[0];

  let applied = false;
  if (isOpen && !prev.openedAt) {
    patch.openedAt = ts;
    if (eventId) patch.openedEventId = eventId;
    applied = true;
  }
  if (isClick && !prev.clickedAt) {
    patch.clickedAt = ts;
    if (eventId) patch.clickedEventId = eventId;
    applied = true;
    if (!prev.openedAt) {
      patch.openedAt = ts;
      if (eventId && !patch.openedEventId) patch.openedEventId = eventId;
    }
  }

  if (!applied) {
    return {
      ok: true,
      handled: true,
      type,
      applied: false,
      reason: "duplicate_event",
      resendEmailId,
      uid: prev.uid || uid,
      triggerId: prev.triggerId || triggerId,
      campaignId: prev.campaignId || campaignId,
    };
  }

  await ref.set(patch, { merge: true });

  logger?.info?.(isOpen ? "comms_email_opened" : "comms_email_clicked", {
    comms_channel: "email",
    comms_trigger_id: triggerId || prev.triggerId || null,
    uid: uid || prev.uid || null,
    campaignId: campaignId || prev.campaignId || null,
    resendEmailId,
  });

  return {
    ok: true,
    handled: true,
    type,
    applied: true,
    resendEmailId,
    uid: uid || prev.uid || null,
    triggerId: triggerId || prev.triggerId || null,
    campaignId: campaignId || prev.campaignId || null,
  };
}

module.exports = {
  ENGAGEMENT_COLLECTION,
  persistResendEmailEngagement,
};
