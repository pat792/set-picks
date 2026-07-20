/**
 * Public marketing SEO route registry — Helmet pages + build-time prerender (#659).
 *
 * Post-build `scripts/prerender-seo.mjs` writes crawler-visible HTML into `dist/`.
 * Public tour-stats (#665): `/tour-stats` + default Sphere slug; other tours
 * hydrate client-side from `public_tour_stats` (aggregates only).
 *
 * Do not list `/dashboard/*`, `/invite/*`, or `/join/*`.
 *
 * Scoring point values mirror `SCORING_RULES` in `shared/utils/scoring.js` (kept as
 * literals here so Node verify/prerender scripts do not need Vite path resolution).
 */
import { SEO_CONFIG } from './seo.js';

const EXACT_SLOT = 10;
const ENCORE_EXACT = 15;
const IN_SETLIST = 5;
const WILDCARD_HIT = 10;
const BUSTOUT_BOOST = 20;
const BUSTOUT_MIN_GAP = 30;

const organizationId = `${SEO_CONFIG.siteUrl}/#organization`;

export const SEO_FAVICON_VERSION = '20260715';

export const LANDING_FAQ_MAIN_ENTITY = [
  {
    '@type': 'Question',
    name: "What is Setlist Pick 'Em?",
    acceptedAnswer: {
      '@type': 'Answer',
      text: SEO_CONFIG.defaultDescription,
    },
  },
  {
    '@type': 'Question',
    name: 'How does scoring work?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: `Picks earn points by how they match the official setlist. In setlist (song played, wrong slot): ${IN_SETLIST} points. Exact slot (set opener or closer you called): ${EXACT_SLOT} points. Wildcard (song played anywhere in the show): ${WILDCARD_HIT} points. Encore: ${ENCORE_EXACT} points. Bustout Boost adds ${BUSTOUT_BOOST} bonus points on top of the base score when the song had a gap of ${BUSTOUT_MIN_GAP} or more shows since it was last played.`,
    },
  },
  {
    '@type': 'Question',
    name: 'How do I play with friends?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Create a private pool and share your invite link, or compete on the global leaderboard alongside other fans.',
    },
  },
  {
    '@type': 'Question',
    name: "Is Setlist Pick 'Em free?",
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Yes. There is no charge to sign up and play.',
    },
  },
  {
    '@type': 'Question',
    name: 'Which bands does it support today?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'The game is built for Phish tours. Support for additional acts may be added later.',
    },
  },
  {
    '@type': 'Question',
    name: 'What is a Bustout Boost?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: `Correct picks on bustout songs—those with a ${BUSTOUT_MIN_GAP}+ show gap before the show—earn ${BUSTOUT_BOOST} extra points on top of the base points for that outcome (in setlist, exact slot, wildcard, or encore).`,
    },
  },
];

function buildHomeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SEO_CONFIG.publisherName,
        url: SEO_CONFIG.siteUrl,
      },
      {
        '@type': 'SoftwareApplication',
        name: "Setlist Pick'em",
        applicationCategory: 'GameApplication',
        operatingSystem: 'WebBrowser',
        description: SEO_CONFIG.defaultDescription,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': organizationId },
        provider: { '@id': organizationId },
      },
      {
        '@type': 'HowTo',
        name: "How to play Setlist Pick'em",
        step: [
          {
            '@type': 'HowToStep',
            name: 'Lock It In',
            text: 'Predict the openers, closers, encore, and a wildcard before the lights go down.',
          },
          {
            '@type': 'HowToStep',
            name: 'Watch It Unfold',
            text: 'Watch the setlist and your scores update in real-time.',
          },
          {
            '@type': 'HowToStep',
            name: 'Claim the Crown',
            text: 'Play in the global pool or join private pools to compete with your crew.',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: LANDING_FAQ_MAIN_ENTITY,
      },
    ],
  };
}

