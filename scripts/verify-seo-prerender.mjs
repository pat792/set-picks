/**
 * CI guard: prerendered public marketing HTML has unique title/description,
 * crawler body, JSON-LD, and favicon links (#659).
 *
 * Does not require a Vite build — uses a fixture shell. Optionally re-checks
 * `dist/` when present (after `npm run build`).
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  APP_BOOT_SHELL_REL_PATH,
  DASHBOARD_BOOT_PRELOAD_MARKER,
  DASHBOARD_BOOT_SHELL_MARKER,
  PRERENDER_ROUTES,
  SPLASH_BOOT_PRELOAD_MARKER,
  buildDashboardBootShellHtml,
  buildFixtureShellHtml,
  injectDashboardBootModulepreloads,
  injectPrerenderHtml,
  injectSplashBootModulepreloads,
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
  // #662: Google SERP favicons need a linked square icon >= 48px at a stable
  // URL; PNG/ICO are primary. The old favicon.svg (854 KB embedded raster)
  // must not come back.
  assert(
    html.includes('/favicon/favicon-96x96.png'),
    `${label}: missing 96x96 PNG icon link (SERP needs square >=48px, #662)`,
  );
  assert(
    !html.includes('favicon.svg'),
    `${label}: favicon.svg link resurfaced — PNG/ICO are primary (#662)`,
  );
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

// Fixture: each shell modulepreloads its own route chunk and nothing else (#731).
// Both chunks exist in the fake assets dir, so a cross-shell leak would show up.
const fakeDist = mkdtempSync(join(tmpdir(), 'seo-prerender-'));
mkdirSync(join(fakeDist, 'assets'), { recursive: true });
writeFileSync(join(fakeDist, 'assets', 'HomeRoute-a1b2c3d4.js'), '', 'utf8');
writeFileSync(join(fakeDist, 'assets', 'DashboardRoute-e5f6a7b8.js'), '', 'utf8');

const fixtureSplashPreload = injectSplashBootModulepreloads(
  buildFixtureShellHtml(),
  fakeDist,
);
assert(
  fixtureSplashPreload.includes(`${SPLASH_BOOT_PRELOAD_MARKER}="true"`) &&
    fixtureSplashPreload.includes('/assets/HomeRoute-a1b2c3d4.js'),
  'splash must modulepreload the HomeRoute chunk',
);
assert(
  !fixtureSplashPreload.includes('DashboardRoute-'),
  'splash must not modulepreload the DashboardRoute chunk',
);
assert(
  injectSplashBootModulepreloads(fixtureSplashPreload, fakeDist) ===
    fixtureSplashPreload,
  'splash modulepreload injection must be idempotent',
);

const fixtureDashboardPreload = injectDashboardBootModulepreloads(
  buildDashboardBootShellHtml(buildFixtureShellHtml()),
  fakeDist,
);
assert(
  fixtureDashboardPreload.includes(`${DASHBOARD_BOOT_PRELOAD_MARKER}="true"`) &&
    fixtureDashboardPreload.includes('/assets/DashboardRoute-e5f6a7b8.js'),
  'app boot shell must modulepreload the DashboardRoute chunk',
);
assert(
  !fixtureDashboardPreload.includes('HomeRoute-'),
  'app boot shell must not modulepreload the HomeRoute chunk',
);

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
    appBootHtml.includes(`${DASHBOARD_BOOT_PRELOAD_MARKER}="true"`) &&
      appBootHtml.includes('DashboardRoute-'),
    'app boot shell must modulepreload DashboardRoute chunk',
  );
  assert(
    !appBootHtml.includes(SPLASH_BOOT_PRELOAD_MARKER),
    'app boot shell must not gain splash modulepreloads',
  );
  const homeHtml = readFileSync(distIndex, 'utf8');
  assert(
    homeHtml.includes('data-seo-prerender'),
    'home dist/index.html must still include SEO prerender body',
  );
  assert(
    !homeHtml.includes(DASHBOARD_BOOT_PRELOAD_MARKER),
    'home dist/index.html must not gain dashboard boot modulepreloads',
  );
  assert(
    homeHtml.includes(`${SPLASH_BOOT_PRELOAD_MARKER}="true"`) &&
      homeHtml.includes('HomeRoute-'),
    'home dist/index.html must modulepreload the lazy HomeRoute chunk (#731)',
  );
  const howItWorksHtml = readFileSync(distHowItWorks, 'utf8');
  assert(
    !howItWorksHtml.includes(SPLASH_BOOT_PRELOAD_MARKER),
    'marketing routes must not gain splash modulepreloads',
  );

  console.log('verify:seo-prerender: dist/ checked');
} else {
  console.log('verify:seo-prerender: fixture-only (dist/ not prerendered)');
}

console.log('verify:seo-prerender OK');
