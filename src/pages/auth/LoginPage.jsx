import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  LoginAuthScreen,
  consumeSplashResumeAuthModal,
  useAuth,
  useGoogleRedirectCompletion,
} from '../../features/auth';
import { MarketingPageShell } from '../../features/landing';
import { getDashboardEntryHref } from '../../shared/lib/dashboardLastPath';
import { POOL_INVITE_STORAGE_KEY } from '../../shared/config/poolInvite';
import { getLocalStorageItem } from '../../shared/lib/local-storage';

/**
 * Resolve `/login` mode from search params (#834).
 * Prefers `mode=signup|signin`; keeps `signup=1` as a compatibility alias.
 * @param {URLSearchParams} searchParams
 * @returns {'signin' | 'signup'}
 */
export function resolveLoginMode(searchParams) {
  const mode = (searchParams.get('mode') || '').trim().toLowerCase();
  if (mode === 'signup' || mode === 'signin') return mode;
  if (searchParams.get('signup') === '1') return 'signup';
  return 'signin';
}

/**
 * Authenticated-SPA login surface (#832 / #834).
 * Full-page inline forms — invite VIP landings keep modal chrome separately.
 */
export default function LoginPage() {
  const { user, isAdmin: isAdminUser, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialMode = resolveLoginMode(searchParams);
  const [mode, setMode] = useState(initialMode);
  const [redirectAuthError, setRedirectAuthError] = useState(() => {
    const seeded = location.state?.seedError;
    return typeof seeded === 'string' ? seeded : '';
  });
  const [poolInvitePending] = useState(
    () => Boolean(getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim()),
  );
  const didStripQueryRef = useRef(false);
  const didResumeRef = useRef(false);

  const goHome = useCallback(() => {
    window.location.assign('/');
  }, []);
  const openSignUp = useCallback(() => {
    setRedirectAuthError('');
    setMode('signup');
  }, []);
  const openSignIn = useCallback(() => {
    setRedirectAuthError('');
    setMode('signin');
  }, []);
  const onRedirectError = useCallback((message, intent) => {
    setRedirectAuthError(message || '');
    if (intent === 'signup') setMode('signup');
    else setMode('signin');
  }, []);

  useGoogleRedirectCompletion({
    onOpenSignIn: openSignIn,
    onOpenSignUp: openSignUp,
    onError: onRedirectError,
  });

  // Terms/Privacy back-stack resume (session stash from LoginAuthScreen / modals).
  useEffect(() => {
    if (didResumeRef.current) return;
    didResumeRef.current = true;
    const resume = consumeSplashResumeAuthModal();
    if (resume === 'signup' || resume === 'signin') setMode(resume);
  }, []);

  // Strip mode/signup query after first paint so refresh stays clean.
  // Clear router state so seedError is not replayed on later navigations.
  useEffect(() => {
    if (didStripQueryRef.current) return;
    const hasMode = Boolean(searchParams.get('mode'));
    const hasSignup = searchParams.get('signup') === '1';
    const hasSeedState = Boolean(location.state?.seedError);
    if (!hasMode && !hasSignup && !hasSeedState) return;
    didStripQueryRef.current = true;
    navigate('/login', { replace: true, state: {} });
  }, [location.state, navigate, searchParams]);

  if (!loading && user) {
    return <Navigate to={getDashboardEntryHref({ isAdminUser })} replace />;
  }

  return (
    <MarketingPageShell>
      <LoginAuthScreen
        mode={mode}
        onSwitchToSignIn={openSignIn}
        onSwitchToSignUp={openSignUp}
        onClose={goHome}
        poolInvitePending={poolInvitePending}
        seedError={redirectAuthError}
      />
    </MarketingPageShell>
  );
}
