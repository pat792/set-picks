import React from 'react';

import { SplashSignInModal, SplashSignUpModal } from '../../auth';

export default function SplashAuthModals({
  authModal,
  closeModal,
  onSwitchToSignIn,
  onSwitchToSignUp,
  poolInvitePending = false,
  redirectAuthError = '',
  onClearRedirectAuthError,
}) {
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
