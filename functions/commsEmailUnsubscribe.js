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
    return `${settings}/dashboard/profile/notifications`;
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

/**
 * Validates the signed unsubscribe token WITHOUT applying suppression.
 * Used to gate the GET confirmation page — a link-scanner or accidental
 * click merely fetches this page, it never mutates state.
 *
 * @param {{ uid: string, email: string, sig: string, signingSecret: string }} params
 * @returns {boolean}
 */
function verifyOneClickUnsubscribeToken({ uid, email, sig, signingSecret }) {
  const normalized = normalizeEmail(email);
  return Boolean(uid && normalized && verifyUnsubscribeToken(uid, normalized, sig, signingSecret));
}

/**
 * Renders the interstitial GET confirmation page: a link-scanner or an
 * antivirus gateway that prefetches the visible "Unsubscribe" footer link
 * only ever issues a GET, so this page must not, by itself, unsubscribe
 * anyone — it requires one explicit form submission (a real POST) to do so.
 * The real RFC 8058 one-click action (mail client `List-Unsubscribe-Post`)
 * always POSTs directly and never sees this page.
 *
 * @param {{ uid: string, email: string, sig: string, baseUrl?: string }} params
 * @returns {string}
 */
function renderUnsubscribeConfirmPage({ uid, email, sig, baseUrl }) {
  const endpoint = resolveUnsubscribeBaseUrl(baseUrl);
  const action = `${endpoint}?uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(normalizeEmail(email))}&sig=${encodeURIComponent(sig)}`;
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#0b0b14;font-family:-apple-system,Helvetica,Arial,sans-serif;">
    <div style="max-width:420px;margin:64px auto;background:#ffffff;border-radius:16px;padding:32px;text-align:center;">
      <h1 style="font-size:18px;color:#1a1a2e;margin:0 0 12px 0;">Unsubscribe from Setlist Pick&apos;em emails?</h1>
      <p style="font-size:14px;color:#555555;margin:0 0 24px 0;">You&apos;ll stop receiving lifecycle and update emails at ${normalizeEmail(email) || "this address"}. You can re-enable them anytime from Notifications settings.</p>
      <form method="POST" action="${action}">
        <button type="submit" style="background-color:#7c3aed;color:#ffffff;border:none;border-radius:8px;padding:12px 24px;font-weight:700;font-size:14px;cursor:pointer;">Yes, unsubscribe me</button>
      </form>
    </div>
  </body>
</html>`;
}

/**
 * @returns {string}
 */
function renderUnsubscribeSuccessPage() {
  return "<!DOCTYPE html><html><body><p>You have been unsubscribed from Setlist Pick'em email updates.</p></body></html>";
}

module.exports = {
  DEFAULT_UNSUBSCRIBE_BASE_URL,
  resolveUnsubscribeBaseUrl,
  buildOneClickUnsubscribeUrl,
  processOneClickUnsubscribe,
  verifyOneClickUnsubscribeToken,
  renderUnsubscribeConfirmPage,
  renderUnsubscribeSuccessPage,
};
