import React, { useEffect, useState } from 'react';

import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';
import { POOL_NAME_MAX_LENGTH } from '../api/poolFirestore';

export default function EditPoolNameForm({
  initialName,
  busy,
  errorMessage,
  onSave,
  onCancel,
}) {
  const [value, setValue] = useState(initialName);

  useEffect(() => {
    setValue(initialName);
  }, [initialName]);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
      <label className="block">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Pool name
        </span>
        <Input
          className="mt-1.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={POOL_NAME_MAX_LENGTH}
          disabled={busy}
          autoFocus
        />
      </label>
      {errorMessage ? (
        <p className="text-sm font-bold text-red-400">{errorMessage}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => onSave(value)}
          disabled={busy}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
