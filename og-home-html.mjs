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
    "Setlist Pick 'Em is a free live setlist prediction game built for Phish fans—and more bands soon. Lock openers, closers, encore, and a wildcard before each show; scores update live as songs are played. Tour insights refresh every night the band plays live. Play to unlock personal stats and compete with friends.",
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
  <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png?v=20260715" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg?v=20260715" />
  <link rel="shortcut icon" href="/favicon/favicon.ico?v=20260715" />
  <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png?v=20260715" />
  <link rel="manifest" href="/favicon/site.webmanifest?v=20260715" />
  <link rel="canonical" href="${escapeHtml(url)}" />
  <title>${escapeHtml(title)}</title>
</head>
<body></body>
</html>`;
}

/**
 * Social scrapers only — empty-body OG HTML is for Meta/X/Slack/etc. (no JS).
 * Do NOT match search/archive bots (Googlebot, bingbot, Applebot, ia_archiver)
 * or the Instagram in-app browser (UA contains "Instagram").
 */
export const SOCIAL_CRAWLER_RE =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|redditbot/i;
