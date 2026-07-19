/**
 * Build-time SEO prerender helpers (#659).
 * Used by `prerender-seo.mjs` (post-vite) and `verify-seo-prerender.mjs` (CI).
 */
import { SEO_CONFIG } from '../src/shared/config/seo.js';
import {
  PRERENDER_ROUTES,
  SEO_FAVICON_VERSION,
} from '../src/shared/config/seoRoutes.js';

export { PRERENDER_ROUTES, SEO_FAVICON_VERSION };

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Minimal SPA shell for CI when `dist/index.html` is absent. */
export function buildFixtureShellHtml() {
  const v = SEO_FAVICON_VERSION;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png?v=${v}" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg?v=${v}" />
  <link rel="shortcut icon" href="/favicon/favicon.ico?v=${v}" />
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png?v=${v}" />
  <link rel="manifest" href="/favicon/site.webmanifest?v=${v}" />
  <title>placeholder</title>
  <script type="module" src="/assets/index-fixture.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
}

function upsertMetaByName(html, name, content) {
  const re = new RegExp(
    `<meta\\s+name="${name}"\\s+content="[^"]*"\\s*/?>`,
    'i',
  );
  const tag = `<meta name="${name}" content="${escapeHtml(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function upsertMetaByProperty(html, property, content) {
  const re = new RegExp(
    `<meta\\s+property="${property}"\\s+content="[^"]*"\\s*/?>`,
    'i',
  );
  const tag = `<meta property="${property}" content="${escapeHtml(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function upsertLinkCanonical(html, href) {
  const re = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function upsertTitle(html, title) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  }
  return html.replace(/<\/head>/i, `  <title>${escapeHtml(title)}</title>\n</head>`);
}

function ensureFavicons(html) {
  if (/rel="icon"/i.test(html) && /favicon\.ico/i.test(html)) return html;
  const v = SEO_FAVICON_VERSION;
  const block = `  <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png?v=${v}" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg?v=${v}" />
  <link rel="shortcut icon" href="/favicon/favicon.ico?v=${v}" />
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png?v=${v}" />
  <link rel="manifest" href="/favicon/site.webmanifest?v=${v}" />
`;
  return html.replace(/<\/head>/i, `${block}</head>`);
}

function injectJsonLd(html, jsonLd) {
  const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  const script = `<script type="application/ld+json" data-seo-prerender="true">${json}</script>`;
  // Drop prior prerender JSON-LD if re-running.
  const cleaned = html.replace(
    /<script type="application\/ld\+json" data-seo-prerender="true">[\s\S]*?<\/script>\s*/gi,
    '',
  );
  return cleaned.replace(/<\/head>/i, `  ${script}\n</head>`);
}

function buildCrawlerBody(route) {
  const paras = route.paragraphs
    .map((p) => `    <p>${escapeHtml(p)}</p>`)
    .join('\n');
  return `<!--seo-prerender:${escapeHtml(route.path)}-->
  <main data-seo-prerender="true">
    <h1>${escapeHtml(route.h1)}</h1>
${paras}
  </main>`;
}

function injectRootBody(html, bodyInner) {
  const rootRe = /<div id="root">[\s\S]*?<\/div>/i;
  const replacement = `<div id="root">${bodyInner}</div>`;
  if (rootRe.test(html)) return html.replace(rootRe, replacement);
  return html.replace(/<body([^>]*)>/i, `<body$1>\n${replacement}\n`);
}

/**
 * Inject route-specific SEO into a Vite SPA `index.html` shell.
 * React `createRoot` still replaces `#root` for browsers.
 */
export function injectPrerenderHtml(shellHtml, route) {
  let html = shellHtml;
  html = upsertTitle(html, route.title);
  html = upsertMetaByName(html, 'description', route.description);
  html = upsertMetaByName(html, 'author', SEO_CONFIG.publisherName);
  html = upsertMetaByProperty(html, 'og:site_name', SEO_CONFIG.siteName);
  html = upsertMetaByProperty(html, 'og:type', 'website');
  html = upsertMetaByProperty(html, 'og:title', route.title);
  html = upsertMetaByProperty(html, 'og:description', route.description);
  html = upsertMetaByProperty(html, 'og:url', route.canonicalUrl);
  html = upsertMetaByProperty(html, 'og:image', SEO_CONFIG.ogImageUrl);
  html = upsertMetaByProperty(html, 'og:image:secure_url', SEO_CONFIG.ogImageUrl);
  html = upsertMetaByName(html, 'twitter:card', 'summary_large_image');
  html = upsertMetaByName(html, 'twitter:title', route.title);
  html = upsertMetaByName(html, 'twitter:description', route.description);
  html = upsertMetaByName(html, 'twitter:image', SEO_CONFIG.ogImageUrl);
  html = upsertLinkCanonical(html, route.canonicalUrl);
  html = ensureFavicons(html);
  html = injectJsonLd(html, route.buildJsonLd());
  html = injectRootBody(html, buildCrawlerBody(route));
  return html;
}

/** Dist-relative output path for a route (`index.html` or `how-it-works/index.html`). */
export function prerenderOutputRelPath(routePath) {
  if (routePath === '/') return 'index.html';
  const trimmed = routePath.replace(/^\//, '').replace(/\/$/, '');
  return `${trimmed}/index.html`;
}
