/**
 * Marketing-safe public API (#832) — no SplashAuthModals / App Check.
 * Pages and the marketing Vite entry import from here so Firebase stays off
 * the cold-open graph. Auth modals remain on the root landing barrel /
 * `./authModals` for the Firebase app entry.
 */
export { default as HowItWorksPageContent } from './ui/HowItWorksPageContent';
export { default as LandingSeo } from './ui/LandingSeo';
export { default as MarketingPageShell } from './ui/MarketingPageShell';
export { MarketingFooterNav, MarketingHeaderNav } from './ui/MarketingSiteNav';
export { MARKETING_LEGAL_NAV, MARKETING_PRIMARY_NAV } from './model/marketingNav';
export { default as PhishSetlistPredictionGamePageContent } from './ui/PhishSetlistPredictionGamePageContent';
export { default as SplashAboutSection } from './ui/SplashAboutSection';
export { default as SplashGetStartedSection } from './ui/SplashGetStartedSection';
export { default as SplashHeader } from './ui/SplashHeader';
export { default as SplashHeroSection } from './ui/SplashHeroSection';
export { default as SplashHowItWorksSection } from './ui/SplashHowItWorksSection';
export { default as SplashPageShell } from './ui/SplashPageShell';
export { default as useScrollToSectionFocus } from './model/useScrollToSectionFocus';
