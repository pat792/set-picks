import { useCallback, useEffect, useState } from 'react';

import {
  buildPoolInviteShareTitle,
  buildPoolInviteShareTitleFromInviter,
  buildPoolInviteUrl,
  shareInvite,
} from '../../invite';

/**
 * Orchestrates pool invite link sharing (Web Share API or clipboard).
 * Uses the shared invite kit (#579); optional inviter handle adds `?from=`.
 */
export function usePoolInviteShare({
  inviteCode,
  poolName,
  inviterHandle,
  poolId,
  onSuccess,
  disabled = false,
}) {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    setStatus('idle');
  }, [inviteCode]);

  const handleShareClick = useCallback(async () => {
    if (disabled || !inviteCode) return;
    const url = buildPoolInviteUrl(inviteCode, inviterHandle);
    const result = await shareInvite({
      invite_kind: 'pool',
      url,
      poolName,
      inviterHandle,
      pool_id: poolId,
      copyToastMessage: 'Invite link copied!',
    });

    if (result.ok) {
      onSuccess?.();
      setStatus(result.via === 'share' ? 'shared' : 'copied');
      window.setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 2000);
    }
  }, [inviteCode, poolName, inviterHandle, poolId, onSuccess, disabled]);

  const label =
    status === 'shared'
      ? 'Shared!'
      : status === 'copied'
        ? 'Copied!'
        : status === 'error'
          ? 'Try again'
          : 'Invite Friends!';

  const title = inviterHandle
    ? buildPoolInviteShareTitleFromInviter(inviterHandle, poolName)
    : buildPoolInviteShareTitle(poolName);

  return {
    label,
    onShareClick: handleShareClick,
    disabled: disabled || !inviteCode,
    title,
  };
}
