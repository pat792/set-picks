import { useCallback, useEffect, useState } from 'react';

import { ensureAuthReady } from '../../../shared/lib/ensureFirebase';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthMessages';
import {
  clearSplashGoogleModalInflight,
  setSplashGoogleModalInflight,
} from '../utils/splashGoogleModalInflight';
import {
  trackAuthError,
  trackAuthRollback,
  trackAuthRollbackFailed,
  trackAuthSignUp,
} from './authAnalytics';
import { markGoogleAuthClick } from './authLoginTiming';
import { shouldPreferGoogleRedirectAuth } from './preferGoogleRedirectAuth';
import { runGoogleSplashAuth } from './runGoogleSplashAuth';

export function useSplashSignUp(isOpen, onClose, { seedError = '' } = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Google-only pending — keeps email busy from showing “Opening Google…”. */
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState('');
  const preferGoogleRedirect = shouldPreferGoogleRedirectAuth();

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
    setGoogleBusy(false);
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
      setGoogleBusy(false);
    }
  }, [isOpen, resetForm]);

  const handleGoogle = useCallback(async () => {
    setError('');
    if (!legalAccepted) {
      setError('Confirm you agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setBusy(true);
    setGoogleBusy(true);
    setSplashGoogleModalInflight();
    markGoogleAuthClick();
    let authFlow = preferGoogleRedirect ? 'redirect' : 'popup';
    let leftViaRedirect = false;
    try {
      const result = await runGoogleSplashAuth({
        intent: 'signup',
        preferRedirect: preferGoogleRedirect,
      });
      authFlow = result.authFlow;
      if (result.kind === 'redirecting') {
        leftViaRedirect = true;
        return;
      }
      if (result.kind === 'error') {
        if (result.err) {
          console.error('Google sign-in:', result.err);
          trackAuthError({
            method: 'google',
            error_code: result.errorCode,
            surface: 'create_account',
            auth_flow: result.authFlow,
          });
          setError(getFirebaseAuthErrorMessage(result.errorCode));
        } else {
          setError(result.message);
        }
        return;
      }
      closeModal();
    } catch (err) {
      console.error('Google sign-in:', err);
      trackAuthError({
        method: 'google',
        error_code: err.code,
        surface: 'create_account',
        auth_flow: authFlow,
      });
      setError(getFirebaseAuthErrorMessage(err.code));
    } finally {
      if (!leftViaRedirect) {
        clearSplashGoogleModalInflight();
        setBusy(false);
        setGoogleBusy(false);
      }
    }
  }, [closeModal, legalAccepted, preferGoogleRedirect]);

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
    googleBusy,
    error,
    closeModal,
    handleGoogle,
    handleEmailSignUp,
    /** @deprecated use preferGoogleRedirect — kept for modal footnote callers */
    inAppBrowser: preferGoogleRedirect,
    preferGoogleRedirect,
  };
}
