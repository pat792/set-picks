import React from 'react';
import { Lock } from 'lucide-react';
import Button from '../../../shared/ui/Button';

const LOCK_SUCCESS_PREFIX = 'OFFICIAL SETLIST LOCKED';

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
