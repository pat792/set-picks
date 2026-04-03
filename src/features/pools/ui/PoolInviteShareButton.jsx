import React from 'react';

import { usePoolInviteShare } from '../model/usePoolInviteShare';
import { PoolInviteShareButtonView } from './PoolInviteShareButtonView';

/**
 * Pool invite share control: composes {@link usePoolInviteShare} with {@link PoolInviteShareButtonView}.
 */
export default function PoolInviteShareButton({
  inviteCode,
  onSuccess,
  disabled = false,
  className = '',
}) {
  const share = usePoolInviteShare({ inviteCode, onSuccess, disabled });

  return (
    <PoolInviteShareButtonView
      label={share.label}
      onShareClick={share.onShareClick}
      disabled={share.disabled}
      title={share.title}
      className={className}
    />
  );
}
