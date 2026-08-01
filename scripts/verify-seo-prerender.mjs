/**
 * CI guard: prerendered public marketing HTML has unique title/description,
 * crawler body, JSON-LD, and favicon links (#659).
 *
 * Does not require a Vite build — uses a fixture shell. Optionally re-checks
 * `dist/` when present (after `npm run build`).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APP_BOOT_SHELL_REL_PATH,
  DASHBOARD_BOOT_SHELL_MARKER,
  PRERENDER_ROUTES,
  buildDashboardBootShellHtml,
  buildFixtureShellHtml,
  injectPrerenderHtml,
  prerenderOutputRelPath,
} from './seo-prerender-lib.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`verify:seo-prerender: ${message}`);
    process.exit(1);
  }
}

function assertRouteHtml(html, route, label) {
  assert(html.includes(`<title>${route.title}</title>`) || html.includes(route.title), `${label}: missing title`);
  assert(html.includes(route.description), `${label}: missing description`);
  assert(html.includes(route.h1), `${label}: missing H1`);
  assert(html.includes('application/ld+json'), `${label}: missing JSON-LD`);
  assert(html.includes('data-seo-prerender="true"'), `${label}: missing prerender markers`);
  assert(html.includes('rel="icon"'), `${label}: missing favicon link`);
  assert(html.includes('/favicon/favicon.ico'), `${label}: missing favicon.ico link`);
  assert(html.includes(route.canonicalUrl), `${label}: missing canonical`);
  for (const p of route.paragraphs) {
    assert(html.includes(p.slice(0, Math.min(40, p.length))), `${label}: missing body excerpt`);
  }
}

assert(PRERENDER_ROUTES.length >= 6, 'expected marketing + tour-stats + keyword-intent routes');
assert(
  PRERENDER_ROUTES.some((r) => r.path === '/tour-stats'),
  'expected /tour-stats prerender entry',
);
assert(
  PRERENDER_ROUTES.some((r) => r.path === '/tour-stats/2026-sphere'),
  'expected Sphere tour-stats prerender entry',
);
assert(
  PRERENDER_ROUTES.some((r) => r.path === '/phish-setlist-prediction-game'),
  'expected keyword-intent prerender entry',
);
assert(
  PRERENDER_ROUTES.every((r) => !r.path.startsWith('/dashboard')),
  'must not prerender /dashboard/*',
);

const titles = new Set(PRERENDER_ROUTES.map((r) => r.title));
assert(titles.size === PRERENDER_ROUTES.length, 'each prerender route needs a unique title');

const shell = buildFixtureShellHtml();
for (const route of PRERENDER_ROUTES) {
  const html = injectPrerenderHtml(shell, route);
  assertRouteHtml(html, route, `fixture ${route.path}`);
}

// Fixture: branded dashboard boot shell (#773) — no SEO body, marker present.
const dirtyShell =
  '<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>' +
  '<div id="root"><main data-seo-prerender="true"><h1>leak</h1></main></div>' +
  '</body></html>';
const fixtureBoot = buildDashboardBootShellHtml(dirtyShell);
assert(
  fixtureBoot.includes(`${DASHBOARD_BOOT_SHELL_MARKER}="true"`),
  'boot shell fixture must include dashboard boot marker',
);
assert(
  fixtureBoot.includes('/branding/splash-vinyl-mark.webp'),
  'boot shell fixture must include vinyl brand mark',
);
assert(
  !fixtureBoot.includes('data-seo-prerender'),
  'boot shell fixture must not include SEO prerender body',
);
assert(!fixtureBoot.includes('<h1>leak</h1>'), 'boot shell must strip prior #root body');

const distIndex = join(root, 'dist', 'index.html');
const distHowItWorks = join(root, 'dist', 'how-it-works', 'index.html');
// Only validate dist when post-build prerender has clearly run (subdir artifact).
if (existsSync(distIndex) && existsSync(distHowItWorks)) {
  for (const route of PRERENDER_ROUTES) {
    const outPath = join(root, 'dist', prerenderOutputRelPath(route.path));
    assert(existsSync(outPath), `dist missing ${prerenderOutputRelPath(route.path)} — run npm run build`);
    const html = readFileSync(outPath, 'utf8');
    assertRouteHtml(html, route, `dist ${route.path}`);
  }

  const appBootPath = join(root, 'dist', APP_BOOT_SHELL_REL_PATH);
  assert(existsSync(appBootPath), `dist missing ${APP_BOOT_SHELL_REL_PATH} — run npm run build`);
  const appBootHtml = readFileSync(appBootPath, 'utf8');
  assert(
    appBootHtml.includes(`${DASHBOARD_BOOT_SHELL_MARKER}="true"`),
    'app boot shell must include branded dashboard skeleton marker',
  );
  assert(
    appBootHtml.includes('/branding/splash-vinyl-mark.webp'),
    'app boot shell must include vinyl brand mark',
  );
  assert(
    /<div id="root">[\s\S]*?<\/div>/i.test(appBootHtml),
    'app boot shell must keep a #root mount point',
  );
  assert(
    !appBootHtml.includes('data-seo-prerender'),
    'app boot shell must not include SEO prerender body',
  );
  assert(
    existsSync(distIndex) &&
      readFileSync(distIndex, 'utf8').includes('data-seo-prerender'),
    'home dist/index.html must still include SEO prerender body',
  );

  console.log('verify:seo-prerender: dist/ checked');
} else {
  console.log('verify:seo-prerender: fixture-only (dist/ not prerendered)');
}

console.log('verify:seo-prerender OK');
