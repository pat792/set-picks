import React, { useCallback } from 'react';

import {
  LandingSeo,
  SplashPageShell,
  useScrollToSectionFocus,
} from '../../features/landing/splash';

function goLogin({ signup = false } = {}) {
  window.location.assign(signup ? '/login?mode=signup' : '/login');
}

/**
 * Marketing-document splash (#832). Same shell/UI as the app Landing splash,
 * but auth CTAs hard-navigate to `/login` instead of a mid-page chooser.
 */
export default function MarketingHomePage() {
  const openSignUp = useCallback(() => goLogin({ signup: true }), []);
  const openSignIn = useCallback(() => goLogin(), []);

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
      />
    </>
  );
}
