import { useEffect } from 'react';

import { FALLBACK_SHOW_DATES } from '../../../shared/data/showDates';
import { getLocalStorageItem } from '../../../shared/lib/local-storage';
import { useAuthSession } from '../../auth';
import { POOL_INVITE_STORAGE_KEY } from '../config';
import { runPendingPoolJoin } from './pendingPoolJoinRunner';
import { setPendingPoolJoinStatus } from './pendingPoolJoinStatus';

/**
 * Pool invite only: fire the join as soon as the visitor is authenticated (#731).
 *
 * `usePendingPoolJoin` owns toasts, navigation and the timeout, but it lives in
 * `DashboardLayout` — so the join used to wait on the DashboardRoute chunk, and
 * for a brand-new signup on the whole `/setup` detour. Starting here overlaps
 * the write with those downloads. This hook deliberately does not navigate,
 * clear the breadcrumb, or fail loudly: `/setup` must keep the new user, and
 * the dashboard still finalizes by adopting the same in-flight request.
 *
 * Site invites (`/invite/:handle`) must never call this — no pool side effects.
 */
export function useEarlyPoolInviteJoin() {
  const { userId } = useAuthSession();

  useEffect(() => {
    if (!userId) return;

    const code = getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim();
    if (!code) return;

    setPendingPoolJoinStatus({
      state: 'joining',
      inviteCode: code,
      poolId: null,
      errorKind: null,
    });

    // Only used for legacy `pick.pools` backfill; the live calendar lives behind
    // the dashboard provider, and the fallback is what that provider starts with.
    runPendingPoolJoin({
      userId,
      inviteCode: code,
      showDates: FALLBACK_SHOW_DATES,
    });
  }, [userId]);
}
