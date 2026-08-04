import React, { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useGoogleRedirectCompletion } from '../../auth';

import SplashAuthModals from './SplashAuthModals';

/**
 * App-shell auth entry for HTML-first public pages (#829).
 * Marketing CTAs link here so acquisition documents never boot Firebase.
 */
export default function LoginScreen() {
  const [searchParams] = useSearchParams();
  const initialModal = useMemo(() => {
    if (searchParams.get('signup') === '1' || searchParams.get('mode') === 'signup') {
      return 'signup';
    }
    return 'signin';
  }, [searchParams]);

  const [authModal, setAuthModal] = useState(initialModal);
  const [redirectAuthError, setRedirectAuthError] = useState('');

  const openSignInModal = useCallback(() => setAuthModal('signin'), []);
  const openSignUpModal = useCallback(() => setAuthModal('signup'), []);
  const closeModal = useCallback(() => setAuthModal(null), []);
  const onRedirectAuthError = useCallback((message, modal) => {
    setRedirectAuthError(message || '');
    setAuthModal(modal === 'signup' ? 'signup' : 'signin');
  }, []);

  useGoogleRedirectCompletion({
    onOpenSignIn: openSignInModal,
    onOpenSignUp: openSignUpModal,
    onError: onRedirectAuthError,
  });

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-brand-bg px-4 py-10 text-white">
      <div className="w-full max-w-md space-y-6 text-center">
        <Link to="/" className="inline-block text-2xl font-bold tracking-tight text-white">
          Setlist Pick&apos;em
        </Link>
        <p className="text-sm font-semibold text-content-secondary">
          {authModal === 'signup'
            ? 'Create a free account to lock picks and join pools.'
            : 'Sign in to continue to your dashboard.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-brand-bg"
            onClick={openSignUpModal}
          >
            Create account
          </button>
          <button
            type="button"
            className="rounded-xl border border-border-muted px-4 py-2.5 text-sm font-bold text-white"
            onClick={openSignInModal}
          >
            Sign in
          </button>
        </div>
        <p className="text-xs text-content-secondary">
          <Link to="/" className="font-semibold text-brand-primary">
            Back to home
          </Link>
        </p>
      </div>
      <SplashAuthModals
        authModal={authModal}
        closeModal={closeModal}
        onSwitchToSignIn={openSignInModal}
        onSwitchToSignUp={openSignUpModal}
        redirectAuthError={redirectAuthError}
        onClearRedirectAuthError={() => setRedirectAuthError('')}
      />
    </div>
  );
}
