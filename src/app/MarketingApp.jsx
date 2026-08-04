import React, { lazy } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import { registerRouteChunkLoaders } from '../shared/lib/routeChunkPrefetch';

import MarketingRootShell from './layout/MarketingRootShell';

// Marketing cold-open graph (#832): no AuthProvider / firebase. Auth CTAs
// hard-navigate to `/login` on the app entry (see vite middleware + vercel.json).
const loadMarketingHome = () => import('../pages/landing/MarketingLandingPage');

registerRouteChunkLoaders({
  marketingHome: loadMarketingHome,
});

const MarketingLandingPage = lazy(loadMarketingHome);
const HowItWorksPage = lazy(() => import('../pages/marketing/HowItWorksPage'));
const HowScoringWorksPage = lazy(() => import('../pages/marketing/HowScoringWorksPage'));
const PublicTourStatsPage = lazy(() => import('../pages/marketing/PublicTourStatsPage'));
const PhishSetlistPredictionGamePage = lazy(
  () => import('../pages/marketing/PhishSetlistPredictionGamePage'),
);
const PrivacyPolicyPage = lazy(() => import('../pages/legal/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('../pages/legal/TermsOfServicePage'));

function MarketingApp() {
  return (
    <Routes>
      <Route element={<MarketingRootShell />}>
        <Route path="/" element={<MarketingLandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/how-scoring-works" element={<HowScoringWorksPage />} />
        <Route path="/tour-stats" element={<PublicTourStatsPage />} />
        <Route path="/tour-stats/:tourSlug" element={<PublicTourStatsPage />} />
        <Route
          path="/phish-setlist-prediction-game"
          element={<PhishSetlistPredictionGamePage />}
        />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default MarketingApp;
