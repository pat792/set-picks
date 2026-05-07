const IOS_USER_AGENT_RE = /iPad|iPhone|iPod/;
const SAFARI_RE = /Safari/;
/** iOS browsers that use WebKit but are not system Safari (Chrome, Firefox, Edge, etc.). */
const IOS_NON_SAFARI_RE = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/;

export function isStandaloneDisplayMode(win = window) {
  if (!win || typeof win.matchMedia !== 'function') return false;
  return win.matchMedia('(display-mode: standalone)').matches;
}

export function isStandaloneNavigator(nav = navigator) {
  return Boolean(nav && nav.standalone === true);
}

export function isInstalled(win = window, nav = navigator) {
  return isStandaloneDisplayMode(win) || isStandaloneNavigator(nav);
}

export function isIosDevice(nav = navigator) {
  if (!nav || typeof nav.userAgent !== 'string') return false;
  return IOS_USER_AGENT_RE.test(nav.userAgent);
}

/**
 * iPhone/iPad in Chrome, Firefox, Edge, etc. Install + reliable push require
 * opening the site in **Safari** (#334).
 */
export function isIosNonSafariBrowser(nav = navigator) {
  if (!isIosDevice(nav)) return false;
  return IOS_NON_SAFARI_RE.test(nav.userAgent);
}

export function isIosSafariBrowser(nav = navigator) {
  if (!nav || typeof nav.userAgent !== 'string') return false;
  const userAgent = nav.userAgent;
  if (!IOS_USER_AGENT_RE.test(userAgent)) return false;
  return SAFARI_RE.test(userAgent) && !IOS_NON_SAFARI_RE.test(userAgent);
}
