/**
 * RFC 8058 one-click email unsubscribe for comms (#442).
 *
 * Mail clients POST `List-Unsubscribe=One-Click` to the URL embedded in
 * `List-Unsubscribe` headers from `commsEmailWorker`.
 */

"use strict";

const {
  normalizeEmail,
  suppressEmail,
  verifyUnsubscribeToken,
  optOutUserEmailPrefs,
  signUnsubscribeToken,
} = require("./commsEmailSuppression");

const DEFAULT_UNSUBSCRIBE_BASE_URL =
  "https://us-central1-set-picks.cloudfunctions.net/commsEmailUnsubscribe";

/**
 * @param {string} [baseUrl]
 * @returns {string}
 */
function resolveUnsubscribeBaseUrl(baseUrl) {
  const fromEnv = process.env.COMMS_UNSUBSCRIBE_BASE_URL;
  const raw = (baseUrl || fromEnv || DEFAULT_UNSUBSCRIBE_BASE_URL).trim();
  return raw.replace(/\/+$/, "");
}

/**
 * @param {string} siteUrl
 * @param {{ uid: string, email: string, signingSecret: string, baseUrl?: string }} opts
 * @returns {string}
 */
function buildOneClickUnsubscribeUrl(siteUrl, { uid, email, signingSecret, baseUrl }) {
  const secret = signingSecret;
  if (!uid || !email || !secret) {
    const settings = (siteUrl || "https://www.setlistpickem.com").replace(/\/+$/, "");
    return `${settings}/dashboard/notifications`;
  }
  const sig = signUnsubscribeToken(uid, email, secret);
  const endpoint = resolveUnsubscribeBaseUrl(baseUrl);
  return `${endpoint}?uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(normalizeEmail(email))}&sig=${sig}`;
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   uid: string,
 *   email: string,
 *   sig: string,
 *   signingSecret: string,
 *   logger?: { info?: Function, warn?: Function },
 * }} params
 */
async function processOneClickUnsubscribe({
  db,
  admin,
  uid,
  email,
  sig,
  signingSecret,
  logger,
}) {
  const normalized = normalizeEmail(email);
  if (!uid || !normalized || !verifyUnsubscribeToken(uid, normalized, sig, signingSecret)) {
    return { ok: false, reason: "invalid_token" };
  }

  await suppressEmail(db, admin, {
    email: normalized,
    reason: "one_click_unsubscribe",
    source: "unsubscribe_endpoint",
    eventId: null,
  });
  await optOutUserEmailPrefs(db, uid);

  logger?.info?.("comms_email_unsubscribed", {
    comms_channel: "email",
    uid,
  });

  return { ok: true };
}

module.exports = {
  DEFAULT_UNSUBSCRIBE_BASE_URL,
  resolveUnsubscribeBaseUrl,
  buildOneClickUnsubscribeUrl,
  processOneClickUnsubscribe,
};
