import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNextShowPicksStatus } from '../../picks';
import {
  clearPendingPoolJoinInFlight,
  resetPendingPoolJoinStatus,
  setPendingPoolJoinStatus,
  usePendingPoolJoinStatus,
} from '../../pool-invite';
import { useShowCalendar } from '../../show-calendar';
import { POOL_INVITE_STORAGE_KEY } from '../../../shared/config/poolInvite';
import {
  getLocalStorageItem,
  removeLocalStorageItem,
} from '../../../shared/lib/local-storage';
import { showErrorToast, showSuccessToast } from '../../../shared/ui/toast';
import { getNextShow } from '../../../shared/utils/timeLogic.js';
import useUserPools from './useUserPools';

/**
 * Shared Pools-cluster orchestration (#768). Pages stay thin; IO stays here.
 *
 * @param {import('firebase/auth').User | null | undefined} user
 */
export default function usePoolsClusterScreen(user) {
  const navigate = useNavigate();
  const { showDates } = useShowCalendar();
  const { pools, listLoading, actionLoading, error, handleJoin, handleCreate } =
    useUserPools(user?.uid, { showDates });
  const pendingJoin = usePendingPoolJoinStatus();
  const nextShowDate = getNextShow(showDates).date;
  const {
    hasSubmittedPicksForNextShow,
    loading: picksStatusLoading,
    error: picksStatusError,
  } = useNextShowPicksStatus(nextShowDate);
  const hasPicksForNextShow = picksStatusLoading
    ? false
    : picksStatusError
      ? false
      : hasSubmittedPicksForNextShow;
  const [retryBusy, setRetryBusy] = useState(false);

  const goToPoolDetails = useCallback(
    (poolId, { replace = false } = {}) => {
      if (!poolId) return;
      navigate(`/dashboard/pool/${poolId}`, { replace });
    },
    [navigate],
  );

  const onJoin = useCallback(
    async (code) => {
      try {
        const joinedPool = await handleJoin(code);
        removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
        resetPendingPoolJoinStatus();
        if (joinedPool?.id) goToPoolDetails(joinedPool.id);
        return joinedPool;
      } catch (joinError) {
        if (joinError?.code === 'already-in-pool') {
          removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
          resetPendingPoolJoinStatus();
          showSuccessToast("You're already in this pool.");
          if (joinError.poolId) goToPoolDetails(joinError.poolId);
        }
        throw joinError;
      }
    },
    [goToPoolDetails, handleJoin],
  );

  const onCreate = useCallback(
    async (name) => {
      const createdPool = await handleCreate(name);
      if (createdPool?.id) goToPoolDetails(createdPool.id);
      return createdPool;
    },
    [goToPoolDetails, handleCreate],
  );

  const onRetryPendingJoin = useCallback(async () => {
    const code =
      pendingJoin.inviteCode?.trim() ||
      getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim();
    if (!code) return;

    clearPendingPoolJoinInFlight();
    setRetryBusy(true);
    setPendingPoolJoinStatus({
      state: 'joining',
      inviteCode: code,
      poolId: null,
      errorKind: null,
    });

    try {
      const joinedPool = await handleJoin(code);
      removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
      resetPendingPoolJoinStatus();
      showSuccessToast('You joined the pool!');
      if (joinedPool?.id) {
        goToPoolDetails(joinedPool.id, { replace: true });
      }
    } catch (joinError) {
      if (joinError?.code === 'already-in-pool') {
        removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
        resetPendingPoolJoinStatus();
        showSuccessToast("You're already in this pool.");
        if (joinError.poolId) {
          goToPoolDetails(joinError.poolId, { replace: true });
        }
        return;
      }
      setPendingPoolJoinStatus({
        state: 'failed',
        inviteCode: code,
        poolId: null,
        errorKind: 'generic',
      });
      if (joinError?.code === 'invalid-invite-code') {
        removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
        resetPendingPoolJoinStatus();
        showErrorToast('That invite link is invalid or expired.');
        return;
      }
      if (joinError?.code === 'pool-full') {
        removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
        resetPendingPoolJoinStatus();
        showErrorToast('This pool is full.');
        return;
      }
      if (joinError?.code === 'pool-archived') {
        removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
        resetPendingPoolJoinStatus();
        showErrorToast('That pool is archived and no longer accepts new members.');
        return;
      }
      showErrorToast('Could not join the pool. Try again.');
    } finally {
      setRetryBusy(false);
    }
  }, [goToPoolDetails, handleJoin, pendingJoin.inviteCode]);

  const pendingInviteCode =
    pendingJoin.inviteCode?.trim() ||
    getLocalStorageItem(POOL_INVITE_STORAGE_KEY)?.trim() ||
    '';

  return {
    pools,
    listLoading,
    actionLoading,
    error,
    hasPicksForNextShow,
    picksStatusLoading,
    pendingJoin,
    pendingInviteCode,
    retryBusy,
    onJoin,
    onCreate,
    onRetryPendingJoin,
  };
}
