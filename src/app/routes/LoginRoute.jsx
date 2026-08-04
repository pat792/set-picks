import React from 'react';

import LoginPage from '../../pages/auth/LoginPage';

/** Hard-open auth entry served via spa-boot (#829). */
export default function LoginRoute() {
  return <LoginPage />;
}
