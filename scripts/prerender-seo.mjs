/**
 * Post-build: write crawler-visible HTML for public marketing routes (#659).
 * Also writes a branded SPA boot shell for dashboard / app hard loads (#743 / #773).
 * Run after `vite build`. Safe to re-run.
 *
 * #832: marketing routes prerender from `dist/index.html` (marketing entry).
 * #853: `/tour-stats*` also uses the marketing shell (+ PublicTourStatsPage preload).
 * Boot shells (`dashboard`, `spa-boot`, `login`) use `dist/app.html`.
 * #890: login shell again from app entry after #881 thin-entry hang (epic #889 Phase 2 replaces later).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APP_BOOT_SHELL_REL_PATH,
  LIGHT_SPA_BOOT_SHELL_REL_PATH,
  LOGIN_BOOT_SHELL_REL_PATH,
  PRERENDER_ROUTES,
  buildDashboardBootShellHtml,
  buildLoginBootShellHtml,
  injectDashboardBootModulepreloads,
  injectLoginBootModulepreloads,
  injectPrerenderHtml,
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
  console.error('prerender-seo: missing dist/app.html — run vite build first');
  process.exit(1);
}

const marketingShell = readFileSync(distIndex, 'utf8');
const appShell = readFileSync(distApp, 'utf8');

function isTourStatsPrerenderRoute(path) {
  return typeof path === 'string' && path.startsWith('/tour-stats');
}

for (const route of PRERENDER_ROUTES) {
  const shell = marketingShell;
  let html = injectPrerenderHtml(shell, route);
  // Marketing home statically imports splash UI via marketingMain — no lazy
  // HomeRoute waterfall, so no splash modulepreload injection (#832).
  // /tour-stats* preloads PublicTourStatsPage UI closure; firebase stays off
  // preload (#853 — fetch-time ensureFirebase after #835 login defer regression).
  if (isTourStatsPrerenderRoute(route.path)) {
    html = injectTourStatsBootModulepreloads(html, distDir);
  }
  const rel = prerenderOutputRelPath(route.path);
  const outPath = join(distDir, rel);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  console.log(`prerender-seo: wrote dist/${rel} (${Buffer.byteLength(html, 'utf8')} bytes)`);
}

// Branded boot shell for /dashboard/* + /setup (via vercel.json).
// Use the app document shell so boot loads AuthProvider, not marketingMain.
const brandedShell = buildDashboardBootShellHtml(appShell);
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

// `/login`: auth-card skeleton + LoginPage + firebase-core preload (#835 / #860).
// #890: shell from app.html again (not thin login.html).
const loginShell = buildLoginBootShellHtml(appShell);
const loginBootHtml = injectLoginBootModulepreloads(loginShell, distDir);
const loginBootPath = join(distDir, LOGIN_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(loginBootPath), { recursive: true });
writeFileSync(loginBootPath, loginBootHtml, 'utf8');
console.log(
  `prerender-seo: wrote dist/${LOGIN_BOOT_SHELL_REL_PATH} (login auth-card shell + LoginPage + firebase-core preload)`,
);

console.log(
  `prerender-seo: OK (${PRERENDER_ROUTES.length} routes + app boot + light spa + login boot)`,
);
