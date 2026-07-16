'use strict';

const { EMAIL_BRAND_PRIMARY, EMAIL_BRAND_BG_DEEP } = require('./emailBranding.cjs');

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

const DEFAULT_INVITE_INTRO = 'Invite your crew to join the community.';
const DEFAULT_INVITE_CTA = 'Share your invite →';

/**
 * Plain-text invite lines for multipart/alternative (HTML uses the button block).
 * Sender-facing — not the invitee landing headline.
 *
 * @param {{ invite_url: string, intro?: string }} share
 * @returns {string[]}
 */
function buildInviteSharePlainTextLines(share) {
  if (!share?.invite_url) return [];
  const intro =
    typeof share.intro === 'string' && share.intro.trim()
      ? share.intro.trim()
      : DEFAULT_INVITE_INTRO;
  const url = String(share.invite_url || '').trim();
  return [intro, `Invite link: ${url}`];
}

/**
 * Secondary invite card for the service email shell (#583 / #572 review).
 * Intro + button only — no bare URL (button is the CTA; URL stays in plain-text part).
 *
 * @param {{
 *   invite_url: string,
 *   intro?: string,
 *   ctaLabel?: string,
 * }} share
 * @returns {string}
 */
function buildInviteShareHtmlBlock(share) {
  if (!share?.invite_url) return '';
  const intro = escapeHtml(
    typeof share.intro === 'string' && share.intro.trim()
      ? share.intro.trim()
      : DEFAULT_INVITE_INTRO
  );
  const url = escapeHtml(share.invite_url);
  const buttonLabel = escapeHtml(
    typeof share.ctaLabel === 'string' && share.ctaLabel.trim()
      ? share.ctaLabel.trim()
      : DEFAULT_INVITE_CTA
  );
  return `<div style="margin:28px 0 8px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background-color:#f8fafc;">
  <p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;color:#1a1a2e;">${intro}</p>
  <a href="${url}" style="display:inline-block;margin:0;padding:12px 24px;background-color:${EMAIL_BRAND_PRIMARY};color:${EMAIL_BRAND_BG_DEEP};text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">${buttonLabel}</a>
</div>`;
}

module.exports = {
  buildInviteSharePlainTextLines,
  buildInviteShareHtmlBlock,
  escapeHtml,
  DEFAULT_INVITE_INTRO,
  DEFAULT_INVITE_CTA,
};
