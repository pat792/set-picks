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
 * never double-send. Resend rejects reusing a key with a *different* request body
 * within 24h ("idempotency key ... doesn't match the original request"), so a
 * `forceResend` (admin QA re-run, or `runCommsTrigger` replay) also appends a
 * timestamp to the key — otherwise iterating on template content and re-sending
 * the same (triggerId, uid, dedupId) QA case would collide with the prior send's
 * cached key instead of actually resending.
 *
 * Compliance: marketing/lifecycle mail carries `List-Unsubscribe` + one-click
 * (RFC 8058) headers wired to the Notifications settings screen, *and* a
 * visible "Unsubscribe" / "Manage preferences" link in the HTML body itself
 * (headers alone satisfy RFC 8058 but most inboxes never surface them to a
 * human reader).
 *
 * Every send carries both `html` (branded — logo, button, footer links) and
 * `text` (plain-text fallback derived from the same content) parts.
 *
 * `ctx.bypassDailyCap` skips the #453 daily fatigue-cap reservation entirely.
 * Only the admin-only `runCommsTrigger` QA/canary callable ever sets this
 * (never the production event adapters), so a reviewer can preview every
 * template's rendered email in one sitting without burning through — or being
 * blocked by — the real per-user daily cap.
 */

"use strict";

const { isEmailSuppressed } = require("./commsEmailSuppression");
const { buildOneClickUnsubscribeUrl } = require("./commsEmailUnsubscribe");
const { reserveEmailDailyCapSlot } = require("./commsEmailDailyCap");
const {
  buildEmailWordmarkUrl,
  EMAIL_BRAND_PRIMARY,
  EMAIL_BRAND_PRIMARY_STRONG,
  EMAIL_BRAND_BG_DEEP,
} = require("../comms/emailBranding.cjs");

const DEFAULT_FROM = "Setlist Pick'em <updates@setlistpickem.com>";
const DEFAULT_SITE_URL = "https://www.setlistpickem.com";
const UNSUB_PATH = "/dashboard/profile/notifications";
/** ~96% of the 416px inner shell width; height tracks email-gradient-wordmark.svg (~3:1). */
const EMAIL_SHELL_WORDMARK_WIDTH_PX = 400;
const EMAIL_SHELL_WORDMARK_HEIGHT_PX = 132;
const EMAIL_SHELL_ACCENT_BORDER_PX = 2;

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

/**
 * @param {string} [siteUrl]
 * @param {{ uid?: string, email?: string, signingSecret?: string, baseUrl?: string }} [opts]
 * @returns {{ settingsUrl: string, oneClickUrl: string }}
 */
