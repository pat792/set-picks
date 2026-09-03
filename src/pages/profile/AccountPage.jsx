import React from 'react';
import { useOutletContext } from 'react-router-dom';

import { AccountPreferencesScreen } from '../../features/account';

/**
 * Account cluster — Preferences tertiary (security, prefs, install, legal).
 */
export default function AccountPage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;
  return <AccountPreferencesScreen user={user} />;
}
