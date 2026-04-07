import React from 'react';
import { Link } from 'react-router-dom';
import { ListMusic } from 'lucide-react';

import { useNextShowPicksStatus } from '../../features/picks';
import {
  PoolJoinCreateCard,
  UserPoolsSection,
  useUserPools,
} from '../../features/pools';
import DashboardActionRow from '../../shared/ui/DashboardActionRow';
import DashboardRowPill from '../../shared/ui/DashboardRowPill';
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
    <div className="w-full space-y-8 pb-6 md:pb-12">
      <DashboardActionRow>
        <DashboardRowPill as={Link} to="/dashboard" tone="muted">
          <ListMusic className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Go to Picks
        </DashboardRowPill>
      </DashboardActionRow>

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