function resolveUnsubscribeLinks(siteUrl, opts = {}) {
  const base = (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const settingsUrl = `${base}${UNSUB_PATH}`;
  const oneClickUrl =
    opts.uid && opts.email && opts.signingSecret
      ? buildOneClickUnsubscribeUrl(base, {
          uid: opts.uid,
          email: opts.email,
          signingSecret: opts.signingSecret,
          baseUrl: opts.baseUrl,
        })
      : settingsUrl;
  return { settingsUrl, oneClickUrl };
}

/**
 * @param {string} [siteUrl]
 * @param {{ uid?: string, email?: string, signingSecret?: string, baseUrl?: string }} [opts]
 */
function unsubscribeHeaders(siteUrl, opts = {}) {
  const { oneClickUrl } = resolveUnsubscribeLinks(siteUrl, opts);
  return {
    "List-Unsubscribe": `<${oneClickUrl}>, <mailto:unsubscribe@setlistpickem.com>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// Template bodies (`commsTemplates.js`) append a plain "Open the app: <url>"
// line so the plain-text MIME part (no clickable button available) still has
// a way to click through. The HTML part renders its own CTA button pointing
// at the same URL, so re-printing it as a bare link right above the button
// is a redundant, less-trustworthy-looking duplicate — strip it for HTML only.
const APP_LINK_LINE_RE = /^open the app:\s*https?:\/\/\S+\s*$/i;
const MANAGE_PREFS_LINE_RE = /^manage which updates you get in notifications settings\.?$/i;
const LEGACY_BRAND_SIGNOFF_RE = /^—\s*setlist pick'?em\.?$/i;

/**
 * Lines that belong in the plain-text part or HTML footer — not the visible HTML body.
 *
 * @param {string} text
 * @param {{ signOff?: string }} [opts]
 * @returns {string}
 */
function stripHtmlOnlyEmailLines(text, { signOff } = {}) {
  const signOffTrim = typeof signOff === "string" ? signOff.trim() : "";
  return String(text || "")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (APP_LINK_LINE_RE.test(trimmed)) return false;
      if (MANAGE_PREFS_LINE_RE.test(trimmed)) return false;
      if (LEGACY_BRAND_SIGNOFF_RE.test(trimmed)) return false;
      if (signOffTrim && trimmed === signOffTrim) return false;
      return true;
    })
    .join("\n");
}

/**
 * @param {string} text
 * @returns {string}
 */
function stripRedundantCtaLine(text) {
  return stripHtmlOnlyEmailLines(text);
}

/**
 * Wrap plain-text email content in a small branded HTML shell: logo, a CTA
 * button back into the app, and a visible unsubscribe / preferences footer.
 * Uses inline styles + a table layout (no external CSS/JS) for broad email
 * client compatibility.
 *
 * The visible footer link intentionally points at `settingsUrl` (the
 * preferences screen) rather than a one-click suppression URL: a plain
 * `<a href>` is a GET request that any link-scanner/antivirus gateway can
 * trigger, and RFC 8058's instant, no-confirmation one-click action is
 * reserved for the invisible `List-Unsubscribe` header, which mail clients
 * only ever invoke via POST (see `unsubscribeHeaders`).
 *
 * @param {{
 *   siteUrl: string,
 *   bodyText: string,
 *   ctaUrl: string,
 *   settingsUrl: string,
 *   ctaLabel?: string,
 *   signOff?: string,
 *   wordmarkSrc?: string,
 * }} opts
 * @returns {string}
 */
function buildBrandedEmailHtml({ siteUrl, bodyText, ctaUrl, settingsUrl, ctaLabel, signOff, wordmarkSrc }) {
  const buttonLabel = typeof ctaLabel === "string" && ctaLabel.trim() ? ctaLabel.trim() : "Open Setlist Pick'em";
  const signOffLine = typeof signOff === "string" ? signOff.trim() : "";
  const base = (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const resolvedWordmarkSrc =
    typeof wordmarkSrc === "string" && wordmarkSrc.trim()
      ? wordmarkSrc.trim()
      : buildEmailWordmarkUrl(base);
  const bodyLines = stripHtmlOnlyEmailLines(bodyText, { signOff: signOffLine })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join("<br />");
  const paragraphs = bodyLines
    ? `<p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#1a1a2e;">${bodyLines}</p>`
    : "";
  const signOffHtml = signOffLine
    ? `<p style="margin:0 0 20px 0;font-size:15px;line-height:1.5;color:#64748b;font-style:italic;">${escapeHtml(signOffLine)}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#0b0b14;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0b14;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border-top:${EMAIL_SHELL_ACCENT_BORDER_PX}px solid ${EMAIL_BRAND_PRIMARY};">
            <tr>
              <td style="padding:20px 32px 12px 32px;text-align:center;">
                <img src="${escapeHtml(resolvedWordmarkSrc)}" width="${EMAIL_SHELL_WORDMARK_WIDTH_PX}" height="${EMAIL_SHELL_WORDMARK_HEIGHT_PX}" alt="Setlist Pick'em" role="presentation" style="display:block;margin:0 auto;max-width:${EMAIL_SHELL_WORDMARK_WIDTH_PX}px;width:100%;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 8px 32px;font-family:-apple-system,Helvetica,Arial,sans-serif;">
                ${paragraphs}
                ${signOffHtml}
                <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;margin-top:8px;padding:12px 24px;background-color:${EMAIL_BRAND_PRIMARY};color:${EMAIL_BRAND_BG_DEEP};text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">${escapeHtml(buttonLabel)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;border-top:1px solid #eeeeee;text-align:center;font-family:-apple-system,Helvetica,Arial,sans-serif;">
                <p style="margin:0 0 8px 0;font-size:12px;color:#888888;">
                  You&apos;re receiving this because you have a Setlist Pick&apos;em account.
                </p>
                <p style="margin:0;font-size:12px;color:#888888;">
                  <a href="${escapeHtml(settingsUrl)}" style="color:${EMAIL_BRAND_PRIMARY_STRONG};text-decoration:underline;">Manage preferences</a>
                  &nbsp;&middot;&nbsp;
                  <a href="${escapeHtml(settingsUrl)}" style="color:${EMAIL_BRAND_PRIMARY_STRONG};text-decoration:underline;">Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Production send package — hosted wordmark URL (marketing-email pattern; no MIME attachments).
 *
 * @param {Parameters<typeof buildBrandedEmailHtml>[0]} opts
 * @returns {{ html: string }}
 */
function buildProductionBrandedEmailShell(opts) {
  return {
    html: buildBrandedEmailHtml(opts),
  };
}

/**
 * @param {{
 *   resendClient: object | null,
 *   db?: import("firebase-admin").firestore.Firestore,
 *   admin?: typeof import("firebase-admin"),
 *   fromAddress?: string,
 *   siteUrl?: string,
 *   unsubscribeSigningSecret?: string,
 *   unsubscribeBaseUrl?: string,
 *   logger?: { info?: Function, warn?: Function, error?: Function },
 * }} config
 * @returns {(ctx: {
 *   uid: string,
 *   userData: { email?: string } | null | undefined,
 *   triggerId: string,
 *   rendered: { email: { subject: string, text: string } },
 *   dedupId: string,
 *   dryRun?: boolean,
 *   forceResend?: boolean,
 *   bypassDailyCap?: boolean,
 * }) => Promise<{ ok: boolean, skipReason?: string, id?: string }>}
 */
function createCommsEmailWorker({
  resendClient,
  db,
  admin,
  fromAddress,
  siteUrl,
  unsubscribeSigningSecret,
  unsubscribeBaseUrl,
  logger,
} = {}) {
  const from = fromAddress || DEFAULT_FROM;

  return async function deliverCommsEmail(ctx) {
    const { uid, userData, triggerId, rendered, dedupId, dryRun, forceResend, bypassDailyCap } = ctx;
    const to = userData?.email;

    if (!rendered?.email?.subject) {
      return { ok: false, skipReason: "invalid_recipient" };
    }
    if (typeof to !== "string" || !to.includes("@")) {
      return { ok: false, skipReason: "no_email" };
    }
    if (db) {
      const suppressed = await isEmailSuppressed(db, to);
      if (suppressed) {
        return { ok: false, skipReason: "email_suppressed" };
      }
    }
    if (!resendClient) {
      return { ok: false, skipReason: "no_email_provider" };
    }
    if (dryRun) {
      return { ok: true, skipReason: "dry_run" };
    }
    if (db && admin && !bypassDailyCap) {
      const cap = await reserveEmailDailyCapSlot(db, admin, { uid, triggerId, logger });
      if (!cap.allowed) {
        logger?.info?.("comms_capped", {
          comms_trigger_id: triggerId,
          comms_channel: "email",
          comms_cap_winner: cap.winningTriggerId || null,
          uid,
        });
        return { ok: false, skipReason: "daily_email_cap" };
      }
    }

    const { settingsUrl, oneClickUrl } = resolveUnsubscribeLinks(siteUrl, {
      uid,
      email: to,
      signingSecret: unsubscribeSigningSecret,
      baseUrl: unsubscribeBaseUrl,
    });
    const headers = {
      "List-Unsubscribe": `<${oneClickUrl}>, <mailto:unsubscribe@setlistpickem.com>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
    const base = (siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, "");
    const usesPreRenderedHtml = typeof rendered.email.html === "string" && rendered.email.html.trim();
    const shell = usesPreRenderedHtml
      ? null
      : buildProductionBrandedEmailShell({
          siteUrl,
          bodyText: rendered.email.text,
          ctaUrl: rendered.email.ctaUrl || `${base}/dashboard`,
          settingsUrl,
          ctaLabel: rendered.email.ctaLabel,
          signOff: rendered.email.signOff,
        });
    const html = usesPreRenderedHtml ? rendered.email.html : shell.html;
    const idempotencyKey = forceResend
      ? `${triggerId}/${uid}:${dedupId || "default"}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
      : `${triggerId}/${uid}:${dedupId || "default"}`;

    try {
      const result = await resendClient.emails.send(
        {
          from,
          to: [to],
          subject: rendered.email.subject,
          text: rendered.email.text,
          html,
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
  resolveUnsubscribeLinks,
  buildBrandedEmailHtml,
  buildProductionBrandedEmailShell,
  stripRedundantCtaLine,
  stripHtmlOnlyEmailLines,
  escapeHtml,
  DEFAULT_FROM,
};
