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

/**
 * @param {{ invite_headline: string, invite_url: string, ctaLabel?: string }} share
 * @returns {string[]}
 */
function buildInviteSharePlainTextLines(share) {
  if (!share?.invite_url) return [];
  const headline = String(share.invite_headline || '').trim();
  const url = String(share.invite_url || '').trim();
  const lines = [];
  if (headline) lines.push(headline);
  lines.push(`Invite link: ${url}`);
  return lines;
}

/**
 * Branded HTML invite block for the service email shell (#583).
 *
 * @param {{ invite_headline: string, invite_url: string, ctaLabel?: string }} share
 * @returns {string}
 */
function buildInviteShareHtmlBlock(share) {
  if (!share?.invite_url) return '';
  const headline = escapeHtml(share.invite_headline || '');
  const url = escapeHtml(share.invite_url);
  const buttonLabel = escapeHtml(
    typeof share.ctaLabel === 'string' && share.ctaLabel.trim()
      ? share.ctaLabel.trim()
      : 'Share your invite →'
  );
  return `<div style="margin:24px 0 20px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background-color:#f8fafc;">
  <p style="margin:0 0 12px 0;font-size:15px;line-height:1.5;font-weight:700;color:#1a1a2e;">${headline}</p>
  <a href="${url}" style="display:inline-block;margin:0 0 8px 0;padding:12px 24px;background-color:${EMAIL_BRAND_PRIMARY};color:${EMAIL_BRAND_BG_DEEP};text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">${buttonLabel}</a>
  <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;word-break:break-all;">${url}</p>
</div>`;
}

module.exports = {
  buildInviteSharePlainTextLines,
  buildInviteShareHtmlBlock,
  escapeHtml,
};
