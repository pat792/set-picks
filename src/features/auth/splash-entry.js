/**
 * Narrow splash-only auth UI surface (#832).
 * Importing from `features/auth` root pulls AuthProvider / firebase into the
 * marketing cold-open graph; get-started only needs the presentational card.
 */
export { default as SplashAuthEntryCard } from './ui/SplashAuthEntryCard';
