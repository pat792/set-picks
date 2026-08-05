import { ensureAuthReady } from '../../../shared/lib/ensureFirebase';
import { stashGoogleRedirectIntent } from '../utils/googleRedirectIntent';
import {
  markGoogleOauthStart,
  trackGoogleClickToOauthTiming,
  trackGoogleCredentialToNavTiming,
} from './authLoginTiming';
import { getLoginAuthSurface } from './warmLoginAuthSurface';

/**
 * Shared Google OAuth click path for splash / `/login` (#858 / #859).
 *
 * Prefer redirect when {@link shouldPreferGoogleRedirectAuth} is true.
 * Desktop popup path may one-shot fall back to redirect on `auth/popup-blocked`.
 *
 * @param {{
 *   intent: 'signin' | 'signup',
 *   preferRedirect: boolean,
 * }} opts
 * @returns {Promise<
 *   | { kind: 'redirecting', authFlow: 'redirect' }
 *   | { kind: 'done', authFlow: 'popup' }
 *   | {
 *       kind: 'error',
 *       message: string,
 *       authFlow: 'popup' | 'redirect',
 *       errorCode?: string,
 *       oauthMarked: boolean,
 *       err?: unknown,
 *     }
 * >}
 */
export async function runGoogleSplashAuth({ intent, preferRedirect }) {
  let authFlow = preferRedirect ? 'redirect' : 'popup';
  let oauthMarked = false;

  try {
    const surface = await resolveGoogleAuthSurface();
    const {
      auth,
      signInWithGoogle,
      startGoogleSignInRedirect,
      completeGoogleSplashAuth,
    } = surface;

    if (preferRedirect) {
      stashGoogleRedirectIntent(intent);
      markGoogleOauthStart();
      oauthMarked = true;
      trackGoogleClickToOauthTiming({
        authFlow: 'redirect',
        outcome: 'success',
      });
      await startGoogleSignInRedirect(auth);
      return { kind: 'redirecting', authFlow: 'redirect' };
    }

    markGoogleOauthStart();
    oauthMarked = true;
    try {
      const { isNewUser } = await signInWithGoogle(auth);
      const outcome = await completeGoogleSplashAuth({
        intent,
        isNewUser,
        flow: 'popup',
      });
      if (outcome.kind === 'error') {
        trackGoogleClickToOauthTiming({
          authFlow: 'popup',
          outcome: 'error',
          errorCode: 'complete_error',
        });
        return {
          kind: 'error',
          message: outcome.message,
          authFlow: 'popup',
          errorCode: 'complete_error',
          oauthMarked,
        };
      }
      trackGoogleClickToOauthTiming({
        authFlow: 'popup',
        outcome: 'success',
      });
      trackGoogleCredentialToNavTiming({ authFlow: 'popup' });
      return { kind: 'done', authFlow: 'popup' };
    } catch (popupErr) {
      // Optional industry pattern: popup-blocked → one-shot redirect (#859).
      if (popupErr?.code === 'auth/popup-blocked') {
        trackGoogleClickToOauthTiming({
          authFlow: 'popup',
          outcome: 'error',
          errorCode: 'auth/popup-blocked',
        });
        authFlow = 'redirect';
        stashGoogleRedirectIntent(intent);
        markGoogleOauthStart();
        trackGoogleClickToOauthTiming({
          authFlow: 'redirect',
          outcome: 'success',
        });
        await startGoogleSignInRedirect(auth);
        return { kind: 'redirecting', authFlow: 'redirect' };
      }
      throw popupErr;
    }
  } catch (err) {
    if (oauthMarked) {
      trackGoogleClickToOauthTiming({
        authFlow,
        outcome: 'error',
        errorCode: err?.code || 'unknown',
      });
    }
    return {
      kind: 'error',
      message: '',
      authFlow,
      errorCode: err?.code,
      oauthMarked,
      err,
    };
  }
}

async function resolveGoogleAuthSurface() {
  const warmed = getLoginAuthSurface();
  if (warmed?.auth && warmed.signInWithGoogle && warmed.startGoogleSignInRedirect) {
    return warmed;
  }
  const { auth } = await ensureAuthReady();
  const [api, completeMod] = await Promise.all([
    import('../api/splashAuthApi'),
    import('./completeGoogleSplashAuth'),
  ]);
  return {
    auth,
    signInWithGoogle: api.signInWithGoogle,
    startGoogleSignInRedirect: api.startGoogleSignInRedirect,
    completeGoogleSplashAuth: completeMod.completeGoogleSplashAuth,
  };
}
