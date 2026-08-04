import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import {
  OpenInBrowserBanner,
  useAuth,
  useGoogleRedirectCompletion,
} from '../../features/auth';
import { SplashAuthModals } from '../../features/landing';
import { getDashboardEntryHref } from '../../shared/lib/dashboardLastPath';
import { POOL_INVITE_STORAGE_KEY } from '../../shared/config/poolInvite';
import { getLocalStorageItem } from '../../shared/lib/local-storage';

/**
 * Authenticated-SPA login surface (#832). Hosts the existing splash auth modals
 * on `/login` so marketing cold opens never pay Firebase until a CTA.
 */
export default function LoginPage() {
  const { user, isAdmin: isAdminUser, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const wantSignup = searchParams.get('signup') === '1';
  const [authModal, setAuthModal] = useState(() => (wantSignup ? 'signup' : 'signin'));
  const [redirectAuthError, setRedirectAuthError] = useState('');
  const [poolInvitePending] = useState(
    () => Boolean(getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim()),
  );
  const didStripSignupRef = useRef(false);

  const closeModal = useCallback(() => {
    // Closing returns to marketing home (separate document).
    window.location.assign('/');
  }, []);
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

  useEffect(() => {
    if (!wantSignup || didStripSignupRef.current) return;
    didStripSignupRef.current = true;
    navigate('/login', { replace: true });
  }, [navigate, wantSignup]);

  if (!loading && user) {
    return <Navigate to={getDashboardEntryHref({ isAdminUser })} replace />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-transparent text-white">
      <OpenInBrowserBanner />
      <div className="relative z-10 px-4 text-center">
        <p className="mb-2 font-display text-lg font-bold tracking-tight text-white">
          Setlist Pick&nbsp;&apos;Em
        </p>
        <p className="text-sm font-medium text-slate-400">
          {authModal === 'signup' ? 'Create your free account' : 'Sign in to make picks'}
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
    </div>
  );
}
