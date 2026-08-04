import React, { Suspense, lazy, useEffect } from 'react';

import { ensureAppCheckNow } from '../../../shared/lib/firebaseAppCheck';
import { prefetchRouteChunk } from '../../../shared/lib/routeChunkPrefetch';

// #733: the splash/invite first paint must not pay for the auth-modal stack
// (sign-in/sign-up forms, Google flow, legal-consent API, auth analytics).
// The modals load from the `features/auth/modals` secondary barrel behind a
// lazy boundary, and the chunk is warmed at idle after mount so clicking an
// auth CTA still opens the modal without a visible fetch gap.
const loadAuthModals = () => import('../../auth/modals');
const SplashSignUpModal = lazy(() =>
  loadAuthModals().then((m) => ({ default: m.SplashSignUpModal })),
);
const SplashSignInModal = lazy(() =>
  loadAuthModals().then((m) => ({ default: m.SplashSignInModal })),
);

export default function SplashAuthModals({
  authModal,
  closeModal,
  onSwitchToSignIn,
  onSwitchToSignUp,
  poolInvitePending = false,
  redirectAuthError = '',
  onClearRedirectAuthError,
}) {
  useEffect(() => {
    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb) => window.setTimeout(cb, 1500);
    const cancelIdle =
      typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : window.clearTimeout;
    const handle = idle(() => {
      loadAuthModals();
    });
    return () => cancelIdle(handle);
  }, []);

  // Anonymous splash/invite: warm reCAPTCHA when auth CTA opens (#803).
  // Opening this modal is the last user action before `/setup` (sign-up) or
  // `/dashboard` (sign-in), so warm both chunks alongside it (#805).
  useEffect(() => {
    if (authModal === 'signup' || authModal === 'signin') {
      ensureAppCheckNow();
      prefetchRouteChunk(['dashboard', 'setup']);
    }
  }, [authModal]);

  const handleClose = () => {
    onClearRedirectAuthError?.();
    closeModal();
  };

  // Both modals render null while closed, so mounting only the open one keeps
  // behavior identical while letting the lazy chunk stay unloaded until an
  // auth CTA is clicked (or the idle warm-up lands first).
  if (authModal !== 'signup' && authModal !== 'signin') return null;

  return (
    <Suspense fallback={null}>
      <SplashSignUpModal
        isOpen={authModal === 'signup'}
        onClose={handleClose}
        onSwitchToSignIn={onSwitchToSignIn}
        poolInvitePending={poolInvitePending}
        seedError={authModal === 'signup' ? redirectAuthError : ''}
      />
      <SplashSignInModal
        isOpen={authModal === 'signin'}
        onClose={handleClose}
        onSwitchToSignUp={onSwitchToSignUp}
        poolInvitePending={poolInvitePending}
        seedError={authModal === 'signin' ? redirectAuthError : ''}
      />
    </Suspense>
  );
}
