import React from 'react';

import {
  LandingSeo,
  MarketingAuthLeaveOverlay,
  SplashPageShell,
  useMarketingAuthLeave,
  useScrollToSectionFocus,
} from '../../features/landing/splash';

/**
 * Marketing-document splash (#832). Same shell/UI as the app Landing splash,
 * but auth CTAs hard-navigate to `/login` instead of a mid-page chooser.
 */
export default function MarketingHomePage() {
  const { leaving, openSignUp, openSignIn, onAuthCtaIntent } =
    useMarketingAuthLeave();

  const {
    howItWorksSectionRef,
    howItWorksHeadingRef,
    aboutSectionRef,
    aboutHeadingRef,
  } = useScrollToSectionFocus();

  return (
    <>
      <LandingSeo />
      <SplashPageShell
        howItWorksSectionRef={howItWorksSectionRef}
        howItWorksHeadingRef={howItWorksHeadingRef}
        aboutSectionRef={aboutSectionRef}
        aboutHeadingRef={aboutHeadingRef}
        onOpenSignUp={openSignUp}
        onOpenSignIn={openSignIn}
        onAuthCtaIntent={onAuthCtaIntent}
      />
      {leaving ? <MarketingAuthLeaveOverlay /> : null}
    </>
  );
}
