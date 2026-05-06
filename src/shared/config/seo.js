/**
 * Landing meta + Helmet (`LandingSeo.jsx`). Facebook and some crawlers do not execute JS:
 * duplicate Open Graph / Twitter tags for `/` in root `index.html` when changing copy or `ogImageUrl`.
 */
export const SEO_CONFIG = {
  siteUrl: 'https://www.setlistpickem.com',
  /** Shown in meta + JSON-LD; some link previews (e.g. LinkedIn) surface publisher/author from structured data. */
  publisherName: 'Road2 Media LLC',
  defaultTitle: "Setlist Pick'em | The Ultimate Live Music Prediction Game",
  defaultDescription:
    "Setlist Pick 'Em is a free live setlist prediction game for Phish fans. Pick openers, closers, encore, and a wildcard before each show; scores update in real time as songs are played. Compete in a global pool or create private pools with friends.",
  /** Absolute URL for Open Graph / Twitter cards (`public/branding/og-card-1200x630.png`). */
  ogImageUrl: 'https://www.setlistpickem.com/branding/og-card-1200x630.png',
};
