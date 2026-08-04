/**
 * Post-build: write crawler-visible HTML for public marketing routes (#659).
 * Also writes a branded SPA boot shell for dashboard / app hard loads (#743 / #773).
 * Run after `vite build`. Safe to re-run.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APP_BOOT_SHELL_REL_PATH,
  LIGHT_SPA_BOOT_SHELL_REL_PATH,
  PRERENDER_ROUTES,
  buildDashboardBootShellHtml,
  injectDashboardBootModulepreloads,
  injectPrerenderHtml,
  injectSplashBootModulepreloads,
  prerenderOutputRelPath,
} from './seo-prerender-lib.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const distDir = join(root, 'dist');
const distIndex = join(distDir, 'index.html');

if (!existsSync(distIndex)) {
  console.error('prerender-seo: missing dist/index.html — run vite build first');
  process.exit(1);
}

const shell = readFileSync(distIndex, 'utf8');

for (const route of PRERENDER_ROUTES) {
  let html = injectPrerenderHtml(shell, route);
  // Splash only: `HomeRoute` is lazy since #731, so preload its chunk here or
  // the landing paint waits a round trip on the entry bundle.
  if (route.path === '/') {
    html = injectSplashBootModulepreloads(html, distDir);
  }
  const rel = prerenderOutputRelPath(route.path);
  const outPath = join(distDir, rel);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  console.log(`prerender-seo: wrote dist/${rel} (${Buffer.byteLength(html, 'utf8')} bytes)`);
}

// Branded boot shell for /dashboard/* + /setup (via vercel.json).
// Use the pre-prerender Vite shell so we never copy home SEO body into it.
// Phase 2: modulepreload DashboardRoute on this shell only (not splash / light spa).
const brandedShell = buildDashboardBootShellHtml(shell);
const appBootHtml = injectDashboardBootModulepreloads(brandedShell, distDir);
const appBootPath = join(distDir, APP_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(appBootPath), { recursive: true });
writeFileSync(appBootPath, appBootHtml, 'utf8');
console.log(
  `prerender-seo: wrote dist/${APP_BOOT_SHELL_REL_PATH} (branded #root boot shell + modulepreload)`,
);

// Light spa boot: same branded skeleton, no DashboardRoute preload — legal,
// public profile, bare /join, etc. must not contend for the dashboard graph.
const lightBootPath = join(distDir, LIGHT_SPA_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(lightBootPath), { recursive: true });
writeFileSync(lightBootPath, brandedShell, 'utf8');
console.log(
  `prerender-seo: wrote dist/${LIGHT_SPA_BOOT_SHELL_REL_PATH} (branded shell, no route modulepreload)`,
);

console.log(
  `prerender-seo: OK (${PRERENDER_ROUTES.length} routes + app boot shell + light spa boot)`,
);
