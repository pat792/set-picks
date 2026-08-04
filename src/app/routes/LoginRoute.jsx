import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import {
  OpenInBrowserBanner,
  isSplashGoogleModalInflight,
  SPLASH_GOOGLE_MODAL_STORAGE_EVENT,
  useAuth,
  useGoogleRedirectCompletion,
} from '../../features/auth';
import { SplashAuthModals } from '../../features/landing/authModals';
import { POOL_INVITE_STORAGE_KEY } from '../../shared/config/poolInvite';
import {
  BRAND_SPLASH_HEADER_VINYL_MARK_SRC,
  brandSplashHeaderVinylMarkImgClassNames,
} from '../../shared/config/branding';
import { SEO_CONFIG } from '../../shared/config/seo';
import { getDashboardEntryHref } from '../../shared/lib/dashboardLastPath';
import { getLocalStorageItem } from '../../shared/lib/local-storage';
import Button from '../../shared/ui/Button';

/**
 * App-entry auth surface (#832) — Firebase / AuthProvider allowed.
 * Marketing CTAs hard-navigate here so public pages stay Firebase-free.
 */
export default function LoginRoute() {
  const { user, loading, isAdmin: isAdminUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [, bump] = useState(0);

  const modeParam = searchParams.get('mode');
  const initialModal =
    modeParam === 'signup' ? 'signup' : modeParam === 'signin' ? 'signin' : 'signin';

  const [authModal, setAuthModal] = useState(initialModal);
  const [redirectAuthError, setRedirectAuthError] = useState('');
  const [poolInvitePending] = useState(
    () => Boolean(getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim()),
  );

  const closeModal = useCallback(() => setAuthModal(null), []);
  const openSignUpModal = useCallback(() => {
    setAuthModal('signup');
    setSearchParams({ mode: 'signup' }, { replace: true });
  }, [setSearchParams]);
  const openSignInModal = useCallback(() => {
    setAuthModal('signin');
    setSearchParams({ mode: 'signin' }, { replace: true });
  }, [setSearchParams]);

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

  useEffect(() => {
    const onInflight = () => bump((n) => n + 1);
    window.addEventListener(SPLASH_GOOGLE_MODAL_STORAGE_EVENT, onInflight);
    return () => window.removeEventListener(SPLASH_GOOGLE_MODAL_STORAGE_EVENT, onInflight);
  }, []);

  // Keep modal open by default — login page's job is auth.
  useEffect(() => {
    if (!authModal) setAuthModal(initialModal);
  }, [authModal, initialModal]);

  if (!loading && user && !isSplashGoogleModalInflight()) {
    return <Navigate to={getDashboardEntryHref({ isAdminUser })} replace />;
  }

  return (
    <>
      <Helmet>
        <title>{`Sign in | ${SEO_CONFIG.siteName}`}</title>
        <meta name="robots" content="noindex,follow" />
      </Helmet>
      <OpenInBrowserBanner />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-4 py-16">
        <a href="/" className="mb-8 flex flex-col items-center gap-3">
          <img
            src={BRAND_SPLASH_HEADER_VINYL_MARK_SRC}
            alt={"Setlist Pick 'Em"}
            width={96}
            height={95}
            decoding="async"
            className={brandSplashHeaderVinylMarkImgClassNames}
          />
          <span className="font-display text-xl font-bold text-slate-100">
            Setlist Pick&apos;Em
          </span>
        </a>
        <p className="mb-6 text-center text-sm text-slate-400">
          Sign in or create a free account to lock picks and join pools.
        </p>
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            type="button"
            onClick={openSignUpModal}
            className="flex-1 px-4 py-4"
          >
            Create account
          </Button>
          <Button
            variant="glass"
            type="button"
            onClick={openSignInModal}
            className="flex-1 border-white/20 bg-white/5 px-4 py-4"
          >
            Sign in
          </Button>
        </div>
        <p className="mt-8 text-center text-xs text-slate-500">
          <a href="/" className="text-teal-400/90 underline-offset-2 hover:underline">
            Back to home
          </a>
        </p>
      </div>
      <SplashAuthModals
        authModal={authModal}
        closeModal={closeModal}
        onSwitchToSignIn={openSignInModal}
        onSwitchToSignUp={openSignUpModal}
        poolInvitePending={poolInvitePending}
        redirectAuthError={redirectAuthError}
        onClearRedirectAuthError={() => setRedirectAuthError('')}
      />
    </>
  );
}
