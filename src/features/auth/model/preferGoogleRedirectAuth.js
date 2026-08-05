import { isLikelyInAppBrowser } from '../../../shared/lib/inAppBrowser';

/**
 * Prefer `signInWithRedirect` on Safari / iOS / in-app browsers (#859 / Tier 1).
 *
 * Desktop Chromium + Firefox keep popup. Android Chrome keeps popup unless
 * it is an in-app WebView — do **not** treat all mobile Chrome as redirect
 * without a separate product call.
 *
 * @param {{
 *   userAgent?: string,
 *   maxTouchPoints?: number,
 * }} [opts]
 * @returns {boolean}
 */
export function shouldPreferGoogleRedirectAuth({
  userAgent,
  maxTouchPoints,
} = {}) {
  if (isLikelyInAppBrowser(userAgent)) return true;

  const ua =
    typeof userAgent === 'string'
      ? userAgent
      : typeof navigator !== 'undefined'
        ? navigator.userAgent || ''
        : '';
  if (!ua) return false;

  // Any iOS / iPadOS browser (all WebKit) — Private Safari popup is flaky.
  if (/iPhone|iPad|iPod/i.test(ua)) return true;

  const touchPoints =
    typeof maxTouchPoints === 'number'
      ? maxTouchPoints
      : typeof navigator !== 'undefined'
        ? navigator.maxTouchPoints || 0
        : 0;

  // iPadOS 13+ desktop-class UA.
  if (/Macintosh/i.test(ua) && touchPoints > 1) return true;

  // Desktop Safari (exclude Chromium / Firefox / Opera / Edge).
  const isSafari =
    /Safari/i.test(ua) &&
    !/Chrom(e|ium)|CriOS|Edg|OPR|FxiOS|Firefox/i.test(ua);
  if (isSafari) return true;

  return false;
}
