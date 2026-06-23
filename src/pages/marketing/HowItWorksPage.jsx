import React from 'react';
import { Helmet } from 'react-helmet-async';

import { HowItWorksPageContent, MarketingPageShell } from '../../features/landing';
import { SEO_CONFIG } from '../../shared/config/seo';

const PAGE_TITLE = "How to Play Setlist Pick\'Em | The Live Music Prediction Game";
const PAGE_DESCRIPTION =
  "Learn how Setlist Pick\'Em works: lock your song picks before showtime, score points for openers, closers, encore, and wildcard predictions, and compete live on the leaderboard.";
const CANONICAL_URL = `${SEO_CONFIG.siteUrl}/how-it-works`;

const HOW_IT_WORKS_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': CANONICAL_URL,
      url: CANONICAL_URL,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
    },
    {
      '@type': 'HowTo',
      name: "How to play Setlist Pick\'Em",
      description: PAGE_DESCRIPTION,
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Lock It In', text: 'Pick openers, closers, encore, and a wildcard before showtime. Earn points for correct picks, higher points for exact slot picks, plus a Bustout Boost for calling longshots.' },
        { '@type': 'HowToStep', position: 2, name: 'Watch It Unfold', text: "Live scores and standings update in real-time as songs are played. See your picks and everyone else's light up the leaderboard." },
        { '@type': 'HowToStep', position: 3, name: 'Claim the Crown', text: 'Challenge friends in private pools and compete in global standings with everyone playing that night.' },
      ],
    },
  ],
};

export default function HowItWorksPage() {
  return (
    <>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="author" content={SEO_CONFIG.publisherName} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL_URL} />
        <meta property="og:image" content={SEO_CONFIG.ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Setlist Pick \'Em — live setlist prediction game" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={SEO_CONFIG.ogImageUrl} />
        <link rel="canonical" href={CANONICAL_URL} />
        <script type="application/ld+json">{JSON.stringify(HOW_IT_WORKS_JSON_LD)}</script>
      </Helmet>
      <MarketingPageShell>
        <HowItWorksPageContent />
      </MarketingPageShell>
    </>
  );
}
