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

/** Dist-relative empty-root SPA shell for authenticated / app hard loads (#743). */
export const APP_BOOT_SHELL_REL_PATH = 'dashboard/index.html';
