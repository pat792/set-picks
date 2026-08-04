import React, { useCallback } from 'react';

import {
  LandingSeo,
  SplashPageShell,
  useScrollToSectionFocus,
} from '../../features/landing';

function goLogin({ signup = false } = {}) {
  window.location.assign(signup ? '/login?mode=signup' : '/login');
}

/**
 * Marketing-document splash (#832). Same shell/UI as the app Landing splash,
 * but auth CTAs hard-navigate to `/login` instead of opening Firebase modals.
 */
export default function MarketingHomePage() {
  const openSignUp = useCallback(() => goLogin({ signup: true }), []);
  const openSignIn = useCallback(() => goLogin(), []);

  const {
    howItWorksSectionRef,
    howItWorksHeadingRef,
    getStartedSectionRef,
    getStartedHeadingRef,
    aboutSectionRef,
    aboutHeadingRef,
    handleScrollToGetStarted,
    handleCreateAccountFromHowItWorks,
  } = useScrollToSectionFocus({ onCreateAccountRequest: openSignUp });

  return (
    <>
      <LandingSeo />
      <SplashPageShell
        howItWorksSectionRef={howItWorksSectionRef}
        howItWorksHeadingRef={howItWorksHeadingRef}
        getStartedSectionRef={getStartedSectionRef}
        getStartedHeadingRef={getStartedHeadingRef}
        aboutSectionRef={aboutSectionRef}
        aboutHeadingRef={aboutHeadingRef}
        onScrollToGetStarted={handleScrollToGetStarted}
        onCreateAccountFromHowItWorks={handleCreateAccountFromHowItWorks}
        onOpenSignUpModal={openSignUp}
        onOpenSignInModal={openSignIn}
      />
    </>
  );
}
