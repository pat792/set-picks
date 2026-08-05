/**
 * Full-screen Google continue copy keyed by auth intent (#860).
 * New vs returning is known from signup/signin mode before OAuth returns.
 *
 * @param {'signin' | 'signup' | null | undefined} intent
 * @returns {string}
 */
export function resolveGoogleContinueMessage(intent) {
  if (intent === 'signup') return 'Loading Google account sign-in options…';
  return 'Logging you in…';
}
