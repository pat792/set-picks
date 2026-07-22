import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthSession } from '../../auth';
import {
  getLocalStorageItem,
  removeLocalStorageItem,
} from '../../../shared/lib/local-storage';
import { showErrorToast, showSuccessToast } from '../../../shared/ui/toast';
import { invalidateUserPools } from '../../pools';
import { joinPoolByInviteCode } from '../api/joinPool';
import { POOL_INVITE_STORAGE_KEY } from '../config';
import {
  resetPendingPoolJoinStatus,
  setPendingPoolJoinStatus,
} from './pendingPoolJoinStatus';

/** Prevents duplicate join attempts when React Strict Mode double-invokes effects. */
let pendingJoinKeyInFlight = null;

/** Client-side join timeout — keep breadcrumb + allow retry without refresh (#729). */
export const PENDING_POOL_JOIN_TIMEOUT_MS = 15_000;

/**
 * Clear in-flight dedupe so a retry (or a fresh mount after timeout) can run.
 * Exported for timeout/retry paths and tests.
 */
export function clearPendingPoolJoinInFlight() {
  pendingJoinKeyInFlight = null;
}

/**
 * @param {string | null | undefined} poolId
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @param {boolean} shouldNavigate
 */
function finishSuccessfulJoin({
  outcome,
  poolId,
  navigate,
  shouldNavigate,
}) {
  removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
  invalidateUserPools();
  setPendingPoolJoinStatus({
    state: 'succeeded',
    inviteCode: null,
    poolId: poolId ?? null,
    errorKind: null,
  });
  if (!shouldNavigate) return;
  if (outcome === 'joined') {
    showSuccessToast('You joined the pool!');
  } else {
    showSuccessToast("You're already in this pool.");
  }
  const href = poolId ? `/dashboard/pool/${poolId}` : '/dashboard/pools';
  navigate(href, { replace: true });
}

/**
 * @param {Array<string | { date?: string }>} showDates Season calendar dates for pick-doc pool snapshot backfill after join.
 */
export function usePendingPoolJoin(showDates = []) {
  const { userId } = useAuthSession();
  const navigate = useNavigate();
  // Calendar identity often changes FALLBACK → live while join is in flight.
  // Do not re-run / cancel the effect on that — membership may already be written
  // and a cancelled success handler would leave the invite breadcrumb stuck (UR-B3).
  const showDatesRef = useRef(showDates);
  showDatesRef.current = showDates;

  useEffect(() => {
    if (!userId) return;

    const code = getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim();
    if (!code) return;

    const dedupeKey = `${userId}:${code}`;
    if (pendingJoinKeyInFlight === dedupeKey) return;
    pendingJoinKeyInFlight = dedupeKey;

    let cancelled = false;
    let timedOut = false;

    setPendingPoolJoinStatus({
      state: 'joining',
      inviteCode: code,
      poolId: null,
      errorKind: null,
    });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      clearPendingPoolJoinInFlight();
      // Keep breadcrumb so user can retry from Pools without reopening the link.
      setPendingPoolJoinStatus({
        state: 'failed',
        inviteCode: code,
        poolId: null,
        errorKind: 'timeout',
      });
      showErrorToast('Still joining — tap Retry on the Pools tab.');
    }, PENDING_POOL_JOIN_TIMEOUT_MS);

    (async () => {
      try {
        const result = await joinPoolByInviteCode({
          userId,
          inviteCode: code,
          showDates: showDatesRef.current,
        });

        const success =
          result.outcome === 'joined' || result.outcome === 'already-member';

        // Unmount / dep churn: still heal breadcrumb if membership landed.
        if (cancelled) {
          if (success) {
            removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
            invalidateUserPools();
            resetPendingPoolJoinStatus();
          }
          return;
        }

        // Late completion after timeout: heal membership chrome without fighting Retry.
        if (timedOut) {
          if (success) {
            removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
            invalidateUserPools();
            resetPendingPoolJoinStatus();
          }
          return;
        }

        clearTimeout(timeoutId);

        if (result.outcome === 'joined' || result.outcome === 'already-member') {
          finishSuccessfulJoin({
            outcome: result.outcome,
            poolId: result.poolId,
            navigate,
            shouldNavigate: true,
          });
          return;
        }
        if (result.outcome === 'invalid-code') {
          removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
          resetPendingPoolJoinStatus();
          showErrorToast('That invite link is invalid or expired.');
          return;
        }
        if (result.outcome === 'pool-full') {
          removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
          resetPendingPoolJoinStatus();
          showErrorToast('This pool is full.');
          return;
        }
        if (result.outcome === 'pool-archived') {
          removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
          resetPendingPoolJoinStatus();
          showErrorToast('That pool is archived and no longer accepts new members.');
          return;
        }
      } catch {
        if (cancelled || timedOut) return;
        clearTimeout(timeoutId);
        // Keep breadcrumb on generic errors (#723 / #728).
        setPendingPoolJoinStatus({
          state: 'failed',
          inviteCode: code,
          poolId: null,
          errorKind: 'generic',
        });
        showErrorToast('Could not join the pool. Try again from the Pools tab.');
      } finally {
        if (!timedOut) {
          clearPendingPoolJoinInFlight();
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [userId, navigate]);
}
