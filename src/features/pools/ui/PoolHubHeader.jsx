import React from 'react';

import PoolInviteCodeRow from './PoolInviteCodeRow';
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
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-bold text-white">{poolName}</h1>
          {isArchived ? (
            <span className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200">
              Archived
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-content-secondary">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
          {creatorLabel ? ` · ${creatorLabel}` : null}
        </p>
        <PoolInviteCodeRow
          inviteCode={inviteCode}
          disabled={isArchived}
          className="mt-2"
        />
      </div>
      <div className="shrink-0 sm:self-center">
        <PoolInviteShareButton
          inviteCode={inviteCode}
          poolName={poolName}
          onSuccess={onInviteShareSuccess}
          disabled={isArchived}
        />
      </div>
    </header>
  );
}
