/**
 * Marketing email template renderers (#468 launch + almost-end).
 *
 * Long-form React Email HTML is pre-built under `functions/emails/*.cjs`.
 */

"use strict";

const {
  DEFAULT_SUBJECT: ALMOST_END_SUBJECT,
  TEMPLATE_ID: ALMOST_END_TEMPLATE_ID,
} = require("./marketingAlmostEndCore");

const DEFAULT_SUBJECT = "Summer Tour's almost here — bring your crew →";

/**
 * Lazy-load the esbuild bundle (gitignored; built by `npm run emails:build` / predeploy).
 * Keeps unrelated functions unit tests loadable when the artifact is absent.
 */
function loadRenderSummerTour2026LaunchEmail() {
  // eslint-disable-next-line global-require
  return require("./emails/renderSummerTour2026Launch.cjs").renderSummerTour2026LaunchEmail;
}

function loadRenderSummer2026AlmostEndEmail() {
  // eslint-disable-next-line global-require
  return require("./emails/renderSummer2026AlmostEnd.cjs").renderSummer2026AlmostEndEmail;
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<{ push: { title: string, body: string }, email: { subject: string, text: string, html: string, ctaUrl?: string } }>}
 */
async function buildSummerTour2026LaunchChannels(payload = {}) {
  const renderSummerTour2026LaunchEmail = loadRenderSummerTour2026LaunchEmail();
  const { html, text } = await renderSummerTour2026LaunchEmail(payload);
  const subject =
    typeof payload.subject === "string" && payload.subject.trim()
      ? payload.subject.trim()
      : DEFAULT_SUBJECT;
  const ctaUrl =
    typeof payload.shareUrl === "string" && payload.shareUrl.trim()
      ? payload.shareUrl.trim()
      : typeof payload.ctaUrl === "string" && payload.ctaUrl.trim()
        ? payload.ctaUrl.trim()
        : undefined;

  return {
    push: {
      title: "Summer Tour is here",
      body: "Bring your crew — the app is ready for the opener.",
    },
    email: {
      subject,
      text,
      html,
      ...(ctaUrl ? { ctaUrl } : {}),
    },
  };
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<{
 *   inApp: { templateId: string, payload: Record<string, unknown> },
 *   push: { title: string, body: string },
 *   email: { subject: string, text: string, html: string, ctaUrl?: string }
 * }>}
 */
async function buildSummer2026AlmostEndChannels(payload = {}) {
  const renderSummer2026AlmostEndEmail = loadRenderSummer2026AlmostEndEmail();
  const withNonce = {
    ...payload,
    messageNonce:
      typeof payload.messageNonce === "string" && payload.messageNonce.trim()
        ? payload.messageNonce.trim()
        : `ae${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
  };
  const { html, text } = await renderSummer2026AlmostEndEmail(withNonce);
  const subject =
    typeof withNonce.subject === "string" && withNonce.subject.trim()
      ? withNonce.subject.trim()
      : ALMOST_END_SUBJECT;
  const ctaUrl =
    typeof withNonce.standingsUrl === "string" && withNonce.standingsUrl.trim()
      ? withNonce.standingsUrl.trim()
      : typeof withNonce.shareUrl === "string" && withNonce.shareUrl.trim()
        ? withNonce.shareUrl.trim()
        : undefined;

  return {
    inApp: {
      templateId: ALMOST_END_TEMPLATE_ID,
      payload: withNonce,
    },
    push: {
      title: "Almost tour end",
      body: "Fenway wrapped · Dick's still ahead — your tape is inside.",
    },
    email: {
      subject,
      text,
      html,
      ...(ctaUrl ? { ctaUrl } : {}),
    },
  };
}

module.exports = {
  buildSummerTour2026LaunchChannels,
  buildSummer2026AlmostEndChannels,
  DEFAULT_SUBJECT,
};
