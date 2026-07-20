/**
 * CI guard (#663): homepage SEO description stays in sync across mirrors.
 *
 * Source of truth: `src/shared/config/seo.js` → `SEO_CONFIG.defaultDescription`
 * Must match:
 * - `og-home-html.mjs` → `OG_HOME.description`
 * - `api/inviteOgHelpers.mjs` → `DEFAULT_DESCRIPTION`
 * - root `index.html` → meta description + og:description + twitter:description
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SEO_CONFIG } from '../src/shared/config/seo.js';
import { OG_HOME } from '../og-home-html.mjs';
import { DEFAULT_DESCRIPTION } from '../api/inviteOgHelpers.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const expected = SEO_CONFIG.defaultDescription;

function fail(message) {
  console.error(`verify:seo-strings: ${message}`);
  process.exit(1);
}

if (OG_HOME.description !== expected) {
  fail('og-home-html.mjs OG_HOME.description drifts from seo.js');
}

if (DEFAULT_DESCRIPTION !== expected) {
  fail('api/inviteOgHelpers.mjs DEFAULT_DESCRIPTION drifts from seo.js');
}

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const metaNameRe = (name) =>
  new RegExp(
    `<meta\\s+name="${name}"\\s+content="([^"]*)"\\s*/?>`,
    'i',
  );
const metaPropRe = (property) =>
  new RegExp(
    `<meta\\s+property="${property}"\\s+content="([^"]*)"\\s*/?>`,
    'i',
  );

for (const [label, re] of [
  ['meta name=description', metaNameRe('description')],
  ['og:description', metaPropRe('og:description')],
  ['twitter:description', metaNameRe('twitter:description')],
]) {
  const m = indexHtml.match(re);
  if (!m) fail(`index.html missing ${label}`);
  if (m[1] !== expected) {
    fail(`index.html ${label} drifts from seo.js`);
  }
}

console.log('verify:seo-strings OK');
