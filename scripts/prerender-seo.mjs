/**
 * Post-build: write crawler-visible HTML for public marketing routes (#659).
 * Also writes a branded SPA boot shell for dashboard / app hard loads (#743 / #773).
 * Dual entry (#832): marketing shells from `dist/index.html`; app shells from `dist/app.html`.
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
  injectTourStatsBootModulepreloads,
  prerenderOutputRelPath,
} from './seo-prerender-lib.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const distDir = join(root, 'dist');
const distIndex = join(distDir, 'index.html');
const distApp = join(distDir, 'app.html');

if (!existsSync(distIndex)) {
  console.error('prerender-seo: missing dist/index.html — run vite build first');
  process.exit(1);
}
if (!existsSync(distApp)) {
  console.error('prerender-seo: missing dist/app.html — dual-entry vite build required (#832)');
  process.exit(1);
}

const marketingShell = readFileSync(distIndex, 'utf8');
const appShell = readFileSync(distApp, 'utf8');

for (const route of PRERENDER_ROUTES) {
  let html = injectPrerenderHtml(marketingShell, route);
  // Splash only: preload MarketingLandingPage + its (Firebase-free) closure.
  if (route.path === '/') {
    html = injectSplashBootModulepreloads(html, distDir);
  }
  if (route.path === '/tour-stats' || route.path.startsWith('/tour-stats/')) {
    html = injectTourStatsBootModulepreloads(html, distDir);
  }
  const rel = prerenderOutputRelPath(route.path);
  const outPath = join(distDir, rel);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  console.log(`prerender-seo: wrote dist/${rel} (${Buffer.byteLength(html, 'utf8')} bytes)`);
}

// Branded boot shell for /dashboard/* + /setup (via vercel.json) — app entry.
const brandedShell = buildDashboardBootShellHtml(appShell);
const appBootHtml = injectDashboardBootModulepreloads(brandedShell, distDir);
const appBootPath = join(distDir, APP_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(appBootPath), { recursive: true });
writeFileSync(appBootPath, appBootHtml, 'utf8');
console.log(
  `prerender-seo: wrote dist/${APP_BOOT_SHELL_REL_PATH} (branded #root boot shell + modulepreload)`,
);

// Light spa boot: app entry, no DashboardRoute preload — /login, invite shells, etc.
const lightBootPath = join(distDir, LIGHT_SPA_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(lightBootPath), { recursive: true });
writeFileSync(lightBootPath, brandedShell, 'utf8');
console.log(
  `prerender-seo: wrote dist/${LIGHT_SPA_BOOT_SHELL_REL_PATH} (branded shell, no route modulepreload)`,
);

console.log(
  `prerender-seo: OK (${PRERENDER_ROUTES.length} routes + app boot shell + light spa boot)`,
);
