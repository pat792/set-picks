import { useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '../../lib/firebase';
import { getFirebaseAuthErrorMessage } from './firebaseAuthMessages';
import {
  splashSignInWithGoogle,
  splashRegisterWithEmail,
  splashSignInWithEmail,
  splashSendPasswordResetEmail,
} from './splashAuthActions';

/**
 * State + handlers for Splash auth modals (Google, email sign-up/sign-in, reset email).
 * Keeps Firebase calls in splashAuthActions and copy in firebaseAuthMessages.
 */
export function useSplashAuth() {
  const [authModal, setAuthModal] = useState(null); // null | 'signup' | 'signin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetLinkNotice, setResetLinkNotice] = useState({ text: '', type: '' });

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setResetLinkNotice({ text: '', type: '' });
  }, []);

  const closeModal = useCallback(() => {
    setAuthModal(null);
    resetForm();
    setBusy(false);
  }, [resetForm]);

  const openSignUpModal = useCallback(() => {
    resetForm();
    setAuthModal('signup');
  }, [resetForm]);

  const openSignInModal = useCallback(() => {
    resetForm();
    setAuthModal('signin');
  }, [resetForm]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    if (authModal) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authModal, closeModal]);

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await splashSignInWithGoogle(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in:', err);
      setError(getFirebaseAuthErrorMessage(err.code));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSignUp = async (e) => {
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
      await splashRegisterWithEmail(auth, email, password);
      closeModal();
    } catch (err) {
      console.error('Sign up:', err);
      setError(getFirebaseAuthErrorMessage(err.code));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await splashSignInWithEmail(auth, email, password);
      closeModal();
    } catch (err) {
      console.error('Sign in:', err);
      setError(getFirebaseAuthErrorMessage(err.code));
    } finally {
      setBusy(false);
    }
  };

  const handleSendPasswordResetEmail = async () => {
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
      await splashSendPasswordResetEmail(auth, em);
      setResetLinkNotice({
        text: `Check your inbox at ${em} for a password reset link. Then return here to sign in.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Password reset:', err);
      const msg =
        err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Wait a few minutes and try again.'
          : 'Could not send reset email. Try again later.';
      setResetLinkNotice({ text: msg, type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return {
    authModal,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    busy,
    error,
    resetLinkNotice,
    closeModal,
    openSignUpModal,
    openSignInModal,
    handleGoogle,
    handleEmailSignUp,
    handleEmailSignIn,
    handleSendPasswordResetEmail,
  };
}
