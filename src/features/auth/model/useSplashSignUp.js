import { useCallback, useEffect, useState } from 'react';

import { ensureAuthReady } from '../../../shared/lib/ensureFirebase';
import { isLikelyInAppBrowser } from '../../../shared/lib/inAppBrowser';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthMessages';
import {
  clearSplashGoogleModalInflight,
  setSplashGoogleModalInflight,
} from '../utils/splashGoogleModalInflight';
import { stashGoogleRedirectIntent } from '../utils/googleRedirectIntent';
import {
  trackAuthError,
  trackAuthRollback,
  trackAuthRollbackFailed,
  trackAuthSignUp,
} from './authAnalytics';

export function useSplashSignUp(isOpen, onClose, { seedError = '' } = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inAppBrowser = isLikelyInAppBrowser();

  useEffect(() => {
    if (isOpen && seedError) setError(seedError);
  }, [isOpen, seedError]);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLegalAccepted(false);
    setError('');
  }, []);

  const closeModal = useCallback(() => {
    onClose?.();
    resetForm();
    setBusy(false);
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeModal]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setBusy(false);
    }
  }, [isOpen, resetForm]);

  const handleGoogle = useCallback(async () => {
    setError('');
    if (!legalAccepted) {
      setError('Confirm you agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setBusy(true);
    setSplashGoogleModalInflight();
    try {
      const { auth } = await ensureAuthReady();
      const [{ signInWithGoogle, startGoogleSignInRedirect }, { completeGoogleSplashAuth }] =
        await Promise.all([
          import('../api/splashAuthApi'),
          import('./completeGoogleSplashAuth'),
        ]);
      if (inAppBrowser) {
        stashGoogleRedirectIntent('signup');
        await startGoogleSignInRedirect(auth);
        return;
      }

      const { isNewUser } = await signInWithGoogle(auth);
      const outcome = await completeGoogleSplashAuth({
        intent: 'signup',
        isNewUser,
        flow: 'popup',
      });
      if (outcome.kind === 'error') {
        setError(outcome.message);
        return;
      }
      closeModal();
    } catch (err) {
      console.error('Google sign-in:', err);
      trackAuthError({
        method: 'google',
        error_code: err.code,
        surface: 'create_account',
        auth_flow: inAppBrowser ? 'redirect' : 'popup',
      });
      setError(getFirebaseAuthErrorMessage(err.code));
    } finally {
      if (!inAppBrowser) {
        clearSplashGoogleModalInflight();
        setBusy(false);
      }
    }
  }, [closeModal, inAppBrowser, legalAccepted]);

  const handleEmailSignUp = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      if (!legalAccepted) {
        setError('Confirm you agree to the Terms of Service and Privacy Policy to continue.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setBusy(true);
      try {
        const { auth } = await ensureAuthReady();
        const [{ registerWithEmail, deleteAuthUserIfPresent }, { recordTermsPrivacyConsent }] =
          await Promise.all([
            import('../api/splashAuthApi'),
            import('../api/legalConsentApi'),
          ]);
        const cred = await registerWithEmail(auth, email, password);
        try {
          await recordTermsPrivacyConsent(cred.user.uid);
        } catch (consentErr) {
          console.error('Consent write after email sign-up:', consentErr);
          trackAuthRollback({ method: 'email', stage: 'consent_write' });
          const rollback = await deleteAuthUserIfPresent(cred.user);
          if (!rollback.deleted) {
            trackAuthRollbackFailed({
              method: 'email',
              error_code: rollback.errorCode || 'unknown',
            });
            console.error(
              'Auth rollback delete failed after email sign-up:',
              rollback.errorCode
            );
          }
          setError('Could not finish creating your account. Please try again.');
          return;
        }
        trackAuthSignUp('email', { surface: 'create_account' });
        closeModal();
      } catch (err) {
        console.error('Sign up:', err);
        trackAuthError({
          method: 'email',
          error_code: err.code,
          surface: 'create_account',
        });
        setError(getFirebaseAuthErrorMessage(err.code));
      } finally {
        setBusy(false);
      }
    },
    [closeModal, confirmPassword, email, legalAccepted, password]
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    legalAccepted,
    setLegalAccepted,
    busy,
    error,
    closeModal,
    handleGoogle,
    handleEmailSignUp,
    inAppBrowser,
  };
}
