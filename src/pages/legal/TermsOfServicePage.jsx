import React from 'react';
import { Helmet } from 'react-helmet-async';

import {
  TermsOfServiceContent,
  peekAuthDoorResume,
} from '../../features/legal';
import { SEO_CONFIG } from '../../shared/config/seo';
import { getPrerenderRoute } from '../../shared/config/seoRoutes';

const route = getPrerenderRoute('/terms');

/** Soft-nav compat on app SPA; hard-nav cold open uses HTML-first legal door (#916). */
export default function TermsOfServicePage() {
  const jsonLd = route.buildJsonLd();
  const resumeKind = peekAuthDoorResume();
  return (
    <>
      <Helmet>
        <title>{route.title}</title>
        <meta name="description" content={route.description} />
        <meta name="author" content={SEO_CONFIG.publisherName} />
        <link rel="canonical" href={route.canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <TermsOfServiceContent resumeKind={resumeKind} />
    </>
  );
}
