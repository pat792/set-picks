/**
 * Splash / marketing-home public surface (#835).
 * Keeps sibling marketing page content out of the `/` cold-open import graph.
 */
export { default as LandingSeo } from './ui/LandingSeo';
export { default as SplashPageShell } from './ui/SplashPageShell';
export { default as useScrollToSectionFocus } from './model/useScrollToSectionFocus';
