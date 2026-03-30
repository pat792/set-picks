import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { usePoolHub } from '../../features/pools/model/usePoolHub';
import PoolHubHeader from '../../features/pools/ui/PoolHubHeader';
import PoolHubLeaderboard from '../../features/pools/ui/PoolHubLeaderboard';
import PoolHubShowArchive from '../../features/pools/ui/PoolHubShowArchive';

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
      <PoolHubHeader
        poolName={pool.name}
        memberCount={memberCount}
        inviteCode={inviteCode}
        onCopyCode={handleCopyCode}
        copied={copied}
      />
      <PoolHubLeaderboard members={members} />
      <PoolHubShowArchive poolId={poolId} />
    </div>
  );
}
