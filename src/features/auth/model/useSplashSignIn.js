import { useCallback, useEffect, useState } from 'react';

import { ensureAuthReady } from '../../../shared/lib/ensureFirebase';
import { isLikelyInAppBrowser } from '../../../shared/lib/inAppBrowser';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthMessages';
import {
  clearSplashGoogleModalInflight,
  setSplashGoogleModalInflight,
} from '../utils/splashGoogleModalInflight';
import { stashGoogleRedirectIntent } from '../utils/googleRedirectIntent';
import { trackAuthError, trackAuthLogin } from './authAnalytics';

export function useSplashSignIn(isOpen, onClose, { seedError = '' } = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetLinkNotice, setResetLinkNotice] = useState({ text: '', type: '' });
  const inAppBrowser = isLikelyInAppBrowser();

  useEffect(() => {
    if (isOpen && seedError) setError(seedError);
  }, [isOpen, seedError]);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setError('');
    setResetLinkNotice({ text: '', type: '' });
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
        stashGoogleRedirectIntent('signin');
        await startGoogleSignInRedirect(auth);
        // Navigates away — leave busy/inflight set until unload.
        return;
      }

      const { isNewUser } = await signInWithGoogle(auth);
      const outcome = await completeGoogleSplashAuth({
        intent: 'signin',
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
        surface: 'sign_in',
        auth_flow: inAppBrowser ? 'redirect' : 'popup',
      });
      setError(getFirebaseAuthErrorMessage(err.code));
    } finally {
      if (!inAppBrowser) {
        clearSplashGoogleModalInflight();
        setBusy(false);
      }
    }
  }, [closeModal, inAppBrowser]);

  const handleEmailSignIn = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setBusy(true);
      try {
        const { auth } = await ensureAuthReady();
        const { signInWithEmail } = await import('../api/splashAuthApi');
        await signInWithEmail(auth, email, password);
        trackAuthLogin('email', { surface: 'sign_in' });
        closeModal();
      } catch (err) {
        console.error('Sign in:', err);
        trackAuthError({
          method: 'email',
          error_code: err.code,
          surface: 'sign_in',
        });
        setError(getFirebaseAuthErrorMessage(err.code));
      } finally {
        setBusy(false);
      }
    },
    [closeModal, email, password],
  );

  const handleSendPasswordResetEmail = useCallback(async () => {
    const em = email.trim();
    if (!em) {
      setError('Enter your email address above first.');
      setResetLinkNotice({ text: '', type: '' });
      return;
    }
    setBusy(true);
    setError('');
    setResetLinkNotice({ text: '', type: '' });
    try {
      const { auth } = await ensureAuthReady();
      const { sendResetEmail } = await import('../api/splashAuthApi');
      await sendResetEmail(auth, em);
      setResetLinkNotice({
        text: `Check your inbox at ${em} for a password reset link. Then return here to sign in.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Password reset:', err);
      trackAuthError({ method: 'password_reset', error_code: err.code });
      const msg =
        err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Wait a few minutes and try again.'
          : 'Could not send reset email. Try again later.';
      setResetLinkNotice({ text: msg, type: 'error' });
    } finally {
      setBusy(false);
    }
  }, [email]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    busy,
    error,
    resetLinkNotice,
    closeModal,
    handleGoogle,
    handleEmailSignIn,
    handleSendPasswordResetEmail,
    inAppBrowser,
  };
}
