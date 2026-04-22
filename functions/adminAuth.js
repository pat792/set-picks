/**
 * Admin authorization helpers for HTTPS callables (issue #139 PR A).
 *
 * Pure functions — no `firebase-admin` dependency so they can be unit-tested
 * without spinning up the Firebase Functions test harness. Consumed by
 * `functions/index.js` to gate `rollupScoresForShow` and `setAdminClaim`.
 */

/** Must match `src/features/auth/api/authApi.js` legacy fallback. */
const ADMIN_EMAIL_FOR_SETLIST_PROXY = "pat@road2media.com";

/**
 * Parse `SUPER_ADMIN_UIDS` (comma-separated uids) from the given env into a
 * Set. Defaults to `process.env` but accepts an injected env for tests.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Set<string>}
 */
function parseSuperAdminUidsEnv(env = process.env) {
  const raw = env.SUPER_ADMIN_UIDS;
  if (!raw) return new Set();
  return new Set(
    String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/**
 * Decide whether the caller of an admin-gated callable qualifies as admin.
 * Accepts either the `admin: true` custom claim (#139 target state) or the
 * legacy hard-coded admin email (transition only; drop in PR B).
 *
 * Returns `null` when neither qualifies. Callers in `functions/index.js`
 * convert `null` into an `HttpsError("permission-denied")`.
 *
 * @param {{ uid?: string, token?: { admin?: boolean, email?: string } } | null | undefined} authLike
 * @returns {"admin-claim" | "legacy-email" | null}
 */
function resolveAdminCallerRole(authLike) {
  if (!authLike) return null;
  const token = authLike.token || {};
  if (token.admin === true) return "admin-claim";
  if (token.email === ADMIN_EMAIL_FOR_SETLIST_PROXY) return "legacy-email";
  return null;
}

/**
 * Decide whether the caller of `setAdminClaim` qualifies to grant/revoke the
 * claim. Super-admins are `SUPER_ADMIN_UIDS` members **or** the legacy email
 * holder (bootstrap only). Anyone already holding `admin: true` can also grant
 * (delegation).
 *
 * @param {{ uid?: string, token?: { admin?: boolean, email?: string } } | null | undefined} authLike
 * @param {Set<string>} superAdminUids
 * @returns {"super-admin" | "admin" | null}
 */
function resolveSetAdminClaimCallerRole(authLike, superAdminUids) {
  if (!authLike) return null;
  const uid = authLike.uid;
  const token = authLike.token || {};
  if (
    (uid && superAdminUids.has(uid)) ||
    token.email === ADMIN_EMAIL_FOR_SETLIST_PROXY
  ) {
    return "super-admin";
  }
  if (token.admin === true) return "admin";
  return null;
}

module.exports = {
  ADMIN_EMAIL_FOR_SETLIST_PROXY,
  parseSuperAdminUidsEnv,
  resolveAdminCallerRole,
  resolveSetAdminClaimCallerRole,
};
