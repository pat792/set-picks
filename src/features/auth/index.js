export { default as AuthLoadingScreen } from './ui/AuthLoadingScreen';
export { default as OpenInBrowserBanner } from './ui/OpenInBrowserBanner';
export { default as SplashAuthModalShell } from './ui/SplashAuthModalShell';
// SplashAuthEntryCard moved to features/landing (marketing-safe graph, #832).
// SplashSignInModal / SplashSignUpModal intentionally do NOT re-export here:
// they live in the `./modals` secondary barrel, whose only consumer is the
// lazy boundary in features/landing SplashAuthModals (#733). Re-exporting
// them from this root barrel adds a static edge from every auth consumer to
// the modals chunk (dynamic-import entries are not tree-shaken), which drags
// the whole auth-modal stack back onto the splash/invite first paint.
export { default as PasswordResetForm } from './ui/PasswordResetForm';
export { default as ProfileSetupForm } from './ui/ProfileSetupForm';
export { AuthProvider, useAuth } from './provider.js';
export { useAuthSession } from './model/useAuthSession';
export { useGoogleRedirectCompletion } from './model/useGoogleRedirectCompletion';
export { trackAuthPartialProfile } from './model/authAnalytics';
export { usePasswordReset } from './model/usePasswordReset';
export { usePasswordResetCompleteState } from './model/usePasswordResetCompleteState';
export { useProfileSetup } from './model/useProfileSetup';
export { useSignOut } from './model/useSignOut';
export { getFirebaseAuthErrorMessage } from './utils/firebaseAuthMessages';
export { getPasswordResetActionCodeSettings } from './utils/passwordResetActionSettings';
export {
  stashSplashResumeAuthModal,
  consumeSplashResumeAuthModal,
} from './utils/splashAuthResumeStorage';
export {
  isSplashGoogleModalInflight,
  SPLASH_GOOGLE_MODAL_STORAGE_EVENT,
} from './utils/splashGoogleModalInflight';
