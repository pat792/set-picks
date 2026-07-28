/**
 * Resolve same-origin in-app paths for soft navigation (#743).
 * External / protocol-relative / empty hrefs return null (keep normal <a>).
 *
 * @param {string | undefined} href
 * @param {string} [origin] defaults to window.location.origin when available
 * @returns {string | null} pathname + search + hash, or null
 */
export function sameOriginAppPath(href, origin) {
  if (typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed === '#') return null;

  const resolvedOrigin =
    origin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '');

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const base = resolvedOrigin || 'https://www.setlistpickem.com';
    const url = new URL(trimmed, base);
    if (resolvedOrigin && url.origin !== resolvedOrigin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
