/**
 * Platform-specific A2HS lead copy + Safari steps (#539).
 * Shared by DashboardInstallEngageBanner and InstallAppCard.
 */

/** @typedef {'android_chrome' | 'desktop_chromium' | 'ios_safari' | 'ios_non_safari' | 'unsupported'} InstallCopyBranch */

/**
 * @param {PickNavigator} [nav]
 * @returns {boolean}
 */
export function isAndroidLike(nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  if (!nav || typeof nav.userAgent !== 'string') return false;
  return /Android/i.test(nav.userAgent);
}

/**
 * Telemetry + copy branch for install CTAs (#539).
 *
 * @param {{
 *   canPrompt?: boolean,
 *   shouldShowIosFlow?: boolean,
 *   shouldShowIosNonSafariFlow?: boolean,
 *   nav?: PickNavigator,
 * }} opts
 * @returns {InstallCopyBranch}
 */
export function resolveInstallCopyBranch({
  canPrompt = false,
  shouldShowIosFlow = false,
  shouldShowIosNonSafariFlow = false,
  nav = typeof navigator !== 'undefined' ? navigator : undefined,
} = {}) {
  if (shouldShowIosNonSafariFlow) return 'ios_non_safari';
  if (shouldShowIosFlow) return 'ios_safari';
  if (canPrompt) {
    return isAndroidLike(nav) ? 'android_chrome' : 'desktop_chromium';
  }
  return 'unsupported';
}

/**
 * @param {InstallCopyBranch} branch
 * @returns {{ eyebrow: string, body: string, ctaLabel: string | null }}
 */
export function getInstallLeadCopy(branch) {
  switch (branch) {
    case 'android_chrome':
      return {
        eyebrow: 'One-tap install',
        body: 'Tap below, then confirm Install in Chrome for quick access on show night.',
        ctaLabel: 'Add to Home Screen',
      };
    case 'desktop_chromium':
      return {
        eyebrow: 'Install this site',
        body: "Add Setlist Pick 'Em as an app shortcut for a faster full-screen dashboard.",
        ctaLabel: 'Install app',
      };
    case 'ios_safari':
      return {
        eyebrow: 'iPhone · Safari',
        body: "Use Safari's Share sheet to Add to Home Screen — best path for full-screen + show-night push.",
        ctaLabel: null,
      };
    case 'ios_non_safari':
      return {
        eyebrow: 'iPhone · Add to Home Screen',
        body: "Chrome can Add to Home Screen too — use Share → Add to Home Screen (same as Safari). Open from the home icon for show-night push.",
        ctaLabel: null,
      };
    default:
      return {
        eyebrow: 'Install app',
        body: "Install is not available in this browser yet. On iPhone, use Share → Add to Home Screen in Safari or Chrome.",
        ctaLabel: null,
      };
  }
}

/** Ordered Safari A2HS steps — Share toolbar (#539). */
export const IOS_SAFARI_INSTALL_STEPS = Object.freeze([
  {
    id: 'share',
    prefix: '1. ',
    parts: [
      { text: 'Tap the ', bold: false },
      { text: 'Share', bold: true },
      { text: ' button in Safari’s toolbar (square with an arrow).', bold: false },
    ],
  },
  {
    id: 'a2hs',
    prefix: '2. ',
    parts: [
      { text: 'Scroll and tap ', bold: false },
      { text: 'Add to Home Screen', bold: true },
      { text: '.', bold: false },
    ],
  },
  {
    id: 'add',
    prefix: '3. ',
    parts: [
      { text: 'Tap ', bold: false },
      { text: 'Add', bold: true },
      { text: ' (or the ', bold: false },
      { text: '+', bold: true },
      { text: ') to confirm.', bold: false },
    ],
  },
]);

/**
 * Chrome / Edge / Firefox on iOS — A2HS via Share (iOS 17+), not “open Safari” (#539 follow-up).
 * Share may live in the toolbar or under More (···).
 */
export const IOS_CHROME_INSTALL_STEPS = Object.freeze([
  {
    id: 'share',
    prefix: '1. ',
    parts: [
      { text: 'Tap ', bold: false },
      { text: 'Share', bold: true },
      { text: ' (square with arrow) — in the toolbar, or ', bold: false },
      { text: '···', bold: true },
      { text: ' → Share.', bold: false },
    ],
  },
  {
    id: 'a2hs',
    prefix: '2. ',
    parts: [
      { text: 'Scroll and tap ', bold: false },
      { text: 'Add to Home Screen', bold: true },
      { text: '.', bold: false },
    ],
  },
  {
    id: 'add',
    prefix: '3. ',
    parts: [
      { text: 'Tap ', bold: false },
      { text: 'Add', bold: true },
      { text: ' to confirm.', bold: false },
    ],
  },
]);

/**
 * @typedef {{ userAgent?: string }} PickNavigator
 */
