/**
 * Post-build `<link rel="modulepreload">` injection for boot-critical route
 * chunks (#773 dashboard, #731 splash).
 *
 * Every top-level route is `lazy()` in `src/app/App.jsx`, so the chunk a given
 * entry HTML is certain to need would otherwise start downloading only after
 * the entry bundle parses. Each shell preloads its own route **and that route's
 * static import closure** — preloading only the leaf `HomeRoute-*.js` (~2KB)
 * left a waterfall on `auth-*.js` + `shared-*.js` (~360KB) before Landing could
 * paint. Splash must not pull the dashboard graph, and the app boot shell must
 * not pull Landing.
 *
 * Pure Node — no `src/` imports, safe for build scripts.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Chunk filename prefixes to modulepreload on the dashboard boot shell (#773). */
export const DASHBOARD_BOOT_MODULEPRELOAD_PREFIXES = ['DashboardRoute-'];

/** Chunk filename prefixes to modulepreload on prerendered `dist/index.html` (#731). */
export const SPLASH_BOOT_MODULEPRELOAD_PREFIXES = ['HomeRoute-'];

/** Chunk filename prefixes for prerendered public `/tour-stats*` (#827). */
export const TOUR_STATS_BOOT_MODULEPRELOAD_PREFIXES = ['PublicTourStatsPage-'];

/** Chunk filename prefixes for `/login` boot shell (#835) — UI only. */
export const LOGIN_BOOT_MODULEPRELOAD_PREFIXES = ['LoginPage-'];

/** Attribute markers asserted by `verify:seo-prerender`. */
export const DASHBOARD_BOOT_PRELOAD_MARKER = 'data-dashboard-boot-preload';
export const SPLASH_BOOT_PRELOAD_MARKER = 'data-splash-boot-preload';
export const TOUR_STATS_BOOT_PRELOAD_MARKER = 'data-tour-stats-boot-preload';
export const LOGIN_BOOT_PRELOAD_MARKER = 'data-login-boot-preload';

/**
 * Login shell may modulepreload `firebase-core` only (#860 / Tier 2).
 * Block camelCase `firebaseAppCheck-*`, `firebase-appcheck-*`, storage, etc.
 * Marketing `index.html` remains fully stripped of firebase assets.
 *
 * @param {string} href
 * @returns {boolean}
 */
function isAllowedLoginBootPreloadHref(href) {
  if (typeof href !== 'string' || !href) return false;
  if (/\/assets\/firebase-core-[^/]+\.js$/.test(href)) return true;
  if (/\/assets\/firebase/i.test(href)) return false;
  return true;
}

/**
 * Resolve hashed asset filenames under `dist/assets` for the given prefixes.
 *
 * @param {string} assetsDir
 * @param {string[]} prefixes
 * @returns {string[]} absolute hrefs like `/assets/DashboardRoute-….js`
 */
export function resolveBootModulepreloadHrefs(assetsDir, prefixes) {
  let names = [];
  try {
    names = readdirSync(assetsDir);
  } catch {
    return [];
  }
  const hrefs = [];
  for (const prefix of prefixes) {
    const match = names.find(
      (name) => name.startsWith(prefix) && name.endsWith('.js'),
    );
    if (match) hrefs.push(`/assets/${match}`);
  }
  return hrefs;
}

/**
 * Walk static `from "./chunk.js"` edges from entry hrefs so modulepreload
 * covers the full paint-critical graph (not just the lazy leaf).
 *
 * @param {string} assetsDir
 * @param {string[]} entryHrefs `/assets/….js`
 * @returns {string[]}
 */
