/**
 * `/login` public surface (#835 / #850).
 * Narrow barrel so the LoginPage chunk does not pull the full auth root
 * (sign-out, password-reset, profile setup, etc.) — those keep static Firebase edges.
 */
export { default as LoginAuthScreen } from './ui/LoginAuthScreen';
export { AuthProvider, useAuth } from './provider.js';
export { useGoogleRedirectCompletion } from './model/useGoogleRedirectCompletion';
export {
  warmLoginAuthSurface,
  isLoginAuthSurfaceReady,
  getLoginAuthSurface,
} from './model/warmLoginAuthSurface';
export { useLoginAuthSurfaceReady } from './model/useLoginAuthSurfaceReady';
export { markLoginAuthPaint } from './model/authLoginTiming';
export {
  stashSplashResumeAuthModal,
  consumeSplashResumeAuthModal,
} from './utils/splashAuthResumeStorage';
