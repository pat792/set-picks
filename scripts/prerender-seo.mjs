/**
 * Post-build: write crawler-visible HTML for public marketing routes (#659).
 * Also writes a branded SPA boot shell for dashboard / app hard loads (#743 / #773).
 * Run after `vite build`. Safe to re-run.
 *
 * #832: marketing routes prerender from `dist/index.html` (marketing entry).
 * #853: `/tour-stats*` also uses the marketing shell (+ PublicTourStatsPage preload).
 * #928: tour-stats SEO slugs fetch `public_tour_stats/{slug}` (REST) and embed
 * bustout/frequency facts + FAQ/ItemList JSON-LD for crawlers.
 * #869: also writes `dist/tour-stats-data/{slug}.json` so public `/tour-stats`
 * can paint aggregates without App Check / Firestore SDK.
 * Boot shells: `dashboard` / `spa-boot` use `dist/app.html`;
 * `login` uses HTML-first `dist/login.html` (#892);
 * `/privacy` + `/terms` use zero-JS legal door shells (#916).
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
  buildLegalBootDocumentHtml,
  buildLoginBootShellHtml,
  injectDashboardBootModulepreloads,
  injectLoginBootModulepreloads,
  injectPrerenderHtml,
  injectTourStatsBootModulepreloads,
  prerenderOutputRelPath,
} from './seo-prerender-lib.mjs';
import { fetchFirestoreRestDocument } from './lib/firestoreRestDecode.mjs';
import {
  buildTourStatsFactsHtml,
  mergeTourStatsFactsJsonLd,
  normalizeTourStatsFacts,
} from './lib/tourStatsSeoFacts.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const distDir = join(root, 'dist');
const distIndex = join(distDir, 'index.html');
const distApp = join(distDir, 'app.html');
const distLogin = join(distDir, 'login.html');

const FIRESTORE_PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  'set-picks';

if (!existsSync(distIndex)) {
  console.error('prerender-seo: missing dist/index.html — run vite build first');
  process.exit(1);
}
if (!existsSync(distApp)) {
  console.error('prerender-seo: missing dist/app.html — run vite build first');
  process.exit(1);
}
if (!existsSync(distLogin)) {
  console.error('prerender-seo: missing dist/login.html — HTML-first login entry (#892)');
  process.exit(1);
}

const marketingShell = readFileSync(distIndex, 'utf8');
const appShell = readFileSync(distApp, 'utf8');
const loginEntryShell = readFileSync(distLogin, 'utf8');

function isTourStatsPrerenderRoute(path) {
  return typeof path === 'string' && path.startsWith('/tour-stats');
}

function isLegalPrerenderRoute(path) {
  return path === '/privacy' || path === '/terms';
}

/** @type {Map<string, Record<string, unknown> | null>} */
const publicTourStatsDocCache = new Map();

/**
 * @param {string} slug
 * @returns {Promise<Record<string, unknown> | null>}
 */
async function loadPublicTourStatsDoc(slug) {
  const id = String(slug || '').trim();
  if (!id) return null;
  if (publicTourStatsDocCache.has(id)) return publicTourStatsDocCache.get(id);
  const doc = await fetchFirestoreRestDocument(
    FIRESTORE_PROJECT_ID,
    `public_tour_stats/${id}`,
  );
  publicTourStatsDocCache.set(id, doc);
  return doc;
}

/**
 * Same-origin CDN snapshots for the public tour-stats data plane (#869).
 * Missing Firestore docs are skipped — the client falls back to REST.
 */
async function emitPublicTourStatsCdnJson() {
  const outDir = join(distDir, 'tour-stats-data');
  mkdirSync(outDir, { recursive: true });
  let indexDoc = null;
  try {
    indexDoc = await loadPublicTourStatsDoc('_index');
  } catch (err) {
    console.warn(
      'prerender-seo: failed to fetch public_tour_stats/_index for CDN JSON:',
      err?.message || err,
    );
    return;
  }
  if (!indexDoc) {
    console.warn(
      'prerender-seo: no public_tour_stats/_index — skip CDN JSON (#869)',
    );
    return;
  }
  const tours = Array.isArray(indexDoc.tours) ? indexDoc.tours : [];
  const indexPayload = {
    tours,
    defaultTourSlug:
      typeof indexDoc.defaultTourSlug === 'string'
        ? indexDoc.defaultTourSlug
        : '',
    cdnGeneratedAt: new Date().toISOString(),
  };
  writeFileSync(join(outDir, '_index.json'), JSON.stringify(indexPayload));
  console.log(
    `prerender-seo: wrote dist/tour-stats-data/_index.json (${tours.length} tours)`,
  );

  const slugs = new Set(
    tours
      .map((t) => (typeof t?.tourSlug === 'string' ? t.tourSlug.trim() : ''))
      .filter((slug) => slug && !slug.startsWith('_')),
  );
  for (const route of PRERENDER_ROUTES) {
    const seoSlug =
      typeof route.tourStatsSeoSlug === 'string'
        ? route.tourStatsSeoSlug.trim()
        : '';
    if (seoSlug) slugs.add(seoSlug);
  }

  for (const slug of slugs) {
    try {
      const doc = await loadPublicTourStatsDoc(slug);
      if (!doc) {
        console.warn(`prerender-seo: no public_tour_stats/${slug} for CDN JSON`);
        continue;
      }
      const rel = `tour-stats-data/${slug}.json`;
      writeFileSync(join(outDir, `${slug}.json`), JSON.stringify({ id: slug, ...doc }));
      console.log(
        `prerender-seo: wrote dist/${rel} (${Buffer.byteLength(JSON.stringify(doc), 'utf8')} bytes)`,
      );
    } catch (err) {
      console.warn(
        `prerender-seo: failed CDN JSON for ${slug}:`,
        err?.message || err,
      );
    }
  }
}

