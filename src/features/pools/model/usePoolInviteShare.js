import { useCallback, useEffect, useState } from 'react';

import { createPoolInviteLink } from '../../../shared/lib/createPoolInviteLink';
import { shareOrCopyInviteUrl } from '../../../shared/lib/shareOrCopyInviteUrl';

/**
 * Orchestrates pool invite link sharing (Web Share API or clipboard).
 */
export function usePoolInviteShare({ inviteCode, onSuccess, disabled = false }) {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    setStatus('idle');
  }, [inviteCode]);

  const handleShareClick = useCallback(async () => {
    const url = createPoolInviteLink(inviteCode);
    const result = await shareOrCopyInviteUrl(url, {
      copyToastMessage: 'Link copied!',
    });

    if (result.ok) {
      onSuccess?.();
      setStatus(result.via === 'share' ? 'shared' : 'copied');
      window.setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('error');
      window.setTimeout(() => setStatus('idle'), 2000);
    }
  }, [inviteCode, onSuccess]);

  const label =
    status === 'shared'
      ? 'Shared!'
      : status === 'copied'
        ? 'Copied!'
        : status === 'error'
          ? 'Try again'
          : 'Invite Friends!';

  return {
    label,
    onShareClick: handleShareClick,
    disabled: disabled || !inviteCode,
    title: 'Invite friends to this pool',
  };
}