export function resolveModulepreloadClosure(assetsDir, entryHrefs) {
  const seen = new Set();
  const ordered = [];
  const queue = [...entryHrefs];

  while (queue.length) {
    const href = queue.shift();
    if (typeof href !== 'string' || !href || seen.has(href)) continue;
    seen.add(href);
    ordered.push(href);

    const fileName = href.replace(/^\/assets\//, '');
    if (!fileName || fileName.includes('..') || fileName.includes('/')) continue;
    const filePath = join(assetsDir, fileName);
    if (!existsSync(filePath)) continue;

    let src = '';
    try {
      src = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    for (const match of src.matchAll(/from\s*["']\.\/([^"']+\.js)["']/g)) {
      const dep = match[1];
      if (!dep || dep.includes('..') || dep.includes('/')) continue;
      queue.push(`/assets/${dep}`);
    }
  }

  return ordered;
}

/**
 * Append `<link rel="modulepreload">` tags into `<head>`.
 * Idempotent; skips hrefs already present.
 *
 * @param {string} html
 * @param {string} distDir absolute path to `dist/`
 * @param {{ prefixes: string[], marker: string, hrefFilter?: (href: string) => boolean }} options
 * @returns {string}
 */
export function injectBootModulepreloads(
  html,
  distDir,
  { prefixes, marker, hrefFilter },
) {
  if (typeof html !== 'string' || !html) return html;
  const assetsDir = join(distDir, 'assets');
  const entryHrefs = resolveBootModulepreloadHrefs(assetsDir, prefixes);
  if (!entryHrefs.length) return html;

  const hrefs = resolveModulepreloadClosure(assetsDir, entryHrefs).filter(
    (href) => (typeof hrefFilter === 'function' ? hrefFilter(href) : true),
  );
  if (!hrefs.length) return html;

  const tags = hrefs
    // Skip assets already present as modulepreload *or* as the entry
    // `<script type="module" src>` (DashboardRoute can circularly import the
    // entry chunk; re-preloading it is noise).
    .filter(
      (href) =>
        !html.includes(`href="${href}"`) && !html.includes(`src="${href}"`),
    )
    .map(
      (href) =>
        `  <link rel="modulepreload" crossorigin href="${href}" ${marker}="true" />`,
    );
  if (!tags.length) return html;
  if (!/<\/head>/i.test(html)) return html;
  return html.replace(/<\/head>/i, `${tags.join('\n')}\n</head>`);
}

/**
 * Dashboard-critical chunks for the app boot shell. Does not touch splash.
 *
 * @param {string} html
 * @param {string} distDir
 * @returns {string}
 */
export function injectDashboardBootModulepreloads(html, distDir) {
  return injectBootModulepreloads(html, distDir, {
    prefixes: DASHBOARD_BOOT_MODULEPRELOAD_PREFIXES,
    marker: DASHBOARD_BOOT_PRELOAD_MARKER,
  });
}

/**
 * Splash-critical chunks for prerendered `dist/index.html` only.
 *
 * @param {string} html
 * @param {string} distDir
 * @returns {string}
 */
export function injectSplashBootModulepreloads(html, distDir) {
  return injectBootModulepreloads(html, distDir, {
    prefixes: SPLASH_BOOT_MODULEPRELOAD_PREFIXES,
    marker: SPLASH_BOOT_PRELOAD_MARKER,
  });
}

/**
 * Public tour-stats route chunk + static closure for prerendered
 * `dist/tour-stats/**` shells (#827 / #853). Keeps DashboardRoute / firebase out.
 *
 * @param {string} html
 * @param {string} distDir
 * @returns {string}
 */
export function injectTourStatsBootModulepreloads(html, distDir) {
  // Strip any firebase* tags inherited from the shell or a stale closure so
  // hard-open `/tour-stats` paints UI before Auth/App Check download (#853).
  const base = stripFirebaseModulepreloads(html);
  return injectBootModulepreloads(base, distDir, {
    prefixes: TOUR_STATS_BOOT_MODULEPRELOAD_PREFIXES,
    marker: TOUR_STATS_BOOT_PRELOAD_MARKER,
    hrefFilter: (href) => !/\/assets\/firebase/.test(href),
  });
}

/**
 * Drop any Vite-inherited firebase* modulepreloads from a shell (login must
 * not warm Auth/App Check before the form paints — #835).
 *
 * @param {string} html
 * @returns {string}
 */
export function stripFirebaseModulepreloads(html) {
  if (typeof html !== 'string' || !html) return html;
  return html.replace(
    /\s*<link[^>]*rel="modulepreload"[^>]*href="\/assets\/firebase[^"]*"[^>]*\/?>/gi,
    '',
  );
}

/**
 * Login form UI + firebase-core for `dist/login/index.html` (#835 / #860).
 * Strips Vite-inherited firebase modulepreloads, then re-injects the LoginPage
 * UI closure plus an explicit `firebase-core` href (Auth is dynamic-import, so
 * it is not in the static LoginPage closure). App Check / Storage stay out.
 *
 * @param {string} html
 * @param {string} distDir
 * @returns {string}
 */
export function injectLoginBootModulepreloads(html, distDir) {
  if (typeof html !== 'string' || !html) return html;
  // Strip all firebase-* first so we don't keep app-check/storage; re-add core.
  let next = stripFirebaseModulepreloads(html);
  const assetsDir = join(distDir, 'assets');
  const entryHrefs = resolveBootModulepreloadHrefs(
    assetsDir,
    LOGIN_BOOT_MODULEPRELOAD_PREFIXES,
  );
  if (!entryHrefs.length) return next;

  const uiHrefs = resolveModulepreloadClosure(assetsDir, entryHrefs).filter(
    isAllowedLoginBootPreloadHref,
  );
  // Auth boots via dynamic `import('./firebase.js')` — not in LoginPage closure.
  const firebaseCoreHrefs = resolveBootModulepreloadHrefs(assetsDir, [
    'firebase-core-',
  ]);
  const hrefs = [...new Set([...uiHrefs, ...firebaseCoreHrefs])].filter(
    isAllowedLoginBootPreloadHref,
  );
  if (!hrefs.length) return next;

  const marker = LOGIN_BOOT_PRELOAD_MARKER;
  const tags = hrefs
    .filter(
      (href) =>
        !next.includes(`href="${href}"`) && !next.includes(`src="${href}"`),
    )
    .map(
      (href) =>
        `  <link rel="modulepreload" crossorigin href="${href}" ${marker}="true" />`,
    );
  if (!tags.length) return next;
  if (!/<\/head>/i.test(next)) return next;
  return next.replace(/<\/head>/i, `${tags.join('\n')}\n</head>`);
}
