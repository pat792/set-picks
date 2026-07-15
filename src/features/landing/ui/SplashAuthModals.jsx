import React from 'react';

import { SplashSignInModal, SplashSignUpModal } from '../../auth';

export default function SplashAuthModals({
  authModal,
  closeModal,
  onSwitchToSignIn,
  onSwitchToSignUp,
  poolInvitePending = false,
}) {
  return (
    <>
      <SplashSignUpModal
        isOpen={authModal === 'signup'}
        onClose={closeModal}
        onSwitchToSignIn={onSwitchToSignIn}
        poolInvitePending={poolInvitePending}
      />
      <SplashSignInModal
        isOpen={authModal === 'signin'}
        onClose={closeModal}
        onSwitchToSignUp={onSwitchToSignUp}
        poolInvitePending={poolInvitePending}
      />
    </>
  );
}
