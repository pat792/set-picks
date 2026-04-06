import React from 'react';

import PoolInviteShareButton from './PoolInviteShareButton';

export default function PoolHubHeader({
  poolName,
  memberCount,
  inviteCode,
  onInviteShareSuccess,
  creatorLabel,
  isArchived = false,
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{poolName}</h1>
          {isArchived ? (
            <span className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200">
              Archived
            </span>
          ) : null}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
          {creatorLabel ? ` · ${creatorLabel}` : null}
        </p>
      </div>
      <div className="shrink-0 sm:self-center">
        <PoolInviteShareButton
          inviteCode={inviteCode}
          onSuccess={onInviteShareSuccess}
          disabled={isArchived}
        />
      </div>
    </header>
  );
}
