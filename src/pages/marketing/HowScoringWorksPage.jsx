import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import { ScoringRulesContent } from '../../features/scoring';
import { MarketingPageShell } from '../../features/landing';
import { SEO_CONFIG } from '../../shared/config/seo';
import { getPrerenderRoute } from '../../shared/config/seoRoutes';
import { LINK_ON_LIGHT } from '../../shared/ui/surfaceLinkStyles';

const route = getPrerenderRoute('/how-scoring-works');

export default function HowScoringWorksPage() {
  const jsonLd = route.buildJsonLd();
  return (
    <>
      <Helmet>
        <title>{route.title}</title>
        <meta name="description" content={route.description} />
        <meta name="author" content={SEO_CONFIG.publisherName} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={route.title} />
        <meta property="og:description" content={route.description} />
        <meta property="og:url" content={route.canonicalUrl} />
        <meta property="og:image" content={SEO_CONFIG.ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Setlist Pick 'Em — live setlist prediction game" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={route.title} />
        <meta name="twitter:description" content={route.description} />
        <meta name="twitter:image" content={SEO_CONFIG.ogImageUrl} />
        <link rel="canonical" href={route.canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <MarketingPageShell>
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <ScoringRulesContent />
          <p className="mt-10 text-center text-sm leading-relaxed text-slate-500">
            Next:{' '}
            <Link to="/how-it-works" className={LINK_ON_LIGHT}>
              how it works
            </Link>
            , browse{' '}
            <Link to="/tour-stats" className={LINK_ON_LIGHT}>
              tour stats
            </Link>
            , or{' '}
            <Link to="/" className={LINK_ON_LIGHT}>
              start playing
            </Link>
            .
          </p>
        </div>
      </MarketingPageShell>
    </>
  );
}
