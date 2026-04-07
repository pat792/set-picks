import React from 'react';

import PoolCard from './PoolCard';

export default function UserPoolsSection({
  pools,
  hasPicksForNextShow = false,
  picksStatusLoading = false,
}) {
  return (
    <section className="space-y-4">
      {pools.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border-muted bg-surface-glass p-8 text-center shadow-inset-glass">
          <p className="font-bold text-slate-400">You are not in any pools yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Join with a code or create a pool below, then lock picks on the Picks tab.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              hasPicksForNextShow={hasPicksForNextShow}
              picksStatusLoading={picksStatusLoading}
            />
          ))}
        </div>
      )}
    </section>
  );
}
