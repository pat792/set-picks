import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  SplashPageShell,
  useScrollToSectionFocus,
} from '../../features/landing/marketing';

/**
 * Marketing-entry splash (#832) — same UI as SplashPageShell, but auth CTAs
 * hard-navigate to the Firebase `/login` app entry (no AuthProvider / modals).
 */
export default function MarketingSplashPage() {
  const [searchParams] = useSearchParams();

  const goLogin = useCallback((mode) => {
    const q = mode === 'signup' ? '?mode=signup' : mode === 'signin' ? '?mode=signin' : '';
    // Full navigation into the app HTML shell so Firebase can load.
    window.location.assign(`/login${q}`);
  }, []);

  // Legacy deep link used by password-reset / QA — retarget to /login.
  React.useEffect(() => {
    if (searchParams.get('login') === 'true') {
      window.location.replace('/login?mode=signin');
    }
  }, [searchParams]);

  const {
    howItWorksSectionRef,
    howItWorksHeadingRef,
    getStartedSectionRef,
    getStartedHeadingRef,
    aboutSectionRef,
    aboutHeadingRef,
    handleScrollToGetStarted,
    handleScrollToAbout,
    handleCreateAccountFromHowItWorks,
  } = useScrollToSectionFocus({
    onCreateAccountRequest: () => goLogin('signup'),
  });

  return (
    <SplashPageShell
      howItWorksSectionRef={howItWorksSectionRef}
      howItWorksHeadingRef={howItWorksHeadingRef}
      getStartedSectionRef={getStartedSectionRef}
      getStartedHeadingRef={getStartedHeadingRef}
      aboutSectionRef={aboutSectionRef}
      aboutHeadingRef={aboutHeadingRef}
      onScrollToGetStarted={handleScrollToGetStarted}
      onCreateAccountFromHowItWorks={handleCreateAccountFromHowItWorks}
      onOpenSignUpModal={() => goLogin('signup')}
      onOpenSignInModal={() => goLogin('signin')}
    />
  );
}
