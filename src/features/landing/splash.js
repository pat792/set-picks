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
export {
  resolveMarketingAuthLeaveMessage,
  MARKETING_LEAVE_SIGN_IN,
  MARKETING_LEAVE_SIGN_UP,
} from './model/marketingAuthLeaveCopy';
/** Intent / speculative prefetch + warm_path flags (#860 / #880). */
export {
  prefetchLoginIntent,
  prefetchLoginSpeculative,
  scheduleSpeculativeLoginWarm,
  consumeLoginWarmIntent,
  consumeLoginWarmSpeculative,
  consumeLoginWarmPath,
  consumeLoginHopCta,
  markLoginWarmIntent,
  markLoginWarmSpeculative,
  markLoginHopCta,
} from './model/prefetchLoginIntent';
export { default as useSpeculativeLoginWarm } from './model/useSpeculativeLoginWarm';
