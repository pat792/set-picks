/**
 * Sanitize SW → SPA navigation paths for push soft-nav (#773 Phase 3).
 *
 * @param {unknown} path
 * @returns {string | null} same-origin app path (`/…`) or null if unsafe
 */
export function sanitizePushNavigationPath(path) {
  if (typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  if (trimmed.includes('://')) return null;
  // Block backslash tricks / control chars.
  if (/[\u0000-\u001F\\]/.test(trimmed)) return null;
  return trimmed;
}

/**
 * @param {string} absoluteOrRelativeUrl
 * @param {string} [origin]
 * @returns {string | null}
 */
export function appPathFromPushTargetUrl(absoluteOrRelativeUrl, origin) {
  const base =
    typeof origin === 'string' && origin
      ? origin
      : typeof self !== 'undefined' && self.location?.origin
        ? self.location.origin
        : '';
  if (!base) return null;
  try {
    const url = new URL(absoluteOrRelativeUrl, base);
    if (url.origin !== base) return null;
    return sanitizePushNavigationPath(
      `${url.pathname}${url.search}${url.hash}`,
    );
  } catch {
    return null;
  }
}

export const PUSH_NAVIGATE_MESSAGE_TYPE = 'NAVIGATE';
