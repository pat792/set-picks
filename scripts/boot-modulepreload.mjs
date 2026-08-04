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

/** Chunk filename prefixes to modulepreload on prerendered `dist/index.html` (#832). */
export const SPLASH_BOOT_MODULEPRELOAD_PREFIXES = ['MarketingLandingPage-'];

/** Public tour-stats route chunk for prerendered `/tour-stats*` shells (#827 / #832). */
export const TOUR_STATS_BOOT_MODULEPRELOAD_PREFIXES = ['PublicTourStatsPage-'];
export const TOUR_STATS_BOOT_PRELOAD_MARKER = 'data-tour-stats-boot-preload';

/** Attribute markers asserted by `verify:seo-prerender`. */
export const DASHBOARD_BOOT_PRELOAD_MARKER = 'data-dashboard-boot-preload';
export const SPLASH_BOOT_PRELOAD_MARKER = 'data-splash-boot-preload';

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
 * @param {{ prefixes: string[], marker: string }} options
 * @returns {string}
 */
export function injectBootModulepreloads(html, distDir, { prefixes, marker }) {
  if (typeof html !== 'string' || !html) return html;
  const assetsDir = join(distDir, 'assets');
  const entryHrefs = resolveBootModulepreloadHrefs(assetsDir, prefixes);
  if (!entryHrefs.length) return html;

  const hrefs = resolveModulepreloadClosure(assetsDir, entryHrefs);
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
 * Tour-stats route chunk for prerendered `/tour-stats*` marketing shells.
 *
 * @param {string} html
 * @param {string} distDir
 * @returns {string}
 */
export function injectTourStatsBootModulepreloads(html, distDir) {
  return injectBootModulepreloads(html, distDir, {
    prefixes: TOUR_STATS_BOOT_MODULEPRELOAD_PREFIXES,
    marker: TOUR_STATS_BOOT_PRELOAD_MARKER,
  });
}
