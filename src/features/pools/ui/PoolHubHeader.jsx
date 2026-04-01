import React from 'react';
import { Copy } from 'lucide-react';

import GhostPill from '../../../shared/ui/GhostPill';

export default function PoolHubHeader({
  poolName,
  memberCount,
  inviteCode,
  onCopyCode,
  copied,
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
        <GhostPill
          type="button"
          icon={Copy}
          onClick={onCopyCode}
          disabled={!inviteCode}
          className="disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-slate-800 disabled:hover:text-slate-300"
        >
          {copied ? 'Copied!' : 'Invite Code'}
        </GhostPill>
      </div>
    </header>
  );
}
