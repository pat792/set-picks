/**
 * CI guard: homepage Open Graph tags must be present for Meta crawlers within
 * the first 60 KB of HTML (Instagram/Facebook do not execute JS).
 */
import { buildHomeOgHtml, SOCIAL_CRAWLER_RE, ogHomeImageUrl } from '../og-home-html.mjs';

const MAX_HEAD_BYTES = 60 * 1024;

function assert(condition, message) {
  if (!condition) {
    console.error(`verify:og-home: ${message}`);
    process.exit(1);
  }
}

const html = buildHomeOgHtml();
const bytes = Buffer.byteLength(html, 'utf8');

assert(bytes < MAX_HEAD_BYTES, `homepage OG HTML is ${bytes} bytes (limit ${MAX_HEAD_BYTES})`);

const ogImageOffset = Buffer.byteLength(html.split('og:image')[0], 'utf8');
assert(ogImageOffset < 2048, `og:image should be near top of head (offset ${ogImageOffset} bytes)`);

assert(html.includes(ogHomeImageUrl()), 'missing versioned og:image URL');
assert(html.includes('og:image:type'), 'missing og:image:type');
assert(html.includes('og:image:width'), 'missing og:image:width');
assert(html.includes('og:image:height'), 'missing og:image:height');

assert(
  SOCIAL_CRAWLER_RE.test('facebookexternalhit/1.1'),
  'SOCIAL_CRAWLER_RE must match facebookexternalhit',
);
assert(
  !SOCIAL_CRAWLER_RE.test('Instagram 219.0.0.12.117 Android'),
  'SOCIAL_CRAWLER_RE must not match Instagram in-app browser',
);

console.log('verify:og-home OK');
