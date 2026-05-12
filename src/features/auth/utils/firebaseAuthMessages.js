/** User-facing copy for Firebase Auth error codes (email/password + Google popup). */
export function getFirebaseAuthErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try Sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return [
        'Sign-in failed: either the password is wrong, or there is no account for this email',
        '(Firebase uses one message for both so addresses cannot be guessed).',
        'New here? Use Create account on the splash page—this form is for returning users.',
        'If you do have an account and recently changed your password, autofill may still use an old one—try typing it manually or use Google.',
      ].join(' ');
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/operation-not-allowed':
      return 'Email/password is not enabled for this app yet. Enable it in Firebase Console → Authentication → Sign-in method, or use Google.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
