import React from 'react';
import { Loader2, PauseCircle, PlayCircle, RefreshCcw } from 'lucide-react';
import Button from '../../../shared/ui/Button';

export default function AdminLiveSetlistAutomationControls({
  enabled,
  isToggling,
  isPolling,
  statusText,
  errorText,
  onToggle,
  onPollNow,
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500 font-bold leading-relaxed ml-1">
        Background polling checks Phish.net during show windows and updates official setlist + live
        scores only when payload changes.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant={enabled ? 'ghost' : 'secondary'}
          size="sm"
          disabled={isToggling || isPolling}
          onClick={onToggle}
          className="w-full sm:w-auto uppercase tracking-widest gap-2"
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : enabled ? (
            <PauseCircle className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <PlayCircle className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {enabled ? 'Pause automation' : 'Resume automation'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isPolling || isToggling}
          onClick={onPollNow}
          className="w-full sm:w-auto uppercase tracking-widest gap-2"
        >
          {isPolling ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <RefreshCcw className="h-4 w-4 shrink-0" aria-hidden />
          )}
          Force poll + score refresh
        </Button>
      </div>
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
