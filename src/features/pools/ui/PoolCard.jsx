import React from 'react';
import { Check, ChevronRight, CircleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import Card from '../../../shared/ui/Card';
import StatusBadge from '../../../shared/ui/StatusBadge';
import PoolInviteShareButton from './PoolInviteShareButton';

export default function PoolCard({
  pool,
  hasPicksForNextShow = false,
  picksStatusLoading = false,
}) {
  const memberCount = pool?.members?.length ?? 0;

  return (
    <Card
      as="article"
      variant="solid"
      padding="md"
      className="border-border-subtle/25 ring-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/dashboard/pool/${pool?.id}`}
              className="inline-flex items-center gap-1 text-lg font-bold text-brand-primary decoration-brand-primary/70 underline-offset-2 hover:text-brand-primary-strong hover:underline"
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
        <div className="flex shrink-0 items-start pt-0.5">
          <PoolInviteShareButton inviteCode={pool?.inviteCode} />
        </div>
      </div>
    </Card>
  );
}