const HOW_IT_WORKS_TITLE = "How to Play Setlist Pick'Em | The Live Music Prediction Game";
const HOW_IT_WORKS_DESCRIPTION =
  "Learn how Setlist Pick'Em works: lock your song picks before showtime, score points for openers, closers, encore, and wildcard predictions, and compete live on the leaderboard.";
const HOW_IT_WORKS_URL = `${SEO_CONFIG.siteUrl}/how-it-works`;

function buildHowItWorksJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': HOW_IT_WORKS_URL,
        url: HOW_IT_WORKS_URL,
        name: HOW_IT_WORKS_TITLE,
        description: HOW_IT_WORKS_DESCRIPTION,
        isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
      },
      {
        '@type': 'HowTo',
        name: "How to play Setlist Pick'Em",
        description: HOW_IT_WORKS_DESCRIPTION,
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Lock It In',
            text: 'Pick openers, closers, encore, and a wildcard before showtime. Earn points for correct picks, higher points for exact slot picks, plus a Bustout Boost for calling longshots.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Watch It Unfold',
            text: "Live scores and standings update in real-time as songs are played. See your picks and everyone else's light up the leaderboard.",
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Claim the Crown',
            text: 'Challenge friends in private pools and compete in global standings with everyone playing that night.',
          },
        ],
      },
    ],
  };
}

const HOW_SCORING_TITLE = "How Scoring Works | Setlist Pick'Em";
const HOW_SCORING_DESCRIPTION = `Setlist Pick'Em scoring guide: In setlist (${IN_SETLIST} pts), exact slot (${EXACT_SLOT} pts), wildcard (${WILDCARD_HIT} pts), encore (${ENCORE_EXACT} pts), plus a Bustout Boost of ${BUSTOUT_BOOST} points for songs with a ${BUSTOUT_MIN_GAP}+ show gap.`;
const HOW_SCORING_URL = `${SEO_CONFIG.siteUrl}/how-scoring-works`;

const TOUR_STATS_HUB_TITLE = "Phish Tour Stats | Setlist Pick'Em";
const TOUR_STATS_HUB_DESCRIPTION =
  "Aggregate Phish tour setlist stats — most-played songs, bustouts, and gap highlights. Starts with the Sphere run (when Setlist Pick 'Em launched); tours update as Phish.net publishes new dates.";
const TOUR_STATS_HUB_URL = `${SEO_CONFIG.siteUrl}/tour-stats`;

const TOUR_STATS_SPHERE_TITLE = "Sphere Run 2026 Tour Stats | Setlist Pick'Em";
const TOUR_STATS_SPHERE_DESCRIPTION =
  "Sphere Run 2026 setlist stats for Setlist Pick 'Em — most-played songs, bustouts, and gap highlights from the inaugural Pick'em tour. Aggregate song data only; not full nightly setlists.";
const TOUR_STATS_SPHERE_URL = `${SEO_CONFIG.siteUrl}/tour-stats/sphere-run-2026`;

function buildTourStatsHubJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': TOUR_STATS_HUB_URL,
        url: TOUR_STATS_HUB_URL,
        name: TOUR_STATS_HUB_TITLE,
        description: TOUR_STATS_HUB_DESCRIPTION,
        isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SEO_CONFIG.siteUrl}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tour stats',
            item: TOUR_STATS_HUB_URL,
          },
        ],
      },
    ],
  };
}

function buildTourStatsSphereJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': TOUR_STATS_SPHERE_URL,
        url: TOUR_STATS_SPHERE_URL,
        name: TOUR_STATS_SPHERE_TITLE,
        description: TOUR_STATS_SPHERE_DESCRIPTION,
        isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SEO_CONFIG.siteUrl}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tour stats',
            item: TOUR_STATS_HUB_URL,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Sphere Run 2026',
            item: TOUR_STATS_SPHERE_URL,
          },
        ],
      },
    ],
  };
}

const KEYWORD_PAGE_PATH = '/phish-setlist-prediction-game';
const KEYWORD_PAGE_TITLE =
  "Phish Setlist Prediction Game | Setlist Pick'Em";
