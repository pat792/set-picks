/**
 * Intentional sign-out → marketing home (#899).
 *
 * After #881, unauth `/dashboard/*` hard-navs to `/login`. During Log Out the
 * auth listener clears `user` while still on the dashboard, so that bounce
 * races AccountPage soft `navigate('/')` and shows a blank HardRedirect.
 * Set this flag synchronously before `signOut` so the guard sends `/` instead.
 */

export const POST_SIGNOUT_HOME_KEY = 'sp_post_signout_home';

export function markPostSignOutHome() {
  try {
    sessionStorage.setItem(POST_SIGNOUT_HOME_KEY, '1');
  } catch {
    // Private mode / blocked storage — hard-nav after signOut is the fallback.
  }
}

/** @returns {boolean} true once when a post-sign-out home redirect is pending */
export function consumePostSignOutHome() {
  try {
    if (sessionStorage.getItem(POST_SIGNOUT_HOME_KEY) !== '1') return false;
    sessionStorage.removeItem(POST_SIGNOUT_HOME_KEY);
    return true;
  } catch {
    return false;
  }
}
