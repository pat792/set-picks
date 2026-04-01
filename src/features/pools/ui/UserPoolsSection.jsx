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
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-800/30 p-8 text-center">
          <p className="font-bold text-slate-400">You are not in any pools yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Join a friend&apos;s pool or create your own below.
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
