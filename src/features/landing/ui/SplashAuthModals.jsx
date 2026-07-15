import React from 'react';

import { SplashSignInModal, SplashSignUpModal } from '../../auth';

export default function SplashAuthModals({
  authModal,
  closeModal,
  onSwitchToSignIn,
  onSwitchToSignUp,
}) {
  return (
    <>
      <SplashSignUpModal
        isOpen={authModal === 'signup'}
        onClose={closeModal}
        onSwitchToSignIn={onSwitchToSignIn}
      />
      <SplashSignInModal
        isOpen={authModal === 'signin'}
        onClose={closeModal}
        onSwitchToSignUp={onSwitchToSignUp}
      />
    </>
  );
}
