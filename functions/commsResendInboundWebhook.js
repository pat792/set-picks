/**
 * Resend inbound receiving webhook — allowlist then forward to Workspace.
 *
 * Separate endpoint from `commsResendWebhook` on purpose: that handler returns
 * `ignored_event_type` for `email.received` and never forwards. Subscribe
 * `email.received` here only. Docs: `docs/comms-triggers/INBOUND_FORWARDING.md`.
 */

"use strict";

const { normalizeEmail } = require("./commsEmailSuppression");

const INBOUND_DOMAIN = "setlistpickem.com";
const INBOUND_FORWARD_TO = "support@road2media.com";
const INBOUND_ENVELOPE_FROM = "updates@setlistpickem.com";
/** `help@` stays off — public contact is `support@`. */
const INBOUND_ALLOWLIST_LOCAL_PARTS = Object.freeze([
  "updates",
  "unsubscribe",
  "support",
]);
/** Prefer the public mailbox when more than one allowlisted address is on the message. */
const INBOUND_ENVELOPE_PRIORITY = Object.freeze(["support", "updates", "unsubscribe"]);

/**
 * @param {unknown} entry
 * @returns {string}
 */
function parseAddressEntry(entry) {
  if (!entry) return "";
  if (typeof entry === "object") {
    return normalizeEmail(entry.email || entry.address || entry.value || "");
  }
  const raw = String(entry).trim();
  const angled = raw.match(/<([^>]+)>/);
  return normalizeEmail(angled ? angled[1] : raw);
}

/**
 * @param {unknown} list
 * @returns {string[]}
 */
function collectAddresses(list) {
  if (Array.isArray(list)) {
    return list.map(parseAddressEntry).filter(Boolean);
  }
  if (typeof list === "string" || (list && typeof list === "object")) {
    const parsed = parseAddressEntry(list);
    return parsed ? [parsed] : [];
  }
  return [];
}

/**
 * @param {unknown} event
 * @returns {string[]}
 */
function extractInboundRecipients(event) {
  const data = event?.data || {};
  const seen = new Set();
  const out = [];
  for (const email of [
    ...collectAddresses(data.to),
    ...collectAddresses(data.cc),
  ]) {
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

/**
 * @param {string} email
 * @returns {{ local: string, domain: string }}
 */
function splitEmail(email) {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at <= 0) return { local: "", domain: "" };
  return { local: normalized.slice(0, at), domain: normalized.slice(at + 1) };
}

/**
 * @param {string} email
 * @returns {boolean}
 */
function isAllowlistedInbound(email) {
  const { local, domain } = splitEmail(email);
  return domain === INBOUND_DOMAIN && INBOUND_ALLOWLIST_LOCAL_PARTS.includes(local);
}

/**
 * Envelope `from` must be on the verified domain. Use the allowlisted
 * local-part that received the mail so Gmail does not show every forward
 * as `updates@`.
 *
 * @param {string[]} matched
 * @returns {string}
 */
function resolveInboundEnvelopeFrom(matched) {
  const locals = new Set(matched.map((email) => splitEmail(email).local));
  for (const local of INBOUND_ENVELOPE_PRIORITY) {
    if (locals.has(local)) return `${local}@${INBOUND_DOMAIN}`;
  }
  return INBOUND_ENVELOPE_FROM;
}

/**
 * @param {object | null | undefined} resend
 */
function assertReceivingForwardAvailable(resend) {
  if (typeof resend?.emails?.receiving?.forward !== "function") {
    const err = new Error("resend_receiving_forward_unavailable");
    err.code = "resend_receiving_forward_unavailable";
    throw err;
  }
}

/**
 * @param {{
 *   event: { type?: string, data?: Record<string, unknown> },
 *   eventId?: string | null,
 *   resend: { emails?: { receiving?: { forward?: Function } } } | null,
 *   logger?: { info?: Function, warn?: Function },
 *   forwardTo?: string,
 *   envelopeFrom?: string,
 * }} params
 */
async function handleResendInboundEvent({
  event,
  eventId,
  resend,
  logger,
  forwardTo = INBOUND_FORWARD_TO,
  envelopeFrom = null,
}) {
  const type = event?.type;
  if (type !== "email.received") {
    return { ok: true, handled: false, reason: "ignored_event_type", type };
  }

  const emailId =
    typeof event?.data?.email_id === "string" && event.data.email_id.trim()
      ? event.data.email_id.trim()
      : null;
  if (!emailId) {
    return { ok: true, handled: false, reason: "missing_email_id", type };
  }

  const recipients = extractInboundRecipients(event);
  const matched = recipients.filter(isAllowlistedInbound);
  const localParts = matched.map((email) => splitEmail(email).local);

  if (matched.length === 0) {
    logger?.info?.("comms_inbound_dropped", {
      comms_channel: "email",
      resendEmailId: emailId,
      reason: "not_allowlisted",
    });
    return {
      ok: true,
      handled: true,
      forwarded: false,
      reason: "not_allowlisted",
      emailId,
      type,
    };
  }

  if (!resend) {
    const err = new Error("missing_resend_client");
    err.code = "missing_resend_client";
    throw err;
  }
  assertReceivingForwardAvailable(resend);

  const from = envelopeFrom || resolveInboundEnvelopeFrom(matched);
  const requestOptions = eventId
    ? { idempotencyKey: `inbound-fwd:${eventId}` }
    : undefined;
  const result = await resend.emails.receiving.forward(
    {
      emailId,
      to: forwardTo,
      from,
    },
    requestOptions
  );
  if (result?.error) {
    const err = new Error(result.error.message || "inbound_forward_failed");
    err.code = "inbound_forward_failed";
    throw err;
  }

  logger?.info?.("comms_inbound_forwarded", {
    comms_channel: "email",
    resendEmailId: emailId,
    localParts,
    dest: forwardTo,
  });

  return {
    ok: true,
    handled: true,
    forwarded: true,
    emailId,
    localParts,
    dest: forwardTo,
    envelopeFrom: from,
    forwardedId: result?.data?.id || null,
    type,
  };
}

module.exports = {
  INBOUND_DOMAIN,
  INBOUND_FORWARD_TO,
  INBOUND_ENVELOPE_FROM,
  INBOUND_ALLOWLIST_LOCAL_PARTS,
  resolveInboundEnvelopeFrom,
  extractInboundRecipients,
  isAllowlistedInbound,
  handleResendInboundEvent,
  assertReceivingForwardAvailable,
};
