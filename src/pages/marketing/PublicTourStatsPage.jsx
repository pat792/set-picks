import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import { MarketingPageShell } from '../../features/landing';
import {
  PublicTourStatsPanel,
  trackPublicTourStatsView,
  usePublicTourStatsScreen,
} from '../../features/tour-stats/public';
import { SEO_CONFIG } from '../../shared/config/seo';
import { getPrerenderRoute } from '../../shared/config/seoRoutes';

/**
 * Public `/tour-stats*` — marketing document (#853 / #869).
 * Chrome paints without AuthProvider. Aggregates load from CDN JSON / Firestore
 * REST — do **not** kick App Check here (Safari data-gate). SDK is last resort
 * inside `fetchPublicTourStats*` only.
 */
export default function PublicTourStatsPage() {
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

  const title =
    route?.title ||
    (screen.tourName
      ? `${screen.tourName} Setlist Statistics | ${SEO_CONFIG.siteName}`
      : `Phish Tour Statistics & Insights | ${SEO_CONFIG.siteName}`);
  const description =
    route?.description ||
    (screen.tourName
      ? `Tour Insights for ${screen.tourName}: setlist statistics, most-played songs, bustouts, and gap highlights. Updated every night the band plays live.`
      : 'Tour Insights: the latest Phish tour setlist statistics—most-played songs, bustouts by tour, and gap highlights. Updated every night the band plays live.');
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

  // Prefer registry H1 when the slug is SEO'd (#927) so Sphere/Summer paint
  // tour-specific titles before Firestore doc load. Fall back to live label.
  const heading =
    route?.h1 ||
    (screen.tourName && screen.tourName !== screen.activeSlug
      ? `${screen.tourName} setlist statistics`
      : 'Phish tour setlist statistics');

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
          heading={heading}
          hasTour={screen.hasTour}
          indexLoading={screen.indexLoading}
          statsLoading={screen.statsLoading}
          error={screen.error}
          stats={screen.stats}
          onSelectTour={screen.selectTour}
          routeHasSlug={screen.routeHasSlug}
          defaultTourSlug={screen.defaultTourSlug}
        />
      </MarketingPageShell>
    </>
  );
}
