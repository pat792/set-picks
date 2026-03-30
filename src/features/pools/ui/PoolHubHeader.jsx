import React from 'react';
import { Copy } from 'lucide-react';

import Button from '../../../shared/ui/Button';

export default function PoolHubHeader({
  poolName,
  memberCount,
  inviteCode,
  onCopyCode,
  copied,
}) {
  const codeDisplay = inviteCode || '—';

  return (
    <header className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 space-y-4">
      <div>
        <h1 className="font-display text-display-md font-bold text-white">
          {poolName}
        </h1>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="bg-slate-900 px-4 py-3 rounded-2xl border border-slate-700">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
            Invite code
          </p>
          <span className="text-emerald-400 font-mono font-black tracking-[0.2em] text-xl">
            {codeDisplay}
          </span>
        </div>
        <Button
          type="button"
          variant="text"
          size="none"
          onClick={onCopyCode}
          disabled={!inviteCode}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white font-black uppercase tracking-widest text-sm hover:bg-slate-700 disabled:opacity-40"
        >
          <Copy className="w-4 h-4" aria-hidden />
          {copied ? 'Copied!' : 'Copy code'}
        </Button>
      </div>
    </header>
  );
}
