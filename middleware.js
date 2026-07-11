/**
 * Vercel Edge Middleware — serve minimal homepage OG HTML to social scrapers.
 *
 * Instagram/Facebook use `facebookexternalhit` (no JS). Static tags in
 * `index.html` are usually enough; this guarantees OG meta is the first bytes
 * after charset and busts stale Meta cache issues when paired with a versioned
 * `og:image` URL.
 */
import { buildHomeOgHtml, SOCIAL_CRAWLER_RE } from './og-home-html.mjs';

export const config = {
  matcher: '/',
};

export default function middleware(request) {
  const ua = request.headers.get('user-agent') ?? '';
  if (!SOCIAL_CRAWLER_RE.test(ua)) {
    return;
  }

  const html = buildHomeOgHtml();
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
    },
  });
}
