/**
 * CI guard: HTML-first public marketing documents (#659 / #829).
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
  LIGHT_SPA_BOOT_SHELL_REL_PATH,
  MARKETING_STATIC_PAGE_MARKER,
  PRERENDER_ROUTES,
  SPLASH_BOOT_PRELOAD_MARKER,
  buildDashboardBootShellHtml,
  buildFixtureShellHtml,
  injectDashboardBootModulepreloads,
  injectPrerenderHtml,
  injectSplashBootModulepreloads,
  prerenderOutputRelPath,
  stripSpaRuntimeFromHtml,
} from './seo-prerender-lib.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) {
    console.error(`verify:seo-prerender: ${message}`);
    process.exit(1);
  }
}

function assertNoSpaEntry(html, label) {
  assert(
    !/<script\b[^>]*\btype=["']module["']/i.test(html),
    `${label}: must not include SPA type=module entry (#829)`,
  );
  assert(
    !/rel=["']modulepreload["']/i.test(html),
    `${label}: must not modulepreload app chunks (#829)`,
  );
  assert(
    !/\/assets\/index-[^"'\s>]+\.js/i.test(html),
    `${label}: must not reference /assets/index-*.js SPA entry (#829)`,
  );
  assert(
    !html.includes('firebase-core'),
    `${label}: must not reference firebase-core (#829)`,
  );
}

function assertRouteHtml(html, route, label) {
  assert(html.includes(`<title>${route.title}</title>`) || html.includes(route.title), `${label}: missing title`);
  assert(html.includes(route.description), `${label}: missing description`);
  assert(html.includes(route.h1), `${label}: missing H1`);
  assert(html.includes('application/ld+json'), `${label}: missing JSON-LD`);
  assert(html.includes('data-seo-prerender="true"'), `${label}: missing prerender markers`);
  assert(
    html.includes(`${MARKETING_STATIC_PAGE_MARKER}="true"`),
    `${label}: missing HTML-first marketing static page marker (#829)`,
  );
  assert(html.includes('href="/login"'), `${label}: missing Sign in CTA to /login`);
  assert(
    html.includes('href="/login?signup=1"'),
    `${label}: missing Create account CTA to /login?signup=1`,
  );
  assert(html.includes('rel="icon"'), `${label}: missing favicon link`);
  assert(html.includes('/favicon/favicon.ico'), `${label}: missing favicon.ico link`);
  assert(
    html.includes('/favicon/favicon-96x96.png'),
    `${label}: missing 96x96 PNG icon link (SERP needs square >=48px, #662)`,
  );
  assert(
    !html.includes('favicon.svg'),
    `${label}: favicon.svg link resurfaced — PNG/ICO are primary (#662)`,
  );
  assert(
    !html.includes('/fonts/inter/InterVariable.woff2'),
    `${label}: Inter must not be preloaded (contends with entry JS on cold open)`,
  );
  assert(html.includes(route.canonicalUrl), `${label}: missing canonical`);
  for (const p of route.paragraphs) {
    assert(html.includes(p.slice(0, Math.min(40, p.length))), `${label}: missing body excerpt`);
  }
  assertNoSpaEntry(html, label);
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

assert(
  stripSpaRuntimeFromHtml(
    '<html><head><script type="module" src="/assets/index-x.js"></script><link rel="modulepreload" href="/assets/HomeRoute-x.js"></head><body></body></html>',
  ).includes('type="module"') === false,
  'stripSpaRuntimeFromHtml must remove module entry scripts',
);

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

// App shells still modulepreload their route closure; marketing must not.
const fakeDist = mkdtempSync(join(tmpdir(), 'seo-prerender-'));
mkdirSync(join(fakeDist, 'assets'), { recursive: true });
writeFileSync(
  join(fakeDist, 'assets', 'HomeRoute-a1b2c3d4.js'),
  'import { x } from "./auth-deadbeef.js";\nexport default x;\n',
  'utf8',
);
writeFileSync(join(fakeDist, 'assets', 'auth-deadbeef.js'), 'export const x = 1;\n', 'utf8');
writeFileSync(join(fakeDist, 'assets', 'DashboardRoute-e5f6a7b8.js'), '', 'utf8');

const fixtureSplashPreload = injectSplashBootModulepreloads(
  buildFixtureShellHtml(),
  fakeDist,
);
assert(
  fixtureSplashPreload.includes(`${SPLASH_BOOT_PRELOAD_MARKER}="true"`),
  'injectSplashBootModulepreloads helper must still work for tests',
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

const homeFixture = injectPrerenderHtml(shell, PRERENDER_ROUTES.find((r) => r.path === '/'));
assert(
  homeFixture.includes('setpicks_session_hint_v1'),
  'home HTML-first doc must include session-hint redirect boot script',
);
assert(
  homeFixture.includes('/login'),
  'home boot script / CTAs must reference /login app entry',
);

const distIndex = join(root, 'dist', 'index.html');
const distHowItWorks = join(root, 'dist', 'how-it-works', 'index.html');
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
    /<script\b[^>]*\btype=["']module["']/i.test(appBootHtml),
    'app boot shell must keep the SPA module entry',
  );

  const homeHtml = readFileSync(distIndex, 'utf8');
  assert(
    homeHtml.includes(`${MARKETING_STATIC_PAGE_MARKER}="true"`),
    'home dist/index.html must be HTML-first static marketing',
  );
  assert(
    homeHtml.includes('setpicks_session_hint_v1'),
    'home dist/index.html must session-redirect returning users',
  );
  assertNoSpaEntry(homeHtml, 'home dist/index.html');

  const lightBootPath = join(root, 'dist', LIGHT_SPA_BOOT_SHELL_REL_PATH);
  assert(existsSync(lightBootPath), `dist missing ${LIGHT_SPA_BOOT_SHELL_REL_PATH} — run npm run build`);
  const lightBootHtml = readFileSync(lightBootPath, 'utf8');
  assert(
    lightBootHtml.includes(`${DASHBOARD_BOOT_SHELL_MARKER}="true"`),
    'light spa boot must include branded skeleton marker',
  );
  assert(
    !lightBootHtml.includes(DASHBOARD_BOOT_PRELOAD_MARKER),
    'light spa boot must not modulepreload DashboardRoute',
  );
  assert(
    !lightBootHtml.includes('data-seo-prerender'),
    'light spa boot must not include SEO prerender body',
  );
  assert(
    /<script\b[^>]*\btype=["']module["']/i.test(lightBootHtml),
    'light spa boot must keep the SPA module entry for /login etc.',
  );

  console.log('verify:seo-prerender: dist/ checked');
} else {
  console.log('verify:seo-prerender: fixture-only (dist/ not prerendered)');
}

console.log('verify:seo-prerender OK');
