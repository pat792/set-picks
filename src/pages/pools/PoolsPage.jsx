import React from 'react';
import { useNextShowPicksStatus } from '../../features/picks';
import {
  PoolJoinCreateCard,
  UserPoolsSection,
  useUserPools,
} from '../../features/pools';
import { getNextShow } from '../../shared/utils/timeLogic.js';

export default function Pools({ user }) {
  const { pools, loading, error, handleJoin, handleCreate } = useUserPools(
    user?.uid
  );
  const nextShowDate = getNextShow().date;
  const {
    hasSubmittedPicksForNextShow,
    loading: picksStatusLoading,
    error: picksStatusError,
  } = useNextShowPicksStatus(nextShowDate);
  const isSecured = picksStatusLoading
    ? false
    : picksStatusError
      ? false
      : hasSubmittedPicksForNextShow;

  return (
    <div className="mx-auto mt-4 max-w-5xl space-y-8 pb-12">
      <UserPoolsSection
        pools={pools}
        hasPicksForNextShow={isSecured}
        picksStatusLoading={picksStatusLoading}
      />
      <PoolJoinCreateCard
        loading={loading}
        error={error}
        onJoin={handleJoin}
        onCreate={handleCreate}
      />
    </div>
  );
}