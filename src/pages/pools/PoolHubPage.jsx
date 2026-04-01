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
    handleCopyCode,
    copied,
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
  const inviteCode =
    pool.inviteCode != null ? String(pool.inviteCode) : '';

  return (
    <div className="max-w-xl mx-auto mt-4 pb-24 space-y-10">
      <div className="px-1">
        <BackButton />
      </div>
      <PoolHubHeader
        poolName={pool.name}
        memberCount={memberCount}
        inviteCode={inviteCode}
        onCopyCode={handleCopyCode}
        copied={copied}
      />
      <PoolHubActiveShow
        showLabel={activeShowLine}
        isShowToday={isShowToday}
        isSecured={isSecured}
        isLocked={isLocked}
        nextShowTimeStatus={nextShowTimeStatus}
        picksStatusLoading={picksStatusLoading}
        poolId={pool.id}
      />
      <PoolHubLeaderboard members={members} />
      <PoolHubShowArchive poolId={poolId} />
    </div>
  );
}
