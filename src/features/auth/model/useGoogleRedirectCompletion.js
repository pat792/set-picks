import { useEffect, useRef } from 'react';

import { ensureAuthReady } from '../../../shared/lib/ensureFirebase';
import {
  clearSplashGoogleModalInflight,
  setSplashGoogleModalInflight,
} from '../utils/splashGoogleModalInflight';
import {
  consumeGoogleRedirectIntent,
  peekGoogleRedirectIntent,
} from '../utils/googleRedirectIntent';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseAuthMessages';
import { trackAuthError } from './authAnalytics';

/**
 * Completes a pending Google `signInWithRedirect` on splash / invite landings.
 *
 * Skips Firebase load when there is no stashed redirect intent so anon `/login`
 * paint stays firebase-free (#835) unless the user is mid-redirect return.
 *
 * @param {{
 *   onOpenSignIn?: () => void,
 *   onOpenSignUp?: () => void,
 *   onError?: (message: string, intent: 'signin' | 'signup' | null) => void,
 *   onSettled?: () => void,
 * }} [opts]
 */
export function useGoogleRedirectCompletion({
  onOpenSignIn,
  onOpenSignUp,
  onError,
  onSettled,
} = {}) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // No intent → do not pull firebase-core just to call getRedirectResult.
    if (!peekGoogleRedirectIntent()) return;

    let cancelled = false;

    (async () => {
      let result;
      try {
        const { auth } = await ensureAuthReady();
        const [{ consumeGoogleRedirectResult }, { completeGoogleSplashAuth }] =
          await Promise.all([
            import('../api/splashAuthApi'),
            import('./completeGoogleSplashAuth'),
          ]);
        result = await consumeGoogleRedirectResult(auth);
        if (cancelled) return;
        if (!result) {
          consumeGoogleRedirectIntent();
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
        } finally {
          clearSplashGoogleModalInflight();
        }
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
      } finally {
        if (!cancelled) onSettled?.();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onError, onOpenSignIn, onOpenSignUp, onSettled]);
}
