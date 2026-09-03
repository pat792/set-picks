import React from 'react';
import { useOutletContext } from 'react-router-dom';

import {
  PendingPoolJoinBanner,
  PoolJoinCard,
  usePoolsClusterScreen,
} from '../../features/pools';

/**
 * Pools tertiary — Join Pool (`/dashboard/pools/join`).
 * Pending-invite retry + join-by-code live here (#768).
 */
export default function PoolJoinPage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;
  const {
    actionLoading,
    error,
    pendingJoin,
    pendingInviteCode,
    retryBusy,
    onJoin,
    onRetryPendingJoin,
  } = usePoolsClusterScreen(user);

  const showPendingChrome =
    pendingJoin.state === 'joining' || pendingJoin.state === 'failed';

  return (
    <div className="space-y-6">
      {showPendingChrome ? (
        <PendingPoolJoinBanner
          pendingJoinState={pendingJoin.state}
          pendingJoinErrorKind={pendingJoin.errorKind}
          onRetryPendingJoin={
            pendingJoin.state === 'failed' ? onRetryPendingJoin : null
          }
          retryPendingJoinLoading={retryBusy}
        />
      ) : null}
      <PoolJoinCard
        actionLoading={actionLoading}
        error={error}
        onJoin={onJoin}
        initialCode={pendingInviteCode}
        autoFocus
      />
    </div>
  );
}
