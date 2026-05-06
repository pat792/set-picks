import React from 'react';
import { Helmet } from 'react-helmet-async';

import { SEO_CONFIG } from '../../../shared/config/seo.js';

const canonicalUrl = `${SEO_CONFIG.siteUrl}/`;

/** FAQ copy aligned with splash / `ScoringRulesContent.jsx` and `src/shared/utils/scoring.js`. */
const LANDING_FAQ_MAIN_ENTITY = [
  {
    '@type': 'Question',
    name: "What is Setlist Pick 'Em?",
    acceptedAnswer: {
      '@type': 'Answer',
      text: "Setlist Pick 'Em is a free live setlist prediction game for Phish fans. Pick openers, closers, encore, and a wildcard before each show; scores update in real time as songs are played. Compete in a global pool or create private pools with friends.",
    },
  },
  {
    '@type': 'Question',
    name: 'How does scoring work?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Picks earn points by how they match the official setlist. In setlist (song played, wrong slot): 5 points. Exact slot (set opener or closer you called): 10 points. Wildcard (song played anywhere in the show): 10 points. Encore: 15 points. Bustout Boost adds 20 bonus points on top of the base score when the song had a gap of 30 or more shows since it was last played.',
    },
  },
  {
    '@type': 'Question',
    name: 'How do I play with friends?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: "Create a private pool and share your invite link, or compete on the global leaderboard alongside other fans.",
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
      text: 'Correct picks on bustout songs—those with a 30+ show gap before the show—earn 20 extra points on top of the base points for that outcome (in setlist, exact slot, wildcard, or encore).',
    },
  },
];

const LANDING_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: "Setlist Pick'em",
      applicationCategory: 'GameApplication',
      operatingSystem: 'WebBrowser',
      description: SEO_CONFIG.defaultDescription,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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

export default function LandingSeo() {
  return (
    <Helmet>
      <title>{SEO_CONFIG.defaultTitle}</title>
      <meta name="description" content={SEO_CONFIG.defaultDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={SEO_CONFIG.defaultTitle} />
      <meta property="og:description" content={SEO_CONFIG.defaultDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={SEO_CONFIG.ogImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="Setlist Pick 'Em — live setlist prediction game"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SEO_CONFIG.defaultTitle} />
      <meta name="twitter:description" content={SEO_CONFIG.defaultDescription} />
      <meta name="twitter:image" content={SEO_CONFIG.ogImageUrl} />
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json">{JSON.stringify(LANDING_JSON_LD)}</script>
    </Helmet>
  );
}
