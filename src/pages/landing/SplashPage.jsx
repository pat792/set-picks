import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  SplashAuthModals,
  SplashPageShell,
  useScrollToSectionFocus,
} from '../../features/landing';
import { ScoringRulesModalProvider } from '../../features/scoring';
import { POOL_INVITE_STORAGE_KEY } from '../../shared/config/poolInvite';
import { getLocalStorageItem } from '../../shared/lib/local-storage';
import { showSuccessToast } from '../../shared/ui/toast';

/** Dedupes Strict Mode double-invoke / rapid re-renders for the deferred-invite prompt. */
let lastDeferredPoolInvitePromptAt = 0;

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

  useEffect(() => {
    const pending = getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim();
    if (!pending) return;
    const now = Date.now();
    if (now - lastDeferredPoolInvitePromptAt < 600) return;
    lastDeferredPoolInvitePromptAt = now;
    showSuccessToast('Sign in or create an account to join the pool!');
    openSignInModal();
  }, [openSignInModal]);

  return (
    <ScoringRulesModalProvider>
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
    </ScoringRulesModalProvider>
  );
}