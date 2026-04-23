import { useCallback, useEffect, useState } from 'react';
import { getAdditionalUserInfo } from 'firebase/auth';

import { auth } from '../../../shared/lib/firebase';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthMessages';
import { registerWithEmail, signInWithGoogle } from '../api/splashAuthApi';
import { trackAuthError, trackAuthLogin, trackAuthSignUp } from './authAnalytics';

export function useSplashSignUp(isOpen, onClose) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
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
    setBusy(true);
    try {
      const cred = await signInWithGoogle(auth);
      const extra = getAdditionalUserInfo(cred);
      if (extra?.isNewUser) {
        trackAuthSignUp('google');
      } else {
        trackAuthLogin('google');
      }
      closeModal();
    } catch (err) {
      console.error('Google sign-in:', err);
      trackAuthError({ method: 'google', error_code: err.code });
      setError(getFirebaseAuthErrorMessage(err.code));
    } finally {
      setBusy(false);
    }
  }, [closeModal]);

  const handleEmailSignUp = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
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
        await registerWithEmail(auth, email, password);
        trackAuthSignUp('email');
        closeModal();
      } catch (err) {
        console.error('Sign up:', err);
        trackAuthError({ method: 'email', error_code: err.code });
        setError(getFirebaseAuthErrorMessage(err.code));
      } finally {
        setBusy(false);
      }
    },
    [closeModal, confirmPassword, email, password]
  );

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    busy,
    error,
    closeModal,
    handleGoogle,
    handleEmailSignUp,
  };
}
