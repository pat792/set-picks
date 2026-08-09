/**
 * Pure HTML helper — no src/ imports (safe for Vercel `api/invite` + build scripts).
 */

/**
 * Empty `#root` even when it contains nested `<div>` trees (HTML-first login shell).
 * The naive non-greedy `[\s\S]*?<\/div>` stops at the first closer and corrupts markup.
 *
 * @param {string} spaHtml
 * @returns {string}
 */
export function stripPrerenderBodyFromSpaShell(spaHtml) {
  if (typeof spaHtml !== 'string' || !spaHtml) return spaHtml;
  const openMatch = spaHtml.match(/<div id="root"[^>]*>/i);
  if (!openMatch || openMatch.index == null) return spaHtml;
  const start = openMatch.index;
  const contentStart = start + openMatch[0].length;
  const lower = spaHtml.toLowerCase();
  let depth = 1;
  let i = contentStart;
  while (i < spaHtml.length && depth > 0) {
    const nextOpen = lower.indexOf('<div', i);
    const nextClose = lower.indexOf('</div>', i);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return (
        spaHtml.slice(0, start) +
        '<div id="root"></div>' +
        spaHtml.slice(nextClose + '</div>'.length)
      );
    }
    i = nextClose + '</div>'.length;
  }
  return spaHtml;
}

/**
 * Dist-relative SPA shell for authenticated / app hard loads
 * (#743 empty root → #773 branded skeleton + DashboardRoute modulepreload).
 */
export const APP_BOOT_SHELL_REL_PATH = 'dashboard/index.html';

/**
 * Branded skeleton without a fat route modulepreload — for public profile /
 * bare-join / password-reset hard opens that must not download DashboardRoute.
 * Legal (`/privacy`, `/terms`) ships as zero-JS HTML-first door shells (#916).
 */
export const LIGHT_SPA_BOOT_SHELL_REL_PATH = 'spa-boot/index.html';

/**
 * HTML-first auth door for `/login` (#892 / epic #889 Phase 2).
 * Built from `dist/login.html` (auth-only Vite entry) + form chrome in `#root`.
 */
export const LOGIN_BOOT_SHELL_REL_PATH = 'login/index.html';
