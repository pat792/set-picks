import React from 'react';
import { useOutletContext } from 'react-router-dom';

import { PoolCreateCard, usePoolsClusterScreen } from '../../features/pools';

/**
 * Pools tertiary — Create Pool (`/dashboard/pools/create`).
 */
export default function PoolCreatePage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;
  const { actionLoading, error, onCreate } = usePoolsClusterScreen(user);

  return (
    <PoolCreateCard
      actionLoading={actionLoading}
      error={error}
      onCreate={onCreate}
    />
  );
}
