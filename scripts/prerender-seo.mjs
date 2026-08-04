/**
 * Post-build: write HTML-first public marketing documents (#659 / #829).
 * Also writes branded SPA boot shells for dashboard / app hard loads (#743 / #773).
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
  // #829: marketing HTML is a real document — no HomeRoute modulepreload / SPA entry.
  const html = injectPrerenderHtml(shell, route);
  const rel = prerenderOutputRelPath(route.path);
  const outPath = join(distDir, rel);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  console.log(`prerender-seo: wrote dist/${rel} (${Buffer.byteLength(html, 'utf8')} bytes, HTML-first)`);
}

// Branded boot shell for /dashboard/* + /setup (via vercel.json).
const brandedShell = buildDashboardBootShellHtml(shell);
const appBootHtml = injectDashboardBootModulepreloads(brandedShell, distDir);
const appBootPath = join(distDir, APP_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(appBootPath), { recursive: true });
writeFileSync(appBootPath, appBootHtml, 'utf8');
console.log(
  `prerender-seo: wrote dist/${APP_BOOT_SHELL_REL_PATH} (branded #root boot shell + modulepreload)`,
);

// Light spa boot for /login, legal, public profile, bare /join, etc.
const lightBootPath = join(distDir, LIGHT_SPA_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(lightBootPath), { recursive: true });
writeFileSync(lightBootPath, brandedShell, 'utf8');
console.log(
  `prerender-seo: wrote dist/${LIGHT_SPA_BOOT_SHELL_REL_PATH} (branded shell, no route modulepreload)`,
);

console.log(
  `prerender-seo: OK (${PRERENDER_ROUTES.length} HTML-first routes + app boot shell + light spa boot)`,
);
