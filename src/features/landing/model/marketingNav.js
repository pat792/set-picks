/**
 * Public marketing routes for header/footer internal linking (#663).
 * Keep in sync with `App.jsx` public routes + `seoRoutes` prerender list.
 */

/** Educational / product pages (not legal). */
export const MARKETING_PRIMARY_NAV = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/how-scoring-works', label: 'Scoring' },
  { to: '/tour-stats', label: 'Tour stats' },
  { to: '/phish-setlist-prediction-game', label: 'The game' },
];

/** Legal links — footer only. */
export const MARKETING_LEGAL_NAV = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
];
