import { useCallback, useEffect, useState } from 'react';

import { auth, googleProvider } from '../../../shared/lib/firebase';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthMessages';
import { sendResetEmail, signInWithEmail, signInWithGoogle } from '../api/splashAuthApi';
import { trackAuthError, trackAuthLogin } from './authAnalytics';

export function useSplashSignIn(isOpen, onClose) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetLinkNotice, setResetLinkNotice] = useState({ text: '', type: '' });

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
    try {
      await signInWithGoogle(auth, googleProvider);
      trackAuthLogin('google');
      closeModal();
    } catch (err) {
      console.error('Google sign-in:', err);
      trackAuthError({ method: 'google', error_code: err.code });
      setError(getFirebaseAuthErrorMessage(err.code));
    } finally {
      setBusy(false);
    }
  }, [closeModal]);

  const handleEmailSignIn = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setBusy(true);
      try {
        await signInWithEmail(auth, email, password);
        trackAuthLogin('email');
        closeModal();
      } catch (err) {
        console.error('Sign in:', err);
        trackAuthError({ method: 'email', error_code: err.code });
        setError(getFirebaseAuthErrorMessage(err.code));
      } finally {
        setBusy(false);
      }
    },
    [closeModal, email, password]
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
  };
}
