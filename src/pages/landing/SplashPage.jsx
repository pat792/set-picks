import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  SplashAuthModals,
  SplashPageShell,
  useScrollToSectionFocus,
} from '../../features/landing';

export default function Splash() {
  const [authModal, setAuthModal] = useState(null);
  const closeModal = useCallback(() => setAuthModal(null), []);
  const openSignUpModal = useCallback(() => setAuthModal('signup'), []);
  const openSignInModal = useCallback(() => setAuthModal('signin'), []);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const didHandleLoginFlagRef = useRef(false);
  const {
    howItWorksSectionRef,
    howItWorksHeadingRef,
    getStartedSectionRef,
    getStartedHeadingRef,
    aboutSectionRef,
    aboutHeadingRef,
    handleScrollToHowItWorks,
    handleScrollToGetStarted,
    handleScrollToAbout,
    handleCreateAccountFromHowItWorks,
  } = useScrollToSectionFocus({ onCreateAccountRequest: openSignUpModal });

  useEffect(() => {
    if (didHandleLoginFlagRef.current) return;
    const flag = searchParams.get('login');
    if (flag !== 'true') return;

    didHandleLoginFlagRef.current = true;
    openSignInModal();
    // Clear the flag so refresh doesn't re-open the modal.
    navigate('/', { replace: true });
  }, [navigate, openSignInModal, searchParams]);

  return (
    <>
      <SplashPageShell
        howItWorksSectionRef={howItWorksSectionRef}
        howItWorksHeadingRef={howItWorksHeadingRef}
        getStartedSectionRef={getStartedSectionRef}
        getStartedHeadingRef={getStartedHeadingRef}
        aboutSectionRef={aboutSectionRef}
        aboutHeadingRef={aboutHeadingRef}
        onScrollToHowItWorks={handleScrollToHowItWorks}
        onScrollToGetStarted={handleScrollToGetStarted}
        onScrollToAbout={handleScrollToAbout}
        onCreateAccountFromHowItWorks={handleCreateAccountFromHowItWorks}
        onOpenSignUpModal={openSignUpModal}
        onOpenSignInModal={openSignInModal}
      />
      <SplashAuthModals authModal={authModal} closeModal={closeModal} />
    </>
  );
}