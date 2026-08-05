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
  resolveModulepreloadClosure,
} from './boot-modulepreload.mjs';
import {
  APP_BOOT_SHELL_REL_PATH,
  DASHBOARD_BOOT_PRELOAD_MARKER,
  DASHBOARD_BOOT_SHELL_MARKER,
  LIGHT_SPA_BOOT_SHELL_REL_PATH,
  LOGIN_BOOT_PRELOAD_MARKER,
  LOGIN_BOOT_SHELL_MARKER,
  LOGIN_BOOT_SHELL_REL_PATH,
  LOGIN_FORM_SHELL_MARKER,
  MARKETING_BOOT_SHELL_MARKER,
  PRERENDER_ROUTES,
  SPLASH_BOOT_PRELOAD_MARKER,
  TOUR_STATS_BOOT_PRELOAD_MARKER,
  buildDashboardBootShellHtml,
  buildFixtureShellHtml,
  buildLoginBootShellHtml,
  injectDashboardBootModulepreloads,
  injectLoginBootModulepreloads,
  injectPrerenderHtml,
  injectSplashBootModulepreloads,
  injectTourStatsBootModulepreloads,
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
  assert(
    html.includes(`${MARKETING_BOOT_SHELL_MARKER}="true"`),
    `${label}: missing marketing boot overlay (covers SEO body until React mounts)`,
  );
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
  assert(
    !html.includes('/fonts/inter/InterVariable.woff2'),
    `${label}: Inter must not be preloaded (contends with entry JS on cold open)`,
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

const fixtureLoginBoot = buildLoginBootShellHtml(dirtyShell);
assert(
  fixtureLoginBoot.includes(`${LOGIN_BOOT_SHELL_MARKER}="true"`),
  'login boot fixture must include login auth-card marker',
);
assert(
  fixtureLoginBoot.includes(`${LOGIN_FORM_SHELL_MARKER}="true"`),
  'login boot fixture must include HTML-first form marker (#892)',
);
assert(
  /id="si-email"/.test(fixtureLoginBoot) && /<input\b/i.test(fixtureLoginBoot),
  'login boot fixture must include real form controls in first HTML (#892)',
);
assert(
  !fixtureLoginBoot.includes(`${DASHBOARD_BOOT_SHELL_MARKER}="true"`) &&
    !fixtureLoginBoot.includes('dbs-tabs'),
  'login boot fixture must not reuse dashboard tab chrome',
);
assert(
  fixtureLoginBoot.includes('/branding/splash-vinyl-mark.webp'),
  'login boot fixture must include vinyl brand mark',
);
assert(!fixtureLoginBoot.includes('<h1>leak</h1>'), 'login boot must strip prior #root body');

// Fixture: each shell modulepreloads its own route chunk + static closure (#731).
// Both route leaves exist; HomeRoute pulls a fake auth dep so closure is covered.
const fakeDist = mkdtempSync(join(tmpdir(), 'seo-prerender-'));
mkdirSync(join(fakeDist, 'assets'), { recursive: true });
writeFileSync(
  join(fakeDist, 'assets', 'HomeRoute-a1b2c3d4.js'),
  'import { x } from "./auth-deadbeef.js";\nexport default x;\n',
  'utf8',
);
writeFileSync(join(fakeDist, 'assets', 'auth-deadbeef.js'), 'export const x = 1;\n', 'utf8');
writeFileSync(join(fakeDist, 'assets', 'DashboardRoute-e5f6a7b8.js'), '', 'utf8');
writeFileSync(
  join(fakeDist, 'assets', 'PublicTourStatsPage-c0ffee01.js'),
  'import { y } from "./tour-stats-deadbeef.js";\nexport default y;\n',
  'utf8',
);
writeFileSync(
  join(fakeDist, 'assets', 'tour-stats-deadbeef.js'),
  'export const y = 1;\n',
  'utf8',
);

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
  fixtureSplashPreload.includes('/assets/auth-deadbeef.js'),
  'splash must modulepreload HomeRoute static deps (auth closure)',
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
assert(
  resolveModulepreloadClosure(join(fakeDist, 'assets'), [
    '/assets/HomeRoute-a1b2c3d4.js',
  ]).includes('/assets/auth-deadbeef.js'),
  'closure walker must follow static from "./chunk.js" edges',
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

const fixtureTourStatsPreload = injectTourStatsBootModulepreloads(
  buildFixtureShellHtml(),
  fakeDist,
);
assert(
  fixtureTourStatsPreload.includes(`${TOUR_STATS_BOOT_PRELOAD_MARKER}="true"`) &&
    fixtureTourStatsPreload.includes('/assets/PublicTourStatsPage-c0ffee01.js'),
  'tour-stats shell must modulepreload the PublicTourStatsPage chunk',
);
assert(
  fixtureTourStatsPreload.includes('/assets/tour-stats-deadbeef.js'),
  'tour-stats shell must modulepreload PublicTourStatsPage static deps',
);
assert(
  !fixtureTourStatsPreload.includes('DashboardRoute-') &&
    !fixtureTourStatsPreload.includes('HomeRoute-'),
  'tour-stats shell must not modulepreload dashboard or splash route chunks',
);
assert(
  injectTourStatsBootModulepreloads(fixtureTourStatsPreload, fakeDist) ===
    fixtureTourStatsPreload,
  'tour-stats modulepreload injection must be idempotent',
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
  // #832: home is the marketing entry — splash UI is static in that graph.
  // Do not modulepreload lazy HomeRoute / auth (those belong on app.html).
  assert(
    !homeHtml.includes(SPLASH_BOOT_PRELOAD_MARKER),
    'home marketing document must not inject HomeRoute splash modulepreloads',
  );
  assert(
    !homeHtml.includes('HomeRoute-'),
    'home marketing document must not reference HomeRoute chunk',
  );
  assert(
    /\/assets\/marketing-[^"]+\.js/.test(homeHtml),
    'home dist/index.html must boot the marketing entry chunk',
  );
  assert(
    !/\/assets\/firebase-core-[^"]+\.js/.test(homeHtml),
    'home marketing document must not load firebase-core on cold open',
  );
  assert(
    homeHtml.includes(`${MARKETING_BOOT_SHELL_MARKER}="true"`),
    'home dist/index.html must include marketing boot overlay',
  );
  assert(
    !homeHtml.includes('href="/fonts/inter/InterVariable.woff2"'),
    'home dist/index.html must not preload Inter (~344KB)',
  );

  const distApp = join(root, 'dist', 'app.html');
  assert(existsSync(distApp), 'dist missing app.html — authenticated SPA entry (#832)');
  const appHtml = readFileSync(distApp, 'utf8');
  assert(
    /\/assets\/app-[^"]+\.js/.test(appHtml),
    'dist/app.html must boot the authenticated SPA entry chunk',
  );

  const distLoginEntry = join(root, 'dist', 'login.html');
  assert(
    existsSync(distLoginEntry),
    'dist missing login.html — HTML-first login Vite entry (#892)',
  );
  const loginEntryHtml = readFileSync(distLoginEntry, 'utf8');
  assert(
    /\/assets\/login-[^"]+\.js/.test(loginEntryHtml),
    'dist/login.html must boot the auth-door login entry chunk (#892)',
  );
  assert(
    !/\/assets\/app-[^"]+\.js/.test(loginEntryHtml),
    'dist/login.html must not boot the dashboard SPA entry',
  );
  assert(
    /id="si-email"/.test(loginEntryHtml) && /<input\b/i.test(loginEntryHtml),
    'dist/login.html must include form controls in first HTML (#892)',
  );

  const distTourStats = join(root, 'dist', 'tour-stats', 'index.html');
  if (existsSync(distTourStats)) {
    const tourHtml = readFileSync(distTourStats, 'utf8');
    assert(
      /\/assets\/marketing-[^"]+\.js/.test(tourHtml),
      'prerendered /tour-stats must boot the marketing entry (#853)',
    );
    assert(
      !/\/assets\/app-[^"]+\.js/.test(tourHtml),
      'prerendered /tour-stats must not boot the authenticated SPA entry',
    );
    assert(
      tourHtml.includes(TOUR_STATS_BOOT_PRELOAD_MARKER) &&
        tourHtml.includes('PublicTourStatsPage-'),
      'prerendered /tour-stats must modulepreload PublicTourStatsPage (#827/#853)',
    );
    assert(
      !/\/assets\/firebase[^"]*\.js/.test(tourHtml),
      'prerendered /tour-stats must not modulepreload firebase-core (fetch-time only)',
    );
    assert(
      !/\/assets\/auth-[^"]+\.js/.test(tourHtml) &&
        !tourHtml.includes('ensureFirebase-'),
      'prerendered /tour-stats must not modulepreload auth / ensureFirebase (#853)',
    );
    assert(
      !tourHtml.includes(DASHBOARD_BOOT_PRELOAD_MARKER) &&
        !tourHtml.includes('DashboardRoute-'),
      'prerendered /tour-stats must not pull DashboardRoute modulepreload',
    );
    assert(
      !tourHtml.includes(SPLASH_BOOT_PRELOAD_MARKER),
      'prerendered /tour-stats must not gain splash modulepreloads',
    );
  }
  const howItWorksHtml = readFileSync(distHowItWorks, 'utf8');
  assert(
    !howItWorksHtml.includes(SPLASH_BOOT_PRELOAD_MARKER),
    'marketing routes must not gain splash modulepreloads',
  );
  assert(
    howItWorksHtml.includes(`${MARKETING_BOOT_SHELL_MARKER}="true"`),
    'marketing routes must include marketing boot overlay',
  );

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
    !lightBootHtml.includes('DashboardRoute-'),
    'light spa boot must not reference DashboardRoute chunk',
  );
  assert(
    !lightBootHtml.includes(SPLASH_BOOT_PRELOAD_MARKER),
    'light spa boot must not gain splash modulepreloads',
  );
  assert(
    !lightBootHtml.includes('data-seo-prerender'),
    'light spa boot must not include SEO prerender body',
  );

  const loginBootPath = join(root, 'dist', LOGIN_BOOT_SHELL_REL_PATH);
  assert(
    existsSync(loginBootPath),
    `dist missing ${LOGIN_BOOT_SHELL_REL_PATH} — run npm run build`,
  );
  const loginBootHtml = readFileSync(loginBootPath, 'utf8');
  assert(
    loginBootHtml.includes(`${LOGIN_BOOT_SHELL_MARKER}="true"`),
    'login boot shell must include login auth-card marker',
  );
  assert(
    loginBootHtml.includes(`${LOGIN_FORM_SHELL_MARKER}="true"`),
    'login boot shell must include HTML-first form marker (#892)',
  );
  assert(
    /id="si-email"/.test(loginBootHtml) &&
      /id="su-email"/.test(loginBootHtml) &&
      /<input\b/i.test(loginBootHtml),
    'login boot shell must include real form controls in first HTML (#892)',
  );
  assert(
    !loginBootHtml.includes(`${DASHBOARD_BOOT_SHELL_MARKER}="true"`) &&
      !loginBootHtml.includes('dbs-tabs') &&
      !loginBootHtml.includes('data-dashboard-boot-shell'),
    'login boot shell must not reuse dashboard tab chrome',
  );
  assert(
    /\/assets\/login-[^"]+\.js/.test(loginBootHtml),
    'login boot shell must boot auth-door login entry (#892)',
  );
  assert(
    !/\/assets\/app-[^"]+\.js/.test(loginBootHtml),
    'login boot shell must not boot dashboard SPA entry (#892)',
  );
  assert(
    !loginBootHtml.includes('vendor-react-query') &&
      !loginBootHtml.includes('QueryClientProvider'),
    'login boot shell must not pull react-query on the auth door',
  );
  assert(
    loginBootHtml.includes(`${LOGIN_BOOT_PRELOAD_MARKER}="true"`) &&
      (/\/assets\/firebase-core-[^"]+\.js/.test(loginBootHtml)),
    'login boot shell must modulepreload firebase-core (#860)',
  );
  // LoginPage-* preload is preferred when the chunk exists (lazy leaf); not required
  // if the hydrate graph folds into login-*.js.
  assert(
    !/\/assets\/firebaseAppCheck-[^"]+\.js/.test(loginBootHtml) &&
      !/\/assets\/firebase-appcheck-[^"]+\.js/.test(loginBootHtml),
    'login boot shell must not modulepreload App Check',
  );
  assert(
    !/\/assets\/firebase-storage-[^"]+\.js/.test(loginBootHtml),
    'login boot shell must not modulepreload firebase-storage',
  );
  assert(
    !loginBootHtml.includes(DASHBOARD_BOOT_PRELOAD_MARKER) &&
      !loginBootHtml.includes('DashboardRoute-'),
    'login boot shell must not pull DashboardRoute',
  );
  assert(
    !loginBootHtml.includes('data-seo-prerender'),
    'login boot shell must not include SEO prerender body',
  );
  assert(
    injectLoginBootModulepreloads(loginBootHtml, join(root, 'dist')) ===
      loginBootHtml,
    'login modulepreload injection must be idempotent',
  );

  console.log('verify:seo-prerender: dist/ checked');
} else {
  console.log('verify:seo-prerender: fixture-only (dist/ not prerendered)');
}

console.log('verify:seo-prerender OK');
