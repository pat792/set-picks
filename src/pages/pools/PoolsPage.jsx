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
    <div className="mx-auto max-w-5xl space-y-8 pb-6 md:pb-12">
      <DashboardActionRow
        summary={
          <>
            Open a pool card for <span className="font-semibold text-slate-300">who&apos;s in</span>{' '}
            and <span className="font-semibold text-slate-300">invites</span>. Create or join below —
            then lock picks on the Picks tab.
          </>
        }
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-emerald-500/40 hover:bg-slate-700 hover:text-emerald-400"
        >
          <ListMusic className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Make picks
        </Link>
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