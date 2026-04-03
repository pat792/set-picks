import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthSession } from '../../auth';
import {
  getLocalStorageItem,
  removeLocalStorageItem,
} from '../../../shared/lib/local-storage';
import { showErrorToast, showSuccessToast } from '../../../shared/ui/toast';
import { joinPoolByInviteCode } from '../api/joinPool';
import { POOL_INVITE_STORAGE_KEY } from '../config';

/** Prevents duplicate join attempts when React Strict Mode double-invokes effects. */
let pendingJoinKeyInFlight = null;

export function usePendingPoolJoin() {
  const { userId } = useAuthSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const code = getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim();
    if (!code) return;

    const dedupeKey = `${userId}:${code}`;
    if (pendingJoinKeyInFlight === dedupeKey) return;
    pendingJoinKeyInFlight = dedupeKey;

    (async () => {
      removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);

      try {
        const outcome = await joinPoolByInviteCode({
          userId,
          inviteCode: code,
        });

        if (outcome === 'joined') {
          showSuccessToast('You joined the pool!');
          navigate('/dashboard/pools', { replace: true });
          return;
        }
        if (outcome === 'already-member') {
          showSuccessToast("You're already in this pool.");
          navigate('/dashboard/pools', { replace: true });
          return;
        }
        if (outcome === 'invalid-code') {
          showErrorToast('That invite link is invalid or expired.');
          return;
        }
        if (outcome === 'pool-full') {
          showErrorToast('This pool is full.');
          return;
        }
      } catch {
        showErrorToast('Could not join the pool. Try again from the Pools tab.');
      } finally {
        pendingJoinKeyInFlight = null;
      }
    })();
  }, [userId, navigate]);
}
