/**
 * Resend inbound receiving webhook — allowlist then forward to Workspace.
 *
 * Separate endpoint from `commsResendWebhook` on purpose: that handler returns
 * `ignored_event_type` for `email.received` and never forwards. Subscribe
 * `email.received` here only. Docs: `docs/comms-triggers/INBOUND_FORWARDING.md`.
 */

"use strict";

const {
  normalizeEmail,
  suppressEmail,
  findUserDocsByEmail,
  optOutUserEmailPrefs,
} = require("./commsEmailSuppression");

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
 * @param {unknown} entry
 * @returns {string}
 */
function extractDisplayName(entry) {
  if (!entry) return "";
  if (typeof entry === "object") {
    return String(entry.name || entry.displayName || "").trim();
  }
  const raw = String(entry).trim();
  const angled = raw.match(/^(.*)<([^>]+)>\s*$/);
  if (!angled) return "";
  return angled[1].replace(/^["']|["']$/g, "").trim();
}

/**
 * @param {string} name
 * @returns {string}
 */
function sanitizeDisplayName(name) {
  return String(name || "")
    .replace(/[<>\r\n"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Gmail From still has to be the verified domain. Put the fan in the
 * display name so the inbox list is not just `support@`.
 *
 * @param {string} envelopeAddr
 * @param {string} originalFrom
 * @returns {string}
 */
function formatInboundEnvelopeFrom(envelopeAddr, originalFrom) {
  const replyTo = parseAddressEntry(originalFrom);
  const display =
    sanitizeDisplayName(extractDisplayName(originalFrom)) ||
    sanitizeDisplayName(replyTo);
  if (!display) return envelopeAddr;
  return `${display} via Setlist Pick'em <${envelopeAddr}>`;
}

/**
 * @param {{ from: string, to: string, subject: string }} params
 * @returns {{ text: string, html: string }}
 */
function buildInboundWrapHeader({ from, to, subject }) {
  const text = [
    "---------- Forwarded message ----------",
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "",
  ].join("\n");
  const html = `<div style="margin:0 0 16px;padding:0 0 12px;border-bottom:1px solid #ccc;font:14px/1.4 sans-serif;color:#222">
<p style="margin:0 0 8px;color:#666">---------- Forwarded message ----------</p>
<p style="margin:0"><strong>From:</strong> ${escapeHtml(from)}</p>
<p style="margin:0"><strong>To:</strong> ${escapeHtml(to)}</p>
<p style="margin:0"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
</div>`;
  return { text, html };
}

/**
 * @param {string} subject
 * @returns {string}
 */
function prefixForwardSubject(subject) {
  const trimmed = String(subject || "").trim() || "(no subject)";
  return /^\s*fwd:/i.test(trimmed) ? trimmed : `Fwd: ${trimmed}`;
}

/**
 * @param {string} text
 * @param {string} html
 * @returns {string}
 */
function inboundPlainText(text, html) {
  const fromText = String(text || "").trim();
  if (fromText) return fromText.replace(/\s+/g, " ");
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * RFC 8058 mailto clients send an empty or one-word body. Real prose
 * on `unsubscribe@` still opts out, but is forwarded for a human reply.
 *
 * @param {{ text?: string, html?: string, subject?: string }} params
 * @returns {boolean}
 */
function isMachineMailtoUnsubscribe({ text, html, subject }) {
  const body = inboundPlainText(text, html);
  const subj = String(subject || "").trim();
  if (!body) return true;
  if (
    /^(unsubscribe|please unsubscribe( me)?|opt[ -]?out|remove me|stop)[.!\s]*$/i.test(
      body
    )
  ) {
    return true;
  }
  if (!subj && body.length < 12) return true;
  return false;
}

/**
 * @param {string[]} localParts
 * @returns {boolean}
 */
function isUnsubscribeOnlyInbound(localParts) {
  return localParts.includes("unsubscribe") && !localParts.includes("support") && !localParts.includes("updates");
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   email: string,
 *   eventId?: string | null,
 * }} params
 */
async function applyMailtoUnsubscribe({ db, admin, email, eventId }) {
  const normalized = normalizeEmail(email);
  if (!normalized) return { applied: false, usersUpdated: 0, reason: "invalid_email" };
  const suppressed = await suppressEmail(db, admin, {
    email: normalized,
    reason: "mailto_unsubscribe",
    source: "inbound_unsubscribe",
    eventId: eventId || null,
  });
  const users = await findUserDocsByEmail(db, normalized);
  for (const doc of users) {
    await optOutUserEmailPrefs(db, doc.id);
  }
  return {
    applied: suppressed.applied,
    usersUpdated: users.length,
    docId: suppressed.docId,
  };
}

/**
 * @param {object | null | undefined} resend
 */
function assertInboundResendClient(resend) {
  if (typeof resend?.emails?.receiving?.get !== "function") {
    const err = new Error("resend_receiving_get_unavailable");
    err.code = "resend_receiving_get_unavailable";
    throw err;
  }
  if (typeof resend?.emails?.send !== "function") {
    const err = new Error("resend_send_unavailable");
    err.code = "resend_send_unavailable";
    throw err;
  }
}

/**
 * @param {{ download_url?: string } | null | undefined} raw
 * @returns {Promise<object[]>}
 */
async function attachRawForwardedMessage(raw) {
  const url = typeof raw?.download_url === "string" ? raw.download_url : "";
  if (!url) return [];
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const buf = Buffer.from(await response.arrayBuffer());
    return [
      {
        filename: "forwarded_message.eml",
        content: buf.toString("base64"),
        contentType: "message/rfc822",
      },
    ];
  } catch {
    return [];
  }
}

/**
 * @param {{
 *   event: { type?: string, data?: Record<string, unknown> },
 *   eventId?: string | null,
 *   resend: { emails?: { send?: Function, receiving?: { get?: Function } } } | null,
 *   db?: import("firebase-admin").firestore.Firestore,
 *   admin?: typeof import("firebase-admin"),
 *   logger?: { info?: Function, warn?: Function },
 *   forwardTo?: string,
 *   envelopeFrom?: string,
 * }} params
 */
async function handleResendInboundEvent({
  event,
  eventId,
  resend,
  db = null,
  admin = null,
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
  assertInboundResendClient(resend);

  const envelopeAddr = envelopeFrom || resolveInboundEnvelopeFrom(matched);
  const requestOptions = eventId
    ? { idempotencyKey: `inbound-fwd:${eventId}` }
    : undefined;

  const received = await resend.emails.receiving.get(emailId);
  if (received?.error) {
    const err = new Error(received.error.message || "inbound_get_failed");
    err.code = "inbound_forward_failed";
    throw err;
  }

  const headers = received?.data?.headers || {};
  const originalFrom =
    headers.from ||
    headers.From ||
    received?.data?.from ||
    event?.data?.from ||
    "";
  const originalSubject =
    received?.data?.subject || event?.data?.subject || "(no subject)";
  const replyTo = parseAddressEntry(originalFrom);
  const wrap = buildInboundWrapHeader({
    from: originalFrom || "(unknown sender)",
    to: matched.join(", "),
    subject: originalSubject,
  });
  const originalText =
    typeof received?.data?.text === "string" ? received.data.text : "";
  const originalHtml =
    typeof received?.data?.html === "string" ? received.data.html : "";

  if (isUnsubscribeOnlyInbound(localParts)) {
    if (!db || !admin) {
      const err = new Error("missing_db_for_mailto_unsubscribe");
      err.code = "inbound_forward_failed";
      throw err;
    }
    const mailto = await applyMailtoUnsubscribe({
      db,
      admin,
      email: replyTo || parseAddressEntry(event?.data?.from),
      eventId,
    });
    const machine = isMachineMailtoUnsubscribe({
      text: originalText,
      html: originalHtml,
      subject: originalSubject,
    });
    logger?.info?.("comms_inbound_mailto_unsubscribed", {
      comms_channel: "email",
      resendEmailId: emailId,
      replyTo: replyTo || null,
      forwarded: !machine,
      ...mailto,
    });
    if (machine) {
      return {
        ok: true,
        handled: true,
        forwarded: false,
        reason: "mailto_unsubscribed",
        emailId,
        localParts,
        replyTo: replyTo || null,
        type,
      };
    }
  }

  const attachments = received?.data?.attachments?.length
    ? await attachRawForwardedMessage(received.data.raw)
    : [];

  const result = await resend.emails.send(
    {
      from: formatInboundEnvelopeFrom(envelopeAddr, originalFrom),
      to: forwardTo,
      ...(replyTo ? { replyTo } : {}),
      subject: prefixForwardSubject(originalSubject),
      text: originalText ? `${wrap.text}\n${originalText}` : wrap.text,
      html: originalHtml ? `${wrap.html}${originalHtml}` : wrap.html,
      ...(attachments.length ? { attachments } : {}),
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
    replyTo: replyTo || null,
  });

  return {
    ok: true,
    handled: true,
    forwarded: true,
    emailId,
    localParts,
    dest: forwardTo,
    envelopeFrom: envelopeAddr,
    replyTo: replyTo || null,
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
  assertInboundResendClient,
  formatInboundEnvelopeFrom,
  buildInboundWrapHeader,
  prefixForwardSubject,
  isMachineMailtoUnsubscribe,
  isUnsubscribeOnlyInbound,
  applyMailtoUnsubscribe,
};
