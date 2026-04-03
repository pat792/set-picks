import { getPublicAppBaseUrl } from '../config/environment';

/**
 * Absolute invite URL for sharing (uses current origin or VITE_PUBLIC_APP_URL).
 * @param {string} inviteCode — 5-character pool invite code
 */
export function createPoolInviteLink(inviteCode) {
  const normalized = inviteCode?.trim().toUpperCase() ?? '';
  const base = getPublicAppBaseUrl();
  if (!base || !normalized) return '';
  return `${base}/join/${encodeURIComponent(normalized)}`;
}
