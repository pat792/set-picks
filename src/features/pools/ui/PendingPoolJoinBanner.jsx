import React from 'react';

import Button from '../../../shared/ui/Button';

/**
 * Honest pending-invite chrome (#728 / #768) — shown on My Pools and Join Pool.
 *
 * @param {{
 *   pendingJoinState?: 'idle' | 'joining' | 'succeeded' | 'failed',
 *   pendingJoinErrorKind?: 'timeout' | 'generic' | 'invalid-code' | 'pool-full' | 'pool-archived' | null,
 *   onRetryPendingJoin?: (() => void) | null,
 *   retryPendingJoinLoading?: boolean,
 * }} props
 */
export default function PendingPoolJoinBanner({
  pendingJoinState = 'idle',
  pendingJoinErrorKind = null,
  onRetryPendingJoin = null,
  retryPendingJoinLoading = false,
}) {
  const isJoining = pendingJoinState === 'joining';
  const isJoinFailed = pendingJoinState === 'failed';
  if (!isJoining && !isJoinFailed) return null;

  return (
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
  );
}
