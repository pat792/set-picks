'use strict';

const { EMAIL_BRAND_SECONDARY } = require('./emailBranding.cjs');

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

const DEFAULT_INVITE_CTA = 'Open Standings to share →';

const INVITE_NUDGE_INTRO =
  "Want to share with friends? Log in and tap Share on Standings — your invite link is ready there.";

const INVITE_NUDGE_FORWARD = 'Or forward this email to a friend.';

/**
 * Soft invite nudge copy (in-app Share + forward).
 * @returns {{ intro: string, forward: string }}
 */
function buildInviteNudgeCopy() {
  return { intro: INVITE_NUDGE_INTRO, forward: INVITE_NUDGE_FORWARD };
}

/**
 * Plain-text invite appendix for multipart/alternative.
 * @param {{ standingsUrl?: string, app_share_url?: string }} [share]
 * @returns {string[]}
 */
function buildInviteSharePlainTextLines(share = {}) {
  const { intro, forward } = buildInviteNudgeCopy();
  const standingsUrl = String(
    share.standingsUrl || share.app_share_url || share.standings_url || '',
  ).trim();
  const lines = [intro, forward];
  if (standingsUrl) {
    lines.push('', `Open Standings: ${standingsUrl}`);
  }
  return lines;
}

/**
 * Soft invite card — points to in-app Share; optional Standings link.
 * No mailto / OS-share pretenses (email cannot open a share sheet).
 *
 * @param {{
 *   standingsUrl?: string,
 *   app_share_url?: string,
 *   standings_url?: string,
 *   ctaLabel?: string,
 *   invite_url?: string,
 * }} [share]
 * @returns {string}
 */
function buildInviteShareHtmlBlock(share = {}) {
  const { intro, forward } = buildInviteNudgeCopy();
  const standingsUrl = String(
    share.standingsUrl || share.app_share_url || share.standings_url || '',
  ).trim();
  const buttonLabel = escapeHtml(
    typeof share.ctaLabel === 'string' && share.ctaLabel.trim()
      ? share.ctaLabel.trim()
      : DEFAULT_INVITE_CTA,
  );
  const linkColor = EMAIL_BRAND_SECONDARY || '#2563eb';
  const ctaHtml = standingsUrl
    ? `<p style="margin:12px 0 0 0;"><a href="${escapeHtml(standingsUrl)}" style="color:${linkColor};font-weight:700;font-size:15px;text-decoration:underline;">${buttonLabel}</a></p>`
    : '';
  return `<div style="margin:28px 0 8px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background-color:#f8fafc;">
  <p style="margin:0 0 8px 0;font-size:15px;line-height:1.5;color:#1a1a2e;">${escapeHtml(intro)}</p>
  <p style="margin:0;font-size:14px;line-height:1.5;color:#64748b;">${escapeHtml(forward)}</p>
  ${ctaHtml}
</div>`;
}

module.exports = {
  buildInviteSharePlainTextLines,
  buildInviteShareHtmlBlock,
  buildInviteNudgeCopy,
  escapeHtml,
  DEFAULT_INVITE_CTA,
  INVITE_NUDGE_INTRO,
  INVITE_NUDGE_FORWARD,
};
