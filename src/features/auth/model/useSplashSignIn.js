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
import {
  markGoogleAuthClick,
  markGoogleOauthStart,
  trackGoogleClickToOauthTiming,
  trackGoogleCredentialToNavTiming,
} from './authLoginTiming';

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
    markGoogleAuthClick();
    const authFlow = inAppBrowser ? 'redirect' : 'popup';
    let oauthMarked = false;
    try {
      const { auth } = await ensureAuthReady();
      const [{ signInWithGoogle, startGoogleSignInRedirect }, { completeGoogleSplashAuth }] =
        await Promise.all([
          import('../api/splashAuthApi'),
          import('./completeGoogleSplashAuth'),
        ]);
      if (inAppBrowser) {
        stashGoogleRedirectIntent('signin');
        markGoogleOauthStart();
        oauthMarked = true;
        trackGoogleClickToOauthTiming({
          authFlow: 'redirect',
          outcome: 'success',
        });
        await startGoogleSignInRedirect(auth);
        // Navigates away — leave busy/inflight set until unload.
        return;
      }

      markGoogleOauthStart();
      oauthMarked = true;
      const { isNewUser } = await signInWithGoogle(auth);
      const outcome = await completeGoogleSplashAuth({
        intent: 'signin',
        isNewUser,
        flow: 'popup',
      });
      if (outcome.kind === 'error') {
        trackGoogleClickToOauthTiming({
          authFlow: 'popup',
          outcome: 'error',
          errorCode: 'complete_error',
        });
        setError(outcome.message);
        return;
      }
      trackGoogleClickToOauthTiming({
        authFlow: 'popup',
        outcome: 'success',
      });
      trackGoogleCredentialToNavTiming({ authFlow: 'popup' });
      closeModal();
    } catch (err) {
      console.error('Google sign-in:', err);
      if (oauthMarked) {
        trackGoogleClickToOauthTiming({
          authFlow,
          outcome: 'error',
          errorCode: err.code || 'unknown',
        });
      }
      trackAuthError({
        method: 'google',
        error_code: err.code,
        surface: 'sign_in',
        auth_flow: authFlow,
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
