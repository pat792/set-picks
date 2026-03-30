import React from 'react';
import useUserPools from '../../features/pools/model/useUserPools';
import PoolJoinCreateCard from '../../features/pools/ui/PoolJoinCreateCard';
import UserPoolsSection from '../../features/pools/ui/UserPoolsSection';

export default function Pools({ user }) {
  const { pools, loading, error, handleJoin, handleCreate } = useUserPools(
    user?.uid
  );

  return (
    <div className="mx-auto mt-4 max-w-5xl space-y-8 pb-12">
      <UserPoolsSection pools={pools} />
      <PoolJoinCreateCard
        loading={loading}
        error={error}
        onJoin={handleJoin}
        onCreate={handleCreate}
      />
    </div>
  );
}