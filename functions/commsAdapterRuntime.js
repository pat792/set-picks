/**
 * Shared runtime for comms event adapters (#440 / epic #441).
 *
 * Builds channel workers once per invocation and delegates to
 * `deliverCommsTrigger`. Adapters stay thin — they only resolve audience +
 * payload and call `deliver()`.
 */

"use strict";

const { deliverCommsTrigger, buildDefaultWorkers } = require("./commsDelivery");
const { createCommsEmailWorker, buildResendClient } = require("./commsEmailWorker");

const MAX_RECIPIENTS_PER_INVOCATION = 150;

/**
 * Production adapters are opt-in until Resend secrets + domain verification
 * and per-trigger canaries complete (PR #445 rollout notes).
 */
function isCommsEventAdaptersEnabled() {
  return process.env.COMMS_EVENT_ADAPTERS_ENABLED === "true";
}

/**
 * @param {{
 *   db: import("firebase-admin").firestore.Firestore,
 *   admin: typeof import("firebase-admin"),
 *   resendApiKey?: string,
 *   logger?: { info?: Function, warn?: Function, error?: Function },
 * }} deps
 */
function createCommsAdapterRuntime({ db, admin, resendApiKey, resendWebhookSecret, logger } = {}) {
  const emailWorker = createCommsEmailWorker({
    resendClient: buildResendClient(resendApiKey, logger),
    db,
    unsubscribeSigningSecret: resendWebhookSecret,
    logger,
  });
  const workers = buildDefaultWorkers({ emailWorker });

  /**
   * @param {string} triggerId
   * @param {Array<{ uid: string, userData?: object, payload?: object, vars?: object }>} recipients
   * @param {{ dryRun?: boolean, forceResend?: boolean }} [opts]
   */
  async function deliver(triggerId, recipients, opts = {}) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return { processed: 0, delivered: 0, skipped: 0, results: [] };
    }
    const capped =
      recipients.length > MAX_RECIPIENTS_PER_INVOCATION
        ? recipients.slice(0, MAX_RECIPIENTS_PER_INVOCATION)
        : recipients;
    if (capped.length < recipients.length) {
      logger?.warn?.("comms adapter: recipient cap reached", {
        triggerId,
        requested: recipients.length,
        cap: MAX_RECIPIENTS_PER_INVOCATION,
      });
    }
    return deliverCommsTrigger({
      db,
      admin,
      triggerId,
      recipients: capped,
      workers,
      dryRun: opts.dryRun === true,
      forceResend: opts.forceResend === true,
      logger,
    });
  }

  return { deliver, workers };
}

module.exports = {
  isCommsEventAdaptersEnabled,
  createCommsAdapterRuntime,
  MAX_RECIPIENTS_PER_INVOCATION,
};
