import React from 'react';
import { Helmet } from 'react-helmet-async';

import { SEO_CONFIG } from '../../../shared/config/seo.js';
import { getPrerenderRoute } from '../../../shared/config/seoRoutes.js';

const route = getPrerenderRoute('/');

export default function LandingSeo() {
  const jsonLd = route.buildJsonLd();
  return (
    <Helmet>
      <title>{route.title}</title>
      <meta name="description" content={route.description} />
      <meta name="author" content={SEO_CONFIG.publisherName} />
      <meta property="og:site_name" content={SEO_CONFIG.siteName} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={route.title} />
      <meta property="og:description" content={route.description} />
      <meta property="og:url" content={route.canonicalUrl} />
      <meta property="og:image" content={SEO_CONFIG.ogImageUrl} />
      <meta property="og:image:secure_url" content={SEO_CONFIG.ogImageUrl} />
      <meta property="og:image:type" content={SEO_CONFIG.ogImageType} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="Setlist Pick 'Em — live setlist prediction game"
      />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={route.title} />
      <meta name="twitter:description" content={route.description} />
      <meta name="twitter:image" content={SEO_CONFIG.ogImageUrl} />
      <link rel="canonical" href={route.canonicalUrl} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
