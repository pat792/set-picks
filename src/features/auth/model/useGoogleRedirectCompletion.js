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
 * Shared in-flight completion so React StrictMode remounts (dev) join the same
 * `getRedirectResult` instead of cancelling mid-flight and stranding the
 * “Loading Google account sign-in options…” overlay on `:5173`.
 *
 * @type {Promise<{
 *   type: 'none' | 'empty' | 'done' | 'error',
 *   intent?: 'signin' | 'signup' | null,
 *   outcome?: { kind: string, message?: string },
 *   err?: unknown,
 * }> | null}
 */
let inFlightCompletion = null;

async function completePendingGoogleRedirect() {
  if (!peekGoogleRedirectIntent()) {
    return { type: 'none' };
  }
  if (inFlightCompletion) return inFlightCompletion;

  inFlightCompletion = (async () => {
    try {
      const { auth } = await ensureAuthReady();
      const [{ consumeGoogleRedirectResult }, { completeGoogleSplashAuth }] =
        await Promise.all([
          import('../api/splashAuthApi'),
          import('./completeGoogleSplashAuth'),
        ]);
      const result = await consumeGoogleRedirectResult(auth);
      if (!result) {
        consumeGoogleRedirectIntent();
        return { type: 'empty' };
      }

      const intent = consumeGoogleRedirectIntent() || 'signin';
      setSplashGoogleModalInflight();
      try {
        const outcome = await completeGoogleSplashAuth({
          intent,
          isNewUser: result.isNewUser,
          flow: 'redirect',
        });
        return { type: 'done', intent, outcome };
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
      return { type: 'error', intent, err };
    } finally {
      inFlightCompletion = null;
    }
  })();

  return inFlightCompletion;
}

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
  const cbsRef = useRef({
    onOpenSignIn,
    onOpenSignUp,
    onError,
    onSettled,
  });
  cbsRef.current = {
    onOpenSignIn,
    onOpenSignUp,
    onError,
    onSettled,
  };

  useEffect(() => {
    const hasIntent = Boolean(peekGoogleRedirectIntent());
    if (!hasIntent && !inFlightCompletion) {
      // Clear a stranded overlay after StrictMode consumed intent on a prior mount.
      cbsRef.current.onSettled?.();
      return undefined;
    }

    let active = true;

    void completePendingGoogleRedirect().then((result) => {
      const cbs = cbsRef.current;
      if (active) {
        if (result.type === 'done' && result.outcome?.kind === 'error') {
          cbs.onError?.(result.outcome.message, result.intent ?? null);
          if (result.intent === 'signup') cbs.onOpenSignUp?.();
          else cbs.onOpenSignIn?.();
        } else if (result.type === 'error') {
          cbs.onError?.(
            getFirebaseAuthErrorMessage(result.err?.code),
            result.intent ?? null,
          );
          if (result.intent === 'signup') cbs.onOpenSignUp?.();
          else if (result.intent === 'signin') cbs.onOpenSignIn?.();
        }
      }
      // Always settle — including after StrictMode cancelled the first subscriber —
      // so LoginPage `googleReturnBusy` cannot stick forever on `:5173`.
      cbs.onSettled?.();
    });

    return () => {
      active = false;
    };
  }, []);
}

/** @visibleForTesting */
export function resetGoogleRedirectCompletionForTests() {
  inFlightCompletion = null;
}

/** @visibleForTesting */
export function completePendingGoogleRedirectForTests() {
  return completePendingGoogleRedirect();
}
