import React from 'react';
import Button from '../../../shared/ui/Button';

export default function AdminFinalizeAndSave({
  isSaving,
  onSave,
  onFinalize,
  message,
}) {
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
        <Button
          variant="danger"
          type="button"
          size="sm"
          disabled={isSaving}
          onClick={onFinalize}
          className="w-full sm:flex-1 h-12 text-center uppercase tracking-widest"
        >
          {isSaving ? 'UPDATING DB...' : 'Finalize & Rollup Points'}
        </Button>
      </div>

      {message?.text && (
        <div
          className={`text-center font-bold text-sm mt-2 uppercase tracking-widest ${
            message.type === 'error' ? 'text-red-400' : 'text-emerald-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
