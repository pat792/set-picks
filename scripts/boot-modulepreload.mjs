/**
 * Post-build `<link rel="modulepreload">` injection for boot-critical route
 * chunks (#773 dashboard, #731 splash).
 *
 * Every top-level route is `lazy()` in `src/app/App.jsx`, so the chunk a given
 * entry HTML is certain to need would otherwise start downloading only after
 * the entry bundle parses. Each shell preloads its own route and nothing else —
 * splash must not pull the dashboard graph, and the app boot shell must not
 * pull Landing.
 *
 * Pure Node — no `src/` imports, safe for build scripts.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Chunk filename prefixes to modulepreload on the dashboard boot shell (#773). */
export const DASHBOARD_BOOT_MODULEPRELOAD_PREFIXES = ['DashboardRoute-'];

/** Chunk filename prefixes to modulepreload on prerendered `dist/index.html` (#731). */
export const SPLASH_BOOT_MODULEPRELOAD_PREFIXES = ['HomeRoute-'];

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
  const hrefs = resolveBootModulepreloadHrefs(join(distDir, 'assets'), prefixes);
  if (!hrefs.length) return html;

  const tags = hrefs
    .filter((href) => !html.includes(`href="${href}"`))
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
