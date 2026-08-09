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

const HOW_IT_WORKS_TITLE = "How to Play Setlist Pick'Em | Show-Night Walkthrough";
const HOW_IT_WORKS_DESCRIPTION =
  "Lock picks before showtime, score live as the setlist unfolds, compete in pools or global standings, and unlock personal stats as you play. Free setlist prediction game—live with Phish today, more bands soon.";
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
            name: 'Lock your setlist card',
            text: 'Before showtime, lock six calls: Set 1 opener and closer, Set 2 opener and closer, encore, and wildcard. Exact slot hits score more; rare songs can trigger a Bustout Boost.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Follow the show-night timeline',
            text: 'Before the show, lock picks and peek at tour stats. During the show, scores and standings update as songs land. After the show, final grades and tour standings post.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Compete in pools or global standings',
            text: 'Invite friends to private pools for crew-only standings, or compete with everyone on the global board for the show and the tour. Same picks; different rivalries.',
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Unlock personal stats as you play',
            text: 'Public tour trends are open to everyone. Your picking average, Bustout Boost hits, and pick heatmaps unlock as you earn points and climb the board.',
          },
        ],
      },
    ],
  };
}

const HOW_SCORING_TITLE = "How Scoring Works | Setlist Pick'Em";
const HOW_SCORING_DESCRIPTION = `Setlist Pick'Em scoring guide: In setlist (${IN_SETLIST} pts), exact slot (${EXACT_SLOT} pts), wildcard (${WILDCARD_HIT} pts), encore (${ENCORE_EXACT} pts), plus a Bustout Boost of ${BUSTOUT_BOOST} points for songs with a ${BUSTOUT_MIN_GAP}+ show gap.`;
const HOW_SCORING_URL = `${SEO_CONFIG.siteUrl}/how-scoring-works`;

const TOUR_STATS_HUB_TITLE = "Phish Tour Statistics & Insights | Setlist Pick'Em";
const TOUR_STATS_HUB_DESCRIPTION =
  "Tour Insights: the latest Phish tour setlist statistics—most-played songs, bustouts by tour, and gap highlights. Updated every night the band plays live. Play Setlist Pick'Em to unlock personal stats.";
const TOUR_STATS_HUB_URL = `${SEO_CONFIG.siteUrl}/tour-stats`;

const TOUR_STATS_SPHERE_TITLE = "2026 Sphere Tour Statistics | Setlist Pick'Em";
const TOUR_STATS_SPHERE_DESCRIPTION =
  "2026 Sphere tour insights and setlist statistics—most-played songs, Sphere tour bustouts, and gap highlights from the inaugural Setlist Pick'Em tour. Updated after every live show night.";
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
            name: 'Tour Insights',
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
            name: 'Tour Insights',
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
  "Free Phish setlist prediction game and fantasy setlist picks—lock openers, closers, encore, and a wildcard before showtime, score live, and compete with friends. Built for jam bands; live with Phish today, more soon.";
const KEYWORD_PAGE_URL = `${SEO_CONFIG.siteUrl}${KEYWORD_PAGE_PATH}`;

const ABOUT_PATH = '/about';
const ABOUT_TITLE = "About Setlist Pick'Em | From Tour Ritual to Live Game";
const ABOUT_DESCRIPTION =
  "The origin of Setlist Pick'Em—a fan-made setlist prediction game that started on Phish tour in 2001 and grew from paper and spreadsheets into a live game for friends and crews. Phish first; more bands soon.";
const ABOUT_URL = `${SEO_CONFIG.siteUrl}${ABOUT_PATH}`;

const PRIVACY_TITLE = "Privacy Policy | Setlist Pick'Em";
const PRIVACY_DESCRIPTION =
  "Privacy Policy for Setlist Pick 'Em — what information we collect, why we collect it, and how you can manage it. Operated by Road2 Media, LLC.";
const PRIVACY_URL = `${SEO_CONFIG.siteUrl}/privacy`;

const TERMS_TITLE = "Terms of Service | Setlist Pick'Em";
const TERMS_DESCRIPTION =
  "Terms of Service for Setlist Pick 'Em — the free Phish setlist prediction game operated by Road2 Media, LLC. Entertainment only; no entry fees or cash prizes.";
const TERMS_URL = `${SEO_CONFIG.siteUrl}/terms`;

