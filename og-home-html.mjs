/**
 * Homepage Open Graph HTML for social crawlers (Meta/Instagram, X, Slack, …).
 *
 * Mirrors `src/shared/config/seo.js` + root `index.html`. Edge middleware and
 * verify scripts import this module — do not import from `src/` here.
 */

export const OG_HOME = {
  siteUrl: 'https://www.setlistpickem.com',
  siteName: "Setlist Pick 'Em",
  imageVersion: '20260711',
  imagePath: '/branding/og-card-1200x630.jpg',
  imageWidth: 1200,
  imageHeight: 630,
  imageAlt: "Setlist Pick 'Em — live setlist prediction game",
  title: "Setlist Pick'em | The Ultimate Live Music Prediction Game",
  description:
    "Setlist Pick 'Em is a free live setlist prediction game for Phish fans. Pick openers, closers, encore, and a wildcard before each show; scores update in real time as songs are played. Compete in a global pool or create private pools with friends.",
  publisherName: 'Road2 Media LLC',
};

export function ogHomeImageUrl({
  siteUrl = OG_HOME.siteUrl,
  imagePath = OG_HOME.imagePath,
  imageVersion = OG_HOME.imageVersion,
} = {}) {
  return `${siteUrl}${imagePath}?v=${imageVersion}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Minimal HTML shell — OG tags immediately after charset (Meta 60 KB head limit). */
export function buildHomeOgHtml({
  siteUrl = OG_HOME.siteUrl,
  imageUrl = ogHomeImageUrl(),
} = {}) {
  const title = OG_HOME.title;
  const description = OG_HOME.description;
  const url = `${siteUrl}/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta property="og:site_name" content="${escapeHtml(OG_HOME.siteName)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="${OG_HOME.imageWidth}" />
  <meta property="og:image:height" content="${OG_HOME.imageHeight}" />
  <meta property="og:image:alt" content="${escapeHtml(OG_HOME.imageAlt)}" />
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="author" content="${escapeHtml(OG_HOME.publisherName)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <link rel="canonical" href="${escapeHtml(url)}" />
  <title>${escapeHtml(title)}</title>
</head>
<body></body>
</html>`;
}

/** Scraper bots only — do NOT match the Instagram in-app browser (contains "Instagram"). */
export const SOCIAL_CRAWLER_RE =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|redditbot|bingbot|Applebot|Googlebot|ia_archiver/i;
