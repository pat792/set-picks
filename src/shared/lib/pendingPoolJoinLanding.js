/**
 * Post-auth landing for a stored pool invite (`phish_pool_pending_invite`).
 * #768: Join Pool is the tertiary destination that owns join-by-code + retry.
 */

import { POOLS_CLUSTER_PATHS } from '../config/dashboardRoutes';

/**
 * @param {{ hasPendingInviteCode?: boolean }} [opts]
 * @returns {string}
 */
export function resolvePendingPoolJoinLandingPath(opts = {}) {
  const hasPendingInviteCode = Boolean(opts.hasPendingInviteCode);
  return hasPendingInviteCode
    ? POOLS_CLUSTER_PATHS.join
    : POOLS_CLUSTER_PATHS.list;
}
