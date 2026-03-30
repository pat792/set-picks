import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import Card from '../../../shared/ui/Card';

export default function PoolCard({ pool }) {
  const memberCount = pool?.members?.length ?? 0;

  return (
    <Card
      as="article"
      variant="solid"
      padding="md"
      className="border-slate-700/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/dashboard/pool/${pool?.id}`}
            className="inline-flex items-center gap-1 text-lg font-bold text-emerald-400 hover:text-emerald-300 hover:underline decoration-emerald-400/70 underline-offset-2"
          >
            <span className="truncate">{pool?.name}</span>
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
          <p className="mt-1 text-xs text-slate-400 uppercase tracking-widest">
            {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
          </p>
        </div>
        <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-emerald-400 font-mono font-black tracking-widest text-xs">
          {pool?.inviteCode || '-----'}
        </span>
      </div>
    </Card>
  );
}
