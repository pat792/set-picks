import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';

import {
  UserPoolsSection,
  usePoolsClusterScreen,
} from '../../features/pools';
import { POOLS_CLUSTER_PATHS } from '../../shared/config/dashboardRoutes';
import {
  NAV_LABEL_CREATE_POOL,
  NAV_LABEL_JOIN_POOL,
} from '../../shared/config/dashboardVocabulary';

/**
 * Pools tertiary — My Pools (`/dashboard/pools`).
 */
export default function PoolsPage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;
  const {
    pools,
    listLoading,
    hasPicksForNextShow,
    picksStatusLoading,
    pendingJoin,
    retryBusy,
    onRetryPendingJoin,
  } = usePoolsClusterScreen(user);

  return (
    <UserPoolsSection
      pools={pools}
      hasPicksForNextShow={hasPicksForNextShow}
      picksStatusLoading={picksStatusLoading}
      listLoading={listLoading}
      pendingJoinState={pendingJoin.state}
      pendingJoinErrorKind={pendingJoin.errorKind}
      onRetryPendingJoin={
        pendingJoin.state === 'failed' ? onRetryPendingJoin : null
      }
      retryPendingJoinLoading={retryBusy}
      emptyAction={
        <>
          <Link
            to={POOLS_CLUSTER_PATHS.join}
            className="font-bold text-brand-primary hover:text-brand-primary-strong"
          >
            {NAV_LABEL_JOIN_POOL}
          </Link>
          {' or '}
          <Link
            to={POOLS_CLUSTER_PATHS.create}
            className="font-bold text-brand-primary hover:text-brand-primary-strong"
          >
            {NAV_LABEL_CREATE_POOL}
          </Link>
        </>
      }
    />
  );
}
