import React from 'react';

import PoolInviteShareButton from './PoolInviteShareButton';

export default function PoolHubHeader({
  poolName,
  memberCount,
  inviteCode,
  onInviteShareSuccess,
  creatorLabel,
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-white truncate">{poolName}</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
          {creatorLabel ? ` · ${creatorLabel}` : null}
        </p>
      </div>
      <div className="shrink-0 sm:self-center">
        <PoolInviteShareButton
          inviteCode={inviteCode}
          onSuccess={onInviteShareSuccess}
        />
      </div>
    </header>
  );
}
