import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useNextShowPicksStatus } from '../../features/picks';
import {
  PoolHubActiveShow,
  PoolHubHeader,
  PoolHubLeaderboard,
  PoolHubShowArchive,
  usePoolHub,
} from '../../features/pools';
import {
  SEASON_TOTALS_DESCRIPTION,
  SEASON_TOTALS_HEADING,
} from '../../shared/config/dashboardVocabulary';
import BackButton from '../../shared/ui/BackButton';
import { todayYmd } from '../../shared/utils/dateUtils.js';
import { getNextShow, getShowStatus } from '../../shared/utils/timeLogic.js';
import { showOptionLabelDesktop } from '../../shared/utils/showOptionLabel.js';

export default function PoolHubPage({ user }) {
  const { poolId } = useParams();
  const {
    pool,
    members,
    loading,
    notFound,
    forbidden,
    inviteCode,
    onInviteShareSuccess,
  } = usePoolHub(poolId, user);
  const nextShow = getNextShow();
  const nextShowDate = nextShow.date;
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
  const nextShowTimeStatus = getShowStatus(nextShowDate);
  const isLocked =
    nextShowTimeStatus === 'LIVE' ||
    nextShowTimeStatus === 'PAST' ||
    nextShowTimeStatus === 'FUTURE';
  const activeShowLine = showOptionLabelDesktop(nextShow);
  const isShowToday = nextShow.date === todayYmd();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 mt-20 text-emerald-400">
        <Loader2 className="w-10 h-10 animate-spin" aria-hidden />
        <p className="font-bold">Loading pool…</p>
      </div>
    );
  }

  if (notFound || !pool) {
    return (
      <div className="max-w-xl mx-auto mt-8 text-center space-y-4">
        <p className="text-slate-300 font-bold">Pool not found.</p>
        <Link
          to="/dashboard/pools"
          className="inline-block text-emerald-400 font-black uppercase tracking-widest text-sm hover:text-emerald-300 hover:underline"
        >
          Back to pools
        </Link>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-xl mx-auto mt-8 text-center space-y-4">
        <p className="text-slate-300 font-bold">
          You are not a member of this pool.
        </p>
        <Link
          to="/dashboard/pools"
          className="inline-block text-emerald-400 font-black uppercase tracking-widest text-sm hover:text-emerald-300 hover:underline"
        >
          Back to pools
        </Link>
      </div>
    );
  }

  const memberCount = pool.members?.length ?? 0;
  const ownerId = pool.ownerId;
  const ownerMember =
    ownerId != null ? members.find((m) => m.id === ownerId) : null;
  const ownerHandle =
    ownerMember?.handle != null
      ? String(ownerMember.handle).trim()
      : '';
  const creatorLabel =
    ownerHandle !== '' ? `Created by ${ownerHandle}` : null;

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-16 flex flex-col gap-3 md:gap-6">
      <div className="flex flex-col gap-2">
        <div className="px-1">
          <BackButton />
        </div>
        <PoolHubHeader
          poolName={pool.name}
          memberCount={memberCount}
          inviteCode={inviteCode}
          onInviteShareSuccess={onInviteShareSuccess}
          creatorLabel={creatorLabel}
        />
      </div>
      <div className="flex flex-col gap-6">
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
            Game Status
          </h2>
          <PoolHubActiveShow
            showLabel={activeShowLine}
            isShowToday={isShowToday}
            isSecured={isSecured}
            isLocked={isLocked}
            nextShowTimeStatus={nextShowTimeStatus}
            picksStatusLoading={picksStatusLoading}
            poolId={pool.id}
          />
        </section>
        <PoolHubShowArchive poolId={poolId} />
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
            {SEASON_TOTALS_HEADING}
          </h2>
          <p className="text-xs font-medium text-slate-500 leading-relaxed mb-3 ml-1 max-w-md">
            {SEASON_TOTALS_DESCRIPTION}
          </p>
          <PoolHubLeaderboard members={members} />
        </section>
      </div>
    </div>
  );
}
