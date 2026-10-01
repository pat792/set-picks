/**
 * Create-account Terms/Privacy gate copy — keep Login + splash modal in sync.
 */

/** Shown under the consent checkbox while unchecked. */
export const SIGNUP_LEGAL_GATE_HINT =
  'Check the box to continue setting up your account profile.';

/** Fallback error if a submit slips through without consent. */
export const SIGNUP_LEGAL_REQUIRED_ERROR =
  'Accept the Terms and Privacy Policy to create your account.';

/** Disabled email CTA label while consent is unchecked. */
export const SIGNUP_EMAIL_CTA_NEEDS_LEGAL = 'Accept terms to continue';

/**
 * Checklist under the create-account eyebrow.
 * Ranking is listed once. Tour stats (bustouts, song counts, gaps) stay off —
 * those pages are public. Keep `scripts/login-boot-shell.mjs` in sync.
 */
export const SIGNUP_ACCOUNT_BENEFIT_LEAD = 'When you create an account, you get';

export const SIGNUP_ACCOUNT_BENEFITS = [
  'Real-time setlist updates',
  'Scoring and ranking',
  'Picks history',
  'Stats for every show you play',
];
