import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  OpenInBrowserBanner,
  consumeSplashResumeAuthModal,
  useGoogleRedirectCompletion,
} from '../../features/auth';
import { SplashPageShell, useScrollToSectionFocus } from '../../features/landing';
import { SplashAuthModals } from '../../features/landing/auth-modals';
import { ScoringRulesModalProvider } from '../../features/scoring';
import { POOL_INVITE_STORAGE_KEY } from '../../shared/config/poolInvite';
import { getLocalStorageItem } from '../../shared/lib/local-storage';

/** Dedupes Strict Mode double-invoke / rapid re-renders for the deferred-invite prompt. */
let lastDeferredPoolInvitePromptAt = 0;

export default function Splash() {
  const [authModal, setAuthModal] = useState(null);
  const [redirectAuthError, setRedirectAuthError] = useState('');
  const closeModal = useCallback(() => setAuthModal(null), []);
  const openSignUpModal = useCallback(() => setAuthModal('signup'), []);
  const openSignInModal = useCallback(() => setAuthModal('signin'), []);
  const onRedirectError = useCallback((message, intent) => {
    setRedirectAuthError(message || '');
    if (intent === 'signup') setAuthModal('signup');
    else setAuthModal('signin');
  }, []);
  useGoogleRedirectCompletion({
    onOpenSignIn: openSignInModal,
    onOpenSignUp: openSignUpModal,
    onError: onRedirectError,
  });
  /** Invite is stored before splash mounts; seed once for modal join-context copy. */
  const [poolInvitePending] = useState(
    () => Boolean(getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim()),
  );

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const didHandleLoginFlagRef = useRef(false);
  /** One-shot bootstrap for resume-from-legal + pool-invite (Strict Mode safe). */
  const splashResumeAndInviteRef = useRef(false);
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
  } = useScrollToSectionFocus({ onCreateAccountRequest: openSignUpModal });

  useEffect(() => {
    if (didHandleLoginFlagRef.current) return;
    const flag = searchParams.get('login');
    if (flag !== 'true') return;

    didHandleLoginFlagRef.current = true;
    // #832: auth lives on `/login` (app document). Keep `?login=true` as a
    // compatibility hop until outbound links are retargeted (#830).
    const signup = searchParams.get('signup') === '1';
    navigate(signup ? '/login?mode=signup' : '/login', { replace: true });
  }, [navigate, searchParams]);

  useEffect(() => {
    if (splashResumeAndInviteRef.current) return;
    splashResumeAndInviteRef.current = true;

    const resume = consumeSplashResumeAuthModal();
    if (resume) {
      setAuthModal(resume);
      return;
    }

    // Returning / QA deep links keep Sign in; do not overwrite with Create account.
    if (searchParams.get('login') === 'true') return;

    if (!poolInvitePending) return;
    const now = Date.now();
    if (now - lastDeferredPoolInvitePromptAt < 600) return;
    lastDeferredPoolInvitePromptAt = now;
    // Create account first so new Google joiners get the legal checkbox (#577 / #406).
    openSignUpModal();
  }, [openSignUpModal, poolInvitePending, searchParams]);

  return (
    <ScoringRulesModalProvider>
      <OpenInBrowserBanner />
      <SplashPageShell
        howItWorksSectionRef={howItWorksSectionRef}
        howItWorksHeadingRef={howItWorksHeadingRef}
        getStartedSectionRef={getStartedSectionRef}
        getStartedHeadingRef={getStartedHeadingRef}
        aboutSectionRef={aboutSectionRef}
        aboutHeadingRef={aboutHeadingRef}
        onScrollToGetStarted={handleScrollToGetStarted}
        onCreateAccountFromHowItWorks={handleCreateAccountFromHowItWorks}
        onOpenSignUpModal={openSignUpModal}
        onOpenSignInModal={openSignInModal}
      />
      <SplashAuthModals
        authModal={authModal}
        closeModal={closeModal}
        onSwitchToSignIn={openSignInModal}
        onSwitchToSignUp={openSignUpModal}
        poolInvitePending={poolInvitePending}
        redirectAuthError={redirectAuthError}
        onClearRedirectAuthError={() => setRedirectAuthError('')}
      />
    </ScoringRulesModalProvider>
  );
}