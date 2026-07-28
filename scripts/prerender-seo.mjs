/**
 * Post-build: write crawler-visible HTML for public marketing routes (#659).
 * Also writes an empty-root SPA shell for dashboard / app hard loads (#743).
 * Run after `vite build`. Safe to re-run.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APP_BOOT_SHELL_REL_PATH,
  PRERENDER_ROUTES,
  injectPrerenderHtml,
  prerenderOutputRelPath,
  stripPrerenderBodyFromSpaShell,
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
  const html = injectPrerenderHtml(shell, route);
  const rel = prerenderOutputRelPath(route.path);
  const outPath = join(distDir, rel);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  console.log(`prerender-seo: wrote dist/${rel} (${Buffer.byteLength(html, 'utf8')} bytes)`);
}

// Empty-root boot shell for /dashboard/* (and other app paths via vercel.json).
// Use the pre-prerender Vite shell so we never copy home SEO body into it.
const appBootHtml = stripPrerenderBodyFromSpaShell(shell);
const appBootPath = join(distDir, APP_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(appBootPath), { recursive: true });
writeFileSync(appBootPath, appBootHtml, 'utf8');
console.log(
  `prerender-seo: wrote dist/${APP_BOOT_SHELL_REL_PATH} (empty #root boot shell)`,
);

console.log(`prerender-seo: OK (${PRERENDER_ROUTES.length} routes + app boot shell)`);
