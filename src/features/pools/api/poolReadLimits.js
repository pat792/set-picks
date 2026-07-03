/**
 * Caps for pool-related Firestore list reads (#415).
 * Documented product limits — not a hard product ban on larger pools.
 */

/** Max member profiles loaded for pool hub / leaderboard surfaces. */
export const MAX_POOL_MEMBERS_FETCH = 100;

/** Max pools returned for a single user's membership list. */
export const MAX_USER_POOLS_FETCH = 50;
