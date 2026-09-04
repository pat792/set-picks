import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

import {
  AppDocumentAuthLink,
  MarketingIphoneFigure,
  MarketingPageShell,
} from '../../features/landing';
import { ScoringRulesContent } from '../../features/scoring/marketing';
import { SEO_CONFIG } from '../../shared/config/seo';
import { getPrerenderRoute } from '../../shared/config/seoRoutes';
import {
  MARKETING_EDITORIAL_ARTICLE,
  MARKETING_EDITORIAL_COLUMN,
  MARKETING_EDITORIAL_H1,
  MARKETING_EDITORIAL_LEDE,
  MARKETING_EDITORIAL_META,
} from '../../shared/ui/marketingEditorialChrome';
import { LINK_ON_LIGHT } from '../../shared/ui/surfaceLinkStyles';

const route = getPrerenderRoute('/how-scoring-works');

const SCORING_SAMPLE_SRC =
  '/images/marketing/scoring-standings-iphone-sample.png';

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
        <article className={MARKETING_EDITORIAL_ARTICLE}>
          <div className={MARKETING_EDITORIAL_COLUMN}>
            <h1 className={MARKETING_EDITORIAL_H1}>How scoring works</h1>
            <p className={MARKETING_EDITORIAL_LEDE}>
              Picks earn points based on where they land in the setlist. Live scoring feeds
              nightly standings.
            </p>
            <ScoringRulesContent surface="light" includeIntro={false} />
            <MarketingIphoneFigure
              className="mt-12"
              src={SCORING_SAMPLE_SRC}
              alt="iPhone showing a Setlist Pick 'Em standings card with scored picks — In setlist, Bustout Boost, Wildcard hit, and points. Player handle blurred."
              caption="Sample standings card after the show — exact slots, in-setlist hits, Wildcard, and Bustout Boost™ stacking into the night’s score."
            />
            <p className={`mt-10 text-center ${MARKETING_EDITORIAL_META}`}>
              Next:{' '}
              <Link to="/how-it-works" className={LINK_ON_LIGHT}>
                how it works
              </Link>
              , browse{' '}
              <Link to="/tour-stats" className={LINK_ON_LIGHT}>
                tour stats
              </Link>
              , or{' '}
              <AppDocumentAuthLink signup className={LINK_ON_LIGHT}>
                start playing
              </AppDocumentAuthLink>
              .
            </p>
          </div>
        </article>
      </MarketingPageShell>
    </>
  );
}
