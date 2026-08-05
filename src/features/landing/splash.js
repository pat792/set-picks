/**
 * Splash / marketing-home public surface (#835).
 * Keeps sibling marketing page content out of the `/` cold-open import graph.
 */
export { default as LandingSeo } from './ui/LandingSeo';
export { default as SplashPageShell } from './ui/SplashPageShell';
export { default as useScrollToSectionFocus } from './model/useScrollToSectionFocus';
/** Hard-nav leave chrome for marketing → `/login` (#872). */
export { default as useMarketingAuthLeave } from './model/useMarketingAuthLeave';
export { default as MarketingAuthLeaveOverlay } from './ui/MarketingAuthLeaveOverlay';
export { default as AppDocumentAuthLink } from './ui/AppDocumentAuthLink';
export { loginPath, LOGIN_PATH, LOGIN_SIGNUP_PATH } from './model/appAuthPaths';
/** Intent prefetch + warm_path=intent flag (#860). */
export {
  prefetchLoginIntent,
  consumeLoginWarmIntent,
  markLoginWarmIntent,
} from './model/prefetchLoginIntent';
