import { useCallback, useState } from 'react';

import {
  needsLegalReconsent,
  recordTermsPrivacyConsent,
} from '../api/legalConsentApi';

/**
 * Dashboard gate for explicit Terms + Privacy acceptance (#396).
 *
 * @param {{ uid?: string } | null | undefined} user
 * @param {Record<string, unknown> | null | undefined} userProfile
 */
export function useLegalReconsent(user, userProfile) {
  const needsReconsent = needsLegalReconsent(userProfile);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const accept = useCallback(async () => {
    if (!user?.uid || !accepted) return;
    setBusy(true);
    setError('');
    try {
      await recordTermsPrivacyConsent(user.uid);
    } catch (err) {
      console.error('Legal re-consent write failed:', err);
      setError('Could not save your acceptance. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [accepted, user?.uid]);

  return {
    needsReconsent,
    accepted,
    setAccepted,
    accept,
    busy,
    error,
  };
}
