/**
 * Pure HTML helper — no src/ imports (safe for Vercel `api/invite` + build scripts).
 */

/**
 * Post-build SEO prerender injects crawler copy into `#root` on `dist/index.html`.
 * App hard loads must not flash that home-page body (#743 / invite landings).
 *
 * @param {string} spaHtml
 * @returns {string}
 */
export function stripPrerenderBodyFromSpaShell(spaHtml) {
  if (typeof spaHtml !== 'string' || !spaHtml) return spaHtml;
  return spaHtml.replace(
    /<div id="root">[\s\S]*?<\/div>/i,
    '<div id="root"></div>',
  );
}

/**
 * Dist-relative SPA shell for authenticated / app hard loads
 * (#743 empty root → #773 branded skeleton + DashboardRoute modulepreload).
 */
export const APP_BOOT_SHELL_REL_PATH = 'dashboard/index.html';

/**
 * Branded skeleton without a fat route modulepreload — for legal / public
 * profile / bare-join hard opens that must not download DashboardRoute.
 */
export const LIGHT_SPA_BOOT_SHELL_REL_PATH = 'spa-boot/index.html';

/**
 * Branded skeleton + thin login entry for `/login` (#835 / #881).
 * Built from `dist/login.html`; modulepreloads LoginPage UI + firebase-core (#860).
 */
export const LOGIN_BOOT_SHELL_REL_PATH = 'login/index.html';
