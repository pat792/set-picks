import React from 'react';

import { SplashSignInModal, SplashSignUpModal } from '../../auth';

export default function SplashAuthModals({ authModal, closeModal }) {
  return (
    <>
      <SplashSignUpModal isOpen={authModal === 'signup'} onClose={closeModal} />
      <SplashSignInModal isOpen={authModal === 'signin'} onClose={closeModal} />
    </>
  );
}
