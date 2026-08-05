/** Labels for Google CTA pending states (#872). */
export const GOOGLE_CTA_DEFAULT = 'Continue with Google';
export const GOOGLE_CTA_PREPARING = 'Preparing sign-in…';
export const GOOGLE_CTA_OPENING = 'Opening Google…';

/**
 * @param {{ preparing?: boolean, googleBusy?: boolean }} opts
 * @returns {string | undefined} Override label, or undefined for default CTA copy
 */
export function resolveGoogleCtaLabel({ preparing = false, googleBusy = false } = {}) {
  if (preparing) return GOOGLE_CTA_PREPARING;
  if (googleBusy) return GOOGLE_CTA_OPENING;
  return undefined;
}