const KEYWORD_PAGE_DESCRIPTION =
  "Setlist Pick'Em is the free Phish setlist prediction game: lock openers, closers, encore, and a wildcard before showtime, score live as songs are played, and compete with friends. Not a setlist archive — a game.";
const KEYWORD_PAGE_URL = `${SEO_CONFIG.siteUrl}${KEYWORD_PAGE_PATH}`;

function buildKeywordIntentPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': KEYWORD_PAGE_URL,
        url: KEYWORD_PAGE_URL,
        name: KEYWORD_PAGE_TITLE,
        description: KEYWORD_PAGE_DESCRIPTION,
        isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is a Phish setlist prediction game?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "A Phish setlist prediction game asks fans to predict songs and slots before the show. Setlist Pick'Em scores picks live as the setlist unfolds and ranks players in private pools and global standings.",
            },
          },
          {
            '@type': 'Question',
            name: 'How is Setlist Pick\'Em different from Phish.net or setlist.fm?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Phish.net and setlist.fm are setlist archives and references. Setlist Pick\'Em is a free live prediction game that uses official setlist data for scoring — you compete before and during the show rather than only browsing what was played.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is Setlist Pick\'Em free?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. There is no charge to sign up and play.',
            },
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SEO_CONFIG.siteUrl}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Phish setlist prediction game',
            item: KEYWORD_PAGE_URL,
          },
        ],
      },
    ],
  };
}

function buildHowScoringJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': HOW_SCORING_URL,
        url: HOW_SCORING_URL,
        name: HOW_SCORING_TITLE,
        description: HOW_SCORING_DESCRIPTION,
        isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How many points do I get for an in-setlist pick?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `If your pick is played anywhere in the setlist but not in the exact slot you chose, you earn ${IN_SETLIST} points.`,
            },
          },
          {
            '@type': 'Question',
            name: 'How many points for an exact slot pick?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `If your pick lands in the exact slot you selected (Set 1 opener/closer or Set 2 opener/closer), you earn ${EXACT_SLOT} points.`,
            },
          },
          {
            '@type': 'Question',
            name: 'How many points for the wildcard?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `If your wildcard pick is played anywhere in the show, you earn ${WILDCARD_HIT} points.`,
            },
          },
          {
            '@type': 'Question',
            name: 'How many points for an encore pick?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `If your pick is played during the encore, you earn ${ENCORE_EXACT} points — the highest base score because the encore is the toughest call.`,
            },
          },
          {
            '@type': 'Question',
            name: 'What is the Bustout Boost?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Correct picks on songs with a ${BUSTOUT_MIN_GAP}+ show gap earn a bonus ${BUSTOUT_BOOST} points on top of base points — rewarding strategic picks over heavy rotation songs.`,
            },
          },
        ],
      },
    ],
  };
}

/**
 * @typedef {object} SeoPrerenderRoute
 * @property {string} path - URL path (`/` or `/how-it-works`)
 * @property {string} title
 * @property {string} description
 * @property {string} canonicalUrl
 * @property {string} h1
 * @property {string[]} paragraphs - crawler-visible body copy
 * @property {() => object} buildJsonLd
 */

