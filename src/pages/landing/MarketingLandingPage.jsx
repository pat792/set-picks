import React from 'react';

import { LandingSeo } from '../../features/landing/marketing';

import MarketingSplashPage from './MarketingSplashPage';

/** Public home for the marketing Vite entry (#832) — no AuthProvider. */
export default function MarketingLandingPage() {
  return (
    <>
      <LandingSeo />
      <MarketingSplashPage />
    </>
  );
}
