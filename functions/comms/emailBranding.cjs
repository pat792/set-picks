'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Email branding assets — two layers, do not conflate:
 *
 * 1. **In-body header** (`EMAIL_IN_BODY_LOGO_PATH`) — large vinyl mark inside the opened
 *    email HTML. Controlled by `buildEmailInBodyLogoUrl()` in templates.
 *
 * 2. **Inbox sender badge** — small avatar beside the sender name in Gmail/Apple Mail list
 *    views. NOT driven by the HTML `<img>`. Requires BIMI + DMARC (primary) and/or domain
 *    favicon at the From host (fallback). See docs/comms-triggers/EMAIL_INBOX_BADGE.md (#498).
 *
 * 3. **Service shell wordmark** — raster PNG at `/branding/email-gradient-wordmark.png`
 *    (hosted HTTPS URL, same pattern as marketing `buildEmailLogoUrl`). Asset must live in
 *    `public/branding/` on the deployed site. Do not use CID attachments — Gmail exposes
 *    those as downloadable files. Render as a CSS background (not `<img>`) so clients
 *    cannot open the raw PNG on tap; Outlook gets a conditional unlinked `<img>` fallback.
 */
const EMAIL_IN_BODY_LOGO_PATH = '/favicon/web-app-manifest-512x512.png';
/** Public CDN path — deploy via Vercel (`public/branding/`). */
const EMAIL_WORDMARK_GRADIENT_PATH = '/branding/email-gradient-wordmark.png';
const EMAIL_WORDMARK_PNG_FILE = 'email-gradient-wordmark.png';
/** Resend inline attachment id — referenced as `cid:…` in the HTML shell. */
const EMAIL_WORDMARK_INLINE_CONTENT_ID = 'email-gradient-wordmark';
/** design.md brand tokens — service comms HTML shell only. */
const EMAIL_BRAND_PRIMARY = '#2dd4bf';
const EMAIL_BRAND_PRIMARY_STRONG = '#14b8a6';
const EMAIL_BRAND_BG_DEEP = '#020617';
/** Secondary CTA (invite share) — blue to contrast teal primary. */
const EMAIL_BRAND_SECONDARY = '#2563eb';
const EMAIL_BRAND_SECONDARY_FG = '#ffffff';
/** Hint for BIMI / domain-favicon ops — not injected into email HTML. */
const EMAIL_INBOX_BADGE_FAVICON_PATH = '/favicon/favicon-96x96.png';
const DEFAULT_SITE_URL = 'https://www.setlistpickem.com';

/** @type {string | null} */
let cachedWordmarkDataUri = null;

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

/**
 * Hosted PNG URL (optional — requires web deploy of `public/branding/`).
 * @param {string} [siteUrl]
 * @returns {string}
 */
function buildEmailWordmarkUrl(siteUrl = DEFAULT_SITE_URL) {
  const base = String(siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '');
  return `${base}${EMAIL_WORDMARK_GRADIENT_PATH}`;
}

/**
 * @returns {Buffer}
 */
function readEmailWordmarkPngBuffer() {
  const pngPath = path.join(__dirname, EMAIL_WORDMARK_PNG_FILE);
  return fs.readFileSync(pngPath);
}

/**
 * @deprecated CID inline attachments — Gmail treats these as downloadable files. Use {@link buildEmailWordmarkUrl}.
 * @returns {string}
 */
function buildEmailWordmarkCidSrc() {
  return `cid:${EMAIL_WORDMARK_INLINE_CONTENT_ID}`;
}

/**
 * Resend inline attachment for the service comms shell wordmark (Node SDK shape).
 * @returns {{ filename: string, content: string, contentType: string, inlineContentId: string }}
 */
function buildEmailWordmarkResendAttachment() {
  const buf = readEmailWordmarkPngBuffer();
  return {
    filename: EMAIL_WORDMARK_PNG_FILE,
    content: buf.toString('base64'),
    contentType: 'image/png',
    inlineContentId: EMAIL_WORDMARK_INLINE_CONTENT_ID,
  };
}

/**
 * REST API attachment shape for raw `fetch` to api.resend.com (preview script).
 * SDK maps camelCase itself; do not pass `inlineContentId` to the REST API.
 *
 * @param {ReturnType<typeof buildEmailWordmarkResendAttachment>} attachment
 * @returns {{ filename: string, content: string, content_type: string, inline_content_id: string }}
 */
function formatWordmarkAttachmentForResendApi(attachment) {
  return {
    filename: attachment.filename,
    content: attachment.content,
    content_type: attachment.contentType,
    inline_content_id: attachment.inlineContentId,
  };
}

/**
 * Data URI for **local file preview only** — Gmail and most clients strip `data:` images in sent mail.
 * @returns {string}
 */
function buildEmailWordmarkInlineSrc() {
  if (cachedWordmarkDataUri) return cachedWordmarkDataUri;
  cachedWordmarkDataUri = `data:image/png;base64,${readEmailWordmarkPngBuffer().toString('base64')}`;
  return cachedWordmarkDataUri;
}

module.exports = {
  EMAIL_IN_BODY_LOGO_PATH,
  EMAIL_WORDMARK_GRADIENT_PATH,
  EMAIL_WORDMARK_INLINE_CONTENT_ID,
  EMAIL_BRAND_PRIMARY,
  EMAIL_BRAND_PRIMARY_STRONG,
  EMAIL_BRAND_BG_DEEP,
  EMAIL_BRAND_SECONDARY,
  EMAIL_BRAND_SECONDARY_FG,
  EMAIL_INBOX_BADGE_FAVICON_PATH,
  buildEmailInBodyLogoUrl,
  buildEmailLogoUrl,
  buildEmailWordmarkUrl,
  buildEmailWordmarkCidSrc,
  buildEmailWordmarkResendAttachment,
  formatWordmarkAttachmentForResendApi,
  buildEmailWordmarkInlineSrc,
};
