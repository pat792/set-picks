import React, { useCallback, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

import { useNextShowPicksStatus } from '../../features/picks';
import {
  clearPendingPoolJoinInFlight,
  resetPendingPoolJoinStatus,
  setPendingPoolJoinStatus,
  usePendingPoolJoinStatus,
} from '../../features/pool-invite';
import {
  PoolJoinCreateCard,
  PoolsHowItWorksBody,
  PoolsHowItWorksMenu,
  PoolsMobileFixedChrome,
  UserPoolsSection,
  useUserPools,
} from '../../features/pools';
import { useShowCalendar } from '../../features/show-calendar';
import { POOL_INVITE_STORAGE_KEY } from '../../shared/config/poolInvite';
import { useDashboardMobileChromePortal } from '../../shared/hooks/useDashboardMobileChromePortal';
import {
  getLocalStorageItem,
  removeLocalStorageItem,
} from '../../shared/lib/local-storage';
import DashboardActionRow from '../../shared/ui/DashboardActionRow';
import DashboardRowPill from '../../shared/ui/DashboardRowPill';
import { showErrorToast, showSuccessToast } from '../../shared/ui/toast';
import { getNextShow } from '../../shared/utils/timeLogic.js';
export default function Pools({ user }) {
  const navigate = useNavigate();
  const { showDates } = useShowCalendar();
  const {
    pools,
    listLoading,
    actionLoading,
    error,
    handleJoin,
    handleCreate,
  } = useUserPools(user?.uid, { showDates });
  const pendingJoin = usePendingPoolJoinStatus();
  const nextShowDate = getNextShow(showDates).date;
  const {
    hasSubmittedPicksForNextShow,
    loading: picksStatusLoading,
    error: picksStatusError,
  } = useNextShowPicksStatus(nextShowDate);
  const isSecured = picksStatusLoading
    ? false
    : picksStatusError
      ? false
      : hasSubmittedPicksForNextShow;
  const mobileChromeRoot = useDashboardMobileChromePortal();
  const howItWorksContentId = useId();
  const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState(false);
  const [retryBusy, setRetryBusy] = useState(false);

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
        navigate(`/dashboard/pool/${joinedPool.id}`, { replace: true });
      }
    } catch (joinError) {
      if (joinError?.code === 'already-in-pool') {
        removeLocalStorageItem(POOL_INVITE_STORAGE_KEY);
        resetPendingPoolJoinStatus();
        showSuccessToast("You're already in this pool.");
        if (joinError.poolId) {
          navigate(`/dashboard/pool/${joinError.poolId}`, { replace: true });
        }
        return;
      }
      // Keep breadcrumb for transient failures.
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
  }, [handleJoin, navigate, pendingJoin.inviteCode]);

  return (
    <div className="w-full pb-6 md:pb-12">
      {mobileChromeRoot
        ? createPortal(
            <PoolsMobileFixedChrome
              isHowItWorksExpanded={isHowItWorksExpanded}
              onToggleHowItWorks={() => setIsHowItWorksExpanded((prev) => !prev)}
              howItWorksContentId={howItWorksContentId}
            />,
            mobileChromeRoot,
          )
        : null}

      <div className="mb-8 hidden md:block">
        <DashboardActionRow>
          <PoolsHowItWorksMenu
            leading={
              <DashboardRowPill as={Link} to="/dashboard" tone="accent">
                <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                Go to Picks
              </DashboardRowPill>
            }
          />
        </DashboardActionRow>
      </div>

      <div
        id={howItWorksContentId}
        className={isHowItWorksExpanded ? 'mb-6 md:hidden' : 'hidden'}
      >
        <PoolsHowItWorksBody />
      </div>

      <div className="space-y-8">
        <UserPoolsSection
          pools={pools}
          hasPicksForNextShow={isSecured}
          picksStatusLoading={picksStatusLoading}
          listLoading={listLoading}
          pendingJoinState={pendingJoin.state}
          pendingJoinErrorKind={pendingJoin.errorKind}
          onRetryPendingJoin={
            pendingJoin.state === 'failed' ? onRetryPendingJoin : null
          }
          retryPendingJoinLoading={retryBusy}
        />
        <PoolJoinCreateCard
          actionLoading={actionLoading}
          error={error}
          onJoin={handleJoin}
          onCreate={handleCreate}
        />
      </div>
    </div>
  );
}
