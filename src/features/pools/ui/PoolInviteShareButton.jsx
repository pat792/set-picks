import React, { useState } from 'react';
import { Share } from 'lucide-react';

import { createPoolInviteLink } from '../../../shared/lib/createPoolInviteLink';
import { shareOrCopyInviteUrl } from '../../../shared/lib/shareOrCopyInviteUrl';

const ghostInviteClass =
  'inline-flex items-center gap-1.5 rounded-md px-0 py-0 text-sm font-semibold tracking-tight text-slate-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 disabled:cursor-not-allowed disabled:opacity-40';

/**
 * Ghost-style invite control: Web Share when available, else clipboard + success toast.
 */
export default function PoolInviteShareButton({
  inviteCode,
  onSuccess,
  disabled = false,
  className = '',
}) {
  const [status, setStatus] = useState('idle');

  const handleClick = async () => {
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
  };

  const label =
    status === 'shared'
      ? 'Shared!'
      : status === 'copied'
        ? 'Copied!'
        : status === 'error'
          ? 'Try again'
          : 'Invite Friends!';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || !inviteCode}
      className={`${ghostInviteClass} ${className}`.trim()}
      title="Invite friends to this pool"
    >
      <Share className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}
