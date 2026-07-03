/**
 * Marketing email template renderers (#468).
 *
 * Long-form React Email HTML is pre-built in `emails/renderSummerTour2026Launch.cjs`.
 */

"use strict";

const DEFAULT_SUBJECT = "Summer Tour's almost here — bring your crew →";

/**
 * Lazy-load the esbuild bundle (gitignored; built by `npm run emails:build` / predeploy).
 * Keeps unrelated functions unit tests loadable when the artifact is absent.
 */
function loadRenderSummerTour2026LaunchEmail() {
  // eslint-disable-next-line global-require
  return require("./emails/renderSummerTour2026Launch.cjs").renderSummerTour2026LaunchEmail;
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

module.exports = {
  buildSummerTour2026LaunchChannels,
  DEFAULT_SUBJECT,
};
