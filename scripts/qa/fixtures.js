/**
 * Shared fixtures for `scripts/qa/*.mjs` runners (issue #251).
 *
 * Values come from `process.env`, populated by the QA runner npm scripts
 * via Node's `--env-file-if-exists=.env.qa.local` flag (see package.json).
 * `.env.qa.local` is gitignored; `.env.qa.example` is the committed
 * template documenting expected values.
 *
 * Why env vars instead of hard-coded constants:
 *   - The default values point at real staging Firestore data (a UID
 *     with rich graded-pick history), which we don't want in repo
 *     history forever — it locks future work to a specific user account
 *     and leaks mild PII into git log / PR diffs / IDE search hits.
 *   - When a dedicated `qa-test-public-profile` UID gets seeded
 *     (deferred follow-up per #251), the migration is a one-line
 *     change to `.env.qa.example` — no code churn.
 *   - CI (also a deferred follow-up) populates these from repo secrets
 *     without touching this file.
 */

const PLACEHOLDER_PUBLIC_PROFILE_UID = 'YOUR_STAGING_FIREBASE_UID';

/**
 * Read a required env var. Throws with a pointer to the setup docs if
 * missing or still set to the placeholder from `.env.qa.example`.
 *
 * @param {string} name
 * @param {string} placeholder
 * @returns {string}
 */
function requireEnv(name, placeholder) {
  const value = process.env[name];
  if (!value || value === placeholder) {
    throw new Error(
      `[scripts/qa/fixtures] ${name} is not set. Copy .env.qa.example to ` +
        '.env.qa.local and fill in the real value. See scripts/qa/README.md.',
    );
  }
  return value;
}

/**
 * UID navigated to as `/user/<uid>` by `firestore-cache.mjs`. Public
 * profile route — no auth required. Must have a populated
 * `users/{uid}` materialized aggregate AND graded picks across enough
 * shows that the initial WebChannel read is comfortably > 5 kB.
 */
export const PUBLIC_PROFILE_UID = requireEnv(
  'QA_PUBLIC_PROFILE_UID',
  PLACEHOLDER_PUBLIC_PROFILE_UID,
);
