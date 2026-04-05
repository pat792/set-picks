import React from 'react';
import { AlertCircle, Lock, PencilLine } from 'lucide-react';

import Button from '../../../shared/ui/Button';

const SUCCESS_ICONS = {
  locked: Lock,
  updated: PencilLine,
};

export default function PicksSubmitButton({
  isSaving,
  isLocked,
  hasExistingPicks,
  saveFeedback,
}) {
  const submitDisabled = isSaving || isLocked;

  let label = 'Lock In Picks';
  if (isLocked) label = 'PICKS LOCKED';
  else if (isSaving) label = 'Saving...';
  else if (hasExistingPicks) label = 'UPDATE PICKS';

  const tone = saveFeedback?.tone;
  const SuccessIcon =
    tone === 'success' && saveFeedback.variant
      ? SUCCESS_ICONS[saveFeedback.variant]
      : null;

  return (
    <>
      <div className="pt-4">
        <Button
          variant="primary"
          type="submit"
          disabled={submitDisabled}
          className="w-full text-lg py-4 rounded-xl uppercase tracking-widest bg-emerald-500 hover:bg-emerald-400 shadow-lg hover:shadow-emerald-500/20"
        >
          {label}
        </Button>
      </div>

      {saveFeedback ? (
        <div
          className={`mt-4 flex items-center justify-center gap-2 text-center text-sm font-bold ${
            tone === 'error' ? 'text-red-400' : 'text-emerald-400'
          }`}
          role="status"
        >
          {tone === 'error' ? (
            <AlertCircle
              className="h-5 w-5 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
          ) : SuccessIcon ? (
            <SuccessIcon
              className="h-5 w-5 shrink-0"
              strokeWidth={2}
              aria-hidden
            />
          ) : null}
          <span>{saveFeedback.text}</span>
        </div>
      ) : null}
    </>
  );
}