function buildLegalWebPageJsonLd({ url, title, description }) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: title,
        description,
        isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
      },
    ],
  };
}

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
            name: 'What is a setlist prediction game?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "A setlist prediction game—sometimes called a fantasy setlist game—asks you to call songs and where they land in the setlist before the show. You compete in private pools and on the global leaderboard while scores update live. Setlist Pick'Em is a free setlist picks game—live with Phish today, with more bands ahead.",
            },
          },
          {
            '@type': 'Question',
            name: 'Is Setlist Pick\'Em a fantasy setlist game?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Yes—if you mean predicting setlists before the show and competing on points. Lock openers, closers, encore, and a wildcard, then score live as songs are played. No spreadsheet required.",
            },
          },
          {
            '@type': 'Question',
            name: "How is Setlist Pick'Em different from a setlist archive?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Archives look back at what was played. Setlist Pick'Em is about the night ahead: make your setlist picks before showtime, score as songs land, and build personal stats as you compete with other fans.",
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
    h1: "Setlist Pick 'Em — the free Phish setlist prediction game (more bands soon)",
    paragraphs: [
      'The free Phish setlist prediction game — live on tour.',
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
      "Setlist Pick'Em is a free live setlist prediction game for Phish fans—and a home for more bands soon. Here's the show-night walkthrough: what you lock, how scoring moves, and where your crew ranks.",
      'Before the lights go down, lock six calls: Set 1 opener and closer, Set 2 opener and closer, encore, and wildcard. Exact slot hits score more; rare songs can trigger a Bustout Boost.',
      'Before the show, lock picks and peek at tour stats. During the show, scores update live. After the show, final grades and personal stats grow every night you play.',
      'Compete in private pools with friends or on global standings—same picks, different rivalries. Personal stats unlock as you earn points and climb the board.',
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
    h1: 'Phish tour setlist statistics',
    paragraphs: [
      'Tour Insights tracks Phish tour setlist statistics—most-played songs, bustouts by tour, and gap highlights that help you make better picks.',
      'Statistics refresh every night the band plays live. Playing the game unlocks your personal stats as you rack up points against other setlist pickers.',
      'We\'re starting with Phish and building toward more bands soon. This page focuses on tour-wide song trends—not a full night-by-night setlist archive.',
    ],
    buildJsonLd: buildTourStatsHubJsonLd,
  },
  {
    path: '/tour-stats/2026-sphere',
    title: TOUR_STATS_SPHERE_TITLE,
    description: TOUR_STATS_SPHERE_DESCRIPTION,
    canonicalUrl: TOUR_STATS_SPHERE_URL,
    h1: '2026 Sphere tour statistics',
    paragraphs: [
      'Tour Insights for the 2026 Sphere run—setlist statistics, most-played songs, Sphere tour bustouts, and gap highlights from the inaugural Setlist Pick \'Em tour.',
      'Statistics refresh every night the band plays live, so the picture keeps getting sharper as you make picks.',
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
      "Setlist Pick'Em is a free live setlist picks game for fans who love predicting setlists—built first for Phish, designed as a home for more bands soon.",
      'A setlist prediction game—sometimes called a fantasy setlist game—asks you to call songs and where they land in the setlist before the show.',
      'Tour stats refresh every night the band plays live. Playing unlocks personal stats as you accumulate points against other setlist pickers.',
    ],
    buildJsonLd: buildKeywordIntentPageJsonLd,
  },
  {
    path: ABOUT_PATH,
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    canonicalUrl: ABOUT_URL,
    h1: "About Setlist Pick'Em",
    paragraphs: [
      'Born on Phish tour in 2001—from paper picks to spreadsheets to a live setlist prediction game for friends and crews.',
      'Ryan M (Beaver), Glu, and Andy F shaped the ritual on the road; Pat later moved it from paper to a spreadsheet, then into Setlist Pick\'Em.',
      'Live with Phish today—building toward more bands soon. Read how it works or the Phish setlist prediction game definition.',
    ],
    buildJsonLd: () =>
      buildLegalWebPageJsonLd({
        url: ABOUT_URL,
        title: ABOUT_TITLE,
        description: ABOUT_DESCRIPTION,
      }),
  },
  {
    path: '/privacy',
    title: PRIVACY_TITLE,
    description: PRIVACY_DESCRIPTION,
    canonicalUrl: PRIVACY_URL,
    h1: 'Privacy Policy',
    paragraphs: [
      // Avoid early double-quotes — prerender HTML-escapes them to &quot; and
      // verify:seo-prerender checks the first 40 chars as a literal substring.
      "Setlist Pick 'Em privacy policy: operated by Road2 Media, LLC. This policy explains what information we collect, why we collect it, and how you can manage it.",
      'When you create an account we store the email address you sign up with (or that your Google account provides) and a display handle you choose.',
      'We retain your account and gameplay data for as long as your account is active. You can delete your account from your Profile page within the App.',
    ],
    buildJsonLd: () =>
      buildLegalWebPageJsonLd({
        url: PRIVACY_URL,
        title: PRIVACY_TITLE,
        description: PRIVACY_DESCRIPTION,
      }),
  },
  {
    path: '/terms',
    title: TERMS_TITLE,
    description: TERMS_DESCRIPTION,
    canonicalUrl: TERMS_URL,
    h1: 'Terms of Service',
    paragraphs: [
      "These Terms of Service govern your use of Setlist Pick 'Em, operated by Road2 Media, LLC. By creating an account or using the App you agree to these Terms.",
      "Setlist Pick 'Em is an entertainment platform where players predict setlists for live Phish concerts. This is strictly an entertainment product. There are no entry fees, no cash prizes, and no wagering or gambling of any kind.",
      'You must create an account to play. You are responsible for keeping your sign-in credentials secure. Each person may maintain one account.',
    ],
    buildJsonLd: () =>
      buildLegalWebPageJsonLd({
        url: TERMS_URL,
        title: TERMS_TITLE,
        description: TERMS_DESCRIPTION,
      }),
  },
];

export function getPrerenderRoute(path) {
  return PRERENDER_ROUTES.find((r) => r.path === path) ?? null;
}
