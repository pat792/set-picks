/** Firebase password-reset emails: where to send users after they set a new password. */
export function getPasswordResetActionCodeSettings() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    url: `${origin}/password-reset-complete`,
    handleCodeInApp: false,
  };
}
