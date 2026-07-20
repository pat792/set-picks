import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { MarketingPageShell } from '../../features/landing';
import {
  PublicTourStatsPanel,
  trackPublicTourStatsView,
  usePublicTourStatsScreen,
} from '../../features/tour-stats';
import { SEO_CONFIG } from '../../shared/config/seo';
import { getPrerenderRoute } from '../../shared/config/seoRoutes';
import { ensureAppCheckNow } from '../../shared/lib/firebaseAppCheck';

export default function PublicTourStatsPage() {
  // Public Firestore reads need App Check before first getDoc (#665 localhost race).
  useEffect(() => {
    ensureAppCheckNow();
  }, []);

  const screen = usePublicTourStatsScreen();
  const route = screen.routeHasSlug
    ? getPrerenderRoute(`/tour-stats/${screen.activeSlug}`) ||
      getPrerenderRoute('/tour-stats')
    : getPrerenderRoute('/tour-stats') ||
      getPrerenderRoute(`/tour-stats/${screen.activeSlug}`);

  useEffect(() => {
    if (!screen.activeSlug || screen.statsLoading) return;
    trackPublicTourStatsView({ tourSlug: screen.activeSlug });
  }, [screen.activeSlug, screen.statsLoading]);

  const title = route?.title || `Tour stats | ${SEO_CONFIG.siteName}`;
  const description =
    route?.description ||
    'Phish tour setlist stats — most-played songs, bustouts, and gap highlights. Updated every night the band plays live.';
  const canonical =
    route?.canonicalUrl ||
    `${SEO_CONFIG.siteUrl}/tour-stats/${screen.activeSlug}`;
  const jsonLd = route?.buildJsonLd?.() || {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: canonical,
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="author" content={SEO_CONFIG.publisherName} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={SEO_CONFIG.ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={SEO_CONFIG.ogImageUrl} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <MarketingPageShell>
        <PublicTourStatsPanel
          tours={screen.tours}
          activeSlug={screen.activeSlug}
          tourName={screen.tourName}
          hasTour={screen.hasTour}
          indexLoading={screen.indexLoading}
          statsLoading={screen.statsLoading}
          error={screen.error}
          stats={screen.stats}
          onSelectTour={screen.selectTour}
        />
      </MarketingPageShell>
    </>
  );
}
