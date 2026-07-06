'use strict';

/**
 * Email branding assets — two layers, do not conflate:
 *
 * 1. **In-body header** (`EMAIL_IN_BODY_LOGO_PATH`) — large vinyl mark inside the opened
 *    email HTML. Controlled by `buildEmailInBodyLogoUrl()` in templates.
 *
 * 2. **Inbox sender badge** — small avatar beside the sender name in Gmail/Apple Mail list
 *    views. NOT driven by the HTML `<img>`. Requires BIMI + DMARC (primary) and/or domain
 *    favicon at the From host (fallback). See docs/comms-triggers/EMAIL_INBOX_BADGE.md (#498).
 */
const EMAIL_IN_BODY_LOGO_PATH = '/favicon/web-app-manifest-512x512.png';
/** Hint for BIMI / domain-favicon ops — not injected into email HTML. */
const EMAIL_INBOX_BADGE_FAVICON_PATH = '/favicon/favicon-96x96.png';
const DEFAULT_SITE_URL = 'https://www.setlistpickem.com';

/**
 * Absolute URL for the large in-body header logo (opened email).
 * @param {string} [siteUrl]
 * @returns {string}
 */
function buildEmailInBodyLogoUrl(siteUrl = DEFAULT_SITE_URL) {
  const base = String(siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '');
  return `${base}${EMAIL_IN_BODY_LOGO_PATH}`;
}

/** @deprecated Use buildEmailInBodyLogoUrl — kept for call-site stability. */
function buildEmailLogoUrl(siteUrl = DEFAULT_SITE_URL) {
  return buildEmailInBodyLogoUrl(siteUrl);
}

module.exports = {
  EMAIL_IN_BODY_LOGO_PATH,
  EMAIL_INBOX_BADGE_FAVICON_PATH,
  buildEmailInBodyLogoUrl,
  buildEmailLogoUrl,
};
