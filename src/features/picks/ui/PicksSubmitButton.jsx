import React from 'react';

import Button from '../../../shared/ui/Button';

export default function PicksSubmitButton({
  isSaving,
  isLocked,
  hasExistingPicks,
  saveMessage,
}) {
  const submitDisabled = isSaving || isLocked;

  let label = 'Lock In Picks';
  if (isLocked) label = 'PICKS LOCKED';
  else if (isSaving) label = 'Saving...';
  else if (hasExistingPicks) label = 'UPDATE PICKS';

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

      {saveMessage ? (
        <div
          className={`text-center font-bold text-sm mt-4 ${
            saveMessage.includes('Error') ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {saveMessage}
        </div>
      ) : null}
    </>
  );
}
