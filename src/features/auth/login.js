/**
 * `/login` public surface (#835 / #850 / #892 HTML-first door).
 * Narrow barrel so the LoginPage chunk does not pull the full auth root
 * (sign-out, password-reset, profile setup, etc.) — those keep static Firebase edges.
 */
export { default as LoginAuthScreen } from './ui/LoginAuthScreen';
export { default as LoginFormShellFallback } from './ui/LoginFormShellFallback';
export { default as LoginFocusPark } from './ui/LoginFocusPark';
export { default as GoogleAuthContinueOverlay } from './ui/GoogleAuthContinueOverlay';
export {
  ensureNeutralLoginFocusGuards,
  scheduleNeutralLoginFocus,
} from './model/deferPasswordManagerAutofill';
export { AuthProvider, useAuth } from './provider.js';
export { useGoogleRedirectCompletion } from './model/useGoogleRedirectCompletion';
export {
  warmLoginAuthSurface,
  isLoginAuthSurfaceReady,
  getLoginAuthSurface,
} from './model/warmLoginAuthSurface';
export { useLoginAuthSurfaceReady } from './model/useLoginAuthSurfaceReady';
export { markLoginAuthPaint } from './model/authLoginTiming';
export { trackAuthHopTiming } from './model/authAnalytics';
export {
  stashSplashResumeAuthModal,
  consumeSplashResumeAuthModal,
} from './utils/splashAuthResumeStorage';
export { peekGoogleRedirectIntent } from './utils/googleRedirectIntent';
