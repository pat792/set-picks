import { useEffect, useRef } from 'react';

import { auth } from '../../../shared/lib/firebase';
import { consumeGoogleRedirectResult } from '../api/splashAuthApi';
import {
  clearSplashGoogleModalInflight,
  setSplashGoogleModalInflight,
} from '../utils/splashGoogleModalInflight';
import { consumeGoogleRedirectIntent } from '../utils/googleRedirectIntent';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthMessages';
import { trackAuthError } from './authAnalytics';
import { completeGoogleSplashAuth } from './completeGoogleSplashAuth';

/**
 * Completes a pending Google `signInWithRedirect` on splash / invite landings.
 *
 * @param {{
 *   onOpenSignIn?: () => void,
 *   onOpenSignUp?: () => void,
 *   onError?: (message: string, intent: 'signin' | 'signup' | null) => void,
 * }} [opts]
 */
export function useGoogleRedirectCompletion({
  onOpenSignIn,
  onOpenSignUp,
  onError,
} = {}) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let cancelled = false;

    (async () => {
      let result;
      try {
        result = await consumeGoogleRedirectResult(auth);
      } catch (err) {
        console.error('Google redirect result:', err);
        const intent = consumeGoogleRedirectIntent();
        trackAuthError({
          method: 'google',
          error_code: err?.code || 'redirect_result_failed',
          surface: intent === 'signup' ? 'create_account' : 'sign_in',
          auth_flow: 'redirect',
        });
        onError?.(getFirebaseAuthErrorMessage(err?.code), intent);
        if (intent === 'signup') onOpenSignUp?.();
        else if (intent === 'signin') onOpenSignIn?.();
        return;
      }

      if (cancelled || !result) {
        // Clear a stale intent if Firebase returned nothing (user cancelled).
        if (!result) consumeGoogleRedirectIntent();
        return;
      }

      const intent = consumeGoogleRedirectIntent() || 'signin';
      setSplashGoogleModalInflight();
      try {
        const outcome = await completeGoogleSplashAuth({
          intent,
          isNewUser: result.isNewUser,
          flow: 'redirect',
        });
        if (cancelled) return;
        if (outcome.kind === 'error') {
          onError?.(outcome.message, intent);
          if (intent === 'signup') onOpenSignUp?.();
          else onOpenSignIn?.();
        }
        // success: AuthContext + HomeRoute Navigate handle post-login routing
      } finally {
        clearSplashGoogleModalInflight();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onError, onOpenSignIn, onOpenSignUp]);
}
