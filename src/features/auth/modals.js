/**
 * Secondary barrel for the splash/invite auth modals (#733).
 *
 * Consumers lazy-import this module so the sign-in/sign-up stack (forms,
 * Google flow, legal-consent API, auth analytics) stays out of the public
 * splash and invite first-paint chunks. Keep this barrel modal-only — adding
 * eager splash exports here would drag them back onto the cold-open path.
 */
export { default as SplashSignInModal } from './ui/SplashSignInModal';
export { default as SplashSignUpModal } from './ui/SplashSignUpModal';
