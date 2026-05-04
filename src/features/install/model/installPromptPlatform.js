const IOS_USER_AGENT_RE = /iPad|iPhone|iPod/;
const SAFARI_RE = /Safari/;
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

export function isIosSafariBrowser(nav = navigator) {
  if (!nav || typeof nav.userAgent !== 'string') return false;
  const userAgent = nav.userAgent;
  if (!IOS_USER_AGENT_RE.test(userAgent)) return false;
  return SAFARI_RE.test(userAgent) && !IOS_NON_SAFARI_RE.test(userAgent);
}
