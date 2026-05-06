import React from 'react';
import { Lock } from 'lucide-react';
import Button from '../../../shared/ui/Button';

const LOCK_SUCCESS_PREFIX = 'OFFICIAL SETLIST LOCKED';

export default function AdminFinalizeAndSave({
  isSaving,
  onSave,
  onFinalize,
  /** When false, primary finalize is disabled (show not PAST / no auto-finalize yet). */
  finalizeAllowedWithoutForce = true,
  finalizeTimingTooltip = '',
  onFinalizeEarlyOverride,
  message,
}) {
  const finalizePrimaryDisabled = isSaving || !finalizeAllowedWithoutForce;
  const finalizePrimaryTitle =
    finalizePrimaryDisabled && !isSaving && finalizeTimingTooltip
      ? finalizeTimingTooltip
      : undefined;

  return (
    <div className="pt-2 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="primary"
          type="button"
          size="sm"
          disabled={isSaving}
          onClick={onSave}
          className="w-full sm:flex-1 h-12 text-center uppercase tracking-widest"
        >
          {isSaving ? 'UPDATING DB...' : 'Save Official Setlist'}
        </Button>
        <span className="w-full sm:flex-1 sm:flex sm:flex-col sm:min-w-0">
          <Button
            variant="danger"
            type="button"
            size="sm"
            disabled={finalizePrimaryDisabled}
            title={finalizePrimaryTitle}
            onClick={onFinalize}
            className="w-full h-12 text-center uppercase tracking-widest"
          >
            {isSaving ? 'UPDATING DB...' : 'Finalize & Rollup Points'}
          </Button>
          {!finalizeAllowedWithoutForce && !isSaving && typeof onFinalizeEarlyOverride === 'function' ? (
            <button
              type="button"
              onClick={onFinalizeEarlyOverride}
              className="mt-2 w-full text-center text-xs font-bold uppercase tracking-widest text-amber-300/90 hover:text-amber-200 underline underline-offset-2"
            >
              Finalize early (admin override)…
            </button>
          ) : null}
        </span>
      </div>

      {message?.text && (
        <div
          className={`mt-2 flex items-center justify-center gap-2 text-center text-sm font-bold uppercase tracking-widest ${
            message.type === 'error' ? 'text-red-400' : 'text-brand-primary'
          }`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.type === 'success' &&
            message.text.startsWith(LOCK_SUCCESS_PREFIX) && (
              <Lock className="h-5 w-5 shrink-0" aria-hidden />
            )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
