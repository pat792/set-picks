/**
 * Admin authorization helpers for HTTPS callables (issue #139).
 *
 * Pure functions — no `firebase-admin` dependency so they can be unit-tested
 * without spinning up the Firebase Functions test harness. Consumed by
 * `functions/index.js` to gate `rollupScoresForShow`, `revertRollupForShow`, `setAdminClaim`, and
 * every other admin-only callable.
 *
 * PR B tightening: the legacy `pat@road2media.com` email fallback was removed
 * from the admin caller check alongside the Firestore rules tightening. The
 * `admin: true` custom claim is now the single source of truth. The break-
 * glass `SUPER_ADMIN_UIDS` env-var path is retained so the claim can still be
 * bootstrapped on a fresh project or recovered after accidental revocation.
 */

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
 * As of PR B this is claim-only. Returns `null` when the caller does not
 * qualify. Callers in `functions/index.js` convert `null` into an
 * `HttpsError("permission-denied")`.
 *
 * @param {{ uid?: string, token?: { admin?: boolean } } | null | undefined} authLike
 * @returns {"admin-claim" | null}
 */
function resolveAdminCallerRole(authLike) {
  if (!authLike) return null;
  const token = authLike.token || {};
  if (token.admin === true) return "admin-claim";
  return null;
}

/**
 * Decide whether the caller of `setAdminClaim` qualifies to grant/revoke the
 * claim. Super-admins are `SUPER_ADMIN_UIDS` members (the bootstrap /
 * break-glass path). Anyone already holding `admin: true` can also grant
 * (delegation).
 *
 * @param {{ uid?: string, token?: { admin?: boolean } } | null | undefined} authLike
 * @param {Set<string>} superAdminUids
 * @returns {"super-admin" | "admin" | null}
 */
function resolveSetAdminClaimCallerRole(authLike, superAdminUids) {
  if (!authLike) return null;
  const uid = authLike.uid;
  const token = authLike.token || {};
  if (uid && superAdminUids.has(uid)) {
    return "super-admin";
  }
  if (token.admin === true) return "admin";
  return null;
}

module.exports = {
  parseSuperAdminUidsEnv,
  resolveAdminCallerRole,
  resolveSetAdminClaimCallerRole,
};
