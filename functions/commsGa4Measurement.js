/**
 * Server-side GA4 Measurement Protocol bridge for comms delivery (#461).
 *
 * Mirrors client param names in `src/features/comms/model/commsAnalytics.js`
 * (`comms_trigger_id`, `comms_template_id`, `comms_channel`, `comms_variant`)
 * and the structured `comms_delivered` Cloud Logging fields in `commsDelivery.js`.
 *
 * Production-only gate (server equivalent of `src/shared/lib/ga4.js` hostname
 * guard): requires measurement id + API secret, and refuses the Functions
 * emulator so local/CI never phones home.
 */

"use strict";

const MP_COLLECT_URL = "https://www.google-analytics.com/mp/collect";

/** Firebase project id for production analytics (matches `.firebaserc`). */
const PROD_PROJECT_IDS = new Set(["set-picks"]);

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ measurementId: string, apiSecret: string }}
 */
function readGa4MpConfig(env = process.env) {
  return {
    measurementId: String(env.GA4_MEASUREMENT_ID || "").trim(),
    apiSecret: String(env.GA4_MP_API_SECRET || "").trim(),
  };
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean}
 */
function isGa4MpEnabled(env = process.env) {
  if (env.FUNCTIONS_EMULATOR === "true") return false;
  const projectId = String(env.GCLOUD_PROJECT || env.GCP_PROJECT || "").trim();
  if (projectId && !PROD_PROJECT_IDS.has(projectId)) return false;
  const { measurementId, apiSecret } = readGa4MpConfig(env);
  return Boolean(measurementId && apiSecret);
}

/**
 * Build the MP collect body for one `comms_delivered` event.
 * `client_id` is a stable pseudo-id derived from uid so GA4 accepts the hit;
 * `user_id` is the Firebase uid for user-scoped reporting (pair with client
 * `gtag('set','user_id', uid)` when that lands).
 *
 * @param {{
 *   uid: string,
 *   triggerId: string,
 *   templateId: string,
 *   channel: string,
 *   variant?: string,
 * }} input
 */
function buildCommsDeliveredMpPayload({
  uid,
  triggerId,
  templateId,
  channel,
  variant = "control",
}) {
  const safeUid = String(uid || "").trim();
  const params = {
    comms_trigger_id: String(triggerId || ""),
    comms_template_id: String(templateId || ""),
    comms_channel: String(channel || ""),
    comms_variant: String(variant || "control"),
  };
  /** @type {Record<string, unknown>} */
  const body = {
    client_id: safeUid ? `server.${safeUid}` : "server.anonymous",
    events: [
      {
        name: "comms_delivered",
        params,
      },
    ],
  };
  if (safeUid) body.user_id = safeUid;
  return body;
}

/**
 * Fire-and-forget safe: never throws. No-ops when the production gate fails.
 *
 * @param {{
 *   uid: string,
 *   triggerId: string,
 *   templateId: string,
 *   channel: string,
 *   variant?: string,
 * }} input
 * @param {{
 *   env?: NodeJS.ProcessEnv,
 *   fetchImpl?: typeof fetch,
 *   logger?: { warn?: Function, info?: Function },
 * }} [opts]
 * @returns {Promise<{ sent: boolean, reason?: string, status?: number }>}
 */
async function sendCommsDeliveredEvent(input, opts = {}) {
  const env = opts.env || process.env;
  const logger = opts.logger;
  if (!isGa4MpEnabled(env)) {
    return { sent: false, reason: "gate_off" };
  }

  const { measurementId, apiSecret } = readGa4MpConfig(env);
  const body = buildCommsDeliveredMpPayload(input);
  const url = `${MP_COLLECT_URL}?measurement_id=${encodeURIComponent(
    measurementId
  )}&api_secret=${encodeURIComponent(apiSecret)}`;

  const fetchImpl = opts.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    logger?.warn?.("comms_delivered GA4 MP skipped: fetch unavailable");
    return { sent: false, reason: "no_fetch" };
  }

  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    // MP returns 2xx with empty body on success; 204 is common.
    if (!res.ok) {
      logger?.warn?.("comms_delivered GA4 MP non-OK", {
        status: res.status,
        triggerId: input.triggerId,
        channel: input.channel,
      });
      return { sent: false, reason: "http_error", status: res.status };
    }
    return { sent: true, status: res.status };
  } catch (err) {
    const msg = err && typeof err === "object" && "message" in err ? err.message : String(err);
    logger?.warn?.("comms_delivered GA4 MP failed", {
      msg,
      triggerId: input.triggerId,
      channel: input.channel,
    });
    return { sent: false, reason: "network_error" };
  }
}

module.exports = {
  MP_COLLECT_URL,
  PROD_PROJECT_IDS,
  readGa4MpConfig,
  isGa4MpEnabled,
  buildCommsDeliveredMpPayload,
  sendCommsDeliveredEvent,
};
