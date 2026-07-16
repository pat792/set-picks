import { getPublicAppBaseUrl } from '../config/environment';

/**
 * Normalize a public handle for invite URLs / copy (trim; no `@`).
 * @param {unknown} handle
 * @returns {string}
 */
export function normalizeInviteHandle(handle) {
  return String(handle ?? '')
    .trim()
    .replace(/^@+/, '');
}

/**
 * Site VIP invite — never includes a pool code.
 * @param {string} handle
 * @returns {string}
 */
export function buildSiteInviteUrl(handle) {
  const h = normalizeInviteHandle(handle);
  const base = getPublicAppBaseUrl();
  if (!base || !h) return '';
  return `${base}/invite/${encodeURIComponent(h)}`;
}

/**
 * Pool invite URL. Optional `from` personalizes landings / OG without changing the code.
 * @param {string} inviteCode
 * @param {string} [fromHandle]
 * @returns {string}
 */
export function buildPoolInviteUrl(inviteCode, fromHandle) {
  const code = String(inviteCode ?? '')
    .trim()
    .toUpperCase();
  const base = getPublicAppBaseUrl();
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
export function buildSiteInviteShareTitle(handle) {
  const h = normalizeInviteHandle(handle);
  if (!h) return "You're invited to Setlist Pick'em";
  return `${h} invited you to Setlist Pick'em`;
}

/**
 * Personalized pool invite headline (for share / OG).
 * @param {string} handle
 * @param {string | null | undefined} [poolName]
 * @returns {string}
 */
export function buildPoolInviteShareTitleFromInviter(handle, poolName) {
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
