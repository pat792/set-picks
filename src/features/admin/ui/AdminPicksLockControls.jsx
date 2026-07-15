import React from 'react';
import { Loader2, Lock } from 'lucide-react';
import Button from '../../../shared/ui/Button';

export default function AdminPicksLockControls({
  showStatus,
  picksAlreadyLocked,
  adminLockActive,
  isLocking,
  statusText,
  errorText,
  onLockNow,
  disabled = false,
}) {
  const canLock = showStatus === 'NEXT' && !picksAlreadyLocked && !disabled;

  let helperText =
    'Picks lock at 7:55 PM venue-local, when set 1 starts on Phish.net, or when you lock them here.';
  if (showStatus && showStatus !== 'NEXT') {
    helperText = 'Lock picks now is only available while this show is NEXT (before wall-clock lock).';
  } else if (adminLockActive) {
    helperText = 'Admin override is active — picks are locked for players on this show date.';
  } else if (showStatus === 'NEXT' && picksAlreadyLocked) {
    helperText = 'Picks are already locked for this show.';
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500 font-bold leading-relaxed ml-1">{helperText}</p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!canLock || isLocking}
        onClick={onLockNow}
        className="w-full sm:w-auto uppercase tracking-widest gap-2"
      >
        {isLocking ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Lock className="h-4 w-4 shrink-0" aria-hidden />
        )}
        Lock picks now
      </Button>
      {statusText ? (
        <p className="text-xs font-bold text-emerald-400/90 ml-1" role="status">
          {statusText}
        </p>
      ) : null}
      {errorText ? (
        <p className="text-xs font-bold text-red-400 ml-1" role="alert">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}
