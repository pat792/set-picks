import React, { useEffect } from 'react';

import { SplashSignInModal, SplashSignUpModal } from '../../auth';
import { ensureAppCheckNow } from '../../../shared/lib/firebaseAppCheck';

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
  useEffect(() => {
    if (authModal === 'signup' || authModal === 'signin') {
      ensureAppCheckNow();
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
