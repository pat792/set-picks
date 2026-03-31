/** Firebase password-reset emails: where to send users after they set a new password. */
export function getPasswordResetActionCodeSettings() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    url: `${origin}/password-reset-complete`,
    // Handle the reset code ourselves so we can render a standard `<form>`
    // (Chrome Password Manager relies on standard form submissions).
    handleCodeInApp: true,
  };
}
