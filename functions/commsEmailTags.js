/**
 * Resend email tags for comms join keys (#512 Slice A).
 *
 * Resend only accepts ASCII letters, numbers, underscores, or dashes
 * (max 256 chars) for both tag name and value. Firebase UIDs and catalog
 * trigger/campaign ids already match; sanitize so a future id cannot 400 the send.
 *
 * Tags are echoed on webhook payloads (`email.opened` / `email.clicked`) so
 * `commsResendWebhook` can persist `uid` + `triggerId` + `campaignId` without
 * a reverse lookup.
 */

"use strict";

const TAG_SAFE_RE = /[^A-Za-z0-9_-]/g;
const TAG_MAX_LEN = 256;

/**
 * @param {unknown} value
 * @returns {string}
 */
function sanitizeResendTagValue(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(TAG_SAFE_RE, "_").slice(0, TAG_MAX_LEN);
}

/**
 * @param {{
 *   uid?: string | null,
 *   triggerId?: string | null,
 *   campaignId?: string | null,
 * }} fields
 * @returns {Array<{ name: string, value: string }>}
 */
function buildResendEmailTags({ uid, triggerId, campaignId } = {}) {
  const tags = [];
  const uidTag = sanitizeResendTagValue(uid);
  const triggerTag = sanitizeResendTagValue(triggerId);
  const campaignTag = sanitizeResendTagValue(campaignId);
  if (uidTag) tags.push({ name: "uid", value: uidTag });
  if (triggerTag) tags.push({ name: "triggerId", value: triggerTag });
  if (campaignTag) tags.push({ name: "campaignId", value: campaignTag });
  return tags;
}

/**
 * Resend webhooks send tags as an object `{ name: value }` or (rarely) an array
 * of `{ name, value }` pairs.
 *
 * @param {unknown} data
 * @returns {{ uid?: string, triggerId?: string, campaignId?: string, [k: string]: string }}
 */
function extractResendTags(data) {
  const raw = data && typeof data === "object" ? data.tags : null;
  /** @type {Record<string, string>} */
  const out = {};
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const name = typeof entry.name === "string" ? entry.name.trim() : "";
      if (!name) continue;
      out[name] = typeof entry.value === "string" ? entry.value : String(entry.value ?? "");
    }
    return out;
  }
  if (raw && typeof raw === "object") {
    for (const [name, value] of Object.entries(raw)) {
      if (!name) continue;
      out[name] = typeof value === "string" ? value : String(value ?? "");
    }
  }
  return out;
}

/**
 * @param {{ data?: { email_id?: unknown, emailId?: unknown } } | null | undefined} event
 * @returns {string}
 */
function extractResendEmailId(event) {
  const data = event?.data;
  const raw = data?.email_id ?? data?.emailId;
  return typeof raw === "string" && raw.trim() ? raw.trim() : "";
}

module.exports = {
  sanitizeResendTagValue,
  buildResendEmailTags,
  extractResendTags,
  extractResendEmailId,
};
