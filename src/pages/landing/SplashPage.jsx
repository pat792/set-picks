import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  OpenInBrowserBanner,
  consumeSplashResumeAuthModal,
  useGoogleRedirectCompletion,
} from '../../features/auth';
import { SplashPageShell, useScrollToSectionFocus } from '../../features/landing';
import { ScoringRulesModalProvider } from '../../features/scoring';
import { POOL_INVITE_STORAGE_KEY } from '../../shared/config/poolInvite';
import { getLocalStorageItem } from '../../shared/lib/local-storage';

/** Dedupes Strict Mode double-invoke / rapid re-renders for the deferred-invite handoff. */
let lastDeferredPoolInvitePromptAt = 0;

/**
 * App-document splash (#832 follow-up). Auth CTAs always go to `/login` —
 * same as marketing `MarketingHomePage`. Invite VIP keeps modals (#844).
 */
export default function Splash() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingRedirectErrorRef = useRef('');
  const didHandleLoginFlagRef = useRef(false);
  /** One-shot bootstrap for resume-from-legal + pool-invite (Strict Mode safe). */
  const splashResumeAndInviteRef = useRef(false);

  /** Invite is stored before splash mounts; seed once for /login join-context copy. */
  const [poolInvitePending] = useState(
    () => Boolean(getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim()),
  );

  const goLogin = useCallback(
    (mode = 'signin', { replace = false, seedError = '' } = {}) => {
      const path = mode === 'signup' ? '/login?mode=signup' : '/login';
      navigate(path, {
        replace,
        state: seedError ? { seedError } : {},
      });
    },
    [navigate],
  );

  const openSignUp = useCallback(() => goLogin('signup'), [goLogin]);
  const openSignIn = useCallback(() => goLogin('signin'), [goLogin]);

  useGoogleRedirectCompletion({
    onOpenSignIn: () => {
      const seedError = pendingRedirectErrorRef.current;
      pendingRedirectErrorRef.current = '';
      goLogin('signin', { replace: true, seedError });
    },
    onOpenSignUp: () => {
      const seedError = pendingRedirectErrorRef.current;
      pendingRedirectErrorRef.current = '';
      goLogin('signup', { replace: true, seedError });
    },
    onError: (message) => {
      pendingRedirectErrorRef.current = message || '';
    },
  });

  const {
    howItWorksSectionRef,
    howItWorksHeadingRef,
    aboutSectionRef,
    aboutHeadingRef,
  } = useScrollToSectionFocus();

  useEffect(() => {
    if (didHandleLoginFlagRef.current) return;
    const flag = searchParams.get('login');
    if (flag !== 'true') return;

    didHandleLoginFlagRef.current = true;
    // Compat hop: legacy `/?login=true` → `/login` (#830 / #832).
    const signup = searchParams.get('signup') === '1';
    goLogin(signup ? 'signup' : 'signin', { replace: true });
  }, [goLogin, searchParams]);

  useEffect(() => {
    if (splashResumeAndInviteRef.current) return;
    splashResumeAndInviteRef.current = true;

    const resume = consumeSplashResumeAuthModal();
    if (resume === 'signup' || resume === 'signin') {
      goLogin(resume, { replace: true });
      return;
    }

    // Returning / QA deep links keep Sign in; do not overwrite with Create account.
    if (searchParams.get('login') === 'true') return;

    if (!poolInvitePending) return;
    const now = Date.now();
    if (now - lastDeferredPoolInvitePromptAt < 600) return;
    lastDeferredPoolInvitePromptAt = now;
    // Create account first so new Google joiners get the legal checkbox (#577 / #406).
    goLogin('signup', { replace: true });
  }, [goLogin, poolInvitePending, searchParams]);

  return (
    <ScoringRulesModalProvider>
      <OpenInBrowserBanner />
      <SplashPageShell
        howItWorksSectionRef={howItWorksSectionRef}
        howItWorksHeadingRef={howItWorksHeadingRef}
        aboutSectionRef={aboutSectionRef}
        aboutHeadingRef={aboutHeadingRef}
        onOpenSignUp={openSignUp}
        onOpenSignIn={openSignIn}
      />
    </ScoringRulesModalProvider>
  );
}