/** @type {SeoPrerenderRoute[]} */
export const PRERENDER_ROUTES = [
  {
    path: '/',
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    canonicalUrl: `${SEO_CONFIG.siteUrl}/`,
    h1: "Setlist Pick 'Em — the free live setlist prediction game for Phish fans",
    paragraphs: [
      'Predict the setlist. Win the night. Now live on Phish Tour.',
      "Make picks for tonight's show, watch scores update as songs are played, and compete with your tour crew for the top spot.",
      "Lock It In: predict openers, closers, encore, and a wildcard before the lights go down. Watch It Unfold as scores update in real time. Claim the Crown in the global pool or private pools with friends.",
    ],
    buildJsonLd: buildHomeJsonLd,
  },
  {
    path: '/how-it-works',
    title: HOW_IT_WORKS_TITLE,
    description: HOW_IT_WORKS_DESCRIPTION,
    canonicalUrl: HOW_IT_WORKS_URL,
    h1: "How to Play Setlist Pick'Em",
    paragraphs: [
      'The free live setlist prediction game for Phish fans. Lock your picks before the lights go down, score as the setlist unfolds, and compete with friends.',
      'Lock It In: Pick openers, closers, encore, and a wildcard before showtime.',
      'Watch It Unfold: Live scores and standings update in real-time as songs are played.',
      'Claim the Crown: Challenge friends in private pools and compete in global standings.',
    ],
    buildJsonLd: buildHowItWorksJsonLd,
  },
  {
    path: '/how-scoring-works',
    title: HOW_SCORING_TITLE,
    description: HOW_SCORING_DESCRIPTION,
    canonicalUrl: HOW_SCORING_URL,
    h1: 'How Scoring Works',
    paragraphs: [
      'Picks earn points based on where they land in the setlist.',
      `In setlist: ${IN_SETLIST} points. Exact slot: ${EXACT_SLOT} points. Wildcard: ${WILDCARD_HIT} points. Encore: ${ENCORE_EXACT} points.`,
      `Bustout Boost: +${BUSTOUT_BOOST} points on top of base when the song had a ${BUSTOUT_MIN_GAP}+ show gap.`,
    ],
    buildJsonLd: buildHowScoringJsonLd,
  },
  {
    path: '/tour-stats',
    title: TOUR_STATS_HUB_TITLE,
    description: TOUR_STATS_HUB_DESCRIPTION,
    canonicalUrl: TOUR_STATS_HUB_URL,
    h1: 'Phish tour setlist stats',
    paragraphs: [
      'Aggregate song frequency, bustouts, and gap highlights for each Phish tour — the same non-personal stats players use when locking picks.',
      'We start with the Sphere run (when Setlist Pick \'Em launched) and add tours as Phish.net publishes new dates on the calendar.',
      'Full nightly setlists stay in the signed-in app. This page never lists an entire show\'s set — only tour-level song datasets.',
    ],
    buildJsonLd: buildTourStatsHubJsonLd,
  },
  {
    path: '/tour-stats/sphere-run-2026',
    title: TOUR_STATS_SPHERE_TITLE,
    description: TOUR_STATS_SPHERE_DESCRIPTION,
    canonicalUrl: TOUR_STATS_SPHERE_URL,
    h1: 'Sphere Run 2026 tour stats',
    paragraphs: [
      'Most-played songs, bustouts, and gap highlights from the Sphere run — the inaugural Setlist Pick \'Em tour.',
      'Tour names and dates sync from Phish.net as new shows publish so stats stay current while you make picks for every show.',
      'Aggregate song data only — not night-by-night full setlists.',
    ],
    buildJsonLd: buildTourStatsSphereJsonLd,
  },
  {
    path: KEYWORD_PAGE_PATH,
    title: KEYWORD_PAGE_TITLE,
    description: KEYWORD_PAGE_DESCRIPTION,
    canonicalUrl: KEYWORD_PAGE_URL,
    h1: 'The free Phish setlist prediction game',
    paragraphs: [
      "Setlist Pick'Em (also called Setlist Pickem / Set Picks) is a live setlist prediction game for Phish fans: lock openers, closers, encore, and a wildcard before showtime, then score as the setlist unfolds.",
      'A Phish setlist game asks you to predict songs and slots for tonight\'s show—not to archive what already happened. You compete against friends in private pools and against everyone on the global board.',
      'Sites like Phish.net and setlist.fm are outstanding archives. Setlist Pick\'Em is a game layer: you make picks before the lights go down and earn points as songs are played.',
    ],
    buildJsonLd: buildKeywordIntentPageJsonLd,
  },
];

export function getPrerenderRoute(path) {
  return PRERENDER_ROUTES.find((r) => r.path === path) ?? null;
}
