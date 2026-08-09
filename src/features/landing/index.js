export { default as AboutPageContent } from './ui/AboutPageContent';
export { default as HowItWorksPageContent } from './ui/HowItWorksPageContent';
export { default as MarketingIphoneCarousel } from './ui/MarketingIphoneCarousel';
export { default as MarketingIphoneFigure } from './ui/MarketingIphoneFigure';
export { default as MarketingPageShell } from './ui/MarketingPageShell';
export {
  MarketingFooterNav,
  MarketingHeaderNav,
  MarketingMobileMenu,
} from './ui/MarketingSiteNav';
export { MARKETING_LEGAL_NAV, MARKETING_PRIMARY_NAV } from './model/marketingNav';
export { default as PhishSetlistPredictionGamePageContent } from './ui/PhishSetlistPredictionGamePageContent';
export { default as SplashAboutSection } from './ui/SplashAboutSection';
// SplashAuthModals: app-document only — import from `features/landing/auth-modals` (#832).
// SplashAuthEntryCard / SplashGetStartedSection removed — auth CTAs go to `/login` (#835).
// Splash home cold-open surface: import from `features/landing/splash` (#835).
export {
  LandingSeo,
  SplashPageShell,
  useScrollToSectionFocus,
  useMarketingAuthLeave,
  useSpeculativeLoginWarm,
  MarketingAuthLeaveOverlay,
  AppDocumentAuthLink,
  loginPath,
  LOGIN_PATH,
  LOGIN_SIGNUP_PATH,
  prefetchLoginIntent,
  prefetchLoginSpeculative,
  consumeLoginWarmIntent,
  consumeLoginWarmSpeculative,
  consumeLoginWarmPath,
  consumeLoginHopCta,
  markLoginWarmIntent,
  markLoginWarmSpeculative,
  markLoginHopCta,
  resolveMarketingAuthLeaveMessage,
  MARKETING_LEAVE_SIGN_IN,
  MARKETING_LEAVE_SIGN_UP,
} from './splash';
export { default as SplashHeader } from './ui/SplashHeader';
export { default as SplashHeroSection } from './ui/SplashHeroSection';
export { default as SplashHowItWorksSection } from './ui/SplashHowItWorksSection';
