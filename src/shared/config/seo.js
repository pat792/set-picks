/**
 * Landing meta + Helmet (`LandingSeo.jsx`). Facebook and some crawlers do not execute JS:
 * duplicate Open Graph / Twitter tags for `/` in root `index.html` when changing copy or `ogImageUrl`.
 *
 * `OG_IMAGE_VERSION` is also used by `og-home-html.mjs` (edge middleware) — keep in sync.
 */
export const OG_IMAGE_VERSION = '20260711';

export const SEO_CONFIG = {
  siteUrl: 'https://www.setlistpickem.com',
  siteName: "Setlist Pick 'Em",
  /** Shown in meta + JSON-LD; some link previews (e.g. LinkedIn) surface publisher/author from structured data. */
  publisherName: 'Road2 Media LLC',
  defaultTitle: "Setlist Pick'em | The Ultimate Live Music Prediction Game",
  defaultDescription:
    "Setlist Pick 'Em is a free live setlist prediction game built for Phish fans—and more bands soon. Lock openers, closers, encore, and a wildcard before each show; scores update live as songs are played. Tour insights refresh every night the band plays live. Play to unlock personal stats and compete with friends.",
  /** Absolute URL for Open Graph / Twitter cards (`public/branding/og-card-1200x630.jpg`). */
  ogImageUrl: `https://www.setlistpickem.com/branding/og-card-1200x630.jpg?v=${OG_IMAGE_VERSION}`,
  ogImageType: 'image/jpeg',
};
