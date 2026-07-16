'use strict';

/**
 * Invite URL + copy helpers for Cloud Functions (#583).
 * Mirrors `emails/src/lib/inviteKit.js` and `src/shared/lib/inviteKit.js`.
 */

const DEFAULT_SITE_URL = 'https://www.setlistpickem.com';

/**
 * @param {unknown} handle
 * @returns {string}
 */
function normalizeInviteHandle(handle) {
  return String(handle ?? '')
    .trim()
    .replace(/^@+/, '');
}

/**
 * @param {string} handle
 * @param {string} [baseUrl]
 * @returns {string}
 */
function buildSiteInviteUrl(handle, baseUrl = DEFAULT_SITE_URL) {
  const h = normalizeInviteHandle(handle);
  const base = String(baseUrl ?? DEFAULT_SITE_URL).replace(/\/+$/, '');
  if (!base || !h) return '';
  return `${base}/invite/${encodeURIComponent(h)}`;
}

/**
 * @param {string} inviteCode
 * @param {string} [fromHandle]
 * @param {string} [baseUrl]
 * @returns {string}
 */
function buildPoolInviteUrl(inviteCode, fromHandle, baseUrl = DEFAULT_SITE_URL) {
  const code = String(inviteCode ?? '')
    .trim()
    .toUpperCase();
  const base = String(baseUrl ?? DEFAULT_SITE_URL).replace(/\/+$/, '');
  if (!base || !code) return '';
  const url = `${base}/join/${encodeURIComponent(code)}`;
  const from = normalizeInviteHandle(fromHandle);
  if (!from) return url;
  return `${url}?from=${encodeURIComponent(from)}`;
}

/**
 * @param {string} handle
 * @returns {string}
 */
function buildSiteInviteShareTitle(handle) {
  const h = normalizeInviteHandle(handle);
  if (!h) return "You're invited to Setlist Pick'em";
  return `${h} invited you to Setlist Pick'em`;
}

/**
 * @param {string} handle
 * @param {string | null | undefined} [poolName]
 * @returns {string}
 */
function buildPoolInviteShareTitleFromInviter(handle, poolName) {
  const h = normalizeInviteHandle(handle);
  const name = typeof poolName === 'string' ? poolName.trim() : '';
  if (!h) {
    return name
      ? `You're invited to join a Setlist Pick'em pool: ${name}`
      : "You're invited to join a Setlist Pick'em pool";
  }
  if (name) return `${h} invited you to join their pool: ${name}`;
  return `${h} invited you to join their pool`;
}

/**
 * @param {string} url
 * @param {{ campaign: string, content?: string }} opts
 * @returns {string}
 */
function appendInviteEmailUtms(url, { campaign, content = 'invite_share' }) {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return '';
  const params = new URLSearchParams({
    utm_source: 'email',
    utm_campaign: String(campaign ?? '').trim(),
    utm_content: String(content ?? 'invite_share').trim(),
  });
  const joiner = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${joiner}${params.toString()}`;
}

/**
 * @param {{
 *   baseUrl?: string,
 *   inviterHandle?: string,
 *   inviteCode?: string | null,
 *   poolName?: string | null,
 *   campaign: string,
 *   utmContent?: string,
 * }} opts
 * @returns {{ invite_kind: 'site' | 'pool', invite_url: string, invite_headline: string } | null}
 */
function resolveEmailInviteShare({
  baseUrl = DEFAULT_SITE_URL,
  inviterHandle,
  inviteCode,
  poolName,
  campaign,
  utmContent,
}) {
  const handle = normalizeInviteHandle(inviterHandle);
  const code =
    typeof inviteCode === 'string' && inviteCode.trim()
      ? inviteCode.trim().toUpperCase()
      : '';
  const kind = code ? 'pool' : 'site';
  const rawUrl =
    kind === 'pool'
      ? buildPoolInviteUrl(code, handle, baseUrl)
      : buildSiteInviteUrl(handle, baseUrl);
  if (!rawUrl) return null;
  const invite_url = appendInviteEmailUtms(rawUrl, {
    campaign,
    content: utmContent,
  });
  const invite_headline =
    kind === 'pool'
      ? buildPoolInviteShareTitleFromInviter(handle, poolName)
      : buildSiteInviteShareTitle(handle);
  return { invite_kind: kind, invite_url, invite_headline };
}

module.exports = {
  DEFAULT_SITE_URL,
  normalizeInviteHandle,
  buildSiteInviteUrl,
  buildPoolInviteUrl,
  buildSiteInviteShareTitle,
  buildPoolInviteShareTitleFromInviter,
  appendInviteEmailUtms,
  resolveEmailInviteShare,
};
