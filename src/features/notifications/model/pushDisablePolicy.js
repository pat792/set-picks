/**
 * PWA-first push disable policy (#532).
 *
 * Product decision (Sprint 7): in-app **Disable** is only available when the
 * app is installed (standalone / navigator.standalone). Desktop Chrome tabs
 * follow the same rule — revoke via system Settings or install first.
 */

/**
 * @param {{ isInstalled?: boolean }} opts
 * @returns {boolean}
 */
export function canShowPushDisable({ isInstalled = false } = {}) {
  return Boolean(isInstalled);
}

/**
 * Copy shown when Disable is hidden (browser tab / non-PWA).
 *
 * @param {{ isInstalled?: boolean, permission?: string }} opts
 * @returns {string | null}
 */
export function pushDisableUnavailableCopy({
  isInstalled = false,
  permission = 'default',
} = {}) {
  if (isInstalled) return null;
  if (permission === 'granted') {
    return 'Push is managed by this browser. Add Setlist Pick \'Em to your home screen to turn it off in-app, or revoke in system Settings.';
  }
  return 'Add Setlist Pick \'Em to your home screen for reliable show-night push — then Enable here. Disable is available in the installed app.';
}