/**
 * @param {object} route
 * @returns {Promise<{ factsHtml?: string, jsonLd?: object }>}
 */
async function loadTourStatsEnrichment(route) {
  const slug =
    typeof route.tourStatsSeoSlug === 'string' ? route.tourStatsSeoSlug.trim() : '';
  if (!slug) return {};
  try {
    const doc = await loadPublicTourStatsDoc(slug);
    if (!doc) {
      console.warn(
        `prerender-seo: no public_tour_stats/${slug} — static copy only`,
      );
      return {};
    }
    const facts = normalizeTourStatsFacts(doc);
    if (!facts.bustouts.length && !facts.topSongs.length) {
      console.warn(
        `prerender-seo: public_tour_stats/${slug} has no bustouts/topSongs yet`,
      );
    }
    return {
      factsHtml: buildTourStatsFactsHtml(facts),
      jsonLd: mergeTourStatsFactsJsonLd(
        route.buildJsonLd(),
        facts,
        route.canonicalUrl,
      ),
    };
  } catch (err) {
    console.warn(
      `prerender-seo: failed to fetch public_tour_stats/${slug}:`,
      err?.message || err,
    );
    return {};
  }
}

for (const route of PRERENDER_ROUTES) {
  // Legal door shells are written separately (zero-JS; #916) — not marketing CSR.
  if (isLegalPrerenderRoute(route.path)) continue;

  const shell = marketingShell;
  const enrichment = await loadTourStatsEnrichment(route);
  let html = injectPrerenderHtml(shell, route, enrichment);
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
  const factNote = enrichment.factsHtml ? ' +aggregate-facts' : '';
  console.log(
    `prerender-seo: wrote dist/${rel} (${Buffer.byteLength(html, 'utf8')} bytes)${factNote}`,
  );
}

await emitPublicTourStatsCdnJson();

// HTML-first legal door (#916): full policy body in first HTML, no module graph.
for (const legalPath of ['/privacy', '/terms']) {
  const html = buildLegalBootDocumentHtml(legalPath, { rootDir: root });
  const rel = prerenderOutputRelPath(legalPath);
  const outPath = join(distDir, rel);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  console.log(
    `prerender-seo: wrote dist/${rel} (HTML-first legal door, ${Buffer.byteLength(html, 'utf8')} bytes)`,
  );
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

// Light spa boot: same branded skeleton, no DashboardRoute preload —
// public profile, bare /join, etc. must not contend for the dashboard graph.
const lightBootPath = join(distDir, LIGHT_SPA_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(lightBootPath), { recursive: true });
writeFileSync(lightBootPath, brandedShell, 'utf8');
console.log(
  `prerender-seo: wrote dist/${LIGHT_SPA_BOOT_SHELL_REL_PATH} (branded shell, no route modulepreload)`,
);

// `/login`: HTML-first form chrome + login hydrate + firebase-core (#892 / #860).
const loginShell = buildLoginBootShellHtml(loginEntryShell);
const loginBootHtml = injectLoginBootModulepreloads(loginShell, distDir);
const loginBootPath = join(distDir, LOGIN_BOOT_SHELL_REL_PATH);
mkdirSync(dirname(loginBootPath), { recursive: true });
writeFileSync(loginBootPath, loginBootHtml, 'utf8');
console.log(
  `prerender-seo: wrote dist/${LOGIN_BOOT_SHELL_REL_PATH} (HTML-first form + login hydrate + firebase-core preload)`,
);

console.log(
  `prerender-seo: OK (${PRERENDER_ROUTES.length} routes + legal door + app boot + light spa + login boot)`,
);
