import React from 'react';
import { Helmet } from 'react-helmet-async';

import { SEO_CONFIG } from '../../../shared/config/seo.js';

const LANDING_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: "Setlist Pick'em",
      applicationCategory: 'GameApplication',
      operatingSystem: 'WebBrowser',
      description:
        'The ultimate live music prediction game. Fans predict setlists to score points and climb global and private leaderboards.',
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
  ],
};

const canonicalUrl = `${SEO_CONFIG.siteUrl}/`;

export default function LandingSeo() {
  return (
    <Helmet>
      <title>{SEO_CONFIG.defaultTitle}</title>
      <meta name="description" content={SEO_CONFIG.defaultDescription} />
      <meta property="og:title" content={SEO_CONFIG.defaultTitle} />
      <meta property="og:description" content={SEO_CONFIG.defaultDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json">{JSON.stringify(LANDING_JSON_LD)}</script>
    </Helmet>
  );
}
