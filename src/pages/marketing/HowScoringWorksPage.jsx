import React from 'react';
import { Helmet } from 'react-helmet-async';

import { ScoringRulesContent } from '../../features/scoring';
import { MarketingPageShell } from '../../features/landing';
import { SEO_CONFIG } from '../../shared/config/seo';
import { SCORING_RULES } from '../../shared/utils/scoring';

const {
  EXACT_SLOT,
  ENCORE_EXACT,
  IN_SETLIST,
  WILDCARD_HIT,
  BUSTOUT_BOOST,
  BUSTOUT_MIN_GAP,
} = SCORING_RULES;

const PAGE_TITLE = "How Scoring Works | Setlist Pick\'Em";
const PAGE_DESCRIPTION = `Setlist Pick\'Em scoring guide: In setlist (${IN_SETLIST} pts), exact slot (${EXACT_SLOT} pts), wildcard (${WILDCARD_HIT} pts), encore (${ENCORE_EXACT} pts), plus a Bustout Boost of ${BUSTOUT_BOOST} points for songs with a ${BUSTOUT_MIN_GAP}+ show gap.`;
const CANONICAL_URL = `${SEO_CONFIG.siteUrl}/how-scoring-works`;

const HOW_SCORING_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebPage', '@id': CANONICAL_URL, url: CANONICAL_URL, name: PAGE_TITLE, description: PAGE_DESCRIPTION, isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` } },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'How many points do I get for an in-setlist pick?', acceptedAnswer: { '@type': 'Answer', text: `If your pick is played anywhere in the setlist but not in the exact slot you chose, you earn ${IN_SETLIST} points.` } },
        { '@type': 'Question', name: 'How many points for an exact slot pick?', acceptedAnswer: { '@type': 'Answer', text: `If your pick lands in the exact slot you selected (Set 1 opener/closer or Set 2 opener/closer), you earn ${EXACT_SLOT} points.` } },
        { '@type': 'Question', name: 'How many points for the wildcard?', acceptedAnswer: { '@type': 'Answer', text: `If your wildcard pick is played anywhere in the show, you earn ${WILDCARD_HIT} points.` } },
        { '@type': 'Question', name: 'How many points for an encore pick?', acceptedAnswer: { '@type': 'Answer', text: `If your pick is played during the encore, you earn ${ENCORE_EXACT} points — the highest base score because the encore is the toughest call.` } },
        { '@type': 'Question', name: 'What is the Bustout Boost?', acceptedAnswer: { '@type': 'Answer', text: `Correct picks on songs with a ${BUSTOUT_MIN_GAP}+ show gap earn a bonus ${BUSTOUT_BOOST} points on top of base points — rewarding strategic picks over heavy rotation songs.` } },
      ],
    },
  ],
};

export default function HowScoringWorksPage() {
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
        <script type="application/ld+json">{JSON.stringify(HOW_SCORING_JSON_LD)}</script>
      </Helmet>
      <MarketingPageShell>
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <ScoringRulesContent />
        </div>
      </MarketingPageShell>
    </>
  );
}
