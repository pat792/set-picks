import React, { useState } from 'react';
import { Check, ChevronRight, CircleAlert, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { createPoolInviteLink } from '../../pool-invite';
import Button from '../../../shared/ui/Button';
import Card from '../../../shared/ui/Card';
import StatusBadge from '../../../shared/ui/StatusBadge';

export default function PoolCard({
  pool,
  hasPicksForNextShow = false,
  picksStatusLoading = false,
}) {
  const memberCount = pool?.members?.length ?? 0;
  const [copyStatus, setCopyStatus] = useState('idle');

  const handleCopyInviteLink = async () => {
    const code = pool?.inviteCode;
    const url = createPoolInviteLink(code);
    if (!url || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopyStatus('error');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <Card
      as="article"
      variant="solid"
      padding="md"
      className="border-slate-700/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/dashboard/pool/${pool?.id}`}
              className="inline-flex items-center gap-1 text-lg font-bold text-emerald-400 hover:text-emerald-300 hover:underline decoration-emerald-400/70 underline-offset-2"
            >
              <span className="truncate">{pool?.name}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
            {!picksStatusLoading ? (
              <StatusBadge
                variant={hasPicksForNextShow ? 'success' : 'warning'}
                icon={
                  hasPicksForNextShow ? (
                    <Check strokeWidth={2.5} />
                  ) : (
                    <CircleAlert />
                  )
                }
                className="text-[10px] font-black uppercase tracking-widest"
                title={
                  hasPicksForNextShow
                    ? 'Picks submitted for the next show'
                    : 'No picks yet for the next show'
                }
              >
                {hasPicksForNextShow ? 'Picks in' : 'No picks'}
              </StatusBadge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-400 uppercase tracking-widest">
            {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-emerald-400 font-mono font-black tracking-widest text-xs">
            {pool?.inviteCode || '-----'}
          </span>
          <Button
            type="button"
            variant="text"
            size="none"
            onClick={handleCopyInviteLink}
            disabled={!pool?.inviteCode}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-40"
            title="Copy invite link"
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden />
            {copyStatus === 'copied'
              ? 'Copied!'
              : copyStatus === 'error'
                ? 'Copy failed'
                : 'Copy link'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
