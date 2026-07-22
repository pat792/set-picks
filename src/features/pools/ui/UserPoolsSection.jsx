import React from 'react';

import Button from '../../../shared/ui/Button';
import PoolCard from './PoolCard';

/**
 * @param {{
 *   pools: Array<{ id: string }>,
 *   hasPicksForNextShow?: boolean,
 *   picksStatusLoading?: boolean,
 *   listLoading?: boolean,
 *   pendingJoinState?: 'idle' | 'joining' | 'succeeded' | 'failed',
 *   pendingJoinErrorKind?: 'timeout' | 'generic' | 'invalid-code' | 'pool-full' | 'pool-archived' | null,
 *   onRetryPendingJoin?: (() => void) | null,
 *   retryPendingJoinLoading?: boolean,
 * }} props
 */
export default function UserPoolsSection({
  pools,
  hasPicksForNextShow = false,
  picksStatusLoading = false,
  listLoading = false,
  pendingJoinState = 'idle',
  pendingJoinErrorKind = null,
  onRetryPendingJoin = null,
  retryPendingJoinLoading = false,
}) {
  const isJoining = pendingJoinState === 'joining';
  const isJoinFailed = pendingJoinState === 'failed';
  const showJoiningChrome = isJoining || isJoinFailed;
  const showEmpty =
    !showJoiningChrome && !listLoading && pools.length === 0;
  const showListLoading = listLoading && pools.length === 0 && !showJoiningChrome;

  return (
    <section className="space-y-4">
      {showJoiningChrome ? (
        <div className="rounded-3xl border border-dashed border-brand-primary/40 bg-brand-primary/5 p-8 text-center shadow-inset-glass">
          <p className="font-bold text-brand-primary">
            {isJoining ? 'Joining your pool…' : "Couldn't finish joining"}
          </p>
          <p className="mt-1 text-sm text-content-secondary/90">
            {isJoining
              ? 'Hang tight — we’re adding you now.'
              : pendingJoinErrorKind === 'timeout'
                ? 'That took too long. Your invite is still saved — retry below.'
                : 'Your invite is still saved — retry below, or paste the code in Join Pool.'}
          </p>
          {isJoinFailed && typeof onRetryPendingJoin === 'function' ? (
            <Button
              variant="primary"
              type="button"
              className="mt-4 uppercase tracking-widest"
              disabled={retryPendingJoinLoading}
              onClick={onRetryPendingJoin}
            >
              {retryPendingJoinLoading ? 'Retrying…' : 'Retry join'}
            </Button>
          ) : null}
        </div>
      ) : null}

      {showListLoading ? (
        <div className="rounded-3xl border border-dashed border-border-muted bg-surface-glass p-8 text-center shadow-inset-glass">
          <p className="font-bold text-content-secondary">Loading your pools…</p>
        </div>
      ) : null}

      {showEmpty ? (
        <div className="rounded-3xl border border-dashed border-border-muted bg-surface-glass p-8 text-center shadow-inset-glass">
          <p className="font-bold text-content-secondary">You are not in any pools yet.</p>
          <p className="mt-1 text-sm text-content-secondary/90">
            Join with a code or create a pool below, then lock picks on the Picks tab.
          </p>
        </div>
      ) : null}

      {pools.length > 0 ? (
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
      ) : null}
    </section>
  );
}
