import { useCallback, useEffect, useState } from 'react';

import { auth } from '../../../shared/lib/firebase';
import { recordTermsPrivacyConsent } from '../api/legalConsentApi';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthMessages';
import {
  deleteAuthUserIfPresent,
  registerWithEmail,
  signInWithGoogle,
} from '../api/splashAuthApi';
import {
  clearSplashGoogleModalInflight,
  setSplashGoogleModalInflight,
} from '../utils/splashGoogleModalInflight';
import {
  trackAuthError,
  trackAuthLogin,
  trackAuthRollback,
  trackAuthRollbackFailed,
  trackAuthSignUp,
} from './authAnalytics';

export function useSplashSignUp(isOpen, onClose) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
      const { isNewUser } = await signInWithGoogle(auth);
      if (isNewUser) {
        try {
          await recordTermsPrivacyConsent(auth.currentUser.uid);
        } catch (consentErr) {
          console.error('Consent write after Google sign-up:', consentErr);
          trackAuthRollback({ method: 'google', stage: 'consent_write' });
          const rollback = await deleteAuthUserIfPresent(auth.currentUser);
          if (!rollback.deleted) {
            trackAuthRollbackFailed({
              method: 'google',
              error_code: rollback.errorCode || 'unknown',
            });
            console.error(
              'Auth rollback delete failed after Google sign-up:',
              rollback.errorCode
            );
          }
          setError('Could not finish creating your account. Please try again.');
          return;
        }
        trackAuthSignUp('google', { surface: 'create_account' });
      } else {
        // Existing Google account used Create account — treat as login, not a
        // blocked sign-up. Surface tag lets GA4 separate this from Sign-in.
        trackAuthLogin('google', { surface: 'create_account' });
      }
      closeModal();
    } catch (err) {
      console.error('Google sign-in:', err);
      trackAuthError({
        method: 'google',
        error_code: err.code,
        surface: 'create_account',
      });
      setError(getFirebaseAuthErrorMessage(err.code));
    } finally {
      clearSplashGoogleModalInflight();
      setBusy(false);
    }
  }, [closeModal, legalAccepted]);

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
  };
}
