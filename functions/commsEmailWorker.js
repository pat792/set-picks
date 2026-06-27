/**
 * Email channel worker — Resend (epic #441 / #442).
 *
 * Production sends always flow through this worker so prefs, dedup, fatigue caps
 * and measurement are enforced (the Resend MCP is for drafting/QA only, never the
 * production path). The worker is a factory so the orchestrator and unit tests can
 * inject a real or fake Resend client.
 *
 * Idempotency: the orchestrator's dedup scope becomes the Resend `idempotencyKey`,
 * so email shares the same idempotency guarantee as push + in-app — retries / re-ticks
 * never double-send.
 *
 * Compliance: marketing/lifecycle mail carries `List-Unsubscribe` + one-click
 * (RFC 8058) headers wired to the Notifications settings screen.
 */

"use strict";

const DEFAULT_FROM = "Setlist Pick'em <updates@setlistpickem.com>";
const DEFAULT_SITE_URL = "https://www.setlistpickem.com";
const UNSUB_PATH = "/dashboard/notifications";

/**
 * Lazily construct a Resend client from an API key. Returns `null` when no key is
 * configured (the worker then skips with `no_email_provider` rather than throwing),
 * so a missing secret degrades gracefully instead of breaking other channels.
 *
 * @param {string | undefined} apiKey
 * @param {{ error?: Function }} [logger]
 * @returns {object | null}
 */
function buildResendClient(apiKey, logger) {
  if (!apiKey || typeof apiKey !== "string") return null;
  try {
    // eslint-disable-next-line global-require
    const { Resend } = require("resend");
    return new Resend(apiKey);
  } catch (error) {
    logger?.error?.("buildResendClient: resend module unavailable", {
      error: error?.message || String(error),
    });
    return null;
  }
}

function unsubscribeHeaders(siteUrl) {
  const base = (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const url = `${base}${UNSUB_PATH}`;
  return {
    "List-Unsubscribe": `<${url}>, <mailto:unsubscribe@setlistpickem.com>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * @param {{
 *   resendClient: object | null,
 *   fromAddress?: string,
 *   siteUrl?: string,
 *   logger?: { info?: Function, warn?: Function, error?: Function },
 * }} config
 * @returns {(ctx: {
 *   uid: string,
 *   userData: { email?: string } | null | undefined,
 *   triggerId: string,
 *   rendered: { email: { subject: string, text: string } },
 *   dedupId: string,
 *   dryRun?: boolean,
 * }) => Promise<{ ok: boolean, skipReason?: string, id?: string }>}
 */
function createCommsEmailWorker({ resendClient, fromAddress, siteUrl, logger } = {}) {
  const from = fromAddress || DEFAULT_FROM;
  const headers = unsubscribeHeaders(siteUrl);

  return async function deliverCommsEmail(ctx) {
    const { uid, userData, triggerId, rendered, dedupId, dryRun } = ctx;
    const to = userData?.email;

    if (!rendered?.email?.subject) {
      return { ok: false, skipReason: "invalid_recipient" };
    }
    if (typeof to !== "string" || !to.includes("@")) {
      return { ok: false, skipReason: "no_email" };
    }
    if (!resendClient) {
      return { ok: false, skipReason: "no_email_provider" };
    }
    if (dryRun) {
      return { ok: true, skipReason: "dry_run" };
    }

    const idempotencyKey = `${triggerId}/${uid}:${dedupId || "default"}`;

    try {
      const result = await resendClient.emails.send(
        {
          from,
          to: [to],
          subject: rendered.email.subject,
          text: rendered.email.text,
          headers,
        },
        { idempotencyKey }
      );
      if (result?.error) {
        logger?.warn?.("deliverCommsEmail: resend error", {
          uid,
          triggerId,
          error: result.error?.message || String(result.error),
        });
        return { ok: false, skipReason: "send_error" };
      }
      return { ok: true, id: result?.data?.id };
    } catch (error) {
      logger?.warn?.("deliverCommsEmail threw", {
        uid,
        triggerId,
        error: error?.message || String(error),
      });
      return { ok: false, skipReason: "send_error" };
    }
  };
}

module.exports = {
  createCommsEmailWorker,
  buildResendClient,
  unsubscribeHeaders,
  DEFAULT_FROM,
};
