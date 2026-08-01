/**
 * Best-effort detection of email / social in-app browsers (#773 Phase 2b).
 * Used to prefer redirect Google auth and surface “Open in browser” copy.
 * Not perfect — especially some iOS Mail SFSafariViewController cases.
 */

/**
 * @param {string} [userAgent]
 * @returns {boolean}
 */
export function isLikelyInAppBrowser(userAgent) {
  const ua =
    typeof userAgent === 'string'
      ? userAgent
      : typeof navigator !== 'undefined'
        ? navigator.userAgent || ''
        : '';
  if (!ua) return false;

  // Android WebView and common in-app shells.
  if (/; wv\)/i.test(ua)) return true;
  if (
    /FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|Twitter|GSA\/|Snapchat|BytedanceWebview|musical_ly/i.test(
      ua,
    )
  ) {
    return true;
  }

  // iOS WKWebView often omits the Safari token that real Safari / CriOS include.
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS) {
    const isWebKit = /AppleWebKit/i.test(ua);
    const hasSafari = /Safari/i.test(ua);
    const isNamedBrowser = /CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
    if (isWebKit && !hasSafari && !isNamedBrowser) return true;
  }

  return false;
}

/**
 * Human-facing browser name hint for instructional copy.
 * @param {string} [userAgent]
 * @returns {'Safari' | 'Chrome' | 'your browser'}
 */
export function preferredExternalBrowserLabel(userAgent) {
  const ua =
    typeof userAgent === 'string'
      ? userAgent
      : typeof navigator !== 'undefined'
        ? navigator.userAgent || ''
        : '';
  if (/Android/i.test(ua)) return 'Chrome';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'Safari';
  return 'your browser';
}
