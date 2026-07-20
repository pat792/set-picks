/**
 * Public marketing SEO route registry — Helmet pages + build-time prerender (#659).
 *
 * Post-build `scripts/prerender-seo.mjs` writes crawler-visible HTML into `dist/`.
 * Public tour-stats (#665): `/tour-stats` (+ Sphere slug for SEO); other tours
 * hydrate in the browser from public tour-stats docs.
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
      text: "We're live with Phish today, and Setlist Pick 'Em is built to grow into a home for more bands soon.",
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
            text: 'Watch the setlist and your scores update live as songs are played.',
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
  "Learn how Setlist Pick'Em works: lock song picks before showtime, score live as the setlist unfolds, and unlock personal stats as you compete with other setlist pickers. Live with Phish today—more bands soon.";
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
            text: "Live scores and standings update as songs are played. See your picks and everyone else's light up the leaderboard.",
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Claim the Crown',
            text: 'Challenge friends in private pools and compete in global standings. Your personal stats grow with every show you play.',
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
  "Phish tour setlist stats for Setlist Pick 'Em fans — most-played songs, bustouts, and gap highlights. Updated every night the band plays live. Play the game to unlock personal stats.";
const TOUR_STATS_HUB_URL = `${SEO_CONFIG.siteUrl}/tour-stats`;

const TOUR_STATS_SPHERE_TITLE = "2026 Sphere Tour Stats | Setlist Pick'Em";
const TOUR_STATS_SPHERE_DESCRIPTION =
  "2026 Sphere setlist stats for Setlist Pick 'Em — most-played songs, bustouts, and gap highlights from the inaugural tour. Updated after every live show night.";
const TOUR_STATS_SPHERE_URL = `${SEO_CONFIG.siteUrl}/tour-stats/2026-sphere`;

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
            name: '2026 Sphere',
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
  "Setlist Pick'Em is the free Phish setlist prediction game: lock openers, closers, encore, and a wildcard before showtime, score live, and unlock personal stats as you compete. Built for Phish today—more bands soon.";
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
            name: "How is Setlist Pick'Em different from a setlist archive?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Archives look back at what was played. Setlist Pick'Em is a free live prediction game: you make picks before the show, score as songs land, and build personal stats as you compete with other fans.",
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
    h1: "Setlist Pick 'Em — the free live setlist prediction game for Phish fans (more bands soon)",
    paragraphs: [
      'Predict the setlist. Win the night. Now live on Phish Tour—and building toward more bands soon.',
      "Make picks for tonight's show, watch scores update as songs are played, and compete with your tour crew for the top spot.",
      "Lock It In: predict openers, closers, encore, and a wildcard before the lights go down. Watch It Unfold as scores update live. Claim the Crown in the global pool or private pools with friends. Play to unlock personal stats as you accumulate points.",
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
      'The free live setlist prediction game for Phish fans—and a home for more bands soon. Lock your picks before the lights go down, score as the setlist unfolds, and compete with friends.',
      'We track key tour insights and refresh them every night the band plays live. Sign in to unlock personal stats as you earn points against other setlist pickers.',
      'Lock It In: Pick openers, closers, encore, and a wildcard before showtime.',
      'Watch It Unfold: Live scores and standings update as songs are played.',
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
      'We track the setlist stories that help you make better picks—most-played songs, bustouts, and gap highlights for each Phish tour.',
      'Stats refresh every night the band plays live. Playing the game unlocks your personal stats as you rack up points against other setlist pickers.',
      'We\'re starting with Phish and building toward more bands soon. This page focuses on tour-wide song trends—not a full night-by-night setlist archive.',
    ],
    buildJsonLd: buildTourStatsHubJsonLd,
  },
  {
    path: '/tour-stats/2026-sphere',
    title: TOUR_STATS_SPHERE_TITLE,
    description: TOUR_STATS_SPHERE_DESCRIPTION,
    canonicalUrl: TOUR_STATS_SPHERE_URL,
    h1: '2026 Sphere tour stats',
    paragraphs: [
      'Most-played songs, bustouts, and gap highlights from the 2026 Sphere run—the inaugural Setlist Pick \'Em tour.',
      'Stats refresh every night the band plays live, so the picture keeps getting sharper as you make picks.',
      'Tour-wide song trends for fans—play the game to unlock personal stats as you compete.',
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
      "Setlist Pick'Em (also called Setlist Pickem) is a live setlist prediction game built first for Phish fans—and designed for more bands soon.",
      'Predict songs and slots for tonight\'s show, compete with friends, and score live as the setlist unfolds.',
      'Tour stats refresh every night the band plays live. Playing unlocks personal stats as you accumulate points against other setlist pickers.',
    ],
    buildJsonLd: buildKeywordIntentPageJsonLd,
  },
];

export function getPrerenderRoute(path) {
  return PRERENDER_ROUTES.find((r) => r.path === path) ?? null;
}
