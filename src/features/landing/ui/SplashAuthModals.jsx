import React, { useEffect } from 'react';

import { SplashSignInModal, SplashSignUpModal } from '../../auth';
import { ensureAppCheckNow } from '../../../shared/lib/firebaseAppCheck';
import { prefetchRouteChunk } from '../../../shared/lib/routeChunkPrefetch';

export default function SplashAuthModals({
  authModal,
  closeModal,
  onSwitchToSignIn,
  onSwitchToSignUp,
  poolInvitePending = false,
  redirectAuthError = '',
  onClearRedirectAuthError,
}) {
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

  return (
    <>
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
    </>
  );
}